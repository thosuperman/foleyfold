import {defineConfig} from 'vite';
export default defineConfig({base:'./', build:{rollupOptions:{output:{manualChunks:{firebase:['firebase/app','firebase/ai','firebase/app-check']}}}}});
