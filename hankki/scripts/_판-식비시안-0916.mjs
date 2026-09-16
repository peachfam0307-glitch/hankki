// 💰💰 식비 기록 시안 — 창업자가 눈으로 고르는 판 (2026-09-16)
//   📮 창업자 = *"어떤식으로 적을수있는지 시안줘"* ＋ *"나가 좋지"*(＝장보기·외식 둘 다 가른다)
//   🔒 설계 관문 통과 = 한 줄 39바이트 실측 · 5년 139KB · Google Play SMS 정책(2026-09-16 열람)
//   ⛔ 앱 소스를 «안» 고친다 — 아직 안 만든 화면이라 «순수 HTML»로 그려서 보여준다(절대원칙 21·30).
//      앱과 같은 색·글꼴을 쓰려고 빌드된 styles 를 그대로 불러온다.
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, readdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad/식비시안'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const CSS = readdirSync(join(DIST, 'assets')).find((f) => f.endsWith('.css'))

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
let 몸 = ''
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') { s.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return s.end(몸) }
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = Buffer.from('') }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4419, r))

const 돈 = (n) => n.toLocaleString('ko-KR')

// ── 화면 조각들 ────────────────────────────────────────────────
const 머리 = (제목) => `<div class="tb"><span>${제목}</span></div>`

// ㉮ 장보기 화면 «안»의 적는 줄
const 장보기 = `
${머리('장보기')}
<div class="pad">
  <div class="sec">장보기 리스트</div>
  <div class="card">
    <div class="li"><i class="ck on">✓</i><s>두부 1모</s></div>
    <div class="li"><i class="ck on">✓</i><s>대파</s></div>
    <div class="li"><i class="ck"></i><span>참치캔 150g</span></div>
    <div class="li"><i class="ck"></i><span>청양고추</span></div>
  </div>

  <div class="money">
    <div class="money-h">오늘 쓴 식비</div>
    <div class="money-row">
      <button class="seg on">장보기</button>
      <button class="seg">외식·배달</button>
    </div>
    <div class="money-in"><span class="ph">얼마 썼어요?</span><b>원</b></div>
    <div class="money-hint">영수증 총액 하나만 적으면 돼요</div>
  </div>
</div>`

// ㉯ 식비 자리 (달별)
const 식비 = `
${머리('식비')}
<div class="pad">
  <div class="big">
    <div class="big-k">이번 달 식비</div>
    <div class="big-v">${돈(317400)}<em>원</em></div>
    <div class="big-sub">지난달보다 <b class="down">32,000원 적어요</b></div>
  </div>

  <div class="two">
    <div class="half"><div class="hk">장보기</div><div class="hv">${돈(186400)}<em>원</em></div><div class="hs">9번</div></div>
    <div class="half"><div class="hk">외식·배달</div><div class="hv">${돈(131000)}<em>원</em></div><div class="hs">6번</div></div>
  </div>

  <div class="hero">
    <div class="hero-k">집밥 한 끼에</div>
    <div class="hero-v">${돈(2400)}<em>원</em></div>
    <div class="hero-s">집밥 <b>14번</b> · 배달 한 번 값이면 <b>9끼</b></div>
  </div>

  <div class="sec">9월</div>
  <div class="card">
    <div class="day"><span class="dd">9.16 수</span><span class="dt">장보기</span><span class="dv">31,000원</span></div>
    <div class="day"><span class="dd">9.14 월</span><span class="dt">치킨</span><span class="dv">24,000원</span></div>
    <div class="day"><span class="dd">9.12 토</span><span class="dt">장보기</span><span class="dv">52,300원</span></div>
    <div class="day"><span class="dd">9.09 수</span><span class="dt">장보기</span><span class="dv">18,900원</span></div>
  </div>
</div>`

// ㉰ 적는 시트 (숫자판)
const 시트 = `
${머리('식비')}
<div class="pad dim">
  <div class="big"><div class="big-k">이번 달 식비</div><div class="big-v">${돈(317400)}<em>원</em></div></div>
</div>
<div class="sheet">
  <div class="grab"></div>
  <div class="sh-h">오늘 쓴 식비</div>
  <div class="money-row"><button class="seg on">장보기</button><button class="seg">외식·배달</button></div>
  <div class="sh-in">31,000<b>원</b></div>
  <div class="sh-d">9월 16일 수요일 <span class="chg">바꾸기</span></div>
  <div class="keys">
    ${['1','2','3','4','5','6','7','8','9','000','0','지움'].map((k) => `<div class="key${k === '지움' ? ' bk' : ''}">${k}</div>`).join('')}
  </div>
  <div class="save">적었어요</div>
</div>`

