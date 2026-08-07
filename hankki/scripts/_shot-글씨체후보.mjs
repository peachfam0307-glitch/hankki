// 🔤 귀여운 글씨체 후보 판 — 창업자 *"귀여운글씨체 예쁜걸로 추가하자"* · *"더많았음좋겠어"* (2026-08-07)
//
// ⭐ **앱에서 보이는 «그대로»** 그린다 — `DecorLayer.jsx` 의 `TextDeco` 를 글자 하나 안 바꾸고 옮겼다.
//    글씨체만 다르고 색·살(굵기)·대비 테두리·자간 계산이 전부 같아야 «비교»가 된다.
//    ⛔ 그냥 큰 글씨로 늘어놓으면 판정이 틀어진다 — 우리 글자 스티커는 «흰 테두리 두른 색 글씨»다.
//
// ⛔ 「이름」으로 고르지 않는다(Cute Font 라고 귀엽다는 법이 없다) — **그려서 눈으로** 본다.
//    2026-08-01 「추섴」 사고와 같은 결 — 글자는 읽어야 하고, 글씨체는 봐야 한다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, basename } from 'node:path'

const SCRATCH = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const FONTDIR = join(SCRATCH, '폰트원본')
const OUT = join(SCRATCH, '글씨체후보')
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname

// 📁 후보 = 내려받은 원본 TTF 전부. ⛔ 손으로 목록을 적지 않는다(늘 낡는다)
const FILES = readdirSync(FONTDIR).filter((f) => f.endsWith('.ttf')).sort()

// 🏷 후보표 — 이름 · 어떤 톤인가 · 우리 것과 겹치나 · **앱에 넣으면 몇 KB 인가**
//   📌 KB = 실제로 `tools/font-subset.py` 로 잘라 «잰» 값이다(한글 벌 기준). ⛔눈대중 아님.
//   ⚠️ 「어울린다/안 어울린다」는 **내 눈**이다 — 판정은 창업자가 한다(규칙 11).
//      그래서 ❌ 도 판에서 «빼지 않고» 이유를 적어 같이 보여준다.
const NICE = {
  //  파일스템                     이름                 톤                        판정  겹치는 우리 것        KB
  'SingleDay-Regular':        ['Single Day', '아주 가는 손글씨', '○', '', 88],
  'CuteFont-Regular':         ['Cute Font', '동글동글 큰머리', '○', '', 126],
  'Dongle-Regular':           ['Dongle', '납작 말랑', '○', '', 211],
  'PoorStory-Regular':        ['Poor Story', '삐뚤 연필 · 아이 글씨', '○', '', 408],
  'YeonSung-Regular':         ['Yeon Sung', '둥근 복고', '○', '', 519],
  'KirangHaerang-Regular':    ['Kirang Haerang', '복고 붓글씨', '○', '', 818],
  'HiMelody-Regular':         ['Hi Melody', '가는 소녀 손글씨', '○', '', 854],
  'GamjaFlower-Regular':      ['Gamja Flower', '삐뚤 손글씨', '○', '', 882],
  'EastSeaDokdo-Regular':     ['East Sea Dokdo', '붓펜 손글씨', '△', '펜글씨와 계열이 같다', 261],
  'GasoekOne-Regular':        ['Gasoek One', '아주 굵은 제목', '△', '임팩트와 겹친다', 272],
  'NanumBrushScript-Regular': ['Nanum Brush Script', '붓글씨', '△', '펜글씨와 같은 나눔 손글씨', 577],
  'Hahmlet%5Bwght%5D':        ['Hahmlet', '명조(부리)', '△', '우리에 없는 계열이지만 안 귀엽다', 626],
  'Gugi-Regular':             ['Gugi', '각진 옛날 간판', '✕', '다꾸 톤이 아니다', 165],
  'Sunflower-Medium':         ['Sunflower', '깔끔 고딕', '✕', '또박체와 거의 같다', 110],
  // 지금 앱에 있는 것(견주는 자)
  'BlackHanSans-Regular': ['Black Han Sans', '지금 = 임팩트', '', '', 176],
  'DoHyeon-Regular': ['Do Hyeon', '지금 = 라운드', '', '', 190],
}
const MARK = { '○': ['#3f7a52', '추천'], '△': ['#96762f', '겹침'], '✕': ['#98564a', '안 맞음'] }

