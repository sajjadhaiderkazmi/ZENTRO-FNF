// Loopback-only static evaluation server. This is NOT a POS API or authentication server.
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),arg=n=>args[args.indexOf(n)+1];
const requestedPort=args.includes('--port')?arg('--port'):process.env.PORT||'4173';
const port=Number(requestedPort);if(!Number.isInteger(port)||port<0||port>65535)throw Error('Invalid port');
// Preview tooling may explicitly supply a bind address. Local user defaults stay loopback-only.
const host=args.includes('--host')?arg('--host'):process.env.HOST||'127.0.0.1';
if(!['127.0.0.1','localhost','0.0.0.0'].includes(host))throw Error('Unsupported bind address');
await import('./build.mjs');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8'};
const allowed=new Set(['/','/index.html','/Zentro-POS.html','/src/app.mjs','/src/core.mjs','/src/seed.mjs','/src/styles.css']);
const server=http.createServer(async(req,res)=>{
  const headers={'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Cache-Control':'no-store','Content-Security-Policy':"frame-ancestors 'none'; object-src 'none'; base-uri 'none'"};
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{...headers,Allow:'GET, HEAD'});res.end('Method not allowed');return;}
  try{const pathname=new URL(req.url,'http://localhost').pathname;if(!allowed.has(pathname)){res.writeHead(404,headers);res.end('Not found');return;}const file=pathname==='/'?path.join(root,'dist/index.html'):path.join(root,pathname.slice(1));const info=await stat(file);if(!info.isFile())throw Error('Not a file');const bytes=await readFile(file);res.writeHead(200,{...headers,'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:bytes);}catch{res.writeHead(404,headers);res.end('Not found');}
});
server.listen(port,host,()=>console.log(`Zentro - POS evaluation server: http://${host}:${server.address().port}`));
