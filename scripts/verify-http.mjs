// Targeted HTTP integration checks. --self launches an isolated loopback test fixture,
// never a browser preview, and shuts it down after the checks.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
let child=null,origin=process.argv[2]||'http://127.0.0.1:4173';
if(origin==='--self'){
 child=spawn(process.execPath,[fileURLToPath(new URL('./serve.mjs',import.meta.url)),'--port','0','--host','127.0.0.1'],{stdio:['ignore','pipe','pipe']});
 origin=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{child.kill();reject(Error('HTTP test fixture startup timeout'));},10000);let output='';child.stdout.on('data',chunk=>{output+=chunk.toString();const match=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timeout);resolve(match[0]);}});child.on('error',err=>{clearTimeout(timeout);reject(err);});child.on('exit',code=>{if(!output.includes('evaluation server:')){clearTimeout(timeout);reject(Error(`HTTP test fixture exited: ${code}`));}});});
}
const base=new URL(origin);
if(!['127.0.0.1','localhost'].includes(base.hostname)||base.protocol!=='http:')throw Error('Use the loopback evaluation server only.');
let count=0;
function check(label,condition){assert.ok(condition,label);count++;console.log('PASS '+label);}
try{
const root=await fetch(new URL('/',base));
check('application returns HTTP 200',root.status===200);
check('HTML content type',root.headers.get('content-type')?.includes('text/html'));
check('anti-framing response header',root.headers.get('x-frame-options')==='DENY');
check('no-sniff response header',root.headers.get('x-content-type-options')==='nosniff');
check('no-referrer response header',root.headers.get('referrer-policy')==='no-referrer');
check('no-store response header',root.headers.get('cache-control')==='no-store');
check('HTTP CSP forbids framing',root.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"));
check('sensitive browser APIs disabled',root.headers.get('permissions-policy')?.includes('camera=()'));
const body=await root.text();check('expected application and developer credit',body.includes('Zentro - POS')&&body.includes('Developed By Sajjad Haider'));
for(const pathname of ['/.env','/package.json','/docs/SECURITY.md','/src/../.env','/%2e%2e/.env','/api/v1/products']){const response=await fetch(new URL(pathname,base));check(`blocked/unimplemented path ${pathname}`,response.status===404);}
const post=await fetch(new URL('/',base),{method:'POST'});check('mutating HTTP methods rejected',post.status===405);
const head=await fetch(new URL('/',base),{method:'HEAD'});check('HEAD is supported without response body',head.status===200&&(await head.text())==='');
console.log(`${count}/${count} local HTTP checks passed. This static server is not a business backend.`);
}finally{child?.kill();}
