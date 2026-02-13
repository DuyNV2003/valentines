import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // On Vercel, system variables like API_KEY are in process.env
  // Locally, they might be in the loaded `env` object from .env file
  const apiKey = process.env.API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY. Use JSON.stringify to inject the value as a string.
      // If undefined, inject an empty string to prevent crashing (though SDK will still error if used).
      'process.env.API_KEY': JSON.stringify(apiKey || ''),
    },
  };
});