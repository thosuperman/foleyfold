import assert from 'node:assert/strict';
import test from 'node:test';
import {releaseConfig} from '../scripts/release-config.mjs';

const fields = {projectId:'test-only', appId:'1:123:web:abc123', apiKey:'AIza'+'x'.repeat(35), siteKey:'y'.repeat(40)};
const settings = {
  VITE_FIREBASE_PROJECT_ID:fields.projectId, VITE_FIREBASE_APP_ID:fields.appId,
  VITE_FIREBASE_API_KEY:fields.apiKey, VITE_RECAPTCHA_SITE_KEY:fields.siteKey,
};

test('only a complete public web configuration enables drafting', () => {
  assert.deepEqual(releaseConfig(JSON.stringify(fields)), {settings});
});

test('missing, malformed, partial and non-public configs disable every Firebase setting', () => {
  const manual = Object.fromEntries(Object.keys(settings).map(key => [key, '']));
  for (const raw of [
    undefined, '', '  ', '{broken', 'null', '42', '[]', '{}',
    JSON.stringify({...fields, siteKey:undefined}), JSON.stringify({...fields, appId:123}),
    JSON.stringify({...fields, apiKey:' '}),
    JSON.stringify({...fields, apiKey:'not-a-public-api-key'}),
    JSON.stringify({...fields, siteKey:'-----BEGIN PRIVATE KEY-----'}),
    JSON.stringify({...fields, private_key:'DO_NOT_PRINT'}),
  ]) {
    const {settings, warning} = releaseConfig(raw);
    assert.deepEqual(settings, manual);
    assert.ok(warning);
    assert.doesNotMatch(warning, /DO_NOT_PRINT|BEGIN PRIVATE KEY|not-a-public-api-key/);
  }
});
