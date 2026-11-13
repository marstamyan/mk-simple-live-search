import React from 'react';
import {AbsoluteFill, Composition, Img, interpolate, OffthreadVideo, registerRoot, Sequence, staticFile, useCurrentFrame} from 'remotion';
import chapters from '../chapters.json';

const fps=30;
const introFrames=30;
const outroFrames=30;
const duration=introFrames+chapters.reduce((sum,c)=>sum+c.durationInFrames,0)+outroFrames;
const font='"Segoe UI", Arial, sans-serif';
const color={bg:'#101b2d',mint:'#79e6c2',white:'#f5f7fb',muted:'#bbc7da'};
const Intro=()=>{const frame=useCurrentFrame();return <AbsoluteFill style={{background:color.bg,color:color.white,fontFamily:font,padding:110,justifyContent:'center'}}>
 <div style={{fontSize:25,letterSpacing:4,color:color.mint,marginBottom:40}}>MK SIMPLE LIVE SEARCH · WORDPRESS</div>
 <div style={{fontSize:106,fontWeight:650,lineHeight:1.04,opacity:interpolate(frame,[0,15],[0,1],{extrapolateRight:'clamp'})}}>Live search<br/>for WordPress</div>
 <div style={{fontSize:38,color:color.muted,marginTop:45}}>Shortcodes, settings and live results</div>
 <div style={{fontSize:26,color:color.mint,marginTop:65}}>Recorded on WordPress 7.1.4 · PHP 8.4</div>
</AbsoluteFill>};
const Chapter=({chapter,index,graphicsOnly}:{chapter:typeof chapters[number],index:number,graphicsOnly?:boolean})=><AbsoluteFill style={{background:color.bg,fontFamily:font,color:color.white}}>
 <div style={{position:'absolute',left:72,top:32,fontSize:34,fontWeight:600}}>{chapter.title}</div>
 <div style={{position:'absolute',right:74,top:38,fontSize:25,color:color.mint}}>0{index+1} / 06</div>
 <div style={{position:'absolute',left:176,top:102,width:1568,height:882,border:'1px solid #4d5c72',borderRadius:10,overflow:'hidden',background:'#fff',boxShadow:'0 20px 60px #0007'}}>
  {!graphicsOnly&&<OffthreadVideo src={staticFile(chapter.id+'.mp4')} style={{width:'100%',height:'100%'}} muted />}
 </div>
 <div style={{position:'absolute',left:0,right:0,bottom:0,height:138,background:'linear-gradient(transparent,#101b2d 34%)',display:'flex',alignItems:'flex-end',padding:'0 90px 28px',textAlign:'center',justifyContent:'center'}}>
  <div style={{fontSize:29,lineHeight:1.3,maxWidth:1680,color:color.white}}>{chapter.subtitle}</div>
 </div>
</AbsoluteFill>;
const Outro=()=> <AbsoluteFill style={{background:color.bg,color:color.white,fontFamily:font,padding:100,justifyContent:'center'}}>
 <div style={{fontSize:28,letterSpacing:3,color:color.mint,marginBottom:35}}>START SEARCHING</div>
 <div style={{fontSize:84,fontWeight:600}}>One shortcode. Live results.</div>
 <div style={{fontFamily:'Consolas, monospace',fontSize:46,color:color.mint,marginTop:45,marginBottom:45}}>[mk_simple_live_search]</div>
 <div style={{fontSize:32,lineHeight:1.5,color:color.muted}}>Search public posts and pages.<br/>3+ characters · up to 20 results · multiple independent fields</div>
 <div style={{fontSize:25,color:color.muted,marginTop:55}}>Recorded in a real WordPress installation.<br/>English captions · no narration.</div>
</AbsoluteFill>;
const Tutorial=({graphicsOnly=false}:{graphicsOnly?:boolean})=>{let start=introFrames;return <AbsoluteFill>
 <Sequence durationInFrames={introFrames}><Intro/></Sequence>
 {chapters.map((chapter,index)=>{const from=start;start+=chapter.durationInFrames;return <Sequence key={chapter.id} from={from} durationInFrames={chapter.durationInFrames}><Chapter chapter={chapter} index={index} graphicsOnly={graphicsOnly}/></Sequence>})}
 <Sequence from={start} durationInFrames={outroFrames}><Outro/></Sequence>
</AbsoluteFill>};
registerRoot(()=> <Composition id="MKLiveSearchTutorial" component={Tutorial} durationInFrames={duration} fps={fps} width={1920} height={1080}/>);