const 판 = (속) => `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<link rel="stylesheet" href="/assets/${CSS}">
<style>
  html,body{margin:0;background:var(--bg);color:var(--text);font-family:'Pretendard Variable',Pretendard,-apple-system,sans-serif}
  .tb{height:52px;display:flex;align-items:center;padding:0 18px;font-weight:700;font-size:18px;border-bottom:1px solid var(--line)}
  .pad{padding:16px 18px 24px}
  .sec{font-weight:700;font-size:15px;margin:18px 0 8px;color:var(--text)}
  .card{background:var(--surface);border:1px solid var(--line);border-radius:16px;overflow:hidden}
  .li{display:flex;align-items:center;gap:10px;padding:13px 15px;border-bottom:1px solid var(--line);font-size:15px}
  .li:last-child{border-bottom:0}
  .ck{width:21px;height:21px;border-radius:7px;border:1.6px solid var(--sand);display:inline-flex;align-items:center;justify-content:center;font-size:12px;color:#fff;font-style:normal;flex:none}
  .ck.on{background:var(--brown);border-color:var(--brown)}
  .li s{color:var(--text-sub)}

  .money{margin-top:22px;background:var(--surface);border:1.6px solid var(--brown);border-radius:18px;padding:16px 16px 14px}
  .money-h{font-weight:700;font-size:15px;margin-bottom:11px}
  .money-row{display:flex;gap:7px;margin-bottom:11px}
  .seg{flex:1;padding:9px 0;border-radius:11px;border:1px solid var(--line);background:var(--cream);color:var(--text-sub);font-size:14px;font-weight:600;font-family:inherit}
  .seg.on{background:var(--brown);border-color:var(--brown);color:#fff}
  .money-in{display:flex;align-items:baseline;justify-content:space-between;background:var(--cream);border-radius:12px;padding:14px 15px}
  .money-in .ph{color:var(--text-sub);font-size:17px}
  .money-in b{font-size:15px;color:var(--text-sub)}
  .money-hint{margin-top:9px;font-size:12.5px;color:var(--text-sub);text-align:center}

  .big{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:19px;text-align:center}
  .big-k{font-size:13.5px;color:var(--text-sub)}
  .big-v{font-size:35px;font-weight:800;margin-top:4px;letter-spacing:-.6px}
  .big-v em{font-size:18px;font-style:normal;font-weight:700;margin-left:2px}
  .big-sub{margin-top:6px;font-size:13px;color:var(--text-sub)}
  .big-sub .down{color:var(--tease-ic)}

  .two{display:flex;gap:10px;margin-top:11px}
  .half{flex:1;background:var(--surface);border:1px solid var(--line);border-radius:15px;padding:14px;text-align:center}
  .hk{font-size:12.5px;color:var(--text-sub)}
  .hv{font-size:19px;font-weight:700;margin-top:3px}
  .hv em{font-size:12.5px;font-style:normal;margin-left:1px}
  .hs{font-size:12px;color:var(--text-sub);margin-top:2px}

  .hero{margin-top:12px;background:var(--today-grad);border-radius:18px;padding:19px;text-align:center}
  .hero-k{font-size:13.5px;color:var(--text-sub)}
  .hero-v{font-size:40px;font-weight:800;color:var(--brown);letter-spacing:-1px;line-height:1.1;margin-top:2px}
  .hero-v em{font-size:19px;font-style:normal;font-weight:700}
  .hero-s{margin-top:7px;font-size:13px;color:var(--text-sub)}
  .hero-s b{color:var(--text)}

  .day{display:flex;align-items:center;padding:13px 15px;border-bottom:1px solid var(--line);font-size:14.5px}
  .day:last-child{border-bottom:0}
  .dd{width:62px;color:var(--text-sub);font-size:13px}
  .dt{flex:1}
  .dv{font-weight:700}

  .dim{filter:blur(1.5px);opacity:.45}
  .sheet{position:fixed;left:0;right:0;bottom:0;background:var(--surface);border-radius:22px 22px 0 0;padding:10px 18px 22px;box-shadow:0 -8px 34px rgba(0,0,0,.14)}
  .grab{width:38px;height:4px;border-radius:2px;background:var(--line);margin:0 auto 13px}
  .sh-h{font-weight:700;font-size:16px;margin-bottom:11px}
  .sh-in{background:var(--cream);border-radius:13px;padding:16px;text-align:right;font-size:29px;font-weight:800;letter-spacing:-.5px}
  .sh-in b{font-size:16px;font-weight:700;color:var(--text-sub);margin-left:3px}
  .sh-d{margin-top:9px;font-size:13px;color:var(--text-sub);text-align:center}
  .sh-d .chg{color:var(--brown);font-weight:600;margin-left:4px}
  .keys{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}
  .key{padding:15px 0;text-align:center;font-size:21px;font-weight:600;background:var(--cream);border-radius:13px}
  .key.bk{color:var(--text-sub);font-size:16px}
  .save{margin-top:13px;background:var(--brown);color:#fff;text-align:center;padding:15px;border-radius:14px;font-weight:700;font-size:16px}
</style></head><body>${속}</body></html>`

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
for (const [이름, 속] of [['1-장보기에서적기', 장보기], ['2-식비자리', 식비], ['3-숫자판', 시트]]) {
  몸 = 판(속)
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
  await p.goto('http://127.0.0.1:4419/', { waitUntil: 'networkidle' })
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400)
  await p.screenshot({ path: join(OUT, `${이름}.png`), fullPage: true })
  await p.close()
  console.log('✅', 이름)
}
await b.close(); srv.close()
console.log('📁', OUT)
