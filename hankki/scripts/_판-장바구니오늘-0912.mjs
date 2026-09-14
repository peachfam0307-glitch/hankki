// 🛒🔍 「오늘(D-0) 저절로 열린 장바구니」 고화질 전수 검수판 — 2026-09-12
//
// ⛔ 절대원칙(2026-08-01) = 「날짜가 저절로 여는 문」도 전날 검수한다.
//    오늘 세 개가 이미 열렸다 — 마야항아리 기버터 260g · 더오담 김치콩비지찌개 · 톰볼라 버섯피자.
//
// ⭐ 규칙 30 — 판은 «앱이 화면에 쓰는 바로 그 값»이라야 한다.
//    curation.js 는 import.meta.glob 을 써서 node 가 못 읽는다 → **앱을 띄워 화면에서 읽는다.**
//    그림·이름·설명·구매처·사러가기 주소를 전부 «렌더된 DOM»에서 뽑고, 카드도 그대로 찍는다.
//
// ☑️ 절대원칙(2026-08-19) = 검수판은 «무조건» 체크 ＋ 복사가 된다.
//
// 실행: node scripts/_판-장바구니오늘-0912.mjs
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = dirname(fileURLToPath(import.meta.url))
const dist = join(여기, '../dist')
const 낼곳 = process.env.CLAUDE_SCRATCHPAD_DIR || join(여기, '../../_shots')
if (!existsSync(낼곳)) mkdirSync(낼곳, { recursive: true })

const 찾을것 = ['기버터 260g', '김치콩비지찌개', '버섯피자']

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.webp': 'image/webp', '.svg': 'image/svg+xml' }
const srv = createServer((req, res) => {
  let p = join(dist, decodeURIComponent(req.url.split('?')[0]).replace(/^\/hankki/, ''))
  if (!existsSync(p) || p.endsWith('/')) p = join(dist, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' })
  res.end(readFileSync(p))
}).listen(0)
const port = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || undefined })
// ⭐ deviceScaleFactor 3 = 고화질. ⛔줄인 판을 보고 「괜찮다」 하지 않는다(규칙 13).
const pg = await b.newPage({ viewport: { width: 390, height: 1100 }, deviceScaleFactor: 3 })
await pg.addInitScript(SEED_COACH_SEEN)
await pg.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
await pg.goto(`http://localhost:${port}/hankki/`)
await pg.waitForTimeout(1500)
await pg.getByRole('button', { name: /^닫기$/ }).first().click().catch(() => {})
await pg.waitForTimeout(500)

// ⛔ 엉뚱한 화면을 찍고 초록불을 켜지 않는다(규칙 18ⓕ) — 장보기 탭인지 «확인»하고 아니면 죽는다.
await pg.getByRole('button', { name: '장보기', exact: true }).first().click({ force: true }).catch(() => {})
await pg.waitForTimeout(1200)
if (!(await pg.getByText('주부의 장바구니', { exact: false }).count())) {
  console.log('⛔ 장보기 화면이 아니다 — 찍지 않는다'); await b.close(); srv.close(); process.exit(1)
}

// 🔗🔗 「사러가기」가 실제로 «어디로 가나» — ⛔ a[href] 를 읽으면 안 된다.
//    ⛔⛔ 첫 판이 정확히 그랬다: `대상.locator('a[href]')` 로 읽어 **셋 다 「링크 없다」**로 찍었다.
//       그런데 curation.js 엔 쿠팡 링크가 «있었다». 앱이 멀쩡한데 «판이» 거짓말을 한 것이다(규칙 30).
//    🌲 뿌리 = 「사러가기」는 `<button onClick={buy(it)}>` 이다(ShopScreen.jsx 602줄). 링크 태그가 아니다.
//    ✅ 그래서 «눌러서» 열리는 주소를 잡는다 — 그게 유저가 실제로 가는 곳이다.
const 눌러서어디로 = async (대상) => {
  const 버튼 = 대상.getByRole('button', { name: '사러가기', exact: true }).first()
  if (!(await 버튼.count())) return null // 한살림 = 일부러 안 그린다
  // ⛔⛔ 2판도 틀렸다 — `window.open` 을 가로챘는데 앱은 그걸 «안 쓴다».
  //    🌲 진짜 = `utils.js` 의 `openExternal()` 이 **임시 `<a target=_blank>` 를 만들어 click()** 한다.
  //    ✅ 그래서 `HTMLAnchorElement.prototype.click` 을 가로챈다 — 세 길을 다 막아 둔다.
  await 대상.page().evaluate(() => {
    window.__간곳 = null
    const 원래 = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function () { window.__간곳 = this.href; /* ⛔진짜로 나가지 않는다 */ }
    window.__원래클릭 = 원래
    window.open = (u) => { window.__간곳 = u; return null }
    window.location.assign = (u) => { window.__간곳 = u }
  })
  await 버튼.click({ force: true }).catch(() => {})
  await 대상.page().waitForTimeout(400)
  return await 대상.page().evaluate(() => window.__간곳)
}