const srv = createServer((q, s) => {
  const p = decodeURIComponent(q.url.split('?')[0])
  try {
    if (p.startsWith('/font/')) {
      s.writeHead(200, { 'content-type': 'font/ttf' }); s.end(readFileSync(join(FONTDIR, p.slice(6)))); return
    }
    if (p.startsWith('/app/')) {
      s.writeHead(200, { 'content-type': 'font/woff2' }); s.end(readFileSync(join(ROOT, 'src/assets/fonts', p.slice(5)))); return
    }
    s.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); s.end(readFileSync(join(OUT, 'board.html')))
  } catch (e) { s.writeHead(404); s.end('') }
})
await new Promise((r) => srv.listen(4397, r))

// 🎨 우리 글자 스티커와 «똑같은» 계산 (DecorLayer.jsx TextDeco 에서 그대로)
const styleFor = ({ family, weight = 400, ls = '0em', fw = 1, fontPx, fat = 0.055, color = '#382d21', stroke = 'rgba(255,255,255,.68)' }) => {
  const fatPx = fontPx * fat * fw
  const outPx = Math.max(0.8, fontPx * 0.028)
  const sh = [`${outPx}px 0 0 ${stroke}`, `-${outPx}px 0 0 ${stroke}`, `0 ${outPx}px 0 ${stroke}`, `0 -${outPx}px 0 ${stroke}`,
    `${outPx * 0.7}px ${outPx * 0.7}px 0 ${stroke}`, `-${outPx * 0.7}px ${outPx * 0.7}px 0 ${stroke}`,
    `${outPx * 0.7}px -${outPx * 0.7}px 0 ${stroke}`, `-${outPx * 0.7}px -${outPx * 0.7}px 0 ${stroke}`,
    '0 1px 3px rgba(0,0,0,.35)'].join(',')
  return `font-family:${family};font-weight:${weight};font-size:${fontPx}px;`
    + `letter-spacing:calc(${ls} + ${(fat * 1.6).toFixed(3)}em);line-height:1.22;color:${color};`
    + `-webkit-text-stroke:${fatPx > 0.2 ? `${fatPx}px ${color}` : '0'};paint-order:stroke fill;text-shadow:${sh};white-space:pre;`
}

// 지금 앱에 있는 여섯 — 견주는 자다. ⛔없으면 「새 것이 더 낫다」를 말할 수 없다
//   ⚠️ 임팩트·라운드는 **아직 배포 브랜치에 woff2 가 없다**(구글 CDN 으로 받는다 ·
//      로컬화는 `hold/글자체-2026-08-07` 에서 창업자 판정 대기 중) → 여기선 원본 TTF 로 그린다.
//      📌 그래도 «보이는 글자 모양»은 같다 — 같은 글꼴이다.
const NOW = [
  { label: '귀염체', family: "'Gaegu'", weight: 700, fw: 0.85, app: ['gaegu-korean-400.woff2', 'gaegu-latin-400.woff2'] },
  { label: '펜글씨', family: "'Nanum Pen Script'", weight: 400, fw: 0.5, ls: '0.1em', app: ['nanumpen-korean-400.woff2', 'nanumpen-latin-400.woff2'] },
  { label: '통통체', family: "'Jua'", weight: 400, fw: 0.8, app: ['jua-korean-400.woff2', 'jua-latin-400.woff2'] },
  { label: '또박체', family: "'Gowun Dodum'", weight: 800, fw: 1, ls: '0.01em', app: ['gowun-dodum-korean-400.woff2', 'gowun-dodum-latin-400.woff2'] },
  { label: '임팩트', family: "'Black Han Sans'", weight: 400, fw: 0.45, ttf: ['BlackHanSans-Regular.ttf'] },
  { label: '라운드', family: "'Do Hyeon'", weight: 400, fw: 0.9, ttf: ['DoHyeon-Regular.ttf'] },
]

const SAMPLE1 = '오늘도 한 끼'
const SAMPLE2 = '맛있겠다  5분 컷  엄마표'

const face = (fam, url, fmt) => `@font-face{font-family:${fam};src:url('${url}') format('${fmt}');font-display:block}`

