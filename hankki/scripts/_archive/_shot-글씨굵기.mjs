// ✒️ 글씨체 × 굵기 3단(얇게·보통·굵게) 한 판 — `fw`(살 보정)를 «보고» 정하려고 만든다
//
// ⛔⛔ **숫자로 세 번 시도했고 세 번 다 엉뚱한 걸 쟀다** (2026-08-07 · 기록으로 남긴다)
//    ① 「잉크가 상자를 덮는 비율」을 여섯이 같아지게 맞춤 → **목표가 틀렸다.**
//       임팩트(81%)와 펜글씨(47%)는 원래 그렇게 생긴 글씨체다. 같게 만들면 글씨체가 여럿일 이유가 없다.
//    ② 「글자 안 구멍 수」 → **방향이 거꾸로.** 굵게 하면 획이 자모 사이를 «막아» 구멍이 오히려 늘었다(150~350%).
//    ③ 「획이 몇 덩어리로 뭉치나」 → 뜻은 맞는데 **바닥선을 지금 것에서 뽑으니** 통통체·라운드가
//       이미 한 덩어리(8%)라 무엇을 넣어도 통과했다. 재는 자가 «자기 자신»이면 아무것도 안 걸린다.
//    ＋ 그 전에 **CORS 로 글꼴이 하나도 안 떴는데 숫자는 그럴듯하게 나온** 판도 있었다
//       (`setContent` 는 origin 이 null 이다). 여섯이 «전부 같은 값»인 게 유일한 신호였다.
//
// ⭐ 그래서 우리 규칙으로 돌아간다 (v9.16) — **숫자는 「어디를 볼지」만 정하고, 「맞나 틀리나」는 눈이 정한다.**
//    앱과 «똑같이» 그린 판을 놓고 본다. 최종 판정은 창업자(규칙 11).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/글씨굵기'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const FONTS = join(ROOT, 'src/assets/fonts')

let PAGE = ''
const srv = createServer((q, s) => {
  const p = decodeURIComponent(q.url.split('?')[0])
  if (p === '/' || p.endsWith('.html')) { s.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); s.end(PAGE); return }
  // ⚠️ 읽고 «나서» 머리글을 쓴다 — 먼저 쓰면 못 찾았을 때 404 를 또 써서 죽는다
  let body = null
  try { body = readFileSync(join(FONTS, p.slice(1))) } catch { /* 404 */ }
  if (!body) { s.writeHead(404); s.end(''); return }
  s.writeHead(200, { 'content-type': 'font/woff2' }); s.end(body)
})
await new Promise((r) => srv.listen(4400, r))

// ⚠️ `Stickers.jsx` 의 `TEXT_FONTS` 와 **같아야 한다.** 값을 고치면 여기도 같이 고칠 것.
const FONTS_TBL = [
  ['귀염체', 'Gaegu', 'gaegu', 700, 0.85, '0em', 1],
  ['펜글씨', 'Nanum Pen Script', 'nanumpen', 400, 0.5, '0.1em', 1],
  ['통통체', 'Jua', 'jua', 400, 0.8, '0em', 1],
  ['또박체', 'Gowun Dodum', 'gowun-dodum', 800, 1, '0.01em', 1],
  ['임팩트', 'Black Han Sans', 'blackhansans', 400, 0.45, '0em', 1],
  ['라운드', 'Do Hyeon', 'dohyeon', 400, 0.9, '0em', 1],
  // ⭐ 확정값 = 「시안 B」. 첫 시안(0.75·0.7·0.8·0.85·0.6·0.8)은 **굵게가 굵어 보이지 않았다** —
  //    새 여섯이 다 얇은 글씨라 살을 아끼니 「보통」과 구분이 안 갔다. 올려도 뭉치는 건 없었다.
  //    (환경변수로 덮어 다른 값도 바로 볼 수 있게 남겨둔다 — 다음에 또 눈으로 견주려면 필요하다)
  ['가는체', 'Single Day', 'singleday', 400, +(process.env.FW_SINGLEDAY || 0.9), '0.02em', 0],
  ['동글체', 'Cute Font', 'cutefont', 400, +(process.env.FW_CUTEFONT || 0.9), '0.02em', 0],
  ['납작체', 'Dongle', 'dongle', 400, +(process.env.FW_DONGLE || 1), '0em', 0],
  ['연필체', 'Poor Story', 'poorstory', 400, +(process.env.FW_POORSTORY || 0.9), '0em', 0],
  ['몽글체', 'Hi Melody', 'himelody', 400, +(process.env.FW_HIMELODY || 0.8), '0.04em', 0],
  ['삐뚤체', 'Gamja Flower', 'gamjaflower', 400, +(process.env.FW_GAMJA || 0.9), '0em', 0],
]
const WEIGHTS = [['얇게', 0], ['보통', 0.055], ['굵게', 0.16]] // TEXT_WEIGHTS 와 같은 값

