import {configured,draftCaption} from './inference.ts';
import {deviceAvailability} from './policy.ts';
import {btn,dialog,el,listen,modal,setText,toast} from './dom.ts';
import {stamp,validateCue,webVtt,type Cue} from './cues.ts';
export function guide(){dialog('Field guide',[
 ['Spot a sound','Play the original film or open your own local video. Click a timeline segment or cue-sheet row to listen from that moment.'],
 ['Describe what matters','Mark an in and out point. Describe the sound you hear, not what you see. Write a concise caption, or ask the hybrid model for a draft.'],
 ['Review in context','Approve the caption, then replay with CC on. Export VTT downloads only approved lines; unreviewed notes stay here.'],
].map(([h,p],i)=>'<div class="guideStep"><span>0'+(i+1)+'</span><div><b>'+h+'</b><p>'+p+'</p></div></div>').join('')+btn('startEditing','Back to the studio'));listen('startEditing',()=>modal().close());}
export function privacy(){dialog('A private cutting room','<h3>Your footage stays here.</h3><p>Imported clips are opened from your device, never uploaded. Cue notes and captions are saved in this browser, not to an account. Reopen the same file to restore its cues.</p><h3>AI is optional.</h3><p>Only a listening note and cue duration go into the prompt. Device-only mode never sends that prompt to cloud inference. Cloud fallback is a separate choice for each request. When connected, Firebase App Check may contact Google for attestation.</p><h3>On a shared device?</h3><p>Export your work, then clear this site’s browser storage. An open studio can edit offline; a fresh load normally needs a connection.</p>');}
let revision=0;
export function assistant(cue:Cue,apply:(s:string)=>void){
 const session=++revision;const current=()=>session===revision&&modal().open&&!!el('aiState');
 dialog('Draft a sound caption','<p>Turn your listening note into a short caption. The film and its audio never go to the model.</p><div class="infoBox"><p><b>Your listening note</b></p><p id="promptNote"></p></div><p id="deviceState">Checking this device…</p><label class="consent"><input type="checkbox" id="allowCloud"><span>Allow cloud fallback for this note only.</span></label><p id="aiState" role="status"></p>'+btn('runAI','Draft on device')+'<div id="aiResult"></div>');
 setText('promptNote',cue.note||'No note yet. Close this panel and describe what you hear.');
 void deviceAvailability().then(status=>{if(current())setText('deviceState','On-device model: '+status+'.');});
 const allow=el<HTMLInputElement>('allowCloud'),run=el<HTMLButtonElement>('runAI');
 const possible=configured&&!!cue.note.trim();
 run.disabled=!possible;allow.disabled=!possible||!navigator.onLine;
 setText('aiState',!configured?'Nothing was sent. Firebase isn’t connected in this edition. Manual captioning and export are available.':!cue.note.trim()?'Add a listening note first.':'Nothing is sent until you request a draft.');
 allow.onchange=()=>{run.textContent=allow.checked?'Draft with fallback':'Draft on device';};
 run.onclick=async()=>{
  const consent=allow.checked;run.disabled=true;allow.checked=false;allow.disabled=true;run.textContent='Drafting…';setText('aiState','Preparing the model. The first download can take several minutes.');el('aiResult').replaceChildren();
  try {
   const r=await draftCaption(cue.note,cue.end-cue.start,consent,p=>{if(current())setText('aiState','Preparing device model: '+p+'%');});
   if(!current())return;setText('aiState','Inference source: '+r.source+'. Review this suggestion against the sound.');
   el('aiResult').innerHTML='<div class="infoBox"><p id="suggestion"></p></div>'+btn('useDraft','Use this draft');setText('suggestion',r.caption);
   listen('useDraft',()=>{apply(r.caption);modal().close();toast('Draft inserted. Review it before export.');});
  }catch{if(current())setText('aiState',consent?'No draft received. Check connectivity, project setup, App Check and quota, then retry. Your note is safe.':'No on-device draft received. Check model availability or opt in to cloud fallback while online. Your note is safe.');}
  finally{if(current()){run.disabled=false;allow.disabled=!navigator.onLine;run.textContent='Draft on device';}}
 };
}
export function cueDetails(cue:Cue,all:Cue[],duration:number,save:(v:Cue)=>void,remove:()=>void,isNew=false){
 dialog(isNew?'Spot a new sound':'Edit cue', '<label for="cueName">Cue name</label><input id="cueName" type="text" maxlength="64" required><div class="pair"><div><label for="inTime">In · seconds</label><input id="inTime" type="number" min="0" step="0.001"></div><div><label for="outTime">Out · seconds</label><input id="outTime" type="number" min="0" step="0.001"></div></div><p class="hint">Choose a time range without overlapping another cue.</p><p id="formError" class="error" role="status"></p>'+btn('saveDetails',isNew?'Create cue':'Save changes')+(isNew?'':'<button id="deleteCue" class="danger">Delete cue</button>'));
 el<HTMLInputElement>('cueName').value=cue.title;el<HTMLInputElement>('inTime').value=String(+cue.start.toFixed(3));el<HTMLInputElement>('outTime').value=String(+cue.end.toFixed(3));
 listen('saveDetails',()=>{const v={...cue,title:el<HTMLInputElement>('cueName').value.trim(),start:el<HTMLInputElement>('inTime').valueAsNumber,end:el<HTMLInputElement>('outTime').valueAsNumber};
 const issue=validateCue(v,duration,all);if(issue){setText('formError',issue);return;}if(v.start!==cue.start||v.end!==cue.end)v.approved=false;save(v);modal().close();
 if(cue.approved&&!v.approved)toast('Timing changed. Approve the caption again before export.');});
 if(!isNew)listen('deleteCue',()=>{
  const confirm=el<HTMLDialogElement>('deleteDialog');
  confirm.returnValue='cancel';
  confirm.onclose=()=>{
   if(confirm.returnValue!=='delete')return;
   modal().close();remove();
   if(el('editing').hidden)el('firstCue').focus();
   toast('Cue deleted.');
  };
  confirm.showModal();
 });
}
export function exportDialog(cues:Cue[],name:string){
 const n=cues.filter(c=>c.approved).length;
 dialog('Export captions','<p id="exportSummary"></p><div id="exportPreview" class="infoBox"></div>'+btn('download','Download WebVTT'));
 setText('exportSummary',n+' of '+cues.length+' cues approved. Only approved captions are included.');const preview=el('exportPreview');
 for(const c of cues.filter(x=>x.approved)){const p=document.createElement('p');p.textContent=stamp(c.start,true)+'  '+c.caption;preview.append(p);}
 if(!n)setText('exportPreview','Approve at least one caption in the inspector to export.');
 el<HTMLButtonElement>('download').disabled=!n;listen('download',()=>{const blob=new Blob([webVtt(cues)],{type:'text/vtt;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=(name.replace(/[^\p{L}\p{N}_. -]/gu,'').trim()||'captions')+'.vtt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);modal().close();toast('WebVTT downloaded.');});
}
