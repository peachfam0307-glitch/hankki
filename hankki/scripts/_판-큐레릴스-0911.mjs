// 🎬🛒 **주부 큐레이션 릴스 — 「말이 먼저, 제품이 나중」** (2026-09-11)
//
// 📮 창업자 = *"주부큐레이션 릴스하나 만들어줘. 짜임 다르고 독특하게 큐레이션이 잘~~보이게(설명이랑)"*
//    ＋ 넣을 말 = *"올해 18년차 주부가 직접 써보고 추천하는 한끼 추천 재료들을 소개합니다.
//       매주토요일 업데이트. 제가 대신 많이 써보고 계속 좋은 재료, 맛있는 재료 추천할게요."*
//
// ⭐⭐ **왜 「말이 먼저」인가** — 광고는 제품부터 보여준다. 우리 값어치는 제품이 아니라
//    «18년차 주부가 직접 써본 말»이다. 낫또 설명이 그 증거다 —
//    *"낫또를 썩 좋아하진 않는데… 그중에 자연드림 낫또가 제 입맛에는 제일 괜찮았어요"*
//    ⛔ 파는 사람은 이렇게 안 쓴다. 그래서 이 말이 먼저 크게 나오고 제품이 뒤따른다.
//
// 🚩 **글은 창업자가 쓴 것에서 «떼어내기만» 했다 — 한 글자도 지어내지 않았다.**
//    원본 = `src/data/curation.js` 의 benefit (아래 각 장에 원문을 그대로 달아 뒀다)
//
// 🔢 잰 값으로 정한 것 셋
//   ① 인스타 안전 띠 = 위 240 · 아래 384 (커밋 914840ed 창업자 실측 · `_판-릴스시안자르기-0903.mjs`)
//      → 글·제품은 **y 300~1500** 안에만 앉힌다.
//   ② 제품 원본이 작다 = 173x200 · 198x200 · 200x162 (PIL 실측) → **최대 2배(400px)까지만** 키운다.
//      ⛔ 3배로 키우면 뭉갠다. 2026-09-03 *"너무 지저분해보여"* 가 그 사고였다.
//      ⭐ 그래서 제품을 작게 두고 «말»을 크게 쓰는 짜임이 된 것이다 — 제약이 짜임을 정했다.
//   ③ 길이 = 훅 2.2 ＋ 제품 3x3.2 ＋ 끝 2.2 = **14.0초** (기존 확정 릴스 15.15·19.98초보다 짧다)
//
// 🎨 색은 대비를 재서 골랐다 (종이 바탕 #f6f1e7 위 WCAG):
//    먹빛 #2b2118 = 14.3 · 진한웜 #5d3410 = 9.7 · 더스티블루 #5878a0(앱 포인트색) = 4.4
//    ⛔ 더스티블루는 큰 글씨·알약에만 쓴다(작은 본문엔 4.4 라 아슬하다).
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = '/home/user/hankki/hankki'
const 낼곳 = process.env.SHOT_DIR || '/tmp/큐레릴스'
mkdirSync(낼곳, { recursive: true })
const F = (n) => readFileSync(`${ROOT}/src/assets/fonts/${n}`).toString('base64')
const IMG = (p) => readFileSync(`${ROOT}/${p}`).toString('base64')
const 개구 = F('gaegu-korean-400.woff2'), 고운 = F('gowun-dodum-korean-400.woff2'), 주아 = F('jua-korean-400.woff2')

const W = 1080, H = 1920
const 위덮임 = 240, 아래덮임 = 384

// 🛒 이번 주(2026-09-12 토) 열리는 셋 — `curation.js` 의 from:'2026-09-12' 그대로다
const 제품 = [
  {
    key: 'cu_ghee', 이름: '기버터 260g', 브랜드: '마야항아리',
    말: '올리브유·버터 대신<br><b>고소하게</b> 쓰고 있어요',
    덧: '소비기한이 짧으니 작은 병에 담아서',
    // 📄 원문 = "앵커버터 100%로 만든 기버터예요. 품질이 정말 좋고 고소해서 올리브유·버터 대용으로
    //          쓰면 좋아요. 소비기한이 짧으니 작은 병으로 담아보세요"
    색: '#5d3410', 바탕: '#f6f1e7',
  },
  {
    key: 'cu_makguksu', 이름: '들기름막국수', 브랜드: '샐러드판다',
    말: '다이어트 할 때<br><b>많이 사먹었어요</b>',
    덧: '소스도 짜지 않고 맛있어요',
    // 📄 원문 = "다이어트 할 때 많이 사먹었던 들기름막국수예요. 간단하고 소스도 짜지 않고 맛있어서 추천해요"
    색: '#1f4e46', 바탕: '#eef2ea',
  },
  {
    key: 'cu_natto', 이름: '낫또', 브랜드: '자연드림',
    말: '<b>썩 좋아하진 않는데</b><br>브랜드별로<br>다 먹어봤어요',
    덧: '그중에 이게 제 입맛엔 제일 괜찮았어요',
    // 📄 원문 = "낫또를 썩 좋아하진 않는데 몸에 좋다고 해서 브랜드별로 거의 먹어봤어요.
    //          그중에 자연드림 낫또가 제 입맛에는 제일 괜찮았어요. 저같은 낫또 초심자 추천"
    // ⭐⭐ 이 장이 릴스의 «심장»이다 — 파는 사람은 「썩 좋아하진 않는데」라고 안 쓴다.
    색: '#23395b', 바탕: '#edf0f5',
  },
]

