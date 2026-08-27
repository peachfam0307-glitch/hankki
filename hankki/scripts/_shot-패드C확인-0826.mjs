// ✅ 안 C 를 넣은 «뒤» — 네 기기 전부 재서 가로 폰이 안 깨졌는지 본다 (2026-08-26)
//
// ⛔⛔ 겨냥한 것 = **모든 기기에서 「이번 주」 두 상자는 «좌우 한 줄»**(창업자 확정 2026-08-26
//    = *"이번주제철, 우리집레시피는 한줄에"*). 폰 세로만 화면이 좁아 저절로 위아래가 된다.
//    ⛔ v11.41 에 잠깐 «패드를 위아래»로 했다가 창업자 = *"패드버전이 너무 다 길어.."* 로 물렸다.
//    2026-08-14 에 세로/가로를 잘못 읽어 네 판을 헛으로 낸 자리다(규칙 25).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/패드0826'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'};s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4394,r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// [이름, 폭, 높이, 바라는 배치]
const 기기들 = [
  ['폰세로  411×914',  411,  914, '좌우아님'],
  ['폰가로  891×411',  891,  411, '좌우'],
  ['패드세로 834×1194', 834, 1194, '좌우'],
  ['패드가로 1194×834',1194,  834, '좌우'],
]
// ＋ 창업자가 「높이를 비슷하게」라고 한 블록 셋도 같이 본다(83/114/114 → 118/168/168)
const 바라는높이 = { '패드세로': [118,168,168], '패드가로': [118,168,168] }
let 탈 = 0
for (const [이름, W, H, 바람] of 기기들) {
  const page = await b.newPage({ viewport:{width:W,height:H}, deviceScaleFactor:2 })
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1')}catch{}})
  await page.goto('http://127.0.0.1:4394/hankki/',{waitUntil:'networkidle'})
  await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(900)
  const v = await page.evaluate(()=>{
    const wp = document.querySelector('.week-pair')
    const c  = document.querySelector('.mini-card')
    const n  = c?.querySelector('.name')
    const cols = wp ? getComputedStyle(wp).gridTemplateColumns.split(' ').filter(Boolean).length : 0
    return { 칸수: cols, 좌우: cols >= 2,
             카드: c ? Math.round(c.getBoundingClientRect().width) : 0,
             글자: n ? getComputedStyle(n).fontSize : '?',
             넘침: Math.round(document.documentElement.scrollWidth - window.innerWidth) }
  })
  const 배치 = v.칸수 === 0 ? '없음' : (v.좌우 ? '좌우' : '위아래')
  const 맞나 = (바람 === '좌우아님') ? !v.좌우 : (배치 === 바람)
  if (!맞나 || v.넘침 > 1) 탈++
  console.log(`${맞나 && v.넘침<=1 ? '✅' : '⛔'} ${이름}  배치=${배치}(바람 ${바람}) · 카드 ${v.카드}px · 이름 ${v.글자} · 가로넘침 ${v.넘침}px`)
  await page.screenshot({ path: join(OUT, `C후-${이름.split(' ')[0]}.png`) })
  await page.close()
}
await b.close(); srv.close()
if (탈) { console.log(`\n⛔ ${탈}개 어긋났다`); process.exit(1) }
console.log('\n✅ 네 기기 전부 바라는 대로다')
