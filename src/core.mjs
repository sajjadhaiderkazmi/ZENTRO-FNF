// Shared, deterministic business rules. No UI, storage or authentication code.
export const ROLES = Object.freeze({
  admin: ['dashboard','pos','inventory','customers','sales','purchases','reports','team','barcodes','audit','settings'],
  manager: ['dashboard','pos','inventory','customers','sales','purchases','reports','barcodes','audit'],
  inventory: ['inventory','purchases','barcodes'],
  cashier: ['pos','customers','sales'],
  power: ['power','settings']
});
export const ROLE_NAMES = {admin:'Company Admin',manager:'Manager',inventory:'Inventory Maintainer',cashier:'Cashier',power:'Power Account'};
export function can(role, route) { return !!ROLES[role]?.includes(route); }
export function escapeHTML(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
export function cleanText(value, max = 160) {
  const text = String(value ?? '').trim();
  if (!text || text.length > max || /[\u0000-\u001f\u007f]/.test(text)) throw new Error(`Enter valid text (1–${max} characters).`);
  return text;
}
export function moneyToMinor(value) {
  const str = String(value ?? '').trim();
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(str)) throw new Error('Enter a positive amount with up to two decimal places.');
  const [whole, fraction=''] = str.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2,'0'));
}
export function integer(value, min=0, max=1000000) {
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value)<min || Number(value)>max) throw new Error(`Enter a whole number from ${min} to ${max}.`);
  return Number(value);
}
export function scope(records, companyId) { return records.filter(r => r.companyId === companyId); }
export function findScoped(records, id, companyId) {
  const row = records.find(r => r.id === id && r.companyId === companyId);
  if (!row) throw new Error('Record not found in this company.');
  return row;
}
export function permitted(role, operation) {
  const map = {product:['admin','manager','inventory'],stock:['admin','manager','inventory'],customer:['admin','manager','cashier'],sale:['admin','manager','cashier'],discount:['admin','manager'],free:['admin','manager'],refund:['admin','manager'],user:['admin'],company:['power'],expense:['admin','manager'],settings:['admin','power']};
  if (!map[operation]?.includes(role)) throw new Error('Your role does not permit this action.');
}
export function validateProduct(input, products, companyId, existingId=null) {
  const name = cleanText(input.name,80), sku = cleanText(input.sku,40).toUpperCase();
  const barcode = cleanText(input.barcode || sku,48).toUpperCase();
  if (!/^[A-Z0-9 .\-$/+%]+$/.test(barcode)) throw new Error('Internal barcodes support A–Z, 0–9, space and - . $ / + %.');
  if (!/^[A-Z0-9_-]+$/.test(sku)) throw new Error('SKU supports letters, numbers, underscore and hyphen.');
  const duplicate = scope(products,companyId).find(p => p.id!==existingId && [p.sku,p.barcode,...(p.barcodeAliases||[])].some(code=>code===sku||code===barcode));
  if (duplicate) throw new Error('This SKU or barcode is already used in this company.');
  const price=moneyToMinor(input.price), cost=moneyToMinor(input.cost);
  if (price===0) throw new Error('Selling price must be greater than zero. Use the Free item option at checkout.');
  return {name,sku,barcode,category:cleanText(input.category||'General',40),unit:cleanText(input.unit||'pcs',16),price,cost,stock:integer(input.stock),low:integer(input.low,0,100000),active:true};
}
export function calculateCart(lines, products, companyId, discountBps=0, taxBps=0) {
  integer(discountBps,0,10000); integer(taxBps,0,3000);
  if (!Array.isArray(lines) || lines.length>200) throw new Error('Invalid cart.');
  const combined=new Map();
  let subtotal=0,cost=0;
  const items=lines.map(line => {
    const product=findScoped(products,line.productId,companyId);
    if (!product.active) throw new Error(`${product.name} is archived.`);
    const qty=integer(line.qty,1,100000);
    combined.set(product.id,(combined.get(product.id)||0)+qty);
    const free=line.free===true, net=free?0:product.price*qty;
    subtotal+=net; cost+=product.cost*qty;
    return {productId:product.id,name:product.name,sku:product.sku,qty,unitPrice:product.price,unitCost:product.cost,free,net};
  });
  for (const [id,qty] of combined) {const p=findScoped(products,id,companyId);if(qty>p.stock)throw new Error(`Insufficient stock for ${p.name}. Available: ${p.stock}.`);}
  const discount=Math.round(subtotal*discountBps/10000);
  const taxable=subtotal-discount, tax=Math.round(taxable*taxBps/10000),total=taxable+tax;
  if (![subtotal,cost,discount,tax,total].every(Number.isSafeInteger)) throw new Error('Cart amount is too large.');
  // Allocate invoice discount/tax to lines; remainder goes to final paid line.
  let usedDiscount=0,usedTax=0;const paid=items.map((x,i)=>x.net>0?i:-1).filter(i=>i>=0),last=paid.at(-1);
  items.forEach((item,i)=>{item.discount=item.net===0?0:i===last?discount-usedDiscount:Math.floor(discount*item.net/Math.max(subtotal,1));usedDiscount+=item.discount;item.tax=item.net===0?0:i===last?tax-usedTax:Math.floor(tax*(item.net-item.discount)/Math.max(taxable,1));usedTax+=item.tax;item.total=item.net-item.discount+item.tax;});
  return {items,subtotal,discount,tax,total,cost,grossProfit:taxable-cost};
}
export function commitSale(state,ctx,input,now=new Date().toISOString()) {
  permitted(ctx.role,'sale');
  if(input.discountBps) permitted(ctx.role,'discount');
  if(input.lines?.some(l=>l.free)) permitted(ctx.role,'free');
  const company=findScoped(state.companies.map(c=>({...c,companyId:c.id})),ctx.companyId,ctx.companyId);
  if(company.status!=='active') throw new Error('Company is not active.');
  if(!/^[a-zA-Z0-9_-]{6,100}$/.test(input.idempotencyKey||'')) throw new Error('Invalid transaction reference.');
  const requestSignature=JSON.stringify({lines:input.lines,discountBps:input.discountBps||0,customerId:input.customerId||'',method:input.method,tendered:input.method==='cash'?moneyToMinor(input.tendered):null});
  const previous=state.sales.find(s=>s.companyId===ctx.companyId&&s.idempotencyKey===input.idempotencyKey);
  if(previous){if(previous.requestSignature!==requestSignature)throw new Error('Transaction reference was already used with different sale details.');return{state,sale:previous,duplicate:true};}
  if(!input.lines?.length)throw new Error('Add at least one product.');
  if(input.customerId&&!findScoped(state.customers,input.customerId,ctx.companyId).active)throw new Error('This customer is archived.');
  const calc=calculateCart(input.lines,state.products,ctx.companyId,input.discountBps||0,state.settings[ctx.companyId]?.taxBps||0);
  if(!['cash','card','bank','credit'].includes(input.method))throw new Error('Select a valid payment method.');
  if(input.method==='credit'&&!input.customerId)throw new Error('Select a customer for a credit sale.');
  const tendered=input.method==='cash'?moneyToMinor(input.tendered):input.method==='credit'?0:calc.total;
  if(input.method==='cash'&&tendered<calc.total)throw new Error('Cash received is less than the total.');
  const next=structuredClone(state),sequence=scope(next.sales,ctx.companyId).length+1;
  const sale={...calc,id:`sale-${input.idempotencyKey}`,companyId:ctx.companyId,number:`ZT-${String(sequence).padStart(5,'0')}`,createdAt:now,user:ctx.user,customerId:input.customerId||'',method:input.method,tendered,change:input.method==='cash'?tendered-calc.total:0,status:'completed',idempotencyKey:input.idempotencyKey,requestSignature};
  calc.items.forEach(item=>{findScoped(next.products,item.productId,ctx.companyId).stock-=item.qty;next.stockMoves.push({id:`move-${input.idempotencyKey}-${item.productId}-${next.stockMoves.length}`,companyId:ctx.companyId,productId:item.productId,qty:-item.qty,reason:item.free?'Free promotional item':'Sale',reference:sale.number,createdAt:now,user:ctx.user});});
  if(input.method==='credit') findScoped(next.customers,input.customerId,ctx.companyId).balance+=calc.total;
  next.sales.unshift(sale);next.audit.unshift({id:`audit-${input.idempotencyKey}`,companyId:ctx.companyId,user:ctx.user,action:'Sale completed',detail:sale.number,createdAt:now});
  return{state:next,sale,duplicate:false};
}
export function refundSale(state,ctx,saleId,reason,now=new Date().toISOString()) {
  permitted(ctx.role,'refund');cleanText(reason,160);
  const sale=findScoped(state.sales,saleId,ctx.companyId);
  if(sale.status!=='completed')throw new Error('This sale has already been refunded.');
  const next=structuredClone(state),target=findScoped(next.sales,saleId,ctx.companyId);
  target.status='refunded';target.refundedAt=now;target.refundReason=reason;
  target.items.forEach(item=>{findScoped(next.products,item.productId,ctx.companyId).stock+=item.qty;next.stockMoves.push({id:`return-${saleId}-${next.stockMoves.length}`,companyId:ctx.companyId,productId:item.productId,qty:item.qty,reason:'Full return — resellable',reference:sale.number,createdAt:now,user:ctx.user});});
  if(sale.method==='credit'&&sale.customerId)findScoped(next.customers,sale.customerId,ctx.companyId).balance-=sale.total;
  next.audit.unshift({id:`refund-audit-${saleId}`,companyId:ctx.companyId,user:ctx.user,action:'Full sale refunded',detail:`${sale.number}: ${reason}`,createdAt:now});
  return next;
}
export function csvCell(value) {let s=String(value??'');if(/^[\s]*[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
export function toCSV(rows) {return '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');}
export function code39(value) {
  const alphabet='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%';
  const patterns=[0x034,0x121,0x061,0x160,0x031,0x130,0x070,0x025,0x124,0x064,0x109,0x049,0x148,0x019,0x118,0x058,0x00d,0x10c,0x04c,0x01c,0x103,0x043,0x142,0x013,0x112,0x052,0x007,0x106,0x046,0x016,0x181,0x0c1,0x1c0,0x091,0x190,0x0d0,0x085,0x184,0x0c4,0x0a8,0x0a2,0x08a,0x02a];
  if(typeof value!=='string'||!value.length||value.length>48||[...value].some(c=>!alphabet.includes(c)))throw new Error('Use an uppercase Code 39 value (1–48 characters).');
  let x=20;const bars=[];
  for(const c of `*${value}*`){const pattern=c==='*'?0x094:patterns[alphabet.indexOf(c)];for(let i=0;i<9;i++){const width=(pattern&(1<<(8-i)))?5:2;if(i%2===0)bars.push({x,width});x+=width;}x+=2;}
  return {width:x+20,bars};
}
export function licenseKey() {
  if(!globalThis.crypto?.getRandomValues)throw new Error('Secure random generation is unavailable in this browser.');
  const bytes=crypto.getRandomValues(new Uint8Array(16));return 'ZT-'+Array.from(bytes,b=>b.toString(16).padStart(2,'0').toUpperCase()).join('').match(/.{8}/g).join('-');
}
