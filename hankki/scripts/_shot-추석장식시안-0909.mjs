// 🎑 추석 «장식» 시안 — 유저가 고른 테마 «위에» 얹는다 (2026-09-09)
//
// 📮 창업자 2026-09-09 = *"추석도 얹자 시안보여줘 필요한거 할로윈이랑 같이 뽑아볼게"*
//    → 핼러윈 거미줄(`_shot-거미줄시안-0909.mjs`)과 **같은 방식**이다. 짝을 맞춘다.
//
// ⭐⭐ 방식의 핵심 = **색을 «박지» 않는다.**
//    `var(--text-sub)` 를 옅게 → 밝은 테마는 연회색, 다크는 밝은 회보라로 저절로 따라간다.
//    ⛔ 노란 달로 «색을 박으면» 크림·살구 테마에서 배경에 묻고 다크에서 혼자 튄다.
//
// ⭐ 「늘어뜨린」 결을 추석으로 옮긴 것 = **청사초롱 줄**(거미줄 커튼의 짝).
//    나머지는 추석의 «상징»이라 결이 다르다 — 보름달(위) · 억새(아래) · 구름(띠).
//
// ⛔ 유료팩 컷(추석 44컷)은 «쓰지 않는다» — 파는 물건이다(누수 금지). SVG 로 그린다 = 무게 0.
// ⛔ 창업자가 «뽑아줄» 컷(곰펭·소품)은 여기서 안 그린다 — 자리만 비워 두고 받으면 얹는다.
//
// ⛔ 브라우저 경로를 판에 박지 않는다 — `SMOKE_CHROMIUM` 만 읽는다(v10.90 사고)
//
// 쓰는 법 = node scripts/_shot-추석장식시안-0909.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.OUT || '/tmp/hankki-추석장식'
rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true })

const 감싸기 = (w, h, inner, style = '') =>
  `<svg viewBox="0 0 ${w} ${h}" width="100%" height="auto" preserveAspectRatio="xMidYMin meet"
     aria-hidden="true" style="display:block;${style}"
     fill="none" stroke="currentColor" stroke-linecap="round">${inner}</svg>`

// 🌕 보름달 — 테두리 한 겹 ＋ 안쪽에 아주 옅은 결(달 무늬). 채우지 «않는다»(채우면 무거워 보인다).
const 보름달 = (r = 92) => 감싸기(r * 2 + 8, r * 2 + 8, `
  <circle cx="${r + 4}" cy="${r + 4}" r="${r}" stroke-width="1.6"/>
  <circle cx="${r + 4}" cy="${r + 4}" r="${r * 0.82}" stroke-width="0.8" opacity=".55"/>
  <circle cx="${r * 0.72}" cy="${r * 0.78}" r="${r * 0.16}" stroke-width="0.9" opacity=".6"/>
  <circle cx="${r * 1.36}" cy="${r * 1.22}" r="${r * 0.1}" stroke-width="0.9" opacity=".6"/>
  <circle cx="${r * 1.1}" cy="${r * 0.52}" r="${r * 0.07}" stroke-width="0.9" opacity=".5"/>`,
  `width:${r * 2 + 8}px`)

