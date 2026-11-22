# Deployment and rollback

## GitHub Pages (recommended public judging site)
1. Repo owner: [Settings → Pages](https://github.com/thosuperman/foleyfold/settings/pages) → Build and deployment → Source: **GitHub Actions**. The installed integration could push a PR but received HTTP 403 when enabling Pages.
2. Optional real AI: add the repository Actions secret `FOLEYFOLD_FIREBASE_WEB` in [Actions secrets](https://github.com/thosuperman/foleyfold/settings/secrets/actions). Value: a JSON object with exactly the four **public client** fields `projectId`, `appId`, `apiKey`, `siteKey` from the dedicated project registered for this domain. No server credentials, debug token or Gemini key. An absent secret intentionally produces the manual edition.
3. Merge the reviewed PR into main or run **Publish studio** on main from Actions. It builds, uploads only `dist` as a Pages artifact, and deploys it. Do not give Pages deployment permissions to pull-request workflows. Changing configuration requires a new build.
4. Open the URL actually printed by the deploy job, including the repository base path. Verify unauthenticated access, sample playback, a WebVTT export, App Check and hybrid model behavior separately. Do not submit an organization-only preview as the public judge URL.
5. Rollback: revert the offending change via a new reviewed commit to main and redeploy. Re-run a known-good release workflow if a deployment-only failure occurred. Rotate/revoke compromised credentials; removing a file from git does not revoke a key.

## Firebase Hosting alternative (owner-operated)
After completing [setup](setup.md), run `npm ci && npm run build`, then with your authenticated Firebase CLI: `firebase deploy --only hosting --project YOUR_PROJECT_ID`. This repo includes a static Hosting config; do not overwrite it with interactive initialization. Register the actual Hosting domain in reCAPTCHA before testing. Use the Hosting release history in Firebase Console to roll back. No Firebase deployment, paid plan, or cloud admin role is assumed.

## Local / organization preview
`npm run preview` serves the production build locally after `npm run build`. The organization-only [Foleyfold preview](https://foleyfold--mlarpbwp.preview.devinapps.com) is available to signed-in members while its managing session is available; it's not a public judge link or proof of inference.
