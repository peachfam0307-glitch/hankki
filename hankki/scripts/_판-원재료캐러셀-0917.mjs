// 📸 원재료 캐러셀 4:5 (1080×1350) — 「사러 가기 전에, 뒷면부터」 (2026-09-17)
//
// 📮 창업자 = *"이거 캐러셀하나 만들어줘. 인스타에 올릴"* (장바구니 원재료 시트 · v13.67)
// ⛔ 장마다 «짜임»을 가른다(추석 캐러셀 교훈 — 같은 틀에 글자만 바꾸면 "똑같아 보여").
// ⛔ 효능 말 0 — 「건강·좋다」 금지(식품표시광고법 자리). «볼 수 있다»까지만.
// 📌 끝 장 = 고정멘트 「오늘도 한끼하세요」 ＋ App Store · Google Play (절대원칙 2026-09-16 · 영어 표기)
// 🖼 2장은 «실물» — 앱 시트 캡처(scratchpad/앱-굴소스시트.png · 3배)를 그대로 넣는다(규칙 30).
import { chromium } from 'playwright'
import { readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const R = dirname(dirname(fileURLToPath(import.meta.url)))
const 낼곳 = process.env.OUT || '/tmp/claude-0/원재료캐러셀'
const 캡처 = process.env.SHOT || ''   // 앱 시트 캡처 png (없으면 2장은 글로만)
rmSync(낼곳, { recursive: true, force: true }); mkdirSync(낼곳, { recursive: true })

const b64 = (p) => existsSync(p) ? readFileSync(p).toString('base64') : ''
const 그림 = (k) => { const p = join(R, `src/assets/stickers/photo/${k}.png`); return existsSync(p) ? 'data:image/png;base64,' + b64(p) : '' }
const 제품그림 = (k) => { const p = join(R, `src/assets/curation/${k}.png`); return existsSync(p) ? 'data:image/png;base64,' + b64(p) : '' }
const 폰트 = b64(join(R, 'src/assets/fonts/gowun-dodum-korean-400.woff2'))
const 폰트L = b64(join(R, 'src/assets/fonts/gowun-dodum-latin-400.woff2'))

// ── 값은 저장소에서 «읽는다» — 지금 열려 있는 제품 중 원재료가 든 개수
const cur = readFileSync(join(R, 'src/data/curation.js'), 'utf8')
const { todayKST } = await import(join(R, 'src/today.js'))
const 오늘 = todayKST()
const 덩이 = [...cur.matchAll(/\{\s*name:\s*'[^']+'[\s\S]*?\}(?=\s*,?\s*(?:\/\/[^\n]*\n\s*)*(?:\{|\]))/g)].map((m) => m[0])
const 열린 = 덩이.filter((d) => { const f = d.match(/\bfrom:\s*'([^']+)'/); return !f || f[1] <= 오늘 })
const 든 = 열린.filter((d) => /\bingredients:\s*'/.test(d)).length

const 바탕 = '#FFFDF7', 진 = '#5d3410', 흐림 = '#a98a6b', 크림 = '#f6ecdc'
const 머리 = `<style>
  @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트}) format('woff2');unicode-range:U+AC00-D7A3,U+1100-11FF,U+3130-318F}
  @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트L}) format('woff2')}
  *{margin:0;padding:0;box-sizing:border-box;font-family:GD,sans-serif;-webkit-font-smoothing:antialiased}
  body{width:1080px;height:1350px;background:${바탕};color:${진};overflow:hidden;position:relative}
  .알약{display:inline-flex;align-items:center;gap:10px;background:#fff;border:2px solid #efe2cf;border-radius:999px;padding:14px 26px;font-size:30px;color:#7a5a3a}
  .카드{background:#fff;border:3px solid #efe2cf;border-radius:40px}
</style>`
const 곰 = (키, px, 자리) => `<img src="${그림(키)}" style="position:absolute;${자리};height:${px}px;object-fit:contain">`

const 장 = []

// ① 훅 — 큰 글씨 ＋ 굴소스 병 ＋ 만세 꼬르곰
장.push({ 이름: '1-훅', html: `
  <div style="position:absolute;left:80px;top:150px;font-size:38px;color:${흐림}">주부의 장바구니가 달라졌어요</div>
  <div style="position:absolute;left:80px;top:215px;font-size:88px;line-height:1.28;font-weight:700">사러 가기 전에<br>뒷면부터</div>
  <div style="position:absolute;right:60px;bottom:210px"><img src="${제품그림('cu_gulsauce')}" style="width:520px;height:520px;object-fit:contain"></div>
  <div style="position:absolute;left:80px;bottom:110px" class="알약">원재료·알레르기를 앱에서 바로</div>
  ${곰('ce_manse', 330, 'left:70px;top:600px')}` })

// ② 실물 — 앱 시트 캡처를 폰 틀에 (짜임: 가운데 세로)
장.push({ 이름: '2-실물', html: `
  <div style="position:absolute;left:0;right:0;top:110px;text-align:center;font-size:56px;font-weight:700">제품 이름을 누르면</div>
  <div style="position:absolute;left:0;right:0;top:190px;text-align:center;font-size:32px;color:${흐림}">추천 글 전문과 원재료가 한 장에 올라와요</div>
  <div style="position:absolute;left:250px;top:280px;width:580px;height:1000px;border-radius:56px;background:#2b2118;padding:16px;overflow:hidden">
    <div style="width:100%;height:100%;border-radius:42px;overflow:hidden;background:#fff">
      ${캡처 ? `<img src="data:image/png;base64,${b64(캡처)}" style="width:100%;display:block">` : ''}
    </div>
  </div>` })

// ③ 무엇을 보나 — 세 칸을 «왼쪽으로» 붙여 계단처럼
const 칸 = (제목, 글, top, left) => `
  <div class="카드" style="position:absolute;left:${left}px;top:${top}px;width:640px;padding:34px 40px">
    <div style="font-size:30px;color:${흐림};margin-bottom:10px">${제목}</div>
    <div style="font-size:40px;font-weight:700;line-height:1.35">${글}</div>
  </div>`
장.push({ 이름: '3-무엇', html: `
  <div style="position:absolute;left:80px;top:120px;font-size:58px;font-weight:700">뒷면에 있던 세 줄</div>
  <div style="position:absolute;left:80px;top:205px;font-size:32px;color:${흐림}">제품 포장 표시를 그대로 옮겨 적었어요</div>
  ${칸('원재료명', '무엇으로 만들었는지<br>순서대로', 330, 80)}
  ${칸('알레르기 유발물질', '대두 · 밀 · 우유 같은<br>표시를 굵게', 610, 160)}
  ${칸('영양정보', '열량 · 나트륨 · 당류<br>포장 숫자 그대로', 890, 240)}
  ${곰('ch_che04', 220, 'right:70px;top:110px')}` })

// ④ 얼마나 — 숫자 하나 크게 ＋ 제품 그림 띠 (배경 뒤집기)
const 띠 = ['cu_gulsauce', 'cu_cheese', 'cu_curry', 'cu_bread', 'cu_dangmyeon', 'cu_burrito'].map((k) => `<img src="${제품그림(k)}" style="width:150px;height:150px;object-fit:contain">`).join('')
장.push({ 이름: '4-얼마나', html: `
  <div style="position:absolute;inset:0;background:${크림}"></div>
  <div style="position:absolute;left:0;right:0;top:170px;text-align:center;font-size:38px;color:${흐림}">지금 장바구니에 열려 있는 제품 중</div>
  <div style="position:absolute;left:0;right:0;top:250px;text-align:center;font-size:190px;font-weight:700;line-height:1">${든}<span style="font-size:70px">개</span></div>
  <div style="position:absolute;left:0;right:0;top:480px;text-align:center;font-size:44px;line-height:1.5">원재료가 들어 있어요<br><span style="font-size:32px;color:${흐림}">새로 올라오는 제품도 채워서 나가요</span></div>
  <div style="position:absolute;left:0;right:0;top:720px;display:flex;justify-content:center;gap:24px">${띠}</div>
  ${곰('ce_cheers', 330, 'left:330px;bottom:90px')}` })

// ⑤ 정직 — 확인일 · 포장 우선 · 잘못됐어요 (글 오른쪽 · 그림 왼쪽)
장.push({ 이름: '5-정직', html: `
  <div style="position:absolute;left:80px;top:120px;font-size:58px;font-weight:700">틀리면 바로 고쳐요</div>
  <div style="position:absolute;left:80px;top:205px;font-size:32px;color:${흐림}">포장이 바뀌면 글자도 바뀌어야 하니까</div>
  <div class="카드" style="position:absolute;left:80px;right:80px;top:340px;padding:44px 48px;font-size:38px;line-height:1.7">
    · 옮겨 적은 <b>확인 날짜</b>를 같이 보여요<br>
    · 실제 제품 <b>포장 표시가 우선</b>이에요<br>
    · 다르면 <b>「잘못됐어요 알려주기」</b> 한 번이면 돼요
  </div>
  ${곰('ch_che05', 300, 'right:90px;bottom:160px')}
  <div style="position:absolute;left:80px;bottom:120px" class="알약">v13.67 부터</div>` })

// ⑥ 끝 — 고정멘트 (절대원칙 2026-09-16 · App Store · Google Play 영어 표기)
장.push({ 이름: '6-끝', html: `
  <div style="position:absolute;left:0;right:0;top:280px;text-align:center;font-size:78px;font-weight:700">오늘도 한끼하세요</div>
  <div style="position:absolute;left:0;right:0;top:420px;text-align:center;font-size:36px;color:${흐림}">흩어진 레시피를, 한곳에</div>
  <div style="position:absolute;left:0;right:0;bottom:170px;text-align:center;font-size:44px;line-height:1.5;color:#7a5a3a">App Store · Google Play 에서<br><b style="color:${진};font-size:54px">한끼</b> 다운로드</div>
  ${곰('ce_manse', 400, 'left:330px;top:580px')}` })

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await (await b.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })).newPage()
for (const s of 장) {
  await p.setContent(`<!doctype html><html><head>${머리}</head><body>${s.html}</body></html>`)
  await p.waitForTimeout(250)
  await p.screenshot({ path: `${낼곳}/${s.이름}.png` })
}
await b.close()
console.log(`📸 ${장.length}장 →`, 낼곳, `· 원재료 든 제품 ${든}/${열린.length}`)
