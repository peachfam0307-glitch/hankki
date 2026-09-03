// 🔍🖼 **「공유용 숨은 캡처 레이어가 창고(IndexedDB) 그림을 꺼내나」 확인판** (2026-09-03)
//
// 📮 창업자 = *"레꾸자랑에서 뽑은 카드로 레꾸한거+스티커붙인거. 다시공유하려고하면 카드 안보임."*
//    🔢 실물(밤 11:51 다시 보낸 것) = 카톡에 **카드가 아니라 우리 «음식 아이콘» ＋ 스티커 하나**가 갔다.
//
// ⭐⭐ **의심 = `Thumb` 이 창고 그림을 「화면에 들어올 때」만 꺼낸다.**
//    `IntersectionObserver` (rootMargin 300px) — 2026-09-02 에 절대원칙 32(수만 명) 때문에 넣었다.
//    그런데 공유용 숨은 레이어는 `left: -99999px` 다 → **영영 안 들어온다** → 못 꺼낸다
//    → `showImg` 가 거짓 → **음식 아이콘으로 떨어진다.**
//    ⛔ 그 자리 주석엔 *"못 꺼내도 안 깨진다 — 아이콘으로 그린다"* 라고 적혀 있다.
//       목록에선 맞는 말이지만 **공유 캡처에선 「조용히 다른 그림을 보내는 것」**이다.
//
// 🧪 이 판이 재는 것 = 「숨은 레이어 «안»에 그림 태그가 실제로 그려졌나」
//    ⛔ 나간 그림의 «색»으로 재려 했더니 못 갈랐다 — 카드도 크림색이고 아이콘 판도 크림색이다.
//       그래서 **DOM 을 본다.** 그게 원인 자리에 제일 가깝다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-숨은표지그림-0903.mjs
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
const PORT = await new Promise((r) => { srv.listen(0, () => r(srv.address().port)) })

let 통과 = 0, 실패 = 0
const chk = (이름, ok, 덧말 = '') => { console.log(`  ${ok ? '✅' : '⛔'} ${이름}${덧말 ? `   ${덧말}` : ''}`); ok ? 통과++ : 실패++ }

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const { 창고표시 } = await import('../src/photoStore.js')

const 밑 = basicRecipes.find((r) => r.title.includes('짬뽕')) || basicRecipes[0]
// 🗄 창업자 폰과 «같은 모양» = 표지 그림이 **창고에 있고** localStorage 엔 쪽지만 있다
const 쪽지 = `${창고표시}recipes/${밑.id}/image`
const 꾸민 = {
  ...밑, status: 'sorted', savedAt: Date.now(),
  thumb: 'photo', image: 쪽지, imageFit: 'whole', decorBg: 'clay',
  decor: [{ id: 'd1', type: 'sticker', key: 'au_i29', x: 0.26, y: 0.78, s: 0.3, r: -6 }],
}
const state = { recipes: [꾸민, ...basicRecipes.slice(0, 4).map((r, i) => ({ ...r, status: 'sorted', savedAt: Date.now() - (i + 2) * 6e4 }))], seedV: BASICS_VERSION }
const 카드그림 = readFileSync('/tmp/카드표지.txt', 'utf8').trim()

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, locale: 'ko-KR', timezoneId: 'Asia/Seoul' })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/hankki/`)
// 🗄 창고(IndexedDB)에 카드 그림을 심는다 — 앱이 쓰는 그 창고에 «같은 열쇠»로
await p.evaluate(async ({ s, 열쇠, 그림 }) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  // 🗄 앱이 쓰는 창고 그대로 — DB 'hankki-photos' · 칸 'img' · 판 1 (src/photoStore.js 실측)
  //    ⛔ 이름을 짐작하지 않았다. 틀리면 앱이 못 읽어 «판이 거짓 초록불»이 된다.
  return await new Promise((res) => {
    const q = indexedDB.open('hankki-photos', 1)
    q.onupgradeneeded = () => { if (!q.result.objectStoreNames.contains('img')) q.result.createObjectStore('img') }
    q.onsuccess = () => {
      try {
        const tx = q.result.transaction('img', 'readwrite')
        tx.objectStore('img').put(그림, 열쇠)
        tx.oncomplete = () => res('심었다')
        tx.onerror = () => res('심기실패')
      } catch (e) { res('못심음:' + e.name) }
    }
    q.onerror = () => res('창고못염')
  })
}, { s: state, 열쇠: `recipes/${밑.id}/image`, 그림: 카드그림 })

await p.goto(`http://127.0.0.1:${PORT}/hankki/`, { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(1000)

