import test from 'node:test';
import assert from 'node:assert/strict';
import { inferenceMode, permittedMode, captionPrompt, cleanSuggestion, deviceAvailability } from '../src/policy.ts';
test('absent or indeterminate device fails closed before model construction',async()=>{
 for(const status of ['unknown','unavailable']) for(const [online,consent] of [[true,false],[false,true]]) await assert.rejects(permittedMode(online,consent,async()=>status));
 for(const status of ['unknown','unavailable']) assert.equal(await permittedMode(true,true,async()=>status),'only_in_cloud');
 assert.equal(await permittedMode(true,true,async()=>'available'),'prefer_on_device');
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
test('brackets count toward the saved-caption limit',()=>{
 assert.equal(cleanSuggestion('a'.repeat(158)).length,160);
 assert.throws(()=>cleanSuggestion('a'.repeat(159)));
});
test('absence of browser model API is not success',async()=>assert.equal(await deviceAvailability(),'unavailable'));
test('a pending browser capability check settles without promising a device model', async t => {
 t.after(()=>{delete globalThis.LanguageModel;});
 globalThis.LanguageModel={availability:()=>new Promise(()=>{})};
 assert.equal(await deviceAvailability(10),'unknown');
});
test('inspector distinguishes configured routes from manual-only editing',async()=>{
 const {draftOptions}=await import('../src/policy.ts');
 for(const online of [false,true]){
  const manual=draftOptions(false,'available',online);
  assert.equal(manual.action,'AI details');assert.match(manual.status,/disconnected/);assert.match(manual.hint,/Type a sound caption/);
 }
 for(const state of ['checking','unavailable','unknown','downloadable','downloading']){
  assert.equal(draftOptions(true,state,false).action,'AI details');
  assert.match(draftOptions(true,state,true).status,/Cloud by opt-in/);
 }
 assert.match(draftOptions(true,'available',false).status,/Device model available · Cloud offline/);
});
