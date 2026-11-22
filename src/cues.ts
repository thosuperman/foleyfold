export interface Cue { id: string; title: string; start: number; end: number; note: string; caption: string; approved: boolean }
export function updateCueText(cue:Cue, note:string, caption:string) {
 const line=caption.replace(/[\r\n]+/g,' ');
 if(line!==cue.caption)cue.approved=false;
 cue.note=note;
 cue.caption=line;
}
export const sampleCues: Cue[] = [
 {id:'bell', title:'Platform bell', start:0, end:3.8, note:'A bright station bell strikes several times, each ring fading into the next.', caption:'[a station bell rings out]', approved:true},
 {id:'rail', title:'Passing wheels', start:4.2, end:9.7, note:'Pairs of low metallic knocks repeat in a steady rhythm.', caption:'', approved:false},
 {id:'air', title:'Brake release', start:10, end:13.3, note:'A short, sustained rush of air hisses and fades.', caption:'', approved:false},
 {id:'horn', title:'Distant horn', start:14, end:18, note:'A low train whistle sounds across the valley, then trails off.', caption:'', approved:false},
];
export function stamp(s:number, precise=false) {
 const ms=Math.round(Math.max(0,s)*1000), sec=Math.floor(ms/1000);
 return [Math.floor(sec/60).toString().padStart(2,'0'),(sec%60).toString().padStart(2,'0')].join(':')+(precise?'.'+Math.floor(ms%1000/100):'');
}
export function playheadStamp(s:number) {
 const cs=Math.round(Math.max(0,s)*100);return stamp(Math.floor(cs/100))+'.'+String(cs%100).padStart(2,'0');
}
function vttTime(s:number) {
 const ms=Math.round(s*1000),sec=Math.floor(ms/1000);
 return [Math.floor(sec/3600),Math.floor(sec/60)%60,sec%60].map(n=>String(n).padStart(2,'0')).join(':')+'.'+String(ms%1000).padStart(3,'0');
}
export function validateCue(c:Cue,duration:number) {
 if (!c.title.trim()||c.title.length>64) return 'Give this cue a short name.';
 if (![c.start,c.end,duration].every(Number.isFinite)||c.start<0||c.end>duration+.001||c.end-c.start<.0999) return 'Set an interval of at least 0.1 seconds inside the clip.';
 if(c.note.length>320||c.caption.length>160||/[\r\n]/.test(c.caption))return 'Use one caption line (160 characters max) and a note under 321 characters.';
 if(c.approved&&!c.caption.trim())return 'Write a caption before approving it.';
 return '';
}
export function webVtt(cues:Cue[]) {
 const lines=cues.filter(c=>c.approved&&c.caption.trim()).sort((a,b)=>a.start-b.start).map((c,i)=>[
  String(i+1),vttTime(c.start)+' --> '+vttTime(c.end),c.caption.trim().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
 ].join('\n'));
 if(!lines.length)throw new Error('Approve at least one caption before exporting.');
 return 'WEBVTT\n\n'+lines.join('\n\n')+'\n';
}
export function restore(raw:string|null,initial:Cue[],duration:number):Cue[] {
 try {
  const data:unknown=JSON.parse(raw??'null');if(!Array.isArray(data)||data.length>500)throw new Error();
  const seen=new Set();const accepted:Cue[]=[];
  for(const x of data){
   if(!x||['id','title','note','caption'].some(k=>typeof x[k]!=='string')||typeof x.approved!=='boolean'||seen.has(x.id)||!x.id||validateCue(x,duration))throw new Error();
   seen.add(x.id);accepted.push(x);
  }
  return accepted.sort((a,b)=>a.start-b.start);
 } catch {return structuredClone(initial);}
}
export function rangeAtPlayhead(duration:number,at:number):[number,number]|null {
 const start=Math.round(at*1000), end=Math.min(Math.round(duration*1000),start+2000);
 return Number.isFinite(end)&&start>=0&&end-start>=100 ? [start/1000,end/1000] : null;
}
export function captionsAt(cues:Cue[],t:number) {
 return cues.filter(c=>c.approved&&t>=c.start&&t<c.end).map(c=>c.caption).join('\n');
}
export function markerLanes(sortedCues:Cue[]) {
 const ends:number[]=[];
 return sortedCues.map(c=>{
  const free=ends.findIndex(end=>end<=c.start), lane=free<0?ends.length:free;
  ends[lane]=c.end;return lane;
 });
}
