// 🕸 핼러윈 «거미줄 장식» 시안 — 유저가 고른 테마 «위에» 얹는다 (2026-09-09)
//
// 📮 창업자 = *"유저가 선택한테마에 거미줄효과주면? 느낌만 내는거지."*
//    ＋ *"왜 저 시안이 할로윈이야? 배경색을바꾸는 것보다 스티커나 효과만주는게 좋지않을까"*
//    ＋ *"연하게 늘어뜨린 거미줄 느낌으로도 시안 다양하게 예쁘게 만들어줘. 다양한 느낌으로"*
//    ⭐ 배경색을 바꾼 앞 시안은 「보라 배경」이지 핼러윈이 아니었다 — 창업자 지적이 맞다.
//
// ⭐⭐ 이 방식의 핵심 = **색을 «박지» 않는다.**
//    거미줄 색 = `var(--text-sub)` 를 옅게. 밝은 테마는 연회색, 다크는 밝은 회보라로
//    **저절로 따라간다** → 그레이지·크림·살구·다크 «어느 테마 위에도» 얹힌다.
//    ⛔ `#333` 으로 박으면 다크에서 안 보이고, 흰색으로 박으면 밝은 테마에서 안 보인다.
//    ⭐ 테마가 나중에 늘어도 여기를 안 고친다.
//
// ⛔ 유료팩 컷(핼러윈 16컷)은 «쓰지 않는다» — 파는 물건이다(누수 금지).
//    SVG 로 그린다 = 받는 파일 무게 0 · 어느 크기로 키워도 안 깨진다.
// ⛔ 박쥐는 «안 그린다» — 창업자 2026-09-09 *"박쥐는 내가 뽑아줄게"*.
//
// ⛔ 브라우저 경로를 판에 박지 않는다 — `SMOKE_CHROMIUM` 만 읽는다(v10.90 사고)
//
// 쓰는 법 = node scripts/_shot-거미줄시안-0909.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.OUT || '/tmp/hankki-거미줄'
rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true })

// ── 그리는 조각들 ───────────────────────────────────────────────
// ⭐ 전부 `currentColor` — 색은 위에서 테마가 정한다. 여기서 색을 쓰지 않는다.
// ⭐ 선끝은 둥글게(`round`) — 한끼 그림체가 둥글어서 각진 선은 튄다.

const 감싸기 = (w, h, inner, style = '') =>
  `<svg viewBox="0 0 ${w} ${h}" width="100%" height="auto" preserveAspectRatio="xMidYMin meet"
     aria-hidden="true" style="display:block;${style}"
     fill="none" stroke="currentColor" stroke-linecap="round">${inner}</svg>`

// 🎪 커튼 — 위에서 «늘어진» 반원이 이어진다. 핼러윈 장식의 기본 문법(garland).
//   ⭐ 반원 안에 살을 넣어야 «거미줄»이지, 없으면 그냥 물결 띠로 보인다.
const 커튼 = (칸 = 5, 깊이 = 54, w = 540) => {
  const s = w / 칸; let d = `M0 0`, 살 = ''
  for (let i = 0; i < 칸; i++) {
    const x0 = i * s
    d += ` Q ${x0 + s / 2} ${깊이 * 1.35} ${x0 + s} 0`
    // 살 = 반원 안쪽에 작은 호 둘 ＋ 세로실 하나
    살 += `<path d="M${x0 + s * 0.16} 0 Q ${x0 + s / 2} ${깊이 * 0.62} ${x0 + s * 0.84} 0" stroke-width="1"/>`
    살 += `<path d="M${x0 + s * 0.34} 0 Q ${x0 + s / 2} ${깊이 * 0.3} ${x0 + s * 0.66} 0" stroke-width="1"/>`
    살 += `<path d="M${x0 + s / 2} 0 L${x0 + s / 2} ${깊이 * 1.0}" stroke-width="0.9"/>`
  }
  return 감싸기(w, 깊이 * 1.5, `<path d="${d}" stroke-width="1.5"/>${살}`)
}

