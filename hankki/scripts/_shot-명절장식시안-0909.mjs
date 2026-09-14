// 🎑🎃 명절 장식 시안 — **창업자가 뽑아준 «진짜 그림»** 을 홈에 얹어서 찍는다 (2026-09-09)
//
// 📮 창업자 2026-09-09 = *"입체감이 없어서 안예쁘네.. 진짜 거미줄같은 입체감이나 색이 있는"*
//    → 앞의 SVG 선그림은 버렸다. 이건 창업자가 뽑아준 컷을 자른 «진짜 PNG» 다.
// 📮 ＋ *"여러군데 과하지않게 배치를 해보고 시안을 몇개줘"*
// 📮 ＋ *"박쥐는 아주 작게 넣으려고"* → 박쥐는 24~34px 로만 쓴다
// 📮 ＋ *"달을 자르고 우리 달 붙일거자나. 거기를 바라보게 하자"*
//    → duo301(앉아서 올려다보는 곰펭)은 달을 «떼고» 잘랐고, 우리 달(달01)을 그 시선 끝에 둔다.
//
// ⭐ 왜 실물로 찍나 = 미감은 눈으로 판정한다(규칙 11·21). 「과하지 않게」는 숫자로 못 정한다.
// ⛔ 앱 소스는 «한 줄도» 안 고친다 — 화면에 얹어서 찍기만 한다. 고르면 그때 넣는다.
// ⛔ 브라우저 경로를 판에 박지 않는다 — `SMOKE_CHROMIUM` 만 읽는다(v10.90 사고)
//
// 쓰는 법 = node scripts/_shot-명절장식시안-0909.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const CUTS = join(ROOT, 'docs/stickers/명절-창업자-2026-09-09/낱개')
const OUT = process.env.OUT || '/tmp/hankki-명절시안'
rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true })

// ── 조각 하나 = 컷 파일 ＋ 자리 ＋ 크기 ＋ 투명도 ────────────────────
//   좌표는 % 로 둔다 — 폰 크기가 달라도 «같은 자리»에 온다.
//   ⛔ px 로 박으면 작은 폰에서 밀려 나간다.
const 조각 = (파일, s) => ({ 파일, ...s })

// 🕸 핼러윈 -----------------------------------------------------------
// ⛔ 첫 판은 커튼을 100%·0.5 로 얹었다 — 헤더(로고·검색)를 통째로 덮어 «장식이 아니라 방해»가 됐다.
//    ✅ 폭을 줄이고 위로 밀어 «가장자리에만» 걸치게 한다. 리본이 진해서 투명도도 더 낮춘다.
const 거미줄커튼 = (o = 0.3) => 조각('거미줄02.png', { top: '-4%', left: '-6%', w: '62%', o })
const 거미줄모서리 = (o = 0.35) => 조각('거미줄05.png', { top: '-2%', right: '-3%', w: '24%', o })
const 거미줄작은 = (o = 0.45) => 조각('거미줄03.png', { top: '52%', left: '0%', w: '16%', o })
const 거미줄동그란 = (o = 0.4) => 조각('거미줄04.png', { top: '70%', right: '2%', w: '20%', o })
// ⭐ 박쥐는 «아주 작게» — 창업자 지시. 크게 쓰면 애들 그림책이 아니라 놀이공원이 된다.
const 박쥐 = (파일, s) => 조각(파일, { o: 0.85, ...s })

// 🎑 추석 -------------------------------------------------------------
const 보름달 = (s) => 조각('달01.png', { o: 0.9, ...s })
const 청사초롱 = (s) => 조각('추석소품01.png', { o: 0.9, ...s })
const 억새 = (s) => 조각('억새01.png', { o: 0.85, ...s })
const 구름 = (s) => 조각('추석소품03.png', { o: 0.7, ...s })
const 송편 = (s) => 조각('추석소품04.png', { o: 0.95, ...s })
const 곰펭올려다봄 = (s) => 조각('duo301.png', { o: 1, ...s })

