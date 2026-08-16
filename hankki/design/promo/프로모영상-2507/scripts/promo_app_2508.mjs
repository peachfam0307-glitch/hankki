// 🎬🎬 프로모 영상 v2 — **실제 앱을 «손가락으로 눌러가며» 녹화한다** (2026-08-16)
//
// 📮 창업자 = *"스토어 영상도 다시만들어야해 (**영상이 완전 낡은거고, 상표권등록한 한끼 로고부터 달라**)"*
//    → 갈래를 물었더니 *"알아서해 난 모르겠어."*
//
// ⭐⭐ 왜 방식을 바꿨나 — **7월 판이 한 달 만에 낡은 «뿌리»를 없앤다.**
//   옛 판(`promo_build.mjs`)은 `promo.html` = 앱 «밖»에서 그린 화면을 녹화했다. 그래서 앱이
//   v8 → v10.94 로 가는 동안 영상만 7월에 멈췄다(로고 옛 판 · 일기 없음 · 요리 타이머 없음).
//   ✅ 앱을 직접 녹화하면 앱이 바뀔 때 **다시 돌리기만** 하면 된다.
//
// ⭐⭐⭐⭐ **제일 큰 고침 = 「손가락」을 그린다** (창업자 판정 2026-08-16 · 세 판을 거쳐 도달)
//   ⑴ *"너무 정신없이 빨리빨리 지나가 뭐가 뭔지도 모르겠어"*   → 머무는 시간을 늘렸다
//   ⑵ *"떴던게 또 뜨고. 탭을 왔다갔다 하는게 그냥 찍히니까…"*  → **한 레시피(콩국수)로 흐름을 잇는다**
//   ⑶ *"**마우스커서를 하나 놓던지 이동하는 흐름이 자연스럽게 해야해.**"*
//      *"**지금은 툭툭끊겨. 뭘 눌렀는지 뭘 하는지 모르겠는거야.**"*
//   📌 ⑶ 이 결정적이었다 — **화면을 가리는 것으로는 못 푼다.** 가리면 「뭘 눌렀는지」를 더 모른다.
//      ✅ **커서가 버튼으로 «움직여 가서» 누르고, 그래서 화면이 바뀐다** — 인과가 보이면 안 끊긴다.
//   ⑷ *"순서도 잘지켜줘. **탭 왼쪽부터** 진행되게하고, 레시피꾸미기보여주고, 요리시작눌러서 진행."*
//      → 하단바 차례대로 **홈 → 레시피 → 일기 → 장보기**. (가져오기·레꾸자랑은 뺐다 —
//        레꾸자랑은 스샷에서도 뺐다: 창업자 *"레꾸자랑이랑 레시피는 화면이 똑같아"*)
//
// 📐 **가로 16:9** — 유튜브가 스토어에 붙는 유일한 통로이고 숏츠는 지원 안 한다(세로 불가).
//   ⭐ CSS 1280×720 = 태블릿 스샷과 «같은 조건»이라 글자 크기가 실제와 같다.
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
// 🏷 `/promo-logo.png` = **상표 출원한 로고**(곰=ㅎ · 크림) — 창업자 *"상표권등록한 한끼 로고부터 달라"*
// ⛔⛔ 처음엔 «크림» 판을 썼는데 **로고 뒤에 회색 사각형이 떴다** — 그 PNG 는 투명이 아니라
//    「크림 바탕(#fffdf8)이 칠해진」 판이라 브라운 화면 위에 네모가 그대로 보였다(프레임을 열어보고 잡았다).
//    ✅ **브라운 판**은 바탕이 `#5d3410` = 맺음말 배경과 «똑같아» 이음매가 안 보인다.
const LOGO = `${H}/design/promo/logo/한끼로고-곰ㅎ-브라운-2507.png`
// 🐻 **커서로 쓸 꼬르곰 얼굴** — 창업자 *"커서는 큼직하게 만들어 귀엽게"* ·
//    *"꼬르곰이나 펭펭으로 만들던가.. 뭐 하여튼. 잘보이게"* · *"한끼로고로 만들더가.."*
//    ⭐ **셋이 한 파일로 풀린다** — 이 컷은 «로고의 곰» 이자 «꼬르곰 얼굴»이다.
//       평균색 `#eaaf7d` = 꼬르곰 몸색(`#EBAB73`)과 사실상 같아 크림 바탕에서 잘 보인다(재서 확인).
const BEAR = `${H}/design/promo/logo/한끼로고-곰ㅎ-소스-곰얼굴.png`
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  if (p === '/promo-logo.png') { s.writeHead(200, { 'content-type': 'image/png' }); s.end(readFileSync(LOGO)); return }
  if (p === '/promo-bear.png') { s.writeHead(200, { 'content-type': 'image/png' }); s.end(readFileSync(BEAR)); return }
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4395, r))

