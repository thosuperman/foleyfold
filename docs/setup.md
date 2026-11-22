# Run the cutting room
Use Node 24 LTS, npm, and a modern desktop browser. No login, API, or Firebase config is needed to use the original sample or bring your own clip. From the repository root:

```sh
npm ci
npm run dev
```
Open the URL printed by Vite. Play **Last Light Express**, select **Passing wheels**, write a sound caption, approve it, and click **Export VTT**. For your own work, choose **Open clip**, select a playable MP4/WebM or audio file, then **Add cue**. Files stay local; the editor stores cue data per file-content fingerprint in browser storage. Keep exports before clearing storage. Video codecs vary by browser. Files under 24 hours and up to 500 nonoverlapping cues are supported; metadata/fingerprinting can take time for large files.

## Connect real hybrid AI
1. Create a dedicated, non-production **Spark** project in [Firebase Console](https://console.firebase.google.com/). Do not add billing. Register a Web app. In Project settings → General → Your apps, find the web client config.
2. Choose AI Services → AI Logic → Get started → **Gemini Developer API**. Finish the wizard; it enables AI Logic and the provider and provisions managed authorization. Do not copy a Gemini API key into the app. Stop if your region, model or console requires spending. [Provider setup and troubleshooting](https://firebase.google.com/docs/ai-logic/faq-and-troubleshooting).
3. In the same project in [Google Cloud reCAPTCHA](https://console.cloud.google.com/security/recaptcha), enable the reCAPTCHA Enterprise API if prompted. Create a **Website, score-based** key (no checkbox challenge). Register only the actual deployed host, e.g. `thosuperman.github.io`, no scheme/path and **never localhost**. Stop if billing is required.
4. Firebase Security → App Check → Apps → register your Web app with **reCAPTCHA Enterprise** and the site's public key. Keep enforcement on. [Official instructions](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider).
5. Copy `.env.example` to `.env.local` (ignored), and set the project ID, app ID, Firebase **web** API key and **public** reCAPTCHA site key. Rebuild/restart. These four client identifiers necessarily appear in a configured browser bundle. Use no production project, server credentials, private key, Gemini key or App Check debug token in a Vite variable.
6. For a private localhost test only, use a non-production project. Use App Check → Apps → ⋮ → Manage debug tokens → Add debug token. Set `self.FIREBASE_APPCHECK_DEBUG_TOKEN` from that secret in the private test browser **before opening Draft with AI**. Never ship it, record it, print it, commit it or set it in public hosting. Revoke after testing. [Debug provider](https://firebase.google.com/docs/app-check/web/debug-provider). An attested hosted app can be tested directly without a debug token.

See [hybrid verification](hybrid-inference.md) for the device/cloud acceptance matrix. Only a real successful model response counts as live inference. For publicly hosted or shared clips get authorization from the rights holder; judge with the included original film instead.
