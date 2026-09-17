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
const 캡처2 = process.env.SHOT2 || ''  // 앱 목록 캡처 png (2장 뒤에 깔리는 둘째 폰)
const 씬 = (k) => { const p = join(R, `src/assets/scenepool/${k}.png`); return existsSync(p) ? 'data:image/png;base64,' + b64(p) : '' }
rmSync(낼곳, { recursive: true, force: true }); mkdirSync(낼곳, { recursive: true })

const b64 = (p) => existsSync(p) ? readFileSync(p).toString('base64') : ''
const 그림 = (k) => { const p = join(R, `src/assets/stickers/photo/${k}.png`); return existsSync(p) ? 'data:image/png;base64,' + b64(p) : '' }
const 제품그림 = (k) => { const p = join(R, `src/assets/curation/${k}.png`); return existsSync(p) ? 'data:image/png;base64,' + b64(p) : '' }
const 폰트 = b64(join(R, 'src/assets/fonts/gowun-dodum-korean-400.woff2'))
const 폰트L = b64(join(R, 'src/assets/fonts/gowun-dodum-latin-400.woff2'))
const 앱아이콘 = 'data:image/png;base64,' + b64(join(R, 'public/icons/icon-512-v7.png'))   // 🐻 끝 장 알약 앞 꼬르곰 — 카톡 배경·릴스와 «같은 꼴»(절대원칙 2026-09-16)

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

// ① 훅 — «배경 있는» 씬을 통째로 깔고 글은 아래 크림 띠에 (창업자 2026-09-17 *"첫장은 배경있는 걸로"*)
//    ⛔ 처음에 scene_market 을 집었다가 창업자 *"저거 애들 옛컷이야"* — 그건 9/5 에 옛 펭펭이라 카드 풀에서 내린 컷(ShareDrawCard OLD_PENG_SCENE).
//    ⛔ scenepool 은 옛 컷도 파일로 남아 있다(띠부씰이 같은 그림을 쓴다) → 홍보물에 쓸 땐 «정본»(scene_n_*·scene_np*)만.
//    ✅ scene_n_08 = 돋보기로 들여다보는 꼬르곰 — 「뒷면부터 살펴본다」와 뜻이 맞는다.
//    씬은 604px 라 1080 폭으로 키우면 흐릿해진다 → 위쪽 1080×1080 에 «cover» 로 채우고 아래 270px 는 크림 띠. 흐림은 일러스트라 용서된다.
장.push({ 이름: '1-훅', html: `
  <div style="position:absolute;inset:0;background:${크림}"></div>
  <div style="position:absolute;left:0;top:0;width:1080px;height:1000px;overflow:hidden">
    <img src="${씬('scene_n_08')}" style="width:100%;height:100%;object-fit:cover;object-position:center 30%">
    <div style="position:absolute;left:0;right:0;bottom:0;height:420px;background:linear-gradient(to bottom, rgba(246,236,220,0) 0%, rgba(246,236,220,0.96) 62%, ${크림} 100%)"></div>
  </div>
  <div style="position:absolute;left:70px;top:660px" class="알약">원재료 일일이 찾아보기 번거롭죠?</div>
  <div style="position:absolute;left:70px;top:750px;font-size:96px;line-height:1.22;font-weight:700">사러 가기 전에<br>뒷면부터</div>
  <div style="position:absolute;left:70px;bottom:100px" class="알약">원재료·알레르기를 앱에서 바로</div>
  <div style="position:absolute;right:60px;bottom:90px"><img src="${제품그림('cu_gulsauce')}" style="width:300px;height:300px;object-fit:contain"></div>` })

// ② 실물 — 폰 «둘»을 크게 겹친다 (창업자 2026-09-17 *"화면 좀 크게 UI넣어줘"*) — 뒤 = 목록(카드) · 앞 = 시트
const 폰 = (png, left, top, w, h, z) => `
  <div style="position:absolute;left:${left}px;top:${top}px;width:${w}px;height:${h}px;border-radius:64px;background:#2b2118;padding:14px;overflow:hidden;z-index:${z};box-shadow:0 30px 60px rgba(60,30,0,.25)">
    <div style="width:100%;height:100%;border-radius:50px;overflow:hidden;background:#fff">
      ${png ? `<img src="data:image/png;base64,${b64(png)}" style="width:100%;display:block">` : ''}
    </div>
  </div>`
장.push({ 이름: '2-실물', html: `
  <div style="position:absolute;left:0;right:0;top:90px;text-align:center;font-size:56px;font-weight:700">한끼에선 추천템만 누르면</div>
  <div style="position:absolute;left:0;right:0;top:170px;text-align:center;font-size:32px;color:${흐림}">왜 추천하는지, 뭐가 들었는지 바로 보여요</div>
  ${캡처2 ? 폰(캡처2, 40, 330, 620, 1340, 1) : ''}
  ${폰(캡처, 400, 250, 640, 1380, 2)}` })

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
  <div style="position:absolute;left:0;right:0;bottom:150px;text-align:center">
    <span class="알약" style="padding:24px 46px 24px 26px;font-size:40px;text-align:left;line-height:1.35;gap:22px">
      <img src="${앱아이콘}" style="width:112px;height:112px;border-radius:26px">
      <span>App Store · Google Play 에서<br><b style="color:${진};font-size:52px;letter-spacing:-1px">한끼 레시피북</b> 검색</span>
    </span></div>
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
