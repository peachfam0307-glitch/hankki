// 📔 다이어리 화면 실물 — 창업자 판정용 (2026-08-06)
//   ⓐ 요리 기록 탭에서 「다이어리 쓰기」 누르기
//   ⓑ 다이어리 화면 (종이 3:4 ＋ 선·종이·틀 고르기 ＋ 그날 만든 요리)
//   ⓒ 속지를 갈아끼운 모습
//   ⓓ 꾸미기(같은 에디터, 판만 3:4)
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
await new Promise((r) => srv.listen(4346, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now(), day = 86400000
const state = {
  recipes: [{ id: 'u1', title: '들깨나물무침', category: '한식', time: 15, thumb: 'icon', icon: 'fe_143',
    ingredients: ['시래기 200g'], steps: ['볶는다.'], tags: [], savedAt: now, source: 'user' }],
  diary: [
    { id: 'd1', recipeId: 'u1', title: '들깨나물무침', at: now, rating: 5, note: '', photo: null },
    { id: 'd2', recipeId: 'u1', title: '들깨나물무침', at: now - day * 2, rating: 4, note: '', photo: null },
  ],
  seedV: BASICS_VERSION,
}

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, state)
await page.goto('http://127.0.0.1:4346/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

// 📔📔 속지 고르기는 **꾸미기 서랍 안**에 있다 (2026-08-06 합침 · 창업자
//   *"지금 꾸미기 틀이랑 꾸미기로 나눠져있는게 조금 불편해"*).
//   ⛔ 예전처럼 화면의 `.seg` 를 누르면 안 된다 — 그 줄은 이제 없다.
const openDecor = async () => {
  await page.locator('[aria-label="다이어리 꾸미기"]').first().click()
  await page.waitForTimeout(1300)
  await page.getByRole('button', { name: '나중에' }).first().click({ timeout: 1200 }).catch(() => {})
  await page.waitForTimeout(300)
}
const paperTab = () => page.locator('.decor-drawer').getByRole('button', { name: '속지 고르기', exact: true })
/** 속지를 고르고 저장까지 — 여러 개 주면 차례로 고른다(선·종이·틀은 같이 쓴다) */
const pickPaper = async (...labels) => {
  await openDecor()
  await paperTab().first().click()
  await page.waitForTimeout(300)
  for (const l of labels) {
    await page.getByRole('button', { name: `속지 ${l}`, exact: true }).first().click()
    await page.waitForTimeout(350)
  }
  await page.getByRole('button', { name: '저장', exact: true }).first().click()
  await page.waitForTimeout(900)
}

await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(700)
await page.locator('.seg', { hasText: /요리 (기록|일지)/ }).first().click(); await page.waitForTimeout(700)
await page.screenshot({ path: join(OUT, 'diary-a-입구.png') })
const btn = page.getByRole('button', { name: /다이어리 쓰기/ }).first()
if (await btn.isVisible().catch(() => false)) ok('요리 기록 탭에 「다이어리 쓰기」가 있다')
else no('「다이어리 쓰기」 버튼이 없다')

await btn.click(); await page.waitForTimeout(900)
await page.screenshot({ path: join(OUT, 'diary-b-화면.png') })
const paper = await page.locator('.paper').first().boundingBox()
if (!paper) no('종이가 없다')
else {
  const want = paper.width * 4 / 3
  if (Math.abs(paper.height - want) <= 2) ok(`종이 ${Math.round(paper.width)}x${Math.round(paper.height)} = 3:4`)
  else no(`종이가 3:4 가 아니다 (${Math.round(paper.width)}x${Math.round(paper.height)} · 기대 ${Math.round(want)})`)
}
if (await page.getByText('이 날 만든 요리').first().isVisible().catch(() => false)) ok('그날 만든 요리가 아래에 뜬다')
else no('그날 만든 요리가 안 뜬다')

// ⓑ-2 ✍️ **종이 «위»에 바로 써진다** (창업자 2026-08-06 *"줄노트 자체에 바로 써지게 해야지"*)
//   ⛔ 종이 밖 입력칸에 쓰고 종이엔 반영만 되는 방식은 죽었다 — *"불편해서 안써"*
const BODY = '들기름 조금 더 넣으니 훨씬 고소했다'
const body = page.getByLabel('다이어리 본문')
const inPaper = (await page.locator('.paper').first().locator('[aria-label="다이어리 본문"]').count()) > 0
if (inPaper) ok('글 쓰는 칸이 «종이 안»에 있다')
else no('글 쓰는 칸이 종이 밖에 있다 — 그럼 안 쓴다')
await body.fill(BODY)
await page.waitForTimeout(700) // 저장 뜸(350ms)보다 넉넉히
const inStore = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  return (s.diary || []).filter((d) => d.kind === 'diary').map((d) => d.note)
})
// ⭐ 저장까지 갔나 — 화면에만 있고 저장이 안 되면 내일 사라진다.
//   ⛔ `page.reload()` 로는 못 잰다 — `addInitScript` 가 «되돌아올 때마다» 처음 상태를 다시 심는다
//      (내가 여기서 한 번 속았다: 코드가 아니라 «검사»가 저장을 지우고 있었다).
if (inStore.includes(BODY)) ok('쓴 글이 저장소에 들어갔다')
else no(`저장이 안 된다 — 저장소의 다이어리 note = ${JSON.stringify(inStore)}`)
await page.locator('.bar-btn[aria-label="뒤로"]').first().click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /다이어리 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(800)
if ((await page.getByLabel('다이어리 본문').inputValue()) === BODY) ok('나갔다 들어와도 글이 그대로')
else no('나갔다 들어오니 글이 비었다')
await page.screenshot({ path: join(OUT, 'diary-b2-글쓰기.png') })

