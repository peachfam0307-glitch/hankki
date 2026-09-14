// 🖼📦 빌드 때 그림 PNG → WebP — 2026-09-07 (큰 틀 2 「앱 다이어트」 · 계획 §3 ① · §7 2)
//
// 📮 왜 = 아이폰 앱 파일럿이 **448MB** 였다(run 34064416632). 그중 그림 PNG 가 451MB(dist 2,376장 실측).
//    같은 그림을 WebP q85 로 구우면 **54MB(12%)** — 표본 8장 눈 비교 = 차이 없음 · 투명 유지
//    (실측 = `docs/_측정/webp-압축-실측-2026-09-07.txt` · 스크립트 `scripts/_probe-webp압축-0907.py`).
//    iOS 14 부터 WebP 를 읽는다(caniuse ios_saf 14.0+ 'y') · 우리 최소 iOS 15 · 안드로이드 크롬은 옛날부터.
//
// ⭐⭐ **원본은 안 건드린다.** `src/assets/**/*.png` 는 그대로 두고, «나가는 파일»만 WebP 로 바꾼다.
//    · `import x from '../assets/a.png'` · `import.meta.glob('../assets/*.png', { query: '?url' })` — 둘 다 여기를 탄다.
//    · glob 의 «키»(`../assets/stickers/photo/xx.png`)는 모듈 id 라 **안 바뀐다** → 저장된 레시피의 키(`fe_102` 등)가 안 깨진다.
//    · CSS `url(...png)` 은 이 훅을 안 탄다 → PNG 로 남는다(실측 0건 · 생기면 그 장만 PNG 다).
//    · `public/` 의 PNG(앱 아이콘 16장)는 손대지 않는다 — 매니페스트가 이름으로 부른다.
//
// ⛔ 한 장을 못 바꾸면 **그 한 장만** PNG 로 둔다 — 빌드를 통째로 죽이지 않는다(실패의 모양 · 절대원칙 34).
// ⛔ 개발 서버(`vite`)에선 아무것도 안 한다 — 폰에서 보는 «나가는 판»만 바꾼다.
// 🔒 게이트 = `scripts/check-webp-dist.mjs` (dist 에 큰 PNG 가 남아 있으면 배포를 막는다)

import { readFile } from 'node:fs/promises'
import path from 'node:path'

const 그림확장자 = /\.png$/i

export default function webp옵션({ quality = 85, 최소바이트 = 8 * 1024 } = {}) {
  let sharp = null
  let 빌드인가 = false
  const 통계 = { 장수: 0, png: 0, webp: 0, 못바꿈: [] }

  return {
    name: 'hankki-webp',
    enforce: 'pre',
    apply: 'build',
    async configResolved(c) {
      빌드인가 = c.command === 'build'
      try { sharp = (await import('sharp')).default } catch (e) {
        // ⛔ sharp 가 없으면 조용히 PNG 그대로 — 여기서 죽이면 «그림 하나 때문에» 배포가 멈춘다.
        this.warn?.('sharp 를 못 불러 PNG 그대로 낸다: ' + (e && e.message))
        sharp = null
      }
    },
    async load(id) {
      if (!빌드인가 || !sharp) return null
      const [파일, 쿼리 = ''] = id.split('?')
      if (!그림확장자.test(파일)) return null
      // `?url`(glob 의 query) 와 «쿼리 없음»만 — `?raw`·`?inline` 은 다른 뜻이라 손대지 않는다
      if (쿼리 && 쿼리 !== 'url') return null
      if (!파일.includes(`${path.sep}src${path.sep}assets${path.sep}`) && !파일.includes('/src/assets/')) return null
      let 원본
      try { 원본 = await readFile(파일) } catch { return null }
      통계.장수++
      통계.png += 원본.length
      // 아주 작은 PNG(아이콘 조각)는 WebP 가 오히려 클 수 있다 → 재 보고 작은 쪽을 낸다
      let 결과
      try {
        결과 = await sharp(원본).webp({ quality, effort: 4 }).toBuffer()
      } catch (e) {
        통계.못바꿈.push(path.basename(파일) + ' (' + (e && e.message) + ')')
        return null
      }
      if (결과.length >= 원본.length || 원본.length < 최소바이트 && 결과.length >= 원본.length * 0.9) {
        통계.webp += 원본.length
        return null                       // PNG 가 더 작다 — 그대로 둔다
      }
      통계.webp += 결과.length
      const ref = this.emitFile({
        type: 'asset',
        name: path.basename(파일, path.extname(파일)) + '.webp',
        source: 결과,
      })
      return `export default import.meta.ROLLUP_FILE_URL_${ref}`
    },
    generateBundle() {
      if (!통계.장수) return
      const MB = (n) => (n / 1e6).toFixed(1) + 'MB'
      this.info?.(`🖼 hankki-webp: ${통계.장수}장 · PNG ${MB(통계.png)} → ${MB(통계.webp)} (q${quality})` +
        (통계.못바꿈.length ? ` · ⚠️ 못 바꾼 ${통계.못바꿈.length}장: ${통계.못바꿈.slice(0, 3).join(', ')}` : ''))
    },
  }
}
