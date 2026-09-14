// 🧪🧪 [재현판 · 2026-08-28] 창업자 할 일 둘을 «화면에서» 잰다
//   ② 일기 = ‹ › 로 «쓴 날끼리» 넘어간다 (창업자 = *"일기를 넘겨가며 볼수있으면 좋겠어"*)
//   ⑦ 포스트잇 = 글자·별점이 종이 크기를 따라간다 (창업자 = *"포스트잇은 큰데 글자, 별점이 작아"*)
//
// ⭐⭐ 심장 = **「화면에 그려진 값」**이다. ⛔소스를 grep 하지 않는다 —
//    주석에 적어둔 옛 문구까지 걸려서 고쳐놓고도 실패로 나온다(규칙 18 ⓘ).
//
// ⛔ `page.reload()` ＋ `addInitScript` 금지 — 저장값이 시드로 덮인다(check-mistakes ⑧). **새 탭**을 쓴다.
// ⚠️ tesseract 는 이 컨테이너가 `cdn.jsdelivr.net` 을 못 열어 pageerror 를 쏜다 — 우리 잘못이 아니라 거른다.
//
// ⛔ **③가져오기 네 갈래·⑤오픈 요일은 여기서 «안» 잰다** — 창업자가 *"가져오기 만든건 그냥 두고"* 라 해서
//    `hold/할일7-0828` 에 남겼다. 그 둘이 나가는 날 그 브랜치의 판을 같이 가져온다.
//
// 🧪 규칙 12 = ⑴`DiaryScreen` 의 `넘김단추` 를 빼면 ②가 죽는다
//              ⑵`styles.css` 의 `.memo-note.stick` 글자 값을 옛 값으로 되돌리면 ⑦이 죽는다
// 🏷 이름표 = 반영됨
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = MIME[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(4459, r))

let 통과 = 0
const 실패목록 = []
const 잰다 = (이름, 참, 덧말 = '') => {
  if (참) { 통과++; console.log(`  ✅ ${이름}${덧말 ? ` — ${덧말}` : ''}`) }
  else { 실패목록.push(이름); console.log(`  ❌ ${이름}${덧말 ? ` — ${덧말}` : ''}`) }
}
const 남의탓 = (m) => /tesseract|importScripts|cdn\.jsdelivr|Failed to fetch/i.test(m)

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
const _N = new Date()

// 🗓🗓 **시계를 「이번 달 15일 낮」으로 고정한다** (2026-09-01 · 달이 바뀌는 날 셋이 한꺼번에 죽었다)
//   ⛔ 뿌리 = 씨앗 날짜를 `Date.now()` 에서 «며칠 빼서» 만드는데, **달 초에 돌리면 지난달로 떨어진다.**
//      일기·달력 화면은 «이번 달»을 열므로 화면이 텅 비고, 찾던 것이 영영 안 나온다.
//      🔢 실측(2026-09-01 = 1일) — `_repro-일기그달`·`_repro-접기세모먹통`·`_repro-일기포스트잇` **셋 다 실패**.
//         손 안 댄 배포 갈래에서도 똑같이 죽었다 = **앱이 아니라 검사가 낡은 것**이다(절대원칙 18 ⓘ).
//   ⛔ 「1 로 눌러 담기」(`Math.max(1, T-10)`)는 답이 아니었다 — 1일엔 **엿새가 한 날로 뭉쳐**
//      「제육볶음이 3번 뜬다」·「요리 안 한 날이 없다」처럼 **재려던 상황 자체가 사라진다.**
//   ✅ 15일이면 앞뒤로 열흘씩 여유가 있어 **어느 달, 어느 날에 돌려도 같은 그림**이 나온다.
await ctx.clock.install({ time: new Date(_N.getFullYear(), _N.getMonth(), 15, 12, 0, 0) })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch { /* noop */ } })

// 일기 세 장 ＋ 한 줄 메모를 심는다(새 탭으로 열어야 산다)
const p0 = await ctx.newPage()
await p0.goto('http://127.0.0.1:4459/hankki/', { waitUntil: 'networkidle' })
await p0.waitForTimeout(1200)
await p0.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const 하루 = 86400000
  const 이제 = Date.now()
  const 첫 = (s.recipes || [])[0]
  s.diary = [
    { id: 'rg1', kind: 'diary', at: 이제 - 9 * 하루, title: '비 오는 날', note: '' },
    { id: 'rg2', kind: 'diary', at: 이제 - 4 * 하루, title: '국수 삶은 날', note: '' },
    { id: 'rg3', kind: 'diary', at: 이제 - 하루, title: '어제', note: '' },
    ...(첫 ? [{ id: 'rm1', kind: 'cook', at: 이제 - 2 * 하루, recipeId: 첫.id, title: 첫.title, note: '간장 반만 · 면 1분 덜 삶기', rating: 4 }] : []),
  ]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
})
const 첫제목 = await p0.evaluate(() => { try { return (JSON.parse(localStorage.getItem('hankki:v1')).recipes || [])[0]?.title || '' } catch { return '' } })
await p0.close()

