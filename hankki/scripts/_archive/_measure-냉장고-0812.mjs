// 🔬 창업자 폰 제보 재측정 — *"냉장고 이미지가 커서 두부가 잘 안 보임"*
//   ⛔⛔ 나는 이걸 「재료 타일 아이콘이 크다」로 읽고 타일을 46→38 로 줄였다.
//      그런데 창업자 캡처를 보니 **두부 줄 아이콘은 이미 작고**, 화면을 먹는 건
//      위의 「가진 재료로 만들 수 있어요」 **추천 카드 4장**이다.
//   📌 규칙 18 — 증상의 «이유»를 내가 정하면 처방이 통째로 빗나간다. 재서 확인한다.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const PORT = 4196
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT)], { stdio: 'ignore' })
await new Promise(r => setTimeout(r, 3500))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
// 창업자 폰 = 캡처 919×2044(물리) · DPR 3 이면 CSS 뷰포트 ≈ 306×681 인데
// 그건 너무 좁다 → DPR 2.5 로 보고 368×818, 그리고 흔한 412×915 둘 다 잰다.
for (const [w,h] of [[368,818],[412,915]]) {
  const ctx = await b.newContext({ viewport:{width:w,height:h}, timezoneId:'Asia/Seoul' })
  const p = await ctx.newPage()
  await p.addInitScript(() => {
    localStorage.setItem('hankki:onboarded','1')
    const o = Storage.prototype.getItem
    Storage.prototype.getItem = function(k){ return k.startsWith('hankki:coach:') ? '1' : o.call(this,k) }
    const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    s.recipes = s.recipes || []
    s.pantry = [{ id:'p1', name:'두부', icon:'tofu', addedAt:Date.now() }]   // ⭐ 창업자와 «똑같이» 하나만
    localStorage.setItem('hankki:v1', JSON.stringify(s))
  })
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil:'networkidle' })
  await p.waitForTimeout(600)
  await p.locator('.bottom-nav button', { hasText:'장보기' }).first().click()
  await p.waitForTimeout(400)
  await p.locator('button.seg', { hasText:'냉장고' }).first().click()
  await p.waitForTimeout(600)
  const 재 = await p.evaluate(() => {
    const 화면 = document.querySelector('.screen')
    const 추천 = [...document.querySelectorAll('.grid-card')]
    const 줄 = document.querySelector('.wish-row')
    const r = 줄?.getBoundingClientRect()
    const 함 = [...document.querySelectorAll('.h-section')].find(e=>e.textContent.includes('냉장고 재료함'))
    return {
      추천카드: 추천.length,
      추천높이: 추천.length ? Math.round(추천[0].getBoundingClientRect().height) : 0,
      추천칸총높이: 추천.length ? Math.round(추천[추천.length-1].getBoundingClientRect().bottom - 추천[0].getBoundingClientRect().top) : 0,
      재료함y: 함 ? Math.round(함.getBoundingClientRect().top) : null,
      두부y: r ? Math.round(r.top) : null,
      화면높이: Math.round(화면?.getBoundingClientRect().height || 0),
      두부가보이나: r ? (r.top < (화면?.getBoundingClientRect().bottom || 0) && r.bottom > 0) : false,
      굴려야하는양: r ? Math.round(r.top - (화면?.getBoundingClientRect().bottom || 0)) : null,
      타일: Math.round(document.querySelector('.emoji-tile')?.getBoundingClientRect().width || 0),
    }
  })
  console.log(`\n📱 ${w}×${h}`)
  for (const k in 재) console.log(`   ${k} = ${재[k]}`)
  await ctx.close()
}
await b.close(); srv.kill(); process.exit(0)