const { SEED_COACH_SEEN } = await import(`${H}/src/coach.js`)
const br = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--force-color-profile=srgb'] })
// 🔍 **화질** — 창업자 *"화질신경써줘."*
//   ⛔⛔ 첫 판은 `deviceScaleFactor: 2` ＋ `recordVideo.size 1920×1080` 으로 「크게 그려 줄이면 선명」을
//      노렸는데 **녹화 왼쪽 위에만 앱이 있고 나머지가 회색**이었다(프레임을 열어보고 잡았다 · 규칙 21).
//      Playwright 녹화는 viewport 픽셀을 그대로 담는다. **화질 욕심이 화면을 잘랐다.**
//   ✅ 녹화 크기 = viewport 크기(잘림 0). 1080p 는 ffmpeg lanczos 로 올린다(＋가벼운 선명화).
const ctx = await br.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: REC, size: { width: 1280, height: 720 } },
})
// ⏱ **녹화가 시작된 시각** — 뒤에서 「앞자름」을 «재서» 정하는 데 쓴다(고정 숫자를 안 쓴다).
//    context 를 만드는 순간부터 녹화가 돌기 때문에 여기가 0초다.
const 녹화시작 = Date.now()
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript(SEED_COACH_SEEN)                                     // 코치마크가 화면을 덮는다
await page.addInitScript(() => localStorage.setItem('hankki:onboarded', '1'))  // 온보딩도
await page.addInitScript(() => localStorage.setItem('hankki:nudge:giftpack', '1'))

const 배율 = Number(process.env.PROMO_SPEED || 1.0)

// ⏱⏱⏱ **「머무는 시간」을 한 손잡이로 깎는다** (창업자 2026-08-16)
//   📮 *"1초씩(**커서가 기다리는 부분 긴 것들**) 자르자"*
//   📮 *"홈화면에서 레시피로 넘어가는데 **5초**. 꾸미기로 넘어가는데 **5초**.."*
//   🔢 재보니 창업자 숫자가 정확했다 — 홈은 `쉼(3600)` ＋ 커서 이동 860 ＋ 누르기 앞 280 = **4.74초**.
//      📌 **화면에 머무는 시간은 `쉼()` 만이 아니다** — 커서가 미끄러지는 시간이 늘 1.1초씩 붙는다.
//         그래서 「3.6초 줬는데 왜 5초냐」가 나온다. 깎을 때 이걸 같이 세야 한다.
//   ✅ **긴 것만** 깎는다 — 짧은 대기(1600·2400)는 이미 촘촘해서 더 깎으면 «툭툭 끊긴다».
//      창업자가 전에 그걸로 물렸다(*"너무 정신없이 빨리빨리 지나가"*).
//   🎛 `PROMO_CUT` 로 조절 — 더 짧게/길게 하고 싶으면 이 숫자만 바꾼다(다시 뽑기만 하면 된다).
//   🔢 **실측으로 값을 정했다**(`_영상-장면시간.mjs` · 98.2초 판) —
//      보통 장면이 **5.0~5.8초**씩이었다. 대본은 3.0~3.8초인데 **커서 이동＋누르기 앞뒤가 2.2초** 더 붙는다.
//      ⭐ 그래서 「화면에 3.5초 머물게」 하려면 대본은 **1.3초**여야 한다.
const 긴것 = 2600                                   // 이 이상이면 「긴 것」
const 깎기 = Number(process.env.PROMO_CUT || 1900)  // 긴 것에서 뺄 밀리초
const 쉼 = (ms) => {
  const v = ms >= 긴것 ? Math.max(1300, ms - 깎기) : ms   // ⛔ 1.3초 밑으로는 안 내린다(＋2.2 = 3.5초)
  return page.waitForTimeout(Math.max(150, Math.round(v * 배율)))
}
const 잠깐 = (ms) => page.waitForTimeout(ms)   // 배율을 안 먹이는 대기(연출용)
const 장면 = (무엇) => console.log(`  🎬 ${무엇}`)

