// 🥄📏 «계량 안내가 «진짜로» 화면에 보이나» — 편집 화면 「단위 톡」 바 (2026-09-03 · smoke)
//
// 📮 창업자 확정 = *"그 계량 안내 넣어줘"*  ＋ 폰 캡처(10:30)를 보내 줬다.
//
// ⛔⛔ **이 판이 있는 «이유»가 그 캡처다.**
//    옛 안내 「T=큰술·t=작은술」은 칩들 **맨 뒤**에 있었는데 이 바는 `overflowX: auto` 다.
//    창업자 폰 캡처에서 오른쪽 끝이 **「작은…」에서 잘려** 있었다 → **그 안내는 화면 밖이었다.**
//    ⭐ 즉 「넣었다」와 「보인다」는 다른 말이다. 그래서 **자리(px)를 잰다.**
//
// 🔢 재는 것 = ⑴안내가 바 «아래»에 있나 ⑵가로로 안 굴려도 «다 보이나» ⑶글자 14px 이상
//              ⑷칩에 T·t 가 없나 ⑸큰술·작은술은 있나
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
// ⛔ 코치마크가 클릭을 «가로챈다» — 앱이 쓰는 그 조각을 그대로 쓴다(흉내 내면 열쇠 이름이 어긋난다)
const { SEED_COACH_SEEN } = await import('../src/coach.js')

// 🔑 로그인 첫 화면을 끄는 열쇠 — **앱 소스에서 «읽어» 온다.**
//    ⛔ 'hankki:nudge:cloudgate' 라고 손으로 적지 않는다. 앱이 이름을 바꾸면 이 판이 조용히 헛돈다
//       (v11.30 「잔량표시 판이 앱과 다른 문구를 흉내 내고 있었다」와 같은 사고).
const 뿌리 = join(dirname(fileURLToPath(import.meta.url)), '..')
const K_CLOUDGATE = (readFileSync(join(뿌리, 'src/nudges.js'), 'utf8')
  .match(/const K_CLOUDGATE\s*=\s*['"]([^'"]+)['"]/) || [])[1]
if (!K_CLOUDGATE) { console.error('⛔ src/nudges.js 에서 K_CLOUDGATE 를 못 찾았다 — 이름이 바뀌었다'); process.exit(1) }

const PORT = Number(process.env.SMOKE_PORT || 4188)
// ⛔⛔ 여기에 브라우저 «경로를 박지 마라» — 그 자리는 이 컨테이너에만 있고 CI 엔 없다.
//    2026-09-03 에 내가 박아서 **배포를 죽였다**(run #2054). v10.90(run #1416)과 «같은» 사고다.
//    ⭐ 없으면 플레이라이트가 알아서 찾는다 — 양쪽에서 다 돈다.
const CHROMIUM = process.env.SMOKE_CHROMIUM

let bad = 0
const ok = (m, v) => console.log('  ✅', m, v !== undefined ? ` ${v}` : '')
const no = (m, v) => { bad++; console.log('  ⛔', m, v !== undefined ? ` ${v}` : '') }

const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
  { cwd: 뿌리, stdio: 'ignore' })
const 끝내기 = () => { try { srv.kill() } catch { /* noop */ } }
process.on('exit', 끝내기)

await new Promise((r) => setTimeout(r, 4500))
const browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
// 📱 창업자 폰과 «같은 폭»으로 — 좁을수록 가로 넘침이 드러난다
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
// ⛔ SEED_COACH_SEEN 은 «문자열»이다 — `{ content: … }` 로 넘겨야 한다.
//    (그냥 넘기면 함수로 취급돼 조용히 안 먹고, 코치마크가 클릭을 가로챈다 — 2026-09-03 에 여기서 헛돌았다)
await ctx.addInitScript({ content: SEED_COACH_SEEN })
// ⛔ 로그인 첫 화면(CloudGate)이 화면을 덮어 클릭을 통째로 가로챈다(v12 클라우드 저장).
//    ⭐ 「눌러서 넘기기」로는 안 됐다 — force 로 누르면 «덮개»가 눌린다. 그래서 아예 안 뜨게 씨앗을 심는다.
await ctx.addInitScript({ content: `try { localStorage.setItem('hankki:onboarded','1'); localStorage.setItem('hankki:news:off','1'); localStorage.setItem(${JSON.stringify(K_CLOUDGATE)},'1') } catch (e) {}` })
const page = await ctx.newPage()
page.setDefaultTimeout(12000)

