const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const names=pattern=>fs.readdirSync('.').filter(f=>pattern.test(f)).sort();
function join(parts,dest){if(!parts.length)throw Error('Missing archive parts');const fd=fs.openSync(dest,'w');try{for(const file of parts)fs.writeSync(fd,fs.readFileSync(file));}finally{fs.closeSync(fd);}}
join(names(/^site-part-\d+\.bin$/),'site.tar.gz');
fs.mkdirSync('site',{recursive:true});cp.execFileSync('tar',['-xzf','site.tar.gz','-C','site']);
if(fs.existsSync('update-manifest.json')){
 const manifest=JSON.parse(fs.readFileSync('update-manifest.json','utf8'));
 for(const part of manifest.parts)if(sha(part.name)!==part.sha256)throw Error('Invalid update part '+part.name);
 join(manifest.parts.map(p=>p.name),'site-update.tar.gz');
 if(sha('site-update.tar.gz')!==manifest.archiveSha256)throw Error('Invalid update archive');
}
if(fs.existsSync('site-update.tar.gz'))cp.execFileSync('tar',['-xzf','site-update.tar.gz','-C','site']);
if(fs.existsSync('online-files.json')){
 const allowed=new Set(JSON.parse(fs.readFileSync('online-files.json','utf8')));
 function clean(dir,prefix=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const rel=prefix+e.name,file=path.join(dir,e.name);if(e.isDirectory())clean(file,rel+'/');else if(!allowed.has(rel))fs.unlinkSync(file);}}
 clean('site');
 for(const rel of allowed)if(!fs.existsSync(path.join('site',rel)))throw Error('Missing published file '+rel);
}
console.log('Readonly portfolio ready in site/');