// ⓑ-3 📔 「레시피 기록」 틀 — 사진 옆 날짜·줄 ＋ 맨 아래 「오늘의 한 줄」
//   창업자 2026-08-06 = *"사진 옆에 줄 긋고 날짜랑 그건 똑같이 하고. 아래는 남겨주고
//   제일 아래 줄긋고 오늘의 한줄"*
// ⭐ 합치기 확인 — 다이어리 화면엔 속지 줄이 «따로» 있으면 안 된다(손이 두 군데였다)
if ((await page.getByRole('button', { name: /^속지 / }).count()) === 0) ok('다이어리 화면에 속지 줄이 따로 없다 — 꾸미기로 합쳤다')
else no('속지 줄이 아직 화면에 따로 있다 — 합친 게 아니다')
await pickPaper('레시피 기록')
const LINE = '엄마가 좋아하던 맛'
const lineBox = page.getByLabel('오늘의 한 줄')
if (await lineBox.isVisible().catch(() => false)) ok('레시피 기록 틀에 「오늘의 한 줄」 칸이 뜬다')
else no('「오늘의 한 줄」 칸이 없다')
await lineBox.fill(LINE); await page.waitForTimeout(700)
const paperTxt = (await page.locator('.paper').first().innerText()).replace(/\s+/g, ' ')
if (/\d+월 \d+일 .요일/.test(paperTxt)) ok(`날짜가 종이에 찍힌다 — "${paperTxt.slice(0, 20)}…"`)
else no(`날짜가 안 찍힌다 — "${paperTxt.slice(0, 40)}"`)
const savedLine = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  return (s.diary || []).filter((d) => d.kind === 'diary').map((d) => d.line)
})
if (savedLine.includes(LINE)) ok('오늘의 한 줄이 저장된다')
else no(`오늘의 한 줄이 저장 안 된다 — ${JSON.stringify(savedLine)}`)
// ⭐ 「없음」 틀엔 한 줄 칸이 없어야 한다 — 그 칸은 «레시피 기록» 속지의 것이다
await pickPaper('없음')
if ((await page.getByLabel('오늘의 한 줄').count()) === 0) ok('틀이 없으면 「오늘의 한 줄」 칸도 없다')
else no('틀이 없는데 「오늘의 한 줄」 칸이 뜬다 — 그 칸은 레시피 기록 속지 것이다')
await pickPaper('레시피 기록')
await page.screenshot({ path: join(OUT, 'diary-b3-레시피기록.png') })

