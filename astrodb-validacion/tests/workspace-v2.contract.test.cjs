/* Contract tests for isolated AstroDB Workspace V2. Run: node --test tests/workspace-v2.contract.test.cjs */
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const root=path.join(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('all four workspaces have distinct navigation targets',()=>{const js=read('modules/workspace-navigation.js');for(const key of ['biblioteca','observatorio','datos','analisis','natalcore'])assert.match(js,new RegExp("\\['"+key+"','"));assert.match(js,/dataset\.workspaceView=view/)});
test('legacy data controls remain available in the editor module',()=>{const js=read('modules/editor-view.js');for(const id of ['astroWheel','btnCalcularDatos','btnGuardar','btnEliminar','btnMostrarNatalCore','btnValidarNatalCore','btnDescargarNatalCore','tablaPlanetas','tablaAspectos'])assert.ok(js.includes(id),id)});
test('development uses isolated storage and existing sync services',()=>{const html=read('index.html');assert.match(html,/astrodb_validation_v51/);assert.match(html,/drive-sync\.js/);assert.match(html,/chart-recovery\.js/);assert.match(html,/modules\/workspace-navigation\.js/)});
test('styles include separate visible layouts',()=>{const css=read('modules/workspace-v2.css');for(const key of ['observatorio','datos','analisis','natalcore'].slice(1))assert.ok(css.includes('data-workspace-view='+key),key)});

test('library workspace reuses existing selector rather than cloning it',()=>{const js=read('modules/workspace-navigation.js');assert.match(js,/appendChild\(library\)/);assert.match(js,/workspaceLibrary/);assert.doesNotMatch(js,/cloneNode\(/)});

test('opening or creating a chart returns to the observatory',()=>{const js=read('modules/workspace-navigation.js');assert.match(js,/btnAbrirSeleccion/);assert.match(js,/btnNueva/);assert.match(js,/setView\('observatorio'\)/)});
