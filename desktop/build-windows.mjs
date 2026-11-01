// Build from a temporary staging directory, keeping source config and live data untouched.
import {mkdtemp,cp,readFile,writeFile,mkdir,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const dir=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(dir,'..'),args=process.argv.slice(2);
const mode=args.includes('--cloud')?'cloud':'local';
let serverUrl='';if(mode==='cloud'){serverUrl=process.env.ZENTRO_SERVER_URL||'';const url=new URL(serverUrl);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('Set ZENTRO_SERVER_URL to the actual HTTPS server origin.');serverUrl=url.origin;}
const stage=await mkdtemp(path.join(tmpdir(),'zentro-windows-'));let status=1;
try{
 for(const name of ['server','web'])await cp(path.join(root,name),path.join(stage,name),{recursive:true});
 await mkdir(path.join(stage,'src'));for(const name of ['core.mjs','styles.css'])await cp(path.join(root,'src',name),path.join(stage,'src',name));
 await mkdir(path.join(stage,'desktop'));await cp(path.join(dir,'assets'),path.join(stage,'desktop/assets'),{recursive:true});for(const name of ['main.mjs','preload.cjs','printer-policy.mjs'])await cp(path.join(dir,name),path.join(stage,'desktop',name));
 await cp(path.join(root,'package.json'),path.join(stage,'package.json'));await cp(path.join(root,'package-lock.json'),path.join(stage,'package-lock.json'));
 const install=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['ci','--omit=dev','--ignore-scripts','--no-audit','--no-fund'],{cwd:stage,stdio:'inherit',shell:process.platform==='win32'});if(install.status!==0)throw Error('Staged application dependencies could not be installed.');
 await writeFile(path.join(stage,'desktop/desktop-config.json'),JSON.stringify({mode,serverUrl},null,2));
 const config=JSON.parse(await readFile(path.join(dir,'electron-builder.json'),'utf8'));
 config.directories={output:path.join(root,'release/windows',mode)};
 config.win.artifactName=`Zentro-POS-${mode}-Setup-\${version}-\${arch}.\${ext}`;
 const unsigned=args.includes('--unsigned');if(unsigned){config.win.signAndEditExecutable=false;config.forceCodeSigning=false;}else{if(process.platform!=='win32')throw Error('Signed release builds must run on Windows.');if(!process.env.CSC_LINK&&!process.env.WIN_CSC_LINK)throw Error('Provide a protected signing certificate, or use --unsigned for evaluation.');config.forceCodeSigning=true;}
 if(unsigned&&process.platform!=='win32'){
  const script='!define ZENTRO_APP_DIR "'+path.join(config.directories.output,'win-unpacked').replaceAll('\\','/')+'"\n!define ZENTRO_ICON "'+path.join(stage,'desktop/assets/icon.ico').replaceAll('\\','/')+'"\n'+await readFile(path.join(dir,'installer.nsi'),'utf8');
  const scriptPath=path.join(stage,'desktop/installer.nsi');await writeFile(scriptPath,script);config.nsis.script=scriptPath;
 }
 await writeFile(path.join(stage,'electron-builder.json'),JSON.stringify(config,null,2));
 const result=spawnSync(process.execPath,[path.join(dir,'node_modules/electron-builder/out/cli/cli.js'),'--projectDir',stage,'--config',path.join(stage,'electron-builder.json'),'--win','nsis','--x64','--publish','never'],{stdio:'inherit',env:{...process.env,...(unsigned?{CSC_IDENTITY_AUTO_DISCOVERY:'false'}:{})}});
 if(result.error)throw result.error;status=result.status??1;
 if(!status){const out=config.directories.output;for(const file of await readdir(out)){if(file.endsWith('.exe')){const bytes=await readFile(path.join(out,file));await writeFile(path.join(out,file+'.sha256'),createHash('sha256').update(bytes).digest('hex')+'  '+file+'\n');}}}
}finally{await rm(stage,{recursive:true,force:true});}
process.exitCode=status;
