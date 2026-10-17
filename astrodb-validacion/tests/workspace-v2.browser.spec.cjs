const {test,expect}=require('@playwright/test');
const path=require('node:path');
const app='file://'+path.resolve(__dirname,'../index.html');
test('five workspaces remain navigable with no duplicated controls',async({page})=>{
 await page.goto(app);await expect(page.locator('.workspaceV2Nav button')).toHaveCount(5);
 await page.getByRole('button',{name:'Biblioteca',exact:true}).click();
 await expect(page.locator('#workspaceLibrary')).toBeVisible();
 await expect(page.locator('#selectorCartas')).toHaveCount(1);
 await expect(page.locator('#editor')).toHaveClass(/workspaceLibraryInactive/);
 await page.getByRole('button',{name:'Observatorio',exact:true}).click();
 await expect(page.locator('#workspaceLibrary')).toBeHidden();
 await expect(page.locator('#editor')).toHaveAttribute('data-workspace-view','observatorio');
 await page.getByRole('button',{name:'Datos natales',exact:true}).click();
 await expect(page.locator('#editor')).toHaveAttribute('data-workspace-view','datos');
 await page.getByRole('button',{name:'Análisis',exact:true}).click();
 await expect(page.locator('#editor')).toHaveAttribute('data-workspace-view','analisis');
 await page.getByRole('button',{name:'NatalCore',exact:true}).click();
 await expect(page.locator('#editor')).toHaveAttribute('data-workspace-view','natalcore');
});
test('library navigation works on a narrow mobile viewport',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto(app);
 await page.getByRole('button',{name:'Biblioteca',exact:true}).click();
 await expect(page.locator('#workspaceLibrary')).toBeVisible();
 await expect(page.locator('#selectorCartas')).toHaveCount(1);
});

test('new chart opens its natal editor and retains calculation controls',async({page})=>{
 await page.goto(app);
 await page.getByRole('button',{name:'Biblioteca',exact:true}).click();
 await page.locator('#btnNueva').click();
 await expect(page.locator('#editor')).toHaveAttribute('data-workspace-view','observatorio');
 await expect(page.locator('#astroWheel')).toHaveCount(1);
 await page.getByRole('button',{name:'Datos natales',exact:true}).click();
 await expect(page.locator('#btnCalcularDatos')).toBeVisible();
 await expect(page.locator('#nombre')).toBeVisible();
});

test('save and reopen a draft chart locally without remote credentials',async({page})=>{
 await page.goto(app);
 await page.locator('#btnNueva').click();
 await page.getByRole('button',{name:'Datos natales',exact:true}).click();
 const name='Workspace smoke '+Date.now();
 await page.locator('#nombre').fill(name);
 await page.locator('#dia').fill('15');await page.locator('#mes').fill('6');await page.locator('#anio').fill('1992');
 await page.locator('#hora').fill('12:30');
 await page.locator('#btnGuardar').click();
 await expect.poll(async()=>page.evaluate(()=>{const d=JSON.parse(localStorage.getItem('astrodb_validation_v51')||'[]');return d.length})).toBeGreaterThan(0);
 await page.reload();
 await page.getByRole('button',{name:'Biblioteca',exact:true}).click();
 await expect(page.locator('#lista')).toContainText(name);
 await page.locator('#lista .listItem').filter({hasText:name}).click();
 await expect(page.locator('#editor')).toHaveAttribute('data-workspace-view','observatorio');
 await expect(page.locator('#nombre')).toHaveValue(name);
});

test('capture Observatory and Library mobile screenshots',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto(app);
 await page.locator('#btnNueva').click();
 await page.screenshot({path:'test-artifacts/astrodb-observatorio-mobile.png',fullPage:true});
 await page.getByRole('button',{name:'Biblioteca',exact:true}).click();
 await page.screenshot({path:'test-artifacts/astrodb-biblioteca-mobile.png',fullPage:true});
});

