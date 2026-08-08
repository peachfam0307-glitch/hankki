// 📄 새 속지 「사진 기록」·「기록 3칸」 — 글·사진이 «제자리에» 앉나 (2026-08-08)
//   ⛔ 좌표는 실측으로 넣었지만 v9.85 에서 세 번 고친 전례가 있다 — 채워서 찍어 눈으로 본다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4354, r))

// 시험 사진 — 귀퉁이 표식(⊙) 있는 색판. 어디가 잘리는지 보인다.
const testPhoto = (color, label) => {
  const c = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450">
    <rect width="600" height="450" fill="${color}"/>
    <circle cx="20" cy="20" r="12" fill="#fff" stroke="#333" stroke-width="4"/>
    <circle cx="580" cy="20" r="12" fill="#fff" stroke="#333" stroke-width="4"/>
    <circle cx="20" cy="430" r="12" fill="#fff" stroke="#333" stroke-width="4"/>
    <circle cx="580" cy="430" r="12" fill="#fff" stroke="#333" stroke-width="4"/>
    <text x="300" y="240" font-size="60" text-anchor="middle" fill="#fff">${label}</text>
  </svg>`
  return 'data:image/svg+xml;base64,' + Buffer.from(c).toString('base64')
}

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d.getTime() })()  // «오늘» — 「오늘 일기 쓰기」 버튼이 여는 날
const mk = (art, extra) => ({
  id: `d-${art}`, kind: 'diary', at: now,
  paper: { rule: 'lined', skin: 'ivory', art },
  decor: [], font: '', size: '',
  title: '오늘의 한 끼 기록', ...extra,
})
const entrySnap = mk('snap', {
  note: '사진 아래 줄 노트에 쓰는 글이에요. 둘째 줄도 셋째 줄도 줄 위에 앉아야 해요. 넉넉하게 넉 줄까지 채워 봅니다. 줄과 글씨가 맞는지 봐 주세요.',
  photo: testPhoto('#7a9c6e', '사진'),
})
const entryList3 = mk('list3', {
  note: '아침 국 끓였다', note2: '점심 도시락 쌌다', note3: '저녁 볶음 했다', note4: '맨 아래 메모 칸이에요',
  photo: testPhoto('#7a9c6e', '1'), photo2: testPhoto('#6e86a0', '2'), photo3: testPhoto('#b08a6a', '3'),
})
const entryScrap = mk('scrap', {
  title: '이번 주 요리들',
  note: '도트 메모지에 쓰는 글이에요. 폴라로이드가 기울어져 있어서 사진도 같이 기울어야 해요.',
  photo: testPhoto('#7a9c6e', '1'), photo2: testPhoto('#6e86a0', '2'), photo3: testPhoto('#b08a6a', '3'),
})

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
for (const [entry, name] of [[entrySnap, '사진기록'], [entryList3, '기록3칸'], [entryScrap, '스크랩']]) {
  const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 3 })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript((s) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
    for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
  }, { recipes: [], diary: [entry], seedV: BASICS_VERSION })
  await page.goto('http://127.0.0.1:4354/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(700)
  // 「오늘 일기 쓰기」 = 오늘 날짜의 일기로 들어간다 — 시드도 오늘(2026-08-08)로 넣었다
  await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click()
  await page.waitForTimeout(1200)

  // 종이 판 스크린샷
  const paper = page.locator('.paper').first()
  if (await paper.count()) {
    await page.screenshot({ path: join(OUT, `속지검수-${name}.png`), clip: await paper.boundingBox() })
    ok(`${name} 판 캡처`)
  } else no(`${name} — .paper 를 못 찾았다`)

  // 값이 실제로 화면에 있나
  const txt = await page.evaluate(() => document.body.innerText)
  const want = name === '사진기록' ? ['오늘의 한 끼 기록'] : ['오늘의 한 끼 기록']
  for (const w of want) {
    if (txt.includes(w)) ok(`${name} — 「${w}」 보임`)
    else no(`${name} — 「${w}」 안 보임`)
  }
  if (!errors.length) ok(`${name} — pageerror 0`)
  else no(`${name} — pageerror: ${errors[0]}`)
  await page.close()
}
await b.close(); srv.close()
console.log(bad ? `\n⛔ ${bad}건 어긋남` : '\n✅ 새 속지 두 장 실물 캡처 완료 — 눈검수는 사람이')
process.exit(bad ? 1 : 0)
