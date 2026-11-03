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

test('real Swiss transit produces live positions without overwriting natal fixture',async({page})=>{
 test.setTimeout(90000);
 await page.goto(app);
 const f={id:'transit-e2e',nombre:'E2E ficticio',dia:2,mes:1,anio:1985,hora:'14:45',tz:'Europe/Madrid',lat:'41.38879',lon:'2.15899',ciudad:'Barcelona',planetas:[{nombre:'Sol',longitude:282.11955738},{nombre:'Luna',longitude:48.60482935}],casas:Array.from({length:12},(_,i)=>({casa:i+1,longitude:(i*30+5)%360}))};
 await page.evaluate(row=>localStorage.setItem('astrodb_validation_v51',JSON.stringify([row])),f);
 await page.reload();await page.getByRole('button',{name:'Biblioteca',exact:true}).click();
 await page.locator('#lista .listItem').filter({hasText:'E2E ficticio'}).click();
 await page.getByRole('button',{name:'Tránsitos',exact:true}).click();
 await page.locator('#cyWhen').fill('2026-11-03T12:00');
 await page.locator('#cyTransitRun').click();
 await expect(page.locator('#cyTransitExport')).toBeEnabled({timeout:60000});
 await expect(page.locator('#cyTransitResult .cycleTable').first()).toContainText('Sol');
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('astrodb_validation_v51'))[0]);
 expect(after).toEqual(f);
});
