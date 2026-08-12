// 🔬 창업자 제보 재현 — 「일기 지워도 뜸(아카이브＋달력)」 · 「자주 해먹는 요리 지워도 뜸」
//
// 📮 창업자 2026-08-12
//   ② *"일기 지워도 뜸. (아카이브+달력)"*
//   ⑩ *"자주해먹는 요리는 지워도 계속 뜸."*
//   ③ *"한끼일기 통계는 언제 반영돼?"*
//   ⑪ *"달력에 날짜누르면 바로 일기로 들어가지는지 확인"*
//
// ⭐ 규칙 7 — **직접 재현 → 원인 확인 → 고치기 → 재현으로 검증.** 짐작으로 손대지 않는다.
//
// ⛔⛔ **`page.reload()` 로 「남나」를 재지 않는다** — `addInitScript` 가 저장값을 시드로 덮어써
//    **앱이 멀쩡한데 실패로 나온다**(2026-08-06 · 08-08 에 두 번 밟았다 · `check-mistakes.mjs` ⑧).
//    → 「다시 켰을 때」는 **새 탭**으로 확인한다.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = 4191
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT)], { stdio: 'ignore' })
await new Promise(r => setTimeout(r, 3500))

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 430, height: 900 }, timezoneId: 'Asia/Seoul' })
const 결과 = []
const 재 = (이름, 통과, 말) => { 결과.push([통과, 이름, 말]); console.log(`${통과 ? '✅' : '⛔'} ${이름} — ${말}`) }

// 📦 시드 — 오늘 날짜로 «요리 기록 1 ＋ 일기 1» 을 심는다.
//    ⚠️ 날짜는 **브라우저 안에서** 만든다. Node 는 UTC 라 KST 와 하루 어긋난다(2026-08-09 사고).
const 시드 = () => {
  localStorage.setItem('hankki:onboarded', '1')
  const 원래 = Storage.prototype.getItem
  Storage.prototype.getItem = function (k) { return k.startsWith('hankki:coach:') ? '1' : 원래.call(this, k) }
  const d = new Date()
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const raw = localStorage.getItem('hankki:v1')
  const s = raw ? JSON.parse(raw) : {}
  // ⛔⛔ 앱은 «`at`(타임스탬프)» 로 날짜를 잡는다 — `dayKey(e.at)` (MyRecipesScreen:41·71·244).
  //    첫 판은 `day: '2026-08-12'` 문자열을 심어서 **앨범엔 뜨는데 달력엔 0** 이 나왔다.
  //    📌 규칙 18 — 「안 뜬다」가 아니라 «내 시드가 틀렸다» 였다. 앱은 멀쩡했다.
  const at = d.getTime()
  s.diary = [
    { id: 'seed-log', at, title: '재현용 요리', recipeId: 'seed-recipe', rating: 5 },
    { id: 'seed-diary', kind: 'diary', at, paper: 'dp_photo', text: '재현용 일기' },
  ]
  s.recipes = [{
    id: 'seed-recipe', title: '재현용 요리', icon: 'fe_204', cooked: 3,
    ingredients: ['재료 1'], steps: ['한 걸음'], category: '한식', folder: '한식',
    createdAt: Date.now(), updatedAt: Date.now(),
  }]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  window.__seedKey = key
}

const 열기 = async () => {
  const p = await ctx.newPage()
  p.on('pageerror', e => console.log('⛔ pageerror', String(e).slice(0, 120)))
  await p.addInitScript(시드)
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(500)
  return p
}

const 일기탭 = async (p) => {
  await p.getByRole('button', { name: /일기/ }).first().click()
  await p.waitForTimeout(500)
}

// ─────────────────────────────────────────────
// ① 심은 것이 화면에 뜨나 (여기가 실패하면 아래가 다 무의미하다)
const p = await 열기()
await 일기탭(p)
const 처음 = await p.evaluate(() => ({
  달력음식: document.querySelectorAll('.cal-food').length,
  달력펜: document.querySelectorAll('.cal-diary').length,
  앨범: document.querySelectorAll('.grid2 > *').length,
  통계띠: !!document.body.innerText.match(/이번 달\s*\d+번/),
  글자: document.body.innerText.slice(0, 400),
}))
재('① 시드가 화면에 떴나', 처음.달력음식 > 0 || 처음.앨범 > 0,
  `달력음식 ${처음.달력음식} · 달력펜 ${처음.달력펜} · 앨범 ${처음.앨범} · 통계띠 ${처음.통계띠}`)

