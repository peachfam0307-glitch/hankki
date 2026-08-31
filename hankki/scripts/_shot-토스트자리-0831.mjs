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
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1'); localStorage.setItem('hankki:founder','1') } catch {} })

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
    // ⬇ 여기부터는 «스크롤이 실제로 되게» 하려고 채운다 — 다섯 줄만 있으면 한 화면에 다 들어가
    //    「스크롤 내린 뒤」 판이 굴러가지도 않고 그냥 통과해 버린다(헛통과).
    ['배추 겉절이', 50], ['감자 조림', 55], ['미역국', 60],
    ['제육 볶음', 66], ['콩나물국', 72], ['호박전', 80], ['멸치 볶음', 90],
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

// ── ⛔⛔ **CSS 를 «심지» 않는다.** 8/31 오후엔 시안이라 `<style>` 을 끼워 넣었는데,
//    이제 띠가 진짜로 앱에 들어갔으니 **앱의 진짜 CSS·진짜 배치**를 그대로 재야 한다.
//    (심어서 재면 「고쳤다」가 아니라 「내가 심은 걸 봤다」가 된다 — 그게 거짓 통과다)
//    👉 하는 일 = `.app-frame` 에 `toast-on` 을 켜고 `.toast` 에 문구를 넣는 것뿐.
const 판들 = [
  { 이름:'가-띠-창업자',    문구:짧은문구 },
  { 이름:'가-스크롤내린뒤', 문구:짧은문구, 스크롤:420 },
  { 이름:'가-일반유저',     문구:유저문구 },
  { 이름:'가-짧은토스트',   문구:'링크를 담았어요' },
]

const 잰것 = []
for (const 판 of 판들) {
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4457/hankki/', { waitUntil:'networkidle' }); await p.waitForTimeout(4000)
  await p.getByRole('button',{name:/임시보관함/}).first().click(); await p.waitForTimeout(900)

  if (판.스크롤) {
    // ⛔ `.screen` 을 «첫 번째»로 잡으면 탭 화면을 굴린다 — 임시보관함은 «쌓인» 화면이라 맨 뒤다.
    //    (첫 판이 그래서 0px 만 굴러가고 그냥 통과했다)
    const 굴린만큼 = await p.evaluate((y) => {
      const 통 = [...document.querySelectorAll('.screen')].pop()
      통.scrollTo(0, y); return Math.round(통.scrollTop)
    }, 판.스크롤)
    await p.waitForTimeout(400)
    if (굴린만큼 < 100) { console.error(`⛔ 스크롤이 ${굴린만큼}px 밖에 안 됐다 — 이 판은 못 믿는다`); process.exitCode = 1 }
  }

  // 띠를 «앱이 켜는 방식 그대로» 켠다 — `.app-frame.toast-on` ＋ `.toast` 안의 글자
  const 결과 = await p.evaluate((문구) => {
    const frame = document.querySelector('.app-frame')
    const d = document.querySelector('.toast')
    if (!d) return { 없음: true }
    d.textContent = 문구
    frame.classList.add('toast-on')
    return new Promise((resolve) => setTimeout(() => {
      const r = d.getBoundingClientRect()
      // ⛔ grep 이 아니라 «화면에 그려진 글자»를 잰다 (규칙 18ⓘ)
      const 글자 = d.innerText
      const cs = getComputedStyle(d)
      const 줄높이 = parseFloat(cs.lineHeight) || 21
      const 안쪽 = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
      const 줄수 = Math.max(1, Math.round((r.height - 안쪽) / 줄높이))
      // ⛔⛔ **`getBoundingClientRect` 는 «스크롤 통이 잘라낸» 부분을 모른다.**
      //    2026-08-31: 목록을 420px 내린 판에서 「가림 2줄·상단바 420px 가림」이라고 «잘못» 울렸다.
      //    통 위로 올라간 줄은 사실 안 보이는데 좌표만 남아 있어서다. 그래서 통에 «잘라서» 잰다.
      const 통 = [...document.querySelectorAll('.screen')].pop()
      const 통칸 = 통.getBoundingClientRect()
      const 보이는가 = (q) => q.bottom > 통칸.top + 1 && q.top < 통칸.bottom - 1
      // 🎯 이 판의 «합격 조건» — 띠에 «실제로 보이면서» 걸친 초안 줄이 하나라도 있으면 실패다
      //    ⭐ 「보이나」로만 거르면 통 «가장자리에 걸친» 줄이 또 잘못 걸린다(반쯤 잘려 나간 줄).
      //       그래서 줄을 통에 «잘라서» 남는 부분만 띠와 견준다.
      const 가림 = [...document.querySelectorAll('.inbox-row')].filter(x => {
        const q = x.getBoundingClientRect()
        if (!보이는가(q)) return false
        const 보이는윗변 = Math.max(q.top, 통칸.top)
        const 보이는아랫변 = Math.min(q.bottom, 통칸.bottom)
        return 보이는아랫변 > r.top + 1 && 보이는윗변 < r.bottom - 1
      }).map(x => (x.innerText || '').split('\n')[0].slice(0, 14))
      // 🎯🎯 [2026-08-31 추가] **상단바가 살아 있나** — 「가린 초안 0줄」은 통과인데
      //    띠가 제목·뒤로 버튼을 덮고 있던 실물 버그를 숫자가 못 잡았다. 그래서 이걸 잰다.
      const bar = document.querySelector('.topbar-back') || document.querySelector('.topbar')
      const q = bar && bar.getBoundingClientRect()
      const 상단바 = !q ? '못 찾음'
        : !보이는가(q) ? '· 스크롤로 올라감(가림 아님)'
        : (q.top < r.bottom - 1 ? `⛔ 띠에 ${Math.round(r.bottom - q.top)}px 가림`
        : `✅ 무사 (띠 아래 ${Math.round(q.top - r.bottom)}px)`)
      resolve({ 글자, 글자수: 글자.length, 높이: Math.round(r.height), 폭: Math.round(r.width), 줄수, 위: Math.round(r.top), 가림, 상단바 })
    }, 500))
  }, 판.문구)

  await p.screenshot({ path: join(OUT, 판.이름 + '.png') })
  잰것.push({ 판: 판.이름, ...결과, 초: (새ms(판.문구)/1000).toFixed(1) })
  await p.close()
}

console.log('\n📸 ' + OUT + ' 에 ' + 판들.length + '장\n')
for (const r of 잰것) {
  console.log(`── ${r.판}`)
  console.log(`   글자 ${r.글자수}자 · ${r.줄수}줄 · 상자 ${r.폭}×${r.높이}px · 위에서 ${r.위}px · ${r.초}초`)
  console.log(`   가린 초안 ${r.가림.length}줄 ${r.가림.length ? '→ ' + r.가림.join(' / ') : '✅ 없음'}   ·   상단바 ${r.상단바}`)
}
console.log('\n⛔ 절대원칙 21 — 이 숫자만 보고 보내지 말 것. PNG 를 «열어서» 본다.')

await b.close(); srv.close()
