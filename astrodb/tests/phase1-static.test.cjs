// Run: node astrodb/tests/phase1-static.test.cjs
// Static regression gates; browser and authenticated integration tests are still required.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
const checks=[
  ['one Supabase writer',(html.match(/async function guardarFichaSupabase\(/g)||[]).length===1],
  ['stable chart ID',html.includes('function nuevoIdFicha()')],
  ['missing ephemeris remains null',html.includes("const finite=v=>v==null||v===''?null:")],
  ['snapshot captured on save',(html.match(/sincronizarFichaActivaSupabase\(capturarFichaParaSincronizacion\(f\)\)/g)||[]).length===2],
  ['snapshot stored in NatalCore',html.includes('natalcore: ficha.natalcoreSnapshot || {}')],
  ['snapshot excluded from input',html.includes("key!=='natalcoreSnapshot'")],
  ['remote status element',html.includes("status.id='estadoGuardadoAstroDB'")],
  ['request ordering protection',html.includes('solicitud!==ultimaSolicitudGuardadoAstroDB')],
  ['manual Drive correctly labelled',html.includes('Drive: exportación manual')],
  ['JSON export',html.includes('descargarJSONCodigoSemilla(paquete,')],
  ['bundle validator',html.includes('function comprobarPaqueteCodigoSemilla(paquete)')],
  ['bundle identity check',html.includes("paquete.natalcore.meta.subject_id==='astrodb:'+paquete.chart_id")],
  ['Drive export folder',html.includes('1YpEhREFIDxwwR9bwZq316QwO5LJtBXy5')],
  ['balanced script tags',(html.match(/<script\b/g)||[]).length===(html.match(/<\/script>/g)||[]).length]
];
for(const [label,pass] of checks){console.log((pass?'PASS':'FAIL')+' '+label);assert.ok(pass,label);}
console.log(checks.length+' static gates passed; not a browser/runtime validation.');
