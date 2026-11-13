const path=require('node:path');const fs=require('node:fs');const {createRequire}=require('node:module');
const {spawnSync}=require('node:child_process');
const localModules=path.join(__dirname,'node_modules');
const modules=process.env.REMOTION_MODULE_ROOT||(fs.existsSync(path.join(localModules,'@remotion/bundler/package.json'))?localModules:path.resolve(__dirname,'../../simple-alert-box/.local/remotion-tutorial/node_modules'));
const req=createRequire(path.join(modules,'..','package.json'));
const {bundle}=req('@remotion/bundler');const {selectComposition,renderMedia,renderStill,openBrowser}=req('@remotion/renderer');
(async()=>{
 const out=path.resolve(__dirname,'../artifacts');fs.mkdirSync(out,{recursive:true});
 const serveUrl=await bundle({entryPoint:path.join(__dirname,'src/index.tsx'),publicDir:path.join(__dirname,'public'),outDir:path.resolve(__dirname,'../.local/remotion-build'),webpackOverride:config=>({...config,resolve:{...config.resolve,modules:[modules,...(config.resolve?.modules||['node_modules'])]}})});
 const browserExecutable=process.env.BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
 const puppeteerInstance=await openBrowser('chrome',{browserExecutable});
 const common={serveUrl,browserExecutable,puppeteerInstance};
 const composition=await selectComposition({...common,id:'MKLiveSearchTutorial'});
 const outputLocation=path.join(out,'mk-simple-live-search-tutorial-en-1080p.mp4');
 if(process.argv.includes('--fast')){
  const ffmpeg=process.env.FFMPEG||path.resolve(__dirname,'../../simple-alert-box/.local/promo-build/node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe');
  const temp=path.resolve(__dirname,'../.local/fast-render');fs.mkdirSync(temp,{recursive:true});
  const chapters=JSON.parse(fs.readFileSync(path.join(__dirname,'chapters.json')));
  const parts=[];let start=30;
  const encode=(args)=>{const r=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y',...args],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);};
  const stillPart=async(name,frame,seconds)=>{
   const png=path.join(temp,name+'.png'),mp4=path.join(temp,name+'.mp4');
   await renderStill({...common,composition,frame,output:png,inputProps:{graphicsOnly:true}});
   encode(['-loop','1','-i',png,'-t',String(seconds),'-r','30','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p',mp4]);parts.push(mp4);console.log('Encoded',name);
  };
  await stillPart('intro',20,1);
  for(const chapter of chapters){
   const png=path.join(temp,chapter.id+'.png'),mp4=path.join(temp,chapter.id+'.mp4');
   await renderStill({...common,composition,frame:start+Math.floor(chapter.durationInFrames/2),output:png,inputProps:{graphicsOnly:true}});
   encode(['-loop','1','-i',png,'-i',path.join(__dirname,'public',chapter.id+'.mp4'),'-filter_complex','[0:v]split=2[bg][fg];[1:v]scale=1568:882[footage];[bg][footage]overlay=176:102:shortest=1[base];[fg]crop=1920:138:0:942[footer];[base][footer]overlay=0:942:shortest=1','-t',String(chapter.durationInFrames/30),'-r','30','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p',mp4]);parts.push(mp4);start+=chapter.durationInFrames;console.log('Encoded',chapter.id);
  }
  await stillPart('outro',composition.durationInFrames-20,1);
  const concat=path.join(temp,'parts.ffconcat');fs.writeFileSync(concat,'ffconcat version 1.0\n'+parts.map(p=>`file '${p.replaceAll('\\','/')}'`).join('\n'));
  encode(['-safe','0','-i',concat,'-c','copy','-movflags','+faststart',outputLocation]);
  fs.writeFileSync(path.join(out,'tutorial-validation.json'),JSON.stringify({composition:{width:composition.width,height:composition.height,fps:composition.fps,durationInFrames:composition.durationInFrames},seconds:composition.durationInFrames/composition.fps,outputLocation,source:'Actual browser screencasts of local WordPress 7.1.4',titles:'Remotion',assembly:'FFmpeg',narration:false},null,2));console.log(outputLocation);
 }else if(process.argv.includes('--stills')){
  const chapters=JSON.parse(fs.readFileSync(path.join(__dirname,'chapters.json')));let start=30;
  for(const [i,chapter] of chapters.entries()){
   const frame=Math.min(composition.durationInFrames-1,start+Math.floor(chapter.durationInFrames*(i>=4?.88:.65)));
   await renderStill({...common,composition,frame,output:path.join(out,`tutorial-preview-${i+1}.png`)});console.log('Preview',i+1,'at',(frame/30).toFixed(1)+'s');start+=chapter.durationInFrames;
  }
  await renderStill({...common,composition,frame:90,output:path.join(out,'tutorial-preview-intro.png')});
  await renderStill({...common,composition,frame:composition.durationInFrames-90,output:path.join(out,'tutorial-preview-outro.png')});
 } else {
  let last=-1;
  await renderMedia({...common,composition,codec:'h264',outputLocation,crf:19,x264Preset:'fast',pixelFormat:'yuv420p',concurrency:4,onProgress:({progress})=>{const p=Math.floor(progress*100);if(p>=last+5){last=p;console.log('Render',p+'%')}}});
  fs.writeFileSync(path.join(out,'tutorial-validation.json'),JSON.stringify({composition:{width:composition.width,height:composition.height,fps:composition.fps,durationInFrames:composition.durationInFrames},seconds:composition.durationInFrames/composition.fps,outputLocation,source:'Actual browser screencasts of local WordPress 7.1.4',narration:false},null,2));
  console.log(outputLocation);
 }
 await puppeteerInstance.close({silent:true});
})().catch(e=>{console.error(e);process.exit(1)});
