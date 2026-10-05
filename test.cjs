const assert=require('node:assert/strict'),fs=require('node:fs'),M=require('./model.js'),D=JSON.parse(fs.readFileSync(__dirname+'/data.json'));
const clone=x=>JSON.parse(JSON.stringify(x)),near=(a,b)=>assert.ok(Math.abs(a-b)<.0001,`${a} != ${b}`);
const s=clone(D.defaults),r=M.calculate(D,s),t=M.total(r);
assert.equal(r.length,244);near(t.current,D.expected.current);near(t.supportable,D.expected.phase2);near(t.proposed,D.expected.saved);r.slice(0,D.records.length).forEach((row,i)=>{const source=D.records[i];near(source.originalPhase2*.3,source.saved);if(source.phase2Rate!==null){near(source.phase2,source.originalPhase2/source.originalPhase2Rate*source.phase2Rate);near(row.proposed,source.phase2*.3);}});near(D.records.reduce((sum,r)=>sum+r.originalPhase2,0),D.originalExpected.phase2);
for(const key of ['sector','benefit','use'])near(M.groups(r,key).reduce((a,g)=>a+g.proposed,0),t.proposed);
s.globalDiscount=100;near(M.total(M.calculate(D,s)).proposed,0);
s.globalDiscount=-1;assert.throws(()=>M.calculate(D,s));
s.globalDiscount=10;s.sector.Core=20;s.benefit.Core=30;s.use['Customer-Oriented High']=40;near(M.calculate(D,s)[0].proposed,D.records[0].phase2*.9*.8*.7*.6);
s.baselineCpi=2.5;near(M.total(M.calculate(D,s)).current,t.current*1.025);
s.phase='phase1';assert.throws(()=>M.calculate(D,s));s.phase='phase2';
s.globalDiscount=101;assert.throws(()=>M.calculate(D,s));s.globalDiscount=NaN;assert.throws(()=>M.calculate(D,s));
console.log('PASS: 205 source rows, totals, grouping, discount compounding, boundaries, CPI, new handout repricing and preserved original reconciliation.');

const feeState=clone(D.defaults);
const coreRetail=D.records.find(r=>r.sector==='Core'&&r.use==='Customer-Oriented High');
const f=M.feeCost(coreRetail,feeState,10000);near(f.supportablePerSf,7.563);near(f.baselinePerSf,2.19);near(f.proposedPerSf,2.2689);near(f.delta,789);
const housing=D.records.find(r=>r.sector==='Core'&&r.use==='Residential (per housing unit) - 1,000 to 1,499');
const h=M.feeCost(housing,feeState,1250,10);near(h.proposedPerUnit,315);near(h.proposedPerSf,.252);near(h.current,4000);near(h.proposed,3150);near(h.delta,-850);
feeState.use[coreRetail.use]=100;near(M.feeCost(coreRetail,feeState,10000).proposed,0);
assert.equal(M.feeCost(D.records.find(r=>r.use==='Non-Building'),feeState,10000),null);
console.log('PASS: nominal maximum rates, discounted $/sq ft, residential per-unit conversion, project cash changes and missing-rate handling.');

for(const r of D.records.filter(r=>r.phase2Rate!==null)){const cat=r.residential?'Residential':['Industrial','Warehouse/Distribution'].includes(r.use)?'Industrial':['Office','Institutional','Lodging'].includes(r.use)?'Office':{'Customer-Oriented Low':'Customer Low','Customer-Oriented Moderate':'Customer Moderate','Customer-Oriented High':'Customer High'}[r.use];near(r.baselinePerSf,D.currentFeeSchedule[r.benefit][cat]);}
near(D.currentFeeSchedule.Infill.Industrial,.4);near(D.currentFeeSchedule.Infill['Customer Moderate'],1.45);near(D.currentFeeSchedule.Infill.Office,1.17);
console.log('PASS: nominal current-rate mappings agree with the complete baseline fee schedule; original aggregate revenue controls still reconcile.');

assert.equal(D.feeSchedules.length,208);
const unique=new Set(D.feeSchedules.map(r=>[r.sector,r.benefit,r.use].join('|')));assert.equal(unique.size,208);
for(const sector of Object.keys(D.defaults.sector)){
 const schedule=D.feeSchedules.filter(r=>r.sector===sector);assert.equal(schedule.length,sector==='Core'?16:48);
 for(const row of schedule){assert.ok(row.phase2Rate>0);assert.ok(row.maxSourceCell.startsWith('Fees!'));assert.equal(row.residential,Boolean(row.sampleSf));const f=M.feeCost(row,D.defaults,row.sampleSf||1000);near(row.residential?f.proposedPerUnit:f.proposedPerSf,(row.residential?row.phase2Rate:row.phase2Rate/1000)*.3);}
}
const ne=D.feeSchedules.find(r=>r.sector==='Northeast'&&r.benefit==='Infill'&&r.use==='Customer-Oriented High');near(ne.phase2Rate/1000,19.289);assert.equal(ne.maxRateBasis,'average across four sectors');
const neHousing=D.feeSchedules.find(r=>r.sector==='Northeast'&&r.benefit==='Infill'&&r.use==='Residential (per housing unit) - Under 1,000');near(neHousing.phase2Rate,1993);assert.equal(neHousing.maxRateBasis,'sector-specific');
for(const row of D.feeSchedules.filter(r=>r.use.endsWith('4,000+')))assert.equal(row.sampleSf,4250);
console.log('PASS: all 208 schedule entries, complete sectors and benefits, rate provenance, residential sizes and live fee calculations.');

