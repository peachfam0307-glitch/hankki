// 📸 한끼상점 — 설정 카드 Ⓒ · 가져오기 「더 받기」 Ⓑ · 시트(로그인 전 · 웹) 를 «띄워서» 찍는다 (2026-10-22 · 절대원칙 21)
// ⭐ 판매 스위치(`?상점=1`)를 켠 기기처럼 연다. 구글 결제(getDigitalGoodsService)는 가짜를 심는다.
// ⛔ 「살 수 있음」 상태는 여기서 못 찍는다 — 진짜 로그인 토큰이 있어야 서버가 「켜짐」이라 답한다.
//    그 화면은 라이선스 테스터 실구매 때 창업자 폰에서 본다.
// 쓰는 법: SMOKE_CHROMIUM=… node scripts/_shot-한끼상점-1022.mjs <dist 경로> <내보낼 폴더>
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, extname } from 'node:path'
import { COACH } from '../src/coach.js'
const dist = process.argv[2] || '/home/user/hankki/hankki/dist'
const 밖 = process.argv[3] || '/tmp/claude-0/상점판'
mkdirSync(밖, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const srv = createServer((req, res) => {
  let p = join(dist, decodeURIComponent(req.url.split('?')[0]).replace(/^\/hankki/, ''))
  if (!existsSync(p) || p.endsWith('/')) p = join(dist, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' })
  res.end(readFileSync(p))
}).listen(0)
const port = srv.address().port
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

async function 판 (이름, { 결제 = true, 열쇠 = { welcome: 0, month: 0, paid: 0 } } = {}) {
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3 })
  const p = await ctx.newPage()
  await p.route('**/hankki-ocr.annyeong-hankki.workers.dev/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, left: { ...열쇠, cap: 30, signed: false } }) }))
  await p.addInitScript(([결제, 열쇠, 코치]) => {
    try {
      localStorage.setItem('hankki:onboarded', '1')
      localStorage.setItem('hankki:ocrLeft', JSON.stringify({ ...열쇠, cap: 30, signed: false }))
      for (const k of 코치) localStorage.setItem(k, '1')
      localStorage.setItem('hankki:news:off', '1')
      sessionStorage.setItem('hankki:tab', 'profile')
    } catch {}
    if (결제) window.getDigitalGoodsService = async () => ({ getDetails: async () => [{ itemId: 'ocr_pack_20', title: '레시피열쇠 20개', price: { currency: 'KRW', value: '1000' } }], listPurchases: async () => [] })
  }, [결제, 열쇠, Object.values(COACH)])
  await p.goto(`http://localhost:${port}/hankki/?상점=1`)
  await p.waitForTimeout(2500)
  return { p, ctx }
}

// ① 설정 카드 Ⓒ ＋ 시트(로그인 전)
{
  const { p, ctx } = await 판('설정')
  const 카드 = p.locator('button:has-text("한끼상점")').first()
  await 카드.scrollIntoViewIfNeeded()
  await p.screenshot({ path: `${밖}/1-설정카드.png` })
  await 카드.click(); await p.waitForTimeout(1500)
  await p.screenshot({ path: `${밖}/2-시트-로그인전.png` })
  await ctx.close()
}
// ② 웹(구글 결제 없음) — 「구글 플레이 앱에서만」
{
  const { p, ctx } = await 판('웹', { 결제: false })
  await p.locator('button:has-text("한끼상점")').first().click(); await p.waitForTimeout(1500)
  await p.screenshot({ path: `${밖}/3-시트-웹.png` })
  await ctx.close()
}
console.log('📸 ' + 밖)
await b.close(); srv.close()
