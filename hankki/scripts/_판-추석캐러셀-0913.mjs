// 📸 추석 캐러셀 4:5 (1080×1350) — 「올해 추석은 좀 편하게」 (2026-09-13)
//
// 📮 창업자 = *"추석부터 가자. 우리앱에 la갈비 갈비찜. 전류있잖아"* → *"인스타 캐러셀 만들자"*
// 🔢 실측 = LA갈비는 **없다**(갈비 7편에 안 들어 있다). 갈비찜 2 · 갈비탕 2 · 떡갈비 1.
// ⛔ 장마다 «짜임»을 가른다 — 같은 틀에 글자만 바꾸면 창업자가 *"네가준시안2개 똑같아보여"* 라고 한다.
// 📌 끝 장 = 고정멘트 「오늘도 한끼하세요」 (docs/인스타-고정멘트-2026-09-12.md)
import { chromium } from 'playwright'
import { readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const R = dirname(dirname(fileURLToPath(import.meta.url)))   // ⛔컨테이너 경로를 박지 않는다
const 낼곳 = process.env.OUT || '/tmp/claude-0/추석캐러셀'
rmSync(낼곳, { recursive: true, force: true }); mkdirSync(낼곳, { recursive: true })

const 그림 = (k) => {
  for (const f of ['photo', 'ing', 'season']) {
    const p = join(R, `src/assets/stickers/${f}/${k}.png`)
    if (existsSync(p)) return 'data:image/png;base64,' + readFileSync(p).toString('base64')
  }
  return ''
}
const 폰트 = readFileSync(join(R, 'src/assets/fonts/gowun-dodum-korean-400.woff2')).toString('base64')
const 폰트L = readFileSync(join(R, 'src/assets/fonts/gowun-dodum-latin-400.woff2')).toString('base64')

// ── 값은 저장소에서 «읽는다» (⛔손으로 적지 않는다)
const { 레시피들 } = await import(join(R, 'scripts/recipe.mjs'))
const 편 = new Map(레시피들().map((r) => [r.title, r]))
const 집 = (t) => { const r = 편.get(t); return r ? { 이름: r.title, 그림: r.icon, 분: r.time, 인분: r.servings } : null }
const 갈비 = ['초간단 순살 갈비찜', '매운 소갈비찜', '수제 떡갈비'].map(집).filter(Boolean)
const 전 = ['깻잎전', '버섯전'].map(집).filter(Boolean)
const 나물 = ['잡채', '들깨 궁채나물'].map(집).filter(Boolean)
const 남은 = ['나물비빔밥', '남은 나물 잡채'].map(집).filter(Boolean)
// ⛔ 간장게장은 뺐다 — 창업자 2026-09-13 = *"간장게장은 빼고"*
const 꽃게 = ['꽃게간장조림', '꽃게탕'].map(집).filter(Boolean)

const 바탕 = '#FFFDF7'
const 진 = '#5d3410'
const 머리 = `<style>
  @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트}) format('woff2');unicode-range:U+AC00-D7A3,U+1100-11FF,U+3130-318F}
  @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트L}) format('woff2')}
  *{margin:0;padding:0;box-sizing:border-box;font-family:GD,sans-serif;-webkit-font-smoothing:antialiased}
  body{width:1080px;height:1350px;background:${바탕};color:${진};overflow:hidden;position:relative}
  .알약{display:inline-flex;align-items:center;gap:10px;background:#fff;border:2px solid #efe2cf;border-radius:999px;padding:14px 26px;font-size:30px;color:#7a5a3a}
</style>`

const 컷 = (그림키, px) => `<img src="${그림(그림키)}" style="width:${px}px;height:${px}px;object-fit:contain">`

// 🐻🐧 한복 꼬르곰·펭펭 — 창업자 = *"캐릭터 너무 귀엽다. 한복입은 걸로 «작게 하나씩만» 붙이자."*
//   ⛔ 장마다 «다른» 컷을 쓴다. 같은 그림이 여섯 번 나오면 안 본다.
const 곰펭 = (키, px, 자리) => `<img src="${그림(키)}" style="position:absolute;${자리};width:${px}px;object-fit:contain">`

// ── 여섯 장 — 짜임을 갈랐다
const 장 = []

// ① 훅 — 큰 글씨 하나 ＋ 갈비찜 크게 (가운데 아님 · 왼쪽 아래로 앉힌다)
장.push({ 이름: '1-훅', html: `
  <div style="position:absolute;left:80px;top:150px;font-size:40px;color:#a98a6b">2026 추석</div>
  <div style="position:absolute;left:80px;top:215px;font-size:86px;line-height:1.28;font-weight:700">올해 추석은<br>좀 편하게</div>
  <div style="position:absolute;right:-40px;bottom:150px">${컷(갈비[0]?.그림, 640)}</div>
  <div style="position:absolute;left:80px;bottom:90px" class="알약">한끼에 명절 음식이 있어요</div>
  ${곰펭('cs_b04', 300, 'left:70px;top:560px')}` })

// ⛔ 갈비 장은 「가족들 오는 날엔」으로 «합쳤다» (창업자 2026-09-13)

// ③ 전 — 둘을 «가로»로 나란히 (②와 방향을 바꾼다)
장.push({ 이름: '3-전', html: `
  <div style="position:absolute;left:0;right:0;top:120px;text-align:center;font-size:58px;font-weight:700">전 부치는 날</div>
  <div style="position:absolute;left:0;right:0;top:205px;text-align:center;font-size:32px;color:#a98a6b">기름 냄새 나는 그 날</div>
  <div style="position:absolute;left:70px;right:70px;top:330px;display:flex;gap:40px">
    ${전.map((g) => `
      <div style="flex:1;background:#fff;border-radius:40px;padding:44px 20px 36px;text-align:center;box-shadow:0 6px 20px rgba(93,52,16,.07)">
        ${컷(g.그림, 300)}
        <div style="font-size:48px;font-weight:700;margin-top:24px">${g.이름}</div>
        <div style="font-size:30px;color:#a98a6b;margin-top:12px">${g.분}분</div>
      </div>`).join('')}
  </div>
  <div style="position:absolute;left:0;right:0;bottom:150px;text-align:center;font-size:34px;color:#7a5a3a">깻잎전은 지금 · 버섯전은 9월 21일에 열려요</div>
  ${곰펭('cs_b11', 210, 'left:60px;bottom:210px')}` })

// ④ 나물·잡채 — 글을 «오른쪽»에 붙이고 그림을 왼쪽으로 (③의 좌우대칭을 깬다)
장.push({ 이름: '4-나물', html: `
  <div style="position:absolute;left:-80px;top:430px">${컷(나물[0]?.그림, 700)}</div>
  <div style="position:absolute;right:80px;top:170px;text-align:right">
    <div style="font-size:58px;font-weight:700">잡채랑 나물</div>
    <div style="font-size:32px;color:#a98a6b;margin-top:16px">손 많이 가는 것부터</div>
  </div>
  ${나물.map((g, i) => `
    <div style="position:absolute;right:80px;top:${330 + i * 160}px;text-align:right">
      <div style="font-size:48px;font-weight:700">${g.이름}</div>
      <div style="font-size:30px;color:#a98a6b;margin-top:8px">${g.분}분</div>
    </div>`).join('')}
  <div style="position:absolute;right:80px;bottom:170px;text-align:right;font-size:34px;line-height:1.6;color:#7a5a3a">한 번 해두면<br>사흘은 반찬 걱정 없어요</div>
  ${곰펭('cs_b08', 200, 'right:90px;top:640px')}` })

// ⑤ 연휴 뒤 — 배경을 «진하게» 뒤집는다 (앞 넷과 확 다르게)
장.push({ 이름: '5-남은음식', html: `
  <div style="position:absolute;inset:0;background:#f3e6d2"></div>
  <div style="position:absolute;left:0;right:0;top:150px;text-align:center;font-size:38px;color:#a0805c">9월 28일</div>
  <div style="position:absolute;left:0;right:0;top:215px;text-align:center;font-size:76px;line-height:1.3;font-weight:700">연휴 끝나고<br>남은 음식으로</div>
  <div style="position:absolute;left:0;right:0;top:520px;display:flex;justify-content:center;gap:50px">
    ${남은.map((g) => `
      <div style="text-align:center">
        ${컷(g.그림, 300)}
        <div style="font-size:44px;font-weight:700;margin-top:20px">${g.이름}</div>
        <div style="font-size:30px;color:#a0805c;margin-top:8px">${g.분}분</div>
      </div>`).join('')}
  </div>
  <div style="position:absolute;left:0;right:0;bottom:140px;text-align:center;font-size:34px;color:#7a5a3a">그 주에 저절로 열려요</div>
  ${곰펭('cs_b14', 200, 'right:70px;bottom:180px')}` })

// ⑤-b 꽃게 — 창업자 = *"꽃게간장조림이랑 꽃게탕도 가족들이 먹기 되게 좋아."*
//    ⭐ 마침 «이번 주 제철»이 꽃게다(`weekly.js`). 셋 다 이미 열렸고 검수도 끝났다.
//    ⛔ 짜임을 또 가른다 — 여긴 «그림 셋을 계단처럼» 어긋나게 놓는다.
// ☑️ 창업자 2026-09-13 = *"가족들 오는 날에 꽃게, 갈비 넣자."* → 갈비 장과 «합쳤다»
//    ⭐ 꽃게가 위(이번 주 제철이라 «지금» 볼 것) · 갈비가 아래
장.push({ 이름: '2-가족오는날', html: `
  <div style="position:absolute;left:80px;top:110px;font-size:38px;color:#a98a6b">이번 주 제철 · 명절</div>
  <div style="position:absolute;left:80px;top:168px;font-size:64px;font-weight:700">가족들 오는 날엔</div>
  ${[...꽃게, ...갈비].map((g, i) => `
    <div style="position:absolute;left:70px;right:70px;top:${290 + i * 200}px;height:180px;display:flex;align-items:center;gap:30px;background:#fff;border-radius:30px;padding:0 38px;box-shadow:0 5px 16px rgba(93,52,16,.07)">
      ${컷(g.그림, 150)}
      <div style="flex:1">
        <div style="font-size:44px;font-weight:700">${g.이름}</div>
        <div style="font-size:28px;color:#a98a6b;margin-top:6px">${g.분}분 · ${g.인분}인분</div>
      </div>
    </div>`).join('')}
  ${곰펭('cs_b13', 175, 'right:64px;top:120px')}` })

// ⑥ 끝 — 고정멘트
장.push({ 이름: '6-끝', html: `
  <div style="position:absolute;left:0;right:0;top:420px;text-align:center;font-size:78px;font-weight:700">오늘도 한끼하세요</div>
  <div style="position:absolute;left:0;right:0;top:560px;text-align:center;font-size:36px;color:#a98a6b">흩어진 레시피를, 한곳에</div>
  <div style="position:absolute;left:0;right:0;bottom:200px;text-align:center;font-size:34px;color:#7a5a3a">구글 플레이스토어에서 <b style="color:${진}">한끼</b> 다운로드</div>
  ${곰펭('cs_b03', 420, 'left:330px;top:700px')}` })

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await (await b.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })).newPage()
for (const s of 장) {
  await p.setContent(`<!doctype html><html><head>${머리}</head><body>${s.html}</body></html>`)
  await p.waitForTimeout(250)
  await p.screenshot({ path: `${낼곳}/${s.이름}.png` })
}
await b.close()
console.log(`📸 ${장.length}장 →`, 낼곳)
