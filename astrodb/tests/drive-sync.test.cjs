const {test}=require('node:test');
const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const {Client}=require('../drive-sync.js');
function fixture(){
 const files=new Map(),storageMap=new Map();let seq=0;let failKind=null;let lostResponse=false;let revocation=false;
 const storage={getItem:k=>storageMap.get(k)||null,setItem:(k,v)=>storageMap.set(k,v)};
 const fetch=async(url,options={})=>{
  if(revocation)return new Response('',{status:401});
  const u=new URL(url);const id=decodeURIComponent(u.pathname.split('/').pop());
  if(u.pathname.endsWith('/about'))return Response.json({user:{permissionId:'google-user',emailAddress:'test@example.invalid'}});
  if(id==='generateIds')return Response.json({ids:['drive-'+(++seq)]});
  if(!options.method&&id==='files'){
   const q=u.searchParams.get('q');const key=q.match(/stable_key' and value='([^']+)'/)[1];const parent=q.match(/and '([^']+)' in parents/);
   return Response.json({files:[...files.values()].filter(f=>f.appProperties.stable_key===key&&(!parent||f.parents?.includes(parent[1]))).map(f=>({id:f.id}))});
  }
  if(!options.method){const file=files.get(id);if(!file)return new Response('',{status:404});return u.searchParams.get('alt')==='media'?new Response(file.text):Response.json(file);}
  let meta,text=null;
  if(u.searchParams.has('uploadType')){
   const boundary=options.headers['Content-Type'].split('boundary=')[1];const parts=options.body.split('--'+boundary);
   meta=JSON.parse(parts[1].split('\r\n\r\n')[1].trim());text=parts[2].split('\r\n\r\n').slice(1).join('\r\n\r\n').replace(/\r\n$/,'');
  }else meta=JSON.parse(options.body);
  if(failKind&&meta.name.startsWith(failKind))return new Response('',{status:503});
  const actualId=options.method==='POST'?meta.id:id;
  if(options.method==='POST'&&files.has(actualId))return new Response('',{status:409});
  files.set(actualId,{...files.get(actualId),...meta,id:actualId,...(text===null?{}:{text})});
  if(lostResponse&&meta.mimeType==='application/json'){lostResponse=false;throw Error('lost response after commit');}
  return Response.json({id:actualId});
 };
 const client=new Client({fetch,storage,crypto:webcrypto});
 client.session={token:'PRIVATE_TEST_TOKEN',expires:Date.now()+100000,generation:0,account:'google-user'};
 return {client,files,storageMap,setFailure:k=>failKind=k,loseNext:()=>lostResponse=true,revoke:()=>revocation=true,fetch};
}
const bundle=id=>({format:'qs33ds.astrodb.codigo-semilla.v1',chart_id:id,chart:{id,nombre:'Mismo nombre',planetas:[{}],casas:[{}]},natalcore:{meta:{subject_id:'astrodb:'+id}}});
test('three verified copies update the same IDs, preserve identity, and never store the token',async()=>{
 const f=fixture();const first=await f.client.save(bundle('a'));const again=await f.client.save(bundle('a'));
 assert.equal(first.ok,true);assert.equal(again.ok,true);assert.equal(f.files.size,7); // four folders plus three files
 assert.deepEqual(first.outcomes,again.outcomes);
 const other=await f.client.save(bundle('b'));assert.equal(other.ok,true);assert.equal(f.files.size,10);
 assert.ok(!JSON.stringify([...f.storageMap]).includes('PRIVATE_TEST_TOKEN'));
});
test('uncertain network response reuses its reserved Drive ID on retry',async()=>{
 const f=fixture();f.loseNext();const partial=await f.client.save(bundle('a'));assert.equal(partial.ok,false);
 const retry=await f.client.save(bundle('a'));assert.equal(retry.ok,true);assert.equal(f.files.size,7);
});
test('failed chart copy does not stop NatalCore and retry repairs the partial save',async()=>{
 const f=fixture();f.setFailure('astrodb_');const partial=await f.client.save(bundle('a'));
 assert.equal(partial.ok,false);assert.equal(partial.outcomes.natalcore.state,'success');assert.equal(partial.outcomes.chart.state,'error');
 f.setFailure(null);assert.equal((await f.client.save(bundle('a'))).ok,true);assert.equal(f.files.size,7);
});
test('revocation clears the session and does not falsely confirm success',async()=>{
 const f=fixture();f.revoke();await assert.rejects(f.client.save(bundle('a')),/revocado/);assert.equal(f.client.state().connected,false);
});
test('crossed identity is rejected before any Drive write',async()=>{
 const f=fixture();const b=bundle('a');b.natalcore.meta.subject_id='astrodb:b';await assert.rejects(f.client.save(b),/identidad/);assert.equal(f.files.size,0);
});
test('simultaneous saves of the same chart keep only three files',async()=>{
 const f=fixture();const results=await Promise.all([f.client.save(bundle('a')),f.client.save(bundle('a'))]);assert.ok(results.every(r=>r.ok));assert.equal(f.files.size,7);
});
test('OAuth rejects missing config and denied scopes; disconnect cancels its pending result',async()=>{
 const f=fixture();f.client.disconnect();await assert.rejects(f.client.connect(''),/OAuth/);
 let callback;
 const google={accounts:{oauth2:{initTokenClient:o=>{callback=o.callback;return {requestAccessToken(){}};},hasGrantedAllScopes:()=>true}}};
 const pending=f.client.connect('test.apps.googleusercontent.com',google);f.client.disconnect();callback({access_token:'token',expires_in:3600});await assert.rejects(pending,/cancelada/);assert.equal(f.client.state().connected,false);
});
test('denied Drive scope and expired OAuth tokens cannot start any upload',async()=>{
 const f=fixture();f.client.disconnect();
 const google={accounts:{oauth2:{initTokenClient:o=>({requestAccessToken(){o.callback({access_token:'token',expires_in:3600});}}),hasGrantedAllScopes:()=>false}}};
 await assert.rejects(f.client.connect('test.apps.googleusercontent.com',google),/permiso/);assert.equal(f.files.size,0);
 f.client.session={token:'expired',expires:Date.now()-1000,generation:f.client.generation,account:'google-user'};
 assert.equal(f.client.state().expired,true);await assert.rejects(f.client.save(bundle('a')),/caducado/);assert.equal(f.files.size,0);
});
test('OAuth identifies the Google account without persisting access tokens',async()=>{
 const f=fixture();f.client.disconnect();
 const google={accounts:{oauth2:{initTokenClient:o=>({requestAccessToken(){o.callback({access_token:'new-token',expires_in:3600});}}),hasGrantedAllScopes:()=>true}}};
 const state=await f.client.connect('test.apps.googleusercontent.com',google);assert.equal(state.connected,true);assert.equal(state.account,'google-user');assert.ok(!JSON.stringify([...f.storageMap]).includes('new-token'));
});