// 🐻🐻 **꼬르곰 커서** — 이 영상의 심장이다.
//   📮 창업자 *"커서는 **큼직하게 만들어 귀엽게**"* · *"**잘보이게**"*
//   ⭐ `transition` 으로 «미끄러져» 가고, 누를 때 **폭 작아졌다 통통 튀며 링이 퍼진다** —
//      「여기를 눌렀다」와 「그래서 화면이 바뀌었다」가 한눈에 이어진다.
//   ⭐ **곰을 클릭 지점 «오른쪽 아래»에 둔다** — 가운데 두면 곰이 누른 버튼을 가린다.
//      마우스 화살표가 «끝»으로 가리키는 것과 같은 이치. 링은 «클릭 지점»에 그려서 자리를 못 박는다.
//   ⛔ 유니코드 이모지를 안 쓴다 — 우리 컷이다(규칙: UI 에 유니코드 금지).
const 손가락만들기 = async () => {
  await page.evaluate(() => {
    const st = document.createElement('style')
    st.textContent = `
      #hkcur { position: fixed; z-index: 100000; left: 0; top: 0; width: 0; height: 0;
        pointer-events: none; opacity: 0;
        transition: transform .78s cubic-bezier(.33,0,.2,1), opacity .35s ease; }
      #hkcur.on { opacity: 1; }
      /* ⛔⛔ 커서가 통째로 안 보였다 — 크기가 0x0 이었다.
         이미지는 멀쩡히 로드됐고(1035x1165) opacity·z-index 도 정상인데 화면 자리만 0x0.
         범인 = 앱 CSS 의 「img { max-width: 100% }」 — 부모 「#hkcur」 가 width:0 이라
         86px 로 적어도 「부모의 100%」＝0 으로 깎였다.
         📌 규칙 18 — 「안 보인다」의 이유를 짐작하지 말고 재서 알아냈다(로드 여부·opacity 를 다 찍어봤다).
         ✅ max-width: none ＋ height: auto 를 못 박는다.
         ⛔ 이 주석에 백틱을 쓰면 안 된다 — 이 블록 자체가 템플릿 문자열이라 문자열이 끊긴다(실제로 한 번 죽었다). */
      /* 🔽 아래쪽 버튼(하단바)을 누를 땐 곰을 «위»에 둔다 — 창업자
         "화면이 너무 꽉차서 아래버튼 누르는 커서랑 버튼이 잘 안모이는 듯"
         맞다. 하단바는 화면 맨 끝이라 곰을 오른쪽 «아래»에 두면 화면 밖으로 밀려 잘린다.
         위로 올리면 앱 화면 안이라 곰도 버튼도 다 보인다. */
      #hkcur.up img { top: -104px !important; }
      #hkcur img { position: absolute; left: 6px; top: 6px;
        width: 86px !important; height: auto !important; max-width: none !important; display: block;
        filter: drop-shadow(0 7px 16px rgba(93,52,16,.42));
        transform-origin: 22% 18%; transition: transform .17s cubic-bezier(.34,1.56,.64,1); }
      #hkcur img.tap { transform: scale(.74); }
      .hkring { position: fixed; z-index: 99999; width: 44px; height: 44px; margin: -22px 0 0 -22px;
        border-radius: 50%; border: 3.5px solid rgba(93,52,16,.55); pointer-events: none;
        animation: hkring .7s ease-out forwards; }
      @keyframes hkring { from { transform: scale(.7); opacity: .95 } to { transform: scale(3); opacity: 0 } }`
    document.head.appendChild(st)
    const c = document.createElement('div'); c.id = 'hkcur'
    c.innerHTML = '<img src="/promo-bear.png" alt="">'
    document.body.appendChild(c)
  })
}
// 손가락을 그 자리로 «미끄러뜨린다». 처음 부를 땐 순간이동(보이기 전이라 티가 안 난다).
const 손옮기기 = async (x, y, 첫판 = false) => {
  await page.evaluate(({ x, y, 첫판 }) => {
    const c = document.getElementById('hkcur')
    if (!c) return
    if (첫판) c.style.transition = 'none'
    c.style.transform = `translate(${x}px, ${y}px)`
    if (첫판) { void c.offsetWidth; c.style.transition = '' }
    c.classList.add('on')
  }, { x, y, 첫판 })
  await 잠깐(첫판 ? 300 : 860)   // 미끄러지는 시간
}
// 👆 **누르기** = 손을 옮기고 → 링을 퍼뜨리고 → 실제로 클릭한다.
//   ⛔ 못 찾으면 «시끄럽게» 알린다 — 조용히 넘어가면 그 장면이 통째로 어긋난다.
const 누르기 = async (loc, 라벨, 뒤대기 = 900) => {
  // ⛔⛔ `boundingBox()` 는 «타임아웃 옵션이 없어» 없는 요소를 기다리며 30초를 태운다 —
  //    그것 때문에 한 판이 **211초**가 됐다(일기 탭·샀어요를 못 찾은 세 번 × 30초).
  //    ✅ 먼저 «짧게» 나타나길 기다리고, 안 나오면 바로 접는다.
  const 있나 = await loc.waitFor({ state: 'visible', timeout: 4000 }).then(() => true).catch(() => false)
  if (!있나) { console.log(`  ⛔ 「${라벨}」 를 못 찾았다`); return false }
  const b = await loc.boundingBox().catch(() => null)
  if (!b) { console.log(`  ⛔ 「${라벨}」 자리를 못 찾았다`); return false }
  const x = Math.round(b.x + b.width / 2), y = Math.round(b.y + b.height / 2)
  // 🔽 화면 아래쪽(하단바 언저리)이면 곰을 위로 올린다 — 안 그러면 곰이 화면 밖으로 잘린다
  await page.evaluate((아래냐) => {
    const c = document.getElementById('hkcur'); if (c) c.classList.toggle('up', 아래냐)
  }, y > 580)
  await 손옮기기(x, y)
  await page.evaluate(({ x, y }) => {
    const i = document.querySelector('#hkcur img')
    if (i) { i.classList.add('tap'); setTimeout(() => i.classList.remove('tap'), 320) }
    const r = document.createElement('div'); r.className = 'hkring'
    r.style.left = x + 'px'; r.style.top = y + 'px'
    document.body.appendChild(r); setTimeout(() => r.remove(), 760)
  }, { x, y })
  await 잠깐(280)
  await loc.click({ timeout: 8000 }).catch(() => console.log(`  ⚠️ 「${라벨}」 클릭 실패`))
  // ⏱ **누른 «뒤» 기다림도 긴 것만 깎는다** (창업자 *"프레임별로 넘어가는시간 재보고 적당히 잘라"*)
  //   ⭐ 여긴 «새 화면이 뜨는 것»을 보는 시간이라 0 으로 못 만든다 — 900ms 를 바닥으로 둔다.
  await 잠깐(뒤대기 >= 1300 ? Math.max(900, 뒤대기 - 400) : 뒤대기)
  return true
}
// 하단 탭은 이름으로 집는다(마지막 것 = 하단바)
const 탭누르기 = async (이름, 뒤대기 = 1000) =>
  누르기(page.getByText(이름, { exact: true }).last(), `${이름} 탭`, 뒤대기)

