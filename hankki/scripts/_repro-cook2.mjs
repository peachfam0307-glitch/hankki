// 🐛 재현 — 「긴 레시피는 요리 시작하면 다음 버튼이 사라진다」 (테스터 제보 2026-08-04)
//
// ⭐ 서버를 안 띄운다 — 앱의 `src/styles.css` 를 «그대로» 물린 재현판을 로컬 파일로 연다.
//    CookScreen.jsx 의 DOM 구조(.cook > .cook-top/.cook-progress/.cook-body/.cook-nav)를 그대로 옮겼다.
// 판정 = 「재료 준비 완료 · 시작 →」 줄(.cook-nav)의 아래 끝이 뷰포트(844) 안에 있나.
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다 (2026-08-06)
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'

const css = readFileSync(process.env.CSS || 'src/styles.css', 'utf8')
const ING = ['돼지고기 앞다리살(또는 대패삼겹살) 400g', '양파 1/2개', '대파 1대', '양배추 2장 (선택)',
  '[양념]', '고추장 2큰술', '고춧가루 2큰술', '진간장 2큰술',
  '아우노슈가 1과1/2큰술 (일반설탕 1큰술)', '올리고당 1큰술', '다진 마늘 1큰술',
  '미림 1큰술', '후추 약간', '참기름 1/2큰술']

const html = (extra) => `<!doctype html><html><head><meta charset="utf-8"><style>
${css}
html,body{margin:0;height:100%;}
${extra}
</style></head><body><div class="cook">
  <div class="cook-top">
    <button class="round-btn">✕</button>
    <div class="cook-title">제육볶음</div>
    <button class="cook-ing-btn">재료</button>
  </div>
  <div class="cook-progress">${'<button class="cp-seg"></button>'.repeat(8)}</div>
  <div class="cook-body">
    <div class="cook-stepno">재료 준비 <span>· 요리의 시작</span></div>
    <div style="width:100%;max-width:460px;margin:4px auto 0;text-align:left">
      ${ING.map((t) => `<div class="ing" style="font-size:17px">${t}</div>`).join('')}
    </div>
    <div style="margin-top:18px;display:flex;flex-direction:column;gap:9px;width:100%;max-width:460px">
      <div style="display:flex;align-items:center;gap:9px;font-size:13.5px;color:var(--text-sub)">요리하는 동안 화면이 꺼지지 않아요.</div>
      <div style="display:flex;align-items:center;gap:9px;font-size:13.5px;color:var(--text-sub)">타이머는 필요할 때 단계에서 눌러 쓰세요.</div>
    </div>
  </div>
  <div class="cook-nav">
    <button class="cook-navbtn">이전</button>
    <button class="cook-navbtn primary">재료 준비 완료 · 시작 →</button>
  </div>
</div></body></html>`

// 고치는 CSS — 이 두 줄이 전부다
const FIX = `
.cook-body { min-height: 0; overflow-y: auto; justify-content: safe center; }
.cook-nav  { flex: 0 0 auto; }
`

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()

for (const [label, extra, shot] of [['수정 전', '', 'cook-before.png'], ['수정 후', FIX, 'cook-after.png']]) {
  const f = `/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/_cook-${label === '수정 전' ? 'before' : 'after'}.html`
  writeFileSync(f, html(extra))
  await page.goto('file://' + f)
  await page.waitForTimeout(400)
  const r = await page.evaluate(() => {
    const nav = document.querySelector('.cook-nav'), body = document.querySelector('.cook-body')
    const n = nav.getBoundingClientRect(), b = body.getBoundingClientRect()
    return { navBottom: Math.round(n.bottom), navTop: Math.round(n.top),
      bodyH: Math.round(b.height), bodyScroll: body.scrollHeight,
      ov: getComputedStyle(body).overflowY, ings: document.querySelectorAll('.ing').length }
  })
  const off = r.navBottom > 844
  console.log(`\n── ${label} ──`)
  console.log(`  재료 ${r.ings}줄 · .cook-body 높이 ${r.bodyH} / 내용 ${r.bodyScroll} · overflow-y:${r.ov}`)
  console.log(`  .cook-nav  top ${r.navTop} · bottom ${r.navBottom}  (뷰포트 844)`)
  console.log(off
    ? `  ⛔ 버튼이 화면 밖으로 ${r.navBottom - 844}px 밀렸다 — 스크롤도 안 되니 «영영 못 누른다»`
    : `  ✅ 버튼이 화면 안 (여유 ${844 - r.navBottom}px) · 본문은 ${r.bodyScroll > r.bodyH ? '안에서 스크롤된다' : '넘치지 않는다'}`)
  await page.screenshot({ path: `/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/${shot}` })
}
await browser.close()
