let taskPage=0,pageDate=null;
let reminders=[],tasks=[],selected=TodoModel.dateKey(),month=new Date(),editing=null,statusId=null;
const $=id=>document.getElementById(id),labels={planned:'예정',active:'진행 중',done:'완료',hold:'보류'};
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
const holidayNames={},holidayYears=new Set();
function holidayName(date){return (window.plannerHolidayOverrides||{})[date]||holidayNames[date]||''}
function dateClass(date){return holidayName(TodoModel.dateKey(date))||date.getDay()===0?'holiday':date.getDay()===6?'saturday':''}
function ensureHolidays(year){if(holidayYears.has(year)||!window.todo.holidays)return;holidayYears.add(year);window.todo.holidays(year).then(names=>{Object.assign(holidayNames,names);document.dispatchEvent(new Event('holidays-updated'))}).catch(()=>{$('holiday-message').textContent='공휴일을 읽지 못했어요. 날짜별 공휴일을 직접 추가할 수 있습니다.';holidayYears.delete(year)})}
async function save(){try{tasks=await window.todo.save(tasks);$('message').textContent='';render()}catch(e){$('message').textContent='저장하지 못했습니다. '+e.message;const state=await window.todo.load();tasks=state.tasks;render()}}
async function changeStatus(task,status){TodoModel.update(tasks,task.id,{status});await save()}
function render(){
 const dayTasks=TodoModel.forDate(tasks,selected).sort((a,b)=>TodoModel.bounds(a).start-TodoModel.bounds(b).start);
 $('day-title').textContent=new Date(selected+'T12:00:00').toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'long'});
 const done=dayTasks.filter(t=>t.status==='done').length;$('summary').textContent=`${dayTasks.length}개의 할 일 · ${done}개 완료`;$('progress-bar').style.width=(dayTasks.length?done/dayTasks.length*100:0)+'%';$('tasks').replaceChildren();
 if(!dayTasks.length)$('tasks').append(el('div','empty','아직 일정이 없어요. 오늘의 첫 계획을 적어 보세요.'));
 if(pageDate!==selected){taskPage=0;pageDate=selected}taskPage=Math.min(taskPage,Math.max(0,Math.ceil(dayTasks.length/8)-1));pages('task-pages',taskPage,dayTasks.length,8,p=>{taskPage=p;render()});
 for(const t of dayTasks.slice(taskPage*8,taskPage*8+8)){
  const row=el('div','task'+(['done','hold'].includes(t.status)?' finished':''));row.dataset.status=t.status;
  const timeText=(t.date<selected?'전날 ':'')+t.start+'–'+(TodoModel.dateKey(TodoModel.bounds(t).end)>selected?'다음 날 ':'')+t.end;
  const times=el('span','times',timeText);times.title=timeText;
  const state=el('select','task-status');state.setAttribute('aria-label',t.text+' 상태');for(const [value,label] of Object.entries(labels)){const option=el('option','',label);option.value=value;state.append(option)}state.value=t.status;state.onchange=()=>changeStatus(t,state.value);
  const stateWrap=el('span','task-status-wrap');stateWrap.append(state);
  const name=el('span','task-name',t.text);name.title=t.text+(t.seriesId?' · '+TodoModel.repeatLabel(t.repeat):'');if(t.seriesId){const badge=el('span','repeat-badge',TodoModel.repeatLabel(t.repeat));name.append(badge)}
  const edit=el('button','mini','수정');edit.onclick=()=>{editing=t.seriesId||t.id;setRepeat(t.repeat);$('text').value=t.text;$('start').value=t.start;$('end').value=t.end;TimePickers.start();TimePickers.end();overnightHint();$('submit').textContent='저장';$('cancel-edit').hidden=false;$('text').focus()};
  const del=el('button','mini','삭제');del.onclick=()=>{if(confirm(t.seriesId?'이 반복 일정 전체를 삭제할까요?':'이 일정을 삭제할까요?')){tasks=tasks.filter(x=>x.id!==(t.seriesId||t.id));if(editing===(t.seriesId||t.id))reset();save()}};
  const actions=el('span','task-actions');actions.append(edit,del);
  const check=el('input');check.type='checkbox';check.checked=t.status==='done';check.setAttribute('aria-label',t.text+' 상태 변경');check.onclick=e=>{e.preventDefault();statusId=t.id;$('status-text').textContent=t.text;$('status-dialog').showModal()};
  row.append(times,stateWrap,name,actions,check);$('tasks').append(row);
 }
 renderCalendar();document.dispatchEvent(new Event('tasks-updated'));
}
let calendarLimit=4,calendarMaxTasks=0;
function renderCalendar(){
 ensureHolidays(month.getFullYear());$('month-title').textContent=`${month.getFullYear()}년 ${month.getMonth()+1}월`;$('calendar').replaceChildren();
 const first=new Date(month.getFullYear(),month.getMonth(),1),last=new Date(month.getFullYear(),month.getMonth()+1,0);
 $('calendar').style.setProperty('--calendar-weeks',Math.ceil((first.getDay()+last.getDate())/7));calendarMaxTasks=0;
 for(let i=0;i<first.getDay();i++)$('calendar').append(el('div'));
 for(let d=1;d<=last.getDate();d++){
  const date=new Date(month.getFullYear(),month.getMonth(),d),key=TodoModel.dateKey(date),cell=el('button','cell '+dateClass(date)+(key===selected?' selected':'')+(key===TodoModel.dateKey()?' today':''));
  cell.setAttribute('aria-label',key+' 일정 보기');cell.setAttribute('aria-pressed',String(key===selected));cell.append(el('span','number',d));
  const list=TodoModel.forDate(tasks,key).sort((a,b)=>TodoModel.bounds(a).start-TodoModel.bounds(b).start);calendarMaxTasks=Math.max(calendarMaxTasks,list.length);
  for(const t of list.slice(0,calendarLimit)){const item=el('span','schedule'+(['done','hold'].includes(t.status)?' finished':''),t.text);item.title=`${t.start}–${t.end} ${t.text}`;cell.append(item)}
  if(list.length>calendarLimit)cell.append(el('span','more',`+${list.length-calendarLimit}개`));
  cell.title=[holidayName(key),...list.map(t=>`${t.start}–${t.end} ${t.text}`)].filter(Boolean).join('\n');
  cell.onclick=()=>{selected=key;reset();render()};$('calendar').append(cell);
 }
 if(typeof requestAnimationFrame==='function')requestAnimationFrame(fitCalendar);
}
function fitCalendar(){
 const cell=$('calendar').querySelector('.cell');if(!cell)return;
 const height=cell.getBoundingClientRect().height;if(height<=0)return;
 const next=TodoModel.calendarCapacity(height,calendarMaxTasks);
 if(next!==calendarLimit){calendarLimit=next;renderCalendar()}
}
if(typeof ResizeObserver==='function')new ResizeObserver(fitCalendar).observe($('calendar'));

