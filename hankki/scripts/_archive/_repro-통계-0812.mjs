// 📊 창업자 폰 제보 재현 — *"통계는 저게다야? 우리얘기했던거있었는데"*
//
// 📄 `docs/요리기록-다이어리-방향-2026-08-05.md` §2 에서 **넷을 정해놓고 둘만** 만들어져 있었다.
//    ✅ 이번 달 몇 회 · ✅ 최애 요리  ／  ❌ 갈래별 횟수 · ❌ 이번 달 «처음» 만든 요리
//
// ⭐ 규칙 12 — 이 판을 **고치기 «전» 코드로 먼저 돌려** ②④가 ⛔ 나는 것을 확인하고 만들었다.
//    (그래야 「늘 통과하는 칸」이 아니라는 게 증명된다)
//
// ⛔⛔ `page.reload()` 로 재지 않는다 — `addInitScript` 가 저장값을 시드로 덮어써
//    **앱이 멀쩡한데 실패로 나온다**(`check-mistakes.mjs` ⑧). 새 탭으로 연다.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = 4198
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT)], { stdio: 'ignore' })
await new Promise(r => setTimeout(r, 3500))

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, timezoneId: 'Asia/Seoul' })
const 결과 = []
const 재 = (이름, 통과, 말) => { 결과.push([통과, 이름, 말]); console.log(`${통과 ? '✅' : '⛔'} ${이름} — ${말}`) }

// 📦 시드 — 「이번 달」과 「지난달」을 섞어 심는다. 그래야 «달 가르기»와 «처음인가»를 둘 다 잴 수 있다.
//   ⚠️ 날짜는 **브라우저 안에서** 만든다. Node 는 UTC 라 KST 와 하루 어긋난다(2026-08-09 사고).
//   ⛔ `s.recipes` 배열이 «반드시» 있어야 한다 — `store.jsx:78` 이 없으면 저장값을 통째로 버린다.
//   🍱 아이콘은 픽커 갈래가 갈리게 골랐다:
//      `fe_204` 면 · `fh_k02` 국·탕·찌개 · `fh_k11` 볶음·조림 · `fy_y02` 양식
const 시드 = (많이) => {
  localStorage.setItem('hankki:onboarded', '1')
  const 원래 = Storage.prototype.getItem
  Storage.prototype.getItem = function (k) { return k.startsWith('hankki:coach:') ? '1' : 원래.call(this, k) }
  const now = new Date()
  // 이번 달 5일 · 지난달 15일 (달 경계에 안 걸리는 안전한 날)
  const 이번달 = new Date(now.getFullYear(), now.getMonth(), 5, 12, 0, 0).getTime()
  const 지난달 = new Date(now.getFullYear(), now.getMonth() - 1, 15, 12, 0, 0).getTime()
  const 요리 = [
    // 지난달에 이미 만든 것 — 이번 달에 또 만들어도 «처음»이 아니다
    { id: 'd1', at: 지난달, title: '된장찌개', recipeId: 'r1' },
    { id: 'd2', at: 이번달 + 1, title: '된장찌개', recipeId: 'r1' },
    // 이번 달에 처음 만든 것들
    { id: 'd3', at: 이번달 + 2, title: '김치찌개', recipeId: 'r2' },
    { id: 'd4', at: 이번달 + 3, title: '제육볶음', recipeId: 'r3' },
    { id: 'd5', at: 이번달 + 4, title: '크림파스타', recipeId: 'r4' },
    // 지난달에만 만든 것 — 이번 달 갈래 집계에 «섞이면 안 된다»
    { id: 'd6', at: 지난달 + 1, title: '잔치국수', recipeId: 'r5' },
  ]
  const raw = localStorage.getItem('hankki:v1')
  const s = raw ? JSON.parse(raw) : {}
  s.diary = 많이 ? 요리 : 요리.slice(0, 2) // 「기록 5개 미만」 판을 재려고 잘라 쓴다
  s.recipes = [
    { id: 'r1', title: '된장찌개', icon: 'fh_k02' },
    { id: 'r2', title: '김치찌개', icon: 'fh_k02' },
    { id: 'r3', title: '제육볶음', icon: 'fh_k11' },
    { id: 'r4', title: '크림파스타', icon: 'fy_y02' },
    { id: 'r5', title: '잔치국수', icon: 'fe_204' },
  ].map((r) => ({ ...r, ingredients: ['재료 1'], steps: ['한 걸음'], category: '한식', folder: '한식', createdAt: Date.now(), updatedAt: Date.now() }))
  localStorage.setItem('hankki:v1', JSON.stringify(s))
}

const 열기 = async (많이 = true) => {
  const p = await ctx.newPage()
  p.on('pageerror', e => console.log('⛔ pageerror', String(e).slice(0, 140)))
  await p.addInitScript(시드, 많이)
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(500)
  await p.locator('.bottom-nav button', { hasText: '일기' }).first().click()
  await p.waitForTimeout(600)
  return p
}

// ─────────────────────────────────────────────
const p = await 열기()

