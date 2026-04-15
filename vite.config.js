import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Browser calls cannot use api.groq.com directly (CORS). Proxy same-origin /api/groq → Groq. */
const groqProxy = {
  '/api/groq': {
    target: 'https://api.groq.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/groq/, '/openai/v1'),
    /** Cloudflare sometimes treats bare Node requests as bots; mimic a normal browser. */
    configure(proxy) {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.setHeader(
          'User-Agent',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        );
        proxyReq.setHeader('Accept', 'application/json');
        proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
      });
    },
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: groqProxy,
  },
  preview: {
    proxy: groqProxy,
  },
});
