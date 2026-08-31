// 📸 임시보관함 안내 상자 «자리·크기» 시안 넷 — 창업자 판정용 (2026-08-31)
//
// 🐛 창업자 제보(폰 캡처): *"레시피를 너무가리고 박스크기도 크고 길게 떠있어"*
//    안내 상자가 초안 두 줄(계란·공심채)을 덮고 있었다.
//
// ⛔ 자리는 내가 못 정한다 — `styles.css` 에 **2026-08-29 창업자 제보로 아래→위로 옮긴 이유 셋**과
//    **가운데는 「결과를 덮는다」고 일부러 피했다**는 기록이 있다. 되돌리면 그때 제보가 되살아난다.
//    👉 그래서 넷을 «찍어서» 창업자가 눈으로 고르게 한다.
//
// ⭐ 창업자 화면을 그대로 재현한다 — `hankki:founder` 를 켜야 모델 이름 전체(44자)가 붙는다.
//    (일반 유저는 「· AI가 정리했어요」만 본다 — 그것도 한 장 같이 찍는다)
//
// 🏷 이름표 = 시안 뽑기
// 🧬 본뜬 곳 = _shot-보관함정리-0828.mjs (정적 서버·초안 심기 그대로)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = process.env.SHOT_OUT || '/tmp/shot-토스트'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4457,r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded','1'); localStorage.setItem('hankki:founder','1') } catch {} })

// ── 창업자 폰과 «같은» 초안을 심는다 (계란·공심채 「17시간 전」이 보이게)
const p0 = await ctx.newPage()
await p0.goto('http://127.0.0.1:4457/hankki/', { waitUntil:'networkidle' }); await p0.waitForTimeout(1200)
await p0.evaluate(() => {
  const 그리기 = (w,h,글) => { const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d')
    x.fillStyle='#101014';x.fillRect(0,0,w,h);x.fillStyle='#1c1c22';x.fillRect(16,80,w-32,h-160)
    x.fillStyle='#e8e8ee';x.font='bold '+Math.round(w/22)+'px sans-serif'
    for(let k=0;k<20;k++) x.fillText(글, 30, 130+k*Math.round(h/24)); return c.toDataURL('image/jpeg',0.9) }
  const 판 = [
    ['계란말이 김밥', 0.4],
    ['공심채 볶음', 17],
    ['들기름 막국수', 21],
    ['오이 무침', 30],
    ['된장 찌개', 44],
  ]
  const s = JSON.parse(localStorage.getItem('hankki:v1')||'{}')
  const 이제 = Date.now()
  s.recipes = [
    ...판.map(([t,시],i)=>({ id:'ts-'+i, title:t, status:'unsorted', source:'photo',
      image: 그리기(540,1170,'깨끗이 씻은 재료를 준비한다'), savedAt: 이제-Math.round(시*3600*1000),
      ingredients:[], steps:[], favorite:false, cooked:0 })),
    ...(s.recipes||[]),
  ]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
})
await p0.close()

// ── 문구 두 가지
const 긴문구 = 'AI가 레시피를 더 다듬었어요 · AI가 정리했어요(@cf/meta/llama-3.3-70b-instruct-fp8-fast)'
const 짧은문구 = 'AI가 레시피를 더 다듬었어요 · AI가 정리했어요(llama3.3)'
const 유저문구 = 'AI가 레시피를 더 다듬었어요 · AI가 정리했어요'

// 🔢 뜰 시간 — 지금 값 vs 고칠 값 (App.jsx:305)
const 지금ms = (m) => Math.min(8000, 2600 + m.length * 90)
const 새ms   = (m) => Math.min(4800, 2200 + m.length * 70)

// ── 상자 줄이기 (셋 다 공통) — z-index·toastIn 은 손대지 않는다
// 🔢🔢 [2026-08-31 실측] 지금 상자는 **화면 폭의 절반(195px)밖에 못 쓴다** —
//    `left:50%` 로 가운데를 잡는데 `right` 가 없어서 쓸 수 있는 폭이 50% 로 잘리고,
//    `max-width:88%` 는 그보다 크니까 **아예 일을 안 한다.** 그래서 70자가 6줄로 접혔다.
//    ⭐ `width:max-content` 로 «글자만큼» 잡고 `max-width` 로만 묶는다. 이게 「상자가 크다」의 진짜 뿌리다.
const 작게 = 'font-size:15px;padding:9px 14px;width:max-content;max-width:92vw;line-height:1.4;'
// 폭만 고치고 나머지는 지금 그대로 — 「폭 하나로 얼마나 주나」를 보여주는 판
const 폭만 = 'width:max-content;max-width:92vw;'

