// 📸 **판(아티팩트)을 «올리기 전»에 내 눈으로 본다** — 절대원칙 21(2026-08-11).
//
//   📮 창업자 = *"나한테 보여주기전에 실물확인하고 보여줘 (절대원칙)"*
//   ⛔ 그때 사고 = 숫자는 «전부 초록불»인데 보낸 캡처 셋이 다 «온보딩 화면»이었다.
//      **가려진 것을 숫자는 모른다.** 그래서 찍고 «열어서» 본다.
//
//   ⭐ 아티팩트는 조각(fragment)으로 올라가고 claude.ai 가 뼈대를 씌운다
//      (charset · viewport · 얕은 리셋 · body margin 0 · 14px 시스템 글꼴 · img max-width).
//      → 여기서도 **같은 뼈대**를 씌워 찍는다. 안 씌우면 진짜와 다른 걸 보게 된다.
//
// 쓰는 법
//   node scripts/_shot-판-0829.mjs <판.html> [낼폴더] [폭...]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { basename, join } from 'node:path'
import { chromium } from 'playwright'

const 판 = process.argv[2]
if (!판) { console.error('⛔ 판 html 경로를 줘라'); process.exit(1) }
const 낼폴더 = process.argv[3] || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/shot'
const 폭들 = (process.argv[4] ? process.argv.slice(4) : ['390', '820']).map(Number)
mkdirSync(낼폴더, { recursive: true })

const 뼈대 = (조각) => `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>:root{color-scheme:light dark}body{margin:0;font:14px system-ui,sans-serif;background:#fbfbfa}
img{max-width:100%}[hidden]{display:none!important}</style></head><body>${조각}</body></html>`

const 이름 = basename(판).replace(/\.html$/, '')
const b = await chromium.launch()
for (const 테마 of ['light', 'dark']) {
  for (const w of 폭들) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, colorScheme: 테마 })
    const p = await ctx.newPage()
    const 사고 = []
    p.on('pageerror', (e) => 사고.push(String(e)))
    p.on('console', (m) => { if (m.type() === 'error') 사고.push(m.text()) })
    await p.setContent(뼈대(readFileSync(판, 'utf8')), { waitUntil: 'networkidle' })
    await p.waitForTimeout(400)

    // 🔢 재기 — 「보이나」가 아니라 «값»으로 (규칙 18 ⓘ)
    const 잰값 = await p.evaluate(() => ({
      가로넘침: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      키: document.body.scrollHeight,
      주차칸: document.querySelectorAll('.week').length,
      제품칸: document.querySelectorAll('.week .item').length,
      열린것: document.querySelectorAll('#openlist .item').length,
      고르기단추: document.querySelectorAll('.seg button').length,
      복사단추: !!document.getElementById('copy'),
      // ⛔ 글꼴이 «조용히» 떨어졌나 — Google Fonts 가 막히면 여기서 드러난다
      제목글꼴: getComputedStyle(document.querySelector('h1')).fontFamily,
      바탕: getComputedStyle(document.body).backgroundColor,
      글자: getComputedStyle(document.body).color,
      // ⭐ 한가운데를 «덮은 것»이 있나 (2026-08-11 온보딩 사고)
      한가운데: (document.elementFromPoint(innerWidth / 2, innerHeight / 2) || {}).className || '(없음)',
    }))
    console.log(`\n── ${테마} ${w}px ──`)
    for (const [k, v] of Object.entries(잰값)) console.log(`   ${k} = ${v}`)
    if (사고.length) console.log(`   ⛔ 콘솔 사고 ${사고.length}건 — ${사고.slice(0, 3).join(' / ')}`)
    if (잰값.가로넘침 > 0) console.log(`   ⛔ 가로로 넘친다 ${잰값.가로넘침}px`)

    const 낼 = join(낼폴더, `${이름}-${테마}-${w}.png`)
    await p.screenshot({ path: 낼, fullPage: false })
    await p.screenshot({ path: join(낼폴더, `${이름}-${테마}-${w}-전체.png`), fullPage: true })
    console.log(`   📸 ${낼}`)
    await ctx.close()
  }
}
await b.close()
