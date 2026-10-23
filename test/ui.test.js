const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const model=require('../src/model');
async function screen(){
 const html=fs.readFileSync('src/index.html','utf8');
 const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://todo.local/'}),w=dom.window;
 const store={tasks:[],reminders:[]};
 w.todo={load:async()=>({...store,platform:'win32',packaged:true,autoStart:true}),save:async data=>{assert.ok(data.every(model.validTask));store.tasks=JSON.parse(JSON.stringify(data));return store.tasks},onChange(){},onReminders(){},autoStart:async b=>b,addReminder:async data=>{store.reminders.push({...data,id:'r',fired:0});return store.reminders},removeReminder:async()=>{store.reminders=[];return []}};
 for(const file of ['model.js','time-picker.js','app.js']){const s=w.document.createElement('script');s.textContent=fs.readFileSync('src/'+file,'utf8');w.document.body.append(s)}
 await new Promise(r=>setImmediate(r));
 return {w,store,$:id=>w.document.getElementById(id),close:()=>w.close()};
}
test('hour and minute wheels stop at both bounds',async()=>{const ui=await screen();try{for(const [selector,min,max] of [['#start-picker input[aria-label="시작 시"]',1,12],['#start-picker input[aria-label="시작 분"]',0,59]]){const n=ui.w.document.querySelector(selector);n.focus();n.value=max;n.dispatchEvent(new ui.w.WheelEvent('wheel',{deltaY:-1,cancelable:true}));assert.equal(Number(n.value),max);n.value=min;n.dispatchEvent(new ui.w.WheelEvent('wheel',{deltaY:1,cancelable:true}));assert.equal(Number(n.value),min)}}finally{ui.close()}});
test('AM/PM conversion and overnight save survive editing',async()=>{const ui=await screen();try{ui.$('text').value='밤 작업';ui.$('start').value='20:00';ui.$('end').value='01:00';ui.w.TimePickers.start();ui.w.TimePickers.end();assert.equal(ui.w.document.querySelector('#start-picker select').value,'pm');assert.equal(ui.w.document.querySelector('#end-picker input').value,'01');await ui.$('add-form').onsubmit({preventDefault(){}});assert.equal(ui.store.tasks[0].endNextDay,true);assert.equal(ui.store.tasks[0].end,'01:00');assert.match(ui.$('tasks').textContent,/다음 날 01:00/);ui.$('tasks').querySelector('button').click();assert.equal(ui.$('end-next-day').checked,true);await ui.$('add-form').onsubmit({preventDefault(){}});assert.equal(ui.store.tasks.length,1);assert.equal(ui.store.tasks[0].start,'20:00');const next=new Date(ui.store.tasks[0].date+'T12:00:00');next.setDate(next.getDate()+1);const key=model.dateKey(next);ui.w.eval(`selected='${key}';render()`);assert.match(ui.$('tasks').textContent,/전날 20:00/);assert.doesNotMatch(ui.$('tasks').textContent,/다음 날 01:00/)}finally{ui.close()}});
test('time controls correctly distinguish midnight and noon',async()=>{const ui=await screen();try{const p=ui.w.document.querySelector('#start-picker select'),h=ui.w.document.querySelector('#start-picker input');h.value='12';p.value='am';p.dispatchEvent(new ui.w.Event('change'));assert.equal(ui.$('start').value,'00:00');p.value='pm';p.dispatchEvent(new ui.w.Event('change'));assert.equal(ui.$('start').value,'12:00')}finally{ui.close()}});
test('independent alarm form sends interval/count and supports deletion',async()=>{const ui=await screen();try{ui.$('reminder-text').value='스트레칭';ui.$('reminder-interval').value='1';ui.$('reminder-count').value='5';await ui.$('reminder-form').onsubmit({preventDefault(){}});assert.equal(ui.store.reminders[0].interval,1);assert.match(ui.$('reminders').textContent,/1분마다 0\/5회/);await ui.$('reminders').querySelector('button').onclick();assert.equal(ui.store.reminders.length,0);assert.equal(ui.$('reminders').children.length,0)}finally{ui.close()}});
test('friendly popups show correct choices and request bell playback',async()=>{
 for(const kind of ['start','warning','end','reminder']){
  const dom=new JSDOM(fs.readFileSync('src/alert.html','utf8'),{runScripts:'dangerously',url:'https://todo.local/'}),w=dom.window;let handler,played=0,answer;
  w.HTMLMediaElement.prototype.play=function(){played++;return Promise.resolve()};
  w.todo={onAlert:fn=>handler=fn,answer:data=>answer=data,soundFallback(){}};
  const s=w.document.createElement('script');s.textContent=fs.readFileSync('src/alert.js','utf8');w.document.body.append(s);
  handler({task:{id:'1',text:'물 마시기',interval:5,count:5},kind,number:2});
  assert.equal(played,1);assert.match(w.document.getElementById('task').textContent,/물 마시기/);
  if(kind==='warning')assert.match(w.document.getElementById('title').textContent,/10분/);
  if(kind==='reminder'){assert.match(w.document.getElementById('title').textContent,/5분 간격 · 2번째/);assert.equal(w.document.querySelectorAll('button').length,1)}
  w.document.querySelector('button').click();assert.equal(answer.id,'1');assert.equal(answer.status,kind==='reminder'?'ack':kind==='start'?'active':'done');w.close();
 }
});
