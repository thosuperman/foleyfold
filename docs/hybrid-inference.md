# Hybrid inference: contract and verification
The model task is **wording one non-speech sound**, not listening to the clip. The editor writes an observation. The same prompt and UI apply on both routes. The official Firebase JS SDK is imported and called at runtime in `src/inference.ts`.

| Condition | Behavior | Evidence boundary |
|---|---|---|
| No Firebase web config or App Check site key | Disable generation, display explanation; keep manual editing | Not an inference result |
| Offline or no one-request cloud permission | Fail closed if Prompt API absent/unknown/unavailable; otherwise initialize and call `ONLY_ON_DEVICE` | Never infer provenance from a network toggle |
| Online + explicit permission | `PREFER_ON_DEVICE` through the SDK; use local when available, otherwise GoogleAIBackend cloud fallback | Checkbox resets after the request |
| Local setup/download or backend error | Preserve note; show actionable error, allow retry or hand editing | No hardcoded replacement text |
| Successful SDK response | Read `response.inferenceSource`, show Device/Cloud (or unknown); bound caption length, require review | A returned caption alone is not proof of local execution |

**Models:** Chrome supplies the device foundation model (competition targets **Gemini Nano 4**); JavaScript cannot select or attest the installed Nano generation. The cloud model is explicitly `gemini-3.5-flash-lite` through Gemini Developer API. No fallback to direct HTTP or another vendor. Local and cloud routes use the same model adapter. App Check is initialized before AI Logic. The production app never enables the debug provider.

**Cold start and availability:** feature-detect the browser Prompt API and query its availability. A user action calls `initializeDeviceModel`, which may download the model; there is no offline first download. Review the current [Firebase web guide](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started), [mode details](https://firebase.google.com/docs/ai-logic/hybrid/web/configuration-options) and [Chrome requirements](https://developer.chrome.com/docs/ai/prompt-api). The web SDK guide's localhost procedure includes Chrome flags; browser versions, policies, language and device determine actual availability. Only desktop Chrome gets the local route. Other modern browsers can edit; cloud eligibility depends on connectivity, App Check attestation and project configuration. In an already-loaded workspace manual editing/export need no inference. Offline cold navigation on hosted editions is not promised.

## Live acceptance protocol (owner or authorized tester)
Use only the bundled film and non-sensitive notes. With configured, attested web client:
1. Compatible Chrome: open Draft with AI. Note availability; download the local model if prompted. Keep fallback off, generate, and record the displayed SDK source **On device** and Chrome build. Accept, review, approve and export. Repeat after disconnecting the network with the studio already open.
2. Unsupported device or profile: keep fallback off and request a draft. It must fail without a generation request. With internet, opt in for this one note. Record a real successful **Cloud** response. Capture the consent, result and reset control, never a console token.
3. Test failure by taking an unsupported profile offline. No generated text, no crash; manually edit or export instead. Authentication/quota errors also must leave the note intact.
4. Update the [readiness report](../submission/readiness.md) and replace the demonstration's configuration-limited segment only when successful. Unit tests exercise policy and output constraints; they cannot substitute for device/cloud evidence.
