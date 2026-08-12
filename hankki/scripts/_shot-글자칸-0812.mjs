// 📸 레꾸 「글자」 탭 큰 칸(Ⓑ 88px) 검수판 — 창업자 확정 2026-08-12
//
// ⛔⛔ 첫 판이 두 번 죽었다 — `.sheet-mask` 가 클릭을 가로챘다.
//    범인은 **서랍을 처음 열 때 뜨는 「출시기념 팩 안내」 시트**다(한 번만 뜬다).
//    `scripts/smoke.mjs` 148줄에 그 경고가 «이미 적혀 있었다» — 내가 안 읽고 새로 짰다.
//    📌 새 판을 짜기 전에 「같은 화면을 이미 여는 도구」가 있는지 본다.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = 4200
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT)], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 3500))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 3, timezoneId: 'Asia/Seoul' })
const p = await ctx.newPage()
p.on('pageerror', (e) => console.log('⛔ pageerror', String(e).slice(0, 140)))
await p.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1')
  const o = Storage.prototype.getItem
  Storage.prototype.getItem = function (k) { return k.startsWith('hankki:coach:') ? '1' : o.call(this, k) }
  const raw = localStorage.getItem('hankki:v1'); const s = raw ? JSON.parse(raw) : {}
  s.recipes = s.recipes || []
  localStorage.setItem('hankki:v1', JSON.stringify(s))
})
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(700)

await p.locator('.grid-card').first().click(); await p.waitForTimeout(800)
await p.getByText('레시피 꾸미기').first().click(); await p.waitForTimeout(1300)
// 🎁 출시기념 팩 안내 — 유저와 같은 순서로 먼저 닫는다(안 닫으면 아래 탭 클릭이 마스크에 먹힌다)
await p.getByRole('button', { name: '나중에' }).first().click({ timeout: 2500 }).catch(() => {})
await p.waitForTimeout(500)

const 재기 = async (탭) => {
  await p.getByText(탭, { exact: true }).first().click({ timeout: 3000 }).catch(() => {})
  await p.waitForTimeout(700)
  return await p.evaluate(() => {
    const secs = [...document.querySelectorAll('.decor-sec')]
    const 줄 = secs.map((s) => {
      const g = s.querySelector('.decor-grid'); if (!g) return null
      const c = g.querySelector('.decor-cell')
      const r = c?.getBoundingClientRect()
      return {
        라벨: s.querySelector('.decor-sec-label')?.textContent.trim() || '(라벨 없음)',
        큰칸: g.classList.contains('wordy'),
        칸: r ? `${Math.round(r.width)}×${Math.round(r.height)}` : '?',
        한줄: getComputedStyle(g).gridTemplateColumns.split(' ').length,
      }
    }).filter(Boolean)
    return 줄.slice(0, 8)
  })
}

console.log('🔠 글자 탭')
for (const r of await 재기('글자')) console.log(`   ${r.큰칸 ? '⭐' : '  '} ${r.라벨.padEnd(16)} 칸 ${r.칸} · 한 줄 ${r.한줄}칸`)
// ⛔ 첫 캡처엔 「한끼 문구」가 «화면 아래»라 안 잡혔다 — 검수판인데 정작 볼 것이 없었다(규칙 21).
// ⛔⛔ 그리고 「한끼 문구」 하나만 찍은 것도 모자랐다 — 창업자 2026-08-12
//    *"저 글자말고 더 아래로 내리면 건강태그 반응평가 이런거 있잖아. 걔가 너무 안보여"*
//    ⭐ 맞다. 한끼 문구는 «말풍선에 큰 글자»라 유리하고, `rs_` 는 **그림 ＋ 아래 작은 캡션**이라
//       같은 88px 에서도 훨씬 불리하다. **제일 불리한 것으로 판정해야 한다.**
const 찍기 = async (라벨조각, 파일) => {
  const 됐나 = await p.evaluate((조각) => {
    const el = [...document.querySelectorAll('.decor-sec-label')].find((x) => x.textContent.includes(조각))
    if (!el) return false
    el.scrollIntoView({ block: 'start' }); return true
  }, 라벨조각)
  if (!됐나) { console.log(`   ⛔ 「${라벨조각}」 그룹을 못 찾음`); return }
  await p.waitForTimeout(600)
  await p.screenshot({ path: `docs/_shot/${파일}` })
  console.log(`   📸 ${라벨조각} → ${파일}`)
}
await 찍기('한끼 문구', '글자탭-큰칸-0812.png')
await 찍기('반응 평가', '글자탭-반응평가-0812.png')
await 찍기('건강 태그', '글자탭-건강태그-0812.png')
await 찍기('보관', '글자탭-보관-0812.png')

console.log('\n🎨 데코 탭 (⛔안 바뀌어야 한다 — 창업자가 이미 OK 한 크기)')
for (const r of await 재기('데코')) console.log(`   ${r.큰칸 ? '⭐' : '  '} ${r.라벨.padEnd(16)} 칸 ${r.칸} · 한 줄 ${r.한줄}칸`)
await p.screenshot({ path: 'docs/_shot/데코탭-그대로-0812.png' })

console.log('\n📸 docs/_shot/글자탭-큰칸-0812.png · 데코탭-그대로-0812.png')
await b.close(); srv.kill(); process.exit(0)
