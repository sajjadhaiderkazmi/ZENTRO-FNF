// Actual v0.2 API inventory. Re-run after API changes; no proposed /api/v1 routes.
import {writeFile} from 'node:fs/promises';
import {privileges} from '../server/business.mjs';
const route=(method,path,access,request={},notes='')=>({method,path,access,request,notes});
const endpoints=[
 route('GET','/api/session','public',{},'Returns csrf, authenticated/stage and public user when authenticated; creates an anonymous session if necessary.'),
 route('POST','/api/auth/login','anonymous/session',{companyCode:'string; empty for Power',identifier:'string',password:'private string'},'Returns stage authenticated, mfa_enroll or mfa_verify and rotated csrf.'),
 route('GET','/api/auth/mfa/setup','password-verified mfa_enroll',{},'Private manual setup secret and otpauth URI; no QR rendering.'),
 route('POST','/api/auth/mfa/verify','mfa_enroll or mfa_verify',{code:'TOTP code or one-time recovery code'},'Returns authenticated stage; enrollment additionally returns recoveryCodes once.'),
 route('POST','/api/auth/logout','session',{}),
 route('POST','/api/invitation/accept','anonymous/session',{invitationToken:'single-use secret',activationKey:'required for owner only',password:'14-128 characters',deviceLabel:'optional owner terminal name'},'Owner requires both independent invitation and active activation key; staff invitation needs no activation key.'),
 route('GET','/api/workspace','company member',{branchId:'optional allowed branch ID'},'Revisioned snapshot. Sales/purchases latest 200; audit latest 150; costs/profit filtered by role; branch assignments checked.'),
 route('GET','/api/sales','admin/manager/cashier',{branchId:'optional allowed branch ID',q:'invoice/cashier search, optional',page:'1-based integer',limit:'1-100; default 50'},'Returns {sales,page,limit,total}. Cashier sees only own sales; cost redacted.'),
 route('GET','/api/report','admin/manager',{branchId:'optional allowed branch ID',from:'optional YYYY-MM-DD',to:'optional YYYY-MM-DD'},'Full-history report. Monetary output is integer minor units.'),
 route('POST','/api/command','company role per action',{action:'command name',data:'command payload below'},'Requires Idempotency-Key: 16-100 URL-safe letters/digits/underscore/hyphen. Same actor/action/payload replay returns stored result, with current branch/role restrictions. Response {ok,result,revision,replayed?}.'),
 route('GET','/api/team','admin',{},'Public user fields and branchIds; no password hashes/secrets.'),
 route('POST','/api/team/invite','admin',{name:'string',identifier:'username',role:'admin|manager|inventory|cashier',branchIds:'optional array; [] defaults non-admin to main branch'},'Returns invitationToken once, companyCode, identifier, expiresInHours=24. Does not send email.'),
 route('POST','/api/team/update','admin',{id:'same-company user ID',role:'optional role',active:'optional boolean',branchIds:'optional array'},'Last active admin protected. Revoke all target sessions after update.'),
 route('GET','/api/devices','admin',{},'Returns registered device metadata and current device ID; no token digests.'),
 route('POST','/api/devices/enroll','admin',{activationKey:'private active key',label:'terminal label'},'Sets HttpOnly zentro_device cookie; device limit checked.'),
 route('POST','/api/devices/release','admin',{id:'same-company device ID'},'Revokes device and bound sessions.'),
 route('GET','/api/platform','power',{},'Company/license/device metadata and latest platform audit; no business workspaces or full activation secrets.'),
 route('POST','/api/platform/company','power',{name:'string',code:'unique lowercase slug 3-32 characters',owner:'string',email:'owner email',adminUsername:'username; default admin',plan:'label',expires:'YYYY-MM-DD',deviceLimit:'1-1000',userLimit:'1-10000'},'201 returns companyId/companyCode/adminUsername/activationKey/ownerInvitationToken/24h invitation expiry. No default password.'),
 route('POST','/api/platform/company/update','power',{id:'company ID',status:'optional active|suspended',expires:'optional YYYY-MM-DD',deviceLimit:'optional integer',userLimit:'optional integer'},'Renewal updates active license expiry. Cannot reduce limits below active usage. Suspension revokes sessions.'),
 route('POST','/api/platform/license','power',{companyId:'company ID'},'Replaces key; returns full new activationKey once, revokes old keys.'),
 route('POST','/api/platform/license/revoke','power',{id:'license ID'},'No active license means business writes stop, reads remain.'),
 route('GET','/api/export','admin/manager; inventory role for inventory kind only',{kind:'inventory|sales|report',branchId:'optional allowed branch ID',from:'report date only',to:'report date only'},'CSV attachment, formula-leading input protected. Sales exports full selected branch history, not just latest 200. Monetary values in minor units.')
];
const payloads={
 'product.save':{id:'optional; edit only',expectedRevision:'required on edit',name:'text',sku:'unique identifier',barcode:'Code39-compatible identifier',category:'text',unit:'text',cost:'major-unit decimal string',price:'positive major-unit decimal string',stock:'opening integer only',low:'nonnegative integer'},
 'product.archive':{id:'product ID; toggles archive/restore'},
 'stock.adjust':{productId:'ID',stock:'counted nonnegative integer',reason:'text',expectedRevision:'workspace revision'},
 'purchase.receive':{productId:'ID',qty:'positive integer',cost:'unit purchase cost major decimal',supplier:'supplier text'},
 'customer.save':{id:'optional for edit',name:'text',phone:'unique same-company phone',city:'optional text'},
 'customer.archive':{id:'customer ID; must have zero balance'},
 'customer.collect':{id:'customer ID',amount:'positive major-unit decimal <= outstanding',method:'cash|card|bank'},
 'sale.complete':{lines:'[{productId,qty,free?:boolean}]',discountBps:'0-10000; admin/manager for nonzero',method:'cash|card|bank|credit',tendered:'cash major-unit decimal string',customerId:'required for credit; optional otherwise'},
 'sale.return':{saleId:'ID',reason:'text',lines:'[{index:original item index,qty,disposition:resellable|damaged|discarded}]',method:'cash|card|bank|customer_credit'},
 'sale.exchange':{saleId:'non-credit original sale ID',reason:'text',lines:'same return lines as sale.return',newSale:'{lines,discountBps,customerId?}',tendered:'cash difference received, major-unit decimal'},
 'expense.create':{description:'text',amount:'positive major-unit decimal string',method:'cash|card|bank'},
 'settings.save':{name:'store text',address:'text',phone:'text',tax:'0-30 percentage decimal string',timezone:'IANA zone',receiptNote:'text'},
 'promotion.save':{id:'optional existing offer ID',name:'text',buyProductId:'ID',buyQty:'1-1000',freeProductId:'ID',freeQty:'1-1000',start:'YYYY-MM-DD',end:'YYYY-MM-DD'},
 'promotion.archive':{id:'offer ID'},
 'branch.create':{name:'unique company branch name'},
 'shift.open':{opening:'nonnegative major-unit decimal string'},
 'shift.close':{id:'open shift ID',counted:'nonnegative major-unit decimal string'}
};
const inventory={name:'Zentro - POS',version:'0.2.0',format:'API inventory (not a complete OpenAPI schema)',basePath:'/api',cookies:['zentro_session','zentro_device'],mutationHeaders:{Origin:'exact configured origin','X-CSRF-Token':'from /api/session','Content-Type':'application/json'},errorShape:{error:{code:'HTTP_<status>',message:'public error text',requestId:'UUID'}},notes:['Server infers company/user from session, never from client companyId.','Money inputs are major-unit decimal strings; stored/output money is integer minor units.','All business command payloads optionally include branchId; current access is checked even on idempotent replay.','No /api/v1, public bootstrap, sync, offline lease or payment-gateway endpoints are implemented.'],endpoints,commands:Object.fromEntries(Object.entries(privileges).map(([name,roles])=>[name,{roles,payload:{...payloads[name],branchId:'optional permitted branch ID'}}]))};
await writeFile(new URL('../docs/API_CONTRACT.json',import.meta.url),JSON.stringify(inventory,null,2)+'\n');
console.log(`Wrote ${endpoints.length} actual API route entries and ${Object.keys(privileges).length} command payloads.`);
