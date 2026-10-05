(function(root){
 'use strict';
 function pct(v){if(!Number.isFinite(v)||v < 0||v > 100)throw new Error('Discount must be between 0 and 100.');return 1-v/100;}
 function activityKey(r){return [r.sector,r.benefit,r.use].join('|');}
 function activityRows(data){const schedules=new Map(data.feeSchedules.map(r=>[activityKey(r),r])),seen=new Set(data.records.map(activityKey));return [...data.records.map(r=>({...r,activitySf:schedules.get(activityKey(r))?.activitySf??0})),...data.feeSchedules.filter(r=>!seen.has(activityKey(r))).map(r=>({...r,sourceRow:null,phase1:0,phase2:0,current:0,saved:0}))];}
 function calculate(data,state){
  if(state.phase!=='phase2')throw new Error('Invalid fee phase');
  if(![0,2.5].includes(state.baselineCpi))throw new Error('Invalid baseline');
  if(state.activity!==undefined){if(!state.activity||typeof state.activity!=='object'||Array.isArray(state.activity))throw Error('Invalid activity assumptions');for(const [key,value] of Object.entries(state.activity))if(!Object.hasOwn(data.defaults.activity,key)||!Number.isFinite(value)||value<0)throw Error('Activity must be a nonnegative square-foot value for a known location.');}
  return activityRows(data).map(r=>{const multiplier=pct(state.globalDiscount)*pct(state.sector[r.sector])*pct(state.benefit[r.benefit])*pct(state.use[r.use]);let supportable=r[state.phase],current=r.current,modeledSf=0,modeledUnits=0;if(r.phase2Rate!==null){modeledSf=state.activity?.[activityKey(r)]??r.activitySf;modeledUnits=r.residential?modeledSf/r.sampleSf:modeledSf;if(r.activitySf>0){const scale=modeledSf/r.activitySf;supportable*=scale;current*=scale;}else{supportable=modeledUnits*(r.residential?r.phase2Rate:r.phase2Rate/1000);current=modeledSf*r.baselinePerSf;}}current*=1+state.baselineCpi/100;const proposed=supportable*multiplier;return {...r,supportable,current,proposed,multiplier,modeledSf,modeledUnits,baseModeledSf:r.activitySf,delta:proposed-current};});
 }
 function phaseIn(current,proposed,startYear=2027,endYear=2037,annualIncrease=.15){
  if(!Number.isFinite(current)||!Number.isFinite(proposed)||current<0||proposed<0||!Number.isInteger(startYear)||!Number.isInteger(endYear)||endYear<startYear||!Number.isFinite(annualIncrease)||annualIncrease<=0)throw Error('Invalid phase-in assumptions');
  const tolerance=1e-12*Math.max(1,current,proposed),kind=proposed>current+tolerance?'increase':proposed<current-tolerance?'decrease':'same',steps=kind==='increase'?(current>0?Math.max(1,Math.ceil(Math.log(proposed/current)/Math.log1p(annualIncrease)-1e-12)):null):0,reachedYear=kind==='increase'?(steps===null?null:startYear+steps):kind==='decrease'?startYear+1:startYear;
  const schedule=Array.from({length:endYear-startYear+1},(_,step)=>{const year=startYear+step;let value=current;if(step>0){if(kind==='decrease')value=proposed;else if(kind==='increase')value=reachedYear!==null&&year>=reachedYear?proposed:Math.min(proposed,current*Math.pow(1+annualIncrease,step));}return {year,value,atTarget:reachedYear!==null&&year>=reachedYear};});
  return {current,proposed,kind,steps,reachedYear,annualIncrease,startYear,endYear,schedule};
 }
 function total(rows){return rows.reduce((a,r)=>({current:a.current+r.current,supportable:a.supportable+r.supportable,proposed:a.proposed+r.proposed,delta:a.delta+r.delta}),{current:0,supportable:0,proposed:0,delta:0});}
 function groups(rows,key){const map=new Map();for(const r of rows){if(!map.has(r[key]))map.set(r[key],[]);map.get(r[key]).push(r);}return Array.from(map,([name,rr])=>({name,...total(rr)}));}
 const api={calculate,total,groups,activityKey,phaseIn};if(typeof module!=='undefined')module.exports=api;root.ImpactModel=api;
})(typeof window!=='undefined'?window:globalThis);
(function(root){
 function feeCost(record,state,sqft,units=1){
  if(!Number.isFinite(sqft)||sqft<=0||!Number.isFinite(units)||units<=0)throw Error('Project size and units must be positive.');
  if(record.phase2Rate===null||record.baselinePerSf===null)return null;
  const multiplier=[state.globalDiscount,state.sector[record.sector],state.benefit[record.benefit],state.use[record.use]].reduce((v,d)=>v*(1-d/100),1);
  const baselinePerSf=record.baselinePerSf*(1+state.baselineCpi/100),base=record[state.phase==='phase1'?'phase1Rate':'phase2Rate'];
  const proposedPerUnit=record.residential?base*multiplier:null;
  const proposedPerSf=record.residential?proposedPerUnit/sqft:base/1000*multiplier;
  const area=sqft*(record.residential?units:1),current=baselinePerSf*area,proposed=proposedPerSf*area;
  return {supportablePerSf:record.residential?base/sqft:base/1000,supportablePerUnit:record.residential?base:null,baselinePerSf,proposedPerSf,proposedPerUnit,deltaPerSf:proposedPerSf-baselinePerSf,current,proposed,delta:proposed-current,multiplier};
 }
 root.ImpactModel.feeCost=feeCost;
})(typeof window!=='undefined'?window:globalThis);
