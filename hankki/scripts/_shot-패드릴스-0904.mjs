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
const ctx = await b.newContext({ viewport: { width: 820, height: 1456 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch { /* noop */ } })

const 찍은것 = []
const 찍자 = async (p, 이름, 설명) => {
  await p.waitForTimeout(700)
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
  await page.mouse.move(410, 800)
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
const 시트닫기 = async (page) => {
  for (const 글자 of ['나중에 볼게요', '닫기']) {
    const b2 = page.getByRole('button', { name: 글자 }).first()
    if (await b2.count()) { await b2.click(); await page.waitForTimeout(900); return }
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
  const 홍보편 = process.env.SHOT_RECIPE || '돼지고기 김치찌개'
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
    } else console.log('  ⛔ 「레시피 꾸미기」 단추를 못 찾았다')
  } else console.log('  ⛔ 레시피 목록에서 첫 편을 못 찾았다 — 고르는 잣대를 다시 봐야 한다')
  await 홈으로(p); await 시트닫기(p)
  if (await 탭(p, '일기')) await 찍자(p, '1-05-일기', '한끼 일기 — 음식 아이콘이 쌓인 달력')
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
      await 찍자(p, '2-04-냉장고', '냉장고 — 있는 재료')
      await 굴리기(p, 700)
      await 찍자(p, '2-05-냉장고-아래', '냉장고 — 아래쪽')
    } else console.log('  ⛔ 냉장고 들어가는 자리를 못 찾았다')
  }
}

await b.close(); srv.close()
console.log(`\n📁 ${OUT}`)
console.log(`🔢 ${찍은것.length}장 · 820×1456(9:16) · deviceScaleFactor 2 → 1640×2912`)
console.log('⭐ 규칙 21 — 이제 «열어서» 보고 고른다. 숫자로는 못 고른다.')
