import test from 'node:test';
import assert from 'node:assert/strict';
import { inferenceMode, permittedMode, captionPrompt, cleanSuggestion, deviceAvailability } from '../src/policy.ts';
test('absent or indeterminate device fails closed before model construction',async()=>{
 for(const status of ['unknown','unavailable']) for(const [online,consent] of [[true,false],[false,true]]) await assert.rejects(permittedMode(online,consent,async()=>status));
 assert.equal(await permittedMode(true,true,async()=>'unavailable'),'prefer_on_device');
});
test('cloud fallback requires both consent and connectivity', () => {
 for (const online of [false,true]) for (const allow of [false,true]) assert.equal(inferenceMode(online,allow), online && allow ? 'prefer_on_device' : 'only_on_device');
});
test('prompt contains just a bounded note and duration', () => {
 const p=captionPrompt('metal bell',1.25).split('\n'); assert.deepEqual(JSON.parse(p.at(-1)),{listeningNote:'metal bell',seconds:1.3});
 for(const [n,d] of [['',2],['x'.repeat(321),2],['a',NaN]]) assert.throws(()=>captionPrompt(n,d));
});
test('unusable model output is never accepted as a caption', () => {
 assert.equal(cleanSuggestion(' [bell rings] '),'[bell rings]'); for(const input of ['','[]','[a]\n[b]','<script>','x'.repeat(161)]) assert.throws(()=>cleanSuggestion(input));
});
test('absence of browser model API is not success',async()=>assert.equal(await deviceAvailability(),'unavailable'));
