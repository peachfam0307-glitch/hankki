// ⏱ 「사진 2장 AI 스캔이 오래 걸린다」 — **어디서 시간이 가나**를 잰다 (창업자 제보 2026-08-16)
//   📮 *"어제 레시피 2장 안내시 로딩 오래걸리는거"* (＝가져오기에 사진 2장 넣고 AI 스캔)
//   돌리기 = node hankki/scripts/_measure-스캔로딩-0816.mjs
//
// ⭐ 재는 것 = ⑴ 프록시로 «올라가는 덩치» ⑵ 크롭 화질을 낮추면 얼마나 줄나
//   ⛔ 네트워크는 여기서 못 잰다(컨테이너) — **덩치만 정확히 재고, 시간은 덩치로 환산**한다.
import { chromium } from 'playwright'

const 폭 = 1080, 높이 = 2400 // 요즘 폰 세로 캡처
const b = await chromium.launch()
const p = await (await b.newContext()).newPage()
await p.setContent('<body style="margin:0">')

// 레시피 캡처 흉내 — 흰 바탕에 검은 글씨가 빽빽한 그림(JPEG 가 제일 커지는 모양)
const 잰다 = await p.evaluate(async ({ 폭, 높이 }) => {
  const c = document.createElement('canvas')
  c.width = 폭; c.height = 높이
  const x = c.getContext('2d')
  x.fillStyle = '#fff'; x.fillRect(0, 0, 폭, 높이)
  x.fillStyle = '#1a1a1a'; x.font = '30px sans-serif'
  const 줄 = '고추장 2컵 · 고춧가루 1/2컵 · 양조간장 1/2컵 설탕'
  for (let y = 60; y < 높이 - 20; y += 46) x.fillText(줄, 24, y)
  // 사진처럼 보이게 위쪽에 그라데이션 사진 영역
  const g = x.createLinearGradient(0, 0, 폭, 700)
  g.addColorStop(0, '#c8a27a'); g.addColorStop(1, '#6d8f6a')
  x.fillStyle = g; x.fillRect(0, 0, 폭, 700)

  const 뽑기 = (긴변, q) => {
    const s = Math.min(1, 긴변 / Math.max(c.width, c.height))
    const d = document.createElement('canvas')
    d.width = Math.round(c.width * s); d.height = Math.round(c.height * s)
    const dx = d.getContext('2d'); dx.imageSmoothingQuality = 'high'
    dx.drawImage(c, 0, 0, d.width, d.height)
    const url = d.toDataURL('image/jpeg', q)
    return { 긴변, q, w: d.width, h: d.height, bytes: url.length }
  }
  return [뽑기(2400, 0.92), 뽑기(1800, 0.85), 뽑기(1600, 0.85), 뽑기(1400, 0.8), 뽑기(1200, 0.8)]
}, { 폭, 높이 })
await b.close()

const KB = (n) => (n / 1024).toFixed(0) + 'KB'
// 📶 LTE 업로드 실측 대역 — 한국 평균 상향 10~20Mbps 지만 **실내·이동 중엔 5Mbps 도 흔하다.**
//   ⚠️ 느린 쪽으로 잡는다 — 창업자가 겪은 건 «느릴 때»다.
const 초 = (bytes, mbps) => (bytes * 8 / (mbps * 1_000_000)).toFixed(1)

console.log(`\n📱 1080×2400 폰 세로 캡처 한 장 (JSON 으로 올라가는 base64 덩치)\n`)
console.log('  크롭 설정        크기         올라가는 덩치   5Mbps    20Mbps')
for (const r of 잰다) {
  const 지금 = r.긴변 === 2400 ? ' ← 지금' : ''
  console.log(
    `  ${String(r.긴변).padEnd(5)}q${r.q}   ${String(r.w + '×' + r.h).padEnd(11)} ${KB(r.bytes).padStart(7)}` +
    `      ${초(r.bytes, 5).padStart(5)}s  ${초(r.bytes, 20).padStart(5)}s${지금}`,
  )
}

const 지금 = 잰다[0], 후보 = 잰다.find((r) => r.긴변 === 1600)
console.log(`\n  ⭐ 2400→1600 이면 덩치 ${(지금.bytes / 후보.bytes).toFixed(1)}배 줄어든다` +
  ` (2장이면 5Mbps 에서 ${(초(지금.bytes, 5) * 2).toFixed(1)}s → ${(초(후보.bytes, 5) * 2).toFixed(1)}s)`)
console.log(`\n  ⛔ 단 이건 «올리는 시간»만이다 — Vision 처리(1~2초/장)와` +
  ` **2장을 한 장씩 줄 세워 도는 구조**는 따로다.\n`)
