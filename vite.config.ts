import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/functions/v1': {
        target: 'https://hngvauxcsyuojbxfaqxn.supabase.co', // <<<--- ERSETZEN SIE DIES MIT IHRER SUPABASE-PROJEKT-URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/functions\/v1/, '/functions/v1'),
      },
    },
  },
});
