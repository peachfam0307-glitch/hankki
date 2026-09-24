// 📸 「한끼연구소에 온 제안」 카드 4:5 (1080×1350) — 폴더·내 것 (2026-09-23)
//
// 📮 창업자 = *"인스타에 폴더 새로 올라온거 캐러셀 한장만 넣자. 아까 제안온거 넣어서"*
// ⭐ 제보 원문을 «그대로» 쓴다 — 맞춤법까지(익명이라 신원은 안 드러난다). 고치면 「진짜 온 제보」가 안 된다.
// ⛔ 번호(「제안 2」)를 안 붙인다 — 저장소에 1편 기록이 0건이다(decided.mjs). 없는 걸 있다고 하지 않는다.
// 🖼 앱 화면은 «실물»이다 — 오늘 아침 찍은 캡처를 그대로 넣는다(규칙 30).
// 📌 끝 알약 = App Store · Google Play 영어 표기 (절대원칙 2026-09-16 · check-두스토어 가 본다)
import { chromium } from 'playwright'
import { readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const R = dirname(dirname(fileURLToPath(import.meta.url)))
const 낼곳 = process.env.OUT || '/tmp/claude-0/연구소제안카드'
rmSync(낼곳, { recursive: true, force: true }); mkdirSync(낼곳, { recursive: true })
const b64 = (p) => existsSync(p) ? readFileSync(p).toString('base64') : ''
const png = (p) => { const s = b64(p); return s ? 'data:image/png;base64,' + s : '' }
const 폰트 = b64(join(R, 'src/assets/fonts/gowun-dodum-korean-400.woff2'))
const 폰트L = b64(join(R, 'src/assets/fonts/gowun-dodum-latin-400.woff2'))
const 앱아이콘 = png(join(R, 'public/icons/icon-512-v7.png'))
const 화면칩 = png('/tmp/claude-0/내것칩/내것칩-1-내것-누른뒤.png')
const 화면폴더 = png('/tmp/claude-0/폴더옮기기/폴더-2-어디로옮길까.png')
if (!화면칩 || !화면폴더) { console.error('⛔ 앱 화면 캡처가 없다 — _shot-내것칩-0923.mjs · _shot-폴더옮기기-0923.mjs 를 먼저 돌린다'); process.exit(1) }

const 바탕 = '#FFFDF7', 진 = '#5d3410', 흐림 = '#a98a6b'
const html = `<!doctype html><meta charset="utf-8"><style>
 @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트}) format('woff2');unicode-range:U+AC00-D7A3,U+1100-11FF,U+3130-318F}
 @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트L}) format('woff2')}
 *{margin:0;padding:0;box-sizing:border-box;font-family:GD,sans-serif;-webkit-font-smoothing:antialiased}
 body{width:1080px;height:1350px;background:${바탕};color:${진};overflow:hidden;position:relative;padding:64px 60px}
 .뱃지{display:inline-block;background:#fff;border:2px solid #efe2cf;border-radius:999px;padding:12px 28px;font-size:29px;color:#7a5a3a}
 .말풍선{position:relative;background:#fff;border:3px solid #efe2cf;border-radius:34px;padding:34px 38px;margin-top:22px}
 .말풍선:after{content:'';position:absolute;left:78px;bottom:-19px;width:32px;height:32px;background:#fff;
   border-right:3px solid #efe2cf;border-bottom:3px solid #efe2cf;transform:rotate(45deg)}
 .제보{font-size:40px;line-height:1.5;letter-spacing:-.5px}
 .누가{margin-top:14px;font-size:26px;color:${흐림}}
 .해냄{margin-top:44px;font-size:52px;font-weight:700;letter-spacing:-1px;line-height:1.3}
 .폰{position:absolute;border-radius:30px;border:3px solid #eadfcd;box-shadow:0 18px 44px rgba(90,60,20,.16);object-fit:cover}
 /* ⛔ 오른쪽은 «아래»를 보여준다 — 「2개를 어디로 옮길까요」 시트가 화면 아래쪽에 뜬다.
    top 으로 두면 정작 보여줄 것이 잘려서 카드가 뜻을 잃는다(2026-09-23 실물로 보고 고쳤다). */
 .위{object-position:top} .아래{object-position:bottom}
 .꼬리{position:absolute;left:0;right:0;bottom:52px;text-align:center}
 .알약{display:inline-flex;align-items:center;gap:14px;background:#fff;border:2px solid #efe2cf;border-radius:999px;padding:16px 30px;font-size:29px;color:#7a5a3a}
 .알약 img{width:46px;height:46px;border-radius:12px}
</style>
<div class="뱃지">한끼연구소에 온 제안</div>
<div class="말풍선"><div class="제보">“제가쓴 레시피는 따로 폴더나<br>그런것도 만들어주세요 헷갈려요”</div></div>
<div class="누가">— 한끼를 쓰는 분이 보내주셨어요</div>
<div class="해냄">그래서 만들었어요.<br><span style="color:#8a6a3a">내가 담은 것만 따로,<br>폴더도 목록에서 바로</span></div>
<img class="폰 위"   src="${화면칩}"   style="left:78px;  top:706px; width:392px; height:418px">
<img class="폰 아래" src="${화면폴더}" style="right:78px; top:736px; width:392px; height:418px">
<div class="꼬리"><span class="알약"><img src="${앱아이콘}">App Store · Google Play 에서 「한끼 레시피북」 검색</span></div>
`
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.waitForTimeout(400)
await p.screenshot({ path: join(낼곳, '연구소제안-폴더.png') })
await b.close()
console.log('저장 →', join(낼곳, '연구소제안-폴더.png'))