assert.equal(Object.keys(D.defaults.activity).length,208);
for(const row of D.feeSchedules)near(D.defaults.activity[M.activityKey(row)],row.activitySf);
const activityState=clone(D.defaults),activityRow=r.find(row=>row.sector==='Core'&&row.use==='Customer-Oriented High'),activityKey=M.activityKey(activityRow);
activityState.activity[activityKey]*=2;let updated=M.calculate(D,activityState).find(row=>M.activityKey(row)===activityKey);near(updated.current,activityRow.current*2);near(updated.proposed,activityRow.proposed*2);near(updated.modeledSf,activityRow.modeledSf*2);
activityState.activity[activityKey]=0;updated=M.calculate(D,activityState).find(row=>M.activityKey(row)===activityKey);near(updated.current,0);near(updated.proposed,0);
for(const bad of [-1,Infinity,NaN]){activityState.activity[activityKey]=bad;assert.throws(()=>M.calculate(D,activityState));}
activityState.activity[activityKey]=D.defaults.activity[activityKey];activityState.activity['unknown']=1;assert.throws(()=>M.calculate(D,activityState));delete activityState.activity.unknown;
const newRow=r.find(row=>row.sourceRow===null&&!row.residential),newKey=M.activityKey(newRow);assert.equal(newRow.modeledSf,0);activityState.activity[newKey]=10000;updated=M.calculate(D,activityState).find(row=>M.activityKey(row)===newKey);near(updated.proposed,10000*newRow.phase2Rate/1000*.3);near(updated.current,10000*newRow.baselinePerSf);
const zeroRow=r.find(row=>row.phase2Rate!==null&&row.activitySf===0&&row.sourceRow!==null),zeroKey=M.activityKey(zeroRow);activityState.activity[zeroKey]=10000;updated=M.calculate(D,activityState).find(row=>M.activityKey(row)===zeroKey);near(updated.proposed,10000*zeroRow.phase2Rate/1000*.3);
const resNew=r.find(row=>row.sourceRow===null&&row.residential),resKey=M.activityKey(resNew);activityState.activity[resKey]=resNew.sampleSf*10;updated=M.calculate(D,activityState).find(row=>M.activityKey(row)===resKey);near(updated.modeledUnits,10);near(updated.proposed,resNew.phase2Rate*10*.3);near(updated.current,resNew.baselinePerSf*resNew.sampleSf*10);
const noActivityState=clone(D.defaults);delete noActivityState.activity;near(M.total(M.calculate(D,noActivityState)).proposed,D.expected.saved);
const zeroActivityState=clone(D.defaults);for(const key of Object.keys(zeroActivityState.activity))zeroActivityState.activity[key]=0;const zeroTotals=M.total(M.calculate(D,zeroActivityState));near(zeroTotals.current,0);near(zeroTotals.proposed,0);
console.log('PASS: 208 editable activity assumptions, preserved default totals, historical scaling, residential dwelling conversion, newly added activity in missing and zero-history combinations, validation and legacy defaults.');

let path=M.phaseIn(100,130);assert.equal(path.steps,2);assert.equal(path.reachedYear,2029);near(path.schedule[0].value,100);near(path.schedule[1].value,115);near(path.schedule[2].value,130);near(path.schedule[10].value,130);assert.equal(path.schedule.length,11);assert.equal(path.schedule[0].year,2027);assert.equal(path.schedule[10].year,2037);
path=M.phaseIn(2.51,5.7867);assert.equal(path.steps,6);assert.equal(path.reachedYear,2033);near(path.schedule[5].value,2.51*Math.pow(1.15,5));near(path.schedule[6].value,5.7867);assert.ok(path.schedule.every(s=>s.value<=5.7867));
path=M.phaseIn(400,315);assert.equal(path.steps,0);assert.equal(path.reachedYear,2028);near(path.schedule[0].value,400);near(path.schedule[1].value,315);near(path.schedule[10].value,315);
path=M.phaseIn(100,0);near(path.schedule[0].value,100);near(path.schedule[1].value,0);assert.equal(path.steps,0);
path=M.phaseIn(100,100);assert.equal(path.kind,'same');assert.equal(path.steps,0);assert.equal(path.reachedYear,2027);assert.ok(path.schedule.every(s=>s.value===100));path=M.phaseIn(2.19,2.19327);assert.equal(path.steps,1);assert.equal(path.reachedYear,2028);near(path.schedule[1].value,2.19327);path=M.phaseIn(1.24,1.2408);assert.equal(path.steps,1);
for(const n of [1,3,6,10,15]){path=M.phaseIn(100,100*Math.pow(1.15,n));assert.equal(path.steps,n);assert.equal(path.reachedYear,2027+n);}
path=M.phaseIn(2.51,19.289);assert.equal(path.steps,15);assert.equal(path.reachedYear,2042);assert.equal(path.schedule[10].atTarget,false);near(path.schedule[10].value,2.51*Math.pow(1.15,10));
path=M.phaseIn(0,100);assert.equal(path.steps,null);assert.equal(path.reachedYear,null);assert.ok(path.schedule.every(s=>s.value===0));
for(const pair of [[-1,10],[10,-1],[NaN,10],[10,Infinity]])assert.throws(()=>M.phaseIn(...pair));assert.throws(()=>M.phaseIn(10,20,2037,2027));
console.log('PASS: 15% compounded phase-in, 2027 baseline, final-step cap, fixed targets without inflation, decreases, unchanged rates, sub-cent increases, exact growth boundaries, targets beyond 2037 and validation.');
