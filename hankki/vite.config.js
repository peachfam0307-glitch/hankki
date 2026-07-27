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
        // woff2 는 precache 에서 제외한다 — 꾸미기용 내장 글씨체(1.7MB)를 설치 시 미리 받지 않기 위해.
        // @font-face 는 실제로 그 글씨가 쓰일 때만 다운로드되고, 이후 브라우저 캐시에 남는다.
        // (앱의 다른 폰트는 전부 CDN 이라 로컬 woff2 는 이 꾸미기 글씨체뿐)
        globPatterns: ['**/*.{js,css,html,svg,png,webp}'],
      },
      includeAssets: ['favicon.svg', 'icons/icon-192-v7.png', 'icons/icon-512-v7.png'],
      manifest: {
        name: '한끼 — 나만의 레시피, 레꾸해요',
        short_name: '한끼',
        description: '한 끼를 만든 마음까지 저장하세요. 레시피를 예쁜 카드로 레꾸(레시피 꾸미기)! 꼬르곰·펭펭과 꾸미고, 친구랑 나누는 감정 레시피북.',
        // 앱 고유 id — 스토어/설치 앱이 '같은 앱'으로 인식하게 고정. 상대 경로라 배포 위치와 무관.
        id: './',
        categories: ['food', 'lifestyle'],
        lang: 'ko',
        dir: 'ltr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FDFBF7',
        theme_color: '#6B4F3A',
        icons: [
          { src: 'icons/icon-192-v7.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512-v7.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512-v7.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
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
