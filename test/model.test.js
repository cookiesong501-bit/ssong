const {test}=require('node:test');const assert=require('node:assert/strict');const {due,dateKey}=require('../src/model');
const task={id:'1',date:'2026-10-23',start:'09:00',end:'10:00',status:'planned'};
test('local date key',()=>assert.equal(dateKey(new Date(2026,9,23,0,1)),'2026-10-23'));
test('no early notification',()=>assert.deepEqual(due([task],new Date(2026,9,23,8,59)),[]));
test('start notification',()=>assert.deepEqual(due([task],new Date(2026,9,23,9,0)),[{id:'1',kind:'start'}]));
test('late startup prioritizes end',()=>assert.deepEqual(due([task],new Date(2026,9,23,11,0)),[{id:'1',kind:'end'}]));
test('completed and held tasks stay silent',()=>{for(const status of ['done','hold'])assert.deepEqual(due([{...task,status}],new Date(2026,9,23,11)),[])});
test('notification is not repeated',()=>assert.deepEqual(due([{...task,startNotified:true,endNotified:true}],new Date(2026,9,23,11)),[]));
test('other dates stay silent',()=>assert.deepEqual(due([task],new Date(2026,9,24,11)),[]));
