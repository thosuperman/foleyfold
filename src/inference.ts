import { initializeApp } from 'firebase/app';
import { getAI, GoogleAIBackend, getGenerativeModel, InferenceMode, InferenceSource } from 'firebase/ai';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { captionPrompt, cleanSuggestion, CLOUD_MODEL, inferenceMode } from './policy.ts';

const config = { projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID, appId: import.meta.env.VITE_FIREBASE_APP_ID, apiKey: import.meta.env.VITE_FIREBASE_API_KEY };
const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
export const configured = Boolean(config.projectId && config.appId && config.apiKey && siteKey);
function createAI() {
  if (!configured) throw new Error('AI is not connected in this edition. Write a caption by hand or connect a Firebase project.');
  const app = initializeApp(config);
  initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(siteKey), isTokenAutoRefreshEnabled: false });
  return getAI(app, { backend: new GoogleAIBackend() });
}
let ai: ReturnType<typeof createAI> | undefined;
export async function draftCaption(note: string, duration: number, consent: boolean, progress: (pct: number) => void) {
  const prompt = captionPrompt(note, duration);
  ai ??= createAI();
  const mode = inferenceMode(navigator.onLine, consent) === 'prefer_on_device' ? InferenceMode.PREFER_ON_DEVICE : InferenceMode.ONLY_ON_DEVICE;
  const model = getGenerativeModel(ai, { mode, inCloudParams: { model: CLOUD_MODEL, generationConfig: { maxOutputTokens: 160 } } }, { timeout: 45000 });
  await model.initializeDeviceModel(v => progress(Math.round(v * 100)));
  const { response } = await model.generateContent(prompt);
  const source = response.inferenceSource === InferenceSource.ON_DEVICE ? 'On device' : response.inferenceSource === InferenceSource.IN_CLOUD ? 'Cloud' : 'Source not reported';
  return { caption: cleanSuggestion(response.text()), source };
}
