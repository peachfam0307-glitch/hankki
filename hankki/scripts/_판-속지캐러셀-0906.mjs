// 📣📔 인스타 캐러셀 「가을 일기 속지 왔어요」 — 1080×1350 · 8장 (2026-09-06)
//
// 📮 창업자 = *"요거 가을일기 속지왔어요 캐러셀 만들어줄래"* (v12.66 속지 6장)
// 🎨 뼈대 = «책상 위 종이» — 앞 두 판(스토어 D=모눈·폰 오른쪽 / 캡처법 C=초록·폰 아래)과 겹치지 않게
//    · 배경 = 크라프트 종이(#e9dcc6)에 가는 리넨 결 · 글씨 = 단풍 갈색(#6b2f24) · 포인트 = 머스타드
//    · 폰 틀 없이 **속지 종이 그대로**를 살짝 기울여 마스킹테이프로 붙인다 · 잎 스티커(au_i) · 곰펭은 종이 모서리에서 «빼꼼»
// 🖼 재료 = scratchpad/속지6-홍보/0*.png (`PROMO=1 node scripts/_shot-속지6-0906.mjs` · 사진칸엔 곰펭 스티커) → 종이만 잘라 쓴다
// 실행: SCRATCH=<scratchpad> SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_판-속지캐러셀-0906.mjs   (REEL=1 → 1080×1920)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = new URL('..', import.meta.url).pathname
const S = process.env.SCRATCH || '/tmp/claude-0/-home-user-hankki/0848ab85-00e3-56db-9a26-e87075950c12/scratchpad'
const REEL = !!process.env.REEL
const OUT = process.env.OUT || join(S, REEL ? '속지캐러셀-릴스' : '속지캐러셀')
mkdirSync(OUT, { recursive: true })
const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`
const 폰트 = readFileSync(join(ROOT, 'design/promo/fonts-embed.css'), 'utf8')
const 스티커 = (k) => b64(join(ROOT, `src/assets/stickers/photo/${k}.png`))

// 📐 종이만 잘라낸다 — 폰 캡처(1236×2745) 안의 카드 자리(실측 · 모음판에서 역산 = x 60~1176 · y 210~1695)
const 종이들 = ['01-폴라로이드스크랩', '02-가을사진메모', '03-가을스크랩', '04-가을두칸', '05-가을기록3칸', '06-핑크레이스']
execFileSync('python3', ['-c', `from PIL import Image
import os
os.makedirs('${OUT}/종이',exist_ok=True)
for n in ${JSON.stringify(종이들)}:
  Image.open('${S}/속지6-홍보/'+n+'.png').crop((62,212,1174,1693)).save('${OUT}/종이/'+n+'.png')`])
const 종이 = (n) => b64(join(OUT, '종이', n + '.png'))

const 갈색 = '#6b2f24', 머스 = '#d9a441'
const 공통 = `${폰트}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:${REEL ? 1920 : 1350}px;overflow:hidden;position:relative;font-family:'Jua','Gowun Dodum',system-ui,sans-serif;-webkit-font-smoothing:antialiased;
  background:#e9dcc6;background-image:repeating-linear-gradient(0deg,rgba(107,47,36,.045) 0 1px,transparent 1px 7px),repeating-linear-gradient(90deg,rgba(255,255,255,.18) 0 1px,transparent 1px 9px)}