// 🔙 뒤로가기 — 손가락을 «잠깐 감춘다». 되돌아가는 건 보여줄 장면이 아니라 이동일 뿐이다.
//   ⭐ 앱 주석이 답이었다(`DecorEditor.jsx:516`) — *"뒤로가기 = 「저장하고 닫기」. 묻지 않는다."*
//      (「취소」를 눌렀다가 *"저장하고 나가기…"* 시트에 막혀 30초 타임아웃으로 죽은 적이 있다)
const 뒤로 = async (겹 = 1) => {
  await page.evaluate(() => { const c = document.getElementById('hkcur'); if (c) c.classList.remove('on') })
  for (let i = 0; i < 겹; i++) { await page.goBack().catch(() => {}); await 잠깐(700) }
}

// 🎬 오프닝 · 엔딩 — 창업자
//   *"**우리아이콘 누르면 홈으로 들어가는 것부터** 시작해서 하나씩 눌러가며 보여주고, **마지막에 맺음말.**"*
// 🎨 색은 **앱 아이콘과 같은 조합** — 브라운 바탕(`#5d3410`) ＋ 크림 로고. 브랜드가 이어진다.
// ⛔⛔ **첫 판은 홈이 먼저 뜨고 «그다음» 아이콘이 나왔다** — 창업자 *"처음에 홈화면 나옴. 그리고 아이콘나와."*
//   원인 = 앱이 «다 뜬 뒤»에 오버레이를 덮었기 때문. 그 틈에 홈이 한 번 보인다.
//   ✅ `addInitScript` 로 **앱 스크립트보다 먼저** 깔아 둔다 — 그러면 홈이 그려질 때 이미 덮여 있다.
await page.addInitScript(() => {
  const 넣기 = () => {
    if (document.getElementById('promo-open')) return
    const st = document.createElement('style')
    st.textContent = '#promo-open{position:fixed;inset:0;z-index:99998;background:#5d3410;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px;transition:opacity .8s ease}'
      + '#promo-open img{width:208px;height:208px;border-radius:46px;display:block;max-width:none;box-shadow:0 20px 50px rgba(0,0,0,.3);transition:transform .18s ease}'
      + '#promo-open.tap img{transform:scale(.9)}'
      + '#promo-open .nm{font-size:30px;font-weight:800;color:#fffdf8;letter-spacing:.04em}'
    document.head.appendChild(st)
    const d = document.createElement('div'); d.id = 'promo-open'
    d.innerHTML = '<img src="/hankki/icons/icon-512-v7.png" alt=""><div class="nm">한끼</div>'
    document.body.appendChild(d)
  }
  if (document.body) 넣기()
  else document.addEventListener('DOMContentLoaded', 넣기)
})

