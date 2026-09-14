// 🍂🦀 **가을 샘플 표지 시안 — 꽃게탕** (2026-09-08)
//
// 📮 창업자 = *"콩국수는 우리가 새로운 유저들한테 보여주는거잖아. 그거 가을버전으로 하나 만들어서 올려두자."*
//        ＋ *"꽃게탕으로 가을 샘플 표지 만들어줘"* ＋ *"가을 꾸미기시안 줘. 릴스에 올리면 좋겠네"*
//
// ⛔ 흉내내지 않는다 — **앱이 그리는 표지 그대로**를 찍는다(절대원칙 30).
//    시안 셋을 «진짜 레시피 세 편»으로 심고 앱을 띄워 그 카드를 찍는다.
//
// ⛔⛔ **10/1·11/1 에 열리는 컷은 못 쓴다** — 지금 유저 폰엔 «없는» 스티커다.
//    쓰는 컷은 전부 **2026-09-01 에 열린 가을 무료 컷**(Stickers.jsx `from: '2026-09-01'`):
//      · 소품 au_i43(체크담요) au_i44(시나몬라떼) au_i45(호박) au_i46(도토리) au_i47(양초책) au_i50(버섯)
//      · 곰펭 au_b09(곰＋단풍바구니) au_b26(곰펭＋낙엽더미) au_b28(곰＋군고구마)
//    배경지도 무료만 — kraft(크라프트) · mclay(클레이) · gwarm(웜크림)
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/_판-가을표지-꽃게탕-0908.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = '/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad/가을표지'
mkdirSync(OUT, { recursive: true })

// 🖼🖼 **창업자가 «직접 꾸민» 표지의 짜임 그대로** (2026-09-08 20:01 캡처 = 간장비빔국수)
//    📮 창업자 = *"이걸 꽃게탕으로"* ＋ *"ㄱ으로 하고 라벨 넣어서 다시 뽑아줘"*
//    🔢 좌표는 지어낸 게 아니라 `docs/_내레시피-백업/2026-09-07.json` 에서 «읽어 온» 값이다.
//    ⛔⛔ 첫 판에서 제목 종이가 안 나왔다 — JSON 을 찍을 때 `art` 칸을 «빼고» 봤기 때문이다.
//       📮 창업자 = *"저거 포스트잇아니고 라벨일걸 글자라벨?"* → 맞다. `art: 'dtp04'`(찢은 종이)다.
//       📌 값을 추려 볼 땐 «빠뜨린 칸이 없나»부터 본다(절대원칙 18 — 확인 방식부터 의심).
//    ⭐ 프레임 크기만 셋으로 견준다 — 창업자 판(0.7)에선 꽃게탕 그림이 프레임 밖으로 잘렸다.
//       꽃게탕 그림(fe_519)이 국수(gr_231)보다 넓어서다 → 0.82 · 0.90 · 0.98 로 재본다.
// 📮 창업자 = *"이거랑 배치,간격 똑같이 해주고 새 프레임을 하나 더 늘리고 그걸 여기에 넣어줘"*
//    → 크기·자리를 **창업자 판 그대로**(0.7) 두고, 프레임만 갈아 끼워 견준다.
//    ⭐ pf_au02(리본 넝쿨) = 파일은 있는데 서랍엔 «없는» 컷이다
//       (2026-08 창업자 *"1.3.4번 3개하자"* 로 뺐다 · Stickers.jsx:1715).
//       이걸 다시 넣자는 뜻이면 **앱 자산이 늘어나므로 창업자 검수 뒤** 서랍에 등록한다(절대원칙 13).
const 시안 = ['pf_au01', 'pf_au03', 'pf_au02'].map((프레임, i) => ({
  이름: `${'ㄱㄴㄷ'[i]} ${프레임}`,
  decorBg: 'none',
  thumb: 'icon',        // ⭐ 창업자 판과 같게 — 음식이 프레임 «안»에 들어간다
  decor: [
    { id: 'f-frame', type: 'sticker', key: 프레임, x: 0.508, y: 0.53, s: 0.7, r: 0 },
    { id: 'f-title', type: 'note', art: 'dtp04', text: '꽃게탕♡', font: 'gaegu', x: 0.481, y: 0.157, s: 0.62, r: -7.4, w: 'thin' },
    { id: 'f-leaf', type: 'sticker', key: 'au_i24', x: 0.147, y: 0.16, s: 0.22, r: 8 },
    { id: 'f-duo', type: 'sticker', key: 'au_b30', x: 0.736, y: 0.815, s: 0.409, r: 0 },
    { id: 'f-blanket', type: 'sticker', key: 'au_i43', x: 0.14, y: 0.81, s: 0.318, r: 0 },
    { id: 'f-boots', type: 'sticker', key: 'au_i48', x: 0.303, y: 0.857, s: 0.22, r: -4 },
    { id: 'f-bubble', type: 'sticker', key: 'tw_funfun', x: 0.761, y: 0.285, s: 0.232, r: 14.5 },
  ],
}))

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { BASICS_VERSION, allBasicRecipes } = await import('../src/data/basics.js')
const 꽃게탕 = allBasicRecipes.find((r) => r.title === '꽃게탕')
if (!꽃게탕) throw new Error('⛔ 꽃게탕을 못 찾았다')

