// 💰💰 식비 기록 시안 v2 — 평점 4.9 가계부 9장을 «우리 꼴»로 (2026-09-17)
//   📮 창업자 = *"평 4.9가계부인데 응용하면 우리 잘쓸것같아"* → *"내가 보낸 사진들 분석하고 우리앱에 맞는 설계 해봐"*
//   🔒 설계 관문 통과 2026-09-17 21:2x (1차 빈 예산 화면·메모 선택 / 2차 예산 0원·나무라는 말 / 3차 39B×2×365)
//   ⛔ 앱 소스를 «안» 고친다 — 순수 HTML 에 빌드된 앱 CSS 만 빌려 쓴다(절대원칙 21·30). 0916 판과 같은 틀.
//   가져온 것 = ①계산기 0·00·000 ②예산 막대(지난달·4주 평균을 «먼저» 보여주고 칸) ③갈래 비율 막대 ④4주 추이 ⑤챌린지 → 「집밥 연속」
//   안 가져온 것 = 수입·이체·결제수단·자산·소분류·자물쇠(유료)·선그래프 — 식비만이라 필요 없다
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, readdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = process.env.OUT || (process.env.CLAUDE_SCRATCHPAD_DIR || '/tmp/claude-0') + '/식비시안v2'
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
await new Promise((r) => srv.listen(4421, r))
const 돈 = (n) => n.toLocaleString('ko-KR')
const 머리 = (제목) => `<div class="tb"><span>${제목}</span></div>`

// ① 장보기 탭 맨 위 — 「이번 주 식비」 한 줄 (가계부의 「저번 주 지출 · 4주 평균」을 여기로)
const 장보기 = `
${머리('장보기')}
<div class="pad">
  <div class="strip">
    <div><div class="st-k">이번 주 식비</div><div class="st-v">${돈(83400)}<em>원</em></div></div>
    <div class="st-r"><div class="st-k">지난주</div><div class="st-s">${돈(96200)}원</div><div class="st-k">4주 평균</div><div class="st-s">${돈(91800)}원</div></div>
    <div class="st-go">›</div>
  </div>
  <div class="sec">장보기 리스트</div>
  <div class="card">
    <div class="li"><i class="ck on">✓</i><s>두부 1모</s></div>
    <div class="li"><i class="ck on">✓</i><s>대파</s></div>
    <div class="li"><i class="ck"></i><span>참치캔 150g</span></div>
    <div class="li"><i class="ck"></i><span>청양고추</span></div>
  </div>
  <div class="money">
    <div class="money-h">오늘 쓴 식비</div>
    <div class="money-row"><button class="seg on">장보기</button><button class="seg">외식·배달</button></div>
    <div class="money-in"><span class="ph">영수증 총액</span><b>원</b></div>
    <div class="money-hint">총액 하나만 적으면 돼요 · 어제 것도 돼요</div>
  </div>
</div>`

// ② 적는 시트 v2 — 가계부 계산기에서 «0·00·000»과 «메모 한 줄»만 가져왔다(수입·이체·결제수단 ✗)
const 시트 = `
${머리('식비')}
<div class="pad dim"><div class="big"><div class="big-k">이번 달 식비</div><div class="big-v">${돈(317400)}<em>원</em></div></div></div>
<div class="sheet">
  <div class="grab"></div>
  <div class="money-row"><button class="seg on">장보기</button><button class="seg">외식·배달</button></div>
  <div class="sh-in">31,000<b>원</b></div>
  <div class="sh-memo"><span class="ph">어디서? (안 적어도 돼요)</span></div>
  <div class="sh-d">9월 16일 수요일 <span class="chg">바꾸기</span></div>
  <div class="keys4">
    ${['1','2','3','⌫','4','5','6','00','7','8','9','000','','0','','지움'].map((k) => k === '' ? '<div class="key none"></div>' : `<div class="key${/^(⌫|지움)$/.test(k) ? ' bk' : ''}${/^0{2,3}$/.test(k) ? ' zz' : ''}">${k}</div>`).join('')}
  </div>
  <div class="save">적었어요</div>
</div>`