// 오버레이는 위 `addInitScript` 가 «앱보다 먼저» 깔아 뒀다 — 여기선 누르고 걷기만 한다
// ⏱⏱ **오프닝은 «2초 안»** (창업자 2026-08-16 *"처음 아이콘보이고 홈화면까지 **4초야 너무 길어**"*)
//   🔢 재보니 정확했다 — 옛 값 합이 1500＋300＋700＋460＋950 = **3.9초**
//      (＋앞에 남는 0.3초까지 화면엔 «4.2초»로 보인다)
//   ✅ 새 값 = 500＋300＋400＋460＋450 = **2.1초** (화면엔 2.4초)
//   ⛔ **누른 순간의 460ms 는 안 줄인다** — 누르는 «반응»이 안 보이면 뭘 눌렀는지 모른다.
//      줄인 건 «기다리는» 시간(앞 1500·뒤 950)뿐이다.
const 오프닝 = async () => {
  await 잠깐(500)
  // 👆 손가락이 아이콘으로 와서 «누른다» — 그래서 앱이 열린다
  await 손옮기기(640, 330, true)
  await 잠깐(400)
  await page.evaluate(() => {
    const d = document.getElementById('promo-open'); if (d) d.classList.add('tap')
    const i = document.querySelector('#hkcur img'); if (i) i.classList.add('tap')
    const r = document.createElement('div'); r.className = 'hkring'
    r.style.left = '640px'; r.style.top = '330px'; document.body.appendChild(r)
    setTimeout(() => r.remove(), 760)
  })
  await 잠깐(460)
  await page.evaluate(() => {
    const d = document.getElementById('promo-open'); if (d) { d.classList.remove('tap'); d.style.opacity = '0' }
    const i = document.querySelector('#hkcur img'); if (i) i.classList.remove('tap')
    const c = document.getElementById('hkcur'); if (c) c.classList.remove('on')
  })
  await 잠깐(450)
  await page.evaluate(() => { const d = document.getElementById('promo-open'); if (d) d.remove() })
}

const 엔딩 = async () => {
  await page.evaluate(() => {
    const c = document.getElementById('hkcur'); if (c) c.classList.remove('on')
    const st = document.createElement('style')
    st.textContent = `
      #promo-end { position: fixed; inset: 0; z-index: 99999; background: #5d3410;
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px;
        opacity: 0; transition: opacity .9s ease; }
      #promo-end img { width: 300px; display: block; }
      #promo-end .msg { font-size: 40px; font-weight: 800; color: #fffdf8; letter-spacing: .02em; }
      #promo-end .sub { font-size: 20px; font-weight: 700; color: #e8d9c6; letter-spacing: .02em; }`
    document.head.appendChild(st)
    const d = document.createElement('div'); d.id = 'promo-end'
    d.innerHTML = '<img src="/promo-logo.png" alt=""><div class="msg">한끼에서 만나요</div><div class="sub">꼬르곰·펭펭과 레꾸해요</div>'
    document.body.appendChild(d)
    requestAnimationFrame(() => { d.style.opacity = '1' })
  })
  await 잠깐(4300)   // ⛔ 배율을 안 먹인다 — 맺음말은 «읽을 시간»이 있어야 한다
}

// ─────────────────────────────────────────────────────────
await page.goto('http://127.0.0.1:4395/hankki/', { waitUntil: 'networkidle' })

