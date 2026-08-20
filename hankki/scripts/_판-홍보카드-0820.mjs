// 📣📣 홍보 카드 — 카톡·인스타에 뿌릴 그림을 «앱 자산»으로 만든다 (2026-08-20)
//
// 📮 창업자 = *"나 카톡에 올릴 홍보영상이랑 카드만들어줄래 우리 인스타에 올릴 것도 만들어야해"*
//    → *"카톡 세로로 긴 카드하나 가로로 긴 카드하나 만들어줘"*
//    → *"세로버전도 하나 만들어줘 (다운로드 넣어서 구글플레이스토-한끼)요거"*
//
// ⭐⭐ **글자를 그림에 «굽지» 않는다** — 여기서 HTML 로 그리고 찍는다.
//    ⛔ 2026-07-31 스토어 스샷 사고가 그것이었다 — 앱 밖에서 따로 그려서
//       **앱 문구가 바뀌어도 스샷이 안 따라왔고**, 이모지가 깨진 채로 스토어에 올라가 있었다.
//    ✅ 그래서 슬로건·안내는 전부 이 파일의 글자다. 고칠 게 있으면 여기 한 곳만 고친다.
//
// 🖼 캐릭터 = **창업자 최종 판**(2026-08-10 · 카롱이 «은은한 미소»인 그것)
//    ⛔ `캐릭터-세계관-확장-2507/⭐정본-5인-삼각구도.png` 는 **옛 카피바라**다 — 창업자 2026-08-20
//       *"아니야 쟤는 예전카피바라야"* · *"방금니가 준 카피바라 있는 이미지는 다 폐기해"*
//    ⭐ 흰 배경은 `tools/배경빼기-한장.py` 로 미리 뺀다(크림 카드에 얹으려고).
//
// ⚠️⚠️ **「Google Play 에서 찾기」를 넣는 시점** — 2026-08-20 지금은 **검토 중**이라 스토어에 «없다».
//    검토가 최대 7일이니 **게시된 걸 확인한 뒤에 뿌린다.** 만들어 두는 건 괜찮다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-홍보카드-0820.mjs
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홍보'
mkdirSync(OUT, { recursive: true })

// 📦 그림·글씨체를 data URI 로 심는다 — 파일 경로로 두면 캡처가 «빈 칸»으로 찍힌다(권한·타이밍)
const b64 = (p) => readFileSync(p).toString('base64')
const 그림 = (p) => `data:image/png;base64,${b64(p)}`
const 글씨 = (p) => `data:font/woff2;base64,${b64(p)}`

const 다섯 = 그림(join(OUT, '5인-투명.png'))
const 로고 = 그림(join(ROOT, 'design/promo/logo/한끼로고-곰ㅎ-브라운-2507.png'))
const F = (n) => 글씨(join(ROOT, 'src/assets/fonts', n))

// 🎨 색 — 앱 톤 그대로. ⛔새로 지어내지 않는다
//    크림 #fffdf8 · 진한 웜브라운 #5d3410 은 로고 확정색(2026-07-23)이다.
const 색 = {
  바탕1: '#f7f1e6', 바탕2: '#fdfaf4',
  잉크: '#4a3520', 연잉크: '#8a7355',
  강조: '#c2762e',      // 「레꾸」 — 곰 몸색(#EBAB73)의 진한 판
  로고: '#5d3410',
}

const 머리 = `
<style>
  @font-face{font-family:'BHS';src:url('${F('blackhansans-korean-400.woff2')}') format('woff2')}
  @font-face{font-family:'BHS';src:url('${F('blackhansans-latin-400.woff2')}') format('woff2')}
  @font-face{font-family:'GD';src:url('${F('gowun-dodum-korean-400.woff2')}') format('woff2')}
  @font-face{font-family:'GD';src:url('${F('gowun-dodum-latin-400.woff2')}') format('woff2')}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'GD',sans-serif;color:${색.잉크};-webkit-font-smoothing:antialiased}
  .판{background:linear-gradient(170deg,${색.바탕1} 0%,${색.바탕2} 55%,${색.바탕1} 100%);
      position:relative;overflow:hidden;display:flex}
  /* 🌾 아주 옅은 점무늬 — 밋밋한 단색을 피한다. 크림 위 크림이라 «안 보일 듯 보인다» */
  .판::before{content:'';position:absolute;inset:0;opacity:.5;
    background-image:radial-gradient(${색.연잉크}22 1.5px,transparent 1.6px);
    background-size:26px 26px}
  .속{position:relative;z-index:1;width:100%;display:flex}
  .로고{display:flex;align-items:center;gap:0}
  .슬로건{font-family:'BHS',sans-serif;color:${색.잉크};letter-spacing:-.02em;line-height:1.22;text-wrap:balance}
  .레꾸{color:${색.강조}}
  .부제{color:${색.연잉크};font-weight:400}
  /* 🏷 스토어 알약 — 「어디서 찾나」를 한 줄로. ⛔배지 그림을 흉내내지 않는다(구글 상표라 규격이 따로 있다) */
  .알약{display:inline-flex;align-items:center;gap:.5em;background:${색.로고};color:#fffdf8;
        border-radius:999px;font-family:'BHS',sans-serif;letter-spacing:-.01em;white-space:nowrap}
  .알약 b{color:#ffd9a8}
</style>`