// 🏮 청사초롱 줄 — 늘어진 줄에 등이 매달린다. «거미줄 커튼»의 추석판.
//    ⭐ 줄에 처짐(sag)을 줘야 매달린 것으로 읽힌다 — 직선이면 그냥 띠가 된다.
const 초롱줄 = (개수 = 5, w = 540) => {
  const s = w / (개수 + 1); const 처짐 = 26
  let 줄 = `M0 8 Q ${w / 2} ${8 + 처짐 * 1.6} ${w} 8`, 등 = ''
  for (let i = 1; i <= 개수; i++) {
    const x = s * i
    // 줄의 처짐을 따라 등이 매달리는 높이가 달라진다(가운데가 더 내려온다)
    const t = x / w, sag = 8 + 처짐 * 1.6 * 2 * t * (1 - t)
    // ⛔⛔ 첫 판은 몸통을 «곡선 두 줄»로 그렸더니 유리컵처럼 보였다(2026-09-09 실물 확인).
    //    ✅ 몸통을 «타원»으로 두고 위아래에 «갓»을 붙인다 — 그래야 등으로 읽힌다.
    const y = sag + 12, rx = 15, ry = 17
    const cy = y + 6 + ry
    등 += `<path d="M${x} ${sag} L${x} ${y}" stroke-width="0.9"/>`                        // 매단 줄
    등 += `<path d="M${x - rx - 4} ${y + 5} L${x + rx + 4} ${y + 5}" stroke-width="1.6"/>`  // 윗갓
    등 += `<ellipse cx="${x}" cy="${cy}" rx="${rx}" ry="${ry}" stroke-width="1.5"/>`      // 몸통
    등 += `<path d="M${x - rx * 0.55} ${cy - ry * 0.86} Q ${x - rx * 0.72} ${cy} ${x - rx * 0.55} ${cy + ry * 0.86}
             M${x + rx * 0.55} ${cy - ry * 0.86} Q ${x + rx * 0.72} ${cy} ${x + rx * 0.55} ${cy + ry * 0.86}"
             stroke-width="0.8" opacity=".75"/>`                                       // 살 두 줄
    등 += `<path d="M${x - rx * 0.7} ${cy + ry - 1} L${x + rx * 0.7} ${cy + ry - 1}" stroke-width="1.6"/>` // 아랫갓
    등 += `<path d="M${x} ${cy + ry + 1} L${x} ${cy + ry + 11}" stroke-width="0.9"/>`     // 술
    등 += `<path d="M${x - 4} ${cy + ry + 11} L${x + 4} ${cy + ry + 11}" stroke-width="1.2"/>`
  }
  return 감싸기(w, 130, `<path d="${줄}" stroke-width="1.5"/>${등}`)
}

// 🌾 억새 — 아래에서 «올라온다». 늘어뜨림의 반대 결이라 화면 아래를 채운다.
//    ⛔ 줄기를 곧게 그리면 벼가 된다 — 끝을 «휘어야» 억새다.
const 억새 = (w = 540, h = 150) => {
  const 줄기 = [[34, 118, -1], [78, 84, 1], [126, 138, -1], [176, 96, 1], [242, 126, -1],
    [312, 88, 1], [372, 132, -1], [428, 100, 1], [492, 120, -1]]
  const g = 줄기.map(([x, len, dir]) => {
    const tipX = x + dir * 26, tipY = h - len
    let s = `<path d="M${x} ${h} Q ${x + dir * 6} ${h - len * 0.55} ${tipX} ${tipY}" stroke-width="1.2"/>`
    for (let i = 0; i < 5; i++) {   // 이삭 = 짧은 털 다섯
      const t = 0.12 + i * 0.17
      const px = x + dir * 26 * t * t, py = h - len * (0.55 + t * 0.45)
      s += `<path d="M${px} ${py} l${dir * 9} ${-7}" stroke-width="0.9" opacity=".8"/>`
    }
    return s
  }).join('')
  return 감싸기(w, h, g)
}

// ☁️ 구름결 — 전통 구름무늬(상서로운 구름). 겹친 호로 그린다.
const 구름 = (w = 540) => {
  const 하나 = (x, y, k) => `
    <path d="M${x} ${y} a${14 * k} ${14 * k} 0 0 1 ${28 * k} 0 a${11 * k} ${11 * k} 0 0 1 ${22 * k} 0
             a${9 * k} ${9 * k} 0 0 1 ${18 * k} 0" stroke-width="1.3"/>
    <path d="M${x + 8 * k} ${y + 9 * k} a${9 * k} ${9 * k} 0 0 1 ${18 * k} 0" stroke-width="0.9" opacity=".7"/>`
  return 감싸기(w, 96, [하나(18, 40, 1), 하나(196, 22, 0.8), 하나(352, 52, 1.1), 하나(452, 18, 0.7)].join(''))
}

