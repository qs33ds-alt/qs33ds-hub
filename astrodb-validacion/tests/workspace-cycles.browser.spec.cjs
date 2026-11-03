const {test,expect}=require('@playwright/test');
const path=require('node:path');
const app='file://'+path.resolve(__dirname,'../index.html');
test('new sections are navigable without changing the existing natal or cloud controls',async({page})=>{
 await page.goto(app);
 await expect(page.locator('.workspaceV2Nav button')).toHaveCount(8);
 await page.getByRole('button',{name:'Tránsitos',exact:true}).click();
 await expect(page.locator('#workspaceCycles [data-cycle-panel="transitos"]')).toBeVisible();
 await expect(page.locator('#cyTransitRun')).toBeVisible();
 await page.getByRole('button',{name:'Revolución solar',exact:true}).click();
 await expect(page.locator('#cySolarRun')).toBeVisible();
 await page.getByRole('button',{name:'Sinastría',exact:true}).click();
 await expect(page.locator('#cySynRun')).toBeVisible();
 await expect(page.locator('#btnGuardar')).toHaveCount(1);
 await expect(page.locator('#selectorCartas')).toHaveCount(1);
});
test('cycles responsive navigation on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto(app);
 await page.getByRole('button',{name:'Revolución solar',exact:true}).click();
 await expect(page.locator('#cySolarRun')).toBeVisible();
 await page.screenshot({path:'test-artifacts/astrodb-ciclos-mobile.png',fullPage:true});
});
test('synastry reads two saved cards and leaves natal storage intact',async({page})=>{
 await page.goto(app);
 const fixture=[0,1].map(i=>({id:'cycle-smoke-'+i,nombre:'Persona '+i,dia:2,mes:1,anio:1985,hora:'14:45',tz:'Europe/Madrid',planetas:[{nombre:'Sol',longitude:282.12+i*0.01},{nombre:'Luna',longitude:48.6+i*2}],casas:Array.from({length:12},(_,j)=>({casa:j+1,longitude:(j*30+5)%360}))}));
 await page.evaluate(rows=>localStorage.setItem('astrodb_validation_v51',JSON.stringify(rows)),fixture);
 await page.reload();await page.getByRole('button',{name:'Sinastría',exact:true}).click();
 await page.locator('#cyPersonA').selectOption('0');await page.locator('#cyPersonB').selectOption('1');
 await page.locator('#cySynRun').click();
 await expect(page.locator('#cySynResult .cycleTable')).toHaveCount(1);
 await expect(page.locator('#cySynExport')).toBeEnabled();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('astrodb_validation_v51')));
 expect(saved).toEqual(fixture);
 await page.locator('#cySynSave').click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('astrodb_workspace_v21_studies:anonymous')||'[]').length)).toBe(1);
});