// ─────────────────────────────────────────────
// ⑪ 달력 칸을 누르면 그날 «일기»로 바로 가나
const 칸있음 = await p.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => x.querySelector('.cal-food, .cal-diary'))
  if (!b) return null
  b.click(); return true
})
await p.waitForTimeout(600)
const 갔나 = await p.evaluate(() => document.body.innerText.includes('속지') || !!document.querySelector('.paper-box, .decor-stage'))
재('⑪ 뭔가 있는 날 칸 → 일기로 감', 칸있음 && 갔나, 칸있음 ? `일기 화면 ${갔나}` : '누를 칸을 못 찾음')

// ⑪-2 아무것도 없는 날은?
await p.goBack().catch(() => {})
await p.waitForTimeout(400)
const 빈칸 = await p.evaluate(() => {
  const b = [...document.querySelectorAll('.cal-cell, button')].filter(x => /^\d+$/.test((x.textContent || '').trim()))
  const 빈 = b.find(x => !x.querySelector('.cal-food, .cal-diary'))
  return 빈 ? { 있음: true, 죽었나: 빈.disabled } : { 있음: false }
})
재('⑪-2 빈 날 칸이 «살아 있나»', 빈칸.있음 ? !빈칸.죽었나 : false,
  빈칸.있음 ? (빈칸.죽었나 ? '⛔ disabled — 지난 빈 날엔 일기를 쓰러 못 간다' : '살아 있음') : '빈 칸을 못 찾음')

// ─────────────────────────────────────────────
// ② 일기를 지우면 무엇이 사라지고 무엇이 남나
const p2 = await 열기()
await p2.evaluate(() => {
  const k = window.__seedKey
  location.hash = ''
  window.dispatchEvent(new Event('hashchange'))
  return k
})
await 일기탭(p2)
// 달력 칸을 눌러 일기 화면으로 → 휴지통
await p2.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => x.querySelector('.cal-food, .cal-diary'))
  b?.click()
})
await p2.waitForTimeout(600)
const 휴지통 = await p2.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => /지우|삭제|휴지/.test(x.getAttribute('aria-label') || x.title || ''))
  if (!b) return false
  b.click(); return true
})
await p2.waitForTimeout(500)
// 확인 시트가 뜨면 확인
await p2.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => /^\s*(삭제|지우기|버리기)\s*$/.test(x.textContent || ''))
  b?.click()
})
await p2.waitForTimeout(700)
const 지운뒤 = await p2.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  return {
    남은일기: (raw.diary || []).filter(d => d.kind === 'diary').length,
    남은기록: (raw.diary || []).filter(d => d.kind !== 'diary').length,
    화면에남음: document.body.innerText.includes('재현용 일기'),
    지금화면: document.body.innerText.slice(0, 200),
  }
})
재('② 일기 휴지통 → 일기가 지워졌나', 지운뒤.남은일기 === 0,
  `일기 ${지운뒤.남은일기} · 요리기록 ${지운뒤.남은기록}(남는 게 «정상»)`)
재('② 지운 뒤 화면을 떠났나', !지운뒤.화면에남음,
  지운뒤.화면에남음 ? '⛔ 지운 일기 글자가 화면에 그대로 — 부활 위험' : '떠났거나 비워짐')

// ②-2 ⭐ 부활 경로 — 지운 «뒤» 글자를 치면 되살아나나
const 부활 = await p2.evaluate(async () => {
  const t = document.querySelector('textarea')
  if (!t) return { 못함: '글칸 없음' }
  t.focus()
  const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set
  set.call(t, (t.value || '') + '살')
  t.dispatchEvent(new Event('input', { bubbles: true }))
  await new Promise(r => setTimeout(r, 900))
  const raw = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  return { 일기수: (raw.diary || []).filter(d => d.kind === 'diary').length }
})
재('②-2 지운 뒤 글자를 쳐도 «안» 되살아나나', 부활.못함 ? true : 부활.일기수 === 0,
  부활.못함 ? `건너뜀(${부활.못함})` : `일기 ${부활.일기수}개 ${부활.일기수 ? '⛔ 부활함' : ''}`)