// ⓑ-4 📷 사진칸 — 틀에 그려진 «창»에 사진을 끼울 수 있어야 한다
//   창업자 2026-08-06 *"사진틀에 사진올리기가없어"* — 틀만 있고 넣을 길이 없었다
const shot = page.getByRole('button', { name: '사진 넣기' })
if (await shot.first().isVisible().catch(() => false)) ok('레시피 기록 틀에 「사진 넣기」 자리가 있다')
else no('사진칸을 눌러도 사진을 못 넣는다')
// 진짜 파일을 물려 넣어 본다(1×1 붉은 PNG)
await page.setInputFiles('input[type=file]', {
  name: 'a.png', mimeType: 'image/png',
  buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'),
})
await page.waitForTimeout(900)
const gotPhoto = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  return (s.diary || []).filter((d) => d.kind === 'diary').some((d) => (d.photo || '').startsWith('data:image'))
})
if (gotPhoto) ok('고른 사진이 저장된다')
else no('사진이 저장 안 된다')
if ((await page.locator('.paper img').count()) > 0) ok('사진이 종이의 창에 끼워진다')
else no('사진이 종이에 안 보인다')
// ⚠️ 「틀 없음」엔 사진칸이 없다 — 창이 안 그려진 종이에 사진을 얹으면 그냥 얼룩이다
await pickPaper('없음')
if ((await page.getByRole('button', { name: /^사진 (넣기|바꾸기)$/ }).count()) === 0) ok('틀이 없으면 사진칸도 없다')
else no('창이 없는 종이에 사진칸이 뜬다')
await pickPaper('레시피 기록')
await page.screenshot({ path: join(OUT, 'diary-b4-사진.png') })

// ⓒ 속지 갈아끼우기 — 종이 크라프트 ＋ 틀 사진일기를 «한 서랍에서» 이어서 고른다
await pickPaper('크라프트', '사진일기')
// ☀️ 날씨 — **그림에 인쇄된 아이콘 넷**을 고를 수 있어야 한다(전엔 눌러도 아무 일이 없었다)
const wBtns = page.getByRole('button', { name: /^날씨 / })
if ((await wBtns.count()) === 4) ok('사진일기에 날씨 넷을 고를 수 있다')
else no(`날씨 버튼이 ${await wBtns.count()}개 (기대 4)`)
await page.getByRole('button', { name: '날씨 흐림' }).first().click(); await page.waitForTimeout(700)
const w1 = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  return (s.diary || []).filter((d) => d.kind === 'diary').map((d) => d.weather)
})
if (w1.includes('cloud')) ok('고른 날씨가 저장된다')
else no(`날씨가 저장 안 된다 — ${JSON.stringify(w1)}`)
if ((await page.getByRole('button', { name: '날씨 흐림' }).first().getAttribute('aria-pressed')) === 'true') ok('고른 날씨에 표시가 뜬다')
else no('고른 날씨에 표시가 없다')
// 같은 걸 다시 누르면 지워진다
await page.getByRole('button', { name: '날씨 흐림' }).first().click(); await page.waitForTimeout(700)
if ((await page.getByRole('button', { name: '날씨 흐림' }).first().getAttribute('aria-pressed')) === 'false') ok('다시 누르면 지워진다')
else no('다시 눌러도 안 지워진다')
await page.getByRole('button', { name: '날씨 구름 조금' }).first().click(); await page.waitForTimeout(700)
await page.screenshot({ path: join(OUT, 'diary-c-속지.png') })
const cls = await page.locator('.paper').first().getAttribute('class')
if (cls.includes('kraft') && cls.includes('art')) ok(`속지가 바뀐다 (${cls})`)
else no(`속지가 안 바뀐다 (${cls})`)

