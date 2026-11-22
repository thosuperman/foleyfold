import './styles.css';
import {clipFingerprint} from './fingerprint.ts';
import {sampleCues,restore,stamp,nextGap,type Cue} from './cues.ts';
import {icon,paintIcons} from './icons.ts';
import {el,setText,listen,toast,modal,dialog,btn} from './dom.ts';
import {assistant,cueDetails,exportDialog,guide,privacy} from './dialogs.ts';
const base=import.meta.env.BASE_URL;
const media=el<HTMLVideoElement>('video'), seek=el<HTMLInputElement>('seek'), note=el<HTMLTextAreaElement>('note'), caption=el<HTMLTextAreaElement>('caption');
let key='foleyfold:reel:v1',name='Last Light Express',duration=18,objectUrl='',waveform:number[]=[],showCC=true;
let savedSnapshot:string|null=null;
function load(initial:Cue[]){try{savedSnapshot=localStorage.getItem(key);return restore(savedSnapshot,initial,duration);}catch{return structuredClone(initial);}}
let cues=load(sampleCues),selected=cues[0]?.id;
const active=()=>cues.find(c=>c.id===selected);
function persist(){
 try {
  if(localStorage.getItem(key)!==savedSnapshot){setText('storageStatus','Another tab changed this reel · reload before saving');toast('Another tab saved this reel. This tab’s edits are not saved. Export before reloading.');return;}
  const next=JSON.stringify(cues);localStorage.setItem(key,next);savedSnapshot=next;setText('storageStatus','Cue edits saved in this browser');
 }catch{setText('storageStatus','Storage unavailable · export to keep captions');}
}
window.addEventListener('storage',e=>{if((e.key===key||e.key===null)&&e.newValue!==savedSnapshot){setText('storageStatus','Another tab changed this reel · reload before saving');}});
function order(){cues.sort((a,b)=>a.start-b.start);}
function tick(){const t=media.currentTime||0;seek.value=String(t);setText('now',stamp(t));el('needle').style.left=Math.min(99.8,t/duration*100)+'%';
 const c=cues.find(c=>c.approved&&t>=c.start&&t<c.end);setText('subtitle',showCC&&c?c.caption:'');}