// ③ 식비 자리 v2 — 예산 막대(세웠을 때만) · 장보기/외식 비율 · 4주 막대 · 집밥 한 끼(4주 평균) · 집밥 연속
const 식비 = `
${머리('식비')}
<div class="pad">
  <div class="big">
    <div class="big-k">9월 식비 · 예산 ${돈(400000)}원</div>
    <div class="big-v">${돈(317400)}<em>원</em></div>
    <div class="bar"><i style="width:79%"></i></div>
    <div class="bar-s"><span>${돈(82600)}원 남았어요</span><span>14일 남음</span></div>
  </div>
  <div class="ratio">
    <div class="ratio-bar"><i class="a" style="width:59%"></i><i class="b" style="width:41%"></i></div>
    <div class="ratio-s"><span><b class="da"></b>장보기 ${돈(186400)}원 · 9번</span><span><b class="db"></b>외식·배달 ${돈(131000)}원 · 6번</span></div>
  </div>
  <div class="hero">
    <div class="hero-k">집밥 한 끼에 <small>(최근 4주)</small></div>
    <div class="hero-v">${돈(2400)}<em>원</em></div>
    <div class="hero-s">집밥 <b>14번</b> · 장 본 게 다음 주까지 가면 값이 달라져요</div>
  </div>
  <div class="two">
    <div class="half"><div class="hk">집밥 연속</div><div class="hv">5<em>일째</em></div><div class="hs">제일 길었던 건 9일</div></div>
    <div class="half"><div class="hk">4주 흐름</div><div class="wk">${[72,96,84,83].map((h,i)=>`<b style="height:${h*0.5}px"${i===3?' class="now"':''}></b>`).join('')}</div><div class="hs">주마다 얼마 썼나</div></div>
  </div>
  <div class="sec">9월</div>
  <div class="card">
    <div class="day"><span class="dd">9.16 수</span><span class="dt">장보기 <small>한살림</small></span><span class="dv">31,000원</span></div>
    <div class="day"><span class="dd">9.14 월</span><span class="dt">외식·배달 <small>치킨</small></span><span class="dv">24,000원</span></div>
    <div class="day"><span class="dd">9.12 토</span><span class="dt">장보기</span><span class="dv">52,300원</span></div>
    <div class="day"><span class="dd">9.09 수</span><span class="dt">장보기 <small>쿠팡</small></span><span class="dv">18,900원</span></div>
  </div>
</div>`

// ④ 예산 세우기 — 가계부 「한 달 예산을 세워볼까요?」 꼴. ⭐빈 칸만 던지지 않고 «지난달·4주 평균»을 먼저 보여준다
const 예산 = `
${머리('식비')}
<div class="pad">
  <div class="ask">
    <div class="ask-h">이번 달 식비, 얼마 안에 쓸까요?</div>
    <div class="ask-s">안 세워도 돼요 · 세우면 남은 돈이 보여요</div>
    <div class="ask-in">400,000<b>원</b></div>
    <div class="ref">
      <div class="ref-r"><span>8월에 쓴 식비</span><b>${돈(412300)}원</b></div>
      <div class="ref-r"><span>최근 4주 평균</span><b>${돈(367200)}원</b></div>
    </div>
    <div class="keys4">
      ${['1','2','3','⌫','4','5','6','00','7','8','9','000','','0','','지움'].map((k) => k === '' ? '<div class="key none"></div>' : `<div class="key${/^(⌫|지움)$/.test(k) ? ' bk' : ''}${/^0{2,3}$/.test(k) ? ' zz' : ''}">${k}</div>`).join('')}
    </div>
    <div class="save">이걸로 할게요</div>
  </div>
</div>`