// ⓓ 꾸미기 — 판만 3:4 인 같은 에디터
await openDecor()
await page.screenshot({ path: join(OUT, 'diary-d-꾸미기.png') })
const stage = await page.locator('.decor-stage > div').first().boundingBox()
if (stage && Math.abs(stage.height - stage.width * 4 / 3) <= 2) ok(`꾸미기 판도 3:4 (${Math.round(stage.width)}x${Math.round(stage.height)})`)
else no(`꾸미기 판이 3:4 가 아니다 (${stage ? Math.round(stage.width) + 'x' + Math.round(stage.height) : '없음'})`)
// 📝 꾸미는 동안에도 한 줄이 보여야 한다 — 안 보이면 그 위에 스티커를 놓는다
if ((await page.locator('.decor-stage').first().innerText()).includes(BODY)) ok('꾸미기 판에도 쓴 글이 같이 보인다')
else no('꾸미기 판엔 글이 안 보인다 — 모르고 그 위를 덮게 된다')

// ⓓ-2 📔 **서랍이 큰 두 칸으로 갈렸나** (창업자 2026-08-06 *"반으로 갈라서 왼쪽은 속지 고르기 오른쪽은 꾸미기"*)
if ((await paperTab().count()) === 1) ok('서랍 왼쪽 칸에 「속지 고르기」가 있다')
else no('「속지 고르기」 칸이 없다 — 그럼 종이를 아예 못 고른다')
if ((await page.locator('.decor-drawer').getByRole('button', { name: '꾸미기', exact: true }).count()) === 1) ok('서랍 오른쪽 칸에 「꾸미기」가 있다')
else no('「꾸미기」 칸이 없다')
// 📐 종이가 화면을 다 먹지 않나 (창업자 *"꾸미기눌렀을때 창이너무 작음"*)
const stageBox = await page.locator('.decor-stage .paper').first().boundingBox()
if (stageBox && stageBox.height <= 880 * 0.44) ok(`꾸미는 종이 높이 ${Math.round(stageBox.height)}px = 화면의 ${(stageBox.height / 880 * 100).toFixed(0)}%`)
else no(`종이가 너무 크다 — ${stageBox ? Math.round(stageBox.height) : '?'}px (화면 880 의 44% 넘음)`)
const drawerBox = await page.locator('.decor-drawer').first().boundingBox()
if (drawerBox && drawerBox.height >= 880 * 0.36) ok(`서랍 높이 ${Math.round(drawerBox.height)}px = 화면의 ${(drawerBox.height / 880 * 100).toFixed(0)}%`)
else no(`서랍이 너무 좁다 — ${drawerBox ? Math.round(drawerBox.height) : '?'}px`)
await paperTab().first().click(); await page.waitForTimeout(300)
// ⛔ 속지 쪽엔 꾸미기 것이 안 섞인다 — 두 일을 가른 게 이 개편의 뜻이다
if ((await page.getByRole('button', { name: '내 사진 넣기' }).count()) === 0) ok('「속지 고르기」 쪽엔 스티커·사진 줄이 안 섞인다')
else no('속지 쪽에 꾸미기 줄이 그대로 있다 — 가른 게 아니다')
for (const [label, sel] of [['선', '선'], ['종이', '종이'], ['틀', '틀']]) {
  if ((await page.locator('.decor-drawer .decor-sec-label', { hasText: new RegExp(`^${sel}$`) }).count()) === 1) ok(`속지 탭에 「${label}」 절이 있다`)
  else no(`속지 탭에 「${label}」 절이 없다`)
}
await page.getByRole('button', { name: '속지 하늘', exact: true }).first().click(); await page.waitForTimeout(500)
const stageCls = await page.locator('.decor-stage .paper').first().getAttribute('class')
if ((stageCls || '').includes('sky')) ok(`속지를 고르면 꾸미는 판이 바로 바뀐다 (${stageCls})`)
else no(`속지를 골라도 판이 안 바뀐다 (${stageCls})`)
await page.screenshot({ path: join(OUT, 'diary-d2-속지탭.png') })