test('NatalCore refuses to invent a structural snapshot for an uncalculated draft',async({page})=>{
 await page.goto(app);await page.locator('#btnNueva').click();
 await page.getByRole('button',{name:'NatalCore',exact:true}).click();
 await page.locator('#btnValidarNatalCore').click();
 await expect(page.locator('#estadoNatalCore')).toContainText('No hay una carta activa');
});

test('saving an existing draft updates the same record rather than duplicating it',async({page})=>{
 await page.goto(app);await page.locator('#btnNueva').click();
 await page.getByRole('button',{name:'Datos natales',exact:true}).click();
 const name='Stable identity '+Date.now();await page.locator('#nombre').fill(name);
 await page.locator('#btnGuardar').click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('astrodb_validation_v51')||'[]').length)).toBe(1);
 const first=await page.evaluate(()=>JSON.parse(localStorage.getItem('astrodb_validation_v51'))[0].id);
 await page.locator('#nombre').fill(name+' updated');await page.locator('#btnGuardar').click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('astrodb_validation_v51'))[0].nombre)).toBe(name+' updated');
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('astrodb_validation_v51')));
 expect(after).toHaveLength(1);expect(after[0].id).toBe(first);
});

test('birth-data calculator reports missing coordinates instead of fabricating a chart',async({page})=>{
 await page.goto(app);await page.locator('#btnNueva').click();
 await page.getByRole('button',{name:'Datos natales',exact:true}).click();
 await page.locator('#dia').fill('12');await page.locator('#mes').fill('5');await page.locator('#anio').fill('1990');
 await page.locator('#hora').fill('10:30');await page.locator('#btnCalcularDatos').click();
 await expect(page.locator('#estadoCalculo')).toContainText('Faltan coordenadas');
 await expect(page.locator('#infoCarta')).toContainText('Calcula la carta');
 await expect(page.evaluate(()=>window.cartaActual.planetas.length)).resolves.toBe(0);
});


test('real ephemeris calculation creates consistent houses and NatalCore',async({page})=>{
 test.setTimeout(90000);
 await page.goto(app);await page.locator('#btnNueva').click();
 await page.getByRole('button',{name:'Datos natales',exact:true}).click();
 await page.locator('#nombre').fill('E2E Swiss Ephemeris verification');
 await page.locator('#dia').fill('15');await page.locator('#mes').fill('6');await page.locator('#anio').fill('1992');
 await page.locator('#hora').fill('12:30');
 // Coordinates and timezone are intentionally hidden inputs populated by city selection.
 await page.locator('#lat').evaluate(el=>{el.value='41.3874';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#lon').evaluate(el=>{el.value='2.1686';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#tz').evaluate(el=>{el.value='Europe/Madrid';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#btnCalcularDatos').click();
 await expect(page.locator('#estadoCalculo')).not.toContainText('Faltan coordenadas');
 await expect.poll(async()=>page.evaluate(()=>({planets:window.cartaActual?.planetas?.length||0,houses:window.cartaActual?.casas?.length||0})),{timeout:60000}).toMatchObject({houses:12});
 const carta=await page.evaluate(()=>window.cartaActual);
 expect(carta.planetas.length).toBeGreaterThanOrEqual(8);
 for(const p of carta.planetas)expect(Number.isFinite(Number(p.longitude))).toBe(true);
 await page.getByRole('button',{name:'NatalCore',exact:true}).click();
 await page.locator('#btnValidarNatalCore').click();
 await expect(page.locator('#estadoNatalCore .ok')).toHaveText('NatalCore válido.');
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#btnDescargarNatalCore').click()]);
 expect(download.suggestedFilename()).toMatch(/^natalcore_.*[.]json$/);
 const fs=require('node:fs');const exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
 expect(exported.validation.valid).toBe(true);
 expect(exported.points.length).toBeGreaterThanOrEqual(8);
 expect(exported.houses).toHaveLength(12);
});


test('selecting a saved chart opens its original record without duplication',async({page})=>{
 await page.goto(app);await page.locator('#btnNueva').click();
 await page.getByRole('button',{name:'Datos natales',exact:true}).click();
 const name='Selector regression '+Date.now();await page.locator('#nombre').fill(name);
 await page.locator('#btnGuardar').click();
 const id=await page.evaluate(()=>JSON.parse(localStorage.getItem('astrodb_validation_v51'))[0].id);
 await page.getByRole('button',{name:'Biblioteca',exact:true}).click();
 await page.locator('#selectorCartas').selectOption(String(id));
 await expect(page.locator('#editor')).toHaveAttribute('data-workspace-view','observatorio');
 await expect(page.locator('#nombre')).toHaveValue(name);
 const all=await page.evaluate(()=>JSON.parse(localStorage.getItem('astrodb_validation_v51')));
 expect(all).toHaveLength(1);expect(String(all[0].id)).toBe(String(id));
});


test('an unauthenticated save never reports remote copies as completed',async({page})=>{
 await page.goto(app);await page.locator('#btnNueva').click();
 await page.getByRole('button',{name:'Datos natales',exact:true}).click();
 await page.locator('#nombre').fill('Offline guard '+Date.now());
 await page.locator('#btnGuardar').click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('astrodb_validation_v51')||'[]').length)).toBe(1);
 await expect(page.locator('#astrodbAuthEstado')).toContainText('Sin sesión');
 const state=await page.evaluate(()=>({user:typeof astrodbUser!=='undefined'&&astrodbUser!==null,drive:typeof astrodbDrive!=='undefined'&&astrodbDrive?.state()?.connected===true}));
 expect(state.user).toBe(false);
 expect(state.drive).toBe(false);
});


