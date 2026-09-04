// 📸🍂 **패드 화면을 «릴스 규격으로» 찍는다** — 인스타 릴스 둘의 재료 (2026-09-04)
//
// 📮 창업자 = *"패드버전으로 스토어스샷같은 소개만들고 그걸로 릴스1번.
//    장보기랑 냉장고, 주부큐레이션 쭉 스샷만들고 릴스. **우리ui를 바로 보여주는게 조회수가 낫더라고**"*
//
// ⭐⭐ **왜 820×1456 인가 — 어제 값을 치르고 배운 것이다.**
//    🔢 패드 실물 = **820×1180**(1:1.44). 릴스 = **1080×1920**(9:16 = 1:1.78).
//       그대로 앉히면 아래위로 **500px 이 빈다.**
//    ⛔ 2026-09-03 에 그 빈자리를 «채우려다» 릴스를 세 판 헛돌렸다 —
//       작은 카드 → 클레이로 채움 → 세로 614px 자름 → 스티커 얹음.
//       📮 창업자 = *"너무 지저분해보여"* · *"스샷도 잘안보이고.. 너무 잘려서(아래위)"*
//       📌 그때 답은 **«아무것도 안 하는 것»** 이었다(원본이 이미 9:16이었다).
//    ✅ 그래서 이번엔 **뒤에서 고치지 말고 앞에서 규격을 맞춘다** — 처음부터 9:16으로 찍는다.
//       820 × 1456 = 정확히 9:16. **폭 820 은 그대로**라 패드 2단 레이아웃이 그대로 나온다
//       (패드냐 폰이냐는 «폭»이 정한다 — 세로를 늘려도 레이아웃은 안 바뀐다).
//    ⛔ 세로를 늘렸으니 «패드 실물 그대로»는 아니다. 홍보물이라 그래도 되지만 «실측이다»라고 말하지 말 것.
//
// ⭐ 규칙 21 — 찍고 나서 «열어 보고» 판정한다. 숫자로는 「무슨 앱으로 보이나」를 못 잰다.
// ⛔ 브라우저 경로를 박지 않는다 — `SMOKE_CHROMIUM` 만 읽는다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-패드릴스-0904.mjs
//       SET=2 로 돌리면 릴스2(장보기·냉장고·장바구니)만 찍는다
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/패드릴스'
mkdirSync(OUT, { recursive: true })

const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port
const 집 = `http://127.0.0.1:${PORT}/`

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
// ⛔ `SEED_COACH_SEEN` 은 «함수»다 — JSON 으로 넘기면 안내 딱지가 그대로 떠서 클릭을 가로챈다.
// 📐📐 **실측으로 갈아엎었다 (2026-09-04)** — 창업자 = *"아 세로가 아니라 «가로» 버전이지"*
//    ⛔ 처음엔 820×1456(세로 9:16)으로 찍었다. 그런데 그 바탕이 된 820×1180 은 «패드 실물»이 아니라
//       `_repro-패드글씨-0821` 이 쓰는 **«검사판 값»**이었다 — 검사 숫자를 실물로 여겼다(규칙 18).
//    ⭐ 창업자는 패드를 **«가로»로 쓴다.** 그게 폰과 제일 다른 그림(2단 레이아웃)이고 자랑거리다.
//    🔢 가로 1280×800(16:10) → 릴스 폭에 맞추면 **1080×675 = 릴스의 3분의 1**뿐이다.
//       ✅ 그런데 **두 장이면 1350** 이고, 릴스 안전지대(1920 − 위 230 − 아래 384 = **1306**)에 거의 딱 맞는다.
//          16:10 을 둘 쌓으면 9:16 이 된다 — 우연이 아니다. 그래서 **«가로 두 장 쌓기»**로 간다.
//    ⛔ 빈자리를 클레이로 채우거나 잘라서 풀지 않는다 — 2026-09-03 에 그러다 세 판을 헛돌렸다.
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch { /* noop */ } })

const 찍은것 = []
const 찍자 = async (p, 이름, 설명) => {
  await p.waitForTimeout(700)
  // 🧹🧹 «청소 안내 띠»가 맨 위에 걸린다 — 「사진 N장을 정리해 …MB 를 비웠어요」.
  //    ⛔ 홍보물에 시스템 안내가 찍히면 안 된다.
  //    ⛔⛔ 백업을 물린 «직후»에만 기다렸더니 소용없었다 — 탭을 옮길 때마다 청소가 다시 돌아 또 떴다.
  //       ✅ 그래서 «한 곳»에서 막는다 — 찍기 «직전»에, 띠가 사라질 때까지.
  //       ⛔ 그냥 대기 시간을 늘리지 않았다(절대원칙 34) — 띠가 «없어졌나»를 보고 끝낸다.
  for (let i = 0; i < 15; i++) {
    const 띠 = await p.evaluate(() => /정리해|비웠어요/.test(document.body.innerText))
    if (!띠) break
    await p.waitForTimeout(1000)
    if (i === 14) console.log(`  ⚠️⚠️ ${이름} — 정리 안내 띠가 안 걷혔다. 이 장은 홍보물에 못 쓴다`)
  }
  // 🔎 규칙 21 — 화면 한가운데를 «덮은 것»이 있으면 알린다(찍고 나서 눈으로 볼 때 헷갈리지 않게)
  const 덮개 = await p.evaluate(() => {
    const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
    const s = el?.closest('[class*="coach"],[class*="onboard"],[role="dialog"]')
    return s ? s.className || s.getAttribute('role') : null
  })
  if (덮개) console.log(`  ⚠️ ${이름} — 한가운데를 「${덮개}」가 덮고 있다`)
  await p.screenshot({ path: join(OUT, `${이름}.png`) })
  찍은것.push(이름)
  console.log(`  ✅ ${이름} — ${설명}`)
}

