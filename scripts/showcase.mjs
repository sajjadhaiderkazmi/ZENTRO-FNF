// Generate reproducible screenshots/PDFs using real backend requests and disposable data.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createApp} from '../server/app.mjs';
import {totp} from '../server/security.mjs';
const {chromium}=await import(process.env.ZEN_PLAYWRIGHT_MODULE?pathToFileURL(process.env.ZEN_PLAYWRIGHT_MODULE).href:'playwright-core');
const out=process.env.ZEN_UI_ARTIFACT_DIR||path.resolve('release/showcase');await mkdir(out,{recursive:true});
const directory=await mkdtemp(path.join(tmpdir(),'zentro-showcase-')),server=await createApp({directory,port:0});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
async function call(c,url,method='GET',data){const state=await(await c.request.get(server.origin+'/api/session')).json();const r=await c.request.fetch(server.origin+url,{method,data,headers:{Origin:server.origin,'X-CSRF-Token':state.csrf,'Idempotency-Key':randomUUID()}});assert.ok(r.ok(),await r.text());return r.json();}
const snap=async(p,name)=>{await p.screenshot({path:path.join(out,name+'.png'),fullPage:true});console.log('Screenshot: '+name);};
try{
 const password='Disposable showcase fixture passphrase 2026!';await server.store.bootstrap({name:'Sajjad · Platform Owner',identifier:'showcase-power',password});
 const power=await browser.newContext({viewport:{width:1440,height:1000}});
 await call(power,'/api/auth/login','POST',{identifier:'showcase-power',password});let setup=await call(power,'/api/auth/mfa/setup');await call(power,'/api/auth/mfa/verify','POST',{code:totp(setup.secret)});
 let company;for(const [code,name,owner] of [['zentro-mart','Zentro Mart · Islamabad','Ayesha Khan'],['city-grocers','City Grocers · Lahore','Ali Raza'],['daily-essentials','Daily Essentials · Karachi','Sara Ahmed']]){const c=await call(power,'/api/platform/company','POST',{name,code,owner,email:code+'@example.invalid',adminUsername:'admin',expires:'2027-12-31',deviceLimit:5,userLimit:20});company??=c;}
 const pp=await power.newPage();await pp.goto(server.origin);await pp.locator('[data-action=company-new]').waitFor();await snap(pp,'power-console');
 const admin=await browser.newContext({viewport:{width:1440,height:1000}});await call(admin,'/api/invitation/accept','POST',{invitationToken:company.ownerInvitationToken,activationKey:company.activationKey,password,deviceLabel:'Counter 01'});setup=await call(admin,'/api/auth/mfa/setup');await call(admin,'/api/auth/mfa/verify','POST',{code:totp(setup.secret)});
 const ws=await call(admin,'/api/workspace'),branchId=ws.branch.id;
 const cmd=(action,data)=>call(admin,'/api/command','POST',{action,data:{...data,branchId}});
 await cmd('settings.save',{...ws.settings,name:'Zentro Mart',address:'F-10 Markaz, Islamabad',phone:'051-000-0000',tax:'0',timezone:'Asia/Karachi',receiptNote:'Thank you for shopping local. See you again!'});
 for(const [name,sku,category,price,cost,stock,low] of [['Fresh Milk · 1 litre','MILK-001','Groceries','280','230',45,10],['Whole Wheat Bread','BREAD-002','Groceries','220','160',18,8],['Premium Basmati Rice · 1kg','RICE-003','Groceries','480','360',32,10],['Green Tea · 25 bags','TEA-004','Groceries','680','420',6,8],['Organic Honey · 250g','HONEY-005','Groceries','1450','950',16,5],['Hydrating Face Wash','FACE-006','Personal care','890','480',24,6],['Ceramic Coffee Mug','MUG-007','Home & living','750','410',4,5],['Classic Notebook','BOOK-008','Stationery','450','210',58,12],['USB-C Charging Cable','USB-009','Electronics','950','500',12,5]])await cmd('product.save',{name,sku,barcode:sku,category,price,cost,stock,low,unit:'pcs'});
 await cmd('customer.save',{name:'Hassan Ahmed',phone:'0300-0000001',city:'Islamabad'});
 const products=(await call(admin,'/api/workspace')).products;
 for(let i=0;i<6;i++)await cmd('sale.complete',{lines:[{productId:products[i].id,qty:i%2+1,free:false}],discountBps:0,method:'cash',tendered:'5000',customerId:''});
 const ap=await admin.newPage();ap.on('pageerror',e=>{throw e;});await ap.goto(server.origin);await ap.locator('[data-route=inventory]').waitFor();await snap(ap,'admin-dashboard');
 for(const [route,name]of [['inventory','admin-inventory'],['reports','admin-reports'],['hardware','printer-scanner-setup']]){await ap.locator(`[data-route=${route}]`).click();await ap.locator(`[data-route=${route}][aria-current=page]`).waitFor();await snap(ap,name);}
 await ap.locator('#scanner-test').fill('ZEN-TEST-001');await ap.locator('#scanner-test').press('Enter');await ap.locator('#scanner-result').filter({hasText:'Enter suffix confirmed'}).waitFor();
 for(const format of ['thermal80','thermal58','a4']){await ap.locator('#paper-format').selectOption(format);await ap.waitForFunction(()=>!!document.getElementById('paper-stylesheet').sheet);await ap.locator('[data-action=test-receipt]').click();await ap.locator('.receipt').waitFor();await ap.locator('#dialog').evaluate(d=>d.classList.add('printing'));await ap.pdf({path:path.join(out,`printer-test-${format}.pdf`),preferCSSPageSize:true,printBackground:true});await ap.locator('#dialog').evaluate(d=>d.classList.remove('printing'));await ap.locator('#dialog [data-action=close]').click();}
 await ap.locator('#paper-format').selectOption('thermal80');
 const invitation=await call(admin,'/api/team/invite','POST',{name:'Bilal · Counter 01',identifier:'cashier',role:'cashier'}),cashier=await browser.newContext({viewport:{width:1440,height:1000}});
 await call(cashier,'/api/invitation/accept','POST',{invitationToken:invitation.invitationToken,password});const cp=await cashier.newPage();await cp.goto(server.origin);await cp.locator('[data-action=add-cart]').first().waitFor();
 await cp.locator('#search').fill('MILK-001');await cp.locator('#search').press('Enter');await cp.locator('#search').fill('BREAD-002');await cp.locator('#search').press('Enter');await snap(cp,'shopkeeper-pos');
 await cp.setViewportSize({width:390,height:844});await snap(cp,'shopkeeper-mobile');
 await writeFile(path.join(out,'SHOWCASE-NOTES.txt'),'Screenshots use real Zentro backend/SQLite requests with synthetic sample records in a disposable database. Desktop-size Chromium views, not screenshots of an installed Windows EXE. Printer PDFs validate layout only, not physical printer/scanner operation.\n');
 console.log('All showcase screenshots, scanner suffix check and three receipt PDFs generated.');
}finally{await browser.close();await server.close();await rm(directory,{recursive:true,force:true});}
