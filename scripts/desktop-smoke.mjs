import assert from 'node:assert/strict';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {totp} from '../server/security.mjs';
const {chromium}=await import(process.env.ZEN_PLAYWRIGHT_MODULE?pathToFileURL(process.env.ZEN_PLAYWRIGHT_MODULE).href:'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),directory=await mkdtemp(path.join(tmpdir(),'zentro-native-'));
const child=spawn(path.join(root,'desktop/node_modules/electron/dist/electron'),[root,'--no-sandbox','--remote-debugging-port=0'],{env:{...process.env,ZENTRO_LOCAL_SERVER:'1',XDG_CONFIG_HOME:directory},stdio:['ignore','ignore','pipe']});
let native;
try{
 const endpoint=await new Promise((resolve,reject)=>{let output='';const timeout=setTimeout(()=>reject(Error('Native startup timed out')),30000);child.once('error',reject);child.stderr.on('data',chunk=>{output+=chunk;if(String(chunk).includes('Desktop startup failed'))console.error(String(chunk));const match=output.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timeout);resolve(match[1]);}});child.once('exit',code=>{clearTimeout(timeout);reject(Error('Electron exited before startup: '+code));});});
 console.log('Native debugging endpoint ready');native=await chromium.connectOverCDP(endpoint,{timeout:15000});console.log('Native browser connected');
 const context=native.contexts()[0];let page=context.pages()[0];if(!page)page=await context.waitForEvent('page');console.log('Native window URL:',page.url());await page.waitForURL(url=>url.hostname==='127.0.0.1',{timeout:15000});await page.waitForLoadState('domcontentloaded');

 await page.locator('[data-action=auth-bootstrap]').click();
 await page.locator('#f-name').fill('Native Test Owner');await page.locator('#f-identifier').fill('native-owner');await page.locator('#f-password').fill('Disposable native fixture passphrase 2026!');await page.locator('#native-bootstrap button[type=submit]').click();await page.locator('#login').waitFor();
 await page.locator('#f-identifier').fill('native-owner');await page.locator('#f-password').fill('Disposable native fixture passphrase 2026!');await page.locator('#login button[type=submit]').click();await page.locator('#mfa').waitFor();
 const secret=await page.locator('.secret-panel').textContent();await page.locator('#f-code').fill(totp(secret.trim()));await page.locator('#mfa button[type=submit]').click();await page.locator('[data-action=company-new]').waitFor();await page.getByRole('button',{name:'I have saved these values'}).click();
 assert.equal(await page.evaluate(()=>typeof window.require),'undefined');assert.equal(await page.evaluate(()=>window.zentroDesktop.isLocal),true);console.log('PASS Native Electron local setup, login, mandatory MFA and context isolation');
 await page.locator('[data-route=hardware]').click();await page.locator('[data-action=detect-printers]').click();const printers=await page.evaluate(()=>window.zentroDesktop.listPrinters());assert.ok(Array.isArray(printers));console.log(`PASS Native printer enumeration IPC returned ${printers.length} installed printer(s)`);
 const rejected=await page.evaluate(async()=>{try{await window.zentroDesktop.print({format:'thermal80',printer:'NOT-AN-INSTALLED-PRINTER'});return false;}catch{return true;}});assert.equal(rejected,true);console.log('PASS Native print bridge rejects an uninstalled printer without queuing a job');
 if(process.env.ZEN_UI_ARTIFACT_DIR){await mkdir(process.env.ZEN_UI_ARTIFACT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.ZEN_UI_ARTIFACT_DIR,'native-electron-hardware.png'),fullPage:true});}
 console.log('3/3 native Electron integration groups passed on Linux; this is not a Windows installation test.');
}finally{await native?.close();child.kill();await new Promise(resolve=>{if(child.exitCode!==null)resolve();else{child.once('exit',resolve);setTimeout(resolve,3000);}});await rm(directory,{recursive:true,force:true});}
