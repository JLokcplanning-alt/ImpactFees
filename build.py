from pathlib import Path
import json,os,re,subprocess,tempfile
p=Path(__file__).resolve().parent
# Capture initial outputs from the actual app so previews also have visible values
# before browser JavaScript executes. Live inputs still use the bundled app.
with tempfile.TemporaryDirectory(prefix='impact-fee-build-') as task_temp:
 snapshot=Path(task_temp)/'initial.json'
 env=dict(os.environ,IMPACT_SNAPSHOT_PATH=str(snapshot))
 subprocess.run(['node',str(p/'ui-smoke.cjs')],env=env,check=True)
 initial=json.loads(snapshot.read_text())
body=(p/'body.html').read_text()
for table_id,key,table_class in [('fee-schedule','table','fee-schedule'),('residential-fee-schedule','residentialTable','fee-schedule'),('activity-nonresidential','activityNonres','activity-table'),('activity-residential','activityRes','activity-table'),('revenue-nonresidential','revenueNonres','revenue-table'),('revenue-residential','revenueRes','revenue-table'),('phase-nonresidential','phaseNonres','phase-table'),('phase-residential','phaseRes','phase-table')]:
 body=body.replace(f'<table id="{table_id}" class="{table_class}"></table>',f'<table id="{table_id}" class="{table_class}">'+initial[key]+'</table>')
for element_id,key in [('city-revenue-chart','cityChart'),('benefit-revenue-charts','benefitCharts'),('revenue-chart-legend','chartLegend')]:
 body=re.sub(r'(<div id="'+element_id+r'"[^>]*>)(</div>)',lambda m:m[1]+initial[key]+m[2],body)
body=body.replace('<tbody id="benefit-revenue-summary"></tbody>','<tbody id="benefit-revenue-summary">'+initial['benefitSummary']+'</tbody>')
for key,value in [('current',initial['current']),('proposed',initial['proposed']),('delta',initial['delta'])]:
 body=body.replace(f'<strong id="{key}"></strong>',f'<strong id="{key}">{value}</strong>')
body=body.replace('<strong id="delta">','<strong id="delta" class="'+initial['deltaClass']+'">')
html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Modeled Impact Fee Revenue</title><style>'+ (p/'style.css').read_text()+'</style></head><body>'+body+'<script>const IMPACT_DATA='+(p/'data.json').read_text()+';</script><script>'+(p/'model.js').read_text()+'</script><script>'+(p/'app.js').read_text()+'</script></body></html>'
(p/'index.html').write_text(html)
print('Built standalone index.html with initial current | proposed cells')
