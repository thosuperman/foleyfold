import { spawnSync } from 'node:child_process';
// Only browser-public web client identifiers are accepted in this build.
const env = {...process.env};
const config = env.FOLEYFOLD_FIREBASE_WEB;
delete env.FOLEYFOLD_FIREBASE_WEB;
if (config) {
  let data;
  try { data=JSON.parse(config); } catch { throw new Error('Firebase web config is not valid JSON.'); }
  const map={projectId:'VITE_FIREBASE_PROJECT_ID',appId:'VITE_FIREBASE_APP_ID',apiKey:'VITE_FIREBASE_API_KEY',siteKey:'VITE_RECAPTCHA_SITE_KEY'};
  if (!data || typeof data!=='object' || Object.keys(data).some(k=>!Object.hasOwn(map,k))) throw new Error('Provide only the four public Firebase web fields.');
  for (const [k,v] of Object.entries(map)) {
    if (typeof data[k]!=='string'||!data[k].trim()) throw new Error('One of the four public Firebase web fields is missing.');
    env[v]=data[k].trim();
  }
}
const result=spawnSync('npm',['run','build'],{env,stdio:'inherit'});process.exit(result.status??1);
