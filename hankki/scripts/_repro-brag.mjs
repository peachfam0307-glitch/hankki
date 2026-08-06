// 🐛 재현 — 「자랑카드 먹통」 (창업자 제보 2026-08-03 · 8/4 재발)
//   *"증상이 내가꾸민건 다운로드, 랜덤카드는 먹통이야"*
//
// ⭐ 재는 것 = **미리 캡처가 몇 초 걸리나**. 그게 안 끝난 채 누르면 12초 로딩 = 「먹통」이다.
//   폰 흉내 → CPU 를 느리게(throttle) 돌리고 `navigator.share` 를 심는다.
//   ⛔ 데스크톱 크롬엔 Web Share 가 없어 그냥 두면 «저장»만 나온다 — 폰과 갈림길이 달라진다.
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다 (2026-08-06)
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const THROTTLE = Number(process.env.THROTTLE || 4)   // 1=데스크톱 · 4=중급폰 · 6=저가폰
const WAIT = Number(process.env.WAIT || 500)          // 카드 뜬 뒤 공유를 누르기까지 기다린 ms
mkdirSync(OUT, { recursive: true })

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const kong = basicRecipes.find((r) => r.title === '콩국수')
const now = Date.now()
// 레꾸자랑 목록엔 `status:'sorted'` 인 것만 나온다
const state = {
  recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })),
  seedV: BASICS_VERSION,
}

const PORT = Number(process.env.PORT || 4319)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
const stop = () => { try { srv.kill() } catch { /* noop */ } }
process.on('exit', stop)
await new Promise((r) => setTimeout(r, 900))

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e)))

// 폰 흉내 ① CPU 느리게
const cdp = await ctx.newCDPSession(page)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE })

// 폰 흉내 ② Web Share 심기 — 「사용자가 누른 직후」가 아니면 거절하도록(user activation 흉내)
await page.addInitScript(() => {
  window.__log = []
  let lastTap = 0
  addEventListener('pointerdown', () => { lastTap = performance.now() }, true)
  navigator.canShare = (d) => { window.__log.push(`canShare(files=${d?.files?.length ?? 0})`); return true }
  navigator.share = (d) => {
    const age = Math.round(performance.now() - lastTap)
    window.__log.push(`share(files=${d?.files?.length ?? 0}) · 누른 지 ${age}ms`)
    // 폰은 누른 직후에만 허용한다. 늦으면 통째로 거절.
    if (age > 1500) { window.__log.push(`⛔ NotAllowedError (user activation 만료)`); return Promise.reject(Object.assign(new Error('not allowed'), { name: 'NotAllowedError' })) }
    window.__log.push(`✅ 공유창 열림`)
    return Promise.resolve()
  }
  // 다운로드(저장) 감지 — <a download>.click()
  const oc = HTMLAnchorElement.prototype.click
  HTMLAnchorElement.prototype.click = function () {
    if (this.download) window.__log.push(`💾 다운로드: ${this.download}`)
    return oc.apply(this, arguments)
  }
  // 🖼 캡처가 «언제» 끝나는지 — toFile 안의 `fetch(dataURL)` 이 캡처 완료 신호다
  window.__t0 = 0
  const of = window.fetch
  window.fetch = function (u, ...a) {
    if (typeof u === 'string' && u.startsWith('data:image/')) {
      const ms = window.__t0 ? Math.round(performance.now() - window.__t0) : -1
      window.__log.push(`🖼 캡처 1장 끝 — 카드 뜬 지 ${ms}ms · ${Math.round(u.length / 1024)}KB`)
      ;(window.__imgs = window.__imgs || []).push(u)
    }
    return of.call(this, u, ...a)
  }
})

const url = `http://127.0.0.1:${PORT}/`
await page.goto(url)
await page.evaluate((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1')
  for (const k of ['hankki:coach:home2', 'hankki:coach:my', 'hankki:coach:search', 'hankki:coach:shop', 'hankki:coach:brag']) localStorage.setItem(k, '1')
}, state)
await page.goto(url)
await page.waitForTimeout(Number(process.env.WARM || 2000))   // 앱을 켜고 레꾸자랑까지 가기 전 시간(글꼴 데우기가 도는 구간)

console.log(`\n⚙️  CPU ${THROTTLE}배 느리게 · 카드 뜬 뒤 ${WAIT}ms 만에 공유 누름\n`)

// ── 레꾸자랑 탭 ──
await page.getByText('레꾸자랑', { exact: true }).last().click()
await page.waitForTimeout(1200)
const cards = await page.locator('.grid-card').count()
console.log(`📱 레꾸자랑 목록 — 카드 ${cards}개`)
if (!cards) { console.log('⛔ 목록이 비었다'); await browser.close(); stop(); process.exit(1) }

