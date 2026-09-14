// 🗓🗓 **주간 식단표 — 짜임 시안 넷** (2026-09-08)
//
// 📮 창업자 = *"주간식단표도 한끼로 짤수있지"* ＋ *"몇가지 시안 제시해줘. 짜임이나 배치등등 기존과다르게."*
//
// ⭐⭐ 설계 관문 통과(절대원칙 33) — 세 각도에서 나온 «고칠 것»이 넷 모두에 들어 있다:
//   ⑴사람 = **빈 칸 7개를 손으로 채우라고 하면 아무도 안 채운다.** 앱이 «먼저 채우고» 사람은 «바꾼다».
//      (북마크를 상세 안에 뒀다가 창업자가 *"번거로워서 한번도 안썼어"* 한 것과 같은 자리)
//   ⑵사고 = 막 깐 사람은 내 레시피가 0편 → **기본 166편**이 채움 재료다. 칸은 레시피 «사본»이 아니다.
//   ⑶규모 = 칸 = {날짜, 끼니, 레시피id} 세 값(약 40B). 통째로 담으면 1~2KB × 364칸 = **0.4~0.7MB/년**
//      → 40배 차이. 폰 저장 5MB 벽에서 2026-09-02 사고를 되풀이하지 않는다.
//
// ⛔ 흉내가 아니라 **앱의 실제 색·실제 레시피 제목·실제 음식 그림**으로 그린다(절대원칙 30).
//    ⚠️ 다만 이건 «아직 없는 화면»이라 앱 컴포넌트가 없다 — 그래서 «시안»이라고 못 박는다.
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/_판-식단표시안-0908.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = new URL('..', import.meta.url).pathname
const OUT = '/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad/식단표'
mkdirSync(OUT, { recursive: true })
const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`
const 그림 = (k) => b64(join(ROOT, `src/assets/stickers/photo/${k}.png`))
const 폰트 = readFileSync(join(ROOT, 'design/promo/fonts-embed.css'), 'utf8')

// 🍚 실제 레시피에서 뽑는다 — 제목을 지어내지 않는다
const { allBasicRecipes } = await import('../src/data/basics.js')
const 찾기 = (t) => allBasicRecipes.find((r) => r.title === t)
const 한주 = ['된장찌개', '제육볶음', '소고기 미역국', '국물 떡볶이', '돼지고기 김치찌개', '콩국수', '닭곰탕']
  .map((t) => 찾기(t)).filter(Boolean)
const 요일 = ['월', '화', '수', '목', '금', '토', '일']

// 🎨 앱 색 그대로 (src/styles.css :root)
const C = { bg: '#fdfbf7', surface: '#fff', cream: '#f2ede3', creamD: '#ebe1d1', sand: '#cdbfa8',
  brown: '#5878a0', text: '#3d3830', sub: '#8f887b', line: '#efe8dc' }

const 바탕 = `${폰트}
*{margin:0;padding:0;box-sizing:border-box}
body{width:390px;height:844px;overflow:hidden;background:${C.bg};color:${C.text};
  font-family:'Gowun Dodum',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.top{padding:14px 16px 6px;display:flex;align-items:baseline;gap:8px}
.top h1{font-size:20px;font-weight:700}
.top .sub{font-size:12.5px;color:${C.sub}}
.pill{display:inline-flex;align-items:center;gap:4px;background:${C.cream};border-radius:999px;
  padding:5px 11px;font-size:12.5px;color:${C.sub};white-space:nowrap}
.pill.on{background:${C.creamD};color:${C.text};font-weight:700}
.thumb{background:linear-gradient(160deg,#fff,#f4f2ee);border-radius:10px;display:grid;place-items:center;overflow:hidden}
.thumb img{width:80%;height:80%;object-fit:contain}
.card{background:${C.surface};border:1px solid ${C.line};border-radius:14px}
.btn{background:${C.brown};color:#fff;border-radius:999px;padding:9px 16px;font-size:13.5px;font-weight:700;display:inline-block}
.foot{position:absolute;left:0;right:0;bottom:0;height:58px;background:rgba(253,251,247,.94);
  border-top:1px solid ${C.line};display:flex;align-items:center;justify-content:space-around;font-size:11px;color:${C.sub}}
.tag{position:absolute;top:10px;right:12px;background:${C.brown};color:#fff;font-size:11px;
  border-radius:6px;padding:3px 9px;font-weight:700;letter-spacing:.02em}
`

// ── ㄱ. 「한 줄 띠」 — 요일이 «가로»로 흐르고 오늘이 크게 ────────────────────────
// ⭐ 기존 화면과 다른 점 = 우리 앱은 지금 전부 «세로 격자»다(레시피·장보기·일기).
//    이건 «가로 띠»라 한 화면에 7일이 다 들어오고, 오늘 칸만 부풀어 시선이 거기 멈춘다.
const ㄱ = `<div class="tag">ㄱ 한 줄 띠</div>
<div class="top"><h1>이번 주 밥상</h1><span class="sub">9/8 – 9/14</span></div>
<div style="padding:0 16px 10px"><span class="pill on">앱이 짜줌</span> <span class="pill">냉장고 우선</span> <span class="pill">해볼 것에서</span></div>
<div style="display:flex;gap:8px;padding:2px 16px 14px;align-items:flex-end">
${한주.map((r, i) => `
  <div style="flex:${i === 0 ? '2.1' : '1'};text-align:center">
    <div style="font-size:${i === 0 ? 13 : 11.5}px;color:${i === 0 ? C.brown : C.sub};font-weight:${i === 0 ? 700 : 400};margin-bottom:5px">${요일[i]}</div>
    <div class="thumb" style="height:${i === 0 ? 92 : 52}px"><img src="${그림(r.icon)}"></div>
  </div>`).join('')}
</div>
<div style="padding:0 16px">
  <div class="card" style="padding:14px 15px">
    <div style="font-size:12px;color:${C.sub};margin-bottom:3px">오늘 · 월요일 저녁</div>
    <div style="font-size:19px;font-weight:700;margin-bottom:8px">${한주[0].title}</div>
    <div style="font-size:12.5px;color:${C.sub};line-height:1.6">냉장고에 있는 <b style="color:${C.text}">두부·애호박</b>을 써요<br>모자란 것 2가지는 장보기에 담겨 있어요</div>
    <div style="margin-top:12px;display:flex;gap:8px">
      <span class="btn">요리 시작</span>
      <span class="pill" style="padding:9px 14px">다른 걸로 바꾸기</span>
    </div>
  </div>
  <div style="margin-top:14px;font-size:13px;color:${C.sub};font-weight:700;margin-bottom:8px">이번 주에 쓸 재료</div>
  <div style="display:flex;flex-wrap:wrap;gap:6px">
    ${['두부 1모', '애호박 1개', '돼지고기 300g', '미역', '떡국떡', '콩물 2팩'].map((t, i) => `<span class="pill"${i < 2 ? ` style="background:${C.creamD};color:${C.text}"` : ''}>${t}</span>`).join('')}
  </div>
</div>
<div class="foot"><span>홈</span><span>레시피</span><span style="color:${C.brown};font-weight:700">식단</span><span>장보기</span><span>내 것</span></div>`

// ── ㄴ. 「영수증」 — 세로 한 장에 일주일이 죽 이어진다 ──────────────────────────
// ⭐ 다른 점 = 카드가 아니라 «한 장의 종이»다. 칸을 나누지 않아 손으로 적은 메모처럼 읽힌다.
//    ⭐ 쭉 훑으면 한 주가 «이야기»로 읽히고, 장 볼 것이 맨 아래에 영수증처럼 붙는다.
const ㄴ = `<div class="tag">ㄴ 영수증</div>
<div class="top"><h1>이번 주 밥상</h1><span class="sub">9/8 – 9/14</span></div>
<div style="padding:0 16px 12px"><span class="pill on">앱이 짜줌</span> <span class="pill">7끼 · 재료 12가지</span></div>
<div style="margin:0 16px;background:${C.surface};border-radius:14px;border:1px solid ${C.line};padding:6px 0;position:relative">
${한주.slice(0, 5).map((r, i) => `
  <div style="display:flex;align-items:center;gap:11px;padding:11px 15px;${i ? `border-top:1px dashed ${C.line}` : ''}">
    <div style="width:26px;font-size:13px;color:${i === 0 ? C.brown : C.sub};font-weight:700">${요일[i]}</div>
    <div class="thumb" style="width:44px;height:44px;flex:none"><img src="${그림(r.icon)}"></div>
    <div style="flex:1;min-width:0">
      <div style="font-size:15px;font-weight:700">${r.title}</div>
      <div style="font-size:11.5px;color:${C.sub};margin-top:2px">${r.time}분 · ${i < 2 ? '냉장고 재료로' : i === 2 ? '해볼 것에 꽂은 것' : '자주 만든 것'}</div>
    </div>
    <div style="font-size:18px;color:${C.sand}">⋮</div>
  </div>`).join('')}
  <div style="border-top:2px solid ${C.line};margin-top:4px;padding:12px 15px 6px">
    <div style="font-size:12px;color:${C.sub};display:flex;justify-content:space-between"><span>사야 할 것</span><span>5가지</span></div>
    <div style="font-size:12px;color:${C.sub};display:flex;justify-content:space-between;margin-top:5px"><span>냉장고에서 쓰는 것</span><span style="color:${C.brown};font-weight:700">7가지</span></div>
  </div>
</div>
<div style="padding:14px 16px;display:flex;gap:8px">
  <span class="btn">장보기에 담기</span><span class="pill" style="padding:9px 14px">한 주 다시 짜기</span>
</div>
<div class="foot"><span>홈</span><span>레시피</span><span style="color:${C.brown};font-weight:700">식단</span><span>장보기</span><span>내 것</span></div>`

// ── ㄷ. 「냉장고에서 시작」 — 재료가 위, 식단이 그 «결과»로 아래 ────────────────
// ⭐ 다른 점 = 화면의 «주인공이 레시피가 아니라 재료»다. 로드맵의 진짜 페인(재료를 버린다)에 정면으로 답한다.
//    ⭐ 재료를 끄고 켜면 아래 식단이 따라 바뀐다 — 짜는 게 아니라 «고르는» 일이 된다.
const ㄷ = `<div class="tag">ㄷ 냉장고에서</div>
<div class="top"><h1>이 재료로 한 주</h1></div>
<div style="padding:0 16px 12px;font-size:12.5px;color:${C.sub}">유통기한이 가까운 것부터 담았어요</div>
<div style="margin:0 16px;background:${C.cream};border-radius:14px;padding:13px 14px">
  <div style="font-size:12px;color:${C.sub};margin-bottom:9px">냉장고에 있는 것 · 눌러서 빼기</div>
  <div style="display:flex;flex-wrap:wrap;gap:6px">
    ${[['두부', 'D-2'], ['애호박', 'D-3'], ['돼지고기', 'D-4'], ['미역', ''], ['콩나물', 'D-2'], ['달걀', '']].map(([t, d]) =>
      `<span class="pill" style="background:#fff;${d ? `color:${C.text};font-weight:700` : ''}">${t}${d ? `<b style="color:${C.brown};font-weight:700;font-size:11px">${d}</b>` : ''}</span>`).join('')}
  </div>
</div>
<div style="padding:16px 16px 8px;font-size:13px;color:${C.sub};font-weight:700">이걸로 짠 한 주 · 재료 <b style="color:${C.brown}">9가지 중 7가지</b>를 다 써요</div>
<div style="padding:0 16px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
${한주.slice(0, 4).map((r, i) => `
  <div class="card" style="padding:9px">
    <div class="thumb" style="height:74px;margin-bottom:7px"><img src="${그림(r.icon)}"></div>
    <div style="font-size:11.5px;color:${C.brown};font-weight:700">${요일[i]}요일</div>
    <div style="font-size:14px;font-weight:700;margin-top:1px">${r.title}</div>
    <div style="font-size:11px;color:${C.sub};margin-top:3px">${i < 2 ? '두부·애호박' : '돼지고기'} 씀</div>
  </div>`).join('')}
</div>
<div style="padding:14px 16px"><span class="btn">이대로 하기</span> <span class="pill" style="padding:9px 14px">더 채우기</span></div>
<div class="foot"><span>홈</span><span>레시피</span><span style="color:${C.brown};font-weight:700">식단</span><span>장보기</span><span>내 것</span></div>`

// ── ㄹ. 「달력에 얹기」 — 이미 있는 요리 달력 위에 «앞날»을 그린다 ───────────────
// ⭐ 다른 점 = 새 화면을 안 만든다. 일기·요리 달력이 «지난 것»을 보여주니 그 위에 «올 것»을 얹는다.
//    ⭐ 지난 주는 사진이 남고 올 주는 계획이 뜬다 — 한 자리에서 뒤와 앞이 이어진다.
const ㄹ = `<div class="tag">ㄹ 달력에 얹기</div>
<div class="top"><h1>9월</h1><span class="sub">한 끼 달력</span></div>
<div style="padding:0 16px 10px"><span class="pill">지난 주</span> <span class="pill on">이번 주</span> <span class="pill">다음 주</span></div>
<div style="margin:0 16px;background:${C.surface};border:1px solid ${C.line};border-radius:14px;padding:12px 10px">
  <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px;font-size:11px;color:${C.sub};text-align:center;margin-bottom:7px">
    ${요일.map((d) => `<div>${d}</div>`).join('')}
  </div>
  <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px">
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `
      <div style="text-align:center">
        <div class="thumb" style="height:42px;${i > 0 ? 'opacity:.55;border:1px dashed ' + C.sand : 'border:2px solid ' + C.brown}"><img src="${그림(한주[i].icon)}"></div>
        <div style="font-size:9.5px;color:${C.sub};margin-top:3px;line-height:1.2">${한주[i].title.length > 5 ? 한주[i].title.slice(0, 5) : 한주[i].title}</div>
      </div>`).join('')}
  </div>
  <div style="margin-top:10px;font-size:11.5px;color:${C.sub};text-align:center">진한 칸 = 이미 해먹은 것 · 흐린 칸 = 앞으로 할 것</div>
</div>
<div style="padding:14px 16px 8px">
  <div class="card" style="padding:13px 14px">
    <div style="font-size:12px;color:${C.sub}">지난 주에 해먹은 것 5끼</div>
    <div style="font-size:12.5px;margin-top:6px;line-height:1.7">제일 많이 만든 건 <b>된장찌개</b>였어요.<br>이번 주엔 안 겹치게 짜뒀어요.</div>
  </div>
</div>
<div style="padding:4px 16px"><span class="btn">이번 주 채우기</span></div>
<div class="foot"><span>홈</span><span>레시피</span><span style="color:${C.brown};font-weight:700">식단</span><span>장보기</span><span>내 것</span></div>`

const 시안들 = [['ㄱ-한줄띠', ㄱ], ['ㄴ-영수증', ㄴ], ['ㄷ-냉장고', ㄷ], ['ㄹ-달력', ㄹ]]

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const 판들 = []
for (const [이름, 몸] of 시안들) {
  await page.setContent(`<style>${바탕}</style>${몸}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  const p = join(OUT, `${이름}.png`)
  await page.screenshot({ path: p })
  판들.push(p)
  // ⭐ 절대원칙 21 — 보내기 전에 «가려진 것이 없나»를 재고, 넘침도 본다
  const 넘침 = await page.evaluate(() => document.body.scrollWidth - 390)
  if (넘침 > 0) console.log(`⚠️ ${이름} — 가로로 ${넘침}px 넘친다`)
}
await b.close()

execFileSync('python3', ['-c', `
from PIL import Image, ImageDraw
import sys
ims=[Image.open(p).convert('RGB') for p in sys.argv[1:]]
S=0.30
cw,ch=int(ims[0].width*S),int(ims[0].height*S)
out=Image.new('RGB',(cw*4+30,ch+10),(255,255,255)); d=ImageDraw.Draw(out)
for k,im in enumerate(ims):
    out.paste(im.resize((cw,ch),Image.LANCZOS),(k*(cw+10)+5,5))
out.save('${join(OUT, '식단표-시안넷.jpg')}',quality=86)
print(out.size)`, ...판들], { stdio: 'inherit' })
console.log('\n✅ 시안 4장 —', OUT)
