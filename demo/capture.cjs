/* Records real browser frames from the isolated WordPress demo. No simulated UI. */
const fs=require('node:fs');const path=require('node:path');const {spawnSync}=require('node:child_process');
const playwrightRoot=process.env.PLAYWRIGHT_MODULE||'C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1112-737-0_26.1112.737.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright';
const {chromium}=require(playwrightRoot);
const ffmpeg=process.env.FFMPEG||path.resolve(__dirname,'../../simple-alert-box/.local/promo-build/node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe');
const root=path.resolve(__dirname,'../.local/video-frames');fs.mkdirSync(root,{recursive:true});
const out=path.join(__dirname,'public');fs.mkdirSync(out,{recursive:true});
const base=process.env.WP_DEMO_URL||'http://localhost:8766';
const user=process.env.WP_DEMO_USER;
const password=process.env.WP_DEMO_PASSWORD;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const now=()=>Number(process.hrtime.bigint())/1e9;
const chapters=process.env.CAPTURE_RESUME&&fs.existsSync(path.join(__dirname,'chapters.json'))?JSON.parse(fs.readFileSync(path.join(__dirname,'chapters.json'))):[];
async function record(page,id,title,subtitle,action){
 if(chapters.some(c=>c.id===id)){console.log('Already captured',id);return;}
 const dir=path.join(root,id);fs.mkdirSync(dir,{recursive:true});
 const client=await page.context().newCDPSession(page);await client.send('Page.enable');
 const frames=[];let n=0;const start=now();
 const save=(data,time)=>{const file=path.join(dir,String(n++).padStart(5,'0')+'.jpg');fs.writeFileSync(file,data);frames.push({file,time});};
 save(await page.screenshot({type:'jpeg',quality:90}),0);
 client.on('Page.screencastFrame',async e=>{save(Buffer.from(e.data,'base64'),now()-start);await client.send('Page.screencastFrameAck',{sessionId:e.sessionId}).catch(()=>{});});
 await client.send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:1440,maxHeight:810,everyNthFrame:1});
 await action();await wait(500);
 await client.send('Page.stopScreencast');
 save(await page.screenshot({type:'jpeg',quality:90}),now()-start);
 await client.detach();
 const duration=frames.at(-1).time+0.5;
 let concat='ffconcat version 1.0\n';
 frames.forEach((f,i)=>{concat+=`file '${f.file.replaceAll('\\','/')}'\nduration ${Math.max(0.016,(frames[i+1]?.time??duration)-f.time)}\n`;});
 concat+=`file '${frames.at(-1).file.replaceAll('\\','/')}'\n`;
 const listing=path.join(dir,'frames.ffconcat');fs.writeFileSync(listing,concat);
 const video=path.join(out,id+'.mp4');
 const encoded=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-safe','0','-i',listing,'-r','30','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',video],{encoding:'utf8'});
 if(encoded.status!==0)throw Error(encoded.stderr);
 chapters.push({id,title,subtitle,durationInFrames:Math.ceil(duration*30)});
 chapters.sort((a,b)=>a.id.localeCompare(b.id));
 fs.writeFileSync(path.join(__dirname,'chapters.json'),JSON.stringify(chapters,null,2));
 console.log('Captured',id,duration.toFixed(1)+'s',frames.length+' real frames');
}
async function front(page,url){
 await page.goto(base+url,{waitUntil:'networkidle'});
 // Demo theme presentation only; the plugin and its results remain unmodified.
 await page.addStyleTag({content:'main{margin-block-start:32px!important;padding-top:0!important}.wp-block-post-title{font-size:38px!important;margin-block:24px!important}.wp-block-post-content{margin-block-start:20px!important;font-size:19px!important}.wp-block-post-content pre{font-size:16px!important;padding:14px 18px!important;background:#f4f5f7;border-radius:6px}.wp-block-post-content h2{font-size:27px!important;margin-block:24px 10px!important}.wp-block-post-content p{margin-block:12px!important}footer{display:none!important}'});
}
async function type(locator,text,delay=80){await locator.click();await locator.fill('');await locator.pressSequentially(text,{delay});}
(async()=>{
 if(!user||!password)throw Error('Set WP_DEMO_USER and WP_DEMO_PASSWORD for your disposable local WordPress.');
 const pageIds={};
 for(const [key,slug] of Object.entries({default:'live-search',modes:'search-modes',options:'search-options',editor:'search-tutorial'})){
  const response=await fetch(base+'/?rest_route=/wp/v2/pages&slug='+slug);const data=await response.json();
  if(!Array.isArray(data)||!data.length)throw Error('Missing demo page '+slug+'; run demo/setup-demo.php first.');pageIds[key]=data[0].id;
 }
 const browser=await chromium.launch({executablePath:process.env.BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:810},deviceScaleFactor:1});
 const page=await context.newPage();
 await page.goto(base+'/wp-login.php');await page.locator('#user_login').fill(user);await page.locator('#user_pass').fill(password);
 await Promise.all([page.waitForURL('**/wp-admin/'),page.locator('#wp-submit').click()]);
 await page.goto(base+'/wp-admin/plugins.php',{waitUntil:'networkidle'});
 await record(page,'01-install','Install and activate','Upload the plugin ZIP via Plugins > Add Plugin. Check that it is active.',async()=>{
  await page.getByRole('link',{name:'Add Plugin',exact:true}).first().click();await wait(800);
  await page.getByRole('button',{name:'Upload Plugin',exact:true}).click();await wait(800);
  await page.goto(base+'/wp-admin/plugins.php',{waitUntil:'networkidle'});await page.locator('[data-slug="mk-simple-live-search"]').scrollIntoViewIfNeeded();await wait(800);
 });
 await page.goto(base+'/wp-admin/post.php?post='+pageIds.editor+'&action=edit',{waitUntil:'domcontentloaded'});await wait(800);
 await page.getByRole('button',{name:'Close',exact:true}).click({timeout:3000}).catch(()=>{});
 const editor=page.frameLocator('iframe[name="editor-canvas"]');
 const shortcode=editor.getByRole('textbox',{name:'Shortcode text'});
 await shortcode.waitFor();if(!chapters.some(c=>c.id==='02-shortcode'))await shortcode.fill('');
 await record(page,'02-shortcode','Add a Shortcode block','Enter [mk_simple_live_search] in a Shortcode block, then save the page.',async()=>{
  await wait(800);await shortcode.pressSequentially('[mk_simple_live_search]',{delay:65});await wait(800);
  await page.getByRole('button',{name:'Save',exact:true}).click();await wait(800);
 });
 const visitors=await browser.newContext({viewport:{width:1440,height:810},deviceScaleFactor:1});const view=await visitors.newPage();
 await front(view,'/?page_id='+pageIds.default);
 const field=()=>view.locator('.mk-simple-live-search-input').first();
 await record(view,'03-live','Search as you type','Enter at least 3 characters. Use Arrow Down and Enter to open a result.',async()=>{
  await type(field(),'co',120);await wait(800);await field().pressSequentially('ffee',{delay:120});
  await view.locator('.mk-simple-result-link').first().waitFor();await wait(800);
  await field().press('ArrowDown');await wait(800);await view.locator('.mk-simple-result-link').first().press('Enter');await view.waitForLoadState('networkidle');await wait(800);
 });
 await front(view,'/?page_id='+pageIds.modes);
 await record(view,'04-modes','Choose what to search','search_in="title" searches titles; search_in="content" searches the body.',async()=>{
  await type(view.locator('.mk-simple-live-search-input').nth(0),'coffee');await view.locator('.mk-simple-result-link').first().waitFor();await wait(800);
  await view.locator('.mk-simple-live-search-input').nth(1).scrollIntoViewIfNeeded();await type(view.locator('.mk-simple-live-search-input').nth(1),'coffee');
  await view.locator('.mk-simple-live-search').nth(1).locator('.mk-simple-result-link').first().waitFor();await wait(1000);
 });
 await front(view,'/?page_id='+pageIds.options);
 await record(view,'05-options','Set the limit and post type','posts_per_page="2" limits results. post_type="portfolio" searches an existing public type.',async()=>{
  await type(view.locator('.mk-simple-live-search-input').nth(0),'coffee');await view.locator('.mk-simple-result-link').first().waitFor();await wait(800);
  await view.locator('.mk-simple-live-search-input').nth(1).scrollIntoViewIfNeeded();await type(view.locator('.mk-simple-live-search-input').nth(1),'coffee');await wait(800);
 });
 await front(view,'/?page_id='+pageIds.modes);
 await record(view,'06-keyboard','Independent fields and keyboard controls','Each field keeps its own query. Escape closes results; unmatched queries show "Nothing found".',async()=>{
  await type(view.locator('.mk-simple-live-search-input').nth(0),'coffee');await wait(800);
  await view.locator('.mk-simple-live-search-input').nth(0).press('ArrowDown');await wait(800);
  await view.locator('.mk-simple-result-link').first().press('Escape');await wait(800);
  await type(view.locator('.mk-simple-live-search-input').nth(1),'nomatchingresult',95);await wait(800);
 });
 await visitors.close();await context.close();await browser.close();
 console.log('All live WordPress chapters recorded.');
})().catch(e=>{console.error(e);process.exit(1)});
