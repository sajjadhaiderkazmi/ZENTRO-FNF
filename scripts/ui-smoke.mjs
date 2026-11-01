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
 let breakSession=true;await page.route('**/api/session',async route=>{if(breakSession){breakSession=false;await route.fulfill({status:502,contentType:'text/html',body:'Temporary gateway error'});}else await route.continue();});
 await page.goto(application.origin);await page.getByRole('button',{name:'Try connection again'}).waitFor();await page.getByRole('button',{name:'Try connection again'}).click();await page.locator('#login').waitFor();pass('Unreadable gateway response offers working reconnect without reloading');
 let loginRequests=0;await page.route('**/api/auth/login',async route=>{loginRequests++;await new Promise(resolve=>setTimeout(resolve,100));await route.continue();});
 await page.locator('#f-identifier').fill('browser-owner');await page.locator('#f-password').fill(password);
 await page.getByRole('button',{name:'Show',exact:true}).click();assert.equal(await page.locator('#f-password').getAttribute('type'),'text');await page.getByRole('button',{name:'Hide',exact:true}).click();pass('Password visibility toggle preserves the password');
 await page.locator('#login').evaluate(form=>{form.requestSubmit();form.requestSubmit();});await page.locator('#mfa').waitFor();
 assert.equal(loginRequests,1);pass('Repeated form submission sends only one login request');
 const setup=await call(context,'/api/auth/mfa/setup');await page.locator('#f-code').fill(totp(setup.secret));await page.getByRole('button',{name:/Verify & continue/}).click();await page.locator('[data-action=company-new]').waitFor();await page.getByRole('button',{name:'I have saved these values'}).click();pass('Real Power login, MFA enrollment and recovery dialog');
 const company=await call(context,'/api/platform/company','POST',{name:'Browser Test Store',code:'browser-store',owner:'Browser Admin',email:'browser@example.invalid',adminUsername:'admin',expires:'2099-12-31',deviceLimit:3,userLimit:10});
 const admin=await browser.newContext({viewport:{width:1440,height:1000}});
 await call(admin,'/api/invitation/accept','POST',{invitationToken:company.ownerInvitationToken,activationKey:company.activationKey,password,deviceLabel:'Browser fixture counter'});
 const adminSetup=await call(admin,'/api/auth/mfa/setup');await call(admin,'/api/auth/mfa/verify','POST',{code:totp(adminSetup.secret)});
 const adminPage=await admin.newPage();adminPage.on('pageerror',e=>errors.push(e.message));await adminPage.goto(application.origin);await adminPage.locator('[data-route=inventory]').waitFor();
 const routes=['dashboard','pos','inventory','customers','sales','purchases','reports','team','barcodes','promotions','devices','branches','shifts','audit','settings'];
 for(const route of routes){await adminPage.locator(`[data-route=${route}]`).click();await adminPage.locator(`[data-route=${route}][aria-current=page]`).waitFor();assert.ok(await adminPage.locator('#main h1').textContent());}
 pass('All 15 administrator screens render against real HTTP/SQLite');
 for(const [role,allowed] of Object.entries({manager:['dashboard','pos','inventory','customers','sales','purchases','reports','barcodes','promotions','shifts','audit'],inventory:['inventory','purchases','barcodes'],cashier:['pos','customers','sales','shifts']})){
  const invite=await call(admin,'/api/team/invite','POST',{name:'Browser '+role,identifier:role,role});const staff=await browser.newContext();await call(staff,'/api/invitation/accept','POST',{invitationToken:invite.invitationToken,password});const staffPage=await staff.newPage();staffPage.on('pageerror',e=>errors.push(e.message));await staffPage.goto(application.origin);await staffPage.locator(`[data-route=${allowed[0]}]`).waitFor();
  for(const target of allowed){await staffPage.locator(`[data-route=${target}]`).click();await staffPage.locator(`[data-route=${target}][aria-current=page]`).waitFor();}
  assert.equal(await staffPage.locator('[data-route=settings]').count(),0);assert.equal(await staffPage.locator('[data-route=power]').count(),0);await staff.close();
 }
 pass('Manager, inventory and cashier navigation renders only permitted screens');
 await adminPage.locator('[data-route=inventory]').click();await adminPage.locator('[data-action=product-new]').click();
 for(const [name,value] of Object.entries({name:'Browser coffee',sku:'COFFEE-1',barcode:'COFFEE-1',cost:'60',price:'100',stock:'10'}))await adminPage.locator(`#f-${name}`).fill(value);
 await adminPage.locator('#product button[type=submit]').click();await adminPage.locator('#dialog').waitFor({state:'hidden'});await adminPage.getByText('Browser coffee',{exact:true}).waitFor();pass('Create product through the actual inventory form');
 await adminPage.keyboard.press('F2');await adminPage.locator('#search').fill('COFFEE-1');await adminPage.locator('#search').press('Enter');await adminPage.getByRole('button',{name:'Increase quantity of Browser coffee'}).click();let failRefresh=true;await adminPage.route('**/api/workspace*',async route=>{if(failRefresh){failRefresh=false;await route.abort();}else await route.continue();});
 await adminPage.locator('[data-action=checkout]').click();await adminPage.locator('#dialog-title').filter({hasText:'Sale receipt'}).waitFor();
 await adminPage.getByRole('status').filter({hasText:'Your change was saved'}).waitFor();pass('Saved sale still opens receipt when follow-up refresh fails');
 const workspace=await call(admin,'/api/workspace');assert.equal(workspace.sales.length,1);assert.equal(workspace.products[0].stock,8);assert.equal(workspace.sales[0].total,20000);pass('Scanner, quantity controls, checkout, receipt and durable stock deduction');
 if(artifact){await mkdir(artifact,{recursive:true});await adminPage.screenshot({path:path.join(artifact,'checkout-recovery.png'),fullPage:true});}
 await adminPage.locator('#dialog [data-action=close]').click();await adminPage.locator('[data-action=refresh]').click();await adminPage.locator('#connection-status').waitFor({state:'hidden'});assert.equal((await call(admin,'/api/workspace')).sales.length,1);pass('Recovery refresh clears warning without duplicating the saved sale');
 await adminPage.evaluate(()=>dispatchEvent(new Event('offline')));await adminPage.locator('#connection-status').filter({hasText:'may be offline'}).waitFor();assert.equal(await adminPage.locator('[data-action=refresh]').isEnabled(),true);await adminPage.evaluate(()=>dispatchEvent(new Event('online')));await adminPage.locator('#connection-status').filter({hasText:'Use Refresh'}).waitFor();await adminPage.locator('[data-action=refresh]').click();await adminPage.locator('#connection-status').waitFor({state:'hidden'});pass('Offline/online hints preserve controls and require actual server verification');
 await adminPage.locator('[data-route=dashboard]').click();
 if(artifact){await mkdir(artifact,{recursive:true});await adminPage.screenshot({path:path.join(artifact,'desktop-dashboard.png'),fullPage:true});}
 await adminPage.setViewportSize({width:390,height:844});await adminPage.locator('[data-action=menu-open]').click();assert.equal(await adminPage.locator('[data-action=menu-open]').getAttribute('aria-expanded'),'true');await adminPage.keyboard.press('Escape');assert.equal(await adminPage.locator('[data-action=menu-open]').getAttribute('aria-expanded'),'false');assert.equal(await adminPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);pass('Mobile menu opens, Escape restores focus, no page overflow');
 if(artifact)await adminPage.screenshot({path:path.join(artifact,'mobile-dashboard.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.locator('[data-action=menu-open]').click();await page.locator('[data-action=logout]').click();await page.locator('#login').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);if(artifact)await page.screenshot({path:path.join(artifact,'mobile-login.png'),fullPage:true});pass('Real logout and mobile sign-in layout');
 assert.deepEqual(errors,[]);pass('No uncaught browser errors');
 console.log(`${checks}/${checks} browser integration groups passed.`);
}finally{await browser.close();await application.close();await rm(directory,{recursive:true,force:true});}
