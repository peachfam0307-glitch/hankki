// 🎬🎬 프로모 영상 v2 — **실제 앱을 조작하면서 녹화한다** (2026-08-16)
//
// 📮 창업자 = *"스토어 영상도 다시만들어야해 (**영상이 완전 낡은거고, 상표권등록한 한끼 로고부터 달라**)"*
//    → 갈래를 물었더니 *"**알아서해 난 모르겠어.**"*
//
// ⭐⭐⭐ 왜 방식을 바꿨나 — **7월 판이 한 달 만에 낡은 «뿌리»를 없앤다.**
//   옛 판(`promo_build.mjs`)은 `promo.html` = **앱 밖에서 따로 그린 화면**을 녹화했다.
//   그래서 앱이 v8 → v10.94 로 가는 동안 영상만 7월에 멈춰 있었다 —
//     · 로고가 옛 판(상표 출원본은 2026-07-23 확정인데 영상은 그 전)
//     · **일기가 아예 없다**(v9.94 신설) · 상세 꾸미기 없다(v10.03) · 요리 타이머 없다
//   ✅ **앱을 직접 녹화하면 앱이 바뀔 때 다시 돌리기만 하면 된다.** 스샷 v4 와 같은 처방이다.
//      (`docs/내일-꼭-할것-2026-08-16.md` 에 이미 *"이번엔 실제 앱 화면을 Playwright 로 찍어서 만든다"* 로 적혀 있었다)
//
// 📐 **가로 16:9 로 찍는다** — 유튜브가 스토어에 붙는 유일한 통로이고 **숏츠는 지원 안 한다**(세로 불가).
//   ⭐ 7월엔 앱이 세로뿐이라 가로 판이 레터박스였다. 지금은 **v10.08 에 가로모드를 열었고**
//      v10.62~65 에 패드 레이아웃을 고쳐서 **화면이 꽉 찬다.**
//   ⭐ CSS 1280×720 으로 띄운다 — 오늘 태블릿 스샷과 «같은 조건»이라 글자 크기가 실제와 같다
//      (2560 CSS 로 띄웠다가 「글자 절반·여백 두 배」가 된 사고를 8/16 에 이미 겪었다).
//
// 실행: node design/promo/프로모영상-2507/scripts/promo_app_2508.mjs
import fs from 'node:fs'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { execFileSync } from 'node:child_process'
import { extname, join } from 'node:path'
import pw from '/home/user/hankki/hankki/node_modules/playwright-core/index.js'
const { chromium } = pw

const H = '/home/user/hankki/hankki'
const DIST = `${H}/dist`
const WORK = process.env.PROMO_WORK || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/vid'
const OUT = `${H}/design/promo/프로모영상-2507`
const ffmpeg = (await import(`${WORK}/node_modules/ffmpeg-static/index.js`)).default

if (!fs.existsSync(`${DIST}/index.html`)) { console.log('⛔ dist 가 없다 — `npm run build` 부터'); process.exit(1) }
const REC = `${WORK}/rec-app`; fs.rmSync(REC, { recursive: true, force: true }); fs.mkdirSync(REC, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4395, r))

const { SEED_COACH_SEEN } = await import(`${H}/src/coach.js`)
const br = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--force-color-profile=srgb'] })
// 🔍🔍 **화질** — 창업자 *"화질신경써줘."*
//
// ⛔⛔ **첫 판이 화면을 잘라먹었다.** `deviceScaleFactor: 2` ＋ `recordVideo.size: 1920×1080` 으로
//    「크게 그려서 줄이면 선명하다」를 노렸는데, 녹화 프레임 **왼쪽 위 1280×720 에만 앱이 있고
//    나머지는 회색**이었다. Playwright 의 녹화는 viewport 픽셀을 그대로 담고 size 로 스케일하지 않는다.
//    📌 **화질 욕심이 화면을 잘랐다.** 규칙 21 로 프레임을 열어보고 잡았다 — 안 열어봤으면 그대로 올릴 뻔했다.
//
// ✅ 그래서 **녹화 크기 = viewport 크기**로 맞춘다(잘림 0). 1080p 는 ffmpeg 에서 lanczos 로 올린다.
//   ⭐ viewport 를 1920 으로 키우지 «않는» 이유 = 글자가 작아진다.
//      2560 CSS 로 띄웠다가 창업자에게 *"글자 작은게 너무 이상해"* 를 들은 게 오늘 아침이다.
//      1280 CSS = 실제 갤럭시탭(2560px · DPR 2)과 «같은 레이아웃»이다.
//   ⚠️ 720p → 1080p 업스케일은 선명도를 «만들지» 못한다. 다만 앱 화면은 사진이 아니라
//      선·글자·단색이라 사진보다 덜 티나고, **잘린 화면보다는 백배 낫다.**
const ctx = await br.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: REC, size: { width: 1280, height: 720 } },
})
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
// ⛔ 온보딩·코치마크·선물 시트가 화면을 덮는다 — 스샷에서 겪은 그대로 미리 끈다
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(() => localStorage.setItem('hankki:onboarded', '1'))
await page.addInitScript(() => localStorage.setItem('hankki:nudge:giftpack', '1'))

