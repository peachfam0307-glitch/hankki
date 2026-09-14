// 🎨 소소 기능 캐러셀 — «짜임» 시안 셋 (2026-09-06 22:1x)
//
// 📮 창업자 = *"이것두 우리 계속 한거랑 너무 디자인이랑 글씨 배치, 비슷한데... 좀 더 다른 레이아웃 없을꺼"*
//    ⛔ 첫 판(냉장고 문·자석)은 «색»만 바꿨지 «짜임»(제목 위-왼쪽 · 폰 오른쪽 · 설명 왼쪽 아래 · 스티커)은
//       스토어 v8 D · 캡처법 C · 속지 캐러셀과 같았다. 이번엔 짜임 자체를 셋으로 가른다.
// 같은 장(유통기한 D-day)을 세 짜임으로:
//   A 풀블리드 — 앱 화면이 위를 «꽉» 채우고 아래 흰 카드에 제목 «가운데»
//   B 조각 콜라주 — 폰 틀 없음 · 앱 «줄»을 종이 조각처럼 흩뿌리고 제목은 한가운데 크게
//   C 대화 — 펭펭이 묻고(말풍선) 앱 조각이 답한다(채팅 짜임)
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/_판-소소캐러셀-짜임시안-0906.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = new URL('..', import.meta.url).pathname
const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad/소소1/짜임시안'
mkdirSync(OUT, { recursive: true })
const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`
const 폰트 = readFileSync(join(ROOT, 'design/promo/fonts-embed.css'), 'utf8')
const 앱 = (f) => b64(join(ROOT, `design/promo/소소기능-앱화면-2509/${f}.png`))
const 스 = (k) => b64(join(ROOT, /^(pjs|duos)_/.test(k) ? `src/assets/sharepool/${k}.png` : `src/assets/stickers/photo/${k}.png`))
const 갈색 = '#5d3410', 파랑 = '#5b7ea8', 크림 = '#fbf7ef'
const 기본 = `${폰트}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;position:relative;font-family:'Jua','Gowun Dodum',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.sp{position:absolute;filter:drop-shadow(0 12px 18px rgba(40,50,60,.22))}
.hh{font-family:'Jua';color:${갈색};letter-spacing:-0.02em}
.ss{font-family:'Gowun Dodum';line-height:1.5}
`
// 02-냉장고Dday.png = 1170×2532 (390×844 ×3). 줄 자리(실측 · 3배 px): 우유 724~914 · 돼지고기 933~1143 · 두부 1156~1372 · 대파 1385~1600
const 줄 = (y, h, w = 1070, x = 50, 배율 = 0.6, 회전 = 0, left = 0, top = 0, z = 5) => `<div style="position:absolute;z-index:${z};left:${left}px;top:${top}px;width:${Math.round(w * 배율)}px;height:${Math.round(h * 배율)}px;overflow:hidden;border-radius:18px;background:#f4efe6;box-shadow:0 16px 34px rgba(40,50,60,.18);transform:rotate(${회전}deg)">
  <img src="${앱('02-냉장고Dday')}" style="position:absolute;left:${-x * 배율}px;top:${-y * 배율}px;width:${1170 * 배율}px"></div>`

const 시안 = {
  'A-풀블리드': () => `<style>${기본}