console.log('\n── 숨은 캡처 레이어가 창고 그림을 꺼내나 ──')
// 🎴 레꾸자랑 → 그 레시피 탭 (시트가 열리면 숨은 레이어가 붙는다)
await p.getByRole('button', { name: /레꾸자랑/ }).first().click()
await p.waitForTimeout(700)
await p.getByRole('button', { name: new RegExp(`${꾸민.title} 자랑하기`) }).first().click()
await p.waitForTimeout(2500)   // 창고에서 꺼낼 시간을 넉넉히 준다

const 잰것 = await p.evaluate(() => {
  const 숨은 = [...document.querySelectorAll('[aria-hidden]')].find((el) => {
    const r = el.getBoundingClientRect()
    return r.left < -1000 && el.querySelector('img, [class*="thumb"], div')
  })
  if (!숨은) return { 레이어: false }
  const imgs = [...숨은.querySelectorAll('img')]
  return {
    레이어: true,
    그림수: imgs.length,
    데이터그림: imgs.filter((i) => (i.currentSrc || i.src || '').startsWith('data:')).length,
    받아온것: imgs.filter((i) => i.complete && i.naturalWidth > 0).length,
    첫src: (imgs[0]?.currentSrc || imgs[0]?.src || '').slice(0, 40),
  }
})
console.log('     숨은 레이어 =', JSON.stringify(잰것))
chk('숨은 캡처 레이어가 붙었다', 잰것.레이어)
chk('⭐그 안에 «창고에서 꺼낸» 표지 그림이 있다', (잰것.데이터그림 || 0) > 0,
  잰것.레이어 ? `그림 태그 ${잰것.그림수}개 · data: ${잰것.데이터그림}개 · 받아온 것 ${잰것.받아온것}개 · 첫 src "${잰것.첫src}"` : '')

// 🔬 ⛔ 대조군(「보이는 표지는 되나」)은 **뺐다** — 내가 상세 화면으로 넘어가는 길을 못 맞춰
//    「.cover-box」 를 못 찾아 늘 실패했다. 그건 앱이 아니라 «내 계측»이 틀린 것이다(규칙 18).
//    ⭐ 그리고 없어도 된다 — 위 칸이 **고침 전엔 실패하고 고친 뒤엔 통과**한다(직접 돌려서 확인).
//       🔢 고침 전 = 그림 태그 2개 중 data: **0개** · 첫 src 가 「assets/gr_…」 (음식 아이콘)
//       🔢 고친 뒤 = data: **1개** · 첫 src 가 「data:image/jpeg…」 (카드 그림)
//    ⛔ 이 주석 글자가 한 번 망가졌다 — bash 로 넘긴 글에 백틱을 써서 명령치환이 됐다(규칙 24).
/* 뺀 칸 — 다음 사람이 같은 길을 다시 파지 않게 남겨 둔다.
await p.keyboard.press('Escape').catch(() => {})
await p.waitForTimeout(400)
await p.getByRole('button', { name: /레시피/ }).first().click().catch(() => {})
await p.waitForTimeout(900)
await p.getByRole('button', { name: new RegExp(꾸민.title) }).first().click().catch(() => {})
await p.waitForTimeout(2200)
const 보이는것 = await p.evaluate(() => {
  const box = document.querySelector('.cover-box')
  if (!box) return { 상세: false }
  const imgs = [...box.querySelectorAll('img')]
  return { 상세: true, data: imgs.filter((i) => (i.currentSrc || i.src || '').startsWith('data:')).length, 수: imgs.length }
})
console.log('     보이는 표지 =', JSON.stringify(보이는것))
chk('대조군 — «보이는» 표지는 창고 그림을 꺼낸다', (보이는것.data || 0) > 0, JSON.stringify(보이는것))

*/
await ctx.close(); await b.close(); srv.close()
console.log(실패 === 0 ? `\n✅ ${통과}칸 통과 — 숨은 레이어도 그림을 꺼낸다\n` : `\n⛔ ${실패}칸 실패 (통과 ${통과}) — 여기가 원인 자리다\n`)
process.exit(실패 === 0 ? 0 : 1)
