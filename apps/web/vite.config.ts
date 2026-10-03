import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';

// Phones only allow camera access over HTTPS (or localhost). `npm run dev:phone` turns this on.
const useHttps = process.env.TAPCARE_HTTPS === '1';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    useHttps && basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'TapCare — Pendamping Kiosk',
        short_name: 'TapCare',
        description: 'See it. Understand it. Tap with confidence.',
        lang: 'id',
        theme_color: '#6c3be8',
        background_color: '#f7f5ff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Practice mode works offline; live guidance always needs the network.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ].filter(Boolean) as PluginOption[],
  server: {
    host: true,
    proxy: { '/api': 'http://localhost:8787' },
  },
  preview: {
    proxy: { '/api': 'http://localhost:8787' },
  },
  build: {
    target: 'es2022',
    // Keep fonts as files: the server's Content-Security-Policy does not allow data: fonts.
    assetsInlineLimit: (filePath) => (/\.(woff2?|ttf)$/.test(filePath) ? false : undefined),
    sourcemap: true,
  },
});