function reset(){editing=null;$('add-form').reset();TimePickers.start();TimePickers.end();overnightHint();setRepeat();$('submit').textContent='+ 추가';$('cancel-edit').hidden=true}
$('add-form').onsubmit=async e=>{e.preventDefault();const text=$('text').value.trim(),start=$('start').value,end=$('end').value,old=tasks.find(t=>t.id===editing);const endNextDay=end<start||!!(old&&old.endNextDay&&old.start===start&&old.end===end);if(!text||start===end&&!endNextDay){$('message').textContent='할 일을 입력하고 서로 다른 시작·마감 시간을 선택해 주세요.';return}const repeat=readRepeat();if(!TodoModel.validRepeat(repeat)||(repeat.until&&repeat.until<(old?.date||selected))){$('message').textContent='종료일은 반복 시작일 이후의 실제 날짜로 지정해 주세요.';return}if(old)Object.assign(old,{text,start,end,endNextDay,repeat,occurrences:TodoModel.sameRepeatSchedule(old.repeat,repeat)&&old.start===start&&old.end===end?old.occurrences:{},startNotified:false,endNotified:false,warningNotified:false});else tasks.push({id:crypto.randomUUID(),date:selected,text,start,end,endNextDay,repeat,status:'planned',startNotified:false,endNotified:false});reset();await save()};$('cancel-edit').onclick=reset;
$('prev').onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()-1,1);renderCalendar()};$('next').onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()+1,1);renderCalendar()};$('today').onclick=()=>{selected=TodoModel.dateKey();month=new Date();taskPage=0;reset();render()};$('close-status').onclick=()=>$('status-dialog').close();document.querySelectorAll('[data-status]').forEach(b=>b.onclick=()=>{const task=TodoModel.resolve(tasks,statusId);$('status-dialog').close();if(task)changeStatus(task,b.dataset.status)});$('autostart').onchange=async()=>{$('autostart').checked=await window.todo.autoStart($('autostart').checked)};
window.todo.onChange(data=>{tasks=data;render()});window.todo.load().then(state=>{tasks=state.tasks;reminders=state.reminders||[];renderReminders();$('autostart').checked=state.autoStart;$('autostart').disabled=state.platform!=='win32'||!state.packaged||state.portable;$('autostart').parentElement.title=state.portable?'설치 없는 실행판은 로그인 자동 실행을 지원하지 않습니다.':state.packaged?'':'자동 실행은 Windows 설치판에서 사용할 수 있습니다.';render()}).catch(e=>{$('message').textContent=e.message});
function overnightHint(){const auto=$('end').value<$('start').value;$('overnight-hint').textContent=auto?'마감이 시작보다 이르므로 다음 날 마감으로 저장해요.':''}
$('start').onchange=overnightHint;$('end').onchange=overnightHint;
function renderReminders(){
 $('reminders').replaceChildren();
 for(const r of reminders){const row=el('div','reminder-item');const text=el('span','',`${r.text} · ${r.interval}분마다 ${r.count===null?`${r.fired}회 · ∞ 무한 반복`:`${r.fired}/${r.count}회`}${r.count!==null&&r.fired>=r.count?' · 완료':''}`);const remove=el('button','mini','삭제');remove.onclick=async()=>{try{reminders=await window.todo.removeReminder(r.id);renderReminders()}catch(e){$('reminder-message').textContent=e.message}};row.append(text,remove);$('reminders').append(row)}
}
$('reminder-form').onsubmit=async e=>{e.preventDefault();try{reminders=await window.todo.addReminder({text:$('reminder-text').value.trim()||'잠깐 쉬어 가요',interval:Number($('reminder-interval').value),count:$('reminder-count').value==='infinite'?null:Number($('reminder-count').value)});$('reminder-message').textContent='알람을 시작했어요. 창을 닫아도 트레이에서 알려드려요.';renderReminders()}catch(e){$('reminder-message').textContent=e.message}};
window.todo.onReminders(data=>{reminders=data;renderReminders()});
let lastToday=TodoModel.dateKey();setInterval(()=>{const today=TodoModel.dateKey();if(today!==lastToday){renderQuote();if(selected===lastToday&&!editing){selected=today;month=new Date();render()}lastToday=today}document.dispatchEvent(new Event('review-clock'))},10000);
function pages(id,page,total,size,change){const nav=$(id);nav.replaceChildren();const count=Math.ceil(total/size);if(count<=1)return;const prev=el('button','','이전'),next=el('button','','다음');prev.type=next.type='button';prev.disabled=page===0;next.disabled=page===count-1;prev.onclick=()=>change(page-1);next.onclick=()=>change(page+1);nav.append(prev,el('span','',`${page+1} / ${count}`),next)}
function renderQuote(){const quote=TodoModel.dailyQuote();$('daily-quote').textContent=quote[0];$('quote-subtitle').textContent=quote[1]}
renderQuote();
const diaryTabs=['calendar','review','year','planner','reminder','memo'];
function openDiaryTab(name){for(const tab of diaryTabs){const active=tab===name;$(tab+'-tab').setAttribute('aria-selected',String(active));$(tab+'-tab').tabIndex=active?0:-1;$(tab+'-view').hidden=!active;}document.dispatchEvent(new CustomEvent('diary-tab',{detail:name}))}
for(const [i,name] of diaryTabs.entries()){$(name+'-tab').onclick=()=>openDiaryTab(name);$(name+'-tab').onkeydown=e=>{let next;if(['ArrowDown','ArrowRight'].includes(e.key))next=(i+1)%diaryTabs.length;else if(['ArrowUp','ArrowLeft'].includes(e.key))next=(i+diaryTabs.length-1)%diaryTabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=diaryTabs.length-1;else return;e.preventDefault();openDiaryTab(diaryTabs[next]);$(diaryTabs[next]+'-tab').focus()}}
document.addEventListener('holidays-updated',renderCalendar);

