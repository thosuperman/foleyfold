import test from 'node:test';import assert from 'node:assert/strict';import {clipFingerprint} from '../src/fingerprint.ts';
test('same metadata, different footage gets independent cue storage',async()=>{
 const make=s=>new File([s],'cut.mp4',{lastModified:1});
 assert.notEqual(await clipFingerprint(make('abcdef')),await clipFingerprint(make('abcxef')));
 assert.equal(await clipFingerprint(make('abcdef')),await clipFingerprint(make('abcdef')));
});
