// 📸 추석 캐러셀 4:5 (1080×1350) — 「올해 추석은 좀 편하게」 (2026-09-13)
//
// 📮 창업자 = *"추석부터 가자. 우리앱에 la갈비 갈비찜. 전류있잖아"* → *"인스타 캐러셀 만들자"*
// 🔢 [2026-09-13 갱신] LA갈비가 «생겼다» — 창업자가 직접 써서 줬다(9/14 열림).
//    ⛔ 옛 주석 = *"LA갈비는 없다"*. 그날 오후에 들어왔으니 이 줄은 낡은 값이었다.
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
// ⛔ 떡갈비를 뺐다 — 창업자 2026-09-13 "떡갈비 빼고 LA갈비 넣어줘" (특집 줄에서도 뺐다)
const 갈비 = ['초간단 순살 갈비찜', '매운 소갈비찜', 'LA갈비'].map(집).filter(Boolean)
// ⭐ 새 전 셋을 넣었다 — 창업자 "전 알배추랑 새우관자전 넣어야지"
const 전 = ['깻잎고기전', '꼬치 없는 꼬치전', '새우관자전', '알배추전'].map(집).filter(Boolean)
// ⛔ 궁채나물(90분)을 뺐다 — 창업자 2026-09-13 "궁채는 빼고싶은데" → "괜찮아 들깨무침"
//    ⭐ 새송이버섯 들깨무침은 10분이라 잡채(40분) 옆에서 «금방 되는 것»으로 대비가 산다.
const 나물 = ['잡채', '새송이버섯 들깨무침'].map(집).filter(Boolean)
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
// ⛔⛔ [2026-09-13] 창업자 = "펭펭에 비해 꼬르곰들이 너무 작고, 들깨무침에 펭펭 작아"
//    🔢 실측 = 컷마다 «가로세로 비율»이 다르다. cs_b02(펭펭) 829x1183(세로형) · cs_b13(꼬르곰) 593x589(정사각).
//       같은 width:175px 를 줘도 펭펭은 높이 250px, 꼬르곰은 174px — 나란히 놓으면 키가 다르다.
//    ⭐ 그래서 «높이»로 맞춘다. 사람 눈은 키를 본다.
const 곰펭 = (키, px, 자리) => `<img src="${그림(키)}" style="position:absolute;${자리};height:${px}px;object-fit:contain">`

// ── 여섯 장 — 짜임을 갈랐다
const 장 = []

// ① 훅 — 큰 글씨 하나 ＋ 갈비찜 크게 (가운데 아님 · 왼쪽 아래로 앉힌다)
장.push({ 이름: '1-훅', html: `
  <div style="position:absolute;left:80px;top:150px;font-size:40px;color:#a98a6b">2026 추석</div>
  <div style="position:absolute;left:80px;top:215px;font-size:86px;line-height:1.28;font-weight:700">올해 추석은<br>좀 편하게</div>
  <div style="position:absolute;right:-40px;bottom:150px">${컷(갈비[0]?.그림, 640)}</div>
  <div style="position:absolute;left:80px;bottom:90px" class="알약">한끼에 명절 음식이 있어요</div>
  ${곰펭('cs_b04', 290, 'left:70px;top:560px')}` })

// ⛔ 갈비 장은 「가족들 오는 날엔」으로 «합쳤다» (창업자 2026-09-13)

// ③ 전 — 둘을 «가로»로 나란히 (②와 방향을 바꾼다)
장.push({ 이름: '3-전', html: `
  <div style="position:absolute;left:0;right:0;top:120px;text-align:center;font-size:58px;font-weight:700">전 부치는 날</div>
  <div style="position:absolute;left:0;right:0;top:205px;text-align:center;font-size:32px;color:#a98a6b">기름 냄새 나는 그 날 · 네 가지 다 지금 열려 있어요</div>
  <!-- ⛔ [2026-09-13] 가로 한 줄에 넷을 넣었더니 «넘쳐서» 새우관자전이 잘리고 알배추전은 아예 안 보였다.
       ⭐ 2x2 격자로. 칸이 넓어져 「꼬치 없는 꼬치전」 같은 긴 이름도 한 줄에 든다. -->
  <!-- ⛔ [2026-09-13] 그림을 320px 로 키웠더니 2행이 «바닥 밖으로» 나갔다(알배추전 20분이 잘림) -->
  <div style="position:absolute;left:70px;right:70px;top:290px;display:grid;grid-template-columns:1fr 1fr;gap:28px">
    ${전.map((g) => `
      <div style="background:#fff;border:3px solid #efe2cf;border-radius:40px;padding:28px 16px 24px;text-align:center">
        ${컷(g.그림, 275)}
        <div style="font-size:44px;font-weight:700;margin-top:18px">${g.이름}</div>
        <div style="font-size:28px;color:#a98a6b;margin-top:10px">${g.분}분</div>
      </div>`).join('')}
  </div>
  <!-- ⛔ [2026-09-13] 아래 문구와 곰이 «2x2 카드»와 겹쳤다 — 문구는 부제로 올리고 곰은 제목 옆으로 뺐다 -->
  ${곰펭('cs_b11', 190, 'right:40px;top:95px')}` })

