const {test}=require('node:test');const assert=require('node:assert/strict');
const {merge,readLegacy,fromSupabase,readSupabase}=require('../chart-recovery.js');
test('merge is by ID and preserves current charts and distinct same-name people',()=>{
 const existing=[{id:123,nombre:'Igual',interpretacion:'Local'}];
 const result=merge(existing,[{id:'123',nombre:'Cambio'},{id:'uuid-b',nombre:'Igual'}]);
 assert.equal(result.added,1);assert.equal(result.records[0].interpretacion,'Local');assert.equal(result.records.length,2);assert.equal(existing.length,1);
});
test('legacy sources are only read, preserve zero and numeric IDs, and skip malformed storage',()=>{
 const store=new Map([['old',JSON.stringify([{id:0,nombre:'Cero',lat:0},{nombre:'Sin ID'}])],['bad','broken']]);
 const before=JSON.stringify([...store]);const result=readLegacy({getItem:k=>store.get(k)},['old','bad']);
 assert.equal(result.records[0].id,0);assert.equal(result.records[1].id,'legacy:old:1');assert.deepEqual(result.unreadable,['bad']);assert.equal(JSON.stringify([...store]),before);
});
test('Supabase mapping preserves chart identity, coordinates zero, arrays and ephemeris',()=>{
 const row={id:'server-uuid',chart_local_id:'legacy',name:'Persona',latitude:0,longitude:0,birth_date:'1990-06-15',input_data:{astrodb_local_id:123},chart_data:{planetas:[{speed:null}],casas:[{casa:1}]},natalcore:{ephemeris:{timezone:'Europe/Madrid'}}};
 const result=fromSupabase(row);assert.equal(result.id,123);assert.equal(result.lat,0);assert.equal(result.lon,0);assert.equal(result.dia,'15');assert.equal(result.planetas[0].speed,null);assert.equal(result.ephemeris.timezone,'Europe/Madrid');
});
function clientFor(pages){let requests=0;const scopes=[];return {scopes,get requests(){return requests;},from(){return {select(){return this;},eq(field,value){scopes.push([field,value]);return this;},order(){return this;},async range(from,to){return pages[requests++]??{data:[],error:null};}};}};}
test('cloud recovery paginates and filters owner',async()=>{
 const row=i=>({id:'r'+i,user_id:'u',input_data:{id:'chart-'+i}});
 const client=clientFor([{data:Array.from({length:200},(_,i)=>row(i)),error:null},{data:[row(200)],error:null}]);
 assert.equal((await readSupabase(client,'u')).length,201);assert.equal(client.requests,2);assert.ok(client.scopes.every(([field,value])=>field==='user_id'&&value==='u'));
});
test('failed read, switched account, and foreign owner reject before merging anything',async()=>{
 await assert.rejects(readSupabase(clientFor([{data:null,error:{message:'denied'}}]),'u'),/recuperar/);
 await assert.rejects(readSupabase(clientFor([{data:[{user_id:'other'}],error:null}]),'u'),/cuenta/);
 let checks=0;await assert.rejects(readSupabase(clientFor([{data:[],error:null}]),'u',()=>++checks===1),/cambió/);
});
