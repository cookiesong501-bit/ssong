(function(root){
 const api={
 dateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`},
 due(tasks,now){const date=api.dateKey(now),time=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;return tasks.flatMap(t=>{if(t.date!==date||['done','hold'].includes(t.status))return [];if(t.end<=time&&!t.endNotified)return [{id:t.id,kind:'end'}];if(t.start<=time&&!t.startNotified&&!t.endNotified)return [{id:t.id,kind:'start'}];return []})}
 };if(typeof module!=='undefined')module.exports=api;else root.TodoModel=api;
})(globalThis);