function drawWave(){const cv=el<HTMLCanvasElement>('wave');const {width,height}=cv.getBoundingClientRect();const ratio=window.devicePixelRatio||1;cv.width=Math.round(width*ratio);cv.height=Math.round(height*ratio);const g=cv.getContext('2d');if(!g)return;g.scale(ratio,ratio);
 const c=active();if(c){g.fillStyle='#efcfb8';g.fillRect(c.start/duration*width,0,(c.end-c.start)/duration*width,height);}
 for(let x=0;x<width;x+=3){const where=x/width;g.fillStyle=c&&where*duration>=c.start&&where*duration<c.end?'#9c5639':'#637967';const v=waveform.length?(waveform[Math.min(waveform.length-1,Math.floor(where*waveform.length))]||0):0;const h=waveform.length?Math.max(1,Math.pow(v,.69)*(height-5)):1;g.fillRect(x,(height-h)/2,1.8,h);}
}
function select(id:string,move=true){selected=id;if(move&&active()){media.pause();media.currentTime=active()!.start;}render();}
function renderRows(){
 const rows=el('rows'),markers=el('markers');rows.replaceChildren();markers.replaceChildren();
 cues.forEach((c,i)=>{const on=c.id===selected;const b=document.createElement('button');b.className='row'+(on?' on':'');b.setAttribute('aria-pressed',String(on));b.innerHTML='<span class="rowno"></span><strong></strong><span class="mono"></span><span class="excerpt"></span><span class="status"></span>'+icon('arrow');
 [String(i+1).padStart(2,'0'),c.title,stamp(c.start,true)+' – '+stamp(c.end,true),c.caption||c.note||'No listening note',c.approved?'APPROVED':'DRAFT'].forEach((v,j)=>b.children[j].textContent=v);b.children[4].classList.toggle('ready',c.approved);b.onclick=()=>select(c.id);rows.append(b);
 const m=document.createElement('button');m.textContent=String(i+1).padStart(2,'0');m.setAttribute('aria-label','Select '+c.title);m.setAttribute('aria-pressed',String(on));m.className=on?'on':'';m.style.left=c.start/duration*100+'%';m.style.width=(c.end-c.start)/duration*100+'%';m.onclick=()=>select(c.id);markers.append(m);
 });if(!cues.length){rows.innerHTML='<p class="sheetEmpty">No sounds marked yet. Play the clip and add your first cue.</p>';}
 setText('tally',cues.filter(c=>c.approved).length+' / '+cues.length+' approved');
}
function meta(){const c=active();if(!c)return;setText('charCount',caption.value.length+' / 160');setText('reviewState',c.approved?'Approved for export':'Draft · not in export');el<HTMLButtonElement>('approve').disabled=!c.caption.trim()||c.approved;el('approve').querySelector('span')!.textContent=c.approved?'Caption approved':'Approve caption';}
function render(){const c=active();el('editing').hidden=!c;el('emptyEditor').hidden=!!c;setText('cueNumber',c?'CUE '+String(cues.indexOf(c)+1).padStart(2,'0')+' / '+String(cues.length).padStart(2,'0'):'NO CUES');
 if(c){setText('title',c.title);setText('timing',stamp(c.start,true)+'  →  '+stamp(c.end,true)+'   /   '+(c.end-c.start).toFixed(1)+' s');note.value=c.note;caption.value=c.caption;meta();}
 setText('projectName',name);setText('length',stamp(duration));seek.max=String(duration);
 document.querySelector('.ticks')!.replaceChildren(...[0,1,2,3,4].map(n=>{const s=document.createElement('span');s.textContent=stamp(duration*n/4);return s;}));
 document.querySelector('.screen')!.classList.toggle('sample',!objectUrl);renderRows();drawWave();tick();
}
function editText(){const c=active();if(!c)return;c.note=note.value;c.caption=caption.value.replace(/[\r\n]+/g,' ');caption.value=c.caption;c.approved=false;persist();meta();renderRows();tick();}
note.oninput=editText;caption.oninput=editText;
listen('approve',()=>{const c=active();if(!c||!c.caption.trim())return;c.caption=c.caption.trim();c.approved=true;persist();render();toast('Caption approved for export.');});
listen('assist',()=>{const c=active();if(c)assistant({...c},v=>{if(active()?.id!==c.id)return;caption.value=v;editText();});});
function editDetails(c:Cue,isNew=false){cueDetails(c,cues,duration,v=>{if(isNew)cues.push(v);else cues[cues.findIndex(x=>x.id===v.id)]=v;order();persist();select(v.id);},()=>{cues=cues.filter(x=>x.id!==c.id);selected=cues[0]?.id;persist();render();},isNew);}
listen('details',()=>{const c=active();if(c)editDetails(c);});
function add(){if(cues.length>=500){toast('This reel has reached its 500-cue limit.');return;}const gap=nextGap(cues,duration,media.currentTime||0);if(!gap){toast('No free time. Shorten a cue to make room.');return;}media.pause();editDetails({id:crypto.randomUUID(),title:'New sound',start:gap[0],end:gap[1],note:'',caption:'',approved:false},true);}
listen('add',add);listen('firstCue',add);
listen('play',()=>{if(media.paused)void media.play().catch(()=>toast('Playback is unavailable. Try a browser-supported clip.'));else media.pause();});
function updatePlay(){el('play').innerHTML=icon(media.paused?'play':'pause');el('play').setAttribute('aria-label',media.paused?'Play film':'Pause film');}
media.onplay=updatePlay;media.onpause=updatePlay;media.ontimeupdate=tick;media.onseeked=tick;seek.oninput=()=>{media.currentTime=Number(seek.value);tick();};listen('cc',()=>{showCC=!showCC;el('cc').setAttribute('aria-pressed',String(showCC));tick();});listen('mute',()=>{media.muted=!media.muted;el('mute').innerHTML=icon(media.muted?'muted':'sound');el('mute').setAttribute('aria-pressed',String(media.muted));el('mute').setAttribute('aria-label',media.muted?'Unmute sound':'Mute sound');});
listen('guide',guide);listen('privacy',privacy);listen('export',()=>exportDialog(cues,name));listen('close',()=>modal().close());modal().addEventListener('click',ev=>{if(ev.target===modal()){const r=modal().getBoundingClientRect();if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)modal().close();}});
function openPicker(){el<HTMLInputElement>('file').click();}
listen('import',()=>{dialog('Open a local clip','<p>Choose a browser-playable audio or video file. It stays on this device. Reopening the same file restores its cue sheet in this browser.</p>'+btn('choose','Choose file')+(objectUrl?' <button class="btn" id="sample">Return to studio sample</button>':''));listen('choose',openPicker);if(objectUrl)listen('sample',()=>location.reload());});
let opening=0;
el<HTMLInputElement>('file').onchange=async ev=>{const input=ev.target as HTMLInputElement,file=input.files?.[0];input.value='';if(!file)return;
 const attempt=++opening,url=URL.createObjectURL(file),probe=document.createElement('video');probe.preload='metadata';let kept=false;let timer:ReturnType<typeof setTimeout>|undefined;
 try{await new Promise<void>((resolve,reject)=>{timer=setTimeout(()=>reject(new Error()),10000);probe.onloadedmetadata=()=>resolve();probe.onerror=()=>reject(new Error());probe.src=url;});
 if(!Number.isFinite(probe.duration)||probe.duration<.1||probe.duration>86400)throw new Error();
 toast('Identifying the local clip…');const hash=await clipFingerprint(file);if(attempt!==opening)return;
 const old=objectUrl;objectUrl=url;kept=true;key='foleyfold:file:'+hash;duration=probe.duration;name=file.name;media.pause();media.removeAttribute('poster');media.src=url;media.load();if(old)URL.revokeObjectURL(old);waveform=[];cues=load([]);selected=cues[0]?.id;
 setText('filmBadge','LOCAL CLIP');setText('filmType','PRIVATE FILE  /  THIS DEVICE');setText('frameLabel','LOCAL REEL');setText('trackType','CUE TIMING');modal().close();render();toast('Local clip opened.');
 }catch{toast('Could not open this clip. Try a playable MP4, WebM, or audio file under 24 hours.');}finally{clearTimeout(timer);probe.removeAttribute('src');probe.load();if(!kept)URL.revokeObjectURL(url);}
};
paintIcons();render();new ResizeObserver(drawWave).observe(el('wave'));void fetch(base+'waveform.json').then(r=>r.json()).then(v=>{if(!objectUrl&&Array.isArray(v)){waveform=v;drawWave();}}).catch(()=>setText('trackType','CUE TIMING'));