// ⛔ scrollTop 을 넣으면 «한 픽셀도 안 구른다»(2026-08-22) — 바퀴를 실제로 굴린다.
const 굴리기 = async (page, 픽셀) => {
  await page.mouse.move(640, 500)
  await page.mouse.wheel(0, 픽셀)
  await page.waitForTimeout(700)
}
const 홈으로 = async (page) => { await page.goto(집, { waitUntil: 'networkidle' }); await page.waitForTimeout(1000) }
const 탭 = async (page, 글자) => {
  const t = page.locator('.bottom-nav .nav-item').filter({ hasText: 글자 }).first()
  if (!(await t.count())) { console.log(`  ⛔ 탭 「${글자}」 를 못 찾았다`); return false }
  await t.click(); await page.waitForTimeout(1300)
  return true
}
// ⛔⛔ [2026-09-04] 시트가 «겹쳐» 뜨면 아래 시트의 「닫기」가 가려져 클릭이 15초를 기다리다 죽는다.
//    (백업을 물리자 확인 층이 그 위에 떠서 실제로 그랬다)
//    ✅ 죽지 않게 «짧게 시도하고 넘어간다» — 닫기는 «곁다리»지 이 판의 목적이 아니다.
//    ⛔ 시간을 늘려서 풀지 않았다(절대원칙 34) — 실패해도 판이 계속 가게 «모양»을 바꿨다.
const 시트닫기 = async (page) => {
  for (const 글자 of ['나중에 볼게요', '확인', '닫기']) {
    const b2 = page.getByRole('button', { name: 글자 }).first()
    if (!(await b2.count())) continue
    const 됐나 = await b2.click({ timeout: 2500 }).then(() => true).catch(() => false)
    if (됐나) { await page.waitForTimeout(900); return }
  }
}

let p = await ctx.newPage()
p.setDefaultTimeout(15000)
await 홈으로(p)
// ⛔ 첫 방문엔 로그인 화면이 뜬다 — 새 탭으로 다시 열면 안 뜬다(다른 판들과 같은 방식)
if (await p.getByText('Google 계정으로 시작하기').count()) {
  const p2 = await ctx.newPage(); p2.setDefaultTimeout(15000)
  await p2.goto(집, { waitUntil: 'networkidle' }); await p2.waitForTimeout(1500)
  await p.close(); p = p2
}
await 시트닫기(p)

