import {createInterface} from 'node:readline/promises';
import {Writable} from 'node:stream';
import {stdin,stdout} from 'node:process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Store} from './store.mjs';
import {cleanText} from '../src/core.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(!stdin.isTTY)throw Error('Run bootstrap in an interactive terminal. Credentials must not be passed in command arguments.');
let muted=false;const output=new Writable({write(chunk,encoding,callback){if(!muted)stdout.write(chunk);callback();}}),rl=createInterface({input:stdin,output,terminal:true});
const ask=async(label,hidden=false)=>{stdout.write(label);muted=hidden;try{return await rl.question('');}finally{muted=false;if(hidden)stdout.write('\n');}};
const store=new Store(process.env.ZEN_DATA_DIR||path.join(root,'.zentro-data'));
try{const name=cleanText(await ask('Your name: '),80),identifier=cleanText(await ask('Power username: '),100).toLowerCase();if(!/^[a-z0-9_.@+\-]{3,100}$/.test(identifier))throw Error('Use 3–100 letters, numbers or . _ @ + - for your username.');const password=await ask('Password / passphrase (14–128 characters): ',true),confirmation=await ask('Repeat password: ',true);if(password!==confirmation)throw Error('Passwords do not match.');await store.bootstrap({name,identifier,password});console.log('Power Account created. Sign in without a company code. Your first login requires authenticator setup.');}finally{store.close();rl.close();}
