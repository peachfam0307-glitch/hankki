// 📸📸 인스타 — 「9월에 주는 선물」 (창업자 2026-08-31 *"인스타에 그거 올리고싶어. 우리9월에 주는 선물들"*)
//   📮 *"그 안내판 말고, **이미지가 다 보이는 안내판**을 만들면 좋을 것 같아"*
//   📮 → 첫 판을 보고 *"**안내판은 시선이 확 끌리게 만들어줘. 지금껀 좀 촌스러으니까**"*
//
// ⛔⛔ **첫 판이 왜 촌스러웠나 — 내가 실물을 열어 보고 찾은 것 다섯**
//   ⑴ 배경이 «민무늬 단색»이라 표정이 0
//   ⑵ 컷을 그냥 나열해서 **목록처럼** 읽힌다 (리듬이 없다)
//   ⑶ **가을인데 가을색이 없다** — 크림·갈색뿐
//   ⑷ ⛔ **유니코드 이모지(🐻🐧)를 썼다** — 우리 규칙 위반. 곰펭은 «우리 스티커»다
//   ⑸ 주인공이어야 할 **숫자 51 이 제목에 묻혔다**
//
// ✅ 그래서 바꾼 것
//   · 배경 = 가을 그라데이션 ＋ 흩뿌린 낙엽(우리 컷) — 종이에 «표정»을 준다
//   · **숫자를 주인공으로** — 51 을 화면에서 제일 크게
//   · 컷을 **흰 카드에 담아** 묶음이 눈에 잡히게(나열 → 덩어리)
//   · 캐릭터를 **크게 한 마리** 세워 시선을 잡는다
//
// ⭐ 숫자는 **앱 팝업과 같게** 쓴다 — 창업자 원칙(*"컷수 부풀리면 10월부터는 무료갯수가 확 주는 느낌"*)
// ⛔ 유료팩 컷은 한 장도 안 넣는다 — 9/1 열리는 것은 전부 무료다(확인함)
// 🔤 폰트는 앱과 «같은» 로컬 woff2 를 심는다(바깥 CDN 은 이 환경에서 안 열린다)
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
const R = '/home/user/hankki/hankki'
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/인스타9월'
mkdirSync(OUT, { recursive: true })
const 그룹 = JSON.parse(readFileSync('/tmp/g901.json', 'utf8'))
const 카드 = {
  가을: ['au_b02', 'au_b03', 'au_b09', 'au_b10', 'au_b11', 'au_b12', 'au_b17', 'au_b07', 'au_b08', 'au_b15', 'au_b16'],
  추석: ['hb09', 'hb12', 'cs_b27', 'cs_b02'],
}
const b64 = (k) => { try { return 'data:image/png;base64,' + readFileSync(`${R}/src/assets/stickers/photo/${k}.png`).toString('base64') } catch { return null } }
const 폰트 = (파일, 이름) => `@font-face{font-family:'${이름}';src:url(data:font/woff2;base64,${readFileSync(`${R}/src/assets/fonts/${파일}`).toString('base64')}) format('woff2');font-display:block}`
const faces = 폰트('gaegu-korean-400.woff2', 'G') + 폰트('gowun-dodum-korean-400.woff2', 'D')
  + 폰트('gaegu-latin-400.woff2', 'G') + 폰트('gowun-dodum-latin-400.woff2', 'D')

const 컷 = (k, sz) => { const d = b64(k); return d ? `<img src="${d}" style="width:${sz}px;height:${sz}px;object-fit:contain">` : '' }
const 묶음 = (라벨, 컷들, sz) => `<div class="card">
  <div class="lab">${라벨}<b>${컷들.length}</b></div>
  <div class="row">${컷들.map((k) => 컷(k, sz)).join('')}</div></div>`
// 🍂 배경에 흩뿌리는 낙엽 — 우리 가을 컷을 옅게
const 흩뿌림 = (자리) => 자리.map(([k, x, y, s, r, o]) => {
  const d = b64(k); if (!d) return ''
  return `<img src="${d}" style="position:absolute;left:${x}%;top:${y}%;width:${s}px;transform:rotate(${r}deg);opacity:${o};pointer-events:none">`
}).join('')

