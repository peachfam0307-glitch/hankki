// 🔎 창업자 제보 2026-08-09 밤 — *"일기저장하면 제목도 보임(제목입력안하면)"*
//    ⭐ 「제목」은 빈 칸 안내(placeholder)다. **어느 화면에 남는지**를 찾는다 — 쓰는 칸이면 정상, 그 밖이면 버그.
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise(r => srv.listen(4419, r))
const { BASICS_VERSION } = await import(R + 'src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 411, height: 891 }, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
page.on('pageerror', e => console.log('   ⛔ pageerror', e.message))
await page.addInitScript((s) => {
  const d = new Date(); d.setHours(12, 0, 0, 0); s.diary.forEach(x => { x.at = d.getTime() })
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
  const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
}, { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION })

// 「제목」이라는 글자가 화면 어디에 있나 — 안내(placeholder)인지 진짜 글자인지 갈라서 찍는다
const 찾는다 = () => {
  const 결과 = []
  document.querySelectorAll('input, textarea').forEach((el) => {
    if ((el.placeholder || '').includes('제목')) {
      const r = el.getBoundingClientRect()
      // ⭐ 「보이나」는 자리만이 아니라 **글자 색이 투명인지**까지 본다 — 커서가 없을 땐 안 보여야 한다.
      const c = getComputedStyle(el, '::placeholder').color
      const 투명 = /rgba?\([^)]*,\s*0\s*\)/.test(c)
      결과.push({ 어디: '빈 칸 안내(placeholder)', 값: el.value || '(비었다)', 자리있나: r.width > 0 && r.height > 0, 글자보이나: !투명, 색: c })
    }
  })
  const 걷기 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let n
  while ((n = 걷기.nextNode())) {
    if ((n.nodeValue || '').trim() === '제목') {
      const el = n.parentElement, r = el.getBoundingClientRect()
      결과.push({ 어디: '그려진 글자', 클래스: (el.className || '') + '', 보이나: r.width > 0 && r.height > 0 })
    }
  }
  return 결과
}

await page.goto('http://127.0.0.1:4419/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(900)
await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(600)
console.log('▣ 일기 탭 (목록)', JSON.stringify(await page.evaluate(찾는다)))
await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1100)
console.log('▣ 일기 쓰는 화면', JSON.stringify(await page.evaluate(찾는다)))

// 속지를 고르고 글을 조금 쓴 뒤 저장 — 제목은 «안» 쓴다(창업자 조건)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)
await page.locator('.seg', { hasText: /속지/ }).first().click(); await page.waitForTimeout(600)
const 한끼 = page.locator('.decor-drawer button').filter({ hasText: /오늘의 한끼/ })
if (await 한끼.count()) { await 한끼.first().click(); await page.waitForTimeout(900) }
console.log('▣ 꾸미기 판 (속지 고른 뒤)', JSON.stringify(await page.evaluate(찾는다)))
await page.getByRole('button', { name: '저장' }).first().click(); await page.waitForTimeout(1200)
console.log('▣ 저장하고 나온 일기 화면', JSON.stringify(await page.evaluate(찾는다)))

// ⭐ 「누르면 다시 보이나」 — 안 보이기만 하면 칸이 있는 줄 모른다. 커서가 가면 떠야 한다.
await page.evaluate(() => { const t = document.querySelector('.paper input[aria-label="제목"]'); if (t) t.focus() })
await page.waitForTimeout(400)
console.log('▣ 제목 칸을 누른 뒤', JSON.stringify(await page.evaluate(찾는다)))

// 목록·홈으로 나가서도 남나
await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(800)
console.log('▣ 일기 탭으로 돌아옴', JSON.stringify(await page.evaluate(찾는다)))
await page.getByText('홈', { exact: true }).last().click().catch(() => {}); await page.waitForTimeout(800)
console.log('▣ 홈', JSON.stringify(await page.evaluate(찾는다)))

await b.close(); srv.close()
