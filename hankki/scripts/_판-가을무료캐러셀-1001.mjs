// 📣🍁 인스타 캐러셀 「가을 스티커 무료로 왔어요」 — 10/1 저절로 열리는 22컷 (2026-09-25)
//
// 📮 창업자 = *"10월1일에 올라가는 무료판 캐러셀 만들어줘"*
// ⭐ 컷 목록은 손으로 적지 않는다 — Stickers.jsx 의 STICKER_GROUPS 에서 from '2026-10-01' 인 갈래를 읽는다.
// 🎨 뼈대 = 「가을 일기 속지」 캐러셀(_판-속지캐러셀-0906)과 같은 크라프트 종이 결 · 1080×1350
// 🏪 끝 알약 = App Store · Google Play 에서 「한끼 레시피북」 검색 (절대원칙 2026-09-16)
// 실행: SCRATCH=<scratchpad> SMOKE_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/_판-가을무료캐러셀-1001.mjs
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = new URL('..', import.meta.url).pathname
const S = process.env.SCRATCH || '/tmp/claude-0'
const OUT = join(S, '가을무료캐러셀-1001')
mkdirSync(OUT, { recursive: true })
const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`
const 폰트 = readFileSync(join(ROOT, 'design/promo/fonts-embed.css'), 'utf8')
const 컷 = (k) => b64(join(ROOT, `src/assets/stickers/photo/${k}.png`))
const 앱아이콘 = b64(join(ROOT, 'public/icons/icon-512-v7.png'))

// 📂 앱 코드에서 그날 열리는 갈래를 읽는다
const src = readFileSync(join(ROOT, 'src/components/Stickers.jsx'), 'utf8')
const 갈래 = {}
for (const m of src.matchAll(/\{ key: '(\w+)'[^\n]*?from: '2026-10-01', label: '([^']+)', items: \[([^\]]+)\]/g)) {
  갈래[m[1]] = { label: m[2], items: [...m[3].matchAll(/'(\w+)'/g)].map((x) => x[1]) }
}
const 코너 = 갈래.deco_corner_autumn, 열매 = 갈래.deco_autumn_b, 나들이 = 갈래.buddies_autumn_b
if (!코너 || !열매 || !나들이) { console.error('⛔ 10/1 갈래를 못 찾았다', Object.keys(갈래)); process.exit(1) }
const 합 = 코너.items.length + 열매.items.length + 나들이.items.length
console.log(`📂 ${코너.label} ${코너.items.length} · ${열매.label} ${열매.items.length} · ${나들이.label} ${나들이.items.length} = ${합}컷`)

const 갈색 = '#6b2f24', 머스 = '#d9a441'
const 공통 = `${폰트}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;position:relative;font-family:'Jua','Gowun Dodum',system-ui,sans-serif;-webkit-font-smoothing:antialiased;
  background:#e9dcc6;background-image:repeating-linear-gradient(0deg,rgba(107,47,36,.045) 0 1px,transparent 1px 7px),repeating-linear-gradient(90deg,rgba(255,255,255,.18) 0 1px,transparent 1px 9px)}
