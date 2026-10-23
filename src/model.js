(function(root){
 const api={
 dateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`},
 bounds(t){const start=new Date(`${t.date}T${t.start}:00`),end=new Date(`${t.date}T${t.end}:00`);if(t.endNextDay||t.end<t.start)end.setDate(end.getDate()+1);return {start,end}},
 validTask(t){return !!t&&typeof t.id==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(t.date)&&[t.start,t.end].every(v=>typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v))&&(t.start!==t.end||t.endNextDay===true)&&typeof t.text==='string'&&!!t.text.trim()&&['planned','active','done','hold'].includes(t.status)},
 onDate(t,date){const {end}=api.bounds(t);return t.date===date||(api.dateKey(end)===date&&t.date!==date)},
 due(tasks,now){return tasks.flatMap(t=>{if(['done','hold'].includes(t.status))return [];const {start,end}=api.bounds(t);if(now<start||api.dateKey(now)>api.dateKey(end))return [];if(now>=end&&!t.endNotified)return [{id:t.id,kind:'end'}];if(now<end&&!t.startNotified&&!t.endNotified)return [{id:t.id,kind:'start'}];if(now<end&&now>=new Date(end-600000)&&!t.warningNotified&&!t.endNotified)return [{id:t.id,kind:'warning'}];return []})},
 reminderDue(reminders,now){return reminders.flatMap(r=>{if(!r.active||r.fired>=r.count||now<r.nextAt)return [];const fired=Math.min(r.count,r.fired+1+Math.floor((now-r.nextAt)/(r.interval*60000)));return [{id:r.id,kind:'reminder',number:fired,nextAt:r.nextAt+(fired-r.fired)*r.interval*60000}]})},
 validReminder(r){return !!r&&typeof r.id==='string'&&typeof r.text==='string'&&r.text.length<=200&&Number.isInteger(r.interval)&&r.interval>=1&&r.interval<=1440&&Number.isInteger(r.count)&&r.count>=1&&r.count<=5&&Number.isInteger(r.fired)&&r.fired>=0&&r.fired<=r.count&&Number.isFinite(r.nextAt)&&typeof r.active==='boolean'}
 };if(typeof module!=='undefined')module.exports=api;else root.TodoModel=api;
})(globalThis);
