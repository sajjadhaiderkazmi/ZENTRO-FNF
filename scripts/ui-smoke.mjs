// Optional real-browser integration suite. Install playwright-core outside the repo,
// then set ZEN_PLAYWRIGHT_MODULE to its absolute module path and CHROMIUM_PATH.
import assert from 'node:assert/strict';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createApp} from '../server/app.mjs';
import {totp} from '../server/security.mjs';
const {chromium}=await import(process.env.ZEN_PLAYWRIGHT_MODULE?pathToFileURL(process.env.ZEN_PLAYWRIGHT_MODULE).href:'playwright-core');
const directory=await mkdtemp(path.join(os.tmpdir(),'zentro-ui-'));
const application=await createApp({directory,port:0});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const errors=[];let checks=0;
const pass=label=>{checks++;console.log('PASS '+label);};
const artifact=process.env.ZEN_UI_ARTIFACT_DIR;
async function call(context,url,method='GET',data){const s=await context.request.get(application.origin+'/api/session');const state=await s.json();const r=await context.request.fetch(application.origin+url,{method,data,headers:{Origin:application.origin,'X-CSRF-Token':state.csrf}});assert.ok(r.ok(),await r.text());return r.json();}
try{
 const password='Disposable browser fixture passphrase 2026!';
 await application.store.bootstrap({name:'Browser Fixture',identifier:'browser-owner',password});
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(application.origin);await page.locator('#login').waitFor();
 await page.locator('#f-identifier').fill('browser-owner');await page.locator('#f-password').fill(password);
 await page.getByRole('button',{name:'Show',exact:true}).click();assert.equal(await page.locator('#f-password').getAttribute('type'),'text');await page.getByRole('button',{name:'Hide',exact:true}).click();pass('Password visibility toggle preserves the password');
 await page.getByRole('button',{name:/^Sign in/}).click();await page.locator('#mfa').waitFor();
 const setup=await call(context,'/api/auth/mfa/setup');await page.locator('#f-code').fill(totp(setup.secret));await page.getByRole('button',{name:/Verify & continue/}).click();await page.locator('[data-action=company-new]').waitFor();await page.getByRole('button',{name:'I have saved these values'}).click();pass('Real Power login, MFA enrollment and recovery dialog');
 const company=await call(context,'/api/platform/company','POST',{name:'Browser Test Store',code:'browser-store',owner:'Browser Admin',email:'browser@example.invalid',adminUsername:'admin',expires:'2099-12-31',deviceLimit:3,userLimit:10});
 const admin=await browser.newContext({viewport:{width:1440,height:1000}});
 await call(admin,'/api/invitation/accept','POST',{invitationToken:company.ownerInvitationToken,activationKey:company.activationKey,password,deviceLabel:'Browser fixture counter'});
 const adminSetup=await call(admin,'/api/auth/mfa/setup');await call(admin,'/api/auth/mfa/verify','POST',{code:totp(adminSetup.secret)});
 const adminPage=await admin.newPage();adminPage.on('pageerror',e=>errors.push(e.message));await adminPage.goto(application.origin);await adminPage.locator('[data-route=inventory]').waitFor();
 const routes=['dashboard','pos','inventory','customers','sales','purchases','reports','team','barcodes','promotions','devices','branches','shifts','audit','settings'];
 for(const route of routes){await adminPage.locator(`[data-route=${route}]`).click();await adminPage.locator(`[data-route=${route}][aria-current=page]`).waitFor();assert.ok(await adminPage.locator('#main h1').textContent());}
 pass('All 15 administrator screens render against real HTTP/SQLite');
 await adminPage.locator('[data-route=inventory]').click();await adminPage.locator('[data-action=product-new]').click();
 for(const [name,value] of Object.entries({name:'Browser coffee',sku:'COFFEE-1',barcode:'COFFEE-1',cost:'60',price:'100',stock:'10'}))await adminPage.locator(`#f-${name}`).fill(value);
 await adminPage.locator('#product button[type=submit]').click();await adminPage.locator('#dialog').waitFor({state:'hidden'});await adminPage.getByText('Browser coffee',{exact:true}).waitFor();pass('Create product through the actual inventory form');
 await adminPage.keyboard.press('F2');await adminPage.locator('#search').fill('COFFEE-1');await adminPage.locator('#search').press('Enter');await adminPage.getByRole('button',{name:'Increase quantity of Browser coffee'}).click();await adminPage.locator('[data-action=checkout]').click();await adminPage.locator('#dialog-title').filter({hasText:'Sale receipt'}).waitFor();
 const workspace=await call(admin,'/api/workspace');assert.equal(workspace.sales.length,1);assert.equal(workspace.products[0].stock,8);assert.equal(workspace.sales[0].total,20000);pass('Scanner, quantity controls, checkout, receipt and durable stock deduction');
 await adminPage.locator('#dialog [data-action=close]').click();await adminPage.locator('[data-route=dashboard]').click();
 if(artifact){await mkdir(artifact,{recursive:true});await adminPage.screenshot({path:path.join(artifact,'desktop-dashboard.png'),fullPage:true});}
 await adminPage.setViewportSize({width:390,height:844});await adminPage.locator('[data-action=menu-open]').click();assert.equal(await adminPage.locator('[data-action=menu-open]').getAttribute('aria-expanded'),'true');await adminPage.keyboard.press('Escape');assert.equal(await adminPage.locator('[data-action=menu-open]').getAttribute('aria-expanded'),'false');assert.equal(await adminPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);pass('Mobile menu opens, Escape restores focus, no page overflow');
 if(artifact)await adminPage.screenshot({path:path.join(artifact,'mobile-dashboard.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.locator('[data-action=menu-open]').click();await page.locator('[data-action=logout]').click();await page.locator('#login').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);if(artifact)await page.screenshot({path:path.join(artifact,'mobile-login.png'),fullPage:true});pass('Real logout and mobile sign-in layout');
 assert.deepEqual(errors,[]);pass('No uncaught browser errors');
 console.log(`${checks}/${checks} browser integration groups passed.`);
}finally{await browser.close();await application.close();await rm(directory,{recursive:true,force:true});}