function readRepeat(){const type=$('repeat').value;return {type,...(type==='weekly'||type==='monthlyWeek'?{weekday:Number($('repeat-weekday').value)}:{}),...(type==='monthly'?{day:Number($('repeat-day').value)}:{}),...(type==='monthlyWeek'?{week:Number($('repeat-week').value)}:{}),...(type!=='none'&&$('repeat-end').value==='date'?{until:$('repeat-until').value}:{})}}
function repeatHint(){const type=$('repeat').value;$('repeat-week-label').hidden=type!=='monthlyWeek';$('repeat-weekday-label').hidden=!['weekly','monthlyWeek'].includes(type);$('repeat-day-label').hidden=type!=='monthly';$('repeat-day').required=type==='monthly';const hasEnd=type!=='none'&&$('repeat-end').value==='date';$('repeat-end-label').hidden=type==='none';$('repeat-until-label').hidden=!hasEnd;$('repeat-until').disabled=!hasEnd;$('repeat-until').required=hasEnd;$('repeat-until').min=tasks.find(t=>t.id===editing)?.date||selected;$('repeat-hint').textContent=type==='none'?'':'반복 기간: '+(tasks.find(t=>t.id===editing)?.date||selected)+'부터 '+(hasEnd?($('repeat-until').value||'종료일 선택')+'까지':'종료 없음')+'. '+(['monthly','monthlyWeek'].includes(type)?'해당 날짜나 주차가 없는 달은 건너뛰어요. ':'')+(hasEnd?'종료일 당일까지 반복해요. ':'')+'완료는 날짜별로, 수정·삭제는 전체에 적용돼요.'}
function setRepeat(r){const d=new Date(selected+'T12:00:00');$('repeat').value=r?.type||'none';$('repeat-weekday').value=r?.weekday??d.getDay();$('repeat-day').value=r?.day??d.getDate();$('repeat-week').value=r?.week??Math.ceil(d.getDate()/7);$('repeat-end').value=r?.until?'date':'never';$('repeat-until').value=r?.until||tasks.find(t=>t.id===editing)?.date||selected;repeatHint()}
$('repeat').onchange=repeatHint;$('repeat-end').onchange=repeatHint;$('repeat-until').onchange=repeatHint;setRepeat();
