for(const button of document.querySelectorAll('[data-window]')){
 button.addEventListener('click',()=>window.todo.windowControl(button.dataset.window));
}
if(window.todo.onWindowState)window.todo.onWindowState(maximized=>{
 const button=document.getElementById('maximize-window');
 if(!button)return;
 button.textContent=maximized?'❐':'□';
 button.title=maximized?'이전 크기로':'최대화';
 button.setAttribute('aria-label',button.title);
});
