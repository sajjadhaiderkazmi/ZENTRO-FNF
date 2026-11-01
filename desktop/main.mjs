import {app,BrowserWindow,dialog,ipcMain,session as electronSession,shell} from 'electron';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createApp} from '../server/app.mjs';
import {startBackups} from '../server/scheduler.mjs';
import {printerRequest} from './printer-policy.mjs';
import {cleanText} from '../src/core.mjs';
app.setName('Zentro - POS');app.enableSandbox();
if(!app.requestSingleInstanceLock())app.quit();
let localServer=null,window=null,backups=null,quitting=false;
app.whenReady().then(async()=>{
const dir=path.dirname(fileURLToPath(import.meta.url)),config=JSON.parse(await readFile(path.join(dir,'desktop-config.json'),'utf8'));
const local=process.env.ZENTRO_LOCAL_SERVER==='1'||config.mode==='local';
let origin;
if(local){localServer=await createApp({directory:path.join(app.getPath('userData'),'server'),port:0,host:'127.0.0.1'});origin=localServer.origin;backups=startBackups(localServer.store,{passphrase:process.env.ZEN_BACKUP_PASSPHRASE,directory:process.env.ZEN_BACKUP_DIR,hours:process.env.ZEN_BACKUP_INTERVAL_HOURS});}
else{const configured=process.env.ZENTRO_SERVER_URL||config.serverUrl;try{const url=new URL(configured);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('Invalid server URL');origin=url.origin;}catch{dialog.showErrorBox('Configure Zentro - POS','Set your HTTPS server URL in desktop/desktop-config.json before building the company installer. For a standalone local installation, set mode to local.');app.quit();}}
if(origin){
 electronSession.defaultSession.setPermissionRequestHandler((_webContents,_permission,callback)=>callback(false));
 electronSession.defaultSession.setPermissionCheckHandler(()=>false);
 window=new BrowserWindow({width:1440,height:960,minWidth:390,minHeight:600,title:'Zentro - POS',backgroundColor:'#f5f6fa',autoHideMenuBar:true,webPreferences:{preload:path.join(dir,'preload.cjs'),additionalArguments:[`--zentro-local=${local?'1':'0'}`],nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,allowRunningInsecureContent:false,devTools:!app.isPackaged}});
 window.webContents.on('will-navigate',(event,url)=>{if(url==='mailto:sajjadhaiderconnect@gmail.com'){event.preventDefault();shell.openExternal(url);return;}try{if(new URL(url).origin!==origin)event.preventDefault();}catch{event.preventDefault();}});
 window.webContents.on('will-attach-webview',event=>event.preventDefault());
 window.webContents.setWindowOpenHandler(({url})=>{if(url==='mailto:sajjadhaiderconnect@gmail.com')shell.openExternal(url);return{action:'deny'};});
 const trusted=event=>{if(event.sender!==window.webContents||event.senderFrame!==window.webContents.mainFrame||new URL(event.senderFrame.url).origin!==origin)throw Error('Untrusted caller.');};
 ipcMain.handle('zentro:printers',async event=>{trusted(event);return(await window.webContents.getPrintersAsync()).map(p=>({name:p.name,displayName:p.displayName||p.name,isDefault:p.isDefault,status:p.status}));});
 ipcMain.handle('zentro:print',async(event,payload)=>{trusted(event);const options=printerRequest(payload,await window.webContents.getPrintersAsync());return await new Promise((resolve,reject)=>window.webContents.print(options,(success,reason)=>success?resolve({queued:true}):reject(Error(reason||'Print cancelled or unavailable.'))));});
 if(local)ipcMain.handle('zentro:bootstrap',async(event,payload)=>{
  if(event.sender!==window.webContents||event.senderFrame!==window.webContents.mainFrame||new URL(event.senderFrame.url).origin!==origin)throw Error('Untrusted caller.');
  if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('Invalid setup request.');
  const name=cleanText(payload.name,80),identifier=cleanText(payload.identifier,100).toLowerCase();if(!/^[a-z0-9_.@+\-]{3,100}$/.test(identifier))throw Error('Use a valid username.');
  await localServer.store.bootstrap({name,identifier,password:payload.password});return{ok:true};
 });
 try{await window.loadURL(origin);}catch{dialog.showErrorBox('Zentro server unavailable','The configured server could not be reached. Check your internet connection and server URL, then reopen Zentro.');app.quit();}
 app.on('second-instance',()=>{if(window?.isMinimized())window.restore();window?.focus();});
}
}).catch(error=>{console.error('Desktop startup failed:',error.message);dialog.showErrorBox('Zentro startup failed',error.message||'The desktop application could not start.');app.quit();});
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',event=>{if(localServer&&!quitting){event.preventDefault();quitting=true;(async()=>{await backups?.stop();await localServer.close();localServer=null;app.quit();})();}});
