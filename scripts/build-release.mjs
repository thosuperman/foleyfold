import { spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { releaseConfig } from './release-config.mjs';

const {FOLEYFOLD_FIREBASE_WEB, ...env} = process.env;
const {settings, warning} = releaseConfig(FOLEYFOLD_FIREBASE_WEB);
const message = warning
  ? `Manual edition (Firebase disabled). ${warning} Correct the Actions secret and redeploy to enable drafting.`
  : 'Firebase drafting configured. Live inference is not verified by this build.';
console.log(warning && env.GITHUB_ACTIONS === 'true' ? `::warning::${message}` : message);
if (env.GITHUB_STEP_SUMMARY) {
  appendFileSync(env.GITHUB_STEP_SUMMARY, `### Studio build mode\n\n${message}\n`);
}
const result = spawnSync('npm', ['run', 'build'], {env: {...env, ...settings}, stdio: 'inherit'});
process.exit(result.status ?? 1);
