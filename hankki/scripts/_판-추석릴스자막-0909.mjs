// 🏷 릴스 자막 카드를 «앱 글꼴 그대로» 투명 PNG 로 뽑는다.
// ⛔ 컨테이너엔 한글 글꼴이 WenQuanYi 하나뿐이라 PIL 로 그리면 앱과 다른 글씨가 된다.
//    → 크로미움에 앱 woff2 를 심어 그린다.
// 🎨 색은 «잰 값»으로 골랐다 (살구 화면 #fdfdfd~#fcf5ee 기준 WCAG 대비):
//    진한웜 #5d3410 = 10.51 · 먹빛 #2b2118 = 15.48 · 남색 #5878a0 = 4.48 · 다홍 #c94f3d = 4.42
//    ⛔ 보름달 노랑 #f5c451 은 살구 위에서 **1.60** — 밝은 데선 글자색으로 못 쓴다.
//       대신 «진한웜 알약 위»에서 8.85 로 살아난다. 그래서 노랑은 어두운 칸에서만 쓴다.
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
const F = (n) => readFileSync(`/home/user/hankki/hankki/src/assets/fonts/${n}`).toString('base64')
const 고운 = F('gowun-dodum-korean-400.woff2'), 개구 = F('gaegu-korean-400.woff2')

// ⭐ 창업자 = *"짜임 다르게 색깔 글자배치 등등 다 다르게"* → 넷을 «서로 다른 꼴»로 짠다.
// 🍑 창업자 2026-09-09 = *"살구색배경테마로해주구 이번엔 짜임색을 «진한색»으로 해볼까 살구에 어울리는?"*
//   🔢 살구 화면(#fcf5ee) 위 대비를 재서 골랐다 — 넷 다 «진한» 색이고 넷 다 다른 색이다:
//      대추 진홍 #8c2f27 = 7.62 · 진한 옥색 #1f4e46 = 8.69 · 진한 남색 #23395b = 10.75 · 밤갈색 #3a2518 = 13.33
//   ⭐ 옥색(청록)은 살구의 «보색 쪽»이라 제일 튀면서도 한복 색이라 안 겉돈다.
//   ⛔ 노랑 #f5c451 은 살구 위 1.60 이라 밝은 데선 못 쓴다 — «진한 칸 안»에서만 쓴다(옥색 위 5.77 · 진홍 위 5.06).
const 카드 = [
  // 📮 창업자 2026-09-09 = *"배경짜임이랑 색을 «진하게» 하자는거야"* → 넷 다 «진한 상자»로.
  //   ⭐ 그러면서 넷이 서로 달라야 한다 → 꼴(모난 상자·알약·꼬리 말풍선·큰 상자)도 넷 다 다르게.
  { id: 'c1', html: `<div class="모난상자">
      <div style="font-family:Gaegu;font-weight:700;font-size:70px;line-height:1.22">그냥 우리 홈이었는데</div>
    </div>` },
  { id: 'c2', html: `<div class="알약">
      추석이 오면 <b style="color:#f5c451">한복</b>을 입어요
    </div>` },
  // 확대 장면에 붙는 말 — 판이 휑하면 「뭘 보라는 거지」가 된다
  { id: 'c5', html: `<div class="알약" style="background:#8c2f27">
      홈에 <b style="color:#f5c451">보름달</b>이 떴어요
    </div>` },
  { id: 'c6', html: `<div class="알약" style="background:#5b2a45">
      꼬르곰도 <b style="color:#f5c451">한복</b>을 입고
    </div>` },
  { id: 'c3', html: `<div class="말풍선">탭마다 애들이 <u>갈아입어요</u><i></i></div>` },
  { id: 'c4', html: `<div class="큰상자">
      <div style="font-family:Gaegu;font-weight:700;font-size:78px;line-height:1.2">9월 30일까지만</div>
      <div style="font-family:Gaegu;font-weight:700;font-size:78px;line-height:1.2;color:#f5c451">볼 수 있어요</div>
      <div style="font-family:'Gowun Dodum';font-size:32px;margin-top:20px;opacity:.82">한끼 · 오늘도 한 끼 해냈다</div>
    </div>` },
]

