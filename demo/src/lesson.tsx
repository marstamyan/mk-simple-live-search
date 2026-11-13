import React from 'react';
import {AbsoluteFill,Composition,registerRoot} from 'remotion';
const Scene=({step}:{step:any})=><AbsoluteFill style={{background:'#edf1f6',fontFamily:'Segoe UI, Arial',color:'#142239'}}>
 <div style={{position:'absolute',left:52,top:22,fontSize:22,color:'#52647c',letterSpacing:2}}>MK SIMPLE LIVE SEARCH · STEP-BY-STEP GUIDE</div>
 <div style={{position:'absolute',left:52,top:64,fontSize:48,fontWeight:700}}>{step.title}</div>
 <div style={{position:'absolute',right:60,top:56,fontSize:30,color:'#52647c'}}>{step.id} / 09</div>
 <div style={{position:'absolute',left:52,top:180,width:420}}>
  <div style={{fontSize:22,fontWeight:700,color:'#9b5800',letterSpacing:2,marginBottom:20}}>WHAT TO DO</div>
  <div style={{fontSize:31,lineHeight:1.4,marginBottom:36}}>{step.action}</div>
  <div style={{padding:24,background:'#fff',borderLeft:'6px solid #e99d27',borderRadius:10,fontFamily:'Consolas, monospace',fontSize:27,lineHeight:1.5,overflowWrap:'anywhere'}}>{step.code}</div>
 </div>
 <div style={{position:'absolute',left:540,top:146,width:1320,height:818,background:'#fff',border:'1px solid #bdc9d8',borderRadius:8}}/>
 <div style={{position:'absolute',left:52,bottom:27,right:50,fontSize:29,lineHeight:1.3,fontWeight:600}}>{step.result}</div>
</AbsoluteFill>;
registerRoot(()=> <Composition id="Lesson" component={Scene} defaultProps={{step:{id:'01',title:'Live search',action:'',code:'',result:''}}} durationInFrames={30} fps={30} width={1920} height={1080}/>);
