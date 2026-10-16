const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
function functions(from,to){return html.slice(html.indexOf('function '+from+'('),html.indexOf('function '+to+'('));}
const context=vm.createContext({SIGNOS:Array.from({length:12},(_,i)=>['S'+i]),console});
vm.runInContext(functions('lonToSignDegree','degNorm360'),context);
vm.runInContext(functions('prepararPaqueteCodigoSemilla','prepararCopiaCodigoSemilla'),context);
test('unknown Swiss speed remains unknown across supported shapes',()=>{
 for(const value of [[12,0,0,null],[12,0,0,''],[12],{longitude:12,speed:null},{longitude:12}]){
  const out=context.normalizaPos('Sol',value);assert.equal(out.speed,undefined);assert.equal(out.retrograde,undefined);
 }
 for(const speed of [-0.5,0,0.5]){const out=context.normalizaPos('Sol',[12,0,0,speed]);assert.equal(out.speed,speed);assert.equal(out.retrograde,speed<0);}
});
test('missing Swiss longitude is rejected instead of becoming Aries zero',()=>{
 for(const value of [[null,0,0,1],['',0,0,1],null])assert.throws(()=>context.normalizaPos('Sol',value));
});
test('bundle identity distinguishes equal names and rejects crossed NatalCore',()=>{
 const a={id:'a',nombre:'Igual',planetas:[{}],casas:[{}]};
 const b={...a,id:'b'};
 const core={meta:{subject_id:'astrodb:a'}};
 assert.equal(context.comprobarPaqueteCodigoSemilla(context.prepararPaqueteCodigoSemilla(a,core)),true);
 assert.equal(context.comprobarPaqueteCodigoSemilla(context.prepararPaqueteCodigoSemilla(b,core)),false);
});
function localContext(seed){
 const storage=new Map(Object.entries(seed).map(([k,v])=>[k,JSON.stringify(v)]));
 const c=vm.createContext({Map,console,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)}});
 vm.runInContext("const STORAGE_KEY='astrodb_v51';"+functions('leerJSONLocal','cargarTodasLasFichasGuardadas')+functions('cargarTodasLasFichasGuardadas','refrescarDatosDesdeLocal').split('let datos=')[0],c);
 return c;
}
test('local recovery preserves distinct IDs with identical personal details',()=>{
 const a={id:'uuid-a',nombre:'Igual'},b={id:'uuid-b',nombre:'Igual'};
 const c=localContext({astrodb_v51:[a,b],astrodb_v45:[a]});
 assert.equal(c.cargarTodasLasFichasGuardadas().length,2);
 assert.equal(c.cargarTodasLasFichasGuardadas().length,2);
});
test('legacy records without ID get repeatable IDs without merging same-name people',()=>{
 const c=localContext({astrodb_v45:[{nombre:'Igual'},{nombre:'Igual'}]});
 const first=c.cargarTodasLasFichasGuardadas();const again=c.cargarTodasLasFichasGuardadas();
 assert.equal(first.length,2);assert.equal(again.length,2);assert.equal(first[0].id,again[0].id);
});
function syncContext(writer){
 const c=vm.createContext({Map,JSON,Promise,console,astrodbSupabase:{},astrodbUser:{id:'user-a'},guardarFichaSupabase:writer});
 const start=html.indexOf('const colasGuardadoSupabase=');
 vm.runInContext(html.slice(start,html.indexOf('const ASTRODB_CODIGO_SEMILLA_DRIVE',start)),c);return c;
}
test('same-chart saves serialize, retain snapshots and allow other charts independently',async()=>{
 const calls=[];const release=[];
 const c=syncContext(f=>{calls.push(f);return new Promise(resolve=>release.push(resolve));});
 const original={id:'a',nombre:'Primero'};
 const first=c.sincronizarFichaActivaSupabase(original);original.nombre='Mutado';
 const second=c.sincronizarFichaActivaSupabase({id:'a',nombre:'Segundo'});
 const other=c.sincronizarFichaActivaSupabase({id:'b',nombre:'Otro'});
 await new Promise(setImmediate);assert.equal(calls.length,2);assert.equal(calls[0].nombre,'Primero');
 release[0](true);release[1](true);await new Promise(setImmediate);
 assert.equal(calls[2].nombre,'Segundo');release[2](true);
 assert.deepEqual(await Promise.all([first,second,other]),[true,true,true]);
});
test('failed write does not poison the queue and account changes cancel queued writes',async()=>{
 let resolveFirst;let count=0;
 const c=syncContext(()=>{count++;if(count===1)return new Promise(resolve=>resolveFirst=resolve);return true;});
 const first=c.sincronizarFichaActivaSupabase({id:'a'});const second=c.sincronizarFichaActivaSupabase({id:'a'});
 await new Promise(setImmediate);resolveFirst(false);assert.deepEqual(await Promise.all([first,second]),[false,true]);
 const d=syncContext(()=>new Promise(resolve=>resolveFirst=resolve));
 const p=d.sincronizarFichaActivaSupabase({id:'a'});const q=d.sincronizarFichaActivaSupabase({id:'a'});
 await new Promise(setImmediate);d.astrodbUser={id:'user-b'};resolveFirst(true);
 assert.deepEqual(await Promise.all([p,q]),[true,false]);
});
test('UUID selectors retain strings and loading also resolves legacy numeric IDs',()=>{
 assert.ok(!html.includes("Number($('selectorCartas').value)"));assert.ok(!html.includes('cargar(Number(b.dataset.id))'));
 const fields=Object.fromEntries(['nombre','dia','mes','anio','hora','ciudad','lat','lon','tz','titulo','interpretacionDirecta'].map(k=>[k,{}]));
 const c=vm.createContext({datos:[{id:'uuid-a',nombre:'Nueva'},{id:123,nombre:'Antigua',lat:0,lon:0}],idActivo:null,ultimaSolicitudGuardadoAstroDB:0,invalidarEstadoGuardadoAstroDB(){},$:k=>fields[k],showEditor(){},setCarta(){},render(){}});
 vm.runInContext(functions('cargar','eliminar'),c);
 c.cargar('uuid-a');assert.equal(c.idActivo,'uuid-a');
 c.cargar('123');assert.equal(c.idActivo,123);assert.equal(fields.nombre.value,'Antigua');assert.equal(fields.lat.value,0);assert.equal(fields.lon.value,0);
});
test('loading another chart invalidates pending visual confirmation',()=>{
 const element={textContent:''};
 const c=vm.createContext({console,$:()=>element});
 const start=html.indexOf('let ultimaSolicitudGuardadoAstroDB=');
 vm.runInContext(html.slice(start,html.indexOf('function guardar(){',start)),c);
 c.invalidarEstadoGuardadoAstroDB();
 c.informarGuardadoRemoto(true,'Anterior',0);
 assert.ok(element.textContent.includes('pendiente de confirmar'));
 c.informarGuardadoRemoto(true,'Actual',1);
 assert.ok(element.textContent.includes('confirmado'));
});
test('Supabase writer aborts if account changes during lookup',async()=>{
 let resolveLookup;let writes=0;
 const client={from(){return {select(){return this},eq(){return this},contains(){return this},limit(){return this},maybeSingle(){return new Promise(resolve=>resolveLookup=resolve)},insert(){writes++;return this},update(){writes++;return this}}}};
 const c=vm.createContext({console,astrodbSupabase:client,astrodbUser:{id:'user-a'}});
 const start=html.indexOf('async function guardarFichaSupabase(');
 vm.runInContext(html.slice(start,html.indexOf('function capturarFichaParaSincronizacion(',start)),c);
 const pending=c.guardarFichaSupabase({id:'a',nombre:'Persona'});
 c.astrodbUser={id:'user-b'};resolveLookup({data:null,error:null});
 assert.equal(await pending,false);assert.equal(writes,0);
});
test('all inline application scripts parse',()=>{
 let count=0;
 for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){if(match[1].trim()){new vm.Script(match[1]);count++;}}
 assert.ok(count>0);
});