// 🎨 `DecorLayer.jsx` 의 `TextDeco` 를 그대로 옮긴 것 — 여기만 다르면 판정이 헛것이 된다
const styleFor = ({ family, weight, ls, fw, fontPx, fat, color = '#382d21', stroke = 'rgba(255,255,255,.68)' }) => {
  const fatPx = fontPx * fat * fw
  const outPx = Math.max(0.8, fontPx * 0.028)
  const sh = [`${outPx}px 0 0 ${stroke}`, `-${outPx}px 0 0 ${stroke}`, `0 ${outPx}px 0 ${stroke}`, `0 -${outPx}px 0 ${stroke}`,
    `${outPx * 0.7}px ${outPx * 0.7}px 0 ${stroke}`, `-${outPx * 0.7}px ${outPx * 0.7}px 0 ${stroke}`,
    `${outPx * 0.7}px -${outPx * 0.7}px 0 ${stroke}`, `-${outPx * 0.7}px -${outPx * 0.7}px 0 ${stroke}`,
    '0 1px 3px rgba(0,0,0,.35)'].join(',')
  return `font-family:'${family}';font-weight:${weight};font-size:${fontPx}px;`
    + `letter-spacing:calc(${ls} + ${(fat * 1.6).toFixed(3)}em);line-height:1.22;color:${color};`
    + `-webkit-text-stroke:${fatPx > 0.2 ? `${fatPx}px ${color}` : '0'};paint-order:stroke fill;text-shadow:${sh};white-space:pre;`
}

const faces = FONTS_TBL.flatMap(([, fam, file]) => [
  `@font-face{font-family:'${fam}';src:url('/${file}-latin-400.woff2') format('woff2');font-display:block}`,
  `@font-face{font-family:'${fam}';src:url('/${file}-korean-400.woff2') format('woff2');font-display:block}`,
]).join('\n')

const rows = (only) => FONTS_TBL.filter(([, , , , , , now]) => now === only).map(([ko, fam, , wt, fw, ls]) => `
  <div class="row">
    <div class="tag"><b>${ko}</b><span>${fam} · 살 ${fw}</span></div>
    <div class="paper">
      ${WEIGHTS.map(([wl, fat]) => `<div class="cell"><i>${wl}</i>
        <div style="${styleFor({ family: fam, weight: wt, ls, fw, fontPx: 30, fat })}">맛있겠다</div></div>`).join('')}
    </div>
  </div>`).join('')

PAGE = `<!doctype html><meta charset="utf-8"><style>
${faces}
*{box-sizing:border-box;margin:0}
body{width:380px;background:#eae7e0;font-family:system-ui,sans-serif;padding:12px 12px 18px}
h2{font-size:14.5px;font-weight:800;color:#4a4034;margin:2px 0 9px}
h2 small{display:block;font-size:11px;font-weight:600;color:#8b8073;margin-top:3px}
.row{margin-bottom:9px}
.tag{display:flex;align-items:baseline;gap:6px;margin:0 2px 3px}
.tag b{font-size:12px;font-weight:800;color:#4a4034}
.tag span{font-size:10.5px;color:#8b8073}
.paper{background:#faf7f1;border-radius:11px;padding:9px 6px;display:flex;box-shadow:0 1px 5px rgba(70,60,45,.10)}
.cell{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0}
.cell i{font-style:normal;font-size:9.5px;color:#a09585;font-weight:700}
</style>
<h2>지금 있는 6개 — 얇게 · 보통 · 굵게<small>기준. 새 것이 이 정도로 뭉개지지 않아야 한다</small></h2>
${rows(1)}
<h2 style="margin-top:16px">새로 넣을 6개<small>「굵게」에서 획이 서로 붙어 덩어리가 되는지 본다</small></h2>
${rows(0)}`
writeFileSync(join(OUT, 'board.html'), PAGE)

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await (await b.newContext({ viewport: { width: 380, height: 900 }, deviceScaleFactor: 3 })).newPage()
await page.goto('http://127.0.0.1:4400/w.html', { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(1500)

// 🔒 재기 전에 「진짜 떴나」 — 안 떴는데 그림만 보고 판정하면 대체 글꼴을 보는 것이다
const dead = await page.evaluate((list) => {
  const m = document.createElement('span')
  m.style.cssText = 'position:fixed;left:-9999px;font-size:80px;white-space:pre'; m.textContent = '맛있겠다'
  document.body.appendChild(m)
  m.style.fontFamily = 'serif'; const base = m.getBoundingClientRect().width
  const bad = []
  for (const f of list) { m.style.fontFamily = `'${f}', serif`; if (m.getBoundingClientRect().width === base) bad.push(f) }
  m.remove(); return bad
}, FONTS_TBL.map(([, fam]) => fam))
if (dead.length) { console.log(`⛔ 안 뜬 글씨체 ${dead.length}개 — ${dead.join(', ')}`); await b.close(); srv.close(); process.exit(1) }
console.log(`✅ ${FONTS_TBL.length}개 전부 진짜로 떴다`)

await page.screenshot({ path: join(OUT, '글씨굵기.png'), fullPage: true })
console.log('📸', join(OUT, '글씨굵기.png'))
await b.close(); srv.close()
