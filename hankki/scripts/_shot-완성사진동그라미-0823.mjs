// 📷⭕ 「완성 사진 남기기」 동그라미 시안 — 창업자 판정용 (2026-08-23)
//
// 📮 창업자 = *"완성사진남기기 버튼은 **동그라미로 해서 붙이는게 낫겠다 흰색이고 네모라 안보여.**"*
//    ＋ 그 앞 = *"있는거 몰랐어. **버튼이 아래에 붙어있네;;**"*
//
// 🔢 실측으로 확인된 「안 보이는」 이유 셋 (`_shot-완성사진자리-0823.mjs` · 캡처 실물)
//    ⑴ `flex:1` 이라 **가로 전체** — 바로 아래 「이전 / 다 만들었어요」와 폭이 같다
//    ⑵ `border: 1.5px dashed` ＋ `background: none` — 크림 배경에 묻힌다
//    ⑶ 그래서 **「버튼 줄의 일부」**로 읽혀 시선이 그냥 지나간다
//    ⛔ 「글이 길어서 화면 밖으로 밀린다」는 내 짐작은 **틀렸다**(712px · 굴릴 양 0px).
//
// ⛔ 앱 소스를 «안» 고친다 — 실제 앱 화면에 CSS 를 얹어 찍는다(절대원칙 30 · 시안은 되돌릴 것이 0).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-완성사진동그라미-0823.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.SHOT_OUT || '/tmp/완성사진동그라미'
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4411, r))

// 🎨 시안 — 전부 «동그라미 ＋ 색». 다른 건 «어디에 붙나»와 «얼마나 말하나»
//    ⛔ 색은 앱 변수(`--brown`·`--cream`)로만 쓴다 — 테마 셋(기본·다크·웜)에서 안 깨지게
//
// ⛔⛔ 첫 판에서 셋이 깨졌고 «숫자는 전부 초록불»이었다(절대원칙 21 — 열어봐야 안다)
//    · ㉡ `::before` ＋ `position:absolute` → 아이콘이 글자 «위»에 겹쳤다
//    · ㉢ `.cook-body` 안 top:12px → 상단바 「재료」 단추를 덮었다
//    · ㉣ `bottom: calc(100% - 10px)` → 화면 «밖»으로 나갔다(위 −50px)
//    ✅ 그래서 이 판은 전부 **글자를 지우지 않고**(아이콘은 그대로 두고) 원을 «만들어» 쓴다.
const 동그라미 = (색 = 'var(--brown)', 글자 = '#fff', 크기 = 58) => `
  flex: 0 0 auto !important; width: ${크기}px; height: ${크기}px; min-height: ${크기}px;
  padding: 0 !important; border: none !important; border-radius: 50% !important;
  background: ${색} !important; color: ${글자} !important;
  font-size: 0 !important; gap: 0 !important; overflow: hidden;
  box-shadow: 0 3px 12px rgba(0,0,0,0.16);
`
const 아이콘 = (색 = '#fff', 크기 = 26) => `
  .cook-shot-add svg { width: ${크기}px !important; height: ${크기}px !important; flex: 0 0 auto; }
  .cook-shot-add svg * { stroke: ${색} !important; }
`

const 시안 = {
  A: { 이름: '지금 (점선 네모 · 색 없음)', css: '' },

  // ㉠ 오른쪽 끝 — 제일 조용하다. 「다 만들었어요」와 같은 색이라 한 식구로 보인다
  B: {
    이름: '㉠ 오른쪽 끝 · 진한 색',
    css: `.cook-shot { justify-content: flex-end; padding-right: 18px; }
          .cook-shot-add { ${동그라미()} } ${아이콘()}`,
  },

  // ㉡ 같은 자리, 크림색 — 「다 만들었어요」가 주인공인 건 그대로 두고 조용히 눈에만 띈다
  C: {
    이름: '㉡ 오른쪽 끝 · 크림색(테두리)',
    css: `.cook-shot { justify-content: flex-end; padding-right: 18px; }
          .cook-shot-add { ${동그라미('var(--cream)', 'var(--brown)')}
            border: 2px solid var(--brown) !important; }
          ${아이콘('var(--brown)')}`,
  },

  // ㉢ 타이머 단추 «옆» — 화면 가운데, 눈이 이미 머무는 자리
  D: {
    이름: '㉢ 「타이머」 옆에 나란히',
    css: `.cook-shot { display: none !important; }
          .cook-timer { position: relative; }
          .cook-timer::after {
            content: ''; position: absolute; left: calc(100% + 12px); top: 50%;
            transform: translateY(-50%); width: 54px; height: 54px; border-radius: 50%;
            background: var(--brown); box-shadow: 0 3px 12px rgba(0,0,0,0.16);
          }`,
    // ⚠️ 이건 «자리만» 보는 시안이다 — 진짜로 옮기려면 JSX 를 고쳐야 한다(누를 수 없음)
    자리만: true,
  },

  // ㉣ 「다 만들었어요」 줄 «안»에 — 이전/완료와 한 줄로 세운다
  E: {
    이름: '㉣ 버튼 줄 «안»에 나란히',
    css: `.cook-shot { display: none !important; }
          .cook-nav::before {
            content: ''; flex: 0 0 auto; width: 56px; height: 56px; border-radius: 50%;
            background: var(--brown); align-self: center;
            box-shadow: 0 3px 12px rgba(0,0,0,0.16);
          }`,
    자리만: true,
  },

  // ㉤ 오른쪽 끝 ＋ 글자 한 줄 — 처음 보는 사람도 뭔지 안다
  F: {
    이름: '㉤ 동그라미 ＋ 아래 글자',
    css: `.cook-shot { flex-direction: column; align-items: flex-end; padding-right: 18px; gap: 4px; }
          .cook-shot::after {
            content: '완성 사진'; font-size: 13px; font-weight: 700; color: var(--text-sub);
            margin-right: 4px;
          }
          .cook-shot-add { ${동그라미()} } ${아이콘()}`,
  },
}

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })

const 요리끝까지 = async (page, 제목) => {
  await page.evaluate(() => {
    const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
    bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes('레시피'))?.click()
  })
  await page.waitForTimeout(600)
  const 열림 = await page.evaluate((T) => {
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().startsWith(T))
    if (!t) return false; t.click(); return true
  }, 제목)
  if (!열림) return false
  await page.waitForTimeout(700)
  const 시작 = await page.evaluate(() => {
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes('요리 시작'))
    if (!t) return false; t.click(); return true
  })
  if (!시작) return false
  await page.waitForTimeout(600)
  for (let n = 0; n < 40; n++) {
    const 다음 = await page.evaluate(() => {
      const bs = [...document.querySelectorAll('.cook-navbtn')]
      const t = bs.find((x) => /시작 →|다음 →/.test(x.innerText || ''))
      if (!t) return false; t.click(); return true
    })
    if (!다음) break
    await page.waitForTimeout(170)
  }
  return page.evaluate(() => /다 만들었어요/.test(document.querySelector('.cook-nav')?.innerText || ''))
}

console.log('\n📷⭕ 완성 사진 단추 — 동그라미 시안 (390×844)\n')

for (const [키, { 이름, css }] of Object.entries(시안)) {
  const page = await ctx.newPage()
  await page.goto('http://127.0.0.1:4411/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(600)
  const ok = await 요리끝까지(page, '콩국수')
  if (!ok) { console.log(`  ⛔ ${키} — 마지막 걸음까지 못 감`); await page.close(); continue }

  if (css) await page.addStyleTag({ content: css })
  await page.waitForTimeout(400)

  // 📏 실제로 «얼마나 튀나» — 손가락 크기 ＋ 아래 버튼과 겹치나
  const 잰값 = await page.evaluate(() => {
    const b = document.querySelector('.cook-shot-add')
    const nav = document.querySelector('.cook-nav')
    if (!b) return null
    const r = b.getBoundingClientRect(), nr = nav?.getBoundingClientRect()
    const cs = getComputedStyle(b)
    const el = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2))
    return {
      폭: Math.round(r.width), 높이: Math.round(r.height),
      위: Math.round(r.top), 아래: Math.round(r.bottom),
      화면안: r.top >= 0 && r.bottom <= window.innerHeight,
      눌리나: !!el?.closest('.cook-shot-add'),
      아래버튼겹침: nr ? Math.round(Math.max(0, r.bottom - nr.top)) : 0,
      모양: cs.borderRadius, 바탕: cs.backgroundColor,
    }
  })
  console.log(`  ${키}. ${이름}`)
  if (잰값) {
    console.log(`     ${잰값.폭}×${잰값.높이}px · 위 ${잰값.위}px · 화면안 ${잰값.화면안 ? '✅' : '⛔'} · 눌리나 ${잰값.눌리나 ? '✅' : '⛔ 무언가에 덮임'}`)
    console.log(`     손가락 44px ${Math.min(잰값.폭, 잰값.높이) >= 44 ? '✅' : '⛔'} · 아래 버튼 겹침 ${잰값.아래버튼겹침}px`)
  }
  await page.screenshot({ path: join(OUT, `${키}.png`) })
  await page.close()
}

console.log(`\n📁 캡처 = ${OUT}\n`)
await b.close(); srv.close()