try {
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1800)

  // ⭐ force — 이 판이 재는 건 «계량 안내»이지 «단추가 눌리나»가 아니다.
  //    잘못 갔으면 아래 「단위 톡이 안 떴다」에서 멈춘다(안 떴는데 초록불 나는 것 방지 · 규칙 18 ⓘ)
  await page.getByRole('button', { name: '가져오기', exact: true }).first().click({ force: true })
  await page.waitForTimeout(800)
  await page.getByText('직접 입력하기', { exact: true }).first().click({ force: true })
  await page.waitForTimeout(1000)
  await page.getByRole('button', { name: '빈 종이 열기' }).first().click({ force: true })
  await page.waitForTimeout(900)

  // ── 재료 칸을 눌러 「단위 톡」 바를 띄운다 ──
  const 재료칸 = page.locator('textarea').first()
  await 재료칸.click()
  await page.waitForTimeout(600)

  const 톡 = page.getByText('단위 톡', { exact: true })
  if (await 톡.count() === 0) { no('「단위 톡」 바가 안 떴다 — 여기서 멈춘다(안 떴는데 초록불 방지)'); throw new Error('bar') }
  ok('「단위 톡」 바가 떴다')

  const 잰값 = await page.evaluate(() => {
    const 라벨 = [...document.querySelectorAll('span')].find((e) => e.textContent.trim() === '단위 톡')
    const 줄 = 라벨?.parentElement                    // 칩이 굴러가는 가로 줄
    const 바 = 줄?.parentElement                      // 그 바깥 상자(세로)
    const 안내 = [...(바?.children || [])].find((e) => /1큰술\s*=\s*15ml/.test(e.textContent || ''))
    const 칩 = [...(줄?.querySelectorAll('button') || [])].map((b) => b.textContent.trim())
    const r = 안내?.getBoundingClientRect()
    const cs = 안내 ? getComputedStyle(안내) : null
    return {
      칩,
      안내있나: !!안내,
      안내글: 안내?.textContent.trim() || '',
      안내가바아래: !!(안내 && 줄 && 안내.compareDocumentPosition(줄) & Node.DOCUMENT_POSITION_PRECEDING),
      안내폭: r ? Math.round(r.width) : 0,
      안내오른끝: r ? Math.round(r.right) : 0,
      화면폭: window.innerWidth,
      글자: cs ? parseFloat(cs.fontSize) : 0,
      // 안내가 «가로 굴림 상자 안»에 있으면 밀려서 안 보일 수 있다 — 그걸 잡는다
      굴림안에있나: !!(안내 && 줄 && 줄.contains(안내)),
      줄굴릴것: 줄 ? Math.round(줄.scrollWidth -줄.clientWidth) : 0,
    }
  })

  console.log('\n  📐 잰 값 =', JSON.stringify(잰값))
  // 👀 숫자만 보면 「가려진 것」을 놓친다 — 찍어서 눈으로도 본다(절대원칙 21)
  if (process.env.SHOT) { await page.screenshot({ path: process.env.SHOT }); console.log('  📸', process.env.SHOT) }

  // ⑴ 안내가 있나 · 바 «아래»인가
  잰값.안내있나 ? ok('계량 안내가 있다', `「${잰값.안내글}」`) : no('계량 안내가 없다')
  잰값.굴림안에있나
    ? no('⛔ 안내가 «가로로 굴러가는 줄 안»에 있다 — 옛 「T=큰술」과 같은 사고다(화면 밖으로 밀린다)')
    : ok('안내가 굴림 줄 «밖»(바 아래 한 줄)이다')

  // ⑵ 가로로 안 굴려도 다 보이나 — 이게 이 판의 심장
  if (잰값.안내오른끝 > 0 && 잰값.안내오른끝 <= 잰값.화면폭) ok('안내가 «굴리지 않아도» 다 보인다', `오른끝 ${잰값.안내오른끝} ≤ 화면 ${잰값.화면폭}`)
  else no('안내가 화면 밖으로 나간다', `오른끝 ${잰값.안내오른끝} > 화면 ${잰값.화면폭}`)

  // ⑶ 앱 최소 글자
  잰값.글자 >= 14 ? ok('글자가 앱 최소 14px 이상', `${잰값.글자}px`) : no('글자가 14px 아래', `${잰값.글자}px`)

  // ⑷⑸ 칩
  const T있나 = 잰값.칩.includes('T') || 잰값.칩.includes('t')
  T있나 ? no('⛔ 칩에 T·t 가 아직 있다', 잰값.칩.join(' ')) : ok('칩에 T·t 가 없다', 잰값.칩.join(' '))
  const 술 = 잰값.칩.includes('큰술') && 잰값.칩.includes('작은술')
  술 ? ok('칩에 큰술·작은술이 있다') : no('칩에 큰술·작은술이 없다', 잰값.칩.join(' '))
} catch (e) {
  no('판이 도중에 죽었다', String(e.message || e))
} finally {
  await browser.close()
  끝내기()
}

console.log(bad ? `\n⛔ ${bad}칸 죽었다` : '\n✅ 계량 안내가 굴리지 않아도 보인다 · 칩은 큰술·작은술뿐')
process.exit(bad ? 1 : 0)
