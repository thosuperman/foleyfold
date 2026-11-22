import test from 'node:test';import assert from 'node:assert/strict';
import {sampleCues,validateCue,webVtt,restore,nextGap,stamp,updateCueText} from '../src/cues.ts';
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
 assert.equal(validateCue(c,18,sampleCues),'');const text=webVtt([c,...sampleCues.filter(x=>x.id!==c.id)]);
 assert.match(text,/00:00:00.000 --> 00:00:03.800/);assert.match(text,/00:00:04.200 --> 00:00:09.700\n\[click &amp; &lt;snap&gt;\]/);
 assert.equal(text.split(' --> ').length,3);assert.throws(()=>webVtt([]));
});
test('reject invalid/overlapping intervals and unreviewable text',()=>{
 for(const changes of [{start:NaN},{end:20},{start:-1},{end:.01},{end:7},{caption:''},{caption:'a\nb'}])
 assert.notEqual(validateCue({...sampleCues[0],...changes},18,sampleCues),'');
});
test('restore preserves empty projects but rejects corrupt or duplicate data',()=>{
 assert.deepEqual(restore('[]',sampleCues,18),[]);
 for(const raw of ['{}','null','broken',JSON.stringify([sampleCues[0],sampleCues[0]])])
 assert.deepEqual(restore(raw,sampleCues,18),sampleCues);
 assert.deepEqual(restore(JSON.stringify(sampleCues),[],18),sampleCues);
});
test('new cues use unoccupied time and never exceed duration',()=>{
 assert.deepEqual(nextGap([],18,4),[4,6]);assert.deepEqual(nextGap(sampleCues,18,5),[9.7,10]);
 assert.equal(nextGap([{...sampleCues[0],end:18}],18,0),null);assert.equal(stamp(60.15,true),'01:00.1');
});
