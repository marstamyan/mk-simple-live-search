const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const {createRequire}=require('module');const modules=path.resolve(__dirname,'../../simple-alert-box/.local/remotion-tutorial/node_modules');const req=createRequire(path.join(modules,'../package.json'));
const {bundle}=req('@remotion/bundler'),{renderStill,selectComposition,openBrowser}=req('@remotion/renderer');
const ff=path.resolve(__dirname,'../../simple-alert-box/.local/promo-build/node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe');
const steps=require('./lesson.json'),temp=path.resolve(__dirname,'../.local/lesson-render');fs.mkdirSync(temp,{recursive:true});
const run=args=>{const output=args.at(-1);const r=spawnSync(ff,['-hide_banner','-v','error','-y','-filter_complex_threads','1',...args.slice(0,-1).map(x=>x==='fast'?'ultrafast':x),'-threads','2',output],{encoding:'utf8'});if(r.status)throw Error(r.stderr);};
function wavDuration(file){const b=fs.readFileSync(file);let rate=0,data=0;for(let p=12;p+8<=b.length;){const name=b.toString('ascii',p,p+4),size=b.readUInt32LE(p+4);if(name==='fmt ')rate=b.readUInt32LE(p+16);if(name==='data')data=size;p+=8+size+(size%2);}return data/rate;}
(async()=>{
 const serveUrl=await bundle({entryPoint:path.join(__dirname,'src/lesson.tsx'),outDir:path.join(temp,'bundle'),webpackOverride:c=>({...c,resolve:{...c.resolve,modules:[modules,...(c.resolve?.modules||['node_modules'])]}})});
 const browserExecutable='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';const browser=await openBrowser('chrome',{browserExecutable});
 const common={serveUrl,browserExecutable,puppeteerInstance:browser};const parts=[],timeline=[];let total=0;
 for(const step of steps){
  const source=path.join(__dirname,'public/lesson',step.id+'.mp4');
  for(let attempt=0;;attempt++){if(fs.existsSync(source)&&fs.statSync(source).size>1000){const probe=spawnSync(ff,['-v','error','-i',source,'-frames:v','1','-f','null','-'],{encoding:'utf8'});if(probe.status===0)break;}if(attempt>180)throw Error('Capture not ready: '+step.id);await new Promise(r=>setTimeout(r,1000));}
  const composition=await selectComposition({...common,id:'Lesson',inputProps:{step}});const png=path.join(temp,step.id+'.png');
  await renderStill({...common,composition,frame:0,inputProps:{step},output:png});
  const audio=path.join(__dirname,'public/lesson',step.id+'.wav');const seconds=Math.ceil((wavDuration(audio)+.5)*30)/30;const mp4=path.join(temp,step.id+'.mp4');
  run(['-loop','1','-i',png,'-i',path.join(__dirname,'public/lesson',step.id+'.mp4'),'-i',audio,'-filter_complex','[1:v]scale=1320:818,tpad=start_mode=clone:start_duration=1.2:stop_mode=clone:stop_duration=60[clip];[0:v][clip]overlay=540:146[v];[2:a]apad[a]','-map','[v]','-map','[a]','-t',String(seconds),'-r','30','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k',mp4]);
  timeline.push({...step,start:total,seconds});total+=seconds;parts.push(mp4);console.log('Rendered',step.id,seconds.toFixed(1)+'s');
 }
 const list=path.join(temp,'parts.txt');fs.writeFileSync(list,'ffconcat version 1.0\n'+parts.map(p=>`file '${p.replaceAll('\\','/')}'`).join('\n'));
 const output=path.resolve(__dirname,'../artifacts/mk-simple-live-search-english-guide.mp4');run(['-safe','0','-i',list,'-c','copy','-movflags','+faststart',output]);
 fs.writeFileSync(path.resolve(__dirname,'../artifacts/english-guide-timeline.json'),JSON.stringify({seconds:total,narration:'Microsoft Zira Desktop, English',timeline},null,2));
 await browser.close({silent:true});console.log(output,total.toFixed(1)+' seconds');
})().catch(e=>{console.error(e);process.exit(1)});