const rowsNow = NOW.map((f, i) => `
  <div class="row">
    <div class="tag"><b>${f.label}</b><span>지금 있는 것</span></div>
    <div class="paper">
      <div style="${styleFor({ family: f.family, weight: f.weight, ls: f.ls, fw: f.fw, fontPx: 40 })}">${SAMPLE1}</div>
      <div style="${styleFor({ family: f.family, weight: f.weight, ls: f.ls, fw: f.fw, fontPx: 21 })}">${SAMPLE2}</div>
    </div>
  </div>`).join('')

// ⭐ 표에 적은 «순서 그대로» 낸다 — 추천이 위, 겹치는 것·안 맞는 것이 아래.
//   ⛔ 파일 이름 순으로 늘어놓으면 창업자가 열넷을 다 견줘야 한다(규칙 8 — 고르는 일을 쉽게).
const ORDER = Object.keys(NICE)
const cands = FILES.map((f) => ({ file: f, stem: basename(f, '.ttf'), fam: `c${basename(f, '.ttf').replace(/[^A-Za-z0-9]/g, '')}` }))
  .filter((c) => !['BlackHanSans-Regular', 'DoHyeon-Regular'].includes(c.stem)) // 이미 앱에 있다
  .sort((a, b) => ORDER.indexOf(a.stem) - ORDER.indexOf(b.stem))

const rowOf = (c, i) => {
  const [name, note, mk = '', why = '', kb = 0] = NICE[c.stem] || [c.stem]
  const [col, word] = MARK[mk] || ['#8b8073', '']
  return `
  <div class="row">
    <div class="tag">
      <em style="background:${col}">${mk} ${word}</em>
      <b>${i + 1}. ${name}</b><span>${note}</span>
    </div>
    <div class="paper">
      <div style="${styleFor({ family: `'${c.fam}'`, fontPx: 40 })}">${SAMPLE1}</div>
      <div style="${styleFor({ family: `'${c.fam}'`, fontPx: 21 })}">${SAMPLE2}</div>
    </div>
    <div class="foot">${kb}KB${why ? ` · ${why}` : ''}</div>
  </div>`
}
// 📱 **한 장에 다 넣지 않는다** — 폰에서 세로로 긴 그림은 폭에 맞춰 줄어들어 «글씨체가 안 보인다».
//    판정판인데 판정할 것이 안 보이면 소용이 없다 → 추천 / 나머지 로 가른다.
const PICK = cands.filter((c) => (NICE[c.stem] || [])[2] === '○')
const REST = cands.filter((c) => (NICE[c.stem] || [])[2] !== '○')
const rowsPick = PICK.map(rowOf).join('')
const rowsRest = REST.map((c, i) => rowOf(c, i + PICK.length)).join('')

const faces = [
  ...NOW.flatMap((f) => [
    ...(f.app || []).map((fl) => face(f.family, `/app/${fl}`, 'woff2')),
    ...(f.ttf || []).map((fl) => face(f.family, `/font/${encodeURIComponent(fl)}`, 'truetype')),
  ]),
  ...cands.map((c) => face(`'${c.fam}'`, `/font/${encodeURIComponent(c.file)}`, 'truetype')),
].join('\n')