// ─────────────────────────────────────────────
// ⑩ 요리 기록을 지우면 「자주 해먹는 요리」에서 «그 세션 안에» 사라지나
const p3 = await 열기()
const 자주처음 = await p3.evaluate(() => document.body.innerText.includes('자주 해먹는'))
await p3.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  return raw.recipes?.[0]?.cooked
})
// 앨범에서 요리 기록 지우기
await 일기탭(p3)
const 앨범삭제 = await p3.evaluate(async () => {
  const 편집 = [...document.querySelectorAll('button')].find(x => /편집|고르기|선택/.test(x.textContent || ''))
  if (!편집) return { 못함: '편집 버튼 없음' }
  편집.click()
  await new Promise(r => setTimeout(r, 300))
  const 첫 = document.querySelector('.grid2 > *')
  첫?.click()
  await new Promise(r => setTimeout(r, 300))
  const 지우기 = [...document.querySelectorAll('button')].find(x => /삭제|지우/.test(x.textContent || ''))
  지우기?.click()
  await new Promise(r => setTimeout(r, 300))
  const 확인 = [...document.querySelectorAll('button')].find(x => /^\s*(삭제|지우기)\s*$/.test(x.textContent || ''))
  확인?.click()
  await new Promise(r => setTimeout(r, 600))
  const raw = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  return { 기록: (raw.diary || []).filter(d => d.kind !== 'diary').length, cooked: raw.recipes?.[0]?.cooked }
})
if (앨범삭제.못함) {
  재('⑩ 요리 기록 삭제 → cooked 가 줄었나', false, `건너뜀 — ${앨범삭제.못함}`)
} else {
  재('⑩ 요리 기록 삭제 → cooked 가 줄었나', 앨범삭제.cooked < 3,
    `기록 ${앨범삭제.기록} · cooked ${앨범삭제.cooked} (처음 3)`)
  // 홈으로 가서 「자주 해먹는」이 아직 뜨나
  await p3.getByRole('button', { name: /^홈$/ }).first().click().catch(() => {})
  await p3.waitForTimeout(600)
  const 자주뒤 = await p3.evaluate(() => document.body.innerText.includes('자주 해먹는'))
  재('⑩-2 「자주 해먹는 요리」가 그 «세션 안»에 사라지나', !자주뒤,
    `처음 ${자주처음} → 지운 뒤 ${자주뒤} ${자주뒤 ? '⛔ 아직 뜬다' : ''}`)
}

// ─────────────────────────────────────────────
// ③ 통계 띠 — 일기«만» 있을 때도 뜨나
const p4 = await ctx.newPage()
await p4.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1')
  const 원래 = Storage.prototype.getItem
  Storage.prototype.getItem = function (k) { return k.startsWith('hankki:coach:') ? '1' : 원래.call(this, k) }
  const d = new Date()
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  s.diary = [{ id: 'only-diary', kind: 'diary', at: d.getTime(), paper: 'dp_photo', text: '일기만 있음' }]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
})
await p4.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p4.waitForTimeout(500)
await 일기탭(p4)
const 일기만 = await p4.evaluate(() => ({
  띠: !!document.body.innerText.match(/이번 달\s*\d+번/),
  펜: document.querySelectorAll('.cal-diary').length,
}))
재('③ 일기«만» 써도 통계 띠가 뜨나', 일기만.띠,
  `통계띠 ${일기만.띠} · 달력펜 ${일기만.펜} ${일기만.띠 ? '' : '⛔ 일기만 쓰면 통계가 아예 안 보인다'}`)

// ─────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`)
const 실패 = 결과.filter(r => !r[0])
console.log(`통과 ${결과.length - 실패.length} / ${결과.length}`)
await b.close(); srv.kill(); process.exit(0)
