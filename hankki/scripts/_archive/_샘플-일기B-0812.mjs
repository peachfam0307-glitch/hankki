// 📸 「한끼 일기」 샘플 B — **사진칸 있는 속지**(스크랩 사진첩) (2026-08-12 · #88)
//
// 📮 창업자 *"근데 일기는 내가 만든거 올리는 용도니까. 실사써도 되지 않을까?"* → **맞는 말이다.**
//    ⛔ 내가 `기획-노트.md` 의 *"획일화된 음식사진보다 이모지·아이콘으로"* 를 갖다 붙였는데
//       그건 **레시피북** 원칙이지 일기가 아니다.
//    🔢 근거 = 일기 속지 여덟 중 **여섯에 사진칸이 이미 뚫려 있다**
//       (사진일기·레시피 기록·오늘의 한끼·사진 기록·기록 3칸·스크랩 사진첩).
//       사진칸이 없는 건 「없음」과 「도트·파랑」 둘뿐인데 **하필 A 판이 그 하나였다.**
//
// 🎯 A ↔ B 를 나란히 놓고 고르라고 만든다
//    A = `_샘플-일기-0812.mjs` — 도트·파랑(사진칸 없음) · 우리 음식 아이콘
//    B = 이 판 — 스크랩 사진첩(폴라로이드 3칸) · **사진 자리**
//
// ⚠️ 지금은 **진짜 사진이 없다** — 창업자 사진이 오면 그대로 갈아끼운다.
//    그때까지 사진 자리엔 우리 음식 아이콘을 «크림 바탕 정사각»으로 만들어 끼운다
//    (아이콘 PNG 는 배경이 투명이라 폴라로이드 창에 그냥 넣으면 종이가 비쳐 어색하다).
// ⛔ Unsplash 는 이 환경에서 **403** 이라 내가 받아올 수 없다(실제로 시험함).
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
await new Promise((r) => srv.listen(4386, r))

// 🖼 사진 자리에 끼울 것 — 지금은 아이콘, 나중엔 창업자 사진
//   `--사진 a.jpg,b.jpg,c.jpg` 로 진짜 사진을 넘기면 그걸 쓴다.
const 넘긴사진 = (process.argv.find((v) => v.startsWith('--사진=')) || '').split('=')[1]
const 아이콘 = ['fe_38', 'fe_63', 'fh_k22']   // 콩국수 · 덮밥 · 김밥
const b64 = (p) => `data:image/${extname(p).slice(1) === 'jpg' ? 'jpeg' : extname(p).slice(1)};base64,${readFileSync(p).toString('base64')}`
const 사진들 = 넘긴사진
  ? 넘긴사진.split(',').map((f) => b64(f.trim()))
  : 아이콘.map((k) => b64(join(ROOT, 'src/assets/stickers/photo', `${k}.png`)))

const 샘플 = {
  id: 'seed-diary-sample-b', kind: 'diary',
  paper: { rule: 'none', skin: 'ivory', art: 'scrap' },
  title: '이번 주 밥상',
  font: 'gaegu',
  // ⚠️ 스크랩 속지의 글칸은 **오른쪽 위 좁은 칸 하나**다(write left 58.5 · right 6.5) → 짧게 쓴다
  note: '한 주 동안\n해먹은 것들.\n\n별거 아닌데\n모아 놓으니\n뿌듯하네.',
  ph_s1: 사진들[0] || '', ph_s2: 사진들[1] || '', ph_s3: 사진들[2] || '',
  decor: [
    // 📐 모서리 — A 판과 같은 문법(창업자 *"속지모서리도 꾸며달라했는데"*)
    //   ⚠️ 이 속지는 폴라로이드가 왼쪽 위·아래를 이미 채운다 → **오른쪽 위 하나만**
    //   ⚠️ 속지가 이미 꽉 차 있어 **작게**(0.14) — A 판(빈 종이)과 같은 크기로 두면 시끄럽다
    { id: 'b1', type: 'sticker', key: 'dgc05', x: 0.900, y: 0.048, s: 0.14, r: 0, flip: true },
    // 🐻 꼬르곰 — 오른쪽 아래 빈자리
    { id: 'b2', type: 'sticker', key: 'gp_gomhi', x: 0.800, y: 0.835, s: 0.23, r: 3, motion: 'tongtong', fx: 'none' },
    // ✍️ 글자 — 색·모션·효과가 글자에도 걸린다
    //   ⛔ 처음에 y 0.955 로 뒀다가 **종이 밖으로 나갔다**(넘침 검사가 잡았다) → 0.905
    //   ⛔ 처음 y 0.955 → 종이 밖 · 0.905 로 내려도 오른쪽 끝이 나갔다(넘침 검사가 두 번 잡았다)
    //   ✅ **속지에 인쇄된 체크리스트 첫 줄 위**에 얹는다 — 빈 줄 위에 손글씨를 쓴 모양이 된다
    { id: 'b3', type: 'text', color: 't_teal', font: 'gaegu', text: '이번 주도 잘 먹었다', x: 0.415, y: 0.800, s: 0.42, r: -2, motion: 'tilt', fx: 'spark' },
  ],
}

