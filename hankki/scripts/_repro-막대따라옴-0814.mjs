// 📜 「스크롤 할 때 회색 막대기가 살짝 부자연스럽게 따라온다」 — 몇 프레임 늦나를 «숫자로» 잰다
//    📮 테스터 2026-08-14 (창업자 전달) *"화면에서 스크롤 할때 회색 막대기? 같은게 살짝 부자연스럽게 따라와여"*
//
// ⭐ 「회색 막대기」 = 우리가 직접 그리는 스크롤 막대(`App.jsx` 의 `ScrollHint` · `data-vhint`).
//    안드로이드 크롬이 오버레이 막대를 «긁는 동안만» 보여줘서 v9.99~v10.0x 에 우리가 만든 것이다.
//    ⛔ 없애면 안 된다 — 창업자 2026-08-08 *"스크롤바가 처음부터 안보여서 글자체 저게다처럼보임"*
//
// 재는 것 = **화면을 굴린 «그 순간» 막대가 얼마나 어긋나 있나**(px).
//   0 프레임(같은 tick) · 1 프레임 · 2 프레임 · 그 뒤(150ms) 로 나눠 본다.
//   ⭐ 「몇 프레임 만에 맞나」가 곧 「얼마나 늦게 따라오나」다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST='/home/user/hankki/hankki/dist'
const M={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=M[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4457,r))
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')

// 화면을 굴리고, 프레임을 세어 가며 «막대가 있어야 할 자리»와 «실제 자리»의 차이를 잰다
const 잰다 = `(async () => {
  const raf = () => new Promise(r => requestAnimationFrame(() => r()))
  const list = document.querySelectorAll('.app-frame .screen')
  const el = list[list.length - 1]
  if (!el) return { 오류: '화면 없음' }
  const bar = () => document.querySelector('[data-vhint]')
  if (!bar()) return { 오류: '세로 막대가 안 그려졌다(안 넘치는 화면일 수 있다)' }
  const 있어야할자리 = () => {
    const r = el.getBoundingClientRect()
    const { scrollHeight: sh, clientHeight: ch, scrollTop: st } = el
    const h = Math.max(28, (ch / sh) * r.height)
    return r.top + (st / (sh - ch)) * (r.height - h)
  }
  const 어긋남 = () => {
    const b = bar(); if (!b) return null
    return Math.round(Math.abs(b.getBoundingClientRect().top - 있어야할자리()))
  }
  const 결과 = []
  // 여러 번 굴려 평균을 본다 (한 번은 우연일 수 있다)
  for (const 목표 of [400, 900, 1500, 2200]) {
    el.scrollTop = 목표
    const t0 = 어긋남()
    await raf(); const t1 = 어긋남()
    await raf(); const t2 = 어긋남()
    await new Promise(r => setTimeout(r, 150)); const t끝 = 어긋남()
    결과.push({ 굴린곳: 목표, 같은순간: t0, '1프레임뒤': t1, '2프레임뒤': t2, '150ms뒤': t끝 })
  }
  const cs = getComputedStyle(bar())
  return { 결과, 막대스타일: {
    top: bar().style.top,
    인라인transform: bar().style.transform || '(없음)',
    시계: cs.animationTimeline || '(없음)',
    애니: cs.animationName || '(없음)',
  } }
})()`

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport:{width:411,height:891}, deviceScaleFactor:2, timezoneId:'Asia/Seoul' })
await ctx.addInitScript(()=>{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');localStorage.setItem('hankki:giftSheetSeen','1')})
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const pg = await ctx.newPage()
await pg.goto('http://127.0.0.1:4457/hankki/',{waitUntil:'networkidle'}); await pg.waitForTimeout(900)
const a=pg.getByRole('button',{name:'나중에'}).first(); if(await a.count()&&await a.isVisible().catch(()=>false)) await a.click().catch(()=>{})
await pg.getByRole('button',{name:/^레시피/}).last().click(); await pg.waitForTimeout(1000)

const r = await pg.evaluate(잰다)
console.log('\n📜 세로 막대가 화면을 얼마나 늦게 따라오나 (px · 0 이면 딱 붙어 있다)\n')
if (r.오류) { console.log('  ⛔', r.오류) } else {
  for (const x of r.결과) console.log('  ', JSON.stringify(x))
  console.log('\n  막대를 옮기는 방식 :', JSON.stringify(r.막대스타일))
  // ⚠️⚠️ 판정 기준은 «1프레임 뒤»다 — 「같은 순간」이 아니다.
  //   `el.scrollTop = X` 로 JS 가 굴리면 브라우저는 `scroll` 이벤트를 **다음 프레임에** 쏜다.
  //   그러니 「같은 tick」에 맞을 «방법이 없다» — 그걸 기준으로 삼으면 고쳐도 영원히 빨간불이다.
  //   📌 규칙 18 ⓘ — 검사가 초록·빨강인 것보다 «무엇을 보는지»가 먼저다.
  //   ✅ 진짜 물음 = **스크롤 신호가 온 그 프레임에 막대가 따라붙나.**
  //      고치기 전 = 1프레임 뒤에도 63~110px 어긋남(리렌더를 한 겹 더 기다렸다) · 지금 = 0
  const 늦음 = r.결과.filter(x => x["1프레임뒤"] > 2).length
  console.log(늦음 ? `\n  ⛔ ${늦음}/${r.결과.length} 번은 «1프레임 뒤»에도 막대가 2px 넘게 어긋나 있다 — 이게 「따라온다」로 보인다`
                   : `\n  ✅ 스크롤 신호가 온 «그 프레임»에 막대가 붙는다 (막대를 옮기는 방식도 transform 이어야 한다)`)
  // ⭐ 옮기는 «방식»도 본다 — 둘 중 하나라야 한다:
  //   ⒜ 브라우저가 스크롤을 시계로 삼아 옮긴다(제일 좋다 · 컴포지터라 안 덜덜거린다)
  //   ⒝ 그게 안 되는 브라우저면 우리가 `transform` 으로 (⛔`top`/`left` 면 레이아웃이 다시 돈다)
  const 시계 = r.막대스타일.시계 && r.막대스타일.시계 !== "auto" && r.막대스타일.시계 !== "(없음)"
  const 트랜스폼 = /translate/.test(r.막대스타일.인라인transform)
  console.log(시계 ? "  ✅ 브라우저가 «스크롤을 시계로» 옮긴다 — 메인 스레드와 무관 (덜덜거림의 뿌리를 없앤다)"
            : 트랜스폼 ? "  ⚠️ 시계는 못 쓰고 `transform` 으로 옮긴다(폴백) — 이 브라우저에선 이게 최선이다"
            : "  ⛔ top/left 로 옮기고 있다 — 레이아웃·페인트가 다시 돈다")
}
await b.close(); srv.close()
