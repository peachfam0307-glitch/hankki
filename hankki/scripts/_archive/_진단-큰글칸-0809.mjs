// ⌨️ 큰 글칸 — 창업자 확정 2026-08-09 (*"큰 글칸으로 바꾸기"*)
//    재는 것 = ⑴종이 글칸에 커서가 가면 서랍·도구바가 접히나 ⑵종이가 넓어지나
//              ⑶자판이 뜬 것처럼 판이 160px 이 돼도 쓸 만한가 ⑷「다 썼어요」로 원래대로 돌아오나
//    ⛔ ⑷가 핵심이다 — 안드로이드는 뒤로가기로 «자판만» 닫혀 blur 가 안 온다(v9.99).
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(4397, r))
const { BASICS_VERSION } = await import(R + 'src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수'

const 잰다 = () => {
  const ed = document.querySelector('.decor-editor')
  const st = document.querySelector('.decor-stage')
  const w = st && st.querySelector(':scope > div:not(.t-sub)')
  const r = w ? w.getBoundingClientRect() : null
  const 보임 = (s) => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return q.width > 1 && q.height > 1 }
  return {
    큰글칸: !!(ed && ed.classList.contains('bigwrite')),
    종이: r ? `${Math.round(r.width)}×${Math.round(r.height)}` : null,
    서랍보임: 보임('.decor-drawer'),
    도구바보임: 보임('.decor-tools'),
    다썼어요보임: 보임('.decor-donewrite'),
    가로넘침: Math.max(0, Math.round(document.documentElement.scrollWidth - window.innerWidth)),
  }
}

const page = await b.newPage({ viewport: { width: 891, height: 411 }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', deviceScaleFactor: 2 })
await page.addInitScript((s) => {
  const d = new Date(); d.setHours(12, 0, 0, 0); s.diary.forEach((x) => { x.at = d.getTime() })
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
  const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
}, { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION })
await page.goto('http://127.0.0.1:4397/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(900)
await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1100)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)
console.log('① 열자마자         ', JSON.stringify(await page.evaluate(잰다)))

// ✍️ 종이 글칸에 커서를 넣는다
const 글칸 = page.locator('.decor-stage textarea').first()
await 글칸.click({ force: true }); await page.waitForTimeout(700)
console.log('② 글칸에 커서       ', JSON.stringify(await page.evaluate(잰다)))
await page.screenshot({ path: `${OUT}/큰글칸-자판전.png` })

// ⌨️ 자판이 올라온 셈 (창업자 폰 실측: 411 → 160)
await page.setViewportSize({ width: 891, height: 160 }); await page.waitForTimeout(600)
console.log('③ 자판 뜸(160px)   ', JSON.stringify(await page.evaluate(잰다)))
await page.screenshot({ path: `${OUT}/큰글칸-자판뜸.png` })

// 🚪 「다 썼어요」로 나온다 (자판 내린 셈)
await page.setViewportSize({ width: 891, height: 411 }); await page.waitForTimeout(400)
await page.getByRole('button', { name: '다 썼어요' }).click(); await page.waitForTimeout(700)
console.log('④ 다 썼어요 누름   ', JSON.stringify(await page.evaluate(잰다)))
await page.screenshot({ path: `${OUT}/큰글칸-나온뒤.png` })
await b.close(); srv.close()
