const assert=require('node:assert/strict');
const test=require('node:test');
const {merge}=require('../chart-recovery.js');
test('existing record wins when legacy record reuses its ID',()=>{
 const current={id:'42',nombre:'Actual',planetas:[{longitude:10}]};
 const old={id:42,nombre:'Antigua',planetas:[{longitude:99}]};
 const r=merge([current],[old]);
 assert.equal(r.added,0);assert.equal(r.skipped,1);
 assert.deepEqual(r.records,[current]);
});
test('duplicate incoming IDs cannot add multiple copies',()=>{
 const r=merge([], [{id:'x',nombre:'Primera'},{id:'x',nombre:'Segunda'}]);
 assert.equal(r.added,1);assert.equal(r.skipped,1);assert.equal(r.records[0].nombre,'Primera');
});
test('invalid incoming objects and arrays cannot create records',()=>{
 const r=merge([], [null,[],{}, {id:''},{id:'ok',nombre:'Válida'}]);
 assert.equal(r.added,1);assert.equal(r.skipped,4);
});
test('incoming record is copied to prevent accidental mutation',()=>{
 const input={id:'copy',planetas:[{longitude:42}]};
 const r=merge([], [input]);input.planetas[0].longitude=100;
 assert.equal(r.records[0].planetas[0].longitude,42);
});

test('same-ID recovery remains idempotent across repeated merges',()=>{
 const current=[{id:'keep',nombre:'Actual'}];
 const old=[{id:'keep',nombre:'Antigua'},{id:'new',nombre:'Nueva'}];
 const first=merge(current,old);
 const second=merge(first.records,old);
 assert.equal(first.added,1);assert.equal(second.added,0);
 assert.deepEqual(second.records,first.records);
 assert.equal(second.records[0].nombre,'Actual');
});
