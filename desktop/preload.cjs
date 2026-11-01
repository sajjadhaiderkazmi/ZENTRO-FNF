'use strict';
const {contextBridge,ipcRenderer}=require('electron');
const isLocal=process.argv.includes('--zentro-local=1');
contextBridge.exposeInMainWorld('zentroDesktop',Object.freeze({isLocal,listPrinters:()=>ipcRenderer.invoke('zentro:printers'),print:options=>ipcRenderer.invoke('zentro:print',{format:options.format,printer:options.printer}),bootstrap:isLocal?(payload)=>ipcRenderer.invoke('zentro:bootstrap',{name:payload.name,identifier:payload.identifier,password:payload.password}):undefined}));