const 판 = (속) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/${CSS}"><style>
  html,body{margin:0;background:var(--bg);color:var(--text);font-family:'Pretendard Variable',Pretendard,-apple-system,sans-serif}
  .tb{height:52px;display:flex;align-items:center;padding:0 18px;font-weight:700;font-size:18px;border-bottom:1px solid var(--line)}
  .pad{padding:16px 18px 24px} .sec{font-weight:700;font-size:15px;margin:18px 0 8px}
  .card{background:var(--surface);border:1px solid var(--line);border-radius:16px;overflow:hidden}
  .li{display:flex;align-items:center;gap:10px;padding:13px 15px;border-bottom:1px solid var(--line);font-size:15px}.li:last-child{border-bottom:0}
  .ck{width:21px;height:21px;border-radius:7px;border:1.6px solid var(--sand);display:inline-flex;align-items:center;justify-content:center;font-size:12px;color:#fff;font-style:normal;flex:none}.ck.on{background:var(--brown);border-color:var(--brown)}.li s{color:var(--text-sub)}
  .strip{display:flex;align-items:center;gap:14px;background:var(--today-grad);border-radius:16px;padding:13px 15px}
  .st-k{font-size:12px;color:var(--text-sub)} .st-v{font-size:24px;font-weight:800;color:var(--brown);letter-spacing:-.5px}.st-v em{font-size:14px;font-style:normal;font-weight:700}
  .st-r{margin-left:auto;text-align:right;line-height:1.25} .st-s{font-size:13px;font-weight:700;margin-bottom:3px} .st-go{font-size:22px;color:var(--text-sub)}
  .money{margin-top:22px;background:var(--surface);border:1.6px solid var(--brown);border-radius:18px;padding:16px 16px 14px}
  .money-h{font-weight:700;font-size:15px;margin-bottom:11px}.money-row{display:flex;gap:7px;margin-bottom:11px}
  .seg{flex:1;padding:9px 0;border-radius:11px;border:1px solid var(--line);background:var(--cream);color:var(--text-sub);font-size:14px;font-weight:600;font-family:inherit}.seg.on{background:var(--brown);border-color:var(--brown);color:#fff}
  .money-in{display:flex;align-items:baseline;justify-content:space-between;background:var(--cream);border-radius:12px;padding:14px 15px}.money-in .ph{color:var(--text-sub);font-size:17px}.money-in b{font-size:15px;color:var(--text-sub)}
  .money-hint{margin-top:9px;font-size:12.5px;color:var(--text-sub);text-align:center}
  .big{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:19px;text-align:center}
  .big-k{font-size:13.5px;color:var(--text-sub)} .big-v{font-size:35px;font-weight:800;margin-top:4px;letter-spacing:-.6px}.big-v em{font-size:18px;font-style:normal;font-weight:700;margin-left:2px}
  .bar{height:10px;border-radius:5px;background:var(--cream);margin-top:12px;overflow:hidden}.bar i{display:block;height:100%;background:var(--brown);border-radius:5px}
  .bar-s{display:flex;justify-content:space-between;margin-top:7px;font-size:12.5px;color:var(--text-sub)}
  .ratio{margin-top:11px;background:var(--surface);border:1px solid var(--line);border-radius:15px;padding:13px 15px}
  .ratio-bar{display:flex;height:12px;border-radius:6px;overflow:hidden;gap:2px}.ratio-bar .a{background:var(--brown)}.ratio-bar .b{background:var(--sand)}
  .ratio-s{display:flex;justify-content:space-between;font-size:12.5px;color:var(--text-sub);margin-top:8px}.da,.db{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:5px;vertical-align:-1px}.da{background:var(--brown)}.db{background:var(--sand)}
  .hero{margin-top:11px;background:var(--today-grad);border-radius:18px;padding:19px;text-align:center}.hero-k{font-size:13.5px;color:var(--text-sub)}.hero-k small{font-size:11.5px}
  .hero-v{font-size:40px;font-weight:800;color:var(--brown);letter-spacing:-1px;line-height:1.1;margin-top:2px}.hero-v em{font-size:19px;font-style:normal;font-weight:700}.hero-s{margin-top:7px;font-size:12.5px;color:var(--text-sub)}.hero-s b{color:var(--text)}
  .two{display:flex;gap:10px;margin-top:11px}.half{flex:1;background:var(--surface);border:1px solid var(--line);border-radius:15px;padding:14px;text-align:center}
  .hk{font-size:12.5px;color:var(--text-sub)}.hv{font-size:22px;font-weight:800;margin-top:3px}.hv em{font-size:12.5px;font-style:normal;margin-left:2px;font-weight:600}.hs{font-size:11.5px;color:var(--text-sub);margin-top:3px}
  .wk{display:flex;align-items:flex-end;justify-content:center;gap:7px;height:50px;margin-top:6px}.wk b{width:16px;background:var(--sand);border-radius:4px 4px 0 0}.wk b.now{background:var(--brown)}
  .day{display:flex;align-items:center;padding:13px 15px;border-bottom:1px solid var(--line);font-size:14.5px}.day:last-child{border-bottom:0}.dd{width:62px;color:var(--text-sub);font-size:13px}.dt{flex:1}.dt small{color:var(--text-sub);font-size:12px;margin-left:4px}.dv{font-weight:700}
  .dim{filter:blur(1.5px);opacity:.45}
  .sheet{position:fixed;left:0;right:0;bottom:0;background:var(--surface);border-radius:22px 22px 0 0;padding:10px 18px 22px;box-shadow:0 -8px 34px rgba(0,0,0,.14)}.grab{width:38px;height:4px;border-radius:2px;background:var(--line);margin:0 auto 13px}
  .sh-in{background:var(--cream);border-radius:13px;padding:16px;text-align:right;font-size:29px;font-weight:800;letter-spacing:-.5px}.sh-in b{font-size:16px;font-weight:700;color:var(--text-sub);margin-left:3px}
  .sh-memo{margin-top:8px;padding:11px 14px;border-radius:11px;border:1px dashed var(--line);font-size:14px}.sh-memo .ph{color:var(--text-sub)}
  .sh-d{margin-top:9px;font-size:13px;color:var(--text-sub);text-align:center}.sh-d .chg{color:var(--brown);font-weight:600;margin-left:4px}
  .keys4{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:13px}.key{padding:13px 0;text-align:center;font-size:20px;font-weight:600;background:var(--cream);border-radius:12px}.key.bk{color:var(--text-sub);font-size:15px}.key.zz{font-size:16px;color:var(--brown)}.key.none{background:transparent}
  .save{margin-top:13px;background:var(--brown);color:#fff;text-align:center;padding:15px;border-radius:14px;font-weight:700;font-size:16px}
  .ask{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:19px 16px}.ask-h{font-size:19px;font-weight:800}.ask-s{font-size:12.5px;color:var(--text-sub);margin-top:4px}
  .ask-in{margin-top:14px;background:var(--cream);border-radius:13px;padding:16px;text-align:right;font-size:29px;font-weight:800}.ask-in b{font-size:16px;color:var(--text-sub);margin-left:3px;font-weight:700}
  .ref{margin-top:10px;border:1px solid var(--line);border-radius:12px;padding:4px 14px}.ref-r{display:flex;justify-content:space-between;padding:9px 0;font-size:13.5px;color:var(--text-sub)}.ref-r+.ref-r{border-top:1px solid var(--line)}.ref-r b{color:var(--text)}
</style></head><body>${속}</body></html>`

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
for (const [이름, 속] of [['1-장보기위-이번주', 장보기], ['2-적는시트v2', 시트], ['3-식비자리v2', 식비], ['4-예산세우기', 예산]]) {
  몸 = 판(속)
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await p.goto('http://127.0.0.1:4421/', { waitUntil: 'networkidle' })
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400)
  await p.screenshot({ path: join(OUT, `${이름}.png`), fullPage: true })
  await p.close(); console.log('✅', 이름)
}
await b.close(); srv.close(); console.log('📁', OUT)