// ─────────────────────────────────────────────────────────────
// ① 세로로 긴 카드 — 카톡·인스타 릴스·스토리 (1080×1920)
const 세로 = `${머리}
<div class="판" style="width:1080px;height:1920px;flex-direction:column">
 <div class="속" style="flex-direction:column;align-items:center;padding:104px 76px 92px">

  <div class="로고" style="margin-bottom:8px">
    <img src="${로고}" style="height:132px">
  </div>
  <div class="부제" style="font-size:30px;letter-spacing:.16em;margin-bottom:56px">HANKKI</div>

  <img src="${다섯}" style="width:100%;max-width:940px;filter:drop-shadow(0 18px 34px #5d341018)">

  <div class="슬로건" style="font-size:82px;text-align:center;margin-top:60px">
    한 끼를 해낸다면,<br><span class="레꾸">레꾸</span>하세요.
  </div>
  <div class="부제" style="font-size:38px;margin-top:26px">레시피를 예쁘게 꾸미는 앱</div>

  <div style="flex:1"></div>

  <div class="알약" style="font-size:40px;padding:28px 54px">
    Google Play 에서 <b>한끼</b> 검색
  </div>
  <div class="부제" style="font-size:27px;margin-top:22px;letter-spacing:.01em">
    회원가입 없이 바로 시작해요
  </div>
 </div>
</div>`

// ─────────────────────────────────────────────────────────────
// ② 가로로 긴 카드 — 카톡 링크 미리보기·블로그 (1200×630)
//    ⭐ 세로와 «다른 판»이 아니라 «같은 옷을 눕힌 것»이다 — 글은 왼쪽, 캐릭터는 오른쪽.
const 가로 = `${머리}
<div class="판" style="width:1200px;height:630px">
 <div class="속" style="align-items:center;padding:0 0 0 74px;gap:12px">

  <div style="flex:0 0 500px;display:flex;flex-direction:column;align-items:flex-start">
    <div class="로고" style="margin-bottom:20px"><img src="${로고}" style="height:74px"></div>
    <div class="슬로건" style="font-size:56px;text-align:left">
      한 끼를 해낸다면,<br><span class="레꾸">레꾸</span>하세요.
    </div>
    <div class="부제" style="font-size:25px;margin-top:16px">레시피를 예쁘게 꾸미는 앱</div>
    <div class="알약" style="font-size:25px;padding:17px 32px;margin-top:30px">
      Google Play 에서 <b>한끼</b> 검색
    </div>
  </div>

  <img src="${다섯}" style="width:648px;margin-right:-34px;filter:drop-shadow(0 14px 26px #5d341018)">
 </div>
</div>`

// ─────────────────────────────────────────────────────────────
// ③ 인스타 피드 — 4:5 (1080×1350). 세로 카드보다 짧아 «캐릭터 ＋ 슬로건»만 담는다
const 피드 = `${머리}
<div class="판" style="width:1080px;height:1350px;flex-direction:column">
 <div class="속" style="flex-direction:column;align-items:center;padding:70px 70px 62px">
  <div class="로고"><img src="${로고}" style="height:104px"></div>
  <img src="${다섯}" style="width:100%;max-width:900px;margin-top:24px;filter:drop-shadow(0 16px 30px #5d341018)">
  <div class="슬로건" style="font-size:72px;text-align:center;margin-top:40px">
    한 끼를 해낸다면,<br><span class="레꾸">레꾸</span>하세요.
  </div>
  <div style="flex:1"></div>
  <div class="알약" style="font-size:33px;padding:22px 44px">
    Google Play 에서 <b>한끼</b> 검색
  </div>
 </div>
</div>`

const 판들 = [
  { 이름: '카드-세로-1080x1920', html: 세로, w: 1080, h: 1920 },
  { 이름: '카드-가로-1200x630', html: 가로, w: 1200, h: 630 },
  { 이름: '카드-인스타피드-1080x1350', html: 피드, w: 1080, h: 1350 },
]

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
for (const 판 of 판들) {
  const page = await b.newPage({ viewport: { width: 판.w, height: 판.h }, deviceScaleFactor: 1 })
  await page.setContent(`<!doctype html><meta charset="utf-8">${판.html}`, { waitUntil: 'load' })
  // ⚠️ 글씨체가 아직 안 올라온 채 찍으면 «다른 글씨»로 나온다 — 기다린다(규칙 18: 「있나」가 아니라 「됐나」)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(280)
  const el = await page.locator('.판').first()
  await el.screenshot({ path: join(OUT, `${판.이름}.png`) })
  await page.close()
  console.log(`✅ ${판.이름}.png`)
}
await b.close()
console.log(`\n📁 ${OUT}`)
console.log('⚠️ 뿌리기 «전»에 스토어에 실제로 올라왔는지 확인할 것 — 2026-08-20 지금은 검토 중이다.')
