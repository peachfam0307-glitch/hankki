// 🔬 창업자 폰 제보 넷을 «재현»한다 (2026-08-07 · 사진 3장)
//   ⑴ 「움직임 ／ 효과」 두 단추가 «안 보인다» — 포스트잇·데코를 골랐을 때
//   ⑵ 스티커인 줄 알고 골랐는데 포스트잇 선택지(무늬·모양)가 뜬다
//   ⑶ 서랍 스크롤 먹통
//   ⑷ 컨텍스트 바(색·글씨·무늬·모양)가 너무 길다
//   📱 창업자 폰 = 1080×2340 · DPR 3 → CSS 360×780
//   ⛔ 짐작 금지(규칙 7) — 화면에서 «잰 값»만 찍는다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4438, r))
const { BASICS_VERSION } = await import('/home/user/hankki/hankki/src/data/basics.js')

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
// 창업자 사진 그대로 = 포스트잇(별 모양·줄 무늬) 하나 ＋ 데코 스티커 하나
const decor = [
  { id: 'n1', type: 'note', key: 'kraft', text: '맛있는\n돼지고기\n김치찌개', font: 'tongtong', shape: 'star', pattern: 'line', x: 0.5, y: 0.5, s: 0.42, r: 4 },
]
const page = await (await b.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3 })).newPage()
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor }] })

await page.goto('http://127.0.0.1:4438/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1300)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1400)
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)

// ── 일꾸 서랍의 탭 목록 (친구들 탭이 있나)
const tabs = await page.evaluate(() => {
  const dr = document.querySelector('.decor-drawer')
  const row = [...dr.querySelectorAll('div')].find((d) => {
    const bs = [...d.children].filter((c) => c.tagName === 'BUTTON')
    return bs.length >= 3 && bs.some((c) => /마테|데코|글자/.test(c.textContent))
  })
  return row ? [...row.querySelectorAll('button')].map((x) => x.textContent.trim()) : []
})
console.log('📑 일꾸 서랍 탭 =', JSON.stringify(tabs))

const measure = async (label) => {
  const m = await page.evaluate(() => {
    const q = (s) => document.querySelector(s)
    const ed = q('.decor-editor'), dr = q('.decor-drawer'), sc = q('.decor-scroll'), st = q('.decor-stage')
    // 컨텍스트 바 = 서랍 «바로 위» 형제 · 갈래 줄 = 그 안 첫 칸
    const ctx = dr?.previousElementSibling
    const tabRow = ctx?.children[0]
    const 갈래 = tabRow ? [...tabRow.querySelectorAll('button')].map((b) => b.textContent.trim()).filter(Boolean) : []
    const R = (e) => (e ? Math.round(e.getBoundingClientRect().height) : 0)
    // 갈래 줄이 «옆으로» 밀리나 (2026-08-07 에 한 번 밟은 함정)
    const 밀림 = tabRow ? Math.max(0, (tabRow.firstElementChild?.scrollWidth || 0) - (tabRow.firstElementChild?.clientWidth || 0)) : 0
    const wrap = tabRow?.firstElementChild
    const 칩폭 = wrap ? [...wrap.children].map((c) => Math.round(c.getBoundingClientRect().width)) : []
    const 칸폭 = wrap ? Math.round(wrap.getBoundingClientRect().width) : 0
    return {
      화면: window.innerHeight,
      판: R(st), 컨텍스트바: R(ctx), 갈래, 갈래밀림: 밀림,
      칩폭, 칸폭,
      서랍: R(dr), 스크롤칸: R(sc),
      넘침: sc ? sc.scrollHeight - sc.clientHeight : 0,
      바닥밀림: ed ? Math.round(ed.scrollHeight - ed.clientHeight) : 0,
    }
  })
  console.log(`\n📐 ${label}`)
  console.log('   화면', m.화면, '· 판', m.판, '· 컨텍스트바', m.컨텍스트바, `· 갈래 ${JSON.stringify(m.갈래)} (옆 밀림 ${m.갈래밀림}px)`)
  if (m.칩폭.length) {
    const need = m.칩폭.reduce((a, b) => a + b, 0) + (m.칩폭.length - 1) * 4
    console.log(`   갈래 칩 ${JSON.stringify(m.칩폭)} 합 ${need}px / 칸 ${m.칸폭}px → ${need <= m.칸폭 ? '✅ 한 줄' : `⛔ ${need - m.칸폭}px 넘침`}`)
  }
  console.log('   서랍', m.서랍, '· 스크롤 칸', m.스크롤칸, '· 스크롤할 거리', m.넘침, '· 화면 밖 밀림', m.바닥밀림)
  return m
}

