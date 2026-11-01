import {argon2,randomBytes,createHash,createHmac,timingSafeEqual,createCipheriv,createDecipheriv} from 'node:crypto';
import {promisify} from 'node:util';
const nativeDerive=promisify(argon2);
// Electron embeds BoringSSL: the Node API exists but Argon2 is unsupported there.
export async function portableArgon2(options){const {argon2id}=await import('hash-wasm');return Buffer.from(await argon2id({password:options.message,salt:options.nonce,parallelism:options.parallelism,iterations:options.passes,memorySize:options.memory,hashLength:options.tagLength,outputType:'binary'}));}
export const deriveArgon2=process.versions.electron?(_algorithm,options)=>portableArgon2(options):nativeDerive;
export const token=()=>randomBytes(32).toString('base64url');
export const digest=value=>createHash('sha256').update(String(value)).digest('hex');
export function equal(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);}
export function passwordPolicy(value){if(typeof value!=='string'||value.length<14||value.length>128)throw Error('Use a password or passphrase of 14–128 characters.');return value;}
export async function hashPassword(password){passwordPolicy(password);const salt=randomBytes(16),hash=await deriveArgon2('argon2id',{message:password,nonce:salt,parallelism:1,tagLength:32,memory:19456,passes:2});return`argon2id:19456:2:1:${salt.toString('base64url')}:${hash.toString('base64url')}`;}
export async function verifyPassword(password,encoded){try{if(typeof password!=='string'||password.length>128)return false;const [type,m,t,p,salt,expected]=encoded.split(':');if(type!=='argon2id'||m!=='19456'||t!=='2'||p!=='1')return false;const hash=await deriveArgon2('argon2id',{message:password,nonce:Buffer.from(salt,'base64url'),parallelism:1,tagLength:32,memory:19456,passes:2});return equal(hash.toString('base64url'),expected);}catch{return false;}}
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32(bytes){let bits=0,value=0,out='';for(const byte of bytes){value=(value<<8)|byte;bits+=8;while(bits>=5){out+=alphabet[(value>>>(bits-5))&31];bits-=5;}}if(bits)out+=alphabet[(value<<(5-bits))&31];return out;}
function unbase32(text){let bits=0,value=0,out=[];for(const c of text){const n=alphabet.indexOf(c);if(n<0)throw Error('Invalid authenticator secret.');value=(value<<5)|n;bits+=5;if(bits>=8){out.push((value>>>(bits-8))&255);bits-=8;}}return Buffer.from(out);}
export const mfaSecret=()=>base32(randomBytes(20));
export function totp(secret,at=Date.now(),digits=6){const b=Buffer.alloc(8);b.writeBigUInt64BE(BigInt(Math.floor(at/30000)));const mac=createHmac('sha1',unbase32(secret)).update(b).digest(),o=mac[19]&15;return String((mac.readUInt32BE(o)&0x7fffffff)%10**digits).padStart(digits,'0');}
export function verifyTotp(secret,code,lastCounter=-1,at=Date.now()){if(!/^\d{6}$/.test(String(code)))return null;for(const delta of [-1,0,1]){const counter=Math.floor(at/30000)+delta;if(counter>lastCounter&&equal(totp(secret,counter*30000),code))return counter;}return null;}
export function encrypt(text,key){const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',key,iv);const data=Buffer.concat([c.update(text,'utf8'),c.final()]);return[iv.toString('base64url'),c.getAuthTag().toString('base64url'),data.toString('base64url')].join('.');}
export function decrypt(encoded,key){const [iv,tag,data]=encoded.split('.');const d=createDecipheriv('aes-256-gcm',key,Buffer.from(iv,'base64url'));d.setAuthTag(Buffer.from(tag,'base64url'));return Buffer.concat([d.update(Buffer.from(data,'base64url')),d.final()]).toString('utf8');}
export function canonical(value){if(Array.isArray(value))return'['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';return JSON.stringify(value);}
export function publicUser(user){return{id:user.id,companyId:user.company_id,name:user.name,identifier:user.identifier,role:user.role,active:!!user.active,mfaEnabled:!!user.mfa_enabled,branchIds:JSON.parse(user.branch_ids||'[]')};}
export function dateInZone(value,zone='Asia/Karachi'){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));const read=t=>parts.find(p=>p.type===t).value;return`${read('year')}-${read('month')}-${read('day')}`;}

export function isDateOnly(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const date=new Date(value+'T00:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;}
