// 🏪 스토어 스샷 v8 — 01장 «뼈대» 시안 3갈래 (2026-09-05)
//
// 📮 창업자 = *"스토어 스샷은 8장을 새 디자인으로"* · *"비슷한데 다른 느낌으로 글씨체는 주아로 가고 배경(뼈대)를 바꿔"*
//    · *"너무 진하지 않게 우리 인스타에 올린 것과 색감 너무 겹치지 않게 부탁해 좀 은은하게 (배경)"*
//    · 23:51 *"저거 캡쳐하는 법 공유 그거 올려줘야지."* → ⛔첫 판은 한끼 화면만 놓았다. 01장의 «본체»는
//      「인스타 캡처 › 한끼 화면 ＋ 공유›더보기›한끼 알약」(2026-08-28 창업자 확정 ㉢)이다 → 그 장면을 그대로 살리고 뼈대만 바꾼다.
// ⭐ 인스타(릴스·스샷릴스)는 **크림 #fbf5e8 ＋ 진한웜 #5d3410 ＋ 도트** 가 결이다 → 여기선 도트를 빼고
//    바탕을 «린넨·회연두·회베이지» 쪽으로 옮긴다. 글자색만 앱 토큰(#5d3410)을 지킨다.
// 🖼 재료 = 인스타 캡처·아이콘 3개는 저장소 원본(`design/promo/가져오기안내-원본캡처-2508`) ·
//    한끼 화면은 v7-01(hold/스토어스샷-0902)에서 «오른쪽 폰»만 잘라 쓴다 — 원본 앱 캡처는 옛 scratchpad 에 있어 사라졌다.
//    (뼈대를 고르는 시안이라 화면 내용은 v7 그대로여도 된다 · 8장 본생산은 새로 찍는다)
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_판-스토어v8시안-0905.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
const py = (code) => execFileSync('python3', ['-c', code]) // sharp 가 없다 → Pillow