test('calculated natal chart survives local save, reload and NatalCore revalidation',async({page})=>{
 test.setTimeout(90000);
 await page.goto(app);await page.locator('#btnNueva').click();
 await page.getByRole('button',{name:'Datos natales',exact:true}).click();
 const name='E2E persisted calculation '+Date.now();
 await page.locator('#nombre').fill(name);
 await page.locator('#dia').fill('15');await page.locator('#mes').fill('6');await page.locator('#anio').fill('1992');
 await page.locator('#hora').fill('12:30');
 for(const [id,value] of [['lat','41.3874'],['lon','2.1686'],['tz','Europe/Madrid']]){
  await page.locator('#'+id).evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},value);
 }
 await page.locator('#btnCalcularDatos').click();
 await expect.poll(()=>page.evaluate(()=>window.cartaActual?.casas?.length||0),{timeout:60000}).toBe(12);
 const initial=await page.evaluate(()=>window.cartaActual.planetas.map(p=>({name:p.nombre,longitude:p.longitude})));
 await page.locator('#btnGuardar').click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('astrodb_validation_v51')||'[]').length)).toBe(1);
 await page.reload();await page.getByRole('button',{name:'Biblioteca',exact:true}).click();
 await page.locator('#lista .listItem').filter({hasText:name}).click();
 const restored=await page.evaluate(()=>window.cartaActual);
 expect(restored.casas).toHaveLength(12);
 expect(restored.planetas.map(p=>({name:p.nombre,longitude:p.longitude}))).toEqual(initial);
 await page.getByRole('button',{name:'NatalCore',exact:true}).click();
 await page.locator('#btnValidarNatalCore').click();
 await expect(page.locator('#estadoNatalCore .ok')).toHaveText('NatalCore válido.');
});


