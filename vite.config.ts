import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for standard Node-style env var access
      'process.env': process.env,
      VITE_OLLAMA_HOST: JSON.stringify(env.VITE_OLLAMA_HOST),
    }
  }
});