const html = (which) => `<!doctype html><meta charset="utf-8"><style>
${faces}
*{box-sizing:border-box;margin:0}
body{width:360px;background:#eae7e0;font-family:'Pretendard',system-ui,sans-serif;padding:12px 12px 18px}
h2{font-size:15px;font-weight:800;color:#4a4034;margin:4px 0 10px;letter-spacing:-.01em}
h2 small{display:block;font-size:11.5px;font-weight:600;color:#8b8073;margin-top:3px;letter-spacing:0}
.row{margin-bottom:12px}
.tag{display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin:0 2px 4px}
.tag b{font-size:12.5px;font-weight:800;color:#4a4034}
.tag span{font-size:11px;color:#8b8073}
.tag em{font-style:normal;font-size:10px;font-weight:800;color:#fff;padding:2px 6px;border-radius:99px;letter-spacing:.01em}
.paper{background:#faf7f1;border-radius:12px;padding:13px 12px 15px;display:flex;flex-direction:column;
  align-items:center;gap:7px;box-shadow:0 1px 5px rgba(70,60,45,.10)}
.foot{font-size:10.5px;color:#8b8073;margin:3px 3px 0}
.legend{background:#f3f0e9;border-radius:10px;padding:9px 11px;font-size:11px;color:#6e6558;line-height:1.65;margin-bottom:12px}
.legend b{color:#4a4034}
</style>
<h2>${({ now: '지금 앱에 있는 6개', pick: `새 후보 ① 추천 ${PICK.length}개`, rest: `새 후보 ② 나머지 ${REST.length}개` })[which]}
<small>${({
  now: '견주는 자 — 새 것이 이걸 넘어야 넣는다',
  pick: '우리에 없는 톤 · 전부 OFL 1.1 (상업 이용·앱 내장 가능)',
  rest: '지금 것과 겹치거나 다꾸 톤이 아닌 것 — 그래도 판정은 네 거라 다 보여줘',
})[which]}</small></h2>
${which === 'now' ? '' : `<div class="legend">
<b>○ 추천</b> = 우리에 없는 톤이고 귀엽다 &nbsp;·&nbsp; <b>△ 겹침</b> = 지금 것과 비슷하다 &nbsp;·&nbsp; <b>✕</b> = 다꾸 톤이 아니다<br>
<b>KB</b> = 앱에 넣으면 그만큼 늘어난다. <b>쓸 때만 받는다</b> — 안 고른 글씨체는 안 내려받는다.<br>
⭐ 번호만 골라 줘. 몇 개든 돼. <b>✕ 도 네가 좋으면 넣는다</b> — 판정은 네 거야.
</div>`}
${({ now: rowsNow, pick: rowsPick, rest: rowsRest })[which]}`

writeFileSync(join(OUT, 'board.html'), html('now'))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await (await b.newContext({ viewport: { width: 360, height: 900 }, deviceScaleFactor: 2 })).newPage()

const NAMES = { now: '0-지금있는6개', pick: '1-추천8개', rest: '2-겹치거나안맞는6개' }
for (const which of ['now', 'pick', 'rest']) {
  writeFileSync(join(OUT, 'board.html'), html(which))
  await page.goto('http://127.0.0.1:4397/board.html', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1200)
  await page.screenshot({ path: join(OUT, `${NAMES[which]}.png`), fullPage: true })
  console.log('  📸', NAMES[which])
}

// 🔬 «진짜 떴나» — `document.fonts.check()` 는 파일이 없어도 true 를 준다(2026-08-07에 당했다).
//    ⭐ 그래서 **글자 폭**을 잰다: 대체 글꼴과 폭이 같으면 «안 뜬 것».
// ⛔⛔ **어느 판에서 재는지가 중요하다.** @font-face 는 «그 글자가 쓰일 때만» 받는다 →
//    마지막에 띄운 판(나머지 6개)에서 재면 **추천 8개는 안 받은 채라 「안 떴다」로 나온다.**
//    실제로 그렇게 나왔다(첫 판). 📌 검사가 틀린 게 아니라 «잰 자리»가 틀렸다 — 규칙 18 그대로.
//    → 열넷을 «다» 쓰는 판을 띄우고 잰다.
writeFileSync(join(OUT, 'board.html'), html('pick').replace(rowsPick, rowsPick + rowsRest))
await page.goto('http://127.0.0.1:4397/board.html', { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(1500)
const width = await page.evaluate((list) => {
  const m = document.createElement('span')
  m.style.cssText = 'position:fixed;left:-9999px;font-size:100px;white-space:pre'
  m.textContent = '오늘도 한 끼'
  document.body.appendChild(m)
  const out = {}
  m.style.fontFamily = 'serif'; const base = m.getBoundingClientRect().width
  for (const f of list) { m.style.fontFamily = `'${f}', serif`; out[f] = Math.round(m.getBoundingClientRect().width) }
  m.remove()
  return { base: Math.round(base), out }
}, cands.map((c) => c.fam))
const dead = Object.entries(width.out).filter(([, w]) => w === width.base).map(([k]) => k)
console.log(dead.length ? `⛔ 안 뜬 글씨체 ${dead.length}개 — ${dead.join(', ')}` : `✅ 후보 ${cands.length}개 전부 진짜로 떴다 (대체 글꼴 폭 ${width.base})`)

await b.close(); srv.close()
console.log('📁', OUT)