const css = `
@font-face{font-family:'Gaegu';src:url(data:font/woff2;base64,${개구}) format('woff2');font-weight:700}
@font-face{font-family:'Gowun Dodum';src:url(data:font/woff2;base64,${고운}) format('woff2')}
@font-face{font-family:'Jua';src:url(data:font/woff2;base64,${주아}) format('woff2')}
*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;overflow:hidden}
.판{width:${W}px;height:${H}px;position:relative;display:flex;flex-direction:column;
  align-items:center;justify-content:center;padding:${위덮임 + 60}px 80px ${아래덮임 + 60}px}
/* 📐 안전 띠를 «눈에 보이게» 그려 두는 판(검수용) — 실제 판엔 안 그린다 */
.띠{position:absolute;left:0;right:0;background:rgba(200,60,60,.14);
  border-top:2px dashed rgba(200,60,60,.5);border-bottom:2px dashed rgba(200,60,60,.5)}
.띠.위{top:0;height:${위덮임}px} .띠.아래{bottom:0;height:${아래덮임}px}
.띠 span{position:absolute;right:18px;bottom:10px;font-family:'Gowun Dodum';font-size:26px;color:#a33}

/* 🔢 「1 / 3」 — 큐레이션이라는 «묶음»으로 보이게 한다. 이게 없으면 그냥 제품 광고 셋이다. */
.차례{font-family:'Jua';font-size:40px;letter-spacing:2px;opacity:.5;margin-bottom:40px}
/* 💬 말이 주인공 — 제일 큰 글씨 */
.말{font-family:'Gaegu';font-weight:700;font-size:96px;line-height:1.32;text-align:center}
.말 b{position:relative;white-space:nowrap}
/* ✏️ 강조는 «밑줄»로 — 색을 또 하나 쓰면 장마다 색이 넷이 된다 */
.말 b::after{content:'';position:absolute;left:-6px;right:-6px;bottom:6px;height:16px;
  background:currentColor;opacity:.2;border-radius:8px;z-index:-1}
.덧{font-family:'Gowun Dodum';font-size:44px;line-height:1.5;opacity:.72;margin-top:36px;text-align:center}
/* 📦 제품은 «말 뒤에» 올라온다 — 작게 두는 게 맞다(원본 200px) */
.제품{margin-top:80px;display:flex;flex-direction:column;align-items:center;gap:26px}
.제품 img{height:400px;filter:drop-shadow(0 18px 34px rgba(60,45,30,.22))}
.이름{font-family:'Jua';font-size:56px}
.브랜드{font-family:'Gowun Dodum';font-size:36px;opacity:.6;margin-top:-14px}

/* 🎬 훅 — 첫 0.5초에 「18년차 주부」가 안 뜨면 광고로 보고 넘긴다 */
.훅{background:#f6f1e7;color:#2b2118}
.훅 .년차{font-family:'Jua';font-size:150px;line-height:1.1;color:#5878a0}
.훅 .큰{font-family:'Gaegu';font-weight:700;font-size:104px;line-height:1.3;margin-top:20px;text-align:center}
.훅 .작은{font-family:'Gowun Dodum';font-size:46px;line-height:1.6;opacity:.74;margin-top:44px;text-align:center}
.장바구니{display:flex;gap:30px;margin-top:76px;align-items:flex-end}
.장바구니 img{height:180px;filter:drop-shadow(0 14px 26px rgba(60,45,30,.2))}

/* 🏁 끝 — 훅과 «같은 바탕»으로 끝낸다. 릴스는 돌아서 첫 장으로 이어진다. */
.끝{background:#f6f1e7;color:#2b2118}
.끝 .토{font-family:'Jua';font-size:112px;color:#5878a0;line-height:1.2;text-align:center}
.끝 .말2{font-family:'Gaegu';font-weight:700;font-size:76px;line-height:1.36;margin-top:40px;text-align:center}
.끝 .앱{font-family:'Jua';font-size:64px;margin-top:80px}
.끝 .꼬리{font-family:'Gowun Dodum';font-size:40px;opacity:.62;margin-top:14px}
`

const 장면 = []
장면.push({ id: '1-훅', html: `<div class="판 훅">
  <div class="년차">18년차</div>
  <div class="큰">주부가 <b>직접 써보고</b><br>추천합니다</div>
  <div class="작은">좋은 재료 고르는 게 제일 어렵잖아요<br>제가 대신 많이 써봤어요</div>
  <div class="장바구니">
    ${제품.map((p) => `<img src="data:image/png;base64,${IMG(`src/assets/curation/${p.key}.png`)}">`).join('')}
  </div>
</div>` })

