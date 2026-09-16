// 💬 카카오톡 프로필 «배경» 1080×1920 — 「한끼 레시피북 · 아이폰 안드로이드 둘 다」 (2026-09-16)
//
// 📮 창업자 = *"나 카카오톡에 한끼 아이폰, 구글 배경하나해줄래? 심플하게"*
//
// ⛔⛔ **카톡 프로필은 «아래 절반»을 앱이 덮는다** — 프로필 사진(원형)·이름·상태메시지·맨 아래 단추 줄.
//    👉 그래서 **글자는 위 40%(top 0~760px) 안**에 둔다. 아래에 적으면 이름표에 가려 안 읽힌다.
//    ⭐ 반대로 «아래»는 비워 두는 게 맞다 — 거기에 창업자 프로필 사진이 온다.
//
// ⛔ 유니코드 이모지를 쓰지 않는다(절대원칙) — 그림은 꼬르곰·펭펭 컷이 한다.
// ⭐ 캐릭터 이름은 늘 풀네임(꼬르곰·펭펭). 「곰펭」은 둘을 함께 부를 때만.
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const R = dirname(dirname(fileURLToPath(import.meta.url)))   // ⛔컨테이너 경로를 박지 않는다
const 낼곳 = process.env.OUT || '/tmp/claude-0/카톡배경'
rmSync(낼곳, { recursive: true, force: true }); mkdirSync(낼곳, { recursive: true })

const 짐 = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64')
const 축하 = (n) => 짐(join(R, `docs/stickers/여름-창업자-2507/낱개-콤비축하/${n}.png`))
const 폰트 = readFileSync(join(R, 'src/assets/fonts/gowun-dodum-korean-400.woff2')).toString('base64')
const 폰트L = readFileSync(join(R, 'src/assets/fonts/gowun-dodum-latin-400.woff2')).toString('base64')

// 📏 폰 화면 비율 — 카톡 배경은 «전체화면»이라 폰이 길면 위아래가 잘린다.
//   ⭐ 갤럭시·아이폰 요즘 기기 = 대략 1080×2340(19.5:9). 9:16(1920)만 뽑으면 늘어나며 잘린다.
//   👉 HEIGHT 로 두 판을 다 뽑아 창업자가 폰에서 고른다.
const 높이 = Number(process.env.HEIGHT || 1920)
const 바탕 = '#FFFDF7'
const 진 = '#5d3410'
const 머리 = `<style>
  @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트}) format('woff2');unicode-range:U+AC00-D7A3,U+1100-11FF,U+3130-318F}
  @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트L}) format('woff2')}
  *{margin:0;padding:0;box-sizing:border-box;font-family:GD,sans-serif;-webkit-font-smoothing:antialiased}
  body{width:1080px;height:${높이}px;background:${바탕};color:${진};overflow:hidden;position:relative}
  .알약{display:inline-flex;align-items:center;background:#fff;border:2px solid #efe2cf;border-radius:999px;
    padding:18px 36px;font-size:38px;color:#7a5a3a}
</style>`
// 📐 자리를 «높이 비율»로 — 폰이 길든 짧든 같은 꼴로 앉게 한다
const 비 = (r) => Math.round(높이 * r)
const 컷 = (n, 높이, 자리) => `<img src="${축하(n)}" style="position:absolute;${자리};height:${높이}px;object-fit:contain">`

const 장 = []

// ① 글자만 — 제일 심플. 아래는 통째로 비워 프로필 사진 자리를 준다.
장.push({ 이름: 'A-글자만', html: `
  <div style="position:absolute;left:0;right:0;top:250px;text-align:center;font-size:104px;font-weight:700;letter-spacing:-2px">한끼 레시피북</div>
  <div style="position:absolute;left:0;right:0;top:400px;text-align:center;font-size:44px;color:#a98a6b">흩어진 레시피를, 한곳에</div>
  <div style="position:absolute;left:0;right:0;top:560px;text-align:center"><span class="알약">앱스토어 · 구글 플레이</span></div>` })

// ② 캐릭터 얹음 — 글자 아래에 건배 컷(03). ⭐컷은 «높이»로 맞춘다(비율이 제각각).
// ⛔⛔ [창업자 2026-09-16] "너무 위에 올라가있어" — px 로 박아서 «긴 폰»에서 위로 쏠렸다.
//    ⭐ 그래서 자리를 «높이 비율»로 준다 — 1920 이든 2340 이든 같은 꼴로 앉는다.
//    📌 48% 아래로는 안 내린다 — 거기부터 카톡이 프로필 사진·이름으로 덮는다.
장.push({ 이름: 'B-곰펭', html: `
  <div style="position:absolute;left:0;right:0;top:${비(0.17)}px;text-align:center;font-size:96px;font-weight:700;letter-spacing:-2px">한끼 레시피북</div>
  <div style="position:absolute;left:0;right:0;top:${비(0.235)}px;text-align:center;font-size:42px;color:#a98a6b">흩어진 레시피를, 한곳에</div>
  ${컷('03', 비(0.18), `left:290px;top:${비(0.285)}px`)}
  <div style="position:absolute;left:0;right:0;top:${비(0.48)}px;text-align:center"><span class="알약">앱스토어 · 구글 플레이에서 검색</span></div>` })

// ③ 아주 심플 — 이름 한 줄과 스토어 한 줄뿐. 글씨가 제일 크다.
장.push({ 이름: 'C-한줄', html: `
  <div style="position:absolute;left:0;right:0;top:300px;text-align:center;font-size:120px;font-weight:700;letter-spacing:-3px">한끼<br><span style="font-size:76px">레시피북</span></div>
  <div style="position:absolute;left:0;right:0;top:700px;text-align:center;font-size:40px;line-height:1.7;color:#a98a6b">아이폰 · 안드로이드<br>둘 다 있어요</div>` })

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await (await b.newContext({ viewport: { width: 1080, height: 높이 }, deviceScaleFactor: 1 })).newPage()
for (const s of 장) {
  await p.setContent(`<!doctype html><html><head>${머리}</head><body>${s.html}</body></html>`)
  await p.waitForTimeout(250)
  await p.screenshot({ path: `${낼곳}/${s.이름}.png` })
}
await b.close()
console.log(`📸 ${장.length}장 → ${낼곳}`)
