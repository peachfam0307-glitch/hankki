// 📏 「스크롤하면 회색 막대기가 덜덜거린다」 — 떨림을 «숫자로» 잰다 (창업자 2026-08-14)
//   ⭐ 재는 것 = 매 프레임 «막대가 있어야 할 자리»와 «실제 자리»의 차이. 그 차이가 «들쭉날쭉»한 게 덜덜이다.
//      · 평균만 보면 「늦음」이 보이고, **표준편차·최대**를 봐야 「떨림」이 보인다.
//   ⚠️ 진짜 손가락 스크롤(컴포지터)에 가깝게 `mouse.wheel` 로 굴린다 — `scrollTop=` 대입은 메인 스레드라 다르다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST='/home/user/hankki/hankki/dist'
const M={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=M[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4463,r))
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM})
const ctx=await b.newContext({viewport:{width:411,height:891},deviceScaleFactor:2,timezoneId:'Asia/Seoul'})
await ctx.addInitScript(()=>{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1');localStorage.setItem('hankki:nudge:giftpack','1');localStorage.setItem('hankki:giftSheetSeen','1')})
await ctx.addInitScript({content:SEED_COACH_SEEN})
const pg=await ctx.newPage()
await pg.goto('http://127.0.0.1:4463/hankki/',{waitUntil:'networkidle'});await pg.waitForTimeout(900)
const a=pg.getByRole('button',{name:'나중에'}).first(); if(await a.count()&&await a.isVisible().catch(()=>false)) await a.click().catch(()=>{})
await pg.getByRole('button',{name:/^레시피/}).last().click();await pg.waitForTimeout(1200)

// 매 프레임 표본을 모으는 감시자를 앱 안에 심는다
await pg.evaluate(`(() => {
  window.__표본 = []
  const list = document.querySelectorAll('.app-frame .screen')
  const el = list[list.length - 1]
  window.__화면 = el
  const 돌기 = () => {
    const bar = document.querySelector('[data-vhint]')
    if (bar) {
      const r = el.getBoundingClientRect()
      const { scrollHeight: sh, clientHeight: ch, scrollTop: st } = el
      const h = Math.max(28, (ch / sh) * r.height)
      const 있어야 = r.top + (st / (sh - ch)) * (r.height - h)
      window.__표본.push(Math.round((bar.getBoundingClientRect().top - 있어야) * 10) / 10)
    }
    window.__raf = requestAnimationFrame(돌기)
  }
  돌기()
})()`)

await pg.mouse.move(205, 500)
for (let i = 0; i < 26; i++) { await pg.mouse.wheel(0, 90); await pg.waitForTimeout(28) }
await pg.waitForTimeout(300)

const r = await pg.evaluate(`(() => {
  cancelAnimationFrame(window.__raf)
  const s = window.__표본.filter((x) => Number.isFinite(x))
  const 움직인것 = s.filter((x) => x !== 0)
  const n = s.length
  const 평균 = s.reduce((a, x) => a + x, 0) / n
  const 편차 = Math.sqrt(s.reduce((a, x) => a + (x - 평균) ** 2, 0) / n)
  // 프레임 사이 «튄 폭» — 이게 덜덜의 크기다
  let 튐최대 = 0, 튐합 = 0
  for (let i = 1; i < s.length; i++) { const d = Math.abs(s[i] - s[i - 1]); 튐최대 = Math.max(튐최대, d); 튐합 += d }
  return {
    잰프레임: n,
    어긋남평균: Math.round(평균 * 10) / 10,
    어긋남최대: Math.max(...s.map(Math.abs)),
    프레임사이튐_최대: Math.round(튐최대 * 10) / 10,
    프레임사이튐_평균: Math.round((튐합 / (n - 1)) * 100) / 100,
    딱맞은프레임: n - 움직인것.length,
  }
})()`)
console.log('\n📏 굴리는 «동안» 막대가 얼마나 흔들리나\n')
console.log(' ', JSON.stringify(r))
console.log(`
  ⭐ 「프레임사이튐」이 곧 덜덜이다 — 0 에 가까울수록 화면과 한 몸으로 움직인다.
  ⭐ 「딱맞은프레임 / 잰프레임」이 높을수록 좋다.`)
await b.close();srv.close()