const css = `
@font-face{font-family:'Gowun Dodum';src:url(data:font/woff2;base64,${고운}) format('woff2')}
@font-face{font-family:'Gaegu';src:url(data:font/woff2;base64,${개구}) format('woff2');font-weight:700}
body{margin:0;background:transparent}
.칸{display:inline-block;padding:24px}
/* ⛔⛔ 2026-09-09 시안 1판 = 이 자막이 «한끼 소식 카드 글자»와 겹쳐 뭉개졌다.
   그림자만으론 못 이긴다 — 앱 화면엔 글자가 빽빽하다.
   ✅ 글자 «둘레»를 흰색으로 두껍게 두른다(paint-order 로 획을 글자 «뒤»에 깐다).
      그러면 배경이 무엇이든 읽히면서도 「글자만 얹은」 꼴은 그대로다. */
/* ⛔ 1판은 «글자만» 얹었더니 한끼 소식 카드 글자와 겹쳐 뭉개졌다 — 앱 화면엔 글자가 빽빽하다.
   ✅ 진한 상자를 깔면 그 문제가 통째로 사라진다(창업자 지시와도 같은 방향).
   🔢 흰 글씨 대비 = 밤갈색 14.41 · 옥색 9.39 · 진홍 8.23 · 남색 11.62 — 넷 다 넉넉하다.
      노랑 #f5c451 은 그 위에서 8.85 / 5.77 / 5.06 / 7.13 → 포인트로 쓸 수 있다. */
.모난상자{background:#3a2518;color:#fff;padding:30px 40px;border-radius:10px;
  box-shadow:0 14px 30px rgba(58,37,24,.34);text-align:left}
.큰상자{background:#5b2a45;color:#fff;padding:34px 54px;border-radius:40px;
  box-shadow:0 16px 34px rgba(91,42,69,.34);text-align:center}
/* 📮 창업자 2026-09-09 = *"우리 알약색 바꾸면 안되나 가을인데 추워보여"* — 맞는 말이다.
   ⛔ 옥색(#1f4e46)·남색(#23395b)은 «찬 쪽»이라 살구·단풍과 겉돈다.
   ✅ 넷을 다 «따뜻한 진한 색»으로 바꿨다 — 밤갈 → 군고구마 → 대추진홍 → 가지자주.
   🔢 흰 글씨 대비 = 14.41 / 8.50 / 8.23 / 11.28 · 노랑 포인트 = 8.85 / 5.22 / 5.06 / 6.93 (전부 넉넉) */
.알약{font-family:'Gowun Dodum';font-size:46px;color:#fff;background:#7a3b1e;
  padding:26px 46px;border-radius:999px;box-shadow:0 12px 28px rgba(122,59,30,.32)}
/* ⭐ 말풍선은 알약과 «반대로» 짰다 — 알약이 옥색이면 이건 진홍, 알약이 둥근 알약이면 이건 모난 상자. */
.말풍선{position:relative;font-family:'Gowun Dodum';font-size:46px;color:#fff;background:#8c2f27;
  padding:26px 40px;border-radius:22px;box-shadow:0 12px 28px rgba(140,47,39,.30)}
.말풍선 u{text-decoration:none;box-shadow:inset 0 -14px 0 rgba(245,196,81,.55)}
.말풍선 i{position:absolute;left:56px;top:-20px;width:0;height:0;
  border-left:16px solid transparent;border-right:16px solid transparent;border-bottom:22px solid #8c2f27}
`
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await (await b.newContext({ viewport: { width: 1080, height: 700 }, deviceScaleFactor: 1 })).newPage()
for (const c of 카드) {
  await p.setContent(`<style>${css}</style><div class="칸" id="t">${c.html}</div>`)
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(300)
  await p.locator('#t').screenshot({ path: `/tmp/추석릴스/${c.id}.png`, omitBackground: true })
  const r = await p.locator('#t').boundingBox()
  console.log(c.id, Math.round(r.width) + 'x' + Math.round(r.height))
}
await b.close()