// ── 시안 여섯 ───────────────────────────────────────────────────
//   ⭐ 핼러윈 판과 «같은 잣대» — 모양을 먼저 고르고 진하기는 사다리로 따로 고른다.
const 시안 = [
  { 이름: 'ⓐ보름달', 설명: '오른쪽 위에 달 하나 — 제일 조용하고 「추석」이 바로 읽힌다', 투명도: 0.17,
    그림: () => `<div style="position:absolute;top:14px;right:16px">${보름달(86)}</div>` },

  { 이름: 'ⓑ청사초롱줄', 설명: '위에서 늘어진 줄에 등이 매달린다 — 거미줄 커튼의 짝', 투명도: 0.17,
    그림: () => `<div style="position:absolute;top:0;left:0;right:0">${초롱줄(5)}</div>` },

  { 이름: 'ⓒ억새', 설명: '아래에서 억새가 올라온다 — 위가 안 붐빈다', 투명도: 0.18,
    그림: () => `<div style="position:absolute;bottom:64px;left:0;right:0">${억새()}</div>` },

  { 이름: 'ⓓ달＋억새', 설명: '위엔 달, 아래엔 억새 — 위아래가 짝이 맞는다', 투명도: 0.16,
    그림: () => `
      <div style="position:absolute;top:14px;right:16px">${보름달(78)}</div>
      <div style="position:absolute;bottom:64px;left:0;right:0">${억새()}</div>` },

  { 이름: 'ⓔ달＋구름', 설명: '달에 구름이 걸린다 — 제일 「밤하늘」답다', 투명도: 0.16,
    그림: () => `
      <div style="position:absolute;top:14px;right:16px">${보름달(86)}</div>
      <div style="position:absolute;top:120px;left:0;right:0">${구름()}</div>` },

  { 이름: 'ⓕ초롱＋달', 설명: '초롱 줄 ＋ 그 뒤로 달 — 제일 풍성', 투명도: 0.15,
    그림: () => `
      <div style="position:absolute;top:8px;right:20px">${보름달(70)}</div>
      <div style="position:absolute;top:0;left:0;right:0">${초롱줄(5)}</div>` },
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
  document.getElementById('hk-cs')?.remove()
  const d = document.createElement('div'); d.id = 'hk-cs'
  // ⛔ pointer-events:none — 장식이 «누르기»를 먹으면 안 된다(덮는 자리라 제일 위험하다)
  d.style.cssText = `position:fixed;inset:0;z-index:5;pointer-events:none;color:var(--text-sub);opacity:${o}`
  d.innerHTML = html
  document.body.appendChild(d)
}, { html, o: 투명도 })

await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(2200)
await 시트닫기()

// ⭐ 시안은 «모양»을 고르는 판이라 보이게 뽑는다(x2.4) — 핼러윈 판과 같은 배율
const 보이게 = 2.4
for (const s of 시안) {
  await 얹기(s.그림(), s.투명도 * 보이게)
  await p.waitForTimeout(400)
  await p.screenshot({ path: join(OUT, `${s.이름}.png`) })
  console.log(`🎑 ${s.이름.padEnd(10)} — ${s.설명}`)
}

// 🪜 진하기 사다리
for (const o of [0.15, 0.25, 0.35, 0.5]) {
  await 얹기(시안[3].그림(), o)
  await p.waitForTimeout(320)
  await p.screenshot({ path: join(OUT, '사다리-' + String(o).replace('.', '_') + '.png') })
}

// ⭐ 다크에서도 한 장 — 색을 안 박았으니 따라와야 한다
await p.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
await 얹기(시안[3].그림(), 시안[3].투명도 * 보이게)
await p.waitForTimeout(400)
await p.screenshot({ path: join(OUT, '다크-ⓓ달＋억새.png') })

const 막나 = await p.evaluate(() => {
  const el = document.elementFromPoint(270, 120)
  return el ? (el.closest('#hk-cs') ? '⛔ 장식이 막는다' : '✅ 안 막는다') : '?'
})
console.log(`🖱 누르기 = ${막나}`)
console.log(`📄 ${OUT}`)
await b.close(); srv.close()
