import './styles.css';
import {canAnalyze,localWaveform} from './waveform.ts';
import {clipFingerprint} from './fingerprint.ts';
import {sampleCues,restore,stamp,playheadStamp,rangeAtPlayhead,captionsAt,markerLanes,updateCueText,type Cue} from './cues.ts';
import {icon,paintIcons} from './icons.ts';
import {el,setText,listen,toast,modal,dialog,btn} from './dom.ts';
import {assistant,cueDetails,exportDialog,guide,privacy} from './dialogs.ts';
import {configured} from './inference.ts';
import {deviceAvailability,draftOptions,type Availability} from './policy.ts';
const base=import.meta.env.BASE_URL;
const media=el<HTMLVideoElement>('video'), seek=el<HTMLInputElement>('seek'), note=el<HTMLTextAreaElement>('note'), caption=el<HTMLTextAreaElement>('caption');
const sampleKey='foleyfold:reel:v1';
let sampleWaveform:number[]=[];
let key=sampleKey,name='Last Light Express',duration=18,objectUrl='',waveform:number[]=[],showCC=true;
let savedSnapshot:string|null=null;
function load(initial:Cue[]){try{savedSnapshot=localStorage.getItem(key);return restore(savedSnapshot,initial,duration);}catch{return structuredClone(initial);}}
let cues=load(sampleCues),selected=cues[0]?.id;
const active=()=>cues.find(c=>c.id===selected);
let deviceState:Availability|'checking'='checking',probeVersion=0;
function showDraftOptions(){
 const {canTry,status,hint}=draftOptions(configured,deviceState,navigator.onLine);
 el('assist').hidden=!canTry;setText('draftStatus',status);setText('draftHint',hint);
}
async function checkDraftOptions(){
 const version=++probeVersion;
 showDraftOptions();if(!configured)return;
 const state=await deviceAvailability();
 if(version===probeVersion){deviceState=state;showDraftOptions();}
}
void checkDraftOptions();
window.addEventListener('online',checkDraftOptions);
window.addEventListener('offline',checkDraftOptions);
function persist(){
 try {
  if(localStorage.getItem(key)!==savedSnapshot){el('backup').hidden=false;setText('storageStatus','Conflicting edits · download a full cue backup before reloading');toast('Another tab saved this reel. Use the full cue backup below to keep every note and draft.');return;}
  const next=JSON.stringify(cues);localStorage.setItem(key,next);savedSnapshot=next;setText('storageStatus','Cue edits saved in this browser');
 }catch{el('backup').hidden=false;setText('storageStatus','Storage unavailable · download a full cue backup');}
}
listen('backup',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,reel:name,cues},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='foleyfold-cue-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('All notes, timings, draft and approved captions downloaded.');});
window.addEventListener('storage',e=>{if((e.key===key||e.key===null)&&e.newValue!==savedSnapshot){setText('storageStatus','Another tab changed this reel · reload before saving');}});
function order(){cues.sort((a,b)=>a.start-b.start);}
function tick(){const t=media.currentTime||0;seek.value=String(t);setText('now',playheadStamp(t));el('needle').style.left=Math.min(99.8,t/duration*100)+'%';
 const subtitles=showCC?captionsAt(cues,t):'';if(el('subtitle').textContent!==subtitles){setText('subtitle',subtitles);el('subtitle').classList.toggle('stacked',subtitles.includes('\n'));}}
