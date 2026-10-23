window.TimePickers={};
for(const id of ['start','end']){
 const host=document.getElementById(id+'-picker'),hidden=document.getElementById(id);
 const period=document.createElement('select');period.setAttribute('aria-label',id==='start'?'시작 오전·오후':'마감 오전·오후');
 for(const [value,text] of [['am','오전'],['pm','오후']]){const o=document.createElement('option');o.value=value;o.textContent=text;period.append(o)}
 function number(min,max,label){const n=document.createElement('input');n.type='number';n.min=min;n.max=max;n.step=1;n.required=true;n.setAttribute('aria-label',label);n.addEventListener('wheel',e=>{if(document.activeElement!==n)return;e.preventDefault();n.value=String(Math.max(min,Math.min(max,Number(n.value)+(e.deltaY<0?1:-1)))).padStart(2,'0');sync()},{passive:false});n.addEventListener('change',()=>{n.value=String(Math.max(min,Math.min(max,Math.trunc(Number(n.value)||min)))).padStart(2,'0');sync()});return n}
 const hour=number(1,12,id==='start'?'시작 시':'마감 시'),minute=number(0,59,id==='start'?'시작 분':'마감 분');
 function sync(){if(!hour.validity.valid||!minute.validity.valid)return;hidden.value=String(Number(hour.value)%12+(period.value==='pm'?12:0)).padStart(2,'0')+':'+String(Number(minute.value)).padStart(2,'0');hidden.dispatchEvent(new Event('change'))}
 period.onchange=sync;hour.addEventListener('input',sync);minute.addEventListener('input',sync);
 const colon=document.createElement('span');colon.textContent=':';host.append(period,hour,colon,minute);
 window.TimePickers[id]=()=>{const [h,m]=hidden.value.split(':').map(Number);period.value=h>=12?'pm':'am';hour.value=String(h%12||12).padStart(2,'0');minute.value=String(m).padStart(2,'0')};TimePickers[id]();
}
