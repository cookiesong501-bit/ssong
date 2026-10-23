const {app,BrowserWindow,Tray,Menu,ipcMain,nativeImage,powerMonitor}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const model=require('./src/model');
let win,tray,tasks=[],alertWindow;let quitting=false,queue=[];
const file=()=>path.join(app.getPath('userData'),'tasks.json');
function persist(){fs.mkdirSync(app.getPath('userData'),{recursive:true});fs.writeFileSync(file()+'.tmp',JSON.stringify(tasks,null,2),'utf8');fs.renameSync(file()+'.tmp',file());}
function show(){if(win.isMinimized())win.restore();win.show();win.focus()}
function create(){win=new BrowserWindow({width:1220,height:820,minWidth:980,minHeight:680,backgroundColor:'#f5f6fa',webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false}});win.loadFile('src/index.html');win.on('close',e=>{if(!quitting){e.preventDefault();win.hide()}})}
function nextAlert(){if(alertWindow||!queue.length)return;const item=queue.shift(),task=tasks.find(t=>t.id===item.id);if(!task||['done','hold'].includes(task.status)){nextAlert();return}alertWindow=new BrowserWindow({width:440,height:310,resizable:false,alwaysOnTop:true,autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false}});alertWindow.loadFile('src/alert.html');alertWindow.webContents.once('did-finish-load',()=>alertWindow.webContents.send('alert-data',{task,kind:item.kind}));alertWindow.on('closed',()=>{alertWindow=null;nextAlert()})}
function check(){const due=model.due(tasks,new Date());for(const item of due){const t=tasks.find(t=>t.id===item.id);t[item.kind==='start'?'startNotified':'endNotified']=true;if(item.kind==='end')t.startNotified=true;queue.push(item)}if(due.length){persist();if(win)win.webContents.send('tasks-changed',tasks);nextAlert()}}
if(!app.requestSingleInstanceLock())app.quit();else{
app.on('second-instance',()=>{if(win)show()});app.whenReady().then(()=>{
 try{tasks=JSON.parse(fs.readFileSync(file(),'utf8'));if(!Array.isArray(tasks))throw Error('Invalid task file')}catch(e){if(e.code!=='ENOENT'){require('electron').dialog.showErrorBox('일정 파일을 읽을 수 없습니다','기존 파일을 보호하기 위해 앱을 종료합니다. '+e.message);app.quit();return}}
 create();tray=new Tray(nativeImage.createFromPath(path.join(__dirname,'src/icon.png')));tray.setToolTip('오늘의 할 일');tray.setContextMenu(Menu.buildFromTemplate([{label:'오늘의 할 일 열기',click:show},{type:'separator'},{label:'완전히 종료',click:()=>{quitting=true;app.quit()}}]));tray.on('click',show);
 if(process.platform==='win32'&&app.isPackaged)app.setLoginItemSettings({openAtLogin:true});
 setInterval(check,15000);powerMonitor.on('resume',check);check();
 });app.on('before-quit',()=>{quitting=true});app.on('window-all-closed',()=>{});
}
ipcMain.handle('load',()=>({tasks,autoStart:process.platform==='win32'?app.getLoginItemSettings().openAtLogin:false,packaged:app.isPackaged,platform:process.platform}));
ipcMain.handle('save',(_,data)=>{if(!Array.isArray(data)||data.some(t=>!t.id||!/^\d{4}-\d{2}-\d{2}$/.test(t.date)||!/^\d{2}:\d{2}$/.test(t.start)||!/^\d{2}:\d{2}$/.test(t.end)||t.start>=t.end||typeof t.text!=='string'||!['planned','active','done','hold'].includes(t.status)))throw Error('잘못된 일정입니다');tasks=data;persist();check();return tasks});
ipcMain.handle('autostart',(_,enabled)=>{if(process.platform!=='win32'||!app.isPackaged)return false;app.setLoginItemSettings({openAtLogin:!!enabled});return app.getLoginItemSettings().openAtLogin});
ipcMain.handle('answer',(event,{id,status})=>{if(!alertWindow||event.sender!==alertWindow.webContents||!['active','done','hold'].includes(status))return;const t=tasks.find(t=>t.id===id);if(t){t.status=status;persist();win.webContents.send('tasks-changed',tasks)}alertWindow.close()});