.top{position:absolute;z-index:5;left:70px;right:70px;top:74px}
.tag{display:inline-block;font-size:28px;color:#fff7ea;background:${갈색};border-radius:999px;padding:8px 24px;letter-spacing:.06em;margin-bottom:18px}
.hh{color:${갈색};font-size:84px;line-height:1.22;letter-spacing:-0.02em}
.ss{font-family:'Gowun Dodum';color:rgba(107,47,36,.72);font-size:32px;line-height:1.5;margin-top:14px}
.sheet{position:absolute;z-index:4;left:60px;right:60px;top:430px;bottom:120px;background:#fbf8f2;border-radius:32px;
  box-shadow:0 26px 54px rgba(90,50,20,.18);transform:rotate(-1deg);display:grid;align-content:center;justify-items:center;align-items:center;padding:34px}
.sheet img{max-width:100%;max-height:100%;object-fit:contain}
.no{position:absolute;z-index:9;right:70px;top:80px;width:78px;height:78px;border-radius:50%;background:${머스};color:#fff7ea;font-size:38px;display:flex;align-items:center;justify-content:center}
.foot{position:absolute;z-index:9;left:0;right:0;bottom:44px;text-align:center;font-family:'Gowun Dodum';color:rgba(107,47,36,.6);font-size:26px;letter-spacing:.04em}
.알약{display:inline-flex;align-items:center;gap:14px;background:#fff;border:2px solid #efe2cf;border-radius:999px;padding:16px 30px;font-size:30px;color:#7a5a3a;white-space:nowrap}
.알약 img{width:50px;height:50px;border-radius:12px}
`
const 격자 = (items, cols, h) => `<div class="sheet" style="grid-template-columns:repeat(${cols},1fr);grid-auto-rows:${h}px;gap:18px">
${items.map((k) => `<img src="${컷(k)}" style="height:${h - 10}px">`).join('')}</div>`
const 알약 = `<span class="알약"><img src="${앱아이콘}">App Store · Google Play 에서 「한끼 레시피북」 검색</span>`

const 장들 = {
  '1-표지': () => `<style>${공통}
.hh{font-size:100px}
.pile img{position:absolute;z-index:4}</style>
<div class="top"><div class="tag">10월 1일 · 무료</div><div class="hh">가을 스티커<br>새로 왔어요</div><div class="ss">${합}컷 · 일기·레시피 꾸미기에 붙여요</div></div>
<div class="pile">
<img src="${컷('pc1_02')}" style="left:70px;top:560px;width:250px;transform:rotate(-8deg)">
<img src="${컷('au_i26')}" style="left:360px;top:540px;width:330px">
<img src="${컷('pc1_06')}" style="left:770px;top:520px;width:230px;transform:rotate(6deg)">
<img src="${컷('au_i35')}" style="left:80px;top:880px;width:300px;transform:rotate(-4deg)">
<img src="${컷('au_b12')}" style="left:420px;top:830px;width:340px">
<img src="${컷('au_i23')}" style="left:790px;top:870px;width:220px;transform:rotate(5deg)">
</div>
<div class="foot" style="bottom:48px">${알약}</div>`,
  '2-포토코너': () => `<style>${공통}</style>
<div class="no">1</div>
<div class="top"><div class="tag">데코</div><div class="hh">${코너.label}</div><div class="ss">사진 네 귀퉁이에 · ${코너.items.length}가지</div></div>
${격자(코너.items, 4, 330)}
<div class="foot">꾸미기 → 데코</div>`,
  '3-열매수확': () => `<style>${공통}</style>
<div class="no">2</div>
<div class="top"><div class="tag">데코</div><div class="hh">${열매.label}</div><div class="ss">포도·감·밤·버섯 · ${열매.items.length}가지</div></div>
${격자(열매.items, 3, 230)}
<div class="foot">꾸미기 → 데코</div>`,
  '4-가을나들이': () => `<style>${공통}</style>
<div class="no">3</div>
<div class="top"><div class="tag">친구들</div><div class="hh" style="font-size:72px">${나들이.label}</div><div class="ss">꼬르곰·펭펭 · ${나들이.items.length}가지</div></div>
<div class="sheet" style="display:block;padding:0">
<img src="${컷(나들이.items[0])}" style="position:absolute;left:40px;top:40px;height:330px">
<img src="${컷(나들이.items[1])}" style="position:absolute;left:340px;top:40px;height:330px">
<img src="${컷(나들이.items[2])}" style="position:absolute;left:640px;top:40px;height:330px">
<img src="${컷(나들이.items[3])}" style="position:absolute;left:120px;top:420px;height:330px">
<img src="${컷(나들이.items[4])}" style="position:absolute;left:520px;top:410px;height:350px">
</div>
<div class="foot">꾸미기 → 친구들</div>`,
  '5-끝': () => `<style>${공통}
.card{position:absolute;z-index:5;left:80px;right:80px;top:420px;background:#fbf5e8;border-radius:36px;padding:44px 48px;box-shadow:0 22px 48px rgba(90,50,20,.16);transform:rotate(-1deg)}
.step{display:flex;align-items:center;gap:22px;margin:0 0 24px}
.step .d{width:64px;height:64px;border-radius:50%;background:${머스};color:#fff7ea;font-size:32px;display:flex;align-items:center;justify-content:center;flex:none}
.step b{color:${갈색};font-size:40px;font-weight:400} .step small{display:block;font-family:'Gowun Dodum';color:rgba(107,47,36,.65);font-size:26px;margin-top:2px}
.end{position:absolute;left:0;right:0;bottom:190px;z-index:5;text-align:center;color:${갈색};font-size:40px}
.foot{bottom:70px}</style>
<div class="top"><div class="tag">이렇게 써요</div><div class="hh">꾸미기 열고<br>골라 붙이면 끝</div><div class="ss">10월 1일부터 저절로 열려요 · 업데이트만 하면 돼요</div></div>
<div class="card">
<div class="step"><div class="d">1</div><div><b>일기 · 레시피</b><small>꾸미고 싶은 장을 열고</small></div></div>
<div class="step"><div class="d">2</div><div><b>꾸미기</b><small>아래 단추</small></div></div>
<div class="step" style="margin:0"><div class="d">3</div><div><b>데코 · 친구들</b><small>가을 갈래에서 골라 붙이기</small></div></div>
</div>
<img src="${컷('au_b03')}" style="position:absolute;z-index:6;right:70px;top:820px;width:230px">
<div class="end">오늘도 한끼하세요</div>
<div class="foot">${알약}</div>`,
}

const CHROMIUM = process.env.SMOKE_CHROMIUM
const br = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const p = await br.newPage({ viewport: { width: 1080, height: 1350 } })
const names = []
for (const [n, f] of Object.entries(장들)) {
  await p.setContent(`<!doctype html><meta charset="utf-8">${f()}`)
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300)
  await p.screenshot({ path: `${OUT}/${n}.png` }); names.push(n); console.log('  ✅', n)
}
await br.close()
execFileSync('python3', ['-c', `from PIL import Image
names=${JSON.stringify(names)}
w=432; h=540
sh=Image.new('RGB',(w*5+60,h+20),'white')
for i,n in enumerate(names):
  sh.paste(Image.open('${OUT}/'+n+'.png').resize((w,h)),(10+i*(w+10),10))
sh.save('${OUT}/검수판.png')`])
console.log(`\n📸 ${names.length}장 ＋ 검수판 → ${OUT}`)