const br = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await br.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 3, timezoneId: 'Asia/Seoul' })
await ctx.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:giftSheetSeen', '1')
  for (const k of ['home3', 'detail', 'shop', 'profile', 'myrecipes', 'brag', 'diary'])
    localStorage.setItem(`hankki:coach:${k}`, '1')
})
const pg0 = await ctx.newPage()
await pg0.goto('http://127.0.0.1:4386/', { waitUntil: 'networkidle' })
await pg0.evaluate((entry) => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const 오늘 = new Date(); 오늘.setHours(12, 0, 0, 0)
  s.diary = [{ ...entry, at: 오늘.getTime() }, ...(s.diary || []).filter((d) => d.kind !== 'diary')]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
}, 샘플)
await pg0.close()

const pg = await ctx.newPage()
pg.on('pageerror', (e) => console.log('  ⛔ pageerror:', String(e).slice(0, 120)))
await pg.goto('http://127.0.0.1:4386/', { waitUntil: 'networkidle' })
const 시트닫기 = async () => {
  for (const t of ['나중에', '닫기']) {
    const b = pg.getByRole('button', { name: t }).first()
    if (await b.count() && await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); await pg.waitForTimeout(250) }
  }
}
await pg.getByRole('button', { name: /일기/ }).last().click()
await pg.waitForTimeout(700); await 시트닫기()
await pg.getByRole('button', { name: /오늘 일기/ }).first().click()
await pg.waitForTimeout(1000); await 시트닫기()
// 🚫 「사진 지우기」 ✕ 단추를 «찍는 동안만» 숨긴다 — 사진이 든 칸마다 뜨는 **편집 단추**라
//   판정판에서 사진을 셋 다 가린다(첫 판이 그랬다). ⛔앱에서 빼는 게 아니다. 찍을 때만 감춘다.
await pg.addStyleTag({ content: '[aria-label*="사진 지우기"]{display:none!important}' })
await pg.waitForTimeout(200)
await pg.screenshot({ path: `${OUT}/sampleB-page.png` })

// 📐 A 판과 «같은 검사» — 넘침 · 깨진 그림 · 글자 덮음 · 사진이 실제로 들어갔나
const 잰것 = await pg.evaluate(() => {
  const box = document.querySelector('.paper-box')
  if (!box) return { 종이: null }
  const b = box.getBoundingClientRect()
  const 꾸민것들 = () => {
    for (const el of box.querySelectorAll('div')) {
      const s = getComputedStyle(el)
      if (s.position === 'absolute' && s.pointerEvents === 'none' && s.zIndex === '2' && s.overflow === 'hidden') return [...el.children]
    }
    return []
  }
  const 안쪽 = (r) => r.left >= b.left - 2 && r.right <= b.right + 2 && r.top >= b.top - 2 && r.bottom <= b.bottom + 2
  const 넘침 = []
  꾸민것들().forEach((el, i) => {
    const r = el.getBoundingClientRect()
    if (!안쪽(r)) 넘침.push(i)
  })
  const 줄 = []
  for (const ta of document.querySelectorAll('textarea')) {
    if (!String(ta.value || '').trim()) continue
    const r0 = ta.getBoundingClientRect()
    const 줄수 = String(ta.value).split('\n').length
    const lh = parseFloat(getComputedStyle(ta).lineHeight) || 0
    const 찬높이 = Math.min(lh ? 줄수 * lh : (ta.scrollHeight || r0.height), r0.height)
    const r = { left: r0.left, right: r0.right, top: r0.top, bottom: r0.top + 찬높이, width: r0.width, height: 찬높이 }
    if (r.width > 4 && r.height > 4 && 안쪽(r0)) 줄.push({ t: String(ta.value).trim().slice(0, 12), r })
  }
  const 덮음 = []
  꾸민것들().forEach((el) => {
    const a = el.getBoundingClientRect()
    for (const { t, r } of 줄) {
      const ov = Math.max(0, Math.min(a.right, r.right) - Math.max(a.left, r.left)) *
                 Math.max(0, Math.min(a.bottom, r.bottom) - Math.max(a.top, r.top))
      if (ov / (r.width * r.height) > 0.05) 덮음.push(`「${t}」 ${Math.round(ov / (r.width * r.height) * 100)}%`)
    }
  })
  // 🖼 ⭐ 사진이 «실제로» 세 칸에 들어갔나 — 안 들어가도 화면은 멀쩡해 보인다(빈 폴라로이드가 원래 그림이다)
  const 사진 = [...box.querySelectorAll('img')].filter((im) => (im.src || '').startsWith('data:'))
  return {
    종이: `${Math.round(b.width)}×${Math.round(b.height)}`,
    꾸민것: 꾸민것들().length, 넘침: 넘침.length, 덮음,
    사진칸: 사진.length,
    깨짐: [...box.querySelectorAll('img')].filter((im) => im.naturalWidth === 0).length,
  }
})
// ⚠️ 「넘침 1」은 **모서리 스티커**다 — 모서리에 걸치라고 둔 것이라 넘치는 게 정상이고,
//   종이가 `overflow: hidden` 이라 잘려 보이지도 않는다. 눈으로 확인함(규칙 21).
console.log('종이 :', 잰것.종이, '· 꾸민 것', 잰것.꾸민것, '· 넘침', 잰것.넘침, '(모서리 스티커는 넘치는 게 정상)', '· 깨진 그림', 잰것.깨짐)
console.log('사진 :', 잰것.사진칸, '칸 (3이라야 한다)', 잰것.사진칸 !== 3 ? '⛔' : '✅')
console.log('덮음 :', (잰것.덮음 || []).length, (잰것.덮음 || []).join(' / '))

await br.close(); srv.close(); console.log(`\n🖼 ${OUT}/sampleB-page.png`); process.exit(0)