const 판들 = [
  { 이름:'0-지금',          문구:긴문구,   css:'' },
  { 이름:'1-폭만고침',       문구:긴문구,   css:폭만 },
  { 이름:'A-상단바에붙임',   문구:짧은문구, css:작게+'top:__DOCK__px;border-radius:0 0 18px 18px;' },
  { 이름:'B-자리그대로',     문구:짧은문구, css:작게 },
  { 이름:'C-아래로',        문구:짧은문구, css:작게+'top:auto;bottom:calc(var(--nav-h) + var(--safe-bottom, 0px) + 24px);' },
  { 이름:'D-일반유저-B자리', 문구:유저문구, css:작게 },
]

const 잰것 = []
for (const 판 of 판들) {
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4457/hankki/', { waitUntil:'networkidle' }); await p.waitForTimeout(4000)
  await p.getByRole('button',{name:/임시보관함/}).first().click(); await p.waitForTimeout(900)

  // 상단바가 «실제로» 어디서 끝나는지 재서 A 시안의 자리로 쓴다 (값을 손으로 넣지 않는다)
  const 상단바끝 = await p.evaluate(() => {
    const el = document.querySelector('.topbar-back') || document.querySelector('.topbar')
    return el ? Math.round(el.getBoundingClientRect().bottom) : 56
  })

  const 결과 = await p.evaluate(({ 문구, css, 상단바끝 }) => {
    const st = document.createElement('style')
    st.textContent = css ? `.toast{${css.replace('__DOCK__', String(상단바끝))}}` : ''
    document.head.appendChild(st)
    const d = document.createElement('div')
    d.className = 'toast'; d.textContent = 문구
    document.body.appendChild(d)
    const r = d.getBoundingClientRect()
    // ⛔ grep 이 아니라 «화면에 그려진 글자»를 잰다 (규칙 18ⓘ)
    const 글자 = d.innerText
    const 줄높이 = parseFloat(getComputedStyle(d).lineHeight) || 24
    const 안쪽 = parseFloat(getComputedStyle(d).paddingTop) * 2
    const 줄수 = Math.max(1, Math.round((r.height - 안쪽) / 줄높이))
    // 이 상자에 «가려진» 초안 줄이 몇 개인가
    const 가림 = [...document.querySelectorAll('.inbox-row')].filter(x => {
      const q = x.getBoundingClientRect()
      return q.bottom > r.top && q.top < r.bottom
    }).map(x => (x.innerText || '').split('\n')[0].slice(0, 14))
    return { 글자, 글자수: 글자.length, 높이: Math.round(r.height), 폭: Math.round(r.width), 줄수, 위: Math.round(r.top), 가림 }
  }, { 문구: 판.문구, css: 판.css, 상단바끝 })

  await p.waitForTimeout(200)
  await p.screenshot({ path: join(OUT, 판.이름 + '.png') })
  const ms = /^[01]-/.test(판.이름) ? 지금ms(판.문구) : 새ms(판.문구)
  잰것.push({ ...판.이름 && { 판: 판.이름 }, ...결과, 초: (ms/1000).toFixed(1) })
  await p.close()
}

console.log('\n📸 ' + OUT + ' 에 ' + 판들.length + '장\n')
for (const r of 잰것) {
  console.log(`── ${r.판}`)
  console.log(`   글자 ${r.글자수}자 · ${r.줄수}줄 · 상자 ${r.폭}×${r.높이}px · 위에서 ${r.위}px · ${r.초}초`)
  console.log(`   가린 초안 ${r.가림.length}줄 ${r.가림.length ? '→ ' + r.가림.join(' / ') : '✅ 없음'}`)
}
console.log('\n⛔ 절대원칙 21 — 이 숫자만 보고 보내지 말 것. PNG 를 «열어서» 본다.')

await b.close(); srv.close()