const 시안 = [
  // ══ 핼러윈 ══
  { 이름: '핼-ⓐ커튼만', 설명: '위에 커튼 하나 — 제일 얌전',
    조각들: [거미줄커튼(0.5)] },
  { 이름: '핼-ⓑ커튼＋모서리', 설명: '위 커튼 ＋ 오른쪽 위 모서리',
    조각들: [거미줄커튼(0.45), 거미줄모서리(0.5)] },
  { 이름: '핼-ⓒ커튼＋박쥐둘', 설명: '커튼 ＋ 아주 작은 박쥐 둘 (창업자 요청 결)',
    조각들: [거미줄커튼(0.45),
      박쥐('박쥐짙은04.png', { top: '18%', right: '8%', w: '7%' }),
      박쥐('박쥐회갈04.png', { top: '30%', left: '6%', w: '5%' })] },
  { 이름: '핼-ⓓ네군데조금씩', 설명: '커튼·모서리·작은늘어짐·박쥐 — 「여러 군데 과하지 않게」',
    조각들: [거미줄커튼(0.4), 거미줄모서리(0.42), 거미줄작은(0.4),
      박쥐('박쥐짙은04.png', { top: '20%', right: '30%', w: '6%' }),
      박쥐('박쥐회갈04.png', { top: '63%', left: '10%', w: '4.5%' })] },
  { 이름: '핼-ⓔ아래쪽에도', 설명: '위 커튼 ＋ 아래 동그란 거미줄 ＋ 박쥐 하나',
    조각들: [거미줄커튼(0.4), 거미줄동그란(0.4),
      박쥐('박쥐짙은04.png', { top: '26%', left: '8%', w: '6%' })] },

  // ══ 추석 ══
  { 이름: '추-ⓐ달만', 설명: '오른쪽 위에 보름달 하나 — 제일 얌전',
    조각들: [보름달({ top: '2%', right: '3%', w: '26%', o: 0.85 })] },
  { 이름: '추-ⓑ달＋구름', 설명: '달에 구름 한 조각 걸치기',
    조각들: [보름달({ top: '2%', right: '3%', w: '26%', o: 0.85 }),
      구름({ top: '11%', right: '20%', w: '20%', o: 0.6 })] },
  { 이름: '추-ⓒ초롱매달기', 설명: '왼쪽 위에 청사초롱을 매단다',
    조각들: [청사초롱({ top: '0%', left: '3%', w: '20%', o: 0.9 }),
      보름달({ top: '4%', right: '4%', w: '20%', o: 0.75 })] },
  { 이름: '추-ⓓ달＋억새', 설명: '위에 달 · 아래 모서리에 억새',
    조각들: [보름달({ top: '2%', right: '4%', w: '24%', o: 0.85 }),
      억새({ bottom: '9%', left: '-2%', w: '26%', o: 0.75 })] },
  { 이름: '추-ⓔ곰펭이달을본다', 설명: '⭐ 창업자 지시 — 달을 떼고 우리 달을 시선 끝에',
    조각들: [보름달({ top: '3%', right: '8%', w: '22%', o: 0.9 }),
      곰펭올려다봄({ bottom: '10%', left: '4%', w: '36%' })] },
  { 이름: '추-ⓕ네군데조금씩', 설명: '달·구름·억새·송편 — 「여러 군데 과하지 않게」',
    조각들: [보름달({ top: '2%', right: '4%', w: '22%', o: 0.8 }),
      구름({ top: '10%', right: '22%', w: '17%', o: 0.55 }),
      억새({ bottom: '8%', left: '-3%', w: '22%', o: 0.65 }),
      송편({ bottom: '12%', right: '2%', w: '18%', o: 0.85 })] },
]

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try {
    // 🖼 자른 컷은 dist 밖(docs)에 있다 — 시안 전용 길을 따로 연다
    body = p.startsWith('/_컷/') ? readFileSync(join(CUTS, p.slice(4))) : readFileSync(join(DIST, p))
  } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
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

const 얹기 = async (조각들) => p.evaluate((조각들) => {
  document.getElementById('hk-deco')?.remove()
  const d = document.createElement('div'); d.id = 'hk-deco'
  // ⛔ pointer-events:none — 장식이 «누르기»를 먹으면 안 된다(덮는 자리라 제일 위험하다)
  d.style.cssText = 'position:fixed;inset:0;z-index:5;pointer-events:none'
  d.innerHTML = 조각들.map((c) => {
    const pos = ['top', 'bottom', 'left', 'right'].filter((k) => c[k] != null).map((k) => `${k}:${c[k]}`).join(';')
    return `<img src="/_컷/${c.파일}" style="position:absolute;${pos};width:${c.w};opacity:${c.o}">`
  }).join('')
  document.body.appendChild(d)
}, 조각들)

await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(2200)
await 시트닫기()
await p.screenshot({ path: join(OUT, '00-지금.png') })

for (const s of 시안) {
  await 얹기(s.조각들)
  await p.waitForTimeout(500)
  await p.screenshot({ path: join(OUT, `${s.이름}.png`) })
  console.log(`🎑 ${s.이름.padEnd(16)} 조각 ${s.조각들.length}개 — ${s.설명}`)
}

// ⭐ 「어느 테마 위에도 얹힌다」를 증명한다 — 다크에서도 한 장씩
for (const [키, 이름] of [['dark', '다크'], ['apricot', '살구']]) {
  await p.evaluate((k) => { document.documentElement.dataset.theme = k }, 키)
  for (const s of [시안[3], 시안[10]]) {
    await 얹기(s.조각들); await p.waitForTimeout(400)
    await p.screenshot({ path: join(OUT, `${이름}-${s.이름}.png`) })
  }
}
await p.evaluate(() => { document.documentElement.dataset.theme = 'greige' })

// 🖱 장식이 누르기를 먹지 않나 — 숫자로도 확인한다(눈으로는 안 보이는 사고다)
await 얹기(시안[3].조각들); await p.waitForTimeout(300)
const 막나 = await p.evaluate(() => {
  const 본 = [[270, 120], [270, 400], [270, 700]].map(([x, y]) => {
    const el = document.elementFromPoint(x, y)
    return el && el.closest('#hk-deco') ? '⛔막힘' : '✅'
  })
  return 본.join(' ')
})
console.log(`🖱 누르기 = ${막나}`)
console.log(`📄 ${OUT}`)
await b.close(); srv.close()