// ⛔ 「없다」를 말하기 전에 «심은 것이 떴는지»부터 본다(규칙 18).
//    여기가 실패하면 아래 칸은 전부 「늘 통과하는 칸」이 된다.
const 글 = await p.evaluate(() => document.body.innerText)
// 시드 6건 중 이번 달은 넷(d2~d5) — 이 값이 안 맞으면 아래 칸은 전부 무의미하다
재('① 시드가 화면에 떴나', /이번 달\s*4번/.test(글) && /총\s*6개/.test(글),
  (글.match(/이번 달\s*\d+번[^\n]*/) || ['못 찾음'])[0].slice(0, 60))

// ② 갈래 줄 — 이번 달에 «뭘» 해먹었나
//    이번 달 = 된장찌개·김치찌개(국·탕·찌개 2) · 제육볶음(볶음·조림 1) · 크림파스타(양식 1)
//    ⛔ 화면 «전체» 글자로 재지 않는다 — 앨범·달력에도 요리 이름이 있어 엉뚱한 게 걸린다.
//       갈래 줄 그 자체를 집어서 읽는다.
const 갈래줄 = await p.evaluate(() => {
  const 띠 = [...document.querySelectorAll('.card')].find(c => /이번 달\s*\d+번/.test(c.innerText))
  const 줄 = 띠 && [...띠.querySelectorAll(':scope > div')].find(d => d.style.borderTop)
  return 줄 ? 줄.innerText.replace(/\s+/g, ' ').trim() : null
})
재('② 갈래별 횟수가 뜨나', !!갈래줄 && /국·탕·찌개\s*2/.test(갈래줄), 갈래줄 || '갈래 줄 없음')

// ③ 갈래는 «이번 달»만 센다 — 지난달에만 만든 잔치국수(면)가 섞이면 안 된다
//    ⛔ 줄이 «없으면» 당연히 안 섞인다 = 「늘 통과하는 칸」이 된다 → 줄이 있을 때만 통과시킨다.
재('③ 지난달 것이 갈래에 안 섞이나', !!갈래줄 && !갈래줄.includes('면'),
  갈래줄 ? `줄 = 「${갈래줄}」 · 면 갈래 없어야 한다` : '갈래 줄이 없어 잴 수 없다')

// ④ 「이번 달 처음 만든 요리」 칸
const 처음칸 = await p.evaluate(() => {
  const 제목 = [...document.querySelectorAll('.t-sub')].find(el => el.textContent.trim() === '이번 달 처음 만든 요리')
  if (!제목) return null
  const 줄 = [...제목.parentElement.querySelectorAll('button')]
  return { 개수: 줄.length, 이름: 줄.map(x => x.textContent.trim()), 그림: 줄.filter(x => x.querySelector('img,svg')).length }
})
재('④ 「이번 달 처음 만든 요리」가 뜨나', !!처음칸 && 처음칸.개수 > 0,
  처음칸 ? `${처음칸.개수}개 · ${처음칸.이름.join(',')} · 그림 ${처음칸.그림}` : '칸이 없음')

// ⑤ «처음»만 든다 — 지난달에 이미 만든 된장찌개는 빠져야 한다
재('⑤ 지난달에 만든 것은 «처음»이 아니다', !!처음칸 && !처음칸.이름.includes('된장찌개'),
  처음칸 ? (처음칸.이름.includes('된장찌개') ? '된장찌개가 들어갔다' : '된장찌개 빠짐 ✓') : '칸이 없음')

// ⑥ 지난달에만 만든 것도 «이번 달 처음»이 아니다
재('⑥ 지난달에만 만든 것도 안 든다', !!처음칸 && !처음칸.이름.includes('잔치국수'),
  처음칸 ? (처음칸.이름.includes('잔치국수') ? '잔치국수가 들어갔다' : '잔치국수 빠짐 ✓') : '칸이 없음')

// ⑦ 갓 시작한 사람(기록 5개 미만)에겐 처음 칸을 «안» 띄운다 — 앨범과 똑같아지기 때문
//    ⛔ 기능이 «아예 없어도» 통과한다 = 「늘 통과하는 칸」 → ④(많을 땐 떴다)와 «짝으로» 판정한다.
const p2 = await 열기(false)
const 적을때 = await p2.evaluate(() => document.body.innerText.includes('이번 달 처음 만든 요리'))
const 많을때 = !!처음칸 && 처음칸.개수 > 0
재('⑦ 기록이 적으면 처음 칸을 «안» 띄운다', 많을때 && !적을때,
  !많을때 ? '많을 때도 안 떠서 잴 수 없다' : 적을때 ? '떴다(뜨면 안 된다)' : '기록 2개 — 안 뜸 ✓')

// ⑧ 회귀 — 원래 있던 통계 넷은 그대로인가
재('⑧ 옛 통계가 안 깨졌나(회귀)', /총\s*6개/.test(글) && /최애\s*된장찌개/.test(글),
  (글.match(/총\s*6개[^\n]*/) || ['못 찾음'])[0].slice(0, 60))

console.log('\n' + '─'.repeat(50))
const 통과 = 결과.filter(r => r[0]).length
console.log(`통과 ${통과} / ${결과.length}`)
await b.close(); srv.kill(); process.exit(통과 === 결과.length ? 0 : 1)