// ⑴ 아무것도 안 고른 상태
await page.mouse.click(8, 300); await page.waitForTimeout(400)
const a = await measure('아무것도 안 골랐을 때')

// ⑵ 포스트잇(별) 고르기 — 창업자 사진 1과 같은 상태
await page.locator('.decor-stage [style*="rotate"]').first().click(); await page.waitForTimeout(600)
const c = await measure('포스트잇(별) 골랐을 때 ← 창업자 사진 1')

// ⑶ 서랍이 실제로 굴러가나
const scrolled = await page.evaluate(async () => {
  const sc = document.querySelector('.decor-scroll'); if (!sc) return 'X'
  const before = sc.scrollTop; sc.scrollTop = 400
  await new Promise((r) => setTimeout(r, 120))
  return `${before} → ${sc.scrollTop}`
})
console.log('   스크롤 시험(0→400 밀어보기) =', scrolled)

// ⑷ 「접기」 — 갈래 줄만 남고 칩 줄이 사라지나
await page.getByRole('button', { name: '설정 접기' }).click(); await page.waitForTimeout(350)
const folded = await measure('접은 뒤')
await page.getByRole('button', { name: '설정 펴기' }).click(); await page.waitForTimeout(350)

// ⑸ 🎬 모션이 «진짜로» 움직이나 — 포스트잇에 통통을 걸고 두 프레임을 견준다
//    ⛔ 칩이 칠해지는 것과 그림이 움직이는 것은 다른 말이다(2026-08-07 글자에서 실제로 어긋나 있었다).
await page.getByRole('button', { name: '움직임', exact: false }).first().click(); await page.waitForTimeout(350)
const moved = await page.evaluate(async () => {
  const chips = [...document.querySelectorAll('button')].filter((x) => x.textContent.trim() === '통통')
  if (!chips.length) return '⛔ 「통통」 칩이 없다'
  chips[0].click()
  await new Promise((r) => setTimeout(r, 400))
  const el = document.querySelector('.decor-stage .hk-m-tongtong')
  if (!el) return '⛔ 모션 클래스가 안 붙었다'
  const t1 = getComputedStyle(el).transform
  await new Promise((r) => setTimeout(r, 260))
  const t2 = getComputedStyle(el).transform
  return t1 === t2 ? `⛔ 안 움직인다 (${t1})` : `✅ 움직인다 (${t1} → ${t2})`
})
console.log('\n🎬 포스트잇 모션 =', moved)

// ⑹ 🏷 글 상자(라벨 그림)엔 죽은 단추(무늬·모양·색)가 «안» 생기나
await page.getByRole('button', { name: '글자', exact: true }).last().click(); await page.waitForTimeout(600)
const box = page.locator('.decor-drawer button[aria-label^="글 상자"]').first()
if (await box.count()) {
  await box.click(); await page.waitForTimeout(800)
  const m = await measure('글 상자(라벨 그림) 붙인 직후 ← 창업자 제보 ⑵')
  const dead = m.갈래.filter((x) => ['무늬', '모양', '색'].includes(x))
  console.log('   죽은 단추 =', dead.length ? `⛔ ${JSON.stringify(dead)} 가 아직 뜬다` : '✅ 하나도 없다')
} else console.log('   ⛔ 글 상자 단추를 못 찾음')

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
await b.close(); srv.close()