function drawWave(){const cv=el<HTMLCanvasElement>('wave');const {width,height}=cv.getBoundingClientRect();const ratio=window.devicePixelRatio||1;cv.width=Math.round(width*ratio);cv.height=Math.round(height*ratio);const g=cv.getContext('2d');if(!g)return;g.scale(ratio,ratio);
 const c=active();if(c){g.fillStyle='#efcfb8';g.fillRect(c.start/duration*width,0,(c.end-c.start)/duration*width,height);}
 for(let x=0;x<width;x+=3){const where=x/width;g.fillStyle=c&&where*duration>=c.start&&where*duration<c.end?'#9c5639':'#637967';const first=Math.floor(where*waveform.length),last=Math.min(waveform.length,Math.ceil((x+3)/width*waveform.length));let v=0;for(let i=first;i<last;i++)v=Math.max(v,waveform[i]);const h=waveform.length?Math.max(1,Math.pow(v,.69)*(height-5)):1;g.fillRect(x,(height-h)/2,1.8,h);}
}
function select(id:string,move=true){selected=id;if(move&&active()){media.pause();media.currentTime=active()!.start;}render();}
function renderRows(){
 const rows=el('rows'),markers=el('markers');
 const focused=document.activeElement as HTMLElement|null;
 const group=focused?.parentElement;const focusId=focused?.dataset.cue;
 rows.replaceChildren();markers.replaceChildren();
 const lanes=markerLanes(cues);markers.style.height=(Math.max(0,...lanes)+1)*23+'px';
 cues.forEach((c,i)=>{const on=c.id===selected;const b=document.createElement('button');b.dataset.cue=c.id;b.className='row'+(on?' on':'');b.setAttribute('aria-pressed',String(on));b.innerHTML='<span class="rowno"></span><strong></strong><span class="mono"></span><span class="excerpt"></span><span class="status"></span>'+icon('arrow');
 [String(i+1).padStart(2,'0'),c.title,stamp(c.start,true)+' – '+stamp(c.end,true),c.caption||c.note||'No listening note',c.approved?'APPROVED':'DRAFT'].forEach((v,j)=>b.children[j].textContent=v);b.children[4].classList.toggle('ready',c.approved);b.onclick=()=>select(c.id);rows.append(b);
 const m=document.createElement('button');m.textContent=String(i+1).padStart(2,'0');m.dataset.cue=c.id;m.setAttribute('aria-label',m.textContent+': select '+c.title);m.setAttribute('aria-pressed',String(on));m.className=on?'on':'';m.style.top=lanes[i]*23+'px';m.style.left=c.start/duration*100+'%';m.style.width=(c.end-c.start)/duration*100+'%';m.onclick=()=>select(c.id);markers.append(m);
 });if(!cues.length){rows.innerHTML='<p class="sheetEmpty">No sounds marked yet. Play the clip and add your first cue.</p>';}
 if(focusId&&(group===markers||group===rows))Array.from(group.children).find(e=>(e as HTMLElement).dataset.cue===focusId)?.closest('button')?.focus({preventScroll:true});
 setText('tally',cues.filter(c=>c.approved).length+' / '+cues.length+' approved');
}
function meta(){const c=active();if(!c)return;setText('charCount',caption.value.length+' / 160');setText('reviewState',c.approved?'Approved for export':'Draft · approve before export');el<HTMLButtonElement>('approve').disabled=!c.caption.trim()||c.approved;el('approve').querySelector('span')!.textContent=c.approved?'Caption approved':'Approve caption';}
function render(){setText('reviewAlert','');const c=active();el('editing').hidden=!c;el('emptyEditor').hidden=!!c;setText('cueNumber',c?'CUE '+String(cues.indexOf(c)+1).padStart(2,'0')+' / '+String(cues.length).padStart(2,'0'):'NO CUES');
 if(c){setText('title',c.title);setText('timing',stamp(c.start,true)+'  →  '+stamp(c.end,true)+'   /   '+(c.end-c.start).toFixed(1)+' s');note.value=c.note;caption.value=c.caption;meta();}
 setText('projectName',name);setText('length',playheadStamp(duration));seek.max=String(duration);
 document.querySelector('.ticks')!.replaceChildren(...[0,1,2,3,4].map(n=>{const s=document.createElement('span');s.textContent=stamp(duration*n/4);return s;}));
 document.querySelector('.screen')!.classList.toggle('sample',key===sampleKey);renderRows();drawWave();tick();
}
function editText(){const c=active();if(!c)return;const wasApproved=c.approved;updateCueText(c,note.value,caption.value);caption.value=c.caption;persist();meta();renderRows();tick();if(wasApproved&&!c.approved)setText('reviewAlert','Caption changed. Approve it again before export.');}
note.oninput=editText;caption.oninput=editText;
listen('approve',()=>{const c=active();if(!c||!c.caption.trim())return;c.caption=c.caption.trim();c.approved=true;persist();render();toast('Caption approved for export.');});
listen('assist',()=>{const c=active();if(c)assistant({...c},v=>{if(active()?.id!==c.id)return;caption.value=v;editText();});});
function editDetails(c:Cue,isNew=false){cueDetails(c,duration,v=>{if(isNew)cues.push(v);else cues[cues.findIndex(x=>x.id===v.id)]=v;order();persist();select(v.id);},()=>{cues=cues.filter(x=>x.id!==c.id);selected=cues[0]?.id;persist();render();},isNew);}
listen('details',()=>{const c=active();if(c)editDetails(c);});
function add(){if(cues.length>=500){toast('This reel has reached its 500-cue limit.');return;}media.pause();const range=rangeAtPlayhead(duration,media.currentTime||0);if(!range){toast('Less than 0.1 seconds left. Seek earlier to add a cue at the playhead.');return;}editDetails({id:crypto.randomUUID(),title:'New sound',start:range[0],end:range[1],note:'',caption:'',approved:false},true);}
listen('add',add);listen('firstCue',add);
listen('play',()=>{if(media.paused)void media.play().catch(()=>toast('Playback is unavailable. Try a browser-supported clip.'));else media.pause();});
let playbackFrame=0;
function followPlayback(){tick();if(!media.paused&&!media.ended)playbackFrame=requestAnimationFrame(followPlayback);}
function updatePlay(){cancelAnimationFrame(playbackFrame);followPlayback();el('play').innerHTML=icon(media.paused?'play':'pause');el('play').setAttribute('aria-label',media.paused?'Play film':'Pause film');}
media.onplay=updatePlay;media.onpause=updatePlay;media.ontimeupdate=tick;media.onseeked=tick;seek.oninput=()=>{media.currentTime=Number(seek.value);tick();};listen('cc',()=>{showCC=!showCC;el('cc').setAttribute('aria-pressed',String(showCC));tick();});listen('mute',()=>{media.muted=!media.muted;el('mute').innerHTML=icon(media.muted?'muted':'sound');el('mute').setAttribute('aria-pressed',String(media.muted));el('mute').setAttribute('aria-label',media.muted?'Unmute sound':'Mute sound');});
listen('guide',guide);listen('privacy',privacy);listen('export',()=>exportDialog(cues,name));listen('close',()=>modal().close());modal().addEventListener('click',ev=>{if(ev.target===modal()){const r=modal().getBoundingClientRect();if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)modal().close();}});
function openPicker(){el<HTMLInputElement>('file').click();}
function clipDuration(url:string):Promise<number> {
 const probe=document.createElement('video');probe.preload='metadata';
 return new Promise<number>((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(new Error('Timed out reading media')),10000);
  probe.onloadedmetadata=()=>{clearTimeout(timeout);const d=probe.duration;if(Number.isFinite(d)&&d>=.1&&d<=86400)resolve(d);else reject(new Error('Invalid duration'));};
  probe.onerror=()=>{clearTimeout(timeout);reject(new Error('Unsupported media'));};
  probe.src=url;
 }).finally(()=>{probe.onloadedmetadata=null;probe.onerror=null;probe.removeAttribute('src');probe.load();});
}
let opening=0;
let pendingWave:Promise<void>=Promise.resolve();
function analyzeReel(file:File,seconds:number,url:string){
 if(!canAnalyze(file.size,seconds)){setText('trackType','TIMING ONLY · LARGE CLIP');return;}
 setText('trackType','READING LOCAL AUDIO…');
 pendingWave=pendingWave.then(async()=>{
  if(objectUrl!==url)return;
  try{
   const peaks=await localWaveform(file,seconds);
   if(objectUrl===url){waveform=peaks;setText('trackType','AMPLITUDE · LOCAL AUDIO');drawWave();}
  }catch{if(objectUrl===url)setText('trackType','TIMING ONLY · AUDIO UNAVAILABLE');}
 });
}
function switchReel(url:string,reelKey:string,reelName:string,seconds:number) {
 const old=objectUrl,sample=reelKey===sampleKey;
 media.pause();objectUrl=url;key=reelKey;name=reelName;duration=seconds;
 media.removeAttribute('poster');media.src=url;media.load();if(old)URL.revokeObjectURL(old);
 waveform=sample?sampleWaveform:[];cues=load(sample?sampleCues:[]);selected=cues[0]?.id;
 setText('filmBadge',sample?'STUDIO SAMPLE':'LOCAL CLIP');
 setText('filmType',sample?'ORIGINAL SHORT  /  FOLEYFOLD':'PRIVATE FILE  /  THIS DEVICE');
 setText('frameLabel',sample?'REEL 01':'LOCAL REEL');
 setText('trackType',sample&&waveform.length?'AMPLITUDE · MONO':'CUE TIMING');
 modal().close();render();toast(sample?'Studio sample opened.':'Local clip opened.');
}
async function returnToSample() {
 const button=el<HTMLButtonElement>('sample'),status=el('openStatus');
 const attempt=++opening;
 if(!navigator.onLine){status.textContent='You’re offline. Your clip is still open. Reconnect to load the studio sample.';return;}
 button.disabled=true;status.textContent='Loading the studio sample…';
 let url='';
 try {
  const response=await fetch(base+'last-light.mp4',{signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('Sample unavailable');
  url=URL.createObjectURL(await response.blob());
  const seconds=await clipDuration(url);
  if(attempt!==opening||!modal().open||!button.isConnected)return;
  switchReel(url,sampleKey,'Last Light Express',seconds);url='';
 }catch{if(attempt===opening&&button.isConnected)status.textContent='The studio sample couldn’t load. Your clip and cue sheet are still open.';}
 finally{if(url)URL.revokeObjectURL(url);button.disabled=false;}
}
listen('import',()=>{
 dialog('Open a local clip','<p>Choose a browser-playable audio or video file. It stays on this device. Reopening the same file restores its cue sheet in this browser.</p>'+btn('choose','Choose file')+(key!==sampleKey?' <button class="btn" id="sample">Return to studio sample</button>':'')+'<p id="openStatus" role="status"></p>');
 listen('choose',openPicker);if(key!==sampleKey)listen('sample',returnToSample);
});
el<HTMLInputElement>('file').onchange=async ev=>{
 const input=ev.target as HTMLInputElement,file=input.files?.[0];input.value='';if(!file)return;
 const attempt=++opening,choose=el('choose'),url=URL.createObjectURL(file);let kept=false;
 try{
  const seconds=await clipDuration(url);
  toast('Identifying the local clip…');const hash=await clipFingerprint(file);
  if(attempt!==opening||!modal().open||!choose?.isConnected)return;
  switchReel(url,'foleyfold:file:'+hash,file.name,seconds);kept=true;analyzeReel(file,seconds,url);
 }catch{if(attempt===opening)toast('Could not open this clip. Try a playable MP4, WebM, or audio file under 24 hours.');}
 finally{if(!kept)URL.revokeObjectURL(url);}
};
paintIcons();render();new ResizeObserver(drawWave).observe(el('wave'));
void fetch(base+'waveform.json').then(r=>r.json()).then(v=>{if(Array.isArray(v)){sampleWaveform=v;if(key===sampleKey){waveform=v;setText('trackType','AMPLITUDE · MONO');drawWave();}}}).catch(()=>{if(key===sampleKey)setText('trackType','CUE TIMING');});
