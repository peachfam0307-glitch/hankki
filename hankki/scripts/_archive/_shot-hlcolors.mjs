// 🖍🎨 형광펜 색 후보 — 창업자 판정용 실물 판 (2026-08-06)
//
// 창업자 *"색깔 노랑아니어도 돼.."* → **노랑을 기준으로 삼지 않는다.**
//   ⛔ 처음엔 속지 「고른 표시」의 노랑(#f0d98a)에 나머지를 맞췄는데, 그건 «그 자리» 색이지
//      형광펜이 따라야 할 이유가 없었다. 내가 스스로 만든 제약이었다.
//
// ⭐⭐ **형광펜은 「색칩」으로 못 고른다** — `multiply` 라 종이 위에 «칠해진 뒤»에야 진짜 색이 나온다.
//    그래서 이 판은 색칩을 늘어놓지 않고 **실제 글자 위에 그은 자국**으로 보여준다.
// ⭐ 종이색 다섯(아이보리·하늘·분홍·세이지·크라프트)이 다 다르므로 **아이보리·크라프트 두 종이**에
//    같은 팔레트를 나란히 얹는다 — 어두운 종이에서 죽는 색을 여기서 걸러낸다.
// ⛔ 형광색(네온)은 후보에 안 넣는다 — 우리 톤이 뮤트라는 건 창업자 판정과 무관한 앱 전체 규칙이다.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })

// 🎨 팔레트 네 벌 — «성격»이 다르게 잡았다. 섞어 고르는 게 아니라 한 벌을 고르는 판이다.
const SETS = [
  {
    key: 'A', name: '파스텔 여섯', why: '흔한 형광펜 여섯 색을 우리 톤으로 낮춘 것. 무난하고 다 쓰인다',
    colors: [['노랑', '#f0d98a'], ['민트', '#b6ddc4'], ['하늘', '#aecfe4'], ['분홍', '#efb9c2'], ['라일락', '#cdbde2'], ['살구', '#f2c6a2']],
  },
  {
    key: 'B', name: '흙빛 여섯', why: '우리 앱 색(테라코타·올리브·크림)에서 뽑은 것. 제일 «한끼»답다',
    colors: [['모래', '#e8d6b0'], ['올리브', '#d3ddb4'], ['세이지', '#c3d6c8'], ['테라코타', '#eec4b2'], ['로즈', '#e8c3c8'], ['라벤더', '#d2c9de'],
    ],
  },
  {
    key: 'C', name: '맑은 여섯', why: 'A 보다 한 단 맑고 또렷하다. 크라프트 종이에서도 안 죽는다',
    colors: [['레몬', '#f5e07a'], ['라임', '#cfe89a'], ['아쿠아', '#a8dfdf'], ['코랄', '#f7bcb0'], ['자몽', '#f6c8d8'], ['바이올렛', '#c7bbe8']],
  },
  {
    key: 'D', name: '차분한 넷', why: '여섯이 많으면 고르기 어렵다. 넷이면 아무거나 골라도 안 촌스럽다',
    colors: [['노랑', '#eddba0'], ['세이지', '#c8d8c0'], ['하늘', '#bcd2e2'], ['분홍', '#ebc6c9']],
  },
]
const PAPERS = [['아이보리', '#FAF7F0'], ['크라프트', '#E8D9BD']]

const html = `<!doctype html><meta charset="utf-8">
<style>
  @font-face { font-family: Gaegu; src: local('Gaegu'); }
  body { margin: 0; background: #f2efe9; font-family: system-ui, -apple-system, 'Noto Sans KR', sans-serif; color: #3b3229; }
  .wrap { width: 900px; margin: 0 auto; padding: 26px 22px 34px; }
  h1 { font-size: 21px; margin: 0 0 4px; }
  .sub { font-size: 13px; color: #7b6f61; margin: 0 0 22px; line-height: 1.6; }
  .set { margin: 0 0 26px; border: 1px solid #ded5c6; border-radius: 14px; background: #fff; overflow: hidden; }
  .head { padding: 12px 16px; background: #f7f3ea; border-bottom: 1px solid #ece3d4; }
  .name { font-size: 17px; font-weight: 800; }
  .why { font-size: 12.5px; color: #7b6f61; margin-top: 3px; }
  .papers { display: flex; }
  .paper { flex: 1; padding: 14px 16px 18px; }
  .paper + .paper { border-left: 1px solid #ece3d4; }
  .plabel { font-size: 11px; color: #8c8071; margin: 0 0 9px; letter-spacing: .04em; }
  .sheet { border-radius: 9px; padding: 14px 15px 9px; }
  .row { position: relative; height: 34px; display: flex; align-items: center; }
  .word { font-size: 19px; font-weight: 700; position: relative; z-index: 1; color: #4a3f33; }
  .pen { position: absolute; left: -5px; height: 21px; border-radius: 8% 10% 9% 7%/46% 54% 50% 50%;
         opacity: .5; mix-blend-mode: multiply; }
  .cname { position: absolute; right: 4px; font-size: 10.5px; color: #8c8071; z-index: 2; }
</style>
<div class="wrap">
  <h1>🖍 형광펜 색 후보 — 한 벌만 고르면 돼</h1>
  <p class="sub">
    ⭐ <b>색칩이 아니라 「실제로 그은 자국」</b>이야 — 형광펜은 종이 위에 칠해진 뒤에야 진짜 색이 나와서 색칩으론 판단이 안 된다.<br>
    ⭐ 왼쪽 = 아이보리 종이, 오른쪽 = <b>크라프트</b>(제일 어두운 종이). <b>오른쪽에서 안 죽는 색</b>이 진짜 쓸 수 있는 색이야.<br>
    말만 해줘 — <b>A·B·C·D 중 하나</b>, 또는 「A인데 몇 번째를 B 거로」 처럼 섞어도 돼.
  </p>
  ${SETS.map((s) => `
    <div class="set">
      <div class="head"><div class="name">${s.key}. ${s.name}</div><div class="why">${s.why}</div></div>
      <div class="papers">
        ${PAPERS.map(([pn, pc]) => `
          <div class="paper">
            <div class="plabel">${pn} 종이</div>
            <div class="sheet" style="background:${pc}">
              ${s.colors.map(([cn, cc]) => `
                <div class="row">
                  <span class="pen" style="background:${cc}; width:${Math.round(56 + cn.length * 3)}%"></span>
                  <span class="word">오늘도 해냈다</span>
                  <span class="cname">${cn}</span>
                </div>`).join('')}
            </div>
          </div>`).join('')}
      </div>
    </div>`).join('')}
</div>`

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 900, height: 1400 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
const f = join(OUT, '형광펜-색후보.png')
await page.screenshot({ path: f, fullPage: true })
console.log('🖼', f)
await b.close()
