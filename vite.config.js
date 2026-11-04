import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Fixed dev port: the backend's CORS allow-list contains
// http://localhost:5173, so if that port is busy we want a clear error
// instead of Vite silently moving to 5174/5175 (which the API would block).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
});
