const {app,BrowserWindow,Tray,Menu,ipcMain,nativeImage,powerMonitor,shell}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const model=require('./src/model');
let win,tray,tasks=[],reminders=[],alertWindow;let quitting=false,queue=[];
const file=()=>path.join(app.getPath('userData'),'tasks.json');
function persist(){fs.mkdirSync(app.getPath('userData'),{recursive:true});fs.writeFileSync(file()+'.tmp',JSON.stringify(tasks,null,2),'utf8');fs.renameSync(file()+'.tmp',file());}
const reminderFile=()=>path.join(app.getPath('userData'),'reminders.json');
function persistReminders(){fs.writeFileSync(reminderFile()+'.tmp',JSON.stringify(reminders,null,2),'utf8');fs.renameSync(reminderFile()+'.tmp',reminderFile())}
function show(){if(win.isMinimized())win.restore();win.show();win.focus()}
function create(){win=new BrowserWindow({width:1220,height:820,minWidth:980,minHeight:680,frame:false,autoHideMenuBar:true,backgroundColor:'#f5efe5',webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false}});win.on('maximize',()=>win.webContents.send('window-state',true));win.on('unmaximize',()=>win.webContents.send('window-state',false));win.loadFile('src/index.html');win.on('close',e=>{if(!quitting){e.preventDefault();win.hide()}})}
function nextAlert(){
 if(alertWindow||!queue.length)return;
 const item=queue.shift(),task=(item.kind==='reminder'?reminders:tasks).find(t=>t.id===item.id);
 if(!task||(item.kind==='reminder'?!task.active:['done','hold'].includes(task.status))||(item.kind==='warning'&&Date.now()>=model.bounds(task).end.getTime())||(item.kind==='start'&&Date.now()>=model.bounds(task).end.getTime())){nextAlert();return}
 alertWindow=new BrowserWindow({width:480,height:400,resizable:false,alwaysOnTop:true,frame:false,autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,autoplayPolicy:'no-user-gesture-required'}});
 alertWindow.webContents.once('did-finish-load',()=>{alertWindow.webContents.send('alert-data',{task,...item})});
 alertWindow.loadFile('src/alert.html');
 alertWindow.on('closed',()=>{alertWindow=null;nextAlert()});
}
function check(){
 const now=new Date(),due=model.due(tasks,now);
 for(const item of due){const t=tasks.find(t=>t.id===item.id);t[{start:'startNotified',warning:'warningNotified',end:'endNotified'}[item.kind]]=true;if(item.kind==='end'){t.startNotified=true;t.warningNotified=true}queue.push(item)}
 if(due.length){persist();if(win)win.webContents.send('tasks-changed',tasks)}
 const alarms=model.reminderDue(reminders,now.getTime());
 for(const item of alarms){const r=reminders.find(r=>r.id===item.id);r.fired=item.number;r.nextAt=item.nextAt;queue.push(item)}
 if(alarms.length){persistReminders();if(win)win.webContents.send('reminders-changed',reminders)}
 nextAlert();
}
if(!app.requestSingleInstanceLock())app.quit();else{
app.on('second-instance',()=>{if(win)show()});app.whenReady().then(()=>{
 try{tasks=JSON.parse(fs.readFileSync(file(),'utf8'));if(!Array.isArray(tasks))throw Error('Invalid task file')}catch(e){if(e.code!=='ENOENT'){require('electron').dialog.showErrorBox('일정 파일을 읽을 수 없습니다','기존 파일을 보호하기 위해 앱을 종료합니다. '+e.message);app.quit();return}}
 try{reminders=JSON.parse(fs.readFileSync(reminderFile(),'utf8'));if(!Array.isArray(reminders)||!reminders.every(model.validReminder))throw Error('Invalid reminder file')}catch(e){if(e.code!=='ENOENT'){require('electron').dialog.showErrorBox('알람 파일을 읽을 수 없습니다',e.message);app.quit();return}}
 Menu.setApplicationMenu(null);
 create();tray=new Tray(nativeImage.createFromPath(path.join(__dirname,'src/icon.png')));tray.setToolTip('오늘의 할 일');tray.setContextMenu(Menu.buildFromTemplate([{label:'오늘의 할 일 열기',click:show},{type:'separator'},{label:'완전히 종료',click:()=>{quitting=true;app.quit()}}]));tray.on('click',show);
 if(process.platform==='win32'&&app.isPackaged)app.setLoginItemSettings({openAtLogin:true});
 setInterval(check,1000);powerMonitor.on('resume',check);check();
 });app.on('before-quit',()=>{quitting=true});app.on('window-all-closed',()=>{});
}
ipcMain.handle('load',()=>({tasks,reminders,autoStart:process.platform==='win32'?app.getLoginItemSettings().openAtLogin:false,packaged:app.isPackaged,platform:process.platform}));
ipcMain.handle('save',(_,data)=>{
 if(!Array.isArray(data)||!data.every(model.validTask))throw Error('잘못된 일정입니다');
 tasks=data.map(t=>{const old=tasks.find(x=>x.id===t.id);if(old&&old.date===t.date&&old.start===t.start&&old.end===t.end&&!!old.endNextDay===!!t.endNextDay)return {...t,startNotified:old.startNotified,warningNotified:old.warningNotified,endNotified:old.endNotified};return t});
 persist();check();return tasks;
});
ipcMain.handle('add-reminder',(_,data)=>{
 const r={id:require('node:crypto').randomUUID(),text:String(data.text||'잠깐 쉬어 가요').slice(0,200),interval:data.interval,count:data.count,fired:0,nextAt:Date.now()+data.interval*60000,active:true};
 if(!model.validReminder(r))throw Error('간격은 1~1440분, 횟수는 1~5회로 지정해 주세요.');
 reminders.push(r);persistReminders();return reminders;
});
ipcMain.handle('remove-reminder',(_,id)=>{reminders=reminders.filter(r=>r.id!==id);persistReminders();return reminders});
ipcMain.handle('autostart',(_,enabled)=>{if(process.platform!=='win32'||!app.isPackaged)return false;app.setLoginItemSettings({openAtLogin:!!enabled});return app.getLoginItemSettings().openAtLogin});
ipcMain.handle('answer',(event,{id,status})=>{if(!alertWindow||event.sender!==alertWindow.webContents||!['active','done','hold','ack'].includes(status))return;if(status==='ack'){alertWindow.close();return}const t=tasks.find(t=>t.id===id);if(t){t.status=status;persist();win.webContents.send('tasks-changed',tasks)}alertWindow.close()});

ipcMain.on('sound-fallback',event=>{if(alertWindow&&event.sender===alertWindow.webContents)shell.beep()});

ipcMain.on('window-control',(event,action)=>{
 const target=BrowserWindow.fromWebContents(event.sender);
 if(!target||(target!==win&&target!==alertWindow))return;
 if(action==='close')target.close();
 else if(target===win&&action==='minimize')target.minimize();
 else if(target===win&&action==='maximize'){if(target.isMaximized())target.unmaximize();else target.maximize()}
 if(target===win&&!target.isDestroyed())target.webContents.send('window-state',target.isMaximized());
});
