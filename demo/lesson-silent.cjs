const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const ff=process.env.FFMPEG||path.resolve(__dirname,'../../simple-alert-box/.local/promo-build/node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe');
const dir=path.resolve(__dirname,'../.local/lesson-silent');fs.mkdirSync(dir,{recursive:true});
function duration(file){const r=spawnSync(ff,['-hide_banner','-i',file],{encoding:'utf8'});const m=r.stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);if(!m)throw Error(r.stderr);return Number(m[1])*3600+Number(m[2])*60+Number(m[3]);}
function run(args){const r=spawnSync(ff,['-hide_banner','-v','error','-y',...args],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);}
const steps=require('./lesson.json'),parts=[],timeline=[];let total=0;
for(const step of steps){
 const raw=path.join(__dirname,'public/lesson',step.id+'.mp4');
 const source=path.resolve(__dirname,'../.local/lesson-render',step.id+'.mp4');
 // Retain the complete action, the 1.2 s lead-in and a readable result. Remove narration holds.
 const seconds=Math.min(duration(source),Math.max(step.id==='01'?6:8,duration(raw)+2.4));
 const output=path.join(dir,step.id+'.mp4');
 run(['-i',source,'-t',String(seconds),'-map','0:v:0','-an','-c:v','copy',output]);
 parts.push(output);timeline.push({id:step.id,title:step.title,start:total,seconds});total+=seconds;console.log(step.id,seconds.toFixed(2));
}
const list=path.join(dir,'parts.txt');fs.writeFileSync(list,'ffconcat version 1.0\n'+parts.map(p=>`file '${p.replaceAll('\\','/')}'`).join('\n'));
const output=path.resolve(__dirname,'../artifacts/mk-simple-live-search-english-silent.mp4');
run(['-safe','0','-i',list,'-map','0:v:0','-an','-c:v','copy','-movflags','+faststart',output]);
run(['-i',output,'-f','null','-']);
fs.writeFileSync(path.resolve(__dirname,'../artifacts/english-silent-validation.json'),JSON.stringify({seconds:duration(output),audio:false,fullDecodePassed:true,timeline},null,2));
console.log(output);