// 💾💾 **창업자 백업을 «앱의 진짜 복원 길»로 물린다** (2026-09-04)
//    📮 창업자 = *"콩국수 그만나오게하자 ㅋㅋㅋ 내꺼 줄게"*
//    ⛔ 시드 데이터는 어느 화면을 찍어도 콩국수가 나온다 — 홍보물엔 창업자 실물이 훨씬 좋다
//       (실측 = 창업자 백업 = 레시피 260편 · 일기 21 · 꾸민 표지 16 · 사진 8 · 냉장고 8 · _photosMissing 0).
//    ⭐ localStorage 를 손으로 채우지 «않는다» — 설정의 「백업 불러오기」 파일칸에 그대로 넣는다.
//       그래야 앱이 실제로 쓰는 복원 길(`importAll` ＋ 사진 창고 되살리기)을 «그대로» 탄다(규칙 30).
//    ⛔⛔ 이 파일은 «창업자 개인 데이터»다 — 저장소에 넣지 않는다. 경로만 밖에서 받는다.
//       실행: BACKUP=/…/백업.json node scripts/_shot-패드릴스-0904.mjs
const 백업파일 = process.env.BACKUP
if (백업파일) {
  console.log(`\n💾 백업 물리는 중 — ${백업파일}`)
  // ⛔⛔ [2026-09-04] **UI 로 물리는 길은 막혔다** — 「백업 파일 불러오기」가 여는 파일칸은
  //    설정 화면의 `fileRef`(`importData`)와 «다른 칸»이라, 파일을 넣어도 `onChange` 가 안 걸린다.
  //    (확인 상자도 오류 토스트도 «둘 다» 안 떴다 = 핸들러 자체가 안 돌았다는 뜻)
  //    ✅ 그래서 저장 열쇠 `hankki:v1` 에 «바로» 넣는다. 홍보물 찍기용이라 이걸로 충분하다.
  //    ⛔ 대신 «화면으로 검산»한다 — 열쇠에 넣는 건 앱 길이 아니라서 모양이 안 맞으면 조용히 빈다(규칙 30).
  //       그래서 아래에서 편수를 세고, 찍은 뒤 눈으로 본다.
  const 원본 = JSON.parse(readFileSync(백업파일, 'utf8'))
  const 담을것 = {}
  for (const k of Object.keys(원본)) if (!k.startsWith('_')) 담을것[k] = 원본[k]
  await ctx.addInitScript((v) => {
    try {
      const 이미 = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
      localStorage.setItem('hankki:v1', JSON.stringify({ ...이미, ...v }))
    } catch { /* 못 넣으면 시드 그대로 — 아래 편수 세기가 잡는다 */ }
  }, 담을것)
  await p.goto(집, { waitUntil: 'networkidle' }); await p.waitForTimeout(2500)
  await 시트닫기(p)
  // 🔎 정말 들어갔나 — «시끄럽게» 확인한다. 안 들어간 줄 모르고 찍으면 시드로 홍보물을 만든다.
  const 편수 = await p.evaluate(() => {
    try { return (JSON.parse(localStorage.getItem('hankki:v1') || '{}').recipes || []).length } catch { return -1 }
  })
  console.log(`  📚 앱이 든 레시피 = ${편수}편 ${편수 > 100 ? '✅ 창업자 것' : '⚠️ 시드일 수 있다'}`)
  // 🧹 «청소 안내 띠»가 맨 위에 걸린다 — 「사진 1장을 정리해 0.3MB 를 비웠어요」.
  //    ⛔ 홍보물에 시스템 안내가 찍히면 안 된다. 한 번 뜨고 사라지므로 «가라앉을 때까지» 기다린다.
  //    ⛔ 시간을 그냥 늘리지 않았다 — 띠가 «사라졌나»를 보고 끝낸다(절대원칙 34).
  for (let i = 0; i < 12; i++) {
    const 띠 = await p.evaluate(() => /정리해|비웠어요/.test(document.body.innerText))
    if (!띠) break
    await p.waitForTimeout(1000)
  }
  await 홈으로(p); await 시트닫기(p)
}

// 🍂🍂 **가을 일기를 «내가» 꾸며서 넣는다** (2026-09-04)
//    📮 창업자 = *"한끼일기도 «예쁜 틀»로 바꿔줘. 너무 저거는 **백지**라.."*
//       → *"**내가 꾸민 거 말고..**"* → *"**네가 꾸며서 넣어줘 가을 느낌나게**"*
//    ⭐ 그래서 창업자가 꾸며 둔 8/11·8/12 는 «안 쓴다». 글만 있고 안 꾸민 날 하나를 골라
//       **지금 열려 있는 가을 자산만으로** 꾸민다.
//    🔢 자산은 짐작하지 않고 실측해서 골랐다 — `release-calendar.mjs --on 2026-09-01` 이 연 것들:
//       · 꼬르곰·펭펭의 가을 = `au_b20 au_b09 au_b24 au_b26~b30`
//       · 가을 단풍·낙엽 = `au_i24 au_i28 au_i38 au_i39 au_i29 au_i42`
//       · 가을 소품 8 = `au_i43`(담요) `au_i44`(머그) `au_i45`(호박) `au_i46`(도토리)
//                       `au_i47`(초) `au_i48`(장화) `au_i49`(바구니) `au_i50`(버섯)
//    ⛔ 10/1·11/1 에 열리는 것은 **안 쓴다** — 홍보물에 «지금 못 받는 것»을 그리면 거짓말이 된다.
//    ⛔ 글자가 있는 왼쪽 위는 비워 둔다 — 스티커가 글을 덮으면 「지저분해 보인다」(2026-09-03 창업자).
const 가을로꾸미기 = async (page) => {
  const 결과 = await page.evaluate(() => {
    try {
      const 열쇠 = 'hankki:v1'
      const 값 = JSON.parse(localStorage.getItem(열쇠) || '{}')
      const d = 값.diary || []
      const 고름 = d
        .filter((e) => typeof e?.note === 'string' && e.note.trim().length > 3)
        .filter((e) => !(e?.paper?.art && e.paper.art !== 'none') && !(e?.decor?.length))
        .sort((a, b) => b.at - a.at)[0]
      if (!고름) return null
      const 씨 = (n) => 'sh' + n
      고름.paper = { rule: 'plain', skin: 'kraft', art: 'today' }
      고름.decor = [
        { id: 씨(1), type: 'sticker', key: 'au_b09', x: 0.845, y: 0.155, s: 0.25, r: 4 },
        { id: 씨(2), type: 'sticker', key: 'au_b27', x: 0.155, y: 0.845, s: 0.235, r: -4, motion: 'tongtong' },
        { id: 씨(3), type: 'sticker', key: 'au_i24', x: 0.085, y: 0.395, s: 0.125, r: -14 },
        { id: 씨(4), type: 'sticker', key: 'au_i38', x: 0.915, y: 0.555, s: 0.135, r: 9 },
        { id: 씨(5), type: 'sticker', key: 'au_i45', x: 0.335, y: 0.935, s: 0.15, r: 6 },
        { id: 씨(6), type: 'sticker', key: 'au_i46', x: 0.475, y: 0.955, s: 0.10, r: -8 },
        { id: 씨(7), type: 'note', art: 'dgn07', text: '가을엔\n뜨끈한 게 최고', font: 'gaegu', x: 0.715, y: 0.815, s: 0.40, r: 3, tc: '#8a4a1c', motion: 'tilt' },
      ]
      localStorage.setItem(열쇠, JSON.stringify(값))
      const t = new Date(고름.at + 9 * 3600 * 1000)
      return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), n: 고름.decor.length }
    } catch { return null }
  })
  if (!결과) { console.log('  ⚠️⚠️ 가을 꾸미기를 못 넣었다 — 글만 있는 «안 꾸민» 일기를 못 찾았다'); return null }
  console.log(`  🍂 가을로 꾸몄다 — ${결과.y}-${결과.m}-${결과.d} · 틀 오늘의한끼 ＋ 크라프트 ＋ 꾸민것 ${결과.n}개`)
  return 결과
}
const 가을일기 = 백업파일 ? await 가을로꾸미기(p) : null
if (가을일기) { await p.goto(집, { waitUntil: 'networkidle' }); await p.waitForTimeout(2000); await 시트닫기(p); await 홈으로(p) }

