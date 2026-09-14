// 📐 fn_* 다섯 컷에 «진짜 글자»를 얹어 본다 — 여백 값을 눈으로 정하려고 (2026-08-09)
//   창업자 *"말풍선 격자(레꾸)에 왜 프레임에 들어가있어?"* → *"2번은 글자써지는 판으로"*
//   ⛔ 숫자만 보고 정하면 또 틀린다(BOX_PAD 를 네 번 고쳤다) — ArtBox 와 «같은 방식»으로 그려서 본다.
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const b64 = (p, m) => `data:${m};base64,${readFileSync(join(ROOT, p)).toString('base64')}`

// 후보 여백 [위, 오른쪽, 아래, 왼쪽] % — 인자로 JSON 을 주면 그 값으로 그린다
const 기본 = {
  fn_speech: [35.1, 29.5, 30.2, 26.0],
  fn_bow: [36.1, 31.7, 31.1, 33.8],
  fn_daisy: [34.9, 33.5, 35.3, 35.1],
  fn_gingham: [18.1, 17.6, 17.6, 18.0],
  fn_night: [26.2, 22.8, 22.3, 24.3],
}
const PAD = process.argv[2] ? JSON.parse(process.argv[2]) : 기본
const 글 = { fn_speech: '오늘도\n한 끼 해냈다', fn_bow: '엄마표\n김치볶음밥', fn_daisy: '봄나물\n무침', fn_gingham: '장 볼 것\n두부 계란 파', fn_night: '야식은\n참을 수 없지' }
const 잉크 = { fn_night: '#fdfbf5' }   // 밤하늘은 바탕이 어두워 흰 글자

// ⛔⛔ `container-type: size` 는 «크기 담기»라 높이가 auto 면 0 이 된다 —
//    첫 판이 그래서 글자도 초록 점선도 종이 밖(맨 위)에 떴다. 앱에선 판 크기가 정해져 있어 안 터진다.
//    → 그림 «실제 비율»로 높이를 박아 준다.
const 비율 = JSON.parse(readFileSync(join(ROOT, 'scripts/_fn-ratio.json'), 'utf8'))

// 📐 앱의 `autoCqw`(DecorLayer.jsx) 를 그대로 옮겼다 — 글이 길면 저절로 줄어드는 것까지 같아야
//    「넘치나」를 여기서 판정할 수 있다. ⛔안 옮기면 «내 판이» 넘쳐 놓고 앱 탓을 하게 된다.
function autoCqw(text, max, wPct, hPct, lh) {
  const lines = String(text || '').split('\n')
  for (let r = max; r > 5; r -= 0.25) {
    const per = Math.max(1, Math.floor(wPct / r))
    const cap = Math.max(1, Math.floor(hPct / (lh * r)))
    const need = lines.reduce((s, l) => s + Math.max(1, Math.ceil(l.length / per)), 0)
    if (need <= cap) return r
  }
  return 5
}

const 컷 = Object.keys(PAD)
const 종이 = '#f6f2e8'
const html = `<style>
@font-face { font-family:'Gaegu'; src:url('${b64('src/assets/fonts/gaegu-korean-400.woff2', 'font/woff2')}') format('woff2'); font-weight:700; }
body { margin:0; background:${종이}; font-family:'Gaegu',sans-serif; }
.row { display:flex; gap:18px; padding:18px; }
.cell { width:340px; }
.cap { font-size:15px; color:#4a4038; padding-bottom:6px; font-family:sans-serif; }
.board { position:relative; width:340px; container-type:size; }
.board img { width:100%; display:block; filter:drop-shadow(1.5px 3px 5px rgba(70,60,45,.28)); }
.ink { position:absolute; box-sizing:border-box; display:flex; align-items:center; justify-content:center;
       text-align:center; white-space:pre-wrap; word-break:keep-all; line-height:1.35;
       font-weight:700; overflow:hidden; -webkit-text-stroke:0.4px currentColor; paint-order:stroke fill; }
.win { position:absolute; outline:2px dashed rgba(20,190,110,.85); pointer-events:none; }
</style>
<div class="row">
${컷.map((k) => {
  const [t, r, bo, l] = PAD[k]
  const ink = 잉크[k] || '#4a4038'
  const cqw = autoCqw(글[k], 13, 100 - r - l, (100 - t - bo) / 비율[k], 1.35)
  return `<div class="cell"><div class="cap">${k} [${PAD[k].join(', ')}]</div>
  <div class="board" style="height:${Math.round(340 / 비율[k])}px">
    <img src="${b64(`src/assets/stickers/photo/${k}.png`, 'image/png')}">
    <div class="ink" style="top:${t}%;right:${r}%;bottom:${bo}%;left:${l}%;color:${ink};font-size:${cqw}cqw">${글[k]}</div>
    <div class="win" style="top:${t}%;right:${r}%;bottom:${bo}%;left:${l}%"></div>
  </div></div>`
}).join('\n')}
</div>`

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
writeFileSync(`${OUT}/fn-시안.html`, html)
const br = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await br.newPage({ viewport: { width: 340 * 컷.length + 18 * (컷.length + 1), height: 420 }, deviceScaleFactor: 2 })
await page.setContent(html)
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/fn-시안.png`, fullPage: true })
await br.close()
console.log(`👁 ${OUT}/fn-시안.png — 초록 점선이 글 자리다`)
