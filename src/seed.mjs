export function createSeed(now=new Date()) {
  const catalog=[
    ['Botanical Shampoo','SH-001','Personal care',145000,89000,42,10,'bottle'],
    ['Daily Conditioner','CN-002','Personal care',115000,66000,28,8,'bottle'],
    ['Hydrating Face Wash','FW-003','Personal care',89000,48000,36,10,'tube'],
    ['Sunscreen SPF 50','SS-004','Personal care',185000,120000,7,10,'tube'],
    ['Ceramic Coffee Mug','MG-005','Home & living',75000,41000,24,6,'mug'],
    ['Canvas Tote Bag','TB-006','Accessories',125000,70000,18,5,'bag'],
    ['Wireless Headphones','HP-007','Electronics',650000,435000,12,4,'headphones'],
    ['Classic Notebook','NB-008','Stationery',45000,21000,58,12,'book'],
    ['Green Tea · 25 bags','GT-009','Groceries',68000,42000,31,8,'box'],
    ['Organic Honey · 250g','HN-010','Groceries',145000,95000,16,5,'jar'],
    ['Hand Cream','HC-011','Personal care',65000,35000,4,8,'tube'],
    ['Insulated Water Bottle','WB-012','Accessories',220000,145000,20,5,'bottle'],
    ['Scented Candle','CD-013','Home & living',135000,80000,14,5,'jar'],
    ['Cotton Hand Towel','TW-014','Home & living',55000,29000,32,8,'box'],
    ['USB-C Cable','CB-015','Electronics',95000,50000,6,8,'cable'],
    ['Gel Pen Set','PN-016','Stationery',35000,15000,45,10,'book'],
    ['Almond Cookies','CK-017','Groceries',52000,31000,25,8,'box'],
    ['Gentle Hand Soap','HS-018','Personal care',48000,24000,39,10,'bottle'],
    ['Desk Organizer','DO-019','Stationery',145000,85000,9,4,'box'],
    ['Everyday Backpack','BP-020','Accessories',380000,250000,8,3,'bag'],
    ['Portable Speaker','SP-021','Electronics',450000,290000,0,3,'speaker'],
    ['Coffee Beans · 250g','CF-022','Groceries',195000,130000,17,5,'bag'],
    ['Glass Storage Jar','SJ-023','Home & living',85000,45000,21,6,'jar'],
    ['Pocket Planner','PP-024','Stationery',85000,39000,26,6,'book']
  ];
  const companies=[{id:'co-north',name:'Northstar Retail',owner:'Sajjad Haider',email:'owner@northstar.example',status:'active',plan:'Professional',expires:'2027-10-31',deviceLimit:3,userLimit:10,branches:1},{id:'co-urban',name:'Urban Essentials',owner:'Demo Owner',email:'owner@urban.example',status:'active',plan:'Starter',expires:'2027-04-30',deviceLimit:1,userLimit:3,branches:1}];
  const products=catalog.map((p,i)=>({id:`p-${i+1}`,companyId:'co-north',name:p[0],sku:p[1],barcode:`ZT${String(i+1).padStart(5,'0')}`,barcodeAliases:[],category:p[2],price:p[3],cost:p[4],stock:p[5],low:p[6],art:p[7],unit:'pcs',active:true}));
  products.push(...catalog.slice(0,6).map((p,i)=>({id:`u-${i+1}`,companyId:'co-urban',name:p[0],sku:p[1],barcode:`UR${String(i+1).padStart(5,'0')}`,barcodeAliases:[],category:p[2],price:p[3]+10000,cost:p[4],stock:15+i,low:5,art:p[7],unit:'pcs',active:true})));
  const customers=[['c-1','Ayesha Khan','03000000101','Lahore'],['c-2','Omar Ali','03000000102','Islamabad'],['c-3','Hina Ahmed','03000000103','Lahore'],['c-4','Bilal Malik','03000000104','Karachi'],['c-5','Sana Iqbal','03000000105','Faisalabad'],['c-6','Usman Raza','03000000106','Lahore']].map(c=>({id:c[0],companyId:'co-north',name:c[1],phone:c[2],city:c[3],email:'',balance:0,active:true}));
  customers.push({id:'cu-1',companyId:'co-urban',name:'Urban Demo Customer',phone:'03000000201',city:'Karachi',email:'',balance:0,active:true});
  const sales=[];
  for(let day=27;day>=0;day--){for(let j=0;j<3+(day%4);j++){const product=products[(day*3+j*5)%24],qty=1+(j%2),created=new Date(now);created.setDate(created.getDate()-day);created.setHours(9+j*2,10+j*6,0,0);const total=product.price*qty,cost=product.cost*qty;const i=sales.length+1;sales.unshift({id:`seed-sale-${i}`,companyId:'co-north',number:`ZT-${String(i).padStart(5,'0')}`,createdAt:created.toISOString(),user:j%2?'Ali Hassan':'Sajjad Haider',customerId:j%3?'c-'+(1+(j%6)):'',items:[{productId:product.id,name:product.name,sku:product.sku,qty,unitPrice:product.price,unitCost:product.cost,free:false,net:total,discount:0,tax:0,total}],subtotal:total,discount:0,tax:0,total,cost,grossProfit:total-cost,method:['cash','card','bank'][j%3],tendered:total,change:0,status:'completed',idempotencyKey:`seed-${i}`});}}
  return {schemaVersion:1,companies,products,customers,sales,users:[{id:'user-1',companyId:'co-north',name:'Sajjad Haider',email:'admin@northstar.example',role:'admin',active:true},{id:'user-2',companyId:'co-north',name:'Ali Hassan',email:'cashier@northstar.example',role:'cashier',active:true},{id:'user-3',companyId:'co-north',name:'Sara Ahmed',email:'stock@northstar.example',role:'inventory',active:true},{id:'user-4',companyId:'co-north',name:'Hamza Tariq',email:'manager@northstar.example',role:'manager',active:true}],stockMoves:[],audit:[{id:'audit-start',companyId:'co-north',user:'System',action:'Demo workspace initialized',detail:'Fictional sample records. No real accounts or customer data.',createdAt:now.toISOString()}],heldCarts:[],licenses:[{id:'lic-1',companyId:'co-north',key:'DEMO-NORTHSTAR-ACTIVE',status:'active',createdAt:now.toISOString(),expires:'2027-10-31',devices:1},{id:'lic-2',companyId:'co-urban',key:'DEMO-URBAN-ACTIVE',status:'active',createdAt:now.toISOString(),expires:'2027-04-30',devices:1}],purchases:[],expenses:[],suppliers:[{id:'sup-1',companyId:'co-north',name:'Prime Distribution (demo)',phone:'03000000301'}],settings:{'co-north':{name:'Northstar Retail',address:'Main Market, Lahore',phone:'0300-0000000',currency:'PKR',taxBps:0,receiptNote:'Thank you for shopping with us. Visit again!',lowStockAlerts:true},'co-urban':{name:'Urban Essentials',address:'Karachi',phone:'0300-0000000',currency:'PKR',taxBps:0,receiptNote:'Thank you for your visit!',lowStockAlerts:true}}};
}
