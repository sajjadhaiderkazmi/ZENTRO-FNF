'use strict';
const {contextBridge,ipcRenderer}=require('electron');
const isLocal=process.argv.includes('--zentro-local=1');
contextBridge.exposeInMainWorld('zentroDesktop',Object.freeze({isLocal,bootstrap:isLocal?(payload)=>ipcRenderer.invoke('zentro:bootstrap',{name:payload.name,identifier:payload.identifier,password:payload.password}):undefined}));