test('legacy recovery adds a missing chart without overwriting source data or duplicating on retry',async({page})=>{
 await page.goto(app);
 const legacy=[{id:'legacy-recovery-01',nombre:'Carta recuperada E2E',dia:'2',mes:'1',anio:'1985',planetas:[],casas:[]}];
 await page.evaluate(records=>localStorage.setItem('astrodb_v51',JSON.stringify(records)),legacy);
 await page.reload();
 await page.getByRole('button',{name:'Biblioteca',exact:true}).click();
 await expect(page.locator('#lista')).toContainText('Carta recuperada E2E');
 const initial=await page.evaluate(()=>JSON.parse(localStorage.getItem('astrodb_validation_v51')||'[]'));
 expect(initial.filter(x=>x.nombre==='Carta recuperada E2E')).toHaveLength(1);
 await page.locator('#btnRecuperarLocalesAstroDB').click();
 const after=await page.evaluate(()=>({active:JSON.parse(localStorage.getItem('astrodb_validation_v51')||'[]'),legacy:JSON.parse(localStorage.getItem('astrodb_v51')||'[]')}));
 expect(after.active.filter(x=>x.nombre==='Carta recuperada E2E')).toHaveLength(1);
 expect(after.legacy).toEqual(legacy);
});


test('legacy recovery preserves a current record when an older source reuses its id',async({page})=>{
 await page.goto(app);await page.locator('#btnNueva').click();
 await page.getByRole('button',{name:'Datos natales',exact:true}).click();
 await page.locator('#nombre').fill('Registro vigente protegido');
 await page.locator('#btnGuardar').click();
 const current=await page.evaluate(()=>JSON.parse(localStorage.getItem('astrodb_validation_v51')||'[]')[0]);
 const older={...current,nombre:'Versión antigua del mismo identificador'};
 await page.evaluate(record=>localStorage.setItem('astrodb_v51',JSON.stringify([record])),older);
 await page.reload();await page.getByRole('button',{name:'Biblioteca',exact:true}).click();
 await page.locator('#btnRecuperarLocalesAstroDB').click();
 const result=await page.evaluate(()=>({active:JSON.parse(localStorage.getItem('astrodb_validation_v51')||'[]'),source:JSON.parse(localStorage.getItem('astrodb_v51')||'[]')}));
 expect(result.active).toHaveLength(1);
 expect(result.active[0].nombre).toBe('Registro vigente protegido');
 expect(result.source[0].nombre).toBe('Versión antigua del mismo identificador');
});

test('mobile bulk selection retires duplicate locally and prevents reimport',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto(app);
 const fixture=[
  {id:'bulk-a',nombre:'Prueba Duplicada',dia:2,mes:3,anio:1985,hora:'10:30',ciudad:'Barcelona',planetas:[{nombre:'Sol'}],casas:Array.from({length:12},(_,i)=>({casa:i+1}))},
  {id:'bulk-b',nombre:'Prueba Duplicada',dia:'02',mes:'03',anio:'1985',hora:'10:30',ciudad:'Barcelona',planetas:[],casas:[]}
 ];
 await page.evaluate(records=>localStorage.setItem('astrodb_validation_v51',JSON.stringify(records)),fixture);
 await page.reload();
 await page.getByRole('button',{name:'Biblioteca',exact:true}).click();
 await expect(page.locator('#bulkSummary')).toContainText('2 cartas');
 await expect(page.locator('#bulkSummary')).toContainText('1 grupos');
 await page.locator('#bulkSuggested').click();
 await expect(page.locator('#bulkSummary')).toContainText('1 seleccionadas');
 page.on('dialog',dialog=>dialog.accept());
 await page.locator('#bulkRemove').click();
 await expect(page.locator('#bulkSummary')).toContainText('1 cartas');
 await page.evaluate(incoming=>localStorage.setItem('astrodb_v51',JSON.stringify(incoming)),fixture);
 await page.locator('#btnRecuperarLocalesAstroDB').click();
 await expect(page.locator('#bulkSummary')).toContainText('1 cartas');
 const result=await page.evaluate(()=>({
   after:JSON.parse(localStorage.getItem('astrodb_validation_v51')).map(x=>x.id),
   retired:JSON.parse(localStorage.getItem('astrodb_v2_retired_ids_v1'))
 }));
 expect(result.retired).toContain('bulk-b');
 expect(result.after).toEqual(['bulk-a']);
 await page.screenshot({path:'test-artifacts/astrodb-bulk-mobile.png',fullPage:true});
});