// 🧵 늘어진 실 — 길이가 제각각인 가는 실. 끝에 «이슬» 한 점.
//   ⛔ 길이를 규칙적으로 두면 «바코드»로 보인다 — 들쭉날쭉해야 거미줄이다.
const 늘어진실 = (w = 540) => {
  const 자리 = [[28, 96], [72, 42], [118, 150], [166, 66], [214, 118], [268, 38],
    [318, 132], [366, 74], [412, 168], [458, 52], [504, 108]]
  const g = 자리.map(([x, len]) =>
    `<path d="M${x} 0 Q ${x + 3} ${len * 0.55} ${x} ${len}" stroke-width="0.9"/>` +
    `<circle cx="${x}" cy="${len}" r="1.9" fill="currentColor" stroke="none"/>`).join('')
  return 감싸기(w, 180, g)
}

// 🕸 모서리 부채꼴 — 왼쪽 위 기준. 오른쪽은 뒤집어 쓴다(그림 하나로 둘).
const 모서리 = (크기 = 150) => {
  const R = [0.22, 0.42, 0.62, 0.82, 1.0].map((r) => r * 크기)
  const 호 = R.map((r) => `<path d="M${r} 0 A${r} ${r} 0 0 1 0 ${r}" stroke-width="1.2"/>`).join('')
  const 살 = `<path d="M0 0 L${크기} 0 M0 0 L0 ${크기} M0 0 L${크기 * 0.8} ${크기 * 0.8}
     M0 0 L${크기 * 0.94} ${크기 * 0.38} M0 0 L${크기 * 0.38} ${크기 * 0.94}" stroke-width="1.3"/>`
  return 감싸기(크기, 크기, `${살}${호}`, 'width:' + 크기 + 'px')
}

// ── 시안 여섯 ───────────────────────────────────────────────────
//   ⭐ 창업자 = *"연하게 늘어뜨린"* → 다만 **시안은 «모양을 판정»하는 판**이라 보이게 뽑는다.
//   🔢 실측 2026-09-09 = 0.14~0.20 으로 뽑았더니 밝은 테마에서 **최대 픽셀차 61/255** — 사실상 안 보였다.
//      (가려진 게 아니라 진짜로 옅은 것 · 맨 위 120px 에 1.7만 픽셀이 바뀌긴 했다)
//   ⛔ 그래서 「연하게」를 시안에서 미리 정하지 않는다 — 모양을 먼저 고르고 «진하기는 사다리로» 따로 고른다.
const 시안 = [
  { 이름: 'ⓐ커튼', 설명: '위에서 늘어진 반원이 쭉 이어진다 (제일 「장식」답다)', 투명도: 0.17,
    그림: () => `<div style="position:absolute;top:0;left:0;right:0">${커튼(5, 54)}</div>` },

  { 이름: 'ⓑ늘어진실', 설명: '가는 실만 제각각 길이로. 끝에 이슬 한 점 (제일 은은하다)', 투명도: 0.2,
    그림: () => `<div style="position:absolute;top:0;left:0;right:0">${늘어진실()}</div>` },

  { 이름: 'ⓒ한쪽만크게', 설명: '왼쪽 위 하나만 크게 — 비대칭이라 「꾸민 티」가 덜 난다', 투명도: 0.15,
    그림: () => `<div style="position:absolute;top:0;left:0">${모서리(210)}</div>` },

  { 이름: 'ⓓ네귀퉁이', 설명: '작은 거미줄 네 개 — 화면을 감싼다', 투명도: 0.14,
    그림: () => `
      <div style="position:absolute;top:0;left:0">${모서리(112)}</div>
      <div style="position:absolute;top:0;right:0;transform:scaleX(-1)">${모서리(112)}</div>
      <div style="position:absolute;bottom:0;left:0;transform:scaleY(-1)">${모서리(96)}</div>
      <div style="position:absolute;bottom:0;right:0;transform:scale(-1,-1)">${모서리(96)}</div>` },

  { 이름: 'ⓔ커튼＋실', 설명: '커튼 아래로 실이 더 늘어진다 (제일 풍성)', 투명도: 0.15,
    그림: () => `
      <div style="position:absolute;top:0;left:0;right:0">${커튼(4, 46)}</div>
      <div style="position:absolute;top:34px;left:0;right:0;opacity:.8">${늘어진실()}</div>` },

  { 이름: 'ⓕ모서리＋커튼', 설명: '모서리 둘 ＋ 그 사이를 커튼이 잇는다', 투명도: 0.15,
    그림: () => `
      <div style="position:absolute;top:0;left:0;right:0">${커튼(6, 34)}</div>
      <div style="position:absolute;top:0;left:0">${모서리(140)}</div>
      <div style="position:absolute;top:0;right:0;transform:scaleX(-1)">${모서리(140)}</div>` },
]

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()

