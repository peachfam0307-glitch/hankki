// 📸 계정 삭제 페이지를 «내 눈으로» 본다 (규칙 21) ＋ 요건 넷을 잰다
import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, statSync } from 'node:fs'
import { extname, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const srv = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.startsWith('/hankki/')) p = p.slice(7)
  const f = join(ROOT, p === '/' ? 'index.html' : p)
  try { statSync(f); s.writeHead(200, { 'Content-Type': M[extname(f)] || 'application/octet-stream' }); s.end(readFileSync(f)) } catch { s.writeHead(404); s.end('x') } })
await new Promise((r) => srv.listen(4596, r))
const b = await chromium.launch()
let ok = 0, bad = 0
const eq = (m, v) => { v ? (ok++, console.log('  ✅ ' + m)) : (bad++, console.log('  ⛔ ' + m)) }

for (const [이름, dark] of [['밝은 화면', false], ['어두운 화면', true]]) {
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, colorScheme: dark ? 'dark' : 'light' })
  const pg = await ctx.newPage(); const errs = []
  pg.on('pageerror', (e) => errs.push(String(e)))
  // 앱을 쓰던 사람 흉내 — 기기 번호가 있는 상태
  await pg.addInitScript(() => { try { localStorage.setItem('hankki:did', 'test-did-0000-1111-2222') } catch (e) {} })
  const r = await pg.goto('http://localhost:4596/hankki/delete-account.html', { waitUntil: 'networkidle' })
  await pg.waitForTimeout(400)
  await pg.screenshot({ path: `/tmp/del-${dark ? 'dark' : 'light'}.png`, fullPage: true })
  if (!dark) {
    const t = await pg.textContent('body')
    console.log('\n📋 Play 요건 넷')
    eq('① 오류 없이 열린다 (200 · pageerror 0)', r.status() === 200 && errs.length === 0)
    eq('② 삭제 요청 경로가 «눈에 띈다» (첫 화면 안에 메일 단추)', await pg.locator('.mail').first().isVisible())
    eq('③ 앱 이름을 참조한다 («한끼» ＋ «HANKKI»)', t.includes('한끼') && t.includes('HANKKI'))
    eq('④ 무엇이 지워지나 적혀 있다', t.includes('삭제되는 데이터'))
    console.log('\n📋 ＋ 보관 관행 고지 (공식 요구)')
    for (const k of ['40일', '1년', '2분', '저장하지 않습니다'])
      eq(`「${k}」 가 적혀 있다`, t.includes(k))
    console.log('\n📋 기기 번호 도우미')
    eq('내 기기 번호를 화면에 보여준다', (await pg.textContent('#didBox')).includes('test-did-0000'))
    eq('복사 단추가 있다', await pg.locator('button.copy').isVisible())
    // 밖으로 아무것도 안 나가나
    const 밖 = []
    await pg.route('**', (rt) => { const u = rt.request().url(); if (!u.startsWith('http://localhost:4596')) { 밖.push(u); return rt.abort() } rt.continue() })
    await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForTimeout(300)
    eq('⛔ 밖으로 아무것도 안 보낸다', 밖.length === 0)
    // 앱을 지운 사람
    const ctx2 = await b.newContext({ viewport: { width: 412, height: 915 } })
    const p2 = await ctx2.newPage()
    await p2.goto('http://localhost:4596/hankki/delete-account.html', { waitUntil: 'domcontentloaded' })
    await p2.waitForTimeout(300)
    eq('앱을 이미 지운 사람에게도 길을 알려준다', (await p2.textContent('#didBox')).includes('식별자 없이'))
    await ctx2.close()
  }
  console.log(`  ${errs.length ? '⛔' : '✅'} ${이름} — 오류 ${errs.length || '없음'}`)
  errs.length ? bad++ : ok++
  await ctx.close()
}
await b.close(); srv.close()
console.log(`\n  ── ${ok}칸 통과 · ${bad}칸 어긋남 ──`)
if (bad) process.exit(1)