const now = Date.now()
const state = {
  // 시안 셋을 «세 편»으로 심는다 — 한 화면에 나란히 놓고 견준다
  recipes: 시안.map((v, i) => ({
    ...꽃게탕, id: 'v' + i, title: '꽃게탕', category: '국물', folder: '국물',
    savedAt: now - i * 1000, source: 'user', status: 'sorted', favorite: false, cooked: 0,
    thumb: v.thumb || 'none',   // ⚠️ 창업자 판은 'icon'
    decorBg: v.decorBg, decor: v.decor,
  })),
  diary: [], seedV: BASICS_VERSION,
  removedSeedIds: allBasicRecipes.map((r) => r.id),   // 기본 편은 빼고 시안만 본다
}

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
const { SEED_COACH_SEEN } = await import('../src/coach.js')
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:news:off', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
  localStorage.setItem('hankki:gridSize', 'big')     // ⭐ 큰 격자라야 표지를 판정할 수 있다
}, state)
const p = await ctx.newPage()
const 오류 = []
p.on('pageerror', (e) => 오류.push(String(e.message || e).split('\n')[0]))
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(1400)
await p.getByText('레시피', { exact: true }).last().click()
await p.waitForTimeout(1400)

const 칸 = await p.locator('.grid-card').count()
if (칸 < 시안.length) throw new Error(`⛔ 카드가 ${칸}개뿐이다 — 시안 ${시안.length}개가 다 안 섰다`)

// 표지 하나하나를 «원본 픽셀 100%» 로 따로 찍는다(절대원칙 13 — 줄인 판으로 판정하지 않는다)
const 판들 = []
for (let i = 0; i < 시안.length; i++) {
  const 판 = join(OUT, `표지-${시안[i].이름.replace(/\s/g, '')}.png`)
  await p.locator('.grid-card').nth(i).screenshot({ path: 판 })
  판들.push(판)
}
// 나란히 한 장 — 폰에서 한눈에 견주게
const py = `
from PIL import Image, ImageDraw
import sys
paths = sys.argv[1::2]; names = sys.argv[2::2]
ims = [Image.open(p).convert('RGB') for p in paths]
w = max(i.width for i in ims); h = max(i.height for i in ims)
pad, top = 24, 46
out = Image.new('RGB', (w*len(ims) + pad*(len(ims)+1), h + top + pad), (250,246,240))
d = ImageDraw.Draw(out)
for k,(im,n) in enumerate(zip(ims,names)):
    x = pad + k*(w+pad)
    out.paste(im, (x, top))
    d.text((x+4, 16), n, fill=(60,45,30))
out.save('${join(OUT, '가을표지-시안-셋.png')}')
print(out.size)
`
execFileSync('python3', ['-c', py, ...판들.flatMap((f, i) => [f, 시안[i].이름])], { stdio: 'inherit' })

await b.close(); srv.close()
if (오류.length) { console.log('⛔ 화면 오류'); 오류.forEach((e) => console.log('  ' + e)); process.exit(1) }
console.log('\n✅ 오류 0 ·', join(OUT, '가을표지-시안-셋.png'))
