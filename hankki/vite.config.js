import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Relative base so the app works whether served from a domain root
// or a GitHub Pages sub-path (e.g. /-/).
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      // 커스텀 서비스워커를 써야 '공유받기(share_target)' POST 를 가로챌 수 있어 injectManifest 사용.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
      },
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: '한끼 — 나만의 레시피 아카이브',
        short_name: '한끼',
        description: '흩어진 레시피를, 한곳에. 인스타·유튜브·링크·사진 레시피를 모으고 정리하는 개인 아카이브.',
        lang: 'ko',
        dir: 'ltr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F5F6F4',
        theme_color: '#6B4F3A',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // 안드로이드 공유 시트에서 '한끼'로 링크/사진을 바로 받기 위한 설정.
        share_target: {
          action: 'share-target',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
            files: [{ name: 'image', accept: ['image/*'] }],
          },
        },
      },
    }),
  ],
})
