window.todo.onAlert(({task,kind,number})=>{
 document.getElementById('bell').play().catch(()=>window.todo.soundFallback());
 const messages={start:['우리, 이제 시작해 볼까요?','계획한 일 시작했어요? 작은 첫걸음만 떼도 좋아요. 제가 응원할게요.'],warning:['마감까지 10분 남았어요 ☕','아직 진행 중이에요? 이제 조금씩 마무리해 볼까요. 무리하지 말고, 한 가지씩 정리해요.'],end:['여기까지 하느라 수고했어요 🌷','이 일은 끝났어요? 아직 진행 중이어도 괜찮아요. 지금 상태만 살짝 알려주세요.'],reminder:[`${task.interval}분 간격 · ${number}번째 알람`,task.count===null?`약속한 시간이에요. ${number}번째 무한 반복 알람이에요. 삭제할 때까지 계속 알려드려요.`:`약속한 시간이에요. 잠깐 챙겨 볼까요? 총 ${task.count}번 중 ${number}번째로 알려드려요.`]};
 const [title,message]=messages[kind];document.getElementById('title').textContent=title;document.getElementById('task').textContent=task.text;const p=document.createElement('p');p.textContent=message;document.getElementById('task').after(p);
 const choices=kind==='reminder'?[['ack','응, 챙길게!']]:kind==='start'?[['active','응, 시작했어!'],['hold','잠깐 보류할게']]:[['done','응, 끝냈어!'],['active','아직 진행 중이야'],['hold','보류할게']];
 for(const [status,label] of choices){const b=document.createElement('button');b.textContent=label;b.onclick=()=>window.todo.answer({id:task.id,status});document.getElementById('actions').append(b)}
});