body{background:${크림}}
.shot{position:absolute;left:0;top:0;width:1080px;height:820px;overflow:hidden}
.shot img{width:1080px;display:block;margin-top:-540px}
.shot::after{content:'';position:absolute;left:0;right:0;bottom:0;height:260px;background:linear-gradient(180deg,rgba(251,247,239,0),${크림} 85%)}
.card{position:absolute;left:60px;right:60px;top:700px;bottom:60px;background:#fff;border-radius:48px;box-shadow:0 30px 70px rgba(60,50,40,.14);text-align:center;padding:70px 60px 0}
.no{display:inline-block;background:${파랑};color:#fff;font-family:'Jua';font-size:30px;border-radius:999px;padding:8px 26px;margin-bottom:24px}
.hh{font-size:92px;line-height:1.18}
.ss{font-size:34px;color:rgba(58,63,70,.7);margin-top:26px}
.line{width:120px;height:6px;background:${파랑};border-radius:3px;margin:36px auto 0}
.foot{position:absolute;left:0;right:0;bottom:36px;text-align:center;font-family:'Gowun Dodum';font-size:24px;color:rgba(58,63,70,.45)}</style>
<div class="shot"><img src="${앱('02-냉장고Dday')}"></div>
<div class="card"><div class="no">소소한 기능 ① · 2</div><div class="hh">유통기한은<br>앱이 세요</div><div class="ss">가까운 것부터 D-1 · D-2 · 색으로 알려줘요<br>재료를 누르면 날짜를 고칠 수 있어요</div><div class="foot">한끼 · 장보기 탭 → 냉장고</div></div>
<img class="sp" src="${스('pjs_08')}" style="right:40px;top:560px;width:330px;transform:rotate(6deg);z-index:9">`,

  'B-조각콜라주': () => `<style>${기본}
body{background:#eef1ea;background-image:radial-gradient(rgba(93,52,16,.07) 1.6px,transparent 1.9px);background-size:28px 28px}
.mid{position:absolute;left:0;right:0;top:470px;z-index:8;text-align:center}
.hh{font-size:112px;line-height:1.12;text-shadow:0 0 24px #eef1ea,0 0 24px #eef1ea}
.ss{font-size:34px;color:rgba(58,63,70,.7);margin-top:24px;text-shadow:0 0 16px #eef1ea}
.tape{position:absolute;z-index:7;width:150px;height:44px;background:rgba(232,196,120,.75);transform:rotate(-5deg)}
.tag{position:absolute;left:64px;top:64px;z-index:9;font-family:'Jua';font-size:30px;color:#fff;background:${파랑};border-radius:999px;padding:8px 26px}
.big{position:absolute;right:60px;top:56px;z-index:9;font-family:'Jua';font-size:150px;color:${파랑};opacity:.18;line-height:1}
.foot{position:absolute;left:0;right:0;bottom:36px;text-align:center;font-family:'Gowun Dodum';font-size:24px;color:rgba(58,63,70,.45)}</style>
<div class="tag">소소한 기능 ①</div><div class="big">02</div>
${줄(724, 190, 1070, 50, 0.62, -6, 40, 190)}<div class="tape" style="left:110px;top:170px"></div>
${줄(933, 210, 1070, 50, 0.62, 4, 380, 300)}<div class="tape" style="left:900px;top:290px;transform:rotate(8deg)"></div>
${줄(1156, 216, 1070, 50, 0.62, -3, 120, 820)}<div class="tape" style="left:160px;top:805px"></div>
${줄(1385, 215, 1070, 50, 0.62, 5, 430, 960)}<div class="tape" style="left:960px;top:950px;transform:rotate(6deg)"></div>
<div class="mid"><div class="hh">유통기한은<br>앱이 세요</div><div class="ss">가까운 것부터 D-1 · D-2 · 색으로</div></div>
<img class="sp" src="${스('pjs_08')}" style="left:30px;top:1030px;width:280px;transform:rotate(-5deg);z-index:9">
<div class="foot">한끼 · 장보기 탭 → 냉장고</div>`,

  'C-대화': () => `<style>${기본}
body{background:#f6f1e8}
.head{position:absolute;left:0;right:0;top:0;height:150px;background:#fff;border-bottom:2px solid rgba(93,52,16,.1);display:flex;align-items:center;justify-content:center;gap:16px;font-family:'Jua';font-size:34px;color:${갈색}}
.head small{font-family:'Gowun Dodum';font-size:24px;color:rgba(58,63,70,.5)}
.row{position:absolute;left:0;right:0;display:flex;align-items:flex-end;gap:20px;padding:0 50px}
.row.me{justify-content:flex-end}
.bub{max-width:640px;background:#fff;border-radius:34px;padding:28px 36px;font-family:'Jua';font-size:40px;line-height:1.35;color:${갈색};box-shadow:0 10px 26px rgba(60,50,40,.1)}
.me .bub{background:${파랑};color:#fff;border-bottom-right-radius:8px}
.you .bub{border-bottom-left-radius:8px}
.app{border-radius:26px;overflow:hidden;box-shadow:0 14px 30px rgba(40,50,60,.16);background:#f4efe6}
.time{font-family:'Gowun Dodum';font-size:22px;color:rgba(58,63,70,.45);margin:0 8px 6px}
.hh{position:absolute;left:0;right:0;bottom:80px;text-align:center;font-size:72px;line-height:1.2}
.foot{position:absolute;left:0;right:0;bottom:30px;text-align:center;font-family:'Gowun Dodum';font-size:24px;color:rgba(58,63,70,.45)}</style>
<div class="head">냉장고 <small>소소한 기능 ① · 2</small></div>
<div class="row me" style="top:200px"><div class="time">오후 6:12</div><div class="bub">우유 언제까지였지…?</div></div>
<div class="row you" style="top:340px"><img class="sp" src="${스('pjs_05')}" style="position:static;width:150px;filter:none">
  <div style="display:flex;flex-direction:column;gap:14px"><div class="bub">내가 세고 있었어</div>
  ${줄(724, 190, 1070, 50, 0.6).replace('position:absolute;z-index:5;left:0px;top:0px;', 'position:relative;').replace('transform:rotate(0deg)', '')}</div></div>
<div class="row me" style="top:720px"><div class="time">오후 6:12</div><div class="bub">돼지고기랑 두부는?</div></div>
<div class="row you" style="top:860px"><img class="sp" src="${스('pjs_05')}" style="position:static;width:150px;filter:none;visibility:hidden">
  <div style="display:flex;flex-direction:column;gap:12px">
  ${줄(933, 210, 1070, 50, 0.6).replace('position:absolute;z-index:5;left:0px;top:0px;', 'position:relative;').replace('transform:rotate(0deg)', '')}
  ${줄(1156, 216, 1070, 50, 0.6).replace('position:absolute;z-index:5;left:0px;top:0px;', 'position:relative;').replace('transform:rotate(0deg)', '')}</div></div>
<div class="hh">유통기한은 앱이 세요</div>
<div class="foot">한끼 · 장보기 탭 → 냉장고</div>`,
}

const br = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const p = await br.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 })
const names = []
for (const [n, f] of Object.entries(시안)) {
  await p.setContent(`<!doctype html><meta charset="utf-8">${f()}`)
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300)
  await p.screenshot({ path: `${OUT}/${n}.png` }); names.push(n); console.log('  ✅', n)
}
await br.close()
execFileSync('python3', ['-c', `from PIL import Image
names=${JSON.stringify(names)}
w=640; h=800
sh=Image.new('RGB',(w*3+40,h+20),'white')
for i,n in enumerate(names):
  sh.paste(Image.open('${OUT}/'+n+'.png').resize((w,h)),(10+i*(w+10),10))
sh.save('${OUT}/짜임시안-셋.png')`])
console.log(`\n📸 → ${OUT}`)
