import test from 'node:test';import assert from 'node:assert/strict';
import {sampleCues,validateCue,webVtt,restore,rangeAtPlayhead,captionsAt,markerLanes,stamp,updateCueText} from '../src/cues.ts';
test('editing private notes preserves approval; changing exported text requires review',()=>{
 const cue={...sampleCues[0]};
 const exported=webVtt([cue]);
 updateCueText(cue,'A revised listening note',cue.caption);
 assert.equal(cue.approved,true);
 assert.equal(webVtt([cue]),exported);
 updateCueText(cue,cue.note,'[another sound]');
 assert.equal(cue.approved,false);
 assert.throws(()=>webVtt([cue]));
});
test('editor → approval → sorted, escaped VTT',()=>{
 const c={...sampleCues[1],caption:'[click & <snap>]',approved:true};
 assert.equal(validateCue(c,18),'');const text=webVtt([c,...sampleCues.filter(x=>x.id!==c.id)]);
 assert.match(text,/00:00:00.000 --> 00:00:03.800/);assert.match(text,/00:00:04.200 --> 00:00:09.700\n\[click &amp; &lt;snap&gt;\]/);
 assert.equal(text.split(' --> ').length,3);assert.throws(()=>webVtt([]));
});
test('reject invalid intervals and unreviewable text',()=>{
 for(const changes of [{start:NaN},{end:20},{start:-1},{end:.01},{caption:''},{caption:'a\nb'}])
 assert.notEqual(validateCue({...sampleCues[0],...changes},18),'');
});
test('restore preserves empty projects but rejects corrupt or duplicate data',()=>{
 assert.deepEqual(restore('[]',sampleCues,18),[]);
 for(const raw of ['{}','null','broken',JSON.stringify([sampleCues[0],sampleCues[0]])])
 assert.deepEqual(restore(raw,sampleCues,18),sampleCues);
 assert.deepEqual(restore(JSON.stringify(sampleCues),[],18),sampleCues);
});
test('new cues start at the playhead, or explain there is too little clip left',()=>{
 assert.deepEqual(rangeAtPlayhead(14,5),[5,7]);assert.deepEqual(rangeAtPlayhead(14,13.9),[13.9,14]);
 assert.equal(rangeAtPlayhead(14,13.901),null);assert.equal(rangeAtPlayhead(14,14),null);assert.equal(stamp(60.15,true),'01:00.1');
});
test('layered sounds stay independently timed through review, playback, export and restore',()=>{
 const hiss={...sampleCues[0],start:2.6,end:10.5,caption:'[steam hisses]'},knock={...hiss,id:'knock',start:5,end:6,caption:'[knock]'},draft={...knock,id:'draft',approved:false};
 const cues=[hiss,knock,draft];
 assert.deepEqual(restore(JSON.stringify(cues),[],14),cues);
 assert.deepEqual(markerLanes([...cues,{...knock,start:6,end:7}]),[0,1,2,1]);
 assert.equal(captionsAt(cues,5),'[steam hisses]\n[knock]');assert.equal(captionsAt(cues,6),'[steam hisses]');
 const vtt=webVtt(cues);assert.match(vtt,/00:00:02.600 --> 00:00:10.500\n\[steam hisses\]/);
 assert.match(vtt,/00:00:05.000 --> 00:00:06.000\n\[knock\]/);assert.equal(vtt.split(' --> ').length,3);
});