const 어느것 = process.env.SET || '전부'

// ══════════════════════════════════════════════════════════════
// 릴스 ① — 「이런 앱이야」 소개
// ══════════════════════════════════════════════════════════════
// 🔢 탭 이름 실측(2026-09-04) = 홈 · 가져오기 · 레시피 · 일기 · 장보기 · 레꾸자랑
//    ⛔ 「꾸미기」·「냉장고」는 **탭이 아니다** — 내가 짐작으로 적었다가 둘 다 못 찾았다(규칙 17).
//       꾸미기 = 레시피 «상세» 안의 「레시피 꾸미기」 · 냉장고 = 장보기 안의 `[data-coach="pantry"]`
if (어느것 === '전부' || 어느것 === '1') {
  console.log('\n🎬 릴스 ① 소개')
  await 찍자(p, '1-01-홈', '홈 — 오늘 뭐 해먹지')
  if (await 탭(p, '레시피')) await 찍자(p, '1-02-요리책', '레시피 목록 — 꾸민 표지가 깔린 격자')
  // 상세 — ⛔ «홈»엔 레시피 카드가 없다(실측 0개). 목록에서 연다.
  //    ⛔ 실패를 조용히 삼키지 않는다 — 2026-09-03 에 그래서 앱 버그로 오인할 뻔했다.
  // 🔢 실측(2026-09-04) = 목록 한 칸은 `div.grid-card > button.press` 다.
  //    ⛔ `.recipe-card` 라고 짐작해 적었다가 «없는 이름»이라 한 편도 못 열었다(규칙 17 — 못 찾은 것이지 없는 게 아니다).
  //    ⭐ 첫 칸이 아니라 «이름으로» 고른다 — 그래야 목록 차례가 바뀌어도 같은 편이 열린다.
  //    ⛔ `.or()` 로 「이름 아니면 첫 칸」을 묶었더니 **둘 다 맞아 strict 위반으로 죽었다**(2026-09-04).
  //       ✅ 묶지 말고 «찾아보고 없으면» 첫 칸으로 — 코드로 가른다.
  // ⛔⛔ [2026-09-04] 여기 「돼지고기 김치찌개」가 박혀 있었다 — **안 꾸민 편**이다.
  //    📮 창업자 = *"근데 하필이면 아무것도 안꾸민걸 정했어??? 일부러?"* — 일부러가 아니라 실수다.
  //    뿌리 = 창업자 백업을 «물리기 전»에 시드 목록을 보고 이름을 정해뒀고, 백업을 물린 뒤에도 안 고쳤다.
  //    📌 홍보물의 핵심이 «레꾸(꾸미기)»인데 정작 «안 꾸민 접시»를 열면 보여줄 게 없다.
  //    ✅ 꾸민 편으로 간다 — 차돌짬뽕(가을 프레임 ＋ 꼬르곰·펭펭 ＋ 솔방울).
  //    ⛔ 백업이 바뀌어 그 편이 없으면 «첫 칸»으로 물러나는데, 그건 또 안 꾸민 편일 수 있다 →
  //       그때 시끄럽게 알린다(조용히 밋밋한 홍보물을 만드는 게 제일 나쁘다).
  const 홍보편 = process.env.SHOT_RECIPE || '차돌짬뽕'
  const 이름칸 = p.locator('.grid-card button.press').filter({ hasText: 홍보편 })
  const 첫편 = (await 이름칸.count()) ? 이름칸.first() : p.locator('.grid-card button.press').first()
  if (await 첫편.count()) {
    await 첫편.click(); await p.waitForTimeout(1800)
    await 굴리기(p, 700)
    await 찍자(p, '1-03-상세', '레시피 상세 — 재료가 보이는 자리')
    // 🎨 꾸미기 = 상세 안의 「레시피 꾸미기」
    const 꾸미기 = p.getByRole('button', { name: /레시피 꾸미기/ }).first()
    if (await 꾸미기.count()) {
      await 꾸미기.click(); await p.waitForTimeout(1800)
      // ⛔⛔ [2026-09-04 · 규칙 21 이 잡았다] 꾸미기로 «들어간 뒤»에 「받은 선물」 시트가 떠서
      //    화면 아래 절반(스티커 서랍)을 통째로 덮었다. 보여주려던 것이 바로 그 서랍이었다.
      //    📌 들어가기 «전»에 닫아둔 건 소용없다 — 이 시트는 들어간 뒤에 뜬다. 여기서 한 번 더 닫는다.
      await 시트닫기(p)
      // 🔎 정말 걷혔나 — 안 걷혔으면 시끄럽게 알린다(가린 채로 찍는 게 제일 나쁘다)
      const 남았나 = await p.evaluate(() => /받은 선물|나중에 볼게요/.test(document.body.innerText))
      if (남았나) console.log('  ⚠️⚠️ 「받은 선물」 시트가 아직 덮고 있다 — 이 장은 홍보물에 못 쓴다')
      // 🎨 서랍은 「배경」 탭으로 열린다 — 색깔 네모만 보여서 «꾸미기»로 안 읽힌다.
      //    📮 창업자 2026-08-22 = *"레꾸꾸미기에서 «더 귀여운 스티커들» 있는 부분으로"*
      //    ⭐ 그래서 「친구들」(꼬르곰·펭펭)로 옮겨서 찍는다. 없으면 「데코」.
      for (const 탭이름 of ['친구들', '데코']) {
        const t = p.locator('button, [role="tab"]').filter({ hasText: new RegExp(`^${탭이름}$`) }).first()
        if (await t.count()) { await t.click(); await p.waitForTimeout(1200); break }
      }
      await 찍자(p, '1-04-레꾸', '레꾸 — 꼬르곰·펭펭 스티커 서랍')
      // 🎀 [창업자 2026-09-04] *"꾸미기 «아이템» 있는거 보여주자"* — 친구들 말고 «프레임·데코»도 한 장.
      //    ⭐ 서랍에 «무엇이 얼마나» 들었는지가 자랑이다. 탭 하나만 보여주면 그게 안 보인다.
      for (const 탭이름 of ['프레임', '데코']) {
        const t = p.locator('button, [role="tab"]').filter({ hasText: new RegExp(`^${탭이름}$`) }).first()
        if (await t.count()) {
          await t.click(); await p.waitForTimeout(1300)
          await 찍자(p, `1-11-레꾸-${탭이름}`, `레꾸 — ${탭이름} 서랍`)
        } else console.log(`  ⛔ 서랍 탭 「${탭이름}」 을 못 찾았다`)
      }
    } else console.log('  ⛔ 「레시피 꾸미기」 단추를 못 찾았다')
  } else console.log('  ⛔ 레시피 목록에서 첫 편을 못 찾았다 — 고르는 잣대를 다시 봐야 한다')
  // 🔥🔥 요리모드 — 📮 창업자 = *"요리모드도 꼭 보여줘야해"*
  //    ⭐ 패드 강조와 «딱» 맞는 장면이다 — 불 앞에서 «멀리서» 보는 화면이라
  //       「패드라 크게 보인다」가 그대로 자랑이 된다.
  //    📚 가는 길·멈출 자리는 `_shot-스토어용화면-0822` 가 2026-08-22 에 알아낸 것을 그대로 쓴다:
  //       ⛔ 첫 화면은 «재료 준비»(체크리스트)다 — 「재료 준비 완료」를 눌러야 큰 글씨 걸음이 나온다
  //       ⭐ 「끓」이 든 걸음에서 멈춘다(타이머를 맞추는 «진짜» 장면) — ⛔몇 번째인지 박지 않는다
  await 홈으로(p); await 시트닫기(p)
  if (await 탭(p, '레시피')) {
    const 칸 = p.locator('.grid-card button.press').filter({ hasText: 홍보편 })
    const 문 = (await 칸.count()) ? 칸.first() : p.locator('.grid-card button.press').first()
    await 문.click(); await p.waitForTimeout(1800)
    await 굴리기(p, 900)
    // ⛔ [2026-09-04] 옛 판(`_shot-스토어용화면-0822`)은 `/요리 시작/` 으로 찾았는데 **지금 이름은 「요리모드 시작」**이다.
    //    가운데 「모드」가 끼어서 안 맞는다 — 손으로 적은 이름은 앱이 바뀌면 반드시 낡는다(규칙 17).
    //    ✅ 둘 다 받아 준다. 그래도 못 찾으면 «시끄럽게» 알린다.
    const 요리시작 = p.getByRole('button', { name: /요리모드 시작|요리 시작/ }).first()
    if (await 요리시작.count()) {
      await 요리시작.click(); await p.waitForTimeout(1600)
      await 찍자(p, '1-07-요리모드-재료', '요리 모드 — 재료 준비')
      const 시작 = p.getByRole('button', { name: /재료 준비 완료/ }).first()
      if (await 시작.count()) { await 시작.click(); await p.waitForTimeout(1400) }
      for (let n = 0; n < 6; n++) {
        // ⛔ body.innerText 로 보면 «앞 화면이 DOM 에 남아» 엉뚱한 「분」에 걸린다
        // ⛔ 제일 안쪽 칸은 「STEP 5 / 7」 숫자만 든 것이라 걸음 글이 통째로 빠진다
        // ✅ 300자 미만 중 «제일 긴 것» = STEP ＋ 걸음 글이 다 든 칸
        const 글 = await p.evaluate(() => {
          const 후보 = [...document.querySelectorAll('div,section')]
            .filter((e) => /STEP\s*\d+\s*\/\s*\d+/.test(e.innerText || '') && e.innerText.length < 300)
          if (!후보.length) return ''
          return 후보.reduce((a, c) => (c.innerText.length > a.innerText.length ? c : a)).innerText
        })
        if (/끓/.test(글) && /\d+\s*분/.test(글)) break
        if (n >= 4 && /\d+\s*분/.test(글)) break
        const 다음 = p.getByRole('button', { name: /다음/ }).first()
        if (!(await 다음.count())) break
        await 다음.click(); await p.waitForTimeout(800)
      }
      await 찍자(p, '1-08-요리모드-걸음', '요리 모드 — 끓이는 걸음 ＋ 타이머')
    } else console.log('  ⛔ 「요리 시작」 단추를 못 찾았다')
  }

  await 홈으로(p); await 시트닫기(p)
  if (await 탭(p, '일기')) {
    // ⭐ 달력은 «꾸민 날이 있는 달»로 넘어간 뒤에 찍는다(아래) — 빈 달을 찍으면 자랑거리가 없다
    // 📔📔 [창업자 2026-09-04] *"릴스 1은 «일기 다양한 틀»이랑 «꾸미기 아이템» 있는거 보여주자.
    //    «만들어 먹은거 쭉» 있는 것도"*
    //    🔢 실측 = 달력에서 날을 누르면 그 아래로 펼쳐진다 — 「N월 N일 일기 보기」 · 그날 만든 요리 · 「꾸미기」
    //
    // ⛔⛔ [2026-09-04 · 창업자가 두 번 잡았다]
    //    ⑴ *"한끼일기도 «예쁜 틀»로 바꿔줘. 너무 저거는 **백지**라.."*
    //    ⑵ *"**내가 꾸민 거 말고..**"*  ← ⭐이게 방향을 갈랐다
    //    🔎 뿌리 = 처음엔 «그림이 든 첫 칸»을 집었는데 그건 「요리 사진이 있는 날」이지 「꾸민 날」이 아니다.
    //       🔢 실측 = 창업자 백업 일기 21개 중 틀·꾸밈이 있는 건 **딱 둘**(8/11·8/12). 나머지 19개는
    //          `paper` 자체가 없어 **정말로 백지**다. 9월 달력에서 집었으니 백지가 나온 게 당연했다.
    //    ⛔ 그렇다고 그 둘을 열어 쓰지 «않는다» — 창업자가 «내가 꾸민 거 말고»라고 했다.
    //       📌 그리고 그게 홍보물로도 맞다: 그건 **창업자 한 사람의 결과물**이지 «앱이 주는 것»이 아니다.
    //          새로 깐 사람이 보는 건 «빈 종이 ＋ 고를 수 있는 틀 여덟»이다. 자랑거리는 **틀 그 자체**다.
    //    ✅ 그래서 **글만 있는 날 하나를 골라 «내가» 가을로 꾸며서** 그 판을 찍는다(위 `가을로꾸미기`).
    //       ＋ 서랍(틀 여덟이 늘어선 자리)도 한 장 — 창업자가 말한 *"일기 «다양한 틀»"* 이 그것이다.
    const 꾸민날 = 가을일기
    if (!꾸민날) console.log('  ⚠️⚠️ 가을로 꾸민 일기가 없다 — 이 장은 백지로 나온다')
    else {
      console.log(`  📔 여는 날 = ${꾸민날.y}-${꾸민날.m}-${꾸민날.d} (내가 가을로 꾸민 날)`)
      // 📅 그 달로 넘어간다 — 「이전 달」을 눌러서(오늘이 9월이면 8월은 한 번)
      const 이번달 = new Date(Date.now() + 9 * 3600 * 1000)
      const 뒤로 = (이번달.getUTCFullYear() * 12 + 이번달.getUTCMonth()) - (꾸민날.y * 12 + (꾸민날.m - 1))
      for (let i = 0; i < Math.max(0, Math.min(뒤로, 24)); i++) {
        const 이전 = p.locator('[aria-label="이전 달"]').first()
        if (!(await 이전.count())) break
        await 이전.click({ timeout: 3000 }).catch(() => {})
        await p.waitForTimeout(700)
      }
      await 찍자(p, '1-05-일기', '한끼 일기 — 음식 아이콘이 쌓인 달력')
      const 칸 = p.locator('button.cal-day').filter({ has: p.locator('.cal-num', { hasText: new RegExp(`^${꾸민날.d}$`) }) }).first()
      if (await 칸.count()) {
        await 칸.click({ timeout: 5000 }).catch(() => {})
        await p.waitForTimeout(1500)
        await 찍자(p, '1-09-일기-펼침', '일기 — 그날 만든 요리가 쭉')
        const 일기보기 = p.getByRole('button', { name: /일기 보기/ }).first()
        if (await 일기보기.count()) {
          await 일기보기.click({ timeout: 5000 }).catch(() => {})
          await p.waitForTimeout(1800)
          // 🔎 정말 «꾸민» 판이 열렸나 — 백지면 시끄럽게 알린다(백지를 홍보물에 쓰는 게 제일 나쁘다)
          const 꾸밈보이나 = await p.evaluate(() => document.querySelectorAll('.decor-layer *, [class*=decor] img, [class*=decor] span').length)
          console.log(`     └ 펼친 일기에 꾸민 것 ${꾸밈보이나}개 ${꾸밈보이나 > 0 ? '✅' : '⚠️ 백지일 수 있다'}`)
          await 찍자(p, '1-10-일기-틀', '일기 — 꾸민 틀(사진·스티커·쪽지)')
          // 🗂 [창업자 2026-09-04] *"일기 «다양한 틀»이랑 꾸미기 아이템 있는거 보여주자"*
          //    → 틀은 «꾸미기» 안 「속지」에서 고른다(DiaryScreen = *"속지(선·종이·틀)도 꾸미기 안에서 골라요"*).
          const 꾸미기2 = p.getByRole('button', { name: /^꾸미기$/ }).first()
          if (await 꾸미기2.count()) {
            await 꾸미기2.click({ timeout: 5000 }).catch(() => {})
            await p.waitForTimeout(1600)
            await 시트닫기(p)
            for (const 이름 of ['속지', '틀', '종이']) {
              const t = p.locator('button, [role="tab"]').filter({ hasText: new RegExp(`^${이름}$`) }).first()
              if (await t.count()) { await t.click({ timeout: 3000 }).catch(() => {}); await p.waitForTimeout(1200); break }
            }
            await 찍자(p, '1-12-일기-속지', '일기 — 틀 서랍(다양한 속지)')
          } else console.log('  ⛔ 일기 안에서 「꾸미기」를 못 찾았다')
        } else console.log('  ⛔ 「일기 보기」 단추를 못 찾았다')
      } else console.log(`  ⛔ 달력에서 ${꾸민날.d}일 칸을 못 찾았다`)
    }
  }
  await 홈으로(p); await 시트닫기(p)
  if (await 탭(p, '레꾸자랑')) await 찍자(p, '1-06-레꾸자랑', '레꾸자랑 — 뽑은 카드')
}