// 첫 레시피 → 선택 시트
await page.locator('.grid-card button').first().click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/brag-sheet.png` })

// 「랜덤 카드로 뽑기」
const t0 = Date.now()
await page.getByText('랜덤 카드로 뽑기').click()
await page.evaluate(() => { window.__t0 = performance.now() })
await page.waitForTimeout(WAIT)
await page.screenshot({ path: `${OUT}/brag-card.png` })
console.log(`🎴 랜덤 카드 모달 — ${Date.now() - t0}ms 만에 떴다`)

// 「공유하기」
const shareBtn = page.getByText('공유하기')
if (!(await shareBtn.count())) { console.log('⛔ 공유 버튼이 없다'); }
else {
  const t1 = Date.now()
  await shareBtn.click()
  // 로딩 오버레이가 뜨나 = 미리 캡처가 «안 끝났다»는 뜻
  await page.waitForTimeout(300)
  const spinning = await page.getByText('예쁜 카드 만드는 중…').count()
  // 📮 「지금 보내기」가 뜨면 눌러본다 — 이게 뜨는 것 자체가 «허가 만료»를 잡았다는 뜻이다
  for (let k = 0; k < 80; k++) {
    if (await page.getByText('지금 보내기').count()) {
      console.log('   📮 「지금 보내기」 버튼이 떴다 — 누른다')
      await page.getByText('지금 보내기').click()
      break
    }
    if ((await page.evaluate(() => (window.__log || []).some((l) => l.startsWith('✅') || l.startsWith('💾')))) ) break
    await page.waitForTimeout(500)
  }
  console.log(spinning ? `⏳ 로딩이 떴다 → 미리 캡처가 «아직 안 끝남»` : `⚡ 로딩 없음 → 미리 캡처가 «이미 끝나 있었다»`)
  // 결말까지 기다린다(최대 40초) — 화면 문구가 바뀌는 순간을 놓치지 않게 0.5초마다 본다
  let last = ''
  for (let i = 0; i < 80; i++) {
    await page.waitForTimeout(500)
    const now2 = await page.evaluate(() => {
      const sp = [...document.querySelectorAll('div')].find((d) => d.textContent === '예쁜 카드 만드는 중…')
      if (!sp) return ''
      return sp.parentElement ? [...sp.parentElement.children].map((c) => c.textContent).filter(Boolean).join(' | ') : '(로딩)'
    })
    if (now2 !== last) { console.log(`   ⏱ ${Math.round((Date.now() - t1) / 100) / 10}초 — ${now2 || '(로딩 사라짐)'}`); last = now2 }
    const log = await page.evaluate(() => window.__log)
    if (log.some((l) => l.startsWith('✅') || l.startsWith('💾') || l.startsWith('⛔'))) break
  }
  console.log(`⌛ 누른 뒤 ${Math.round((Date.now() - t1) / 100) / 10}초`)
  await page.screenshot({ path: `${OUT}/brag-after.png` })
}

const log = await page.evaluate(() => window.__log)
console.log(`\n📜 무슨 일이 있었나`)
if (!log.length) console.log('   ⛔⛔ 아무 일도 안 일어났다 — 이게 「먹통」이다')
for (const l of log) console.log(`   ${l}`)
const toast = await page.evaluate(() => {
  const t = [...document.querySelectorAll('div')].map((d) => d.textContent).filter((x) => x && x.length < 40 && /저장|안 돼|오래|잠시/.test(x))
  return [...new Set(t)].slice(0, 3)
})
if (toast.length) console.log(`\n💬 화면 문구: ${toast.join(' / ')}`)
if (errs.length) console.log(`\n⛔ 런타임 오류: ${errs.slice(0, 3).join(' / ')}`)
console.log(`\n📂 캡처 → ${OUT}/brag-sheet.png · brag-card.png · brag-after.png`)
// 🖼 뽑힌 카드를 실제 파일로 남긴다 — 화질을 «눈으로» 확인하려고
const imgs = await page.evaluate(() => window.__imgs || [])
for (let i = 0; i < imgs.length; i++) {
  const [, b64] = imgs[i].split(',')
  const ext = imgs[i].startsWith('data:image/jpeg') ? 'jpg' : 'png'
  const f = `${OUT}/card-out-${i + 1}.${ext}`
  writeFileSync(f, Buffer.from(b64, 'base64'))
  console.log(`   💾 ${f}`)
}

await browser.close()
stop()