.stage{position:absolute;left:0;top:${REEL ? 285 : 0}px;width:1080px;height:1350px}
.top{position:absolute;z-index:5;left:70px;right:70px;top:74px}
.tag{display:inline-block;font-family:'Jua';font-size:28px;color:#fff7ea;background:${갈색};border-radius:999px;padding:8px 24px;letter-spacing:.06em;margin-bottom:18px}
.hh{font-family:'Jua';color:${갈색};font-size:84px;line-height:1.22;letter-spacing:-0.02em}
.ss{font-family:'Gowun Dodum';color:rgba(107,47,36,.7);font-size:32px;line-height:1.5;margin-top:14px}
.paper{position:absolute;z-index:4;left:50%;top:380px;width:700px;height:932px;margin-left:-350px;border-radius:28px;overflow:hidden;transform:rotate(-2deg);
  box-shadow:0 30px 60px rgba(90,50,20,.22),0 4px 10px rgba(90,50,20,.12);background:#fbf8f2}
.paper img{width:100%;height:100%;display:block;object-fit:cover}
.tape{position:absolute;z-index:6;width:220px;height:56px;background:rgba(217,164,65,.55);border-left:2px dashed rgba(255,255,255,.5);border-right:2px dashed rgba(255,255,255,.5);
  left:50%;margin-left:-110px;top:352px;transform:rotate(-2deg)}
.leaf{position:absolute;z-index:7}
.peek{position:absolute;z-index:8}
.foot{position:absolute;z-index:9;left:0;right:0;bottom:30px;text-align:center;font-family:'Gowun Dodum';color:rgba(107,47,36,.6);font-size:26px;letter-spacing:.04em}
.no{position:absolute;z-index:9;left:70px;top:330px;width:78px;height:78px;border-radius:50%;background:${머스};color:#fff7ea;font-family:'Jua';font-size:38px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 14px rgba(90,50,20,.2)}
`
const 잎 = (k, x, y, w, r, o = 1) => `<img class="leaf" src="${스티커(k)}" style="left:${x}px;top:${y}px;width:${w}px;transform:rotate(${r}deg);opacity:${o}">`
const 잎들 = (s) => [잎('au_i24', 880 + s, 250, 110, 18), 잎('au_i38', 40, 1180 - s, 96, -22), 잎('au_i42', 960, 1200 + s * .5, 88, 12, .95), 잎('au_i28', 250, 300 + s, 70, -8, .9)].join('')
const 곰펭 = (k, x, y, w, r) => `<img class="peek" src="${스티커(k)}" style="left:${x}px;top:${y}px;width:${w}px;transform:rotate(${r}deg)">`

const 장 = ({ no, 머리, 부제, 파일, 곰, 곰자리 = [720, 1090, 300, 8], 흔들 = 0 }) => `<style>${공통}</style><div class="stage">
<div class="top">${no ? '' : '<div class="tag">한끼 새 소식</div>'}<div class="hh">${머리}</div><div class="ss">${부제}</div></div>
${no ? `<div class="no">${no}</div>` : ''}
${잎들(흔들)}
<div class="paper"><img src="${종이(파일)}"></div><div class="tape"></div>
${곰 ? 곰펭(곰, ...곰자리) : ''}
<div class="foot">한끼 · 일기 → 꾸미기 → 틀</div></div>`

const 장들 = {
  '속지-01-표지': () => `<style>${공통}
.fan{position:absolute;z-index:4;top:530px;width:520px;height:693px;border-radius:24px;overflow:hidden;box-shadow:0 26px 54px rgba(90,50,20,.22);background:#fbf8f2}
.fan img{width:100%;height:100%;object-fit:cover;display:block}
.f1{left:70px;transform:rotate(-8deg)} .f2{left:280px;top:560px;transform:rotate(0deg);z-index:5} .f3{left:490px;transform:rotate(8deg)}
.hh{font-size:96px}</style><div class="stage">
<div class="top"><div class="tag">한끼 새 소식 · 무료</div><div class="hh">가을 일기 속지<br>왔어요</div><div class="ss">여섯 장 · 사진 넣고, 붙이고, 쓰고</div></div>
${잎들(0)}
<div class="fan f1"><img src="${종이('01-폴라로이드스크랩')}"></div>
<div class="fan f3"><img src="${종이('05-가을기록3칸')}"></div>
<div class="fan f2"><img src="${종이('03-가을스크랩')}"></div>
${곰펭('au_b30', 640, 960, 380, 4)}
<div class="foot">한끼 · 일기 → 꾸미기 → 틀</div></div>`,
  '속지-02-가을사진메모': () => 장({ no: 1, 머리: '가을 사진 메모', 부제: '사진 한 장 크게, 아래에 몇 줄', 파일: '02-가을사진메모', 곰: 'au_b09', 곰자리: [40, 950, 280, -6], 흔들: 10 }),
  '속지-03-가을스크랩': () => 장({ no: 2, 머리: '가을 스크랩', 부제: '찢은 종이에 붙이듯 · 사진 둘 ＋ 노트', 파일: '03-가을스크랩', 곰: 'au_b27', 곰자리: [740, 970, 280, 6], 흔들: -8 }),
  '속지-04-가을기록3칸': () => 장({ no: 3, 머리: '가을 기록 3칸', 부제: '아침·점심·저녁, 사진＋메모 세 줄', 파일: '05-가을기록3칸', 곰: 'au_b28', 곰자리: [40, 940, 270, -5], 흔들: 14 }),
  '속지-05-가을두칸': () => 장({ no: 4, 머리: '가을 두 칸', 부제: '위엔 오늘, 아래엔 내일 · 쓰고 싶은 만큼', 파일: '04-가을두칸', 곰: 'au_b24', 곰자리: [760, 990, 250, 8], 흔들: -4 }),
  '속지-06-폴라로이드스크랩': () => 장({ no: 5, 머리: '폴라로이드 스크랩', 부제: '핑크 폴라로이드 둘 ＋ 파란 메모', 파일: '01-폴라로이드스크랩', 곰: 'au_b16', 곰자리: [30, 960, 300, -7], 흔들: 6 }),
  '속지-07-핑크레이스': () => 장({ no: 6, 머리: '핑크 레이스', 부제: '큰 글칸 ＋ 오늘의 한 줄 카드', 파일: '06-핑크레이스', 곰: 'au_b20', 곰자리: [750, 980, 260, 5], 흔들: 0 }),
  '속지-08-마무리': () => `<style>${공통}
.card{position:absolute;z-index:5;left:80px;right:80px;top:400px;background:#fbf5e8;border-radius:36px;padding:44px 48px;box-shadow:0 22px 48px rgba(90,50,20,.16);transform:rotate(-1deg)}
.step{display:flex;align-items:center;gap:22px;margin:0 0 22px}
.step .d{width:64px;height:64px;border-radius:50%;background:${머스};color:#fff7ea;font-family:'Jua';font-size:32px;display:flex;align-items:center;justify-content:center;flex:none}
.step b{font-family:'Jua';color:${갈색};font-size:40px;font-weight:400} .step small{display:block;font-family:'Gowun Dodum';color:rgba(107,47,36,.65);font-size:26px;margin-top:2px}
.note{font-family:'Gowun Dodum';color:rgba(107,47,36,.7);font-size:28px;line-height:1.6;margin-top:10px}
.pill{position:absolute;left:50%;transform:translateX(-50%);bottom:150px;z-index:6;background:${갈색};color:#fff7ea;border-radius:999px;padding:16px 40px;font-size:32px;font-family:'Jua';white-space:nowrap}
.end{position:absolute;left:0;right:0;bottom:56px;z-index:5;text-align:center;font-family:'Jua';color:${갈색};font-size:38px;line-height:1.4}
.foot{display:none}</style><div class="stage">
<div class="top"><div class="tag">이렇게 골라요</div><div class="hh">일기 열고,<br>틀만 바꾸면 끝</div><div class="ss">이미 깔려 있으면 업데이트만 하면 돼요</div></div>
${잎들(0)}
<div class="card">
<div class="step"><div class="d">1</div><div><b>일기</b><small>날짜를 누르고</small></div></div>
<div class="step"><div class="d">2</div><div><b>꾸미기</b><small>아래 단추</small></div></div>
<div class="step"><div class="d">3</div><div><b>틀</b><small>서랍 맨 위 · 여섯 장 골라 쓰기</small></div></div>
<div class="note">종이색·줄무늬는 「종이」「선」에서 따로 — 한 속지가 여러 가지가 돼요.</div></div>
${곰펭('au_b26', 10, 990, 300, -3)}
<div class="pill">▶ Play 스토어에서 「한끼」 검색</div>
<div class="end">오늘도 한 끼 해냈다면, 한끼에서 만나요</div></div>`,
}

const CHROMIUM = process.env.SMOKE_CHROMIUM
const br = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const p = await br.newPage({ viewport: { width: 1080, height: REEL ? 1920 : 1350 }, deviceScaleFactor: 2 })
const names = []
for (const [n, f] of Object.entries(장들)) {
  await p.setContent(`<!doctype html><meta charset="utf-8">${f()}`)
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300)
  await p.screenshot({ path: `${OUT}/${n}.png` }); names.push(n); console.log('  ✅', n)
}
await br.close()
execFileSync('python3', ['-c', `from PIL import Image
names=${JSON.stringify(names)}
w=500; h=${REEL ? 889 : 625}
sh=Image.new('RGB',(w*4+50,h*2+30),'white')
for i,n in enumerate(names):
  sh.paste(Image.open('${OUT}/'+n+'.png').resize((w,h)),(10+(i%4)*(w+10),10+(i//4)*(h+10)))
sh.save('${OUT}/캐러셀-검수판.png')`])
console.log(`\n📸 8장 ＋ 검수판 → ${OUT}`)
