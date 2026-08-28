// 🧪🧪 [재현판 · 2026-08-28] 창업자 할 일 셋을 «화면에서» 잰다
//   ③ 가져오기 = 네 갈래 ＋ 갈래마다 「안내 ＋ 가져오기」
//   ② 일기 = ‹ › 로 «쓴 날끼리» 넘어간다
//   ⑦ 포스트잇 = 글자·별점이 종이 크기를 따라간다
//
// ⭐⭐ 심장 = **「화면에 그려진 값」**이다. ⛔소스를 grep 하지 않는다 —
//    주석에 적어둔 옛 문구까지 걸려서 고쳐놓고도 실패로 나온다(규칙 18 ⓘ).
//
// ⛔ `page.reload()` ＋ `addInitScript` 금지 — 저장값이 시드로 덮인다(check-mistakes ⑧). **새 탭**을 쓴다.
// ⚠️ tesseract 는 이 컨테이너가 `cdn.jsdelivr.net` 을 못 열어 pageerror 를 쏜다 — 우리 잘못이 아니라 거른다.
//
// 🧪 규칙 12 = ⑴`OPTIONS` 를 옛 다섯 줄로 되돌리면 ①②가 죽는다
//              ⑵`DiaryScreen` 의 `넘김단추` 를 빼면 ④⑤가 죽는다
//              ⑶`styles.css` 의 `.memo-note.stick` 글자 값을 옛 값으로 되돌리면 ⑥⑦이 죽는다
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
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ } })

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

// ── ③ 가져오기 ──────────────────────────────────────────────
console.log('\n③ 가져오기 — 네 갈래 ＋ 갈래마다 안내')
await p.getByRole('button', { name: /가져오기/ }).last().click()
await p.waitForTimeout(900)
const 목록 = await p.evaluate(() => {
  const 히어로 = [...document.querySelectorAll('.screen.imp button')].find((b) => /제일 많이 써요/.test(b.innerText || ''))
  return {
    히어로: (히어로?.innerText || '').split('\n')[0],
    줄들: [...document.querySelectorAll('.screen.imp .opt-row .a')].map((e) => e.innerText.trim()),
  }
})
잰다('갈래가 «넷»이다 (히어로 1 ＋ 목록 3)', 목록.줄들.length === 3, `${목록.히어로} ＋ ${목록.줄들.join(' · ')}`)
잰다('옛 다섯 줄(텍스트 붙여넣기·링크 주소만)이 목록에 «없다»',
  !목록.줄들.some((t) => /텍스트 붙여넣기|링크 주소만/.test(t)))

// 갈래마다 «안내 ＋ 가져오기»
for (const [이름, 단추말] of [['보다가 캡처해서 담기', /담는 다른 방법/], ['갤러리에 있는 사진 담기', /여기서 고르기/], ['여기서 사진 고르기', /사진 고르기/], ['직접 입력하기', /빈 종이 열기/]]) {
  await p.getByText(이름, { exact: true }).first().click()
  await p.waitForTimeout(500)
  const 본것 = await p.evaluate(() => {
    const s = document.querySelector('.screen.imp')
    const 단계 = [...s.querySelectorAll('.card > div')].filter((d) => /^[123]$/.test((d.firstElementChild?.innerText || '').trim()))
    return { 단계: 단계.length, 글: s.innerText }
  })
  잰다(`「${이름}」 — 안내 ${본것.단계}단계 ＋ 가져오기 단추`,
    본것.단계 >= 2 && 단추말.test(본것.글), `단계 ${본것.단계}`)
  await p.getByRole('button', { name: '닫기' }).first().click()
  await p.waitForTimeout(400)
}
// ⭐ 「더보기(점 세 개)」가 안내에 «반드시» 있어야 한다 — 창업자 실물로 확인한 그 한 걸음이다
await p.getByText('보다가 캡처해서 담기', { exact: true }).first().click()
await p.waitForTimeout(500)
const 캡처안내 = await p.evaluate(() => document.querySelector('.screen.imp').innerText)
잰다('안내에 「더보기」(점 세 개)가 있다', /더보기/.test(캡처안내) && /점 세 개/.test(캡처안내))
await p.getByRole('button', { name: '닫기' }).first().click()
await p.waitForTimeout(400)
await p.getByRole('button', { name: '닫기' }).first().click()
await p.waitForTimeout(700)

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
const 날 = () => p.evaluate(() => document.querySelector('.detail-bar span')?.innerText || '')
const 전 = await 날()
await p.locator('.diary-flip').last().click()
await p.waitForTimeout(700)
const 후 = await 날()
잰다('› 를 누르면 «다른 날» 일기가 열린다', 전 && 후 && 전 !== 후, `${전} → ${후}`)
// ⭐ 뒤로가기 «한 번»에 달력으로 — 넘길 때 히스토리를 안 쌓는다(그게 `replace` 를 만든 이유다)
await p.goBack()
await p.waitForTimeout(700)
const 달력인가 = await p.evaluate(() => !document.querySelector('.diary-flip'))
잰다('넘긴 뒤 뒤로가기 «한 번»에 일기 화면을 빠져나온다', 달력인가)

// ── ⑦ 포스트잇 ─────────────────────────────────────────────
console.log('\n⑦ 포스트잇 — 글자·별점이 종이를 따라간다')
if (첫제목) {
  await p.locator('.nav-item', { hasText: '레시피' }).first().click()
  await p.waitForTimeout(900)
  await p.getByText(첫제목, { exact: false }).first().click()
  await p.waitForTimeout(1400)
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
