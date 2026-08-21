// 💬💬 탭 상단 「캐릭터 대사」 시안 — 실물 앱에 붙여 찍는다 (2026-08-21)
//
// 📮 창업자 2026-08-20 = *"각 탭의 기능설명도 캐릭터들이 위트있게 해주고 그런게 필요할 것 같은데"*
// 📮 2026-08-21 = *"우리탭의 설명?? 좋아 근데 어디서 어떻게 적용할거야?"* → *"시안보자"*
//
// 🔢 실측 — 탭 설명은 «이미 세 겹»이다 (⛔넷째를 얹으면 잔소리가 된다)
//   ① 안내 코치 14개(첫 방문) = `label ＋ desc`  — HomeScreen:91~97 · MyRecipesScreen:37~50 · BragScreen:28~29
//   ② `TabTips`(탭마다 「?」 · 상시) = `title ＋ items[]` — home/search/myrecipes/log/…
//   ③ 탭 상단 설명 줄 — **가져오기·레꾸자랑에만** 있다
//      · 가져오기 「레시피를 가져오는 방법을 선택해 주세요.」
//      · 레꾸자랑 「내 레시피를 …자랑하고, 표지로도 저장해요.」
//   ⭐ 그래서 이 판은 **③이 «비어 있는» 넷**만 본다 = 홈 · 레시피 · 일기 · 장보기
//
// ⭐⭐ 왜 「설명」이 아니라 「대사」인가
//   · 설명(40자)은 한 번 읽으면 필요 없어지고 매일 보면 잔소리가 된다
//   · 대사(9자)는 짧고 캐릭터가 말하니 매일 봐도 귀엽다
//   📌 2026-08-20 냉장고 문구에서 얻은 것과 같은 판단 —
//      「이 화면엔 영수증 얘기가 이미 셋이다 → 넷째를 얹으면 잔소리」
//
// ⛔⛔⛔ [2026-08-21 창업자가 잡았다] **홍보 문구를 앱에 그대로 옮기면 안 된다.**
//   📮 창업자 = *"남의 요리책 말고. 무슨말일까 싶어.."*
//   ⭐ 그 문구는 시안 「월간 오늘의 한끼」에서 가져온 것인데 거기선 **뒷줄이 받아줬다** —
//      「남의 요리책 말고」 → **「내가 진짜 해 먹는 요리책」**.
//   ⛔ 앱에선 **한 줄만 뚝 떨어져** 있어 앞뒤가 없다 → 「뭐라는 거야?」가 된다.
//   ✅ **잣대 = 「한 줄로 뜻이 닫히나」** — 앞뒤 설명 없이 그 자리에서 이해돼야 한다.
//      닫힘 ✅ 「냉장고 열고 5분째야.」·「오늘도 한 끼 해냈다.」·「또 두부 샀네.」
//      안 닫힘 ⛔ 「남의 요리책 말고.」 → **「찾던 거, 여기 있어.」**로 바꿈
//   📌 **홍보 = 대비·반전이 먹힌다(맥락을 같이 준다) / 앱 = 한 줄로 닫혀야 한다(매일 본다).**
//
// 🎭 캐릭터 배정 = 앱이 «이미» 정해 놓은 것을 따른다(실측)
//   🐧 펭펭 = 실무·해결 (가져오기 pn_search · 레시피 peng_nyam1 · 장보기 pn_shoplist)
//   🐻 꼬르곰 = 감정·자랑 (레꾸자랑 gom_proud · 상세 gom_heart · 편집 gom_pot)
//   ⛔ 펭펭을 웃기지 말 것 — 무표정. 짧고 툭 던지는 말만.
//
// ⛔ 이건 «시안»이다 — 앱 소스는 한 줄도 안 고친다. 브라우저에서 DOM 만 바꿔 찍는다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-탭대사-0821.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/탭대사'
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
await new Promise((r) => srv.listen(4396, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 💬 탭 넷 × 대사 셋 — ⭐표시가 클로드 추천
const 탭들 = [
  { 이름: '1-홈', 하단: '홈', 대사: ['냉장고 열고 5분째야.', '또 그거 먹을 뻔했다.', '고민 그만. 여기 있어.'] },
  { 이름: '2-레시피', 하단: '레시피', 대사: ['남의 요리책 말고.', '다 여기 있어. 안 잃어버려.', '이거 내가 만든 거야!'] },
  { 이름: '3-일기', 하단: '일기', 대사: ['오늘도 한 끼 해냈다.', '어제 뭐 먹었더라…', '잘한 날은 적어두자.'] },
  { 이름: '4-장보기', 하단: '장보기', 대사: ['또 두부 샀네.', '없는 것만. 두 번 사지 마.', '뭐 있는지 다 알아… 근데 졸려.'] },
]

// 🎨 갈래 셋 — 같은 대사를 «어떻게» 놓느냐
const 갈래 = [
  { 이름: 'a-지금', 설명: '지금 (대사 없음)', 스타일: null },
  { 이름: 'b-말풍선', 설명: '말풍선', 스타일: 'bubble' },
  { 이름: 'c-한줄', 설명: '제목 아래 회색 한 줄', 스타일: 'line' },
]

const 결과 = []
for (const 탭 of 탭들) {
  for (const g of 갈래) {
    const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
    await page.addInitScript(SEED_COACH_SEEN)
    await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
    page.on('pageerror', (e) => console.log('  ⚠️', String(e.message || e).split('\n')[0]))
    await page.goto('http://127.0.0.1:4396/hankki/', { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(700)

    // 하단 탭으로 이동
    if (탭.하단 !== '홈') {
      await page.evaluate((이름) => {
        const 칸 = [...document.querySelectorAll('.bottom-nav .nav-item')]
          .find((e) => ([...e.querySelectorAll('span')].pop()?.textContent || '').trim() === 이름)
        if (칸) 칸.click()
      }, 탭.하단)
      await page.waitForTimeout(600)
    }

    const 잰값 = await page.evaluate(({ 스타일, 대사 }) => {
      const 제목 = document.querySelector('.h-title')
      if (!제목) return { 오류: '.h-title 을 못 찾았다' }

      // ⛔⛔ [2026-08-21 첫 판 사고] `제목.parentElement` 뒤에 넣었더니 «옆»으로 갔다 —
      //    그건 «가로 flex 줄»이라 형제를 옆에 세운다. 레시피 탭에서 제목이 「레/시/피」로 쪼개졌다.
      //    ✅ 상단바 «전체»(화면 폭을 다 쓰는 조상)를 찾아 그 «다음»에 넣어야 아래로 간다.
      const 폭 = document.querySelector('.screen')?.clientWidth || window.innerWidth
      let 바 = 제목.parentElement
      while (바 && 바.parentElement && 바.getBoundingClientRect().width < 폭 - 60) 바 = 바.parentElement
      const 앞높이 = 바?.getBoundingClientRect().height || 0
      const 화면 = document.querySelector('.screen')
      if (!스타일) {
        return { 앞: 앞높이, 뒤: 앞높이, 가로넘침: 화면 ? Math.max(0, 화면.scrollWidth - 화면.clientWidth) : 0, 제목: 제목.textContent.trim(), 바: 바?.className || '(없음)' }
      }

      const d = document.createElement('div')
      if (스타일 === 'bubble') {
        // 💬 말풍선 — 캐릭터가 말하는 것처럼. 제목 «아래», 캐릭터 쪽에 붙여 왼쪽 정렬
        const s = document.createElement('span')
        s.textContent = 대사[0]
        s.style.cssText = 'display:inline-block;padding:6px 12px;border-radius:14px 14px 14px 4px;'
          + 'background:var(--cream);color:var(--text-sub);font-size:12.5px;font-weight:700;letter-spacing:-.02em'
        d.appendChild(s)
        d.style.cssText = 'padding:0 20px;margin:2px 0 6px'
      } else {
        // 📏 회색 한 줄 — 가져오기·레꾸자랑과 같은 결
        d.textContent = 대사[0]
        d.style.cssText = 'padding:0 20px;margin:0 0 6px;font-size:12.5px;color:var(--text-sub);letter-spacing:-.02em'
      }
      바?.after(d)

      return {
        앞: 앞높이,
        뒤: (바?.getBoundingClientRect().height || 0) + d.getBoundingClientRect().height,
        가로넘침: 화면 ? Math.max(0, 화면.scrollWidth - 화면.clientWidth) : 0,
        제목: 제목.textContent.trim(),
        바: 바?.className || '(없음)',
      }
    }, { 스타일: g.스타일, 대사: 탭.대사 })

    await page.waitForTimeout(250)
    // 상단만 크게 — 창업자가 폰에서 본다
    await page.screenshot({ path: join(OUT, `${탭.이름}-${g.이름}-위.png`), clip: { x: 0, y: 0, width: 390, height: 190 } })
    await page.screenshot({ path: join(OUT, `${탭.이름}-${g.이름}-전체.png`) })

    결과.push({ 탭: 탭.이름, 갈래: g.설명, ...잰값 })
    console.log(`  ${탭.이름.padEnd(10)} ${g.설명.padEnd(18)} 제목「${잰값.제목}」 줄높이 ${잰값.앞}→${잰값.뒤}px · 가로넘침 ${잰값.가로넘침 ?? '-'}`)
    await page.close()
  }
}

await b.close(); srv.close()
console.log(`\n📁 ${OUT}`)
console.log('⛔ 창업자에게 보내기 전에 내가 «열어서» 본다 (절대원칙 21)')
