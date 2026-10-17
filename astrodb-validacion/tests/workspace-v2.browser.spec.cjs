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