// ══════════════════════════════════════════════════════════════
// 릴스 ② — 「장 보고 채우고 골라준다」
// ══════════════════════════════════════════════════════════════
if (어느것 === '전부' || 어느것 === '2') {
  console.log('\n🎬 릴스 ② 장보기·냉장고·장바구니')
  await 홈으로(p); await 시트닫기(p)
  if (await 탭(p, '장보기')) {
    // ⛔ 맨 위가 «장보기 리스트»이고 주부의 장바구니는 그 «아래»다(2026-08-27 실측 · 순서를 거꾸로 알고 있었다)
    await 찍자(p, '2-01-장보기', '장보기 — 담긴 재료 ＋ 줄마다 사러가기')
    await 굴리기(p, 900)
    await 찍자(p, '2-02-장바구니', '주부의 장바구니 — 큐레이션')
    // 🛒🛒 [창업자 2026-09-04] *"냉장고는 «큐레이션 좀 더 자세하게» 보여주고"*
    //    🔢 실측 = 큐레이션은 «갈래 칩»(`.shop-chip`)으로 접혀 있다 — 기본은 「이번 주 픽」만 펼친다.
    //       그래서 그냥 굴리면 «몇 칸»만 보이고 「엄선했다」가 안 읽힌다.
    //    ✅ 칩을 눌러 갈래를 펼치고 «제품 카드가 여러 장 깔린» 자리를 찍는다.
    const 칩들 = p.locator('.shop-chip')
    const 칩수 = await 칩들.count()
    if (칩수 > 1) {
      // ⭐ 「전체」가 있으면 그걸로 — 제품이 제일 많이 깔린다. 없으면 둘째 칩.
      const 전체칩 = 칩들.filter({ hasText: /^전체$/ }).first()
      const 고른칩 = (await 전체칩.count()) ? 전체칩 : 칩들.nth(1)
      await 고른칩.click({ timeout: 4000 }).catch(() => {})
      await p.waitForTimeout(1400)
      await 찍자(p, '2-08-큐레이션-갈래', '주부의 장바구니 — 갈래를 펼친 자리')
      await 굴리기(p, 800)
      await 찍자(p, '2-09-큐레이션-제품', '주부의 장바구니 — 제품 카드가 쭉 ＋ 사러가기')
      await 굴리기(p, 800)
      await 찍자(p, '2-10-큐레이션-더', '주부의 장바구니 — 더 아래')
    } else console.log('  ⛔ 큐레이션 갈래 칩(.shop-chip)을 못 찾았다')
    await 굴리기(p, 900)
    await 찍자(p, '2-03-장바구니-더', '주부의 장바구니 — 더 아래')
  }
  // 🥕 냉장고 = 장보기 «안»의 `[data-coach="pantry"]` — 탭이 아니다(2026-09-04 실측)
  //    ⛔⛔ **갓 깐 앱의 냉장고는 텅 비어 있다** — 안내 문구만 뜨고 홍보물엔 못 쓴다
  //       (`_shot-냉장고채운판-0820.mjs` 가 2026-08-20 에 같은 자리에서 배운 것).
  //       비어 있으면 «시끄럽게» 알린다 — 빈 화면을 홍보물로 내보내는 게 제일 나쁘다.
  await 홈으로(p); await 시트닫기(p)
  if (await 탭(p, '장보기')) {
    const 냉장고 = p.locator('[data-coach="pantry"]').first()
    if (await 냉장고.count()) {
      await 냉장고.click(); await p.waitForTimeout(1500)
      const 비었나 = await p.evaluate(() => /비어|아직 없|담아/.test(document.body.innerText))
      if (비었나) console.log('  ⚠️⚠️ 냉장고가 «비어 있다» — 이 장은 홍보물에 못 쓴다. 재료를 채워야 한다')
      await 찍자(p, '2-04-냉장고', '냉장고 — 있는 재료 ＋ 유통기한')
      // 🧾🧾 [창업자 2026-09-04] *"냉장고도 «영수증 찍고 재료 담기 유통기한 메모» 되는거 보여주면 좋겠어"*
      //    🔢 실측 = `PantryView` 에 둘이 나란히 있다 — **「＋재료 담기」가 주 · 「영수증」이 보조**.
      //       (2026-08 에 창업자가 *"영수증스캔이 버튼이 더 커서. 영수증 스캔하는 탭이라고 생각할 것 같아"* 라고
      //        해서 크기를 뒤집었다 — 그 결정이 화면에 그대로 있다)
      //    ⭐ 홍보물엔 «둘 다» 보여준다 — 재료를 넣는 길이 여럿이라는 게 자랑거리다.
      const 담기 = p.getByRole('button', { name: /재료 담기/ }).first()
      if (await 담기.count()) {
        await 담기.click(); await p.waitForTimeout(1400)
        await 찍자(p, '2-06-재료담기', '냉장고 — 재료 담기 (유통기한 메모)')
        await 시트닫기(p)
        await p.keyboard.press('Escape').catch(() => {})
        await p.waitForTimeout(900)
      } else console.log('  ⛔ 「＋재료 담기」 단추를 못 찾았다')
      // ⛔⛔ [2026-09-04] `/^영수증$/` 로 찾다가 못 찾았다 — 이 단추 «안»에 「베타」 딱지가 같이 들어 있어
      //    읽히는 이름이 「영수증 베타」다. 정확히 같기를 요구하면 영영 못 만난다(규칙 17 — 없는 게 아니라 못 찾은 것).
      //    ⛔ 그냥 `/영수증/` 으로 넓히면 「갤러리에서 영수증 고르기」까지 물어 온다 → 그 둘을 «빼고» 고른다.
      const 영수증 = p.getByRole('button', { name: /영수증/ })
        .filter({ hasNotText: '갤러리' }).filter({ hasNotText: '고르기' }).first()
      if (await 영수증.count()) {
        // ⛔ 누르면 «파일 고르기»가 열린다 — 취소하면 화면이 그대로다.
        //    그래서 «누르지 않고» 그 자리가 보이게만 찍는다(홍보물엔 「이런 길이 있다」가 보이면 된다).
        await 영수증.scrollIntoViewIfNeeded().catch(() => {})
        await p.waitForTimeout(700)
        await 찍자(p, '2-07-영수증자리', '냉장고 — 영수증으로 담는 길')
      } else console.log('  ⛔ 「영수증」 단추를 못 찾았다')
    } else console.log('  ⛔ 냉장고 들어가는 자리를 못 찾았다')
  }
}

await b.close(); srv.close()
console.log(`\n📁 ${OUT}`)
console.log(`🔢 ${찍은것.length}장 · 820×1456(9:16) · deviceScaleFactor 2 → 1640×2912`)
console.log('⭐ 규칙 21 — 이제 «열어서» 보고 고른다. 숫자로는 못 고른다.')