const 탭 = async (이름) => { await page.getByText(이름, { exact: true }).last().click() }
// ⏱ **전체 길이를 «한 줄»로 조절한다** — 첫 판이 68.8초로 너무 길었다(스토어 프로모는 30초 안팎).
//   ⭐ 장면마다 숫자를 고치면 손이 많이 가고 비율이 흐트러진다. 배율 하나면 «리듬은 그대로» 짧아진다.
//   ⚠️ 너무 줄이면 글자를 못 읽는다 — 0.5 밑으로는 내리지 말 것.
const 배율 = Number(process.env.PROMO_SPEED || 0.55)
const 쉼 = (ms) => page.waitForTimeout(Math.max(120, Math.round(ms * 배율)))
const 장면 = (n, 무엇) => console.log(`  🎬 ${n} ${무엇}`)

await page.goto('http://127.0.0.1:4395/hankki/', { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await 쉼(2400)   // ⛔ 녹화 첫 프레임이 검은 화면이라 여유를 준다(뒤에서 잘라낸다)

// ① 홈 — 앱을 열면 보는 화면. ⭐상단바에 **상표 출원한 곰=ㅎ 로고**가 있다(창업자가 짚은 그것)
장면('①', '홈')
await 쉼(2600)
await page.mouse.wheel(0, 320); await 쉼(1500)   // 살짝 굴려 「더 있다」를 보여준다
await page.mouse.wheel(0, -320); await 쉼(900)

// ② 레시피 목록 — 음식 그림이 한 화면에 쫙
장면('②', '레시피 목록')
await 탭('레시피'); await 쉼(2400)
await page.mouse.wheel(0, 420); await 쉼(1600)

// ③ 레꾸(표지 꾸미기) — ⭐⭐필살기. 종이 왼쪽 · 스티커 서랍 오른쪽
장면('③', '레꾸 — 표지 꾸미기')
const 콩국수 = page.locator('.grid-card').filter({ hasText: '콩국수' }).first()
if (await 콩국수.count()) { await 콩국수.click(); await 쉼(1800) }
const 꾸미기 = page.getByRole('button', { name: /꾸미|레꾸/ }).first()
if (await 꾸미기.count()) {
  await 꾸미기.click(); await 쉼(2000)
  const 친구들 = page.getByText('친구들', { exact: true }).first()
  if (await 친구들.count()) { await 친구들.click(); await 쉼(2200) }
  // 서랍을 굴려 스티커가 «많다»를 보여준다 — 정지 화면으로는 안 보이는 것
  const 서랍 = page.locator('.decor-drawer, .sticker-list, .decor-editor').last()
  await 서랍.hover().catch(() => {})
  await page.mouse.wheel(0, 300); await 쉼(1400)
  await page.mouse.wheel(0, 300); await 쉼(1600)
} else console.log('  ⛔ 「꾸미기」 버튼을 못 찾았다')

// 🚪🚪 **화면을 옮길 땐 «앱을 새로 열지» 않는다** — 창업자 *"마지막에 영상이 탁 안끊기게."*
//   ⛔⛔ 첫 판은 장면마다 `page.goto()` 로 앱을 새로 열었다. 그때마다 **흰 화면이 한 번 번쩍**하고
//      페이드인이 다시 돈다 — 프레임을 뽑아 보니 31초 지점이 통째로 하얗게 날아가 있었다(규칙 21).
//      **여섯 번 있었으니 여섯 번 끊긴 것**이다. 끝만 끊긴 게 아니었다.
//   ✅ **유저와 같은 길로 간다** — 닫기·뒤로가기로 빠져나오고 하단 탭으로 옮긴다.
//      앱이 가진 «화면 전환 애니메이션»이 그대로 담겨서 오히려 부드럽다.
// 🔙🔙 **나가는 길은 «브라우저 뒤로가기» 하나로 통일한다.**
//   ⛔ 첫 판은 레꾸에서 「취소」를 눌렀다가 **30초 타임아웃으로 죽었다** —
//      「취소」는 *"저장하고 나가기 / …"* 를 **한 번 더 묻는 시트**를 띄우고, 스크립트는 그걸 몰랐다.
//   ⭐ 앱 주석이 답을 줬다(`DecorEditor.jsx:516`) —
//      *"**뒤로가기 = 「저장하고 닫기」. 묻지 않는다.**"*(창업자 2026-08-12 *"뒤로가기 안됨 … 급짜증난다ㅠ"*)
//   ✅ 앱이 `useLayerBack` 으로 층을 관리하므로 `goBack()` 이 **화면 한 겹만** 닫는다.
//      SPA 히스토리라 **흰 화면 없이** 앱 자체 전환 애니메이션으로 닫힌다 — 우리가 없애려던 그 깜빡임이 안 난다.
const 뒤로 = async (겹 = 1) => {
  for (let i = 0; i < 겹; i++) { await page.goBack().catch(() => {}); await 쉼(800) }
}

// ④ 한끼 일기 — ⭐v9.94 에 생긴 축. 7월 영상엔 아예 없다
장면('④', '한끼 일기')
await 뒤로(2)                         // 레꾸(전체화면) → 상세 → 목록. 두 겹이라 두 번.
await 탭('일기'); await 쉼(1500)
const 일기칸 = page.locator('.grid-card, .cal-diary, .mini-card').first()
if (await 일기칸.count()) { await 일기칸.click(); await 쉼(3200) }

// ⑤ 요리 모드 ＋ 타이머 — ⭐「보는 앱」이 아니라 「요리하면서 쓰는 앱」
장면('⑤', '요리 모드 ＋ 타이머')
await 뒤로()                          // 일기 펼침 → 일기 목록
await 탭('레시피'); await 쉼(1000)
const 요리카드 = page.locator('.grid-card').filter({ hasText: '김치찌개' }).first()
if (await 요리카드.count()) { await 요리카드.click(); await 쉼(1500) }
const 요리시작 = page.getByRole('button', { name: /요리 시작/ }).first()
if (await 요리시작.count()) {
  await 요리시작.click(); await 쉼(1800)
  const 준비완료 = page.getByRole('button', { name: /재료 준비 완료/ }).first()
  if (await 준비완료.count()) { await 준비완료.click(); await 쉼(1800) }
  const 타이머버튼 = page.getByRole('button', { name: /타이머 맞추기/ }).first()
  if (await 타이머버튼.count()) {
    await 타이머버튼.click(); await 쉼(2200)
    const 시작 = page.getByRole('button', { name: /분 시작$/ }).first()
    if (await 시작.count()) { await 시작.click(); await 쉼(3400) }  // ⏱ 막대가 «줄어드는» 걸 보여준다
  }
  // 다음 단계로 넘겨 「단계별로 간다」를 보여준다
  const 다음 = page.getByRole('button', { name: /다음/ }).first()
  if (await 다음.count()) { await 다음.click(); await 쉼(2000) }
  // 요리 모드도 전체화면 — 같은 길(뒤로가기)로 나온다. 나오면 «레시피 상세»에 선다.
  await 뒤로()
}

// ⑥ 장보기 → 냉장고 — 재료를 담고 「가진 재료로 만들 수 있어요」
//   ⭐ 지금 서 있는 곳이 «레시피 상세»라 「장보기 담기」가 바로 눌린다 — 새로 열 필요가 없다
장면('⑥', '장보기 → 냉장고')
const 담기 = page.getByRole('button', { name: /장보기 담기/ }).first()
if (await 담기.count()) { await 담기.click(); await 쉼(1600) }
else console.log('  ⚠️ 「장보기 담기」를 못 찾았다 — 상세 화면이 아닌가')
await 뒤로()
await 탭('장보기'); await 쉼(2200)
for (let i = 0; i < 4; i++) {
  await page.locator('.check-box[data-on="false"]').first().click().catch(() => {})
  await 쉼(420)
}
await 쉼(1800)
const 냉장고 = page.getByText('냉장고', { exact: true }).first()
if (await 냉장고.count()) { await 냉장고.click(); await 쉼(3000) }

// ⑦ 홈으로 — 로고로 닫는다
//   🎞 **끝을 넉넉히 잡는다** — 창업자 *"마지막에 영상이 탁 안끊기게."*
//      뒤에서 1.4초 페이드아웃을 얹는데, 마지막 장면이 짧으면 «보자마자 어두워진다».
//      화면을 충분히 보여준 «뒤»에 어두워져야 「끝났다」로 읽힌다.
장면('⑦', '홈 — 로고로 마무리')
await 탭('홈')
await page.waitForTimeout(3800)   // ⛔ 배율을 안 먹인다 — 페이드가 얹히는 자리라 여기만은 항상 넉넉해야 한다

await page.close()
await ctx.close(); await br.close(); srv.close()

const webm = fs.readdirSync(REC).find((f) => f.endsWith('.webm'))
if (!webm) { console.log('⛔ 녹화 파일이 없다'); process.exit(1) }
console.log(`\n  · 녹화 = ${webm}`)

// 🎞 mp4 인코딩 — H.264 · yuv420p · 30fps (유튜브 호환)
//   ⛔ 첫 몇 프레임이 검은 화면이라 잘라낸다. 옛 판은 `blackdetect` 로 «찾아서» 잘랐는데
//      그 로그가 **stderr 로 나와서** 파싱이 늘 실패했다(옛 스크립트 주석에 그 사고가 적혀 있다).
//      ✅ 우리는 시작에 2.4초 여유를 «일부러» 뒀으니 그만큼 고정으로 자른다 — 찾을 필요가 없다.
const mp4 = `${OUT}/한끼-프로모-2508-앱실사.mp4`
const 앞자름 = 1.6

// 🎞 ① 먼저 «길이»를 잰다 — 페이드아웃을 어디서 시작할지 알아야 한다
const 재기 = (f) => {
  let out = ''
  try { execFileSync(ffmpeg, ['-i', f], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }
  catch (e) { out = String(e.stderr || '') }   // ⛔ ffmpeg 는 -i 만 주면 «에러로» 끝난다. 정보는 stderr 에 있다
  const m = out.match(/Duration: (\d+):(\d+):([\d.]+)/)
  return m ? (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]) : 0
}
const 원본길이 = 재기(join(REC, webm))
const 쓸길이 = Math.max(1, 원본길이 - 앞자름)
const 페이드 = 1.4
const 페이드시작 = Math.max(0, 쓸길이 - 페이드)
console.log(`  · 원본 ${원본길이.toFixed(1)}s → 앞 ${앞자름}s 자르고 ${쓸길이.toFixed(1)}s · 페이드아웃 ${페이드시작.toFixed(1)}s 부터`)

// 🎞 ② 인코딩 — 화질 ＋ 마무리
//   ⭐ `crf 15` = 옛 판과 같은 값. 유튜브가 한 번 더 재압축하므로 **소스를 넉넉히** 둬야 덜 뭉개진다.
//   ⭐ **scale 을 안 건다** — 녹화가 이미 1920×1080 이라 다시 손대면 한 번 더 뭉갠다.
//   🌙 `fade=out` = 창업자 *"마지막에 영상이 탁 안끊기게."* — 끝에서 1.4초에 걸쳐 어두워진다.
execFileSync(ffmpeg, ['-y', '-ss', String(앞자름), '-i', join(REC, webm),
  '-r', '30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '15',
  '-maxrate', '14M', '-bufsize', '22M', '-pix_fmt', 'yuv420p',
  '-vf', `scale=1920:1080:flags=lanczos,unsharp=5:5:0.6:5:5:0.0,fade=t=out:st=${페이드시작.toFixed(2)}:d=${페이드}`,
  '-movflags', '+faststart', '-an', mp4], { stdio: 'ignore' })

console.log(`  ✅ ${mp4}`)
console.log(`  · 길이 ${재기(mp4).toFixed(1)}s · ${(fs.statSync(mp4).size / 1024 / 1024).toFixed(1)}MB`)
console.log(errors.length ? `  ⛔ pageerror ${errors.length}건 — ${errors[0]}` : '  ✅ pageerror 0')
