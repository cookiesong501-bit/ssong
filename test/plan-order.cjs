const {JSDOM}=require('jsdom');
const fs=require('fs'),assert=require('node:assert/strict'),base=require('node:path').join(__dirname,'../');
const initial={plans:['a','b','c'].map(id=>({id,title:id,color:'rose',cells:{'2026-10-24':{text:id+' memo',color:'blue',status:'done'}}})),memos:[],weekly:{},yearly:{},holidays:{}};
function boot(data){const dom=new JSDOM(fs.readFileSync(base+'src/index.html','utf8'),{url:'https://planner.local',runScripts:'outside-only'}),w=dom.window;w.localStorage.setItem('ssong-diary-v1',JSON.stringify(data));w.eval(fs.readFileSync(base+'src/model.js','utf8'));w.eval(`var $=id=>document.getElementById(id);function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}var tasks=[];function ensureHolidays(){}function holidayName(){return ''}function dateClass(){return ''}`);w.eval(fs.readFileSync(base+'src/diary.js','utf8'));return w}
const w=boot(initial),rows=()=>[...w.document.querySelectorAll('tr[data-plan-id]')],ids=()=>rows().map(r=>r.dataset.planId),saved=()=>JSON.parse(w.localStorage.getItem('ssong-diary-v1'));
assert(rows()[0].querySelector('.plan-move-up').disabled);assert(rows()[2].querySelector('.plan-move-down').disabled);
rows()[2].querySelector('.plan-move-up').click();assert.deepEqual(ids(),['a','c','b']);
let transfer={setData(){},effectAllowed:'',dropEffect:''};rows()[0].querySelector('.plan-drag-handle').ondragstart({dataTransfer:transfer});rows()[2].ondrop({preventDefault(){}});assert.deepEqual(ids(),['c','b','a']);
assert.deepEqual(saved().plans.find(p=>p.id==='a'),initial.plans[0]);
rows()[2].querySelector('.plan-drag-handle').dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowUp',altKey:true,bubbles:true}));assert.deepEqual(ids(),['c','a','b']);
const reloaded=boot(saved());assert.deepEqual([...reloaded.document.querySelectorAll('tr[data-plan-id]')].map(r=>r.dataset.planId),['c','a','b']);
const before=w.localStorage.getItem('ssong-diary-v1');w.Storage.prototype.setItem=()=>{throw Error('disk full')};rows()[1].querySelector('.plan-move-up').click();assert.deepEqual(ids(),['c','a','b']);assert.equal(w.localStorage.getItem('ssong-diary-v1'),before);
console.log('PASS: buttons, boundaries, drag/drop, keyboard, cell records, reload persistence, storage failure');
