export function printerRequest(payload,printers){
 if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('Invalid print request.');
 const formats={thermal80:{width:80000,height:297000},thermal58:{width:58000,height:297000},a4:'A4'};
 if(!Object.hasOwn(formats,payload.format))throw Error('Unsupported paper format.');
 const name=String(payload.printer||'');if(name&&!printers.some(p=>p.name===name))throw Error('Select an installed printer.');
 return {silent:false,printBackground:true,color:false,copies:1,deviceName:name,pageSize:formats[payload.format],margins:{marginType:'none'}};
}