const p = await ctx.newPage()
let 화면오류 = 0
p.on('pageerror', (e) => { if (!남의탓(e.message)) { 화면오류++; console.log(`     ⚠️ ${e.message}`) } })
await p.goto('http://127.0.0.1:4459/hankki/', { waitUntil: 'networkidle' })
await p.waitForTimeout(4000)

// ── ② 일기 넘겨보기 ─────────────────────────────────────────
console.log('\n② 일기 — ‹ › 로 쓴 날끼리 넘어간다')
await p.locator('.nav-item', { hasText: '일기' }).first().click()
await p.waitForTimeout(900)
await p.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.querySelector('svg') && /^\d+$/.test((x.innerText || '').trim()))
  b?.click()
})
await p.waitForTimeout(800)
const 단추들 = await p.evaluate(() => [...document.querySelectorAll('.diary-flip')].map((x) => ({ 이름: x.getAttribute('aria-label'), 꺼짐: x.disabled })))
잰다('날짜 양옆에 넘김 단추가 둘', 단추들.length === 2, JSON.stringify(단추들.map((x) => x.이름)))
잰다('제일 오래된 일기에선 ‹ 가 꺼져 있다', 단추들[0]?.꺼짐 === true)
잰다('단추가 «며칠 일기인지»를 읽어 준다', /\d+월 \d+일 일기/.test(단추들[1]?.이름 || ''))
// ⛔ «맨 위» 화면에서 읽는다 — 화면을 옮겨도 앞 화면 DOM 이 남아서, 첫째를 읽으면 옛 날짜가 잡힌다
const 날 = () => p.evaluate(() => [...document.querySelectorAll('.detail-bar span')].pop()?.innerText || '')
const 전 = await 날()
await p.locator('.diary-flip').last().click()
await p.waitForTimeout(700)
const 후 = await 날()
잰다('› 를 누르면 «다른 날» 일기가 열린다', 전 && 후 && 전 !== 후, `${전} → ${후}`)
// ⭐ 뒤로가기 «한 번»에 빠져나온다 — 넘길 때 히스토리를 안 쌓는다(그게 `nav.replace` 를 만든 이유다)
await p.goBack()
await p.waitForTimeout(700)
const 나왔나 = await p.evaluate(() => !document.querySelector('.diary-flip'))
잰다('넘긴 뒤 뒤로가기 «한 번»에 일기 화면을 빠져나온다', 나왔나)

// ── ⑦ 포스트잇 ─────────────────────────────────────────────
console.log('\n⑦ 포스트잇 — 글자·별점이 종이를 따라간다')
// ⛔ ②가 죽어도 ⑦은 재야 한다 — 여기서 뻗으면 「통과했는데 아무것도 안 쟀다」의 반대판이 된다.
//    (② 가 실패하면 일기 화면에 갇혀 하단 탭이 없다 → 나올 때까지 뒤로)
for (let i = 0; i < 4 && !(await p.locator('.nav-item').first().isVisible().catch(() => false)); i++) {
  await p.goBack(); await p.waitForTimeout(500)
}
if (첫제목) {
  await p.locator('.nav-item', { hasText: '레시피' }).first().click()
  await p.waitForTimeout(900)
  await p.getByText(첫제목, { exact: false }).first().click()
  await p.waitForTimeout(1400)
  await p.evaluate(() => document.querySelector('.memo-note.stick')?.scrollIntoView({ block: 'center' }))
  await p.waitForTimeout(400)
  const m = await p.evaluate(() => {
    const n = document.querySelector('.memo-note.stick')
    if (!n) return null
    const px = (el) => (el ? parseFloat(getComputedStyle(el).fontSize) : 0)
    const star = n.querySelector('.memo-note-stars svg')
    return {
      폭: Math.round(n.getBoundingClientRect().width),
      본문: px(n.querySelector('.memo-note-body')),
      머리줄: px(n.querySelector('.memo-note-head')),
      별: star ? Math.round(star.getBoundingClientRect().width) : 0,
    }
  })
  잰다('포스트잇이 붙어 있다', !!m, JSON.stringify(m))
  if (m) {
    // 🔢 옛 값 = 본문 12.9 · 머리줄 8.3 · 별 11(고정). 창업자 = *"글자, 별점이 작아"*
    잰다('본문이 15px 이상', m.본문 >= 15, `${m.본문}px`)
    잰다('머리줄이 10px 이상', m.머리줄 >= 10, `${m.머리줄}px`)
    잰다('별이 12px 이상 — ⛔px 로 박혀 있지 않다', m.별 >= 12, `${m.별}px`)
    잰다('그래도 종이를 안 넘친다', m.본문 <= m.폭 * 0.16, `본문 ${m.본문} ≤ 폭 ${m.폭}×0.16`)
  }
} else {
  잰다('레시피가 있어야 포스트잇을 잰다', false, '기본 레시피 0편')
}

잰다('화면 오류 0', 화면오류 === 0, `${화면오류}건`)

console.log(`\n${실패목록.length ? '❌' : '✅'} ${통과}/${통과 + 실패목록.length}${실패목록.length ? ` — ${실패목록.join(' · ')}` : ''}\n`)
await b.close()
srv.close()
process.exit(실패목록.length ? 1 : 0)
