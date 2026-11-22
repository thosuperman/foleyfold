import test from 'node:test';import assert from 'node:assert/strict';
import {peakEnvelope,canAnalyze} from '../src/waveform.ts';
import {playheadStamp} from '../src/cues.ts';
test('waveform keeps brief transients from every channel and never invents sound',()=>{
 assert.deepEqual(peakEnvelope([Float32Array.of(0,0,0,0,0),Float32Array.of(0,-1,0,0,.5)],2),[1,.5]);
 assert.deepEqual(peakEnvelope([new Float32Array(2)]),[0,0]);assert.deepEqual(peakEnvelope([]),[]);
});
test('full audio decode is bounded by file size and clip duration',()=>{
 assert.equal(canAnalyze(32*1024*1024,300),true);assert.equal(canAnalyze(1,301),false);assert.equal(canAnalyze(33*1024*1024,1),false);
});
test('playhead clock resolves individual steps and carries on rounding',()=>{
 assert.equal(playheadStamp(5.23),'00:05.23');assert.equal(playheadStamp(59.999),'01:00.00');
});