// 🍚🍚 **달력에 요리 기록을 심는다** — 창업자 2026-08-16
//   📮 *"달력에 이미지 몇개는 넣어둬야하고, **15일 누를때 소불고기 아이콘이 달력에 있어야해**"*
//   📮 *"달력은 샘플이니까 이것저것 넣어도 돼. **여러개 붙여둬**"* · *"**달력 옆에는 만든 이모지가 떠야하는건데**"*
//   ⛔⛔ **앱 씨앗 데이터는 «안» 건드린다** — 그건 유저에게도 나가는 별개 결정이다.
//      여기서는 **찍을 때만** localStorage 에 심는다. 앱 코드는 한 줄도 안 바뀐다.
//   ⭐ 제목만 준다 — 그림은 앱이 알아서 고른다(`guessFoodIcon`). 아이콘 키를 손으로 박으면 규칙이 바뀔 때 낡는다.
//   ⚠️ 날짜는 «오늘에서 며칠 전»으로 계산한다 — 달력은 늘 이번 달을 열기 때문에 고정 날짜는 반드시 낡는다.
//   ⭐⭐ **두 번 여는 게 «흰 화면 번쩍»을 안 만든다** — 오프닝 오버레이를 `addInitScript` 가
//      «매 로드마다» 깔아서, 두 번째 로드도 갈색 아이콘 화면 뒤에서 일어난다.
await page.evaluate((목록) => {
  const raw = localStorage.getItem('hankki:v1'); if (!raw) return
  const st = JSON.parse(raw)
  const 이제 = Date.now()
  st.diary = [
    ...목록.map((x, i) => ({ id: `promo-cook-${i}`, at: 이제 - x[0] * 86400000, title: x[1], rating: 0 })),
    ...(st.diary || []),
  ]
  localStorage.setItem('hankki:v1', JSON.stringify(st))
}, [[1, '수제 떡갈비'], [2, '목살돼지갈비구이'], [3, '감바스'], [5, '소불고기'], [6, '콩국수'], [8, '된장찌개'], [9, '제육볶음'], [12, '소고기 미역국']])
await page.goto('http://127.0.0.1:4395/hankki/', { waitUntil: 'networkidle' })

await page.evaluate(() => document.fonts.ready)
await 손가락만들기()
await 잠깐(1600)   // ⛔ 녹화 첫 프레임이 검은 화면이라 여유를 둔다(뒤에서 잘라낸다)

장면('오프닝 — 아이콘을 누른다')
const 오프닝시작 = Date.now()   // ✂️ 여기까지가 「앞에서 준비한 시간」 = 그대로 잘라낸다
await 오프닝()

// ① 홈 — ⭐상단바에 상표 출원한 곰=ㅎ 로고가 있다
//   ⛔ 스크롤을 안 한다 — 화면이 가만히 있어야 읽힌다.
장면('① 홈')
await 쉼(3600)

// ② 레시피 — 하단바 «왼쪽부터» 차례대로 (창업자 지시)
장면('② 레시피 목록')
await 탭누르기('레시피', 1200)
await 쉼(3200)

// ③ 레시피 상세 — ⭐**콩국수 하나로 끝까지 간다.** 레시피를 바꿔 오가면 「떴던 게 또 뜬다」
장면('③ 레시피 상세 — 콩국수')
await 누르기(page.locator('.grid-card').filter({ hasText: '콩국수' }).first(), '콩국수 카드', 1300)
await 쉼(3000)

// ④ 레꾸(표지 꾸미기) — ⭐⭐필살기. 종이 왼쪽 · 스티커 서랍 오른쪽
장면('④ 레꾸 — 표지 꾸미기')
await 누르기(page.getByRole('button', { name: /꾸미|레꾸/ }).first(), '레시피 꾸미기', 1500)
await 누르기(page.getByText('친구들', { exact: true }).first(), '친구들 탭', 1100)
await 쉼(3800)

// ⑤ 요리 시작 — 창업자 *"요리시작눌러서 진행"*
장면('⑤ 요리 시작')
await 뒤로()                       // 레꾸 → 상세 (손가락은 잠깐 감춘다)
await 누르기(page.getByRole('button', { name: /요리 시작/ }).first(), '요리 시작', 1500)
await 쉼(2600)                      // 재료 준비 화면
await 누르기(page.getByRole('button', { name: /재료 준비 완료/ }).first(), '재료 준비 완료', 1400)
장면('⑥ 요리 모드 — 큰 글씨 단계')
await 쉼(3400)

