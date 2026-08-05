// 🗣 재현 — 「이미 깔린 폰」에 저장돼 있던 «가져온 레시피»가 해요체로 다듬어지나
//   ⛔⛔ 어제(8/4) 세 번 터진 것과 같은 모양이다: 원문만 고치고 «저장된 값»은 안 봤다.
//   창업자 캡처(08:42~43)의 줄을 그대로 심어 두고 앱을 열어, 실제로 바뀌는지 화면에서 읽는다.
//   판정 = ① 가져온 것은 해요체가 된다  ② 직접 쓴 것(`manual`)은 «그대로 남는다»
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = Number(process.env.PORT || 4340)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
const stop = () => { try { srv.kill() } catch { /* noop */ } }
process.on('exit', stop)
await new Promise((r) => setTimeout(r, 900))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
// 📸 창업자 폰에 «이미 저장돼 있는» 모양 — 가져온 것 ＋ 직접 쓴 것
const state = {
  seedV: BASICS_VERSION,      // 시드 이관은 안 끼어들게
  memoCleanV: 1,
  politeV: 1,   // ⭐ v1 까지 돌았는데도 «안 바뀐 채» 남은 폰 — 창업자가 겪은 그 상태
  recipes: [
    {
      id: 'u-gungchae', title: '궁채 들깨볶음', category: '한식', time: 20, thumb: 'icon',
      source: 'manual', status: 'sorted', savedAt: now,   // ⛔ 가져왔는데도 'manual' 로 저장돼 있다(EditorScreen 기본값)
      ingredients: ['궁채 50g', '순두부 1/2모'],
      steps: [
        '궁채는 흐르는 물에 2~3번 씻은 뒤, 물에 담가 1시간 동안 불려줍니다.',
        '양파는 얇게 썰어 3분간 돌려 단맛을 끌어냅니다.',
        '마무리로 통 들깨를 뿌려 완성합니다.',
      ],
    },
    {
      id: 'u-mine', title: '내가 쓴 레시피', category: '한식', time: 10, thumb: 'icon',
      source: 'manual', status: 'sorted', savedAt: now - 60000,
      ingredients: ['달걀 2개'],
      steps: ['대충 휘저어서 부친다.', '알아서 잘 먹는다.'],
    },
  ],
}

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await ctx.newPage()
const url = `http://127.0.0.1:${PORT}/`
await page.goto(url)
await page.evaluate((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1')
  for (const k of ['hankki:coach:home2', 'hankki:coach:my', 'hankki:coach:search', 'hankki:coach:shop', 'hankki:coach:brag']) localStorage.setItem(k, '1')
}, state)
await page.goto(url)          // ← 여기서 마이그레이션이 돈다
await page.waitForTimeout(2500)

// 앱이 실제로 저장해 둔 값을 그대로 읽는다(화면이 아니라 «저장된 것»을 본다)
const after = await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('hankki:v1'))
  const pick = (id) => d.recipes.find((r) => r.id === id)
  return { politeV: d.politeV, got: pick('u-gungchae')?.steps, mine: pick('u-mine')?.steps }
})

const ok = (b, msg) => console.log(`  ${b ? '✅' : '⛔'} ${msg}`)
console.log(`\n🗣 politeV = ${after.politeV}`)
console.log('\n📥 가져온 레시피 — source 가 manual 로 저장된 «실제» 모양')
for (const s of after.got || []) console.log(`   ${/요[.!~]*$/.test(s.trim()) ? '✅' : '⛔'} ${s}`)
console.log('\n✍️ 직접 쓴 레시피 (source: manual) — ⛔여긴 «안» 바뀌어야 한다')
for (const s of after.mine || []) console.log(`   ${s}`)

let bad = 0
const gotOk = (after.got || []).every((s) => /요[.!~]*$/.test(s.trim()))
const mineKept = (after.mine || []).join('|') === '대충 휘저어서 부친다.|알아서 잘 먹는다.'
console.log('')
ok(gotOk, '가져온 레시피가 전부 해요체가 됐다'); if (!gotOk) bad++
ok(mineKept, '직접 쓴 레시피는 말투가 그대로다'); if (!mineKept) bad++
ok(after.politeV === 2, 'politeV 가 저장돼 다음 실행엔 다시 안 돈다'); if (after.politeV !== 2) bad++

await browser.close()
stop()
process.exit(bad ? 1 : 0)