// ⓔ 📔 **표지 전용 UI 가 다이어리에 딸려오면 안 된다** (2026-08-06)
//   다이어리 캔버스는 `Thumb` 을 아예 안 그린다 → 「표지 그림 되돌리기」·「배경지」는 눌러도 아무 일이 없다.
//   ⛔ 아무 일도 안 하는 버튼은 고장으로 읽힌다.
const gone = async (name, re) => {
  const n = await page.getByText(re).count()
  if (n === 0) ok(`다이어리 꾸미기에 「${name}」 없음`)
  else no(`다이어리 꾸미기에 「${name}」이 그대로 딸려왔다 (${n}곳)`)
}
await gone('배경 탭', /^배경$/)
await gone('표지 그림', /표지 그림/)
await gone('배경지', /^배경지$/)

// ⭐ 반대쪽도 본다 — **표지 꾸미기엔 그대로 있어야 한다.**
//   (규칙 18 ⓘ = 「있으면 안 되는 것」만 보면, 셋 다 통째로 사라져도 통과한다)
await page.getByRole('button', { name: '취소' }).first().click(); await page.waitForTimeout(600)
await page.locator('.bar-btn[aria-label="뒤로"]').first().click(); await page.waitForTimeout(600)
await page.getByText('홈', { exact: true }).last().click(); await page.waitForTimeout(700)
await page.getByText('들깨나물무침', { exact: true }).first().click(); await page.waitForTimeout(800)
await page.locator('[aria-label="레시피 꾸미기"]').first().click(); await page.waitForTimeout(1400)
await page.getByRole('button', { name: '나중에' }).first().click({ timeout: 1500 }).catch(() => {})
await page.waitForTimeout(500)
for (const [name, re] of [['배경 탭', /^배경$/], ['표지 그림', /표지 그림/], ['배경지', /^배경지$/]]) {
  if (await page.getByText(re).count() > 0) ok(`표지 꾸미기엔 「${name}」 그대로 있다`)
  else no(`표지 꾸미기에서 「${name}」이 사라졌다 — 표지 쪽을 깨뜨렸다`)
}
// 📔 그리고 **다이어리 속지는 레꾸로 새면 안 된다** — 표지엔 깔 종이가 없다(창업자 질문 2026-08-06)
if ((await paperTab().count()) === 0) ok('표지 꾸미기엔 「속지」 탭이 없다')
else no('표지 꾸미기에 다이어리 속지 탭이 딸려왔다 — 표지엔 종이가 없다')
await page.screenshot({ path: join(OUT, 'diary-e-표지꾸미기.png') })

// ⓕ 📷 **내 사진을 스티커로** — 종이 종류를 안 가리고 붙는 유일한 길
//   창업자 2026-08-06 *"무지나 도트도 사진 넣고싶을수있지않아? 그럼 어떻게 사진넣어?"*
//   (지금 열려 있는 판 = 표지 꾸미기 → 여기에도 있어야 한다. 같은 에디터니까)
if ((await page.getByRole('button', { name: '내 사진 넣기' }).count()) === 1) ok('꾸미기 서랍에 「내 사진 넣기」가 있다')
else no('「내 사진 넣기」가 없다 — 무지·도트엔 사진 넣을 길이 없어진다')
await page.setInputFiles('.decor-drawer input[type=file]', {
  name: 'b.png', mimeType: 'image/png',
  buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'),
})
await page.waitForTimeout(900)
if ((await page.locator('.decor-stage img').count()) > 0) ok('고른 사진이 판에 붙는다')
else no('사진이 판에 안 붙는다')

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
