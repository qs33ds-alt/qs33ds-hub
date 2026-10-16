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
