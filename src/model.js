(function(root){
 const quotes=[["오늘의 한 걸음이 내일의 나를 바꾼다.", "완벽한 때를 기다리지 말고, 지금 하나를 시작해요."], ["미루던 그 일, 오늘 끝내자.", "가장 마음에 걸리는 일에 먼저 10분을 써 보세요."], ["열정은 움직이는 순간 깨어난다.", "생각만 하던 계획을 오늘의 행동으로 바꿔요."], ["내 가능성을 증명할 시간, 지금.", "작아도 좋아요. 오늘 끝낼 한 가지를 정해요."], ["어제의 한계를 오늘의 기준으로 삼지 말자.", "어제 어려웠던 일도 오늘은 한 걸음 더 갈 수 있어요."], ["집중하는 한 시간이 하루를 바꾼다.", "잠깐 알림을 내려놓고 가장 중요한 일부터 시작해요."], ["꿈에 가까워지는 쪽을 선택하자.", "지금 할 일이 내가 원하는 내일과 이어지는지 살펴봐요."], ["시작한 나를, 끝까지 응원하자.", "속도가 느려져도 오늘의 약속 하나는 지켜 봐요."], ["오늘의 실행이 내 자신감을 만든다.", "작은 완료 표시 하나를 더해 보세요."], ["내 하루의 방향은 내가 정한다.", "급한 일에 휩쓸리기 전에 중요한 일을 골라요."], ["두려워도 한 걸음은 내딛을 수 있다.", "처음부터 잘하려 하지 말고 첫 단계를 끝내요."], ["지금의 노력이 미래의 선택지를 넓힌다.", "오늘 배우고 실천한 것은 내 안에 남아요."], ["남과의 비교 대신, 나의 다음 걸음.", "어제의 나보다 조금 더 나아갈 목표를 세워요."], ["포기하기 전에 방법을 바꿔 보자.", "막힌 일은 작게 나누어 다시 시작해요."], ["오늘을 그냥 흘려보내지 말자.", "잠들기 전 뿌듯할 한 가지를 지금 해요."], ["의욕을 기다리지 말고 시작을 만들자.", "딱 5분만 해 보세요. 그다음은 그때 정해도 좋아요."], ["쉬어 갈 줄 아는 사람이 멀리 간다.", "몸을 챙기는 휴식도 목표를 향한 선택이에요."], ["계획에 쓴 한 줄을 현실로 바꾸자.", "오늘의 목록에서 하나를 골라 바로 손대 보세요."], ["나는 나와의 약속을 지키는 사람.", "무리한 열 개보다 지킬 수 있는 한 개부터요."], ["한 번의 도전이 새로운 나를 연다.", "익숙한 선택 대신 필요한 도전을 하나 해봐요."], ["끝낸 일 하나가 다음 시작의 힘이 된다.", "완료한 일은 인정하고 다음 걸음을 골라요."], ["오늘도 내 목표를 향해 전진.", "바쁨보다 방향을 먼저 확인해요."], ["후회보다 실행을 남기는 하루.", "지금 바꿀 수 있는 것에 힘을 써요."], ["할 수 있는 것부터, 할 수 있는 만큼.", "작게 시작해도 계속하면 분명 달라져요."], ["내가 원하는 삶에 시간을 쓰자.", "오늘 가장 소중한 일을 일정에 먼저 넣어요."], ["흔들려도 다시 집중하면 된다.", "놓친 시간 대신 남은 시간을 바라봐요."], ["생각의 무게를 행동으로 덜어내자.", "복잡한 일도 첫 행동 하나로 시작해요."], ["나의 노력은 오늘도 쌓이고 있다.", "눈에 띄는 결과가 없어도 꾸준한 걸음은 남아요."], ["기회가 오면 움직일 내가 되자.", "오늘의 연습이 내일의 준비가 돼요."], ["오늘의 주인공답게, 한 가지를 해내자.", "작은 성공을 직접 만들어 보세요."], ["다시 시작하는 힘도 나의 실력이다.", "어제 못했어도 오늘의 첫걸음은 새로 뗄 수 있어요."]];
 const api={
 calendarCapacity(rowHeight,maxTasks){
  let count=Math.max(0,Math.min(4,Math.floor((rowHeight-28)/15)));
  if(maxTasks>count)count=Math.max(0,Math.min(4,Math.floor((rowHeight-41)/15)));
  return count;
 },
 weekStart(date=new Date()){const start=new Date(date);start.setHours(0,0,0,0);start.setDate(start.getDate()-(start.getDay()+6)%7);return api.dateKey(start)},
 weeklyReview(tasks,monday,now=Date.now()){
  const first=new Date(monday+'T00:00:00'),last=new Date(first);last.setDate(last.getDate()+7);
  const occurrences=new Map();for(let d=new Date(first);d<last;d.setDate(d.getDate()+1))for(const t of api.forDate(tasks,api.dateKey(d)))occurrences.set(t.id,t);const list=[...occurrences.values()];
  const done=list.filter(t=>t.status==='done');
  const delayed=list.flatMap(t=>{const end=api.bounds(t).end.getTime(),completed=typeof t.completedAt==='number'?t.completedAt:null,baseline=typeof t.originalEndAt==='number'?t.originalEndAt:end,reasons=[];
   if(t.status==='done'&&completed!==null&&completed>baseline)reasons.push('마감 후 완료');
   if(t.status!=='done'&&now>end)reasons.push('마감 초과');
   if(end>baseline)reasons.push('마감 연장');
   if(completed!==null&&typeof t.elapsedMs==='number'&&typeof t.plannedMinutes==='number'&&t.elapsedMs/60000>t.plannedMinutes)reasons.push('소요 시간 초과');
   return reasons.length?[{task:t,reasons}]:[]});
  return {done,delayed};
 },
 recordTask(old,incoming,now){
  const task={...incoming};
  const previous=old||{};const bounds=api.bounds(old||incoming);
  task.originalEndAt=typeof previous.originalEndAt==='number'?previous.originalEndAt:bounds.end.getTime();
  task.plannedMinutes=typeof previous.plannedMinutes==='number'?previous.plannedMinutes:(bounds.end-bounds.start)/60000;
  task.startedAt=typeof previous.startedAt==='number'?previous.startedAt:null;
  if(task.status==='active'&&task.startedAt===null)task.startedAt=now;
  task.elapsedMs=typeof previous.elapsedMs==='number'?previous.elapsedMs:0;
  if(previous.status==='active'&&typeof previous.activeSince==='number')task.elapsedMs+=Math.max(0,now-previous.activeSince);
  task.activeSince=task.status==='active'?now:null;
  task.completedAt=task.status==='done'?(previous.status==='done'?(typeof previous.completedAt==='number'?previous.completedAt:null):now):null;
  if(old&&old.date===task.date&&old.start===task.start&&old.end===task.end&&!!old.endNextDay===!!task.endNextDay){task.startNotified=old.startNotified;task.warningNotified=old.warningNotified;task.endNotified=old.endNotified;}
  return task;
 },
 dailyQuote(now=new Date()){const day=Math.floor(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())/86400000);return quotes[((day%quotes.length)+quotes.length)%quotes.length]},
 dateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`},
 validRepeat(r){return r==null||r.type==='none'||r.type==='daily'||(r.type==='weekly'&&Number.isInteger(r.weekday)&&r.weekday>=0&&r.weekday<=6)||(r.type==='monthly'&&Number.isInteger(r.day)&&r.day>=1&&r.day<=31)||(r.type==='monthlyWeek'&&Number.isInteger(r.weekday)&&r.weekday>=0&&r.weekday<=6&&[1,2,3,4,5,-1].includes(r.week))},
 matches(t,date){if(date<t.date)return false;const r=t.repeat;if(!r||r.type==='none')return date===t.date;const d=new Date(date+'T12:00:00');if(r.type==='daily')return true;if(r.type==='weekly')return d.getDay()===r.weekday;if(r.type==='monthly')return d.getDate()===r.day;if(r.type==='monthlyWeek'){const next=new Date(d);next.setDate(d.getDate()+7);return d.getDay()===r.weekday&&(r.week===-1?next.getMonth()!==d.getMonth():Math.ceil(d.getDate()/7)===r.week)}return false},
 occurrence(t,date){if(!api.matches(t,date))return null;if(!t.repeat||t.repeat.type==='none')return t;return {...t,id:t.id+'@'+date,seriesId:t.id,date,status:'planned',startedAt:null,activeSince:null,completedAt:null,elapsedMs:0,originalEndAt:undefined,plannedMinutes:undefined,startNotified:false,warningNotified:false,endNotified:false,...api.occurrenceState((t.occurrences||{})[date])}},
 forDate(tasks,date){const prev=new Date(date+'T12:00:00');prev.setDate(prev.getDate()-1);return tasks.flatMap(t=>[api.occurrence(t,api.dateKey(prev)),api.occurrence(t,date)].filter(v=>v&&api.onDate(v,date)))},
 resolve(tasks,id){const direct=tasks.find(t=>t.id===id);if(direct)return direct;const at=id.lastIndexOf('@'),t=tasks.find(t=>t.id===id.slice(0,at));return t?api.occurrence(t,id.slice(at+1)):null},
 update(tasks,id,patch){const t=api.resolve(tasks,id);if(!t)return;if(t.seriesId){const source=tasks.find(x=>x.id===t.seriesId);source.occurrences||={};source.occurrences[t.date]={...(source.occurrences[t.date]||{}),...api.occurrenceState(patch)}}else Object.assign(t,patch)},
 repeatLabel(r){if(!r||r.type==='none')return '';if(r.type==='daily')return '매일';if(r.type==='weekly')return '매주 '+ '일월화수목금토'[r.weekday]+'요일';if(r.type==='monthly')return '매월 '+r.day+'일';return '매월 '+(r.week===-1?'마지막':['','첫째','둘째','셋째','넷째','다섯째'][r.week])+' 주 '+ '일월화수목금토'[r.weekday]+'요일'},
 occurrenceState(value){const state={};for(const key of ['status','startNotified','warningNotified','endNotified','startedAt','activeSince','completedAt','elapsedMs','originalEndAt','plannedMinutes'])if(value&&Object.hasOwn(value,key))state[key]=value[key];return state},
 recordSeries(old,incoming,now){
  const result=api.recordTask(old,incoming,now);
  if(!incoming.repeat||incoming.repeat.type==='none'){delete result.occurrences;return result}
  result.occurrences={};
  const same=old&&old.date===incoming.date&&old.start===incoming.start&&old.end===incoming.end&&!!old.endNextDay===!!incoming.endNextDay&&JSON.stringify(old.repeat)===JSON.stringify(incoming.repeat);
  for(const [date,state] of Object.entries({...((same&&old.occurrences)||{}),...(incoming.occurrences||{})})){
   const current=api.occurrence({...incoming,occurrences:{...incoming.occurrences,[date]:state}},date);if(!current)continue;
   const previous=same?api.occurrence(old,date):null;
   result.occurrences[date]=api.occurrenceState(api.recordTask(previous,current,now));
  }
  return result;
 },
 bounds(t){const start=new Date(`${t.date}T${t.start}:00`),end=new Date(`${t.date}T${t.end}:00`);if(t.endNextDay||t.end<t.start)end.setDate(end.getDate()+1);return {start,end}},
 validTask(t){return !!t&&api.validRepeat(t.repeat)&&(!t.occurrences||(typeof t.occurrences==='object'&&!Array.isArray(t.occurrences)&&Object.entries(t.occurrences).every(([date,state])=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&!!state&&typeof state==='object'&&(!state.status||['planned','active','done','hold'].includes(state.status)))))&&typeof t.id==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(t.date)&&[t.start,t.end].every(v=>typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v))&&(t.start!==t.end||t.endNextDay===true)&&typeof t.text==='string'&&!!t.text.trim()&&['planned','active','done','hold'].includes(t.status)},
 onDate(t,date){const {end}=api.bounds(t);return t.date===date||(api.dateKey(end)===date&&t.date!==date)},
 due(tasks,now){return api.forDate(tasks,api.dateKey(now)).flatMap(t=>{if(['done','hold'].includes(t.status))return [];const {start,end}=api.bounds(t);if(now<start||api.dateKey(now)>api.dateKey(end))return [];if(now>=end&&!t.endNotified)return [{id:t.id,kind:'end'}];if(now<end&&!t.startNotified&&!t.endNotified)return [{id:t.id,kind:'start'}];if(now<end&&now>=new Date(end-600000)&&!t.warningNotified&&!t.endNotified)return [{id:t.id,kind:'warning'}];return []})},
 reminderDue(reminders,now){return reminders.flatMap(r=>{if(!r.active||(r.count!==null&&r.fired>=r.count)||now<r.nextAt)return [];const fired=Math.min(r.count===null?Infinity:r.count,r.fired+1+Math.floor((now-r.nextAt)/(r.interval*60000)));return [{id:r.id,kind:'reminder',number:fired,nextAt:r.nextAt+(fired-r.fired)*r.interval*60000}]})},
 validReminder(r){return !!r&&typeof r.id==='string'&&typeof r.text==='string'&&r.text.length<=200&&Number.isInteger(r.interval)&&r.interval>=1&&r.interval<=1440&&(r.count===null||(Number.isInteger(r.count)&&r.count>=1&&r.count<=5))&&Number.isInteger(r.fired)&&r.fired>=0&&(r.count===null||r.fired<=r.count)&&Number.isFinite(r.nextAt)&&typeof r.active==='boolean'}
 };if(typeof module!=='undefined')module.exports=api;else root.TodoModel=api;
})(globalThis);