const 시트닫기 = async () => {
  for (let i = 0; i < 5; i++) {
    const 닫았나 = await p.evaluate(() => {
      const b = [...document.querySelectorAll('button, [role="button"]')]
        .filter((x) => x.getBoundingClientRect().height > 8)
        .find((x) => /^(나중에 볼게요|닫기)$/.test((x.innerText || '').trim()))
      if (!b) return false; b.click(); return true
    })
    if (닫았나) { await p.waitForTimeout(500); continue }
    if (!(await p.locator('.sheet-mask').count())) break
    await p.keyboard.press('Escape'); await p.waitForTimeout(350)
  }
}

const 얹기 = async (html, 투명도) => p.evaluate(({ html, o }) => {
  document.getElementById('hk-hw')?.remove()
  const d = document.createElement('div'); d.id = 'hk-hw'
  // ⛔ pointer-events:none — 장식이 «누르기»를 먹으면 안 된다(덮는 자리라 제일 위험하다)
  d.style.cssText = `position:fixed;inset:0;z-index:5;pointer-events:none;color:var(--text-sub);opacity:${o}`
  d.innerHTML = html
  document.body.appendChild(d)
}, { html, o: 투명도 })

await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(2200)
await 시트닫기()

// ⭐ 시안은 «모양»을 고르는 판이라 보이게 뽑는다(x2.4). 진하기는 아래 사다리에서 따로 고른다.
const 보이게 = 2.4
for (const s of 시안) {
  await 얹기(s.그림(), s.투명도 * 보이게)
  await p.waitForTimeout(400)
  await p.screenshot({ path: join(OUT, `${s.이름}.png`) })
  console.log(`🕸 ${s.이름.padEnd(10)} ${String(s.투명도).padEnd(5)} — ${s.설명}`)
}

// 🪜 진하기 사다리 — 「연하게」가 얼마나 연한지는 «나란히 놓고» 골라야 정해진다
for (const o of [0.15, 0.25, 0.35, 0.5]) {
  await 얹기(시안[0].그림(), o)
  await p.waitForTimeout(320)
  await p.screenshot({ path: join(OUT, '사다리-' + String(o).replace('.', '_') + '.png') })
}

// ⭐ 「어느 테마 위에도 얹힌다」를 증명한다 — 다크에서도 한 장
await p.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
await 얹기(시안[0].그림(), 시안[0].투명도)
await p.waitForTimeout(400)
await p.screenshot({ path: join(OUT, '다크-ⓐ커튼.png') })

// 🖱 장식이 누르기를 먹지 않나 — 숫자로도 확인한다(눈으로는 안 보이는 사고다)
const 막나 = await p.evaluate(() => {
  const el = document.elementFromPoint(270, 120)
  return el ? (el.closest('#hk-hw') ? '⛔ 장식이 막는다' : '✅ 안 막는다') : '?'
})
console.log(`🖱 누르기 = ${막나}`)
console.log(`📄 ${OUT}`)
await b.close(); srv.close()
