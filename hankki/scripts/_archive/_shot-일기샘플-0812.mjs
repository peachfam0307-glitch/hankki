// 🖼 「한끼 일기」 지금 모습 — 샘플이 왜 필요한지부터 실물로 본다 (2026-08-12)
//
// 📮 창업자 *"주간레시피랑 일기샘플중에 간단한거부터 하자"* → 일기 샘플이 간단하다(한 장 vs 36편).
// ⛔ 그런데 저장소에 「일기 샘플」 결정이 **하나도 없다**(`decided.mjs` 0줄).
//    그래서 **뭘 만들지 정하기 전에 「지금 뭐가 비어 있나」를 본다.**
//
// 🎯 찍는 것 넷
//    ① 일기 탭 — 아무것도 안 쓴 «새 폰» 상태
//    ② 일기 탭 — 기록이 몇 개 쌓인 상태
//    ③ 일기 꾸미기 — 속지 고르기
//    ④ 일기 꾸미기 — 「기록」 탭(오늘 v10.41 로 99컷이 들어온 자리)
//
// ⛔ 「예쁜가」는 창업자 몫(규칙 11). 나는 **뭐가 비어 있나**만 본다.
// ⚠️ `.sheet-mask`(출시기념 팩 안내)가 클릭을 가로챈다 — 「나중에」를 먼저 누른다(CLAUDE.md 함정, 네 번째).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4381, r))

const br = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const 열기 = async (일기몇개) => {
  const ctx = await br.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul' })
  // ⭐ 온보딩·코치를 끈다 — 안 끄면 화면을 덮어 «비어 있다»를 잘못 본다(2026-08-11 사고)
  await ctx.addInitScript((n) => {
    localStorage.setItem('hankki:onboarded', '1')
    for (const k of ['home3', 'detail', 'shop', 'profile', 'myrecipes', 'brag', 'diary'])
      localStorage.setItem(`hankki:coach:${k}`, '1')
    localStorage.setItem('hankki:giftSheetSeen', '1')
    if (n > 0) {
      const 오늘 = new Date()
      const 일기 = []
      for (let i = 0; i < n; i += 1) {
        const d = new Date(오늘); d.setDate(d.getDate() - i * 2)
        일기.push({ id: `seed-${i}`, date: d.toISOString().slice(0, 10), title: ['닭곰탕', '오이물김치', '깻잎장아찌', '콩국수', '제육볶음'][i % 5], text: '' })
      }
      localStorage.setItem('hankki:diary', JSON.stringify(일기))
    }
  }, 일기몇개)
  const pg = await ctx.newPage()
  pg.on('pageerror', (e) => console.log('  ⛔ pageerror:', String(e).slice(0, 90)))
  await pg.goto('http://127.0.0.1:4381/', { waitUntil: 'networkidle' })
  return { ctx, pg }
}
const 시트닫기 = async (pg) => {
  for (const t of ['나중에', '닫기']) {
    const b = pg.getByRole('button', { name: t }).first()
    if (await b.count() && await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); await pg.waitForTimeout(250) }
  }
}
const 일기탭 = async (pg) => {
  await pg.getByRole('button', { name: /일기/ }).last().click()
  await pg.waitForTimeout(700)
  await 시트닫기(pg)
}

// ① 새 폰 — 아무것도 안 쓴 상태
{
  const { ctx, pg } = await 열기(0)
  await 일기탭(pg)
  await pg.screenshot({ path: `${OUT}/diary-1-empty.png` })
  const t = (await pg.locator('.screen').last().innerText().catch(() => '')).replace(/\n+/g, ' / ').slice(0, 180)
  console.log('① 새 폰 일기 탭 :', t || '(글자 없음)')
  await ctx.close()
}

// ② 기록이 쌓인 상태
{
  const { ctx, pg } = await 열기(5)
  await 일기탭(pg)
  await pg.screenshot({ path: `${OUT}/diary-2-some.png` })
  console.log('② 기록 5개 :', (await pg.locator('.screen').last().innerText().catch(() => '')).replace(/\n+/g, ' / ').slice(0, 180))

  // ③④ 꾸미기 — 오늘 일기 쓰기 → 속지 → 꾸미기
  const 쓰기 = pg.getByRole('button', { name: /오늘 일기|일기 쓰기|오늘의 한끼/ }).first()
  if (await 쓰기.count()) {
    await 쓰기.click(); await pg.waitForTimeout(700); await 시트닫기(pg)
    await pg.screenshot({ path: `${OUT}/diary-3-write.png` })
    console.log('③ 일기 쓰기 화면 찍음')
    const 꾸 = pg.getByRole('button', { name: /꾸미기/ }).first()
    if (await 꾸.count()) {
      await 꾸.click(); await pg.waitForTimeout(900); await 시트닫기(pg)
      await pg.screenshot({ path: `${OUT}/diary-4-decor.png` })
      const 탭들 = await pg.locator('.decor-drawer button').allInnerTexts().catch(() => [])
      console.log('④ 꾸미기 서랍 탭 :', 탭들.filter((s) => s.trim()).slice(0, 12).join(' · '))
    } else console.log('⚠️ 꾸미기 버튼 못 찾음')
  } else console.log('⚠️ 일기 쓰기 버튼 못 찾음 — 화면 글자:', (await pg.locator('.screen').last().innerText().catch(() => '')).slice(0, 120))
  await ctx.close()
}

await br.close(); srv.close(); console.log(`\n🖼 ${OUT}/diary-*.png`); process.exit(0)