제품.forEach((p, i) => {
  장면.push({ id: `${i + 2}-${p.key}`, html: `<div class="판" style="background:${p.바탕};color:${p.색}">
    <div class="차례">${i + 1} / 3</div>
    <div class="말">${p.말}</div>
    <div class="덧">${p.덧}</div>
    <div class="제품">
      <img src="data:image/png;base64,${IMG(`src/assets/curation/${p.key}.png`)}">
      <div class="이름">${p.이름}</div>
      <div class="브랜드">${p.브랜드}</div>
    </div>
  </div>` })
})

장면.push({ id: '5-끝', html: `<div class="판 끝">
  <div class="토">매주 토요일<br>새로 올라와요</div>
  <div class="말2">계속 써보고<br><b>맛있는 것만</b> 골라올게요</div>
  <div class="앱">한끼 · 주부의 장바구니</div>
  <div class="꼬리">오늘도 한 끼 해냈다</div>
</div>` })

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
const p = await ctx.newPage()

let 나쁨 = 0
const 말하기 = (ok, s, 덤 = '') => { if (!ok) 나쁨++; console.log(`${ok ? '✅' : '⛔'} ${s}${덤 ? ' — ' + 덤 : ''}`) }

for (const s of 장면) {
  await p.setContent(`<style>${css}</style>${s.html}`)
  await p.waitForTimeout(260)
  await p.screenshot({ path: join(낼곳, `${s.id}.png`) })
  // 📐 **안전 띠를 넘는 게 있나 — 눈이 아니라 자로 잰다**
  const 넘침 = await p.evaluate(([위, 아래, H]) => {
    const 밖 = []
    for (const el of document.querySelectorAll('.판 *')) {
      if (!el.textContent?.trim() && el.tagName !== 'IMG') continue
      if (el.children.length && el.tagName !== 'IMG') continue // 잎만 잰다
      const r = el.getBoundingClientRect()
      if (r.height === 0) continue
      if (r.top < 위 || r.bottom > H - 아래) 밖.push(`${el.className || el.tagName} y${Math.round(r.top)}~${Math.round(r.bottom)}`)
    }
    return 밖
  }, [위덮임, 아래덮임, H])
  말하기(넘침.length === 0, `${s.id} — 안전 띠 안에 다 들어온다`, 넘침.join(' · '))

  // ✂️✂️ **내가 넣은 줄바꿈대로 «정확히» 줄이 지는가 — 자로 잰다**
  //   ⛔⛔ 1판에서 낫또 장의 「요」 한 글자가 **세 번째 줄로 떨어졌다**(96px x 12자 > 폭 920px).
  //      같은 날 낮 냉장고 꼬리말에서 창업자가 잡은 그 모양이다 — *"설명2줄이 끊어지자나"*.
  //   ⭐ 눈으로만 보면 «다음 문구»에서 또 터진다. 그래서 잰다 =
  //      「실제 줄 수」(높이 ÷ 한 줄 높이)가 「내가 넣은 <br> 수 + 1」과 같아야 한다.
  const 줄넘침 = await p.evaluate(() => {
    const 밖 = []
    for (const el of document.querySelectorAll('.말, .덧, .큰, .작은, .토, .말2')) {
      const 넣은줄 = el.innerHTML.split(/<br\s*\/?>/i).length
      const 한줄 = parseFloat(getComputedStyle(el).lineHeight)
      const 실제줄 = Math.round(el.getBoundingClientRect().height / 한줄)
      if (실제줄 !== 넣은줄) 밖.push(`${el.className}: 넣은 ${넣은줄}줄 → 실제 ${실제줄}줄`)
    }
    return 밖
  })
  말하기(줄넘침.length === 0, `${s.id} — 줄이 내가 나눈 그대로 진다`, 줄넘침.join(' · '))
}

// 🖼 한 판에 이어 붙여서 «짜임»을 한눈에 본다
//   ⛔ `setContent` 는 about:blank 라 **`file://` 을 못 읽는다** — 1판이 통째로 깨진 판으로 나왔다.
//      숫자는 전부 초록불이었고 **캡처를 눈으로 열어서** 잡았다(규칙 21). 그래서 base64 로 심는다.
const 붙임 = await ctx.newPage()
await 붙임.setViewportSize({ width: 장면.length * 300 + 40, height: 574 })
await 붙임.setContent(`<body style="margin:0;background:#20242c;display:flex;gap:10px;padding:20px">
  ${장면.map((s) => `<img src="data:image/png;base64,${readFileSync(join(낼곳, `${s.id}.png`)).toString('base64')}" style="width:280px;border-radius:8px">`).join('')}
</body>`)
await 붙임.waitForTimeout(600)
await 붙임.screenshot({ path: join(낼곳, '0-짜임전체.png') })
console.log(`\n📸 ${join(낼곳, '0-짜임전체.png')}`)

await b.close()
console.log(`\n⏱ 길이 = 훅 2.2 ＋ 제품 3x3.2 ＋ 끝 2.2 = 14.0초`)
console.log(나쁨 ? `⛔ ${나쁨}칸 빨간불` : '✅ 전부 초록불')
process.exit(나쁨 ? 1 : 0)
