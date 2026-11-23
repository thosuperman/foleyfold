const fields = {
  projectId: ['VITE_FIREBASE_PROJECT_ID', /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/],
  appId: ['VITE_FIREBASE_APP_ID', /^1:\d+:web:[a-f0-9]+$/i],
  apiKey: ['VITE_FIREBASE_API_KEY', /^AIza[A-Za-z0-9_-]{35}$/],
  siteKey: ['VITE_RECAPTCHA_SITE_KEY', /^[A-Za-z0-9_-]{20,128}$/],
};

export function releaseConfig(raw) {
  // Explicit empty values also override inherited Vite settings and .env files.
  const manual = warning => ({
    warning,
    settings: Object.fromEntries(Object.values(fields).map(([key]) => [key, ''])),
  });
  if (!raw?.trim()) return manual('FOLEYFOLD_FIREBASE_WEB is missing.');
  let data;
  try { data = JSON.parse(raw); }
  catch { return manual('FOLEYFOLD_FIREBASE_WEB is not valid JSON.'); }
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
      Object.keys(data).length !== Object.keys(fields).length ||
      !Object.keys(fields).every(key => Object.hasOwn(data, key))) {
    return manual('Expected exactly projectId, appId, apiKey and siteKey.');
  }
  const settings = {};
  for (const [key, [envName, pattern]] of Object.entries(fields)) {
    if (typeof data[key] !== 'string' || !pattern.test(data[key].trim())) {
      return manual(`Invalid public web field: ${key}.`);
    }
    settings[envName] = data[key].trim();
  }
  return {settings};
}