// ⑦ 타이머
장면('⑦ 타이머 맞추기')
await 누르기(page.getByRole('button', { name: /타이머 맞추기/ }).first(), '이 단계 타이머 맞추기', 1400)
await 쉼(2800)
await 누르기(page.getByRole('button', { name: /분 시작$/ }).first(), '5분 시작', 1200)
장면('⑧ 타이머 도는 중')
await 쉼(3600)

// ⑨ 장보기 담기 — ⭐**상세로 돌아온 김에** 누른다. 뒤에 장보기·냉장고를 채우는 것이 이 한 번이다.
//   ⛔ 첫 판은 이걸 빼놓고 장보기로 가서 **목록이 텅 비었고** 「샀어요」를 못 찾았다.
// ⛔⛔ **타이머를 끈다** — 창업자 *"요리타이머가 계속 실행되는게 다른탭 눌러도 계속 뜸"*
//   맞다. 타이머 막대는 «앱 전체»에 뜨는 것이라 일기·장보기·냉장고 화면까지 따라다닌다.
//   보여줄 건 「요리하면서 타이머를 쓴다」이지 「영상 내내 파란 막대가 있다」가 아니다.
await page.locator('.timer-bar button').last().click({ timeout: 3000 }).catch(() => console.log('  ⚠️ 타이머 끄기 단추를 못 찾았다'))
await 잠깐(700)

장면('⑨ 장보기 담기')
await 뒤로()                       // 요리 모드 → 상세
await 누르기(page.getByRole('button', { name: /장보기 담기/ }).first(), '장보기 담기', 1600)
await 쉼(1600)

// ⑩ 일기 — 하단바 차례대로
//   ⛔⛔ 첫 판은 뒤로를 «한 번»만 해서 **상세(하단 탭이 없는 화면)** 에 선 채 일기 탭을 찾다가 못 찾았다.
//      상세 → 목록까지 나와야 하단바가 있다.
// 🗓 ⑩-1 **요리 달력** — 창업자 2026-08-16 *"이제 **일기, 달력 영상에 담고**"*
//   ⭐ 오늘 만든 화면이다(가로 = 왼쪽 달력 · 오른쪽 만든 음식). 위에서 요리 기록을 심어서
//      **달력 칸마다 그날 만든 음식 그림이 떠 있다** — 창업자 *"달력 옆에는 만든 이모지가 떠야하는건데"*.
//   ⛔ 전엔 이 화면이 «지나가는 길»이었다(2.4초). 이제는 «보여줄 것»이라 한 장면으로 센다.
장면('⑩ 요리 달력 — 그날 만든 음식이 뜬다')
await 뒤로()                       // 상세 → 목록
await 탭누르기('일기', 1300)
await 쉼(3200)

// 📔 ⑪ 일기 한 장 — 달력에서 «일기 쓴 날»을 눌러 들어간다
장면('⑪ 한끼 일기 — 그날 한 장')
await 누르기(page.locator('.cal-day .cal-diary').first().locator('xpath=..'), '일기 쓴 날', 1500)
await 쉼(3400)

// ⑪ 장보기 — ⑨에서 담은 재료가 「살 것 목록」으로 들어와 있다
장면('⑪ 장보기')
await 뒤로()                       // 일기 펼침 → 일기 목록
await 탭누르기('장보기', 1300)
await 쉼(3200)

// ⑫ 냉장고 — 「가진 재료로 만들 수 있어요」
//   ⛔ 재료가 없으면 텅 빈 화면이다 → 장보기 줄을 몇 개 «샀어요»로 만든 뒤 넘어간다
장면('⑫ 냉장고')
// ⏱ 실측에서 **이 구간이 11.4초로 제일 길었다** — 화면이 거의 안 변하는데(체크 세 번) 오래 머문다.
//   ⛔ 세 번을 두 번으로 줄이지는 않았다 — 냉장고의 「가진 재료로 만들 수 있어요」가 재료 수에 걸린다.
//   ✅ 대신 «기다리는» 부분만 깎는다(뒤대기 500→350 · 토스트 2200→1100).
for (let i = 0; i < 3; i++) {
  await 누르기(page.locator('.check-box[data-on="false"]').first(), `샀어요 ${i + 1}`, 350)
}
await 잠깐(1100)                    // 「샀어요!」 토스트가 사라질 때까지
await 탭누르기('냉장고', 1400)
await 쉼(3600)

// 🎬 맺음말 — ⛔ 홈으로 «다시 돌아가지 않는다». 창업자 *"중간에 홈이 또 떠"*
장면('맺음말 — 한끼에서 만나요')
await 엔딩()

