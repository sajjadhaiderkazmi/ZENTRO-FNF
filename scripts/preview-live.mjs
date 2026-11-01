import path from 'node:path';
import {fileURLToPath} from 'node:url';
process.env.ZEN_DATA_DIR ||= path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../.zentro-preview-data');
// Internal Sites preview entrypoint. npm start remains loopback-only by default.
const args=process.argv.slice(2),port=args.includes('--port')?args[args.indexOf('--port')+1]:process.env.PORT||'4173';
process.argv=[process.execPath,'server/main.mjs','--host','0.0.0.0','--port',port,'--public-url',`http://terminal.local:${port}`];
await import('../server/main.mjs');