const 판 = []
for (const 이름 of 찾을것) {
  // 카드를 펼쳐야 보이는 갈래가 있다 — 이름이 보일 때까지 접힌 갈래를 연다.
  let el = pg.getByText(이름, { exact: false }).first()
  if (!(await el.count())) {
    for (const 여는것 of await pg.getByRole('button').all()) {
      await 여는것.click({ force: true }).catch(() => {})
      await pg.waitForTimeout(120)
      if (await pg.getByText(이름, { exact: false }).count()) break
    }
    el = pg.getByText(이름, { exact: false }).first()
  }
  if (!(await el.count())) { console.log(`⛔ 「${이름}」 카드를 화면에서 못 찾았다`); continue }

  const 카드 = el.locator('xpath=ancestor::*[self::li or self::article or contains(@class,"cur-item") or contains(@class,"card")][1]').first()
  const 대상 = (await 카드.count()) ? 카드 : el
  // ⛔ scrollIntoViewIfNeeded 는 «보이기만» 하면 멈춘다 — 그래서 카드가 화면 맨 아래에 걸려
  //    «하단 탭바가 카드 위에 겹쳐» 찍혔다(1판에서 김치콩비지찌개가 그랬다).
  //    ✅ 화면 «가운데»로 올린다 — 탭바와 겹칠 자리가 없어진다.
  await 대상.evaluate((e) => e.scrollIntoView({ block: 'center' }))
  await pg.waitForTimeout(450)
  const 파일 = `장바구니-${이름.replace(/[^가-힣0-9]/g, '')}-0912.png`
  await 대상.screenshot({ path: join(낼곳, 파일) }).catch(async () => { await pg.screenshot({ path: join(낼곳, 파일) }) })

  판.push({
    이름,
    파일,
    글자: (await 대상.innerText()).trim(),
    그림: await 대상.locator('img').first().getAttribute('src').catch(() => null),
    그림깨짐: await 대상.locator('img').first().evaluate((i) => i.complete && i.naturalWidth === 0).catch(() => null),
    사러가기: await 눌러서어디로(대상),
  })
}

