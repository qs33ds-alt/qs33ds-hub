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