await page.close()
await ctx.close(); await br.close(); srv.close()

const webm = fs.readdirSync(REC).find((f) => f.endsWith('.webm'))
if (!webm) { console.log('⛔ 녹화 파일이 없다'); process.exit(1) }
console.log(`\n  · 녹화 = ${webm}`)

const mp4 = `${OUT}/한끼-프로모-2508-앱실사.mp4`

// ✂️✂️ **앞자름은 «고정 숫자»가 아니라 «재서» 정한다** (창업자 2026-08-16)
//   📮 *"처음 아이콘보이고 홈화면까지 **4초야 너무 길어**"*
//   ⛔⛔ 옛 값은 `1.3` 고정이었다. 그런데 앞에서 «준비하는 시간»은 판마다 다르다 —
//      오늘 달력 씨앗을 심느라 **페이지를 두 번 열자 2.25초가 더 붙었고**, 오프닝을
//      3.9초 → 2.1초로 줄였는데도 **홈이 4.65초에야 떴다**(프레임으로 재서 알았다).
//      📌 **고정 숫자는 앞 단계가 바뀌는 순간 반드시 틀린다** — 「높이를 손으로 뺐다가
//         화면마다 어긋난」 v10.08 사고(styles.css 1811줄)와 **같은 뿌리**다.
//   ✅ 그래서 **녹화가 시작된 시각과 오프닝이 시작된 시각의 «차이»** 를 그대로 쓴다.
//      앞 준비가 길어지든 짧아지든 화면에 보이는 오프닝은 늘 같다.
//   ⭐ `+0.35` = 아이콘을 «조금은» 보여주고 시작한다(0 이면 첫 프레임부터 커서가 움직인다).
const 앞자름 = Math.max(0.2, (오프닝시작 - 녹화시작) / 1000 - 0.35)
// ⛔ `ffmpeg -i` 만 주면 **에러로 끝나고 정보는 stderr 에 있다**(옛 스크립트가 이걸로 파싱에 늘 실패했다)
const 재기 = (f) => {
  let out = ''
  try { execFileSync(ffmpeg, ['-i', f], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }
  catch (e) { out = String(e.stderr || '') }
  const m = out.match(/Duration: (\d+):(\d+):([\d.]+)/)
  return m ? (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]) : 0
}
const 원본길이 = 재기(join(REC, webm))
const 쓸길이 = Math.max(1, 원본길이 - 앞자름)
const 페이드 = 1.2
const 페이드시작 = Math.max(0, 쓸길이 - 페이드)
console.log(`  · 원본 ${원본길이.toFixed(1)}s → 앞 ${앞자름}s 자르고 ${쓸길이.toFixed(1)}s · 페이드아웃 ${페이드시작.toFixed(1)}s 부터`)

// 🎞 인코딩 — `crf 15`(유튜브가 재압축하므로 소스를 넉넉히) ＋ 끝 페이드아웃
execFileSync(ffmpeg, ['-y', '-ss', String(앞자름), '-i', join(REC, webm),
  '-r', '30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '15',
  '-maxrate', '14M', '-bufsize', '22M', '-pix_fmt', 'yuv420p',
  // ⛔⛔ **`unsharp`(선명화)를 뺐다** — 창업자 *"영상보면 하단이 그림자처럼 어둡게 되어있어"*
  //   ⭐ 스샷은 멀쩡한데 영상만 어둡다 = 앱이 아니라 «영상 처리» 문제다.
  //      선명화는 경계 둘레에 **어두운 테두리(halo)**를 만든다. 하단바 위 `border-top` 이 그 자리다.
  //   ⚠️ `lanczos` 도 링잉을 만들지만 업스케일에 필요해 남긴다 — 먼저 unsharp 부터 빼고 본다.
  //   ⛔ 이건 «제일 유력한 후보»이지 확정된 원인이 아니다. 뽑아서 창업자가 다시 봐야 한다.
  '-vf', `scale=1920:1080:flags=lanczos,fade=t=out:st=${페이드시작.toFixed(2)}:d=${페이드}`,
  '-movflags', '+faststart', '-an', mp4], { stdio: 'ignore' })

console.log(`  ✅ ${mp4}`)
console.log(`  · 길이 ${재기(mp4).toFixed(1)}s · ${(fs.statSync(mp4).size / 1024 / 1024).toFixed(1)}MB`)
console.log(errors.length ? `  ⛔ pageerror ${errors.length}건 — ${errors[0]}` : '  ✅ pageerror 0')