const S = '/tmp/claude-0/-home-user-hankki/0848ab85-00e3-56db-9a26-e87075950c12/scratchpad'
const OUT = `${S}/v8시안`; mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`
const 폰트 = readFileSync(join(ROOT, 'design/promo/fonts-embed.css'), 'utf8')
const 잎 = (n) => b64(join(ROOT, `src/assets/stickers/photo/au_g0${n}.png`))
const 곰펭 = b64(join(ROOT, 'src/assets/stickers/photo/gp_duohi.png'))
const 원본 = join(ROOT, 'design/promo/가져오기안내-원본캡처-2508')
const IMG = { 인스타: b64(`${원본}/인스타-공유동그라미.png`), i공유: b64(`${원본}/i-공유.png`), i더보기: b64(`${원본}/i-더보기.png`), i한끼: b64(`${원본}/i-한끼.png`) }

// v7-01 오른쪽 폰(흰 테 포함) 실측 @2x: x 975~2060 · y 880~3245 (왼쪽 35px 는 옛 화살표가 걸려 잘라냈다)
const 폰 = `${OUT}/폰.png`
py(`from PIL import Image\nImage.open('${S}/v7/v7-01-캡처하는법.png').crop((975,880,2060,3245)).save('${폰}')`)
IMG.한끼 = b64(폰)

const 공통 = `${폰트}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;position:relative;font-family:'Jua','Gowun Dodum',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.hh{font-family:'Jua';color:#5d3410;letter-spacing:-0.02em;font-size:92px;line-height:1.28}
.ss{font-family:'Gowun Dodum';color:rgba(93,52,16,.66);font-size:38px;line-height:1.5;margin-top:20px}
.wrap{position:relative;z-index:3;text-align:center;padding:100px 70px 0}
.leaf{position:absolute;z-index:2;opacity:.55}
/* 🏷 장면(㉢) — 인스타는 작게 뒤, 한끼가 주인공 앞, 사이 화살표, 아래 흐름 알약 */
.back{position:absolute;left:44px;top:520px;width:430px;height:892px;z-index:3}
.back img{width:100%;height:100%;object-fit:cover;object-position:top;border-radius:34px;border:9px solid #fffdf8;
  box-shadow:0 30px 62px rgba(93,52,16,.20)}
.front{position:absolute;right:48px;top:434px;width:566px;height:1180px;z-index:4;border-radius:40px;overflow:hidden;
  box-shadow:0 30px 62px rgba(93,52,16,.22)}
.front img{width:100%;display:block}
.arrow{position:absolute;z-index:5;left:452px;top:958px;color:#c2703a;font-family:'Jua';font-size:104px;line-height:1}
.flow{position:absolute;left:50%;transform:translateX(-50%);bottom:56px;z-index:6;display:flex;align-items:center;gap:14px;
  background:#fffdf8;border-radius:999px;padding:18px 34px;box-shadow:0 16px 34px rgba(93,52,16,.18);border:3px solid rgba(93,52,16,.10)}
.chip{display:flex;flex-direction:column;align-items:center;gap:6px;width:118px}
.chip img{width:86px;height:86px;border-radius:50%;display:block;box-shadow:0 3px 9px rgba(93,52,16,.18)}
.chip b{font-family:'Jua';font-weight:400;color:#5d3410;font-size:30px;letter-spacing:-0.02em}
.sep{font-family:'Jua';color:#c2703a;font-size:56px;line-height:1;margin-top:-26px}
.end{font-family:'Jua';color:#5d3410;font-size:36px;letter-spacing:-0.02em;margin-left:10px;margin-top:-26px;white-space:nowrap}
`
const 장면 = `<div class="back"><img src="${IMG.인스타}"></div><div class="arrow">›</div>
<div class="front"><img src="${IMG.한끼}"></div>
<div class="flow"><div class="chip"><img src="${IMG.i공유}"><b>공유</b></div><div class="sep">›</div>
<div class="chip"><img src="${IMG.i더보기}"><b>더보기</b></div><div class="sep">›</div>
<div class="chip"><img src="${IMG.i한끼}"><b>한끼</b></div><div class="end">누르면 끝</div></div>`
const 머리 = `<div class="wrap"><div class="hh">캡처 한 장이면<br>레시피가 정리돼요</div><div class="ss">보다가 캡처 · 재료도 순서도 알아서</div></div>`

// ⓐ 린넨 — 종이결 바탕 ＋ 가느다란 갈색 «액자 선» ＋ 은행잎 한둘
const A = `<style>${공통}
body{background:#f3efe7}
body::before{content:'';position:absolute;inset:0;z-index:1;opacity:.35;
  background-image:repeating-linear-gradient(0deg,rgba(93,52,16,.05) 0 1px,transparent 1px 7px),repeating-linear-gradient(90deg,rgba(93,52,16,.04) 0 1px,transparent 1px 9px)}
.frame{position:absolute;inset:40px;border:3px solid rgba(93,52,16,.28);border-radius:56px;z-index:2}
.frame::after{content:'';position:absolute;inset:14px;border:1.5px solid rgba(93,52,16,.16);border-radius:44px}
</style><div class="frame"></div>
<img class="leaf" src="${잎(3)}" style="width:150px;right:60px;top:380px;transform:rotate(22deg)">
<img class="leaf" src="${잎(1)}" style="width:170px;left:70px;top:1440px;transform:rotate(-18deg)">
${머리}${장면}`

// ⓑ 회연두 — 폰 뒤에 «둥근 연한 판» 하나 (아래로 잘려 나가는 반원) ＋ 곰펭이 위 모서리
const B = `<style>${공통}
body{background:#eef0e8}
.blob{position:absolute;z-index:2;left:-140px;right:-140px;top:600px;height:1600px;border-radius:50% 50% 0 0 / 40% 40% 0 0;background:#e1e6d6}
.duo{position:absolute;z-index:5;left:36px;top:330px;width:170px;filter:drop-shadow(0 8px 16px rgba(60,70,40,.18))}
.hh{color:#4e4a2f}.ss{color:rgba(78,74,47,.66)}
.back img,.front{box-shadow:0 30px 62px rgba(60,70,40,.18)}
</style><div class="blob"></div><img class="duo" src="${곰펭}">
${머리}${장면}`

// ⓒ 회베이지 두톤 — 위는 밝고 아래 1/3은 한 톤 어두운 «띠» · 한끼 폰 위에 마스킹테이프 한 장
const C = `<style>${공통}
body{background:linear-gradient(180deg,#f2eee8 0 60%,#e6dfd4 60% 100%)}
.tape{position:absolute;z-index:6;right:190px;top:408px;width:220px;height:54px;background:rgba(214,195,160,.78);transform:rotate(-7deg)}
.front{transform:rotate(-1.6deg)}
.leaf{opacity:.5}
</style>
<img class="leaf" src="${잎(5)}" style="width:170px;left:40px;top:1500px;transform:rotate(14deg)">
${머리}${장면}<div class="tape"></div>`

const CHROMIUM = process.env.SMOKE_CHROMIUM
const br = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const p = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 })
for (const [n, h] of Object.entries({ 'v8-시안A-린넨': A, 'v8-시안B-회연두': B, 'v8-시안C-두톤테이프': C })) {
  await p.setContent(`<!doctype html><meta charset="utf-8">${h}`)
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300)
  await p.screenshot({ path: `${OUT}/${n}.png` }); console.log('  ✅', n)
}
await br.close()
// 나란히 한 장
py(`from PIL import Image
sh=Image.new('RGB',(720*3+80,1320),'white')
for i,k in enumerate(['A-린넨','B-회연두','C-두톤테이프']):
  sh.paste(Image.open('${OUT}/v8-시안'+k+'.png').resize((720,1280)),(20+i*740,20))
sh.save('${OUT}/v8-시안-나란히.png')`)
console.log('📸', OUT)
