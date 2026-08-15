// 🔬 홈 「우리집레시피」 박스가 «저장값과 무관하게» 뜨나 (2026-08-12)
//   📮 창업자 *"홈에 내레시피 아직 안올라왔어"* → *"근데 그거랑 무관하게 떠야할듯해"*
//   ⛔ 뿌리 = `migrateBasics` 가 「같은 제목이 이미 있으면 안 넣는다」인데,
//      우리집레시피는 창업자가 «실제로 해먹는» 요리라 창업자 폰엔 이미 있다 → 시드가 안 들어옴.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const 셈 = { ok: 0, ng: 0 }
const 봄 = (c, m) => { console.log(`   ${c ? '✅' : '⛔'} ${m}`); c ? 셈.ok++ : 셈.ng++ }
const srv = spawn('python3', ['-m', 'http.server', '4205', '-d', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const 판 = [
  ['둘 다 내 레시피로 있다 (창업자 폰)', [{ id: 'my-1', title: '닭곰탕' }, { id: 'my-2', title: '오이물김치' }]],
  ['하나만 있다', [{ id: 'my-1', title: '닭곰탕' }]],
  ['아무것도 없다 (새 폰)', []],
  ['둘 다 지웠다', 'dead'],
]
for (const [이름, mine] of 판) {
  const pg = await b.newPage({ viewport: { width: 411, height: 891 }, timezoneId: 'Asia/Seoul' })
  await pg.addInitScript((mine) => {
    localStorage.setItem('hankki:onboarded', '1')
    for (const k of ['home3', 'detail', 'shop', 'profile', 'myrecipes', 'brag', 'diary']) localStorage.setItem(`hankki:coach:${k}`, '1')
    const 지움 = mine === 'dead'
    localStorage.setItem('hankki:v1', JSON.stringify({
      seedV: 56,
      removedSeedIds: 지움 ? ['basic-dakgomtang', 'basic-oi-mul-kimchi'] : [],
      recipes: (지움 ? [] : mine).map((m, i) => ({ ...m, ingredients: ['재료 1개'], steps: ['해요'], savedAt: Date.now() - i * 1000 })),
    }))
  }, mine)
  await pg.goto('http://localhost:4205/', { waitUntil: 'networkidle' })
  await pg.waitForTimeout(1400)
  const t = await pg.evaluate(() => document.querySelector('.screen')?.innerText || '')
  const 뜸 = /우리집레시피[\s\S]{0,80}일상에서 자주/.test(t)
  // ⛔ 지운 것은 «안 떠야» 맞다 — 유저가 일부러 지운 뜻을 존중한다(원본 폴백을 안 하는 이유).
  const 기대 = mine !== 'dead'
  봄(뜸 === 기대, `${이름} → 홈 박스 ${뜸 ? '뜬다' : '안 뜬다'} (기대 ${기대 ? '뜬다' : '안 뜬다'})`)
  await pg.close()
}
await b.close(); srv.kill()
console.log(`\n${셈.ng ? '⛔' : '✅'} ${셈.ok}칸 통과 · ${셈.ng}칸 실패`)
process.exit(셈.ng ? 1 : 0)
