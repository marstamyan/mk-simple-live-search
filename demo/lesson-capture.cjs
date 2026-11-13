const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1112-737-0_26.1112.737.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright');
const ff=process.env.FFMPEG||path.resolve(__dirname,'../../simple-alert-box/.local/promo-build/node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe');
const out=path.join(__dirname,'public/lesson');fs.mkdirSync(out,{recursive:true});const base='http://localhost:8766';
const pages=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../.local/lesson-pages.json')));
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function record(page,id,action){
 if(process.env.LESSON_RESUME&&fs.existsSync(path.join(out,id+'.mp4'))&&fs.statSync(path.join(out,id+'.mp4')).size>1000){console.log('Kept step',id);return;}
 const folder=path.resolve(__dirname,'../.local/lesson-frames',id);fs.mkdirSync(folder,{recursive:true});
 const c=await page.context().newCDPSession(page);await c.send('Page.enable');const frames=[];let n=0;const start=Date.now();
 const save=(data)=>{const file=path.join(folder,`${n++}.jpg`);fs.writeFileSync(file,data);frames.push({file,time:(Date.now()-start)/1000});};
 save(await page.screenshot({type:'jpeg',quality:95}));
 c.on('Page.screencastFrame',async e=>{save(Buffer.from(e.data,'base64'));await c.send('Page.screencastFrameAck',{sessionId:e.sessionId}).catch(()=>{});});
 await c.send('Page.startScreencast',{format:'jpeg',quality:95,maxWidth:1000,maxHeight:620});
 await pause(700);await action();await pause(1200);
 await c.send('Page.stopScreencast');save(await page.screenshot({type:'jpeg',quality:95}));await c.detach();
 await page.screenshot({path:path.join(out,id+'.png')});
 let list='ffconcat version 1.0\n';frames.forEach((f,i)=>{list+=`file '${f.file.replaceAll('\\','/')}'\nduration ${Math.max(.034,(frames[i+1]?.time??f.time+.4)-f.time)}\n`;});list+=`file '${frames.at(-1).file.replaceAll('\\','')}'\n`;
 // Use a final duplicate frame with an absolute, normalized path.
 list=list.slice(0,list.lastIndexOf('file '))+`file '${frames.at(-1).file.replaceAll('\\','/')}'\n`;
 const concat=path.join(folder,'frames.txt');fs.writeFileSync(concat,list);
 const r=spawnSync(ff,['-v','error','-y','-safe','0','-i',concat,'-r','30','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p',path.join(out,id+'.mp4')],{encoding:'utf8'});if(r.status)throw Error(r.stderr);console.log('Captured step',id);
}
async function front(p,key){await p.goto(base+'/?page_id='+pages[key],{waitUntil:'networkidle'});await p.addStyleTag({content:'header,footer{display:none!important}main{margin-block-start:0!important;padding:24px!important}.wp-block-post-title{font-size:32px!important;margin:12px auto 25px!important}.wp-block-post-content{margin-top:0!important}.wp-block-post-content h2{font-size:24px!important;margin:14px 0!important}.wp-block-post-content>*{max-width:850px!important}'});}
async function search(p,index=0,q='coffee'){const w=p.locator('.mk-simple-live-search').nth(index);await w.locator('input').pressSequentially(q,{delay:130});await w.locator('a').first().waitFor();return w;}
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const ctx=await b.newContext({viewport:{width:1000,height:620}});
 await ctx.addInitScript(()=>{document.addEventListener('click',e=>{const ring=document.createElement('div');Object.assign(ring.style,{position:'fixed',left:(e.clientX-24)+'px',top:(e.clientY-24)+'px',width:'48px',height:'48px',border:'4px solid #ed9f22',borderRadius:'50%',pointerEvents:'none',zIndex:'2147483647'});document.body.appendChild(ring);setTimeout(()=>ring.remove(),650);},true);});
 const p=await ctx.newPage();await p.goto(base+'/wp-login.php');await p.locator('#user_login').fill(process.env.WP_DEMO_USER);await p.locator('#user_pass').fill(process.env.WP_DEMO_PASSWORD);await p.locator('#wp-submit').click();await p.waitForURL('**/wp-admin/');
 await p.goto(base+'/wp-admin/plugins.php',{waitUntil:'networkidle'});await p.locator('[data-slug="mk-simple-live-search"]').scrollIntoViewIfNeeded();
 await p.addStyleTag({content:'[data-slug="mk-simple-live-search"]{outline:4px solid #ed9f22!important;outline-offset:-4px}'});
 await record(p,'01',async()=>{await p.locator('[data-slug="mk-simple-live-search"] .deactivate').hover();});
 await p.goto(base+'/wp-admin/post.php?post=130&action=edit',{waitUntil:'domcontentloaded'});await p.getByRole('button',{name:'Close',exact:true}).click({timeout:5000}).catch(()=>{});
 const field=p.frameLocator('iframe[name="editor-canvas"]').getByRole('textbox',{name:'Shortcode text'});await field.waitFor();await field.fill('');await field.scrollIntoViewIfNeeded();
 await record(p,'02',async()=>{await field.pressSequentially('[mk_simple_live_search]',{delay:110});await p.getByRole('button',{name:'Save',exact:true}).click();await pause(600);});
 const v=await b.newContext({viewport:{width:1000,height:620}});const view=await v.newPage();
 await front(view,'default');await record(view,'03',async()=>{const w=await search(view);if(await w.locator('a').count()!==4)throw Error('Expected four default results');await pause(900);await w.locator('a').first().click();await view.waitForLoadState('networkidle');});
 for(const [id,key,count] of [['04','title',3],['05','content',1],['06','limit',2],['07','portfolio',1]]){await front(view,key);await record(view,id,async()=>{const w=await search(view);if(await w.locator('a').count()!==count)throw Error('Unexpected '+key+' result count');});}
 await front(view,'multiple');await record(view,'08',async()=>{await search(view);await pause(600);await view.keyboard.press('Escape');const w=view.locator('.mk-simple-live-search').nth(1);await w.locator('input').click();await search(view,1,'home');});
 await front(view,'default');await search(view);await record(view,'09',async()=>{const input=view.locator('input.mk-simple-live-search-input');await input.press('ArrowDown');await pause(900);await view.keyboard.press('Escape');await input.fill('nomatchingresult');await view.locator('.mk-simple-no-results').waitFor();});
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
