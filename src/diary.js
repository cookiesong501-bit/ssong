/* Existing v1 storage is retained, including previous cell text and checkpoints. */
(()=>{
 const key='ssong-diary-v1';
 const colors=['rose','orange','yellow','green','mint','blue','navy','purple','pink','red'];
 const colorNames=['살구','주황','노랑','초록','민트','파랑','남색','보라','분홍','빨강'];
 let data={plans:[],memos:[],weekly:{},yearly:{},holidays:{}},blocked=false;
 let planMonth=new Date(),year=new Date().getFullYear(),reviewMonth=new Date(),reviewMonday=TodoModel.weekStart();
 let selection=new Set(),anchor=null,dragging=false,planEditing=null;
 const message=text=>{for(const id of ['diary-message','memo-message','year-message','review-message'])$(id).textContent=text};
 function validMap(value){return value&&typeof value==='object'&&!Array.isArray(value)}
 try{
  const raw=localStorage.getItem(key);
  if(raw){
   const value=JSON.parse(raw);
   if(!value||!Array.isArray(value.plans)||!Array.isArray(value.memos)||
    !value.plans.every(p=>p&&typeof p.id==='string'&&typeof p.title==='string'&&colors.includes(p.color)&&validMap(p.cells)&&Object.values(p.cells).every(c=>c&&typeof c.text==='string'&&colors.includes(c.color)&&['planned','review','done'].includes(c.status)))||
    !value.memos.every(m=>m&&typeof m.id==='string'&&typeof m.title==='string'&&typeof m.body==='string'&&(!m.color||colors.includes(m.color))&&(!m.category||typeof m.category==='string'))||
    (value.weekly!==undefined&&(!validMap(value.weekly)||!Object.values(value.weekly).every(v=>typeof v==='string')))||
    (value.yearly!==undefined&&(!validMap(value.yearly)||!Object.values(value.yearly).every(months=>Array.isArray(months)&&months.length===12&&months.every(lines=>Array.isArray(lines)&&lines.length===6&&lines.every(v=>typeof v==='string')))))||
    (value.holidays!==undefined&&(!validMap(value.holidays)||!Object.values(value.holidays).every(v=>typeof v==='string'))))throw Error('기록 형식을 확인할 수 없습니다');
   data={...value,weekly:value.weekly||{},yearly:value.yearly||{},holidays:value.holidays||{}};
  }
 }catch(e){blocked=true;message('저장된 기록을 읽지 못했습니다. 기존 기록 보호를 위해 변경을 중단했어요. '+e.message)}
 window.plannerHolidayOverrides=data.holidays;
 function persist(next){
  if(blocked){message('기존 기록 보호를 위해 저장이 중단되었습니다.');return false}
  try{localStorage.setItem(key,JSON.stringify(next));data=next;window.plannerHolidayOverrides=data.holidays;message('이 컴퓨터에 저장했어요.');return true}
  catch(e){message('저장하지 못했습니다. 입력 내용을 복사해 보관해 주세요. '+e.message);return false}
 }
 const copy=()=>JSON.parse(JSON.stringify(data));
 function colorOptions(select,value){for(const [i,color] of colors.entries()){const option=el('option','',colorNames[i]);option.value=color;select.append(option)}select.value=value}
 function tableDates(){const first=new Date(planMonth.getFullYear(),planMonth.getMonth(),-2),last=new Date(planMonth.getFullYear(),planMonth.getMonth()+1,3),dates=[];for(let d=new Date(first);d<=last;d.setDate(d.getDate()+1))dates.push(new Date(d));return dates}
 function cellKey(id,date){return JSON.stringify([id,date])}
 function selectRange(start,end){
  selection.clear();const dates=tableDates(),left=Math.min(start.col,end.col),right=Math.max(start.col,end.col),top=Math.min(start.row,end.row),bottom=Math.max(start.row,end.row);
  for(let row=top;row<=bottom;row++)for(let col=left;col<=right;col++)selection.add(cellKey(data.plans[row].id,TodoModel.dateKey(dates[col])));
  updateSelection();
 }
 function updateSelection(){for(const b of $('plan-grid').querySelectorAll('button[data-cell]')){const selected=selection.has(b.dataset.cell);b.classList.toggle('range-selected',selected);b.setAttribute('aria-pressed',String(selected))}$('plan-paint-selection').disabled=selection.size===0}
 function showPalette(){if(!selection.size)return;$('plan-date').textContent=`선택한 ${selection.size}칸 색칠`;$('plan-dialog').showModal()}
 function renderPlans(){
  $('plan-month-title').textContent=`${planMonth.getFullYear()}년 ${planMonth.getMonth()+1}월 · 월간 계획`;
  const dates=tableDates();for(const year of new Set(dates.map(d=>d.getFullYear())))ensureHolidays(year);
  const grid=$('plan-grid'),scrollLeft=grid.scrollLeft,scrollTop=grid.scrollTop;grid.replaceChildren();
  const table=el('table','month-sheet'),caption=el('caption','sr-only','계획별 날짜 색상표. 빈칸을 클릭하거나 드래그하여 색을 지정하세요.');table.append(caption);
  const head=el('thead'),tr=el('tr');tr.append(el('th','plan-name','계획 / 날짜'));
  for(const date of dates){const adjacent=date.getMonth()!==planMonth.getMonth(),key=TodoModel.dateKey(date),th=el('th',(adjacent?'adjacent ':'')+dateClass(date),adjacent?`${date.getMonth()+1}/${date.getDate()}`:date.getDate());th.scope='col';th.title=key+(holidayName(key)?' · '+holidayName(key):'');th.dataset.date=key;tr.append(th)}head.append(tr);table.append(head);
  const body=el('tbody');
  for(const [rowIndex,p] of data.plans.entries()){
   const row=el('tr'),title=el('th','plan-name '+p.color);title.scope='row';
   const name=el('input','plan-title-input');name.value=p.title;name.maxLength=100;name.setAttribute('aria-label','계획명 '+p.title);
   name.onchange=()=>{const next=copy(),plan=next.plans.find(x=>x.id===p.id);const title=name.value.trim();if(!title){name.value=p.title;return}plan.title=title;if(persist(next))renderPlans()};
   const settings=el('button','plan-settings-button','⚙');settings.setAttribute('aria-label',p.title+' 색상·삭제');settings.onclick=()=>{planEditing=p.id;$('plan-edit-title').value=p.title;$('plan-edit-color').value=p.color;$('plan-settings').showModal()};title.append(name,settings);row.append(title);
   for(const [col,date] of dates.entries()){
    const dateKey=TodoModel.dateKey(date),entry=p.cells[dateKey],td=el('td',date.getMonth()!==planMonth.getMonth()?'adjacent':'');
    const button=el('button',entry&&!entry.unpainted?entry.color:'');button.type='button';button.dataset.cell=cellKey(p.id,dateKey);button.dataset.row=rowIndex;button.dataset.col=col;
    button.setAttribute('aria-label',`${p.title} ${dateKey}${entry&&!entry.unpainted?' '+colorNames[colors.indexOf(entry.color)]:''} 색상`);
    button.title=dateKey+(entry?.text?' · 이전 기록: '+entry.text:'');
    button.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();anchor={row:rowIndex,col};dragging=true;selectRange(anchor,anchor);button.focus({preventScroll:true})};
    button.onpointerenter=()=>{if(dragging)selectRange(anchor,{row:rowIndex,col})};
    button.onclick=e=>{if(e.detail===0){if(!selection.has(button.dataset.cell))selectRange({row:rowIndex,col},{row:rowIndex,col});showPalette()}};
    button.oncontextmenu=e=>{e.preventDefault();dragging=false;if(!selection.has(button.dataset.cell))selectRange({row:rowIndex,col},{row:rowIndex,col});showPalette()};
    button.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const r=Math.max(0,Math.min(data.plans.length-1,rowIndex+(e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0))),c=Math.max(0,Math.min(dates.length-1,col+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0)));if(e.shiftKey){if(!anchor)anchor={row:rowIndex,col};selectRange(anchor,{row:r,col:c})}else{anchor={row:r,col:c};selectRange(anchor,anchor)}grid.querySelector(`button[data-row="${r}"][data-col="${c}"]`).focus()};
    td.append(button);row.append(td);
   }
   body.append(row);
  }
  const addRow=el('tr'),addCell=el('th','plan-name');
  const form=el('form','inline-plan-form');form.id='plan-form';const input=el('input');input.id='plan-title';input.maxLength=100;input.placeholder='+ 새 계획 입력';input.required=true;input.setAttribute('aria-label','새 계획');const add=el('button','','+');add.setAttribute('aria-label','계획 추가');form.append(input,add);
  form.onsubmit=e=>{e.preventDefault();const title=input.value.trim();if(!title)return;const next=copy();next.plans.push({id:crypto.randomUUID(),title,color:colors[data.plans.length%colors.length],cells:{}});if(persist(next))renderPlans()};addCell.append(form);addRow.append(addCell);const empty=el('td');empty.colSpan=dates.length;empty.className='plan-add-hint';empty.textContent='왼쪽 칸에 계획을 적고 Enter · 계획명은 바로 수정, ⚙에서 색상·삭제';addRow.append(empty);body.append(addRow);
  table.append(body);grid.append(table);grid.scrollLeft=scrollLeft;grid.scrollTop=scrollTop;updateSelection();
 }
 document.addEventListener('pointerup',()=>{if(dragging){dragging=false;showPalette()}});
 $('plan-grid').onpointermove=e=>{if(!dragging)return;const rect=$('plan-grid').getBoundingClientRect();if(e.clientX>rect.right-24)$('plan-grid').scrollLeft+=20;else if(e.clientX<rect.left+170)$('plan-grid').scrollLeft-=20};
 for(const [i,color] of colors.entries()){const label=el('label','swatch '+color),radio=el('input');radio.type='radio';radio.name='plan-color';radio.value=color;radio.checked=i===0;label.append(radio,document.createTextNode(colorNames[i]));$('plan-palette').append(label)}
 colorOptions($('plan-edit-color'),'rose');
 function paint(clear){const next=copy(),color=document.querySelector('[name=plan-color]:checked').value;for(const key of selection){const [id,date]=JSON.parse(key),plan=next.plans.find(p=>p.id===id);if(!plan)continue;const old=plan.cells[date];if(clear){if(old?.text)plan.cells[date]={...old,unpainted:true};else delete plan.cells[date]}else plan.cells[date]={text:old?.text||'',status:old?.status||'planned',color,unpainted:false}}
  if(persist(next)){$('plan-dialog').close();selection.clear();anchor=null;renderPlans()}
 }
 $('plan-cell-form').onsubmit=e=>{e.preventDefault();paint(false)};$('plan-cell-clear').onclick=()=>paint(true);$('plan-cell-close').onclick=()=>$('plan-dialog').close();$('plan-paint-selection').onclick=showPalette;
 $('plan-settings-form').onsubmit=e=>{e.preventDefault();const next=copy(),plan=next.plans.find(p=>p.id===planEditing),title=$('plan-edit-title').value.trim();if(!plan||!title)return;plan.title=title;plan.color=$('plan-edit-color').value;if(persist(next)){$('plan-settings').close();renderPlans()}};
 $('plan-delete').onclick=()=>{if(!confirm('이 계획과 날짜별 기록을 삭제할까요?'))return;const next=copy();next.plans=next.plans.filter(p=>p.id!==planEditing);if(persist(next)){selection.clear();$('plan-settings').close();renderPlans()}};$('plan-settings-close').onclick=()=>$('plan-settings').close();
 function movePlanMonth(delta){planMonth=new Date(planMonth.getFullYear(),planMonth.getMonth()+delta,1);selection.clear();anchor=null;renderPlans()}
 $('plan-prev').onclick=()=>movePlanMonth(-1);$('plan-next').onclick=()=>movePlanMonth(1);$('plan-today').onclick=()=>{planMonth=new Date();selection.clear();renderPlans()};
 $('holiday-add').onclick=()=>{$('holiday-date').value=TodoModel.dateKey();$('holiday-name').value='';$('holiday-dialog').showModal()};
 $('holiday-date').onchange=()=>{$('holiday-name').value=data.holidays[$('holiday-date').value]||''};
 $('holiday-form').onsubmit=e=>{e.preventDefault();const date=$('holiday-date').value,name=$('holiday-name').value.trim();if(!date||!name)return;const next=copy();next.holidays[date]=name;if(persist(next)){$('holiday-dialog').close();document.dispatchEvent(new Event('holidays-updated'))}};
 $('holiday-remove').onclick=()=>{const next=copy();delete next.holidays[$('holiday-date').value];if(persist(next)){$('holiday-dialog').close();document.dispatchEvent(new Event('holidays-updated'))}};$('holiday-close').onclick=()=>$('holiday-dialog').close();
 function renderYear(){
  $('year-number').value=year;$('year-grid').replaceChildren();const months=data.yearly[year]||Array.from({length:12},()=>Array(6).fill(''));
  for(let month=0;month<12;month++){const card=el('section','year-card');card.append(el('h2','',`${month+1}월`));for(let line=0;line<6;line++){const input=el('input');input.value=months[month][line];input.maxLength=200;input.placeholder=`${line+1}.`;input.setAttribute('aria-label',`${year}년 ${month+1}월 계획 ${line+1}`);input.oninput=()=>{const next=copy();next.yearly[year]||=Array.from({length:12},()=>Array(6).fill(''));next.yearly[year][month][line]=input.value;persist(next)};card.append(input)}$('year-grid').append(card)}
 }
 function changeYear(next){if(!Number.isInteger(next)||next<1900||next>2100){$('year-number').value=year;return}year=next;renderYear()}
 $('year-prev').onclick=()=>changeYear(year-1);$('year-next').onclick=()=>changeYear(year+1);$('year-number').onchange=()=>changeYear(Number($('year-number').value));
 function renderReview(){
  $('review-month').textContent=`${reviewMonth.getFullYear()}.${reviewMonth.getMonth()+1}`;$('review-calendar').replaceChildren();const first=new Date(reviewMonth.getFullYear(),reviewMonth.getMonth(),1),start=new Date(first);start.setDate(1-(first.getDay()+6)%7);
  for(let week=0;week<6;week++){const monday=new Date(start);monday.setDate(start.getDate()+week*7);const key=TodoModel.dateKey(monday),button=el('button','review-week week-color-'+week+(key===reviewMonday?' selected':''));button.setAttribute('aria-label',key+' 월요일부터 일요일까지 선택');button.setAttribute('aria-pressed',String(key===reviewMonday));for(let day=0;day<7;day++){const date=new Date(monday);date.setDate(monday.getDate()+day);ensureHolidays(date.getFullYear());const n=el('span',dateClass(date)+(date.getMonth()!==reviewMonth.getMonth()?' adjacent':''),date.getDate());n.title=holidayName(TodoModel.dateKey(date));button.append(n)}button.onclick=()=>{reviewMonday=key;renderReview()};$('review-calendar').append(button)}
  const end=new Date(reviewMonday+'T12:00:00');end.setDate(end.getDate()+6);$('review-range').textContent=`${reviewMonday} ~ ${TodoModel.dateKey(end)} · 월–일`;
  if(document.activeElement!==$('review-note'))$('review-note').value=data.weekly[reviewMonday]||'';
  const report=TodoModel.weeklyReview(tasks,reviewMonday);$('review-done-count').textContent=`${report.done.length}개`;$('review-late-count').textContent=`${report.delayed.length}개`;$('review-done').replaceChildren();$('review-late').replaceChildren();
  function item(task,note){const row=el('div','review-task');row.append(el('strong','',task.text),el('small','',`${task.date} ${task.start}–${task.end} · ${note}`));return row}
  for(const task of report.done){const time=typeof task.completedAt==='number'?new Date(task.completedAt).toLocaleString('ko-KR'):'완료 시각 미기록';$('review-done').append(item(task,time))}
  for(const {task,reasons} of report.delayed)$('review-late').append(item(task,reasons.join(' · ')));
  if(!report.done.length)$('review-done').append(el('p','empty','이번 주 완료한 일이 아직 없어요.'));if(!report.delayed.length)$('review-late').append(el('p','empty','이번 주 확인할 지연 일정이 없어요.'));
 }
 $('review-note').oninput=()=>{const next=copy();next.weekly[reviewMonday]=$('review-note').value;persist(next)};
 $('review-prev').onclick=()=>{reviewMonth=new Date(reviewMonth.getFullYear(),reviewMonth.getMonth()-1,1);renderReview()};$('review-next').onclick=()=>{reviewMonth=new Date(reviewMonth.getFullYear(),reviewMonth.getMonth()+1,1);renderReview()};$('review-today').onclick=()=>{reviewMonth=new Date();reviewMonday=TodoModel.weekStart();renderReview()};
 function renderMemos(){
  const filter=$('memo-filter').value,categories=[...new Set(data.memos.map(m=>m.category||'미분류'))];$('memo-filter').replaceChildren(el('option','','전체'));$('memo-filter').firstChild.value='';for(const category of categories){const option=el('option','',category);option.value=category;$('memo-filter').append(option)}$('memo-filter').value=categories.includes(filter)?filter:'';
  const board=$('memo-board');board.replaceChildren();
  for(const m of data.memos.filter(m=>!$('memo-filter').value||(m.category||'미분류')===$('memo-filter').value)){
   const card=el('article','sticky-note '+(m.color||'yellow'));card.dataset.id=m.id;const toolbar=el('div','sticky-toolbar'),category=el('input','memo-category');category.value=m.category||'미분류';category.maxLength=40;category.setAttribute('list','memo-categories');category.setAttribute('aria-label','메모 종류');
   const color=el('select');color.setAttribute('aria-label','메모지 색상');colorOptions(color,m.color||'yellow');const remove=el('button','mini','삭제');toolbar.append(category,color,remove);
   const title=el('input','memo-title');title.value=m.title;title.maxLength=100;title.placeholder='제목';title.setAttribute('aria-label','메모 제목');const body=el('textarea','memo-body');body.value=m.body;body.maxLength=10000;body.placeholder='떠오른 생각을 적어 보세요.';body.setAttribute('aria-label','메모 내용');const status=el('small','memo-save-status','입력하면 자동 저장됩니다.');status.setAttribute('role','status');
   function saveMemo(){const next=copy(),memo=next.memos.find(x=>x.id===m.id);Object.assign(memo,{title:title.value,body:body.value,color:color.value,category:category.value||'미분류'});const success=persist(next);status.textContent=success?'저장됨':'저장 실패 · 입력 내용을 복사해 주세요.';return success}
   title.oninput=body.oninput=()=>saveMemo();category.onchange=()=>{if(saveMemo())renderMemos()};color.onchange=()=>{if(saveMemo())card.className='sticky-note '+color.value};
   remove.onclick=()=>{if(confirm('이 메모를 삭제할까요?')){const next=copy();next.memos=next.memos.filter(x=>x.id!==m.id);if(persist(next))renderMemos()}};
   card.append(toolbar,title,body,status);board.append(card);
  }
  if(!board.children.length)board.append(el('p','empty','+ 메모를 눌러 메모지를 붙여 보세요.'));
 }
 $('memo-new').onclick=()=>{const next=copy();next.memos.unshift({id:crypto.randomUUID(),title:'',body:'',category:$('memo-filter').value||'미분류',color:colors[(data.memos.length+2)%colors.length]});if(persist(next)){renderMemos();$('memo-board').querySelector('.memo-title').focus()}};$('memo-filter').onchange=renderMemos;
 document.addEventListener('tasks-updated',renderReview);document.addEventListener('holidays-updated',()=>{renderPlans();renderReview()});document.addEventListener('review-clock',()=>{if(!$('review-view').hidden)renderReview()});
 renderPlans();renderYear();renderReview();renderMemos();
})();
