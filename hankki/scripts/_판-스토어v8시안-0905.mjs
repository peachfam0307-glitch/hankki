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

// ─────────────────────────────────────────────────────────────
// 📮 23:56 창업자 = *"저번거랑 너무 비슷한 것 같아..."* → A·B·C 는 «색만» 바꾼 셈이었다(가운데 헤드라인 + 두 폰 + 아래 알약 = v7 짜임).
//    ⭐ 짜임을 바꾼다 — 헤드라인 자리·폰 놓임·흐름 표시 방식이 셋 다 다르게.
const 단계CSS = `
.steps{position:absolute;z-index:6;display:flex;flex-direction:column;gap:26px}
.step{display:flex;align-items:center;gap:18px}
.step img{width:96px;height:96px;border-radius:50%;display:block;box-shadow:0 4px 12px rgba(93,52,16,.16);border:4px solid #fffdf8}
.step b{font-family:'Jua';font-weight:400;color:#5d3410;font-size:34px;letter-spacing:-0.02em}
.step small{display:block;font-family:'Gowun Dodum';color:rgba(93,52,16,.6);font-size:26px}
`
const 단계 = `<div class="steps">
<div class="step"><img src="${IMG.i공유}"><div><b>① 공유</b><small>캡처한 글에서</small></div></div>
<div class="step"><img src="${IMG.i더보기}"><div><b>② 더보기</b></div></div>
<div class="step"><img src="${IMG.i한끼}"><div><b>③ 한끼</b><small>누르면 끝</small></div></div></div>`

// ⓓ 에디토리얼 — 헤드라인 «왼쪽 정렬» 위, 한끼 폰이 오른쪽 아래로 «화면 밖까지» 크게, 인스타는 왼쪽에 작게 기울여, 단계는 왼쪽 세로
const D = `<style>${공통}${단계CSS}
body{background:#f1ede6;
  background-image:linear-gradient(rgba(74,79,54,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(74,79,54,.09) 1px,transparent 1px);background-size:54px 54px}
.hh,.step b{color:#4a4f36}.ss,.step small{color:rgba(74,79,54,.62)}.rule{background:rgba(74,79,54,.22)!important}
.wrap{text-align:left;padding:110px 64px 0}
.hh{font-size:96px}
.front{right:-90px;top:640px;width:720px;height:1400px;border-radius:52px;transform:rotate(-4deg);box-shadow:0 40px 80px rgba(93,52,16,.20)}
.back{left:52px;top:640px;width:330px;height:600px;transform:rotate(3deg)}
.back img{border-radius:28px}
.arrow{display:none}.flow{display:none}
.steps{left:64px;top:1300px}
.rule{position:absolute;z-index:2;left:64px;right:64px;top:432px;height:3px;background:rgba(93,52,16,.18)}
</style><div class="rule"></div>
${머리}${장면}${단계}`

// ⓔ 노트 — 헤드라인을 «흰 노트 카드»에 담아 위 왼쪽, 오른쪽 위 곰펭 · 폰은 정면 크게 아래로 흘러나감 · 흐름은 폰 «위»에 얹은 작은 알약 셋
const E = `<style>${공통}
body{background:#ece9e2;
  background-image:repeating-linear-gradient(135deg,rgba(90,52,70,.07) 0 6px,transparent 6px 26px)}
.hh{color:#5a3446}.ss{color:rgba(90,52,70,.62)}.chip b,.end{color:#5a3446}
.note{position:absolute;z-index:3;left:52px;top:96px;width:700px;background:#fffdf8;border-radius:34px;padding:52px 56px 46px;text-align:left;
  box-shadow:0 20px 44px rgba(93,52,16,.12);transform:rotate(-1.5deg)}
.note .hh{font-size:80px}.note .ss{font-size:32px;margin-top:14px}
.wrap{display:none}
.duo{position:absolute;z-index:4;right:42px;top:110px;width:260px;filter:drop-shadow(0 10px 20px rgba(93,52,16,.16))}
.front{left:50%;right:auto;transform:translateX(-50%);top:560px;width:760px;height:1500px;border-radius:56px}
.back{display:none}.arrow{display:none}
.flow{bottom:44px;padding:14px 26px;gap:10px}
.chip{width:100px}.chip img{width:70px;height:70px}.chip b{font-size:26px}.sep{font-size:44px}.end{font-size:30px}
</style>
<div class="note"><div class="hh">캡처 한 장이면<br>레시피가 정리돼요</div><div class="ss">인스타 · 갤러리 · 어디서든 공유 한 번</div></div>
<img class="duo" src="${곰펭}">${장면}`

// ⓕ 두 폰 «나란히 기울임» — 위에 작은 라벨 알약, 헤드라인 가운데, 두 폰이 살짝 안쪽으로 기울어 마주 봄, 아래는 한 줄 문장(알약 없음)
const F = `<style>${공통}
body{background:#eeeae3;
  background-image:radial-gradient(rgba(47,79,79,.11) 2.2px,transparent 2.6px),radial-gradient(rgba(47,79,79,.11) 2.2px,transparent 2.6px);background-size:44px 44px;background-position:0 0,22px 22px}
.hh,.line{color:#2f4f4f}.ss{color:rgba(47,79,79,.62)}.label{background:#2f4f4f!important}
body::after{content:'';position:absolute;z-index:1;left:0;right:0;top:980px;bottom:0;background:#e2ddd3;clip-path:polygon(0 12%,100% 0,100% 100%,0 100%)}
.label{position:absolute;z-index:3;left:50%;transform:translateX(-50%);top:80px;background:#5d3410;color:#fff8ec;border-radius:999px;padding:12px 34px;font-family:'Jua';font-size:30px;letter-spacing:.04em}
.wrap{padding-top:160px}
.back{left:36px;top:560px;width:470px;height:960px;transform:rotate(-5deg)}
.front{right:36px;top:520px;width:560px;height:1100px;transform:rotate(4deg);border-radius:44px}
.arrow{display:none}
.flow{display:none}
.line{position:absolute;z-index:6;left:0;right:0;bottom:84px;text-align:center;font-family:'Jua';color:#5d3410;font-size:44px;letter-spacing:-0.02em}
.line span{color:#c2703a}
</style><div class="label">STEP 1 · 캡처</div>
${머리}${장면}<div class="line">공유 › 더보기 › <span>한끼</span> 누르면 끝</div>`

{
  const br = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
  const p = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 })
  for (const [n, h] of Object.entries({ 'v8-시안D-에디토리얼': D, 'v8-시안E-노트': E, 'v8-시안F-마주보기': F })) {
    await p.setContent(`<!doctype html><meta charset="utf-8">${h}`)
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300)
    await p.screenshot({ path: `${OUT}/${n}.png` }); console.log('  ✅', n)
  }
  await br.close()
  py(`from PIL import Image
sh=Image.new('RGB',(720*3+80,1320),'white')
for i,k in enumerate(['D-에디토리얼','E-노트','F-마주보기']):
  sh.paste(Image.open('${OUT}/v8-시안'+k+'.png').resize((720,1280)),(20+i*740,20))
sh.save('${OUT}/v8-시안-나란히2.png')`)
}