// ④ 나물·잡채 — 글을 «오른쪽»에 붙이고 그림을 왼쪽으로 (③의 좌우대칭을 깬다)
// ⛔ [2026-09-13] 창업자 = "잡채는 왼쪽 끝부분 잘렸어" — left:-80px 이라 그릇이 화면 밖으로 나갔다.
//    ＋ 들깨무침은 «그림이 아예 없었다»(글만 있었다). 둘 다 그림을 온전히 보여준다.
장.push({ 이름: '4-나물', html: `
  <div style="position:absolute;left:0;right:0;top:130px;text-align:center;font-size:58px;font-weight:700">잡채랑 나물</div>
  <div style="position:absolute;left:0;right:0;top:215px;text-align:center;font-size:32px;color:#a98a6b">손 많이 가는 것부터 · 전날 미리 해두면 그날이 편해요</div>
  ${나물.map((g, i) => `
    <div style="position:absolute;left:80px;right:80px;top:${310 + i * 450}px;height:400px;display:flex;align-items:center;gap:40px;background:#fff;border:3px solid #efe2cf;border-radius:44px;padding:0 50px">
      ${컷(g.그림, 290)}
      <div style="flex:1;text-align:right">
        <!-- ⛔ 58px 이면 「새송이버섯 들깨무침」이 두 줄로 접힌다(실측) -->
        <div style="font-size:46px;font-weight:700;white-space:nowrap">${g.이름}</div>
        <div style="font-size:34px;color:#a98a6b;margin-top:14px">${g.분}분</div>
      </div>
    </div>`).join('')}
  ${곰펭('cs_b08', 190, 'right:40px;top:95px')}` })

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
  ${곰펭('cs_b14', 310, 'right:70px;bottom:180px')}` })

// ⑤-b 꽃게 — 창업자 = *"꽃게간장조림이랑 꽃게탕도 가족들이 먹기 되게 좋아."*
//    ⭐ 마침 «이번 주 제철»이 꽃게다(`weekly.js`). 셋 다 이미 열렸고 검수도 끝났다.
//    ⛔ 짜임을 또 가른다 — 여긴 «그림 셋을 계단처럼» 어긋나게 놓는다.
// ☑️ 창업자 2026-09-13 = *"가족들 오는 날에 꽃게, 갈비 넣자."*
//    → 그 뒤 = *"가족들 오는 날에를 «페이지 2개»로 만들자 꽃게랑 고기"*
//    ⛔ 한 장에 다섯 줄을 넣으니 줄마다 200px 라 바닥(1350px)에 닿았다. 갈라서 «세 줄씩» 크게.
// ⭐ 줄 수가 다르면 «위 시작점»을 옮겨 가운데로 — 꽃게 둘일 때 아래가 허전했다
const 가족장 = (이름, 윗글, 목록, 곰키, 곰자리) => ({ 이름, html: `
  <div style="position:absolute;left:80px;top:110px;font-size:38px;color:#a98a6b">가족들 오는 날엔</div>
  <div style="position:absolute;left:80px;top:168px;font-size:64px;font-weight:700">${윗글}</div>
  ${목록.map((g, i) => `
    <div style="position:absolute;left:60px;right:60px;top:${(목록.length === 2 ? 440 : 320) + i * 280}px;height:250px;display:flex;align-items:center;gap:38px;background:#fff;border:3px solid #efe2cf;border-radius:40px;padding:0 44px">
      ${컷(g.그림, 230)}
      <div style="flex:1">
        <div style="font-size:48px;font-weight:700">${g.이름}</div>
        <div style="font-size:30px;color:#a98a6b;margin-top:8px">${g.분}분 · ${g.인분}인분</div>
      </div>
    </div>`).join('')}
  ${곰펭(곰키, 250, 곰자리)}` })
// ⭐ 꽃게가 먼저 — 이번 주 제철이라 «지금» 살 것이다
장.push(가족장('2-가족오는날-꽃게', '제철 꽃게로', 꽃게, 'cs_b13', 'right:64px;top:120px'))
장.push(가족장('2b-가족오는날-고기', '고기 요리로', 갈비, 'cs_b02', 'right:64px;top:120px'))

// ⑥ 끝 — 고정멘트
장.push({ 이름: '6-끝', html: `
  <!-- ⛔ [2026-09-13] 창업자 = "마지막장은 너무 아래에 몰려있어" — 제목이 420px 라 위가 비고 아래가 붐볐다.
       ⭐ 제목을 280px 로 올리고, 다운로드 줄을 34 → 44px 로 키웠다(이 장의 «할 일»이 그것이다). -->
  <div style="position:absolute;left:0;right:0;top:280px;text-align:center;font-size:78px;font-weight:700">오늘도 한끼하세요</div>
  <div style="position:absolute;left:0;right:0;top:420px;text-align:center;font-size:36px;color:#a98a6b">흩어진 레시피를, 한곳에</div>
  <div style="position:absolute;left:0;right:0;bottom:170px;text-align:center;font-size:44px;line-height:1.5;color:#7a5a3a">구글 플레이스토어에서<br><b style="color:${진};font-size:54px">한끼</b> 다운로드</div>
  ${곰펭('cs_b03', 400, 'left:330px;top:580px')}` })

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await (await b.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })).newPage()
for (const s of 장) {
  await p.setContent(`<!doctype html><html><head>${머리}</head><body>${s.html}</body></html>`)
  await p.waitForTimeout(250)
  await p.screenshot({ path: `${낼곳}/${s.이름}.png` })
}
await b.close()
console.log(`📸 ${장.length}장 →`, 낼곳)
