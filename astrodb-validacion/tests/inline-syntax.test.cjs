const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

test('all executable inline scripts in AstroDB HTML parse as JavaScript',()=>{
  const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const scripts=[...html.matchAll(/<script\\b([^>]*)>([\\s\\S]*?)<\\/script>/gi)];
  let inline=0;
  for(const [,attributes,body] of scripts){
    if(/\\bsrc\\s*=/.test(attributes)||/\\btype\\s*=\\s*['\"](?:application\\/json|importmap|text\\/template)/i.test(attributes))continue;
    if(!body.trim())continue;
    inline++;
    assert.doesNotThrow(()=>new vm.Script(body,{filename:'astrodb-validacion/index.html:inline-'+inline}), 'Invalid inline JavaScript #'+inline);
  }
  assert.ok(inline>0,'Expected at least one executable inline script');
});
