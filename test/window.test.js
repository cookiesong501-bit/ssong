const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
test('frameless main window retains minimize, restore and close-to-tray behavior',async()=>{
 const handlers={},windows=[];let menu='unset';
 class Window{
  constructor(options){this.options=options;this.events={};this.maximized=false;this.webContents={send(){}};windows.push(this)}
  on(name,fn){this.events[name]=fn}loadFile(){}isDestroyed(){return false}isMaximized(){return this.maximized}maximize(){this.maximized=true}unmaximize(){this.maximized=false}minimize(){this.minimized=true}hide(){this.hidden=true}close(){this.events.close({preventDefault(){}})}
  static fromWebContents(sender){return windows.find(w=>w.webContents===sender)}
 }
 class Tray{setToolTip(){}setContextMenu(){}on(){}}
 const electron={app:{requestSingleInstanceLock:()=>true,on(){},whenReady:()=>Promise.resolve(),getPath:()=>'/tmp/mock-user-data',isPackaged:true,setLoginItemSettings(){}},BrowserWindow:Window,Tray,Menu:{setApplicationMenu:m=>menu=m,buildFromTemplate:t=>t},ipcMain:{on:(n,fn)=>handlers[n]=fn,handle(){}},nativeImage:{createFromPath(){}},powerMonitor:{on(){}},shell:{beep(){}}};
 const sandbox={__dirname:path.resolve('.'),process:{platform:'win32'},setInterval(){},require:name=>name==='electron'?electron:name==='./src/model'?require('../src/model'):name==='node:fs'?{readFileSync(){throw Object.assign(new Error('missing'),{code:'ENOENT'})}}:require(name)};
 vm.runInNewContext(fs.readFileSync('main.js','utf8'),sandbox);await new Promise(r=>setImmediate(r));
 const main=windows[0],event={sender:main.webContents};assert.equal(main.options.frame,false);assert.equal(menu,null);
 handlers['window-control'](event,'minimize');assert.equal(main.minimized,true);handlers['window-control'](event,'maximize');assert.equal(main.maximized,true);handlers['window-control'](event,'maximize');assert.equal(main.maximized,false);
 handlers['window-control']({sender:{}},'close');assert.equal(main.hidden,undefined);handlers['window-control'](event,'close');assert.equal(main.hidden,true);
});
