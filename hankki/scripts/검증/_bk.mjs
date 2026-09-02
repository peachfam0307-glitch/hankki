// 레꾸자랑 뒤로가기 재현 — 각 단계에서 '보이는 버튼'과 활성 탭을 찍어 실제 흐름을 확인
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const BASE = 'http://127.0.0.1:4197/'
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4197', '--strictPort'], { stdio: 'ignore' })
for (let i = 0; i < 90; i++) { try { const r = await fetch(BASE); if (r.status < 500) break } catch { /* 대기 */ } await new Promise((r) => setTimeout(r, 400)) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 430, height: 940 }, deviceScaleFactor: 1 })
await ctx.addInitScript(() => {
  ;['hankki:onboarded', 'hankki:coach:home2', 'hankki:coach:detail', 'hankki:coach:decor',
    'hankki:coach:myrecipes', 'hankki:coach:editor', 'hankki:coach:shop', 'hankki:coach:brag',
    'hankki:coach:profile'].forEach((x) => { try { localStorage.setItem(x, '1') } catch { /* noop */ } })
})
const p = await ctx.newPage()
await p.goto(BASE, { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(2200)

const state = () => p.evaluate(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
  const nav = [...document.querySelectorAll('button')].filter((x) => vis(x))
  const on = nav.find((x) => x.getAttribute('aria-current') === 'page' || /\bon\b|active/.test(x.className))
  return {
    tab: (on?.innerText || '?').trim().split('\n')[0],
    len: history.length,
    sheet: !!document.querySelector('.sheet-mask'),
    btns: nav.map((x) => x.innerText.trim().split('\n')[0]).filter(Boolean).slice(-9).join(' | '),
  }
})
const log = async (m) => { const s = await state(); console.log(`${m}\n    탭=${s.tab} · 시트=${s.sheet} · history=${s.len}\n    버튼: ${s.btns}`) }

await log('① 시작')
await p.getByRole('button', { name: '레꾸자랑' }).last().click(); await p.waitForTimeout(900)
await log('② 레꾸자랑 탭')
await p.locator('[data-coach="brag-list"] button').first().click(); await p.waitForTimeout(800)
await log('③ 레시피 탭 → 선택 시트')
await p.getByRole('button', { name: /랜덤 카드로 뽑기/ }).click(); await p.waitForTimeout(3200)
await log('④ 카드 모달')
await p.goBack(); await p.waitForTimeout(900)
await log('⑤ 뒤로가기 1')
await p.goBack(); await p.waitForTimeout(900)
await log('⑥ 뒤로가기 2  ← 여기서 홈으로 가면 그게 문제')
await p.goBack(); await p.waitForTimeout(900)
await log('⑦ 뒤로가기 3')
await b.close(); srv.kill()