// ⚠️⚠️ 「배지에 적힌 구매처」와 「실제로 가는 곳」이 갈리나 — 이게 제일 무서운 종류다.
//    유저는 배지를 믿고 누르는데 엉뚱한 데로 가면, 안 가는 것보다 나쁘다(규칙 37).
const 몰주소 = { 쿠팡: 'coupang.', 컬리: 'kurly.', 오아시스: 'oasis.', 자연드림: 'icoop', 네이버: 'naver.' }
for (const p of 판) {
  const 배지 = Object.keys(몰주소).find((m) => p.글자.includes(m))
  p.배지 = 배지 || null
  p.어긋남 = !!(배지 && p.사러가기 && !p.사러가기.includes(몰주소[배지]))
  p.간곳몰 = Object.keys(몰주소).find((m) => p.사러가기?.includes(몰주소[m])) || '어딘지 모름'
}
await b.close(); srv.close()

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const html = `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>오늘 열린 장바구니 3개 — 검수판</title><style>
body{margin:0;padding:16px;background:#faf8f4;font:16px/1.6 -apple-system,system-ui,sans-serif;color:#3d3830}
h1{font-size:20px;margin:0 0 4px}.sub{color:#8b8377;font-size:14px;margin-bottom:18px}
.it{background:#fff;border-radius:16px;padding:14px;margin-bottom:16px;box-shadow:0 1px 4px #0001}
.it img{width:100%;border-radius:12px;display:block;background:#f5f3ee}
.nm{font-size:17px;font-weight:800;margin:12px 0 6px}
.tx{white-space:pre-wrap;background:#f7f5f0;border-radius:10px;padding:10px;font-size:15px}
.lk{font-size:13px;color:#8b8377;word-break:break-all;margin-top:8px}
.pk{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.pk button{flex:1;min-width:90px;padding:11px;border:2px solid #e2ded2;border-radius:11px;background:#fff;font-size:15px;font-weight:700;color:#8b8377}
.pk button.on{border-color:#5d3410;background:#5d3410;color:#fff}
#cp{width:100%;padding:15px;border:0;border-radius:13px;background:#5d3410;color:#fff;font-size:17px;font-weight:800;margin-top:8px}
#out{white-space:pre-wrap;background:#fff;border-radius:12px;padding:12px;margin-top:12px;font-size:15px;user-select:all}
.bad{color:#c0392b;font-weight:800}</style>
<h1>🛒 오늘 열린 장바구니 3개</h1>
<div class=sub>2026-09-12 (D-0) · 이미 열려 있다 · 앱 화면에서 그대로 뽑았다 · 고화질 3배</div>
${판.map((p, i) => `<div class=it data-n="${esc(p.이름)}">
<img src="${esc(p.파일)}" alt="">
<div class=nm>${i + 1}. ${esc(p.이름)}</div>
<div class=tx>${esc(p.글자)}</div>
<div class=lk>사러가기 → ${p.사러가기 ? esc(p.사러가기) : '<span class=bad>⛔ 없다 (네이버 검색으로 떨어진다)</span>'}</div>
${p.그림깨짐 ? '<div class="lk bad">⛔ 그림이 깨졌다</div>' : ''}
${p.어긋남 ? `<div class="lk bad">⛔⛔ 배지는 「${esc(p.배지)}」인데 실제로는 «${esc(p.간곳몰)}»로 간다 — 유저는 배지를 믿고 누른다</div>` : ''}
<div class=pk><button data-v="좋다">좋다</button><button data-v="고칠 것">고칠 것</button><button data-v="내린다">내린다</button></div>
</div>`).join('')}
<button id=cp>결과 복사하기</button><div id=out></div>
<script>
const K='hankki:판-장바구니0912'
const S=JSON.parse(localStorage.getItem(K)||'{}')
document.querySelectorAll('.it').forEach(it=>{
  const n=it.dataset.n
  it.querySelectorAll('.pk button').forEach(b=>{
    if(S[n]===b.dataset.v)b.classList.add('on')
    b.onclick=()=>{S[n]=b.dataset.v;localStorage.setItem(K,JSON.stringify(S))
      it.querySelectorAll('.pk button').forEach(x=>x.classList.toggle('on',x===b))}
  })
})
document.getElementById('cp').onclick=()=>{
  const t='[오늘 열린 장바구니 3개 · 2026-09-12]\\n'+[...document.querySelectorAll('.it')]
    .map(it=>' · '+it.dataset.n+' — '+(S[it.dataset.n]||'아직')).join('\\n')
  const o=document.getElementById('out');o.textContent=t
  // ⛔ clipboard 가 resolve 되고도 실제로 복사 안 되는 폰이 있다(v10.97) → 글자를 골라 준다
  navigator.clipboard?.writeText(t).catch(()=>{})
  const r=document.createRange();r.selectNodeContents(o)
  const s=getSelection();s.removeAllRanges();s.addRange(r)
}
</script>`
const 판파일 = join(낼곳, '판-장바구니오늘-0912.html')
writeFileSync(판파일, html)
console.log(`✅ ${판.length}개 · ${판파일}`)
for (const p of 판) console.log(` · ${p.이름} — 사러가기 ${p.사러가기 ? 'O' : '⛔없다'} · 그림 ${p.그림깨짐 ? '⛔깨짐' : 'O'}${p.어긋남 ? ` · ⛔배지「${p.배지}」인데 ${p.간곳몰}로 간다` : ''}`)
