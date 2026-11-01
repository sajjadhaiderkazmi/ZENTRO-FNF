import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createBackup} from './backup.mjs';
import {passwordPolicy} from './security.mjs';

// One process owns this data directory. Backup failures are visible in server logs.
export function startBackups(store, options={}) {
 const passphrase=options.passphrase, log=options.log||console.log;
 if(!passphrase){log('Scheduled encrypted backups: disabled. Configure ZEN_BACKUP_PASSPHRASE and a separate backup directory.');return{stop:async()=>{}};}
 passwordPolicy(passphrase);
 const directory=path.resolve(options.directory||path.join(store.directory,'backups'));
 const hours=Number(options.hours??24);
 if(!Number.isFinite(hours)||hours<1||hours>168)throw Error('Backup interval must be between 1 and 168 hours.');
 let stopped=false,pending=null;
 const run=()=>{
  if(stopped||pending)return pending;
  pending=(async()=>{
   await mkdir(directory,{recursive:true,mode:0o700});
   const filename=`zentro-auto-${new Date().toISOString().replace(/[:.]/g,'-')}-${randomUUID()}.zentrobackup`;
   await createBackup(store,passphrase,path.join(directory,filename));
   log('Scheduled encrypted backup completed.');
  })().catch(()=>log('ERROR: Scheduled encrypted backup failed. Check storage space, permissions and configuration.')).finally(()=>{pending=null;});
  return pending;
 };
 const timer=setInterval(run,hours*3600000);timer.unref();
 log(`Scheduled encrypted backups: enabled every ${hours} hours; first backup starting.`);
 run();
 return{stop:async()=>{stopped=true;clearInterval(timer);await pending;}};
}
