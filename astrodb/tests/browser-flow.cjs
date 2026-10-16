// Run with Playwright available and CHROME_EXECUTABLE_PATH pointing to Chromium/Chrome Headless Shell.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright');
(async()=>{
 const output=process.env.ASTRODB_QA_DIR||'/tmp/astrodb-qa';fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE_PATH?{executablePath:process.env.CHROME_EXECUTABLE_PATH}:{}),args:['--no-sandbox']});
 try{for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const page=await browser.newPage({viewport});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.route('https://**/*',r=>r.abort()); // Explicitly offline: no real OAuth or cloud write is claimed here.
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await page.evaluate(()=>{
   const signs=['Aries','Tauro','Géminis','Cáncer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'];
   const names=['Sol','Luna','Mercurio','Venus','Marte','Júpiter','Saturno','Urano','Neptuno','Plutón','Nodo Norte','Quirón'];
   localStorage.setItem('astrodb_v51',JSON.stringify([{id:'fixture-uuid-a',nombre:'Carta de prueba',dia:'15',mes:'6',anio:'1990',hora:'12:30',ciudad:'Prueba',lat:0,lon:0,tz:'Europe/Madrid',
    planetas:names.map((nombre,i)=>({nombre,signo:signs[i],grado:10+i,speed:i===2?-0.5:null})),casas:signs.map((signo,i)=>({casa:i+1,signo,grado:0})),ephemeris:{timezone:'Europe/Madrid'}}]));
  });
  await page.addInitScript(()=>{
   let module;
   window.sentCopies=[];window.simulateDrive=false;
   Object.defineProperty(window,'AstroDBDrive',{configurable:true,get:()=>module,set:value=>{
    const Base=value.Client;
    module={...value,Client:class extends Base{
      state(){return window.simulateDrive?{connected:true}:super.state();}
      async save(bundle){if(!window.simulateDrive)return super.save(bundle);window.sentCopies.push(bundle);return {ok:true,root:'simulated-folder',outcomes:{chart:{state:'success'},natalcore:{state:'success'},log:{state:'success'}}};}
    }};
   }});
  });
  await page.reload();
  await page.selectOption('#selectorCartas','fixture-uuid-a');
  await page.waitForTimeout(900);
  const local=await page.evaluate(()=>({rows:JSON.parse(localStorage.getItem('astrodb_v51')).length,id:document.getElementById('selectorCartas').value,status:document.getElementById('estadoGuardadoAstroDB').textContent}));
  assert.equal(local.rows,1);assert.equal(typeof local.id,'string');assert.match(local.status,/Local: guardado/);
  const download=page.waitForEvent('download');await page.locator('#astrodbCopiasPanel').evaluate(el=>el.open=true);await page.click('#botonCodigoSemilla');
  const file=await download;const jsonPath=path.join(output,`chart-${viewport.width}.json`);await file.saveAs(jsonPath);
  const bundle=JSON.parse(fs.readFileSync(jsonPath,'utf8'));
  assert.equal(bundle.chart_id,local.id);assert.equal(bundle.natalcore.meta.subject_id,'astrodb:'+local.id);assert.equal(bundle.natalcore.validation.valid,true);
  assert.equal(bundle.natalcore.points.find(p=>p.name==='Sol').speed,null);
  assert.equal(bundle.natalcore.points.find(p=>p.name==='Mercurio').retrograde,true);
  // Simulated Drive in the application layer; HTTP adapter behavior has separate tests.
  await page.evaluate(()=>window.simulateDrive=true);
  await page.click('#btnGuardar');await page.waitForTimeout(100);
  const independent=await page.evaluate(()=>({status:document.getElementById('estadoGuardadoAstroDB').textContent,copies:window.sentCopies.length}));
  assert.equal(independent.copies,1);assert.match(independent.status,/Drive: 3 copias verificadas/);assert.match(independent.status,/Supabase: no confirmado/);
  // Reopening by UUID autosaves, and duplicating preserves distinct identity.
  await page.selectOption('#selectorCartas',local.id);await page.waitForTimeout(900);
  await page.click('#btnGuardarNueva');await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('astrodb_v51')).length),2);
  const second=await page.evaluate(()=>JSON.parse(localStorage.getItem('astrodb_v51'))[1].id);assert.notEqual(second,local.id);
  await page.selectOption('#selectorCartas',local.id);await page.waitForTimeout(900);
  assert.equal(await page.locator('#nombre').inputValue(),'Carta de prueba');
  await page.locator('#astrodbCopiasPanel').evaluate(el=>el.open=true);
  await page.screenshot({path:path.join(output,`complete-${viewport.width}.png`),fullPage:true});
  const widths=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));assert.equal(widths.document,widths.viewport);
  // Editing birth data must invalidate the old calculated positions and cancel its autosave.
  await page.fill('#anio','1991');await page.waitForTimeout(900);assert.equal(await page.evaluate(()=>window.cartaActual.planetas.length),0);
  assert.deepEqual(errors,[]);console.log(`PASS ${viewport.width}: autosave, UUID, duplicate, JSON, null speed, retrograde, independent clouds, stale-chart invalidation, no horizontal overflow, no runtime errors`);
  await page.close();
 }}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
