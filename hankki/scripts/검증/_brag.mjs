// 레꾸자랑 공유 시 "기다려달라"는 안내가 실제로 보이나 — 두 경로 각각 재현
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const BASE = 'http://127.0.0.1:4205/'
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4205', '--strictPort'], { stdio: 'ignore' })
for (let i = 0; i < 90; i++) { try { const r = await fetch(BASE); if (r.status < 500) break } catch { /* 대기 */ } await new Promise((r) => setTimeout(r, 400)) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const errs = []
const open = async () => {
  const ctx = await b.newContext({ viewport: { width: 430, height: 940 }, deviceScaleFactor: 1 })
  await ctx.addInitScript(() => {
    ;['hankki:onboarded', 'hankki:coach:home2', 'hankki:coach:brag', 'hankki:coach:detail']
      .forEach((k) => { try { localStorage.setItem(k, '1') } catch { /* noop */ } })
    // navigator.share 를 '오래 걸리는' 스텁으로 — 실제 폰처럼 공유창이 뜨는 동안을 흉내낸다
    window.__shared = 0
    navigator.share = async () => { window.__shared++; await new Promise((r) => setTimeout(r, 1500)) }
    navigator.canShare = () => true
  })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e)))
  p.on('console', (m) => { if (m.type() === 'error' || /실패|fail|error/i.test(m.text())) errs.push('CONSOLE ' + m.text().slice(0, 140)) })
  p.on('download', () => errs.push('DOWNLOAD 폴백이 돌았다'))
  await p.goto(BASE, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(1800)
  return p
}
// 캡처가 도는 동안 화면에 '기다려달라'는 신호가 보이는지 짧은 간격으로 살핀다
const watch = async (p, ms = 4000) => {
  const seen = { overlay: false, spin: false, btnText: false, wait2: false }
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    const s = await p.evaluate(() => {
      const txt = document.body.innerText
      return {
        spin: !!document.querySelector('.ocr-spin'),
        making: txt.includes('만드는 중'),
        wait: txt.includes('준비 중') || txt.includes('그리고 있어요') || txt.includes('저장하는 중'),
        wait2: txt.includes('잠깐만 기다려'),
      }
    }).catch(() => null)
    if (s) {
      if (s.spin) seen.spin = true
      if (s.making) seen.btnText = true
      if (s.wait) seen.overlay = true
      if (s.wait2) seen.wait2 = true
    }
    await p.waitForTimeout(120)
  }
  return seen
}

console.log('── ① 랜덤 카드로 뽑기 → 공유하기 ──')
let p = await open()
await p.getByRole('button', { name: '레꾸자랑' }).last().click(); await p.waitForTimeout(900)
await p.locator('[data-coach="brag-list"] button').first().click(); await p.waitForTimeout(800)
await p.getByRole('button', { name: /랜덤 카드로 뽑기/ }).click(); await p.waitForTimeout(3000)
const shareBtn = p.getByRole('button', { name: /공유하기/ }).first()
console.log(`  '공유하기' 보임 = ${await shareBtn.isVisible().catch(() => false)}`)
const w1 = shareBtn.click().catch(() => {})
const s1 = await watch(p, 12000)
await w1
console.log(`  전체 로딩 오버레이(.ocr-spin) = ${s1.spin}`)
console.log(`  "준비 중" 안내 문구        = ${s1.overlay}`)
console.log(`  버튼 글자 "만드는 중…"     = ${s1.btnText}`)
console.log(`  "잠깐만 기다려" 안내       = ${s1.wait2}`)
console.log(`  실제 공유 호출 = ${await p.evaluate(() => window.__shared)}회`)
await p.context().close()

console.log('\n── ② 내가 꾸민 표지 그대로 → 공유 ──')
p = await open()
// 첫 레시피를 '꾸민' 상태로 만든다(배경만 넣어도 isDecorated 참)
await p.evaluate(() => {
  const S = 'hankki:v1'
  const d = JSON.parse(localStorage.getItem(S) || '{}')
  if (d.recipes && d.recipes[0]) { d.recipes[0].decorBg = 'dot'; d.recipes[0].decor = [{ id: 'x', type: 'sticker', key: 'gp_gomhi', x: 0.5, y: 0.5, s: 0.3, r: 0 }] }
  localStorage.setItem(S, JSON.stringify(d))
})
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1600)
await p.getByRole('button', { name: '레꾸자랑' }).last().click(); await p.waitForTimeout(900)
await p.locator('[data-coach="brag-list"] button').first().click(); await p.waitForTimeout(800)
const coverBtn = p.getByRole('button', { name: /내가 꾸민 표지/ }).first()
console.log(`  '내가 꾸민 표지' 보임 = ${await coverBtn.isVisible().catch(() => false)}`)
const w2 = coverBtn.click().catch(() => {})
const s2 = await watch(p, 12000)
await w2
console.log(`  전체 로딩 오버레이(.ocr-spin) = ${s2.spin}`)
console.log(`  "준비 중" 안내 문구        = ${s2.overlay}`)
console.log(`  실제 공유 호출 = ${await p.evaluate(() => window.__shared)}회`)
await p.context().close()

console.log(`\npageerror = ${errs.length}`, errs.slice(0, 3))
await b.close(); srv.kill()
