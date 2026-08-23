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
        // ⛔⛔ **스티커 그림은 precache 에서 뺀다** (2026-08-05)
        //
        //   앱을 처음 켤 때 서비스워커가 precache 목록을 «통째로» 내려받는다.
        //   `dist/sw.js` 를 뜯어 세어 보니 **1444개 · 215MB** 였고
        //   그중 **스티커 PNG 가 1418개 · 212MB(98.6%)** — 앱 코드는 1MB 뿐이었다.
        //   ⇒ 앱을 깔면 **쓰지도 않을 그림 212MB 를 먼저 받고 있었다.**
        //      데이터 요금·저장공간·첫 실행 대기 — 셋 다 나쁘다.
        //      ⚠️ 반려 사유 ①이 「테스터가 참여하지 않았습니다」였는데 이게 원인일 수 있다.
        //
        //   ✅ 대신 `src/sw.js` 에서 **CacheFirst 런타임 캐시**로 받는다 —
        //      «쓸 때» 받고, 한 번 받은 그림은 캐시에 남아 그 뒤론 오프라인에서도 뜬다.
        //      바뀌는 것 = 「미리 다 받기」 → 「본 것만 갖고 있기」.
        //
        //   ⚠️ `icons/`(앱 아이콘 16장)·`recipe-photos/`(기본 레시피 사진 17장)는 **남긴다** —
        //      아이콘은 매니페스트가 참조하고, 레시피 사진은 홈 첫 화면에 바로 뜬다. 둘 다 작다.
        //   🔒 다시 커지면 `scripts/check-precache.mjs` 가 배포를 막는다.
        globIgnores: ['assets/**/*.png', 'assets/**/*.webp'],
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
        // 📱📱 **가로모드 잠금을 푼다** (창업자 2026-08-09 *"핸드폰은 오늘 되게 할 수 있어?"*)
        //   ⛔ 여기 `orientation: 'portrait'` 이 있으면 설치한 PWA 가 세로로 «잠긴다».
        //   ⭐ 값을 아예 «안 주는 것»이 「잠그지 않는다」다 — 기기 설정(자동 회전)을 그대로 따른다.
        //   ⚠️ Play 앱(TWA)은 이 파일이 아니라 `android/twa-manifest.json` 이 정한다 — 거기도 같이 풀었다.
        //      (bubblewrap `update` 는 웹 매니페스트를 다시 안 읽는다 — twa-manifest.json 을 쓴다)
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