const css = `${faces}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;font-family:'D',sans-serif}
.page{width:1080px;height:1350px;position:relative;overflow:hidden;
  background:linear-gradient(158deg,#fff6e6 0%,#fdead0 34%,#f7d9b6 68%,#f0c79c 100%)}
.inner{position:relative;z-index:2;height:100%;padding:44px 46px 38px;display:flex;flex-direction:column}
.eyebrow{font-family:'G';font-size:36px;color:#b4652c;letter-spacing:.05em}
.tit{display:flex;align-items:flex-end;gap:22px;margin:2px 0 6px}
.tit h1{font-family:'G';font-size:86px;color:#4a3a2a;line-height:.98;letter-spacing:-.01em}
.num{font-family:'G';font-size:172px;line-height:.78;color:#c2410c;
  text-shadow:0 5px 0 #fff,0 10px 22px rgba(150,80,20,.24)}
.num small{font-size:64px;margin-left:4px}
.sub{font-size:29px;color:#7a5c3f;display:flex;align-items:center;gap:12px;margin-bottom:14px}
.pill{background:#c2410c;color:#fff;font-family:'G';font-size:33px;padding:5px 24px;border-radius:999px;
  box-shadow:0 4px 12px rgba(194,65,12,.32)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:13px;align-items:stretch}
.card .row{min-height:96px}
.card{background:rgba(255,253,248,.93);border-radius:22px;padding:13px 15px 15px;
  box-shadow:0 3px 14px rgba(140,90,40,.13)}
.lab{font-size:22px;color:#6b563f;margin-bottom:7px;display:flex;align-items:center;gap:8px;font-weight:700}
.lab b{font-family:'G';color:#c2410c;font-size:27px}
.row{display:flex;flex-wrap:wrap;gap:7px;align-items:center;justify-content:center}
.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;padding-top:12px}
.who{display:flex;align-items:center;gap:12px}
.who img{width:76px;height:76px;object-fit:contain}
.who .t{font-family:'G';font-size:42px;color:#4a3a2a;line-height:1.1}
.link{font-size:27px;color:#8a6b4c;text-align:right;line-height:1.45;font-weight:700}
.hero{position:absolute;right:34px;top:104px;width:216px;z-index:3;
  filter:drop-shadow(0 10px 22px rgba(120,70,25,.28))}
`

// ── 1장 = 꾸미기 51종 ─────────────────────────────
const p1 = `<div class="page">
  ${흩뿌림([['au_i24', -6, 66, 210, -18, 0.13], ['au_i38', 84, 90, 180, -12, 0.12], ['au_i29', -4, 40, 150, 14, 0.10]])}
  <img class="hero" src="${b64('au_b26')}">
  <div class="inner">
    <div class="eyebrow">9월 1일 · 한끼</div>
    <div class="tit"><h1>가을 선물이<br>왔어요</h1><div class="num">51<small>종</small></div></div>
    <div class="sub">꾸미기 서랍에 저절로 들어와요<span class="pill">전부 무료</span></div>
    <div class="grid2">${그룹.map((g) => 묶음(g.라벨, g.컷, g.컷.length > 6 ? 70 : 82)).join('')}</div>
    <div class="foot">
      <div class="who"><img src="${b64('gp_gomhi')}"><img src="${b64('gp_penghi')}">
        <div class="t">꼬르곰·펭펭과<br>레꾸해요</div></div>
      <div class="link">프로필 링크에서<br>무료로 받기</div></div>
  </div></div>`

// ── 2장 = 레꾸자랑 카드 15종 ──────────────────────
const p2 = `<div class="page">
  ${흩뿌림([['au_i39', -4, 70, 200, 16, 0.16], ['au_i42', 86, 18, 170, -20, 0.15],
            ['au_i43', 80, 82, 150, 10, 0.15]])}
  <div class="inner">
    <div class="eyebrow">9월 1일 · 한끼</div>
    <div class="tit"><h1>레꾸자랑<br>카드도</h1><div class="num">15<small>종</small></div></div>
    <div class="sub">레시피를 카드로 뽑을 때 나와요<span class="pill">전부 무료</span></div>
    <div class="grid2" style="grid-template-columns:1fr">
      ${묶음('가을', 카드.가을, 178)}${묶음('추석', 카드.추석, 178)}</div>
    <div class="foot">
      <div class="who"><img src="${b64('gp_gomhi')}"><img src="${b64('gp_penghi')}">
        <div class="t">꼬르곰·펭펭과<br>레꾸해요</div></div>
      <div class="link">프로필 링크에서<br>무료로 받기</div></div>
  </div></div>`

writeFileSync('/tmp/insta.html', `<!doctype html><meta charset="utf-8"><style>${css}</style><body>${p1}${p2}</body>`)
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const pg = await (await b.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })).newPage()
await pg.goto('file:///tmp/insta.html'); await pg.waitForTimeout(2400)
const pages = await pg.locator('.page').all()
for (let i = 0; i < pages.length; i++) await pages[i].screenshot({ path: `${OUT}/${i + 1}.png` })
// ⛔ 넘치면 «잘린다» — 0 이라야 한다
const 넘침 = await pg.evaluate('[...document.querySelectorAll(".inner")].map(p=>p.scrollHeight-p.clientHeight)')
const 빈컷 = await pg.evaluate('[...document.querySelectorAll("img")].filter(i=>!i.naturalWidth).length')
console.log('넘친 높이(0이라야):', 넘침.join(' '), '· 안 뜬 그림:', 빈컷)
console.log('📁', OUT)
await b.close()
