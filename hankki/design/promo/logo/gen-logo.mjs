// 한끼 로고 생성기 (확정본 2026-07-16)
// 워드마크 "한끼"를 그리고 "한"의 ㅎ 동그라미(카운터)를 픽셀 검출해, 그 링 정중앙에
// 곰(곰곰 셰프)을 좌우대칭으로 넣는다. 곰 얼굴이 링 안을 채우고 ㅎ 브라운 링이 사방 균일
// 테두리(약 5px)로 곰을 감싼다. 시각 보정으로 곰을 위로 3px.
//
// 확정 스펙: 테두리 5px · 위 3px · 귀 온전(모자 위) · HANKKI 아래
//   ① 밝은 크림 배경 + 브라운 (앱 아이콘용)
//   ② 클레이 브라운 배경 + 크림 (대표그래픽·스플래시·확장용)
//
// 실행: /opt/node22/bin/node design/promo/logo/gen-logo.mjs [outDir]
//   - Chromium: /opt/pw-browsers/chromium-1194/chrome-linux/chrome
//   - 폰트: ../fonts-embed.css (base64, 오프라인 OK)
// 출력(outDir 기본 previews/): 확정-2색.png, 한끼로고-크림-512.png, 한끼로고-클레이-512.png
import pw from '/opt/node22/lib/node_modules/playwright/index.js'
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const OUTDIR = process.argv[2] || new URL('./previews/', import.meta.url).pathname
const FONTS = new URL('../fonts-embed.css', import.meta.url).pathname

const b = await pw.chromium.launch({ executablePath: CHROME })
const p = await (await b.newContext({ deviceScaleFactor: 2 })).newPage()
await p.setContent(`<meta charset=utf-8><link rel=stylesheet href="file://${FONTS}"><canvas></canvas>`, { waitUntil: 'networkidle' })
await p.waitForTimeout(300)

const out = await p.evaluate(async () => {
  await document.fonts.ready
  const BORDER = 8, UP = 3
  const BEAR = (tone) => {
    const f = tone === 'dark' ? '#cf9f76' : '#b98a63', ei = tone === 'dark' ? '#e6c6a1' : '#d9b593', sn = tone === 'dark' ? '#f2e4cd' : '#ecd9bd', hs = tone === 'dark' ? '#e7d3b5' : '#cdb79a'
    return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' width='320' height='320'>
      <circle cx='14.6' cy='19.4' r='4.7' fill='${f}'/><circle cx='33.4' cy='19.4' r='4.7' fill='${f}'/>
      <circle cx='14.6' cy='19.4' r='2.3' fill='${ei}'/><circle cx='33.4' cy='19.4' r='2.3' fill='${ei}'/>
      <circle cx='16.6' cy='8.2' r='3.9' fill='#fff' stroke='${hs}' stroke-width='0.8'/>
      <circle cx='24' cy='5.4' r='4.5' fill='#fff' stroke='${hs}' stroke-width='0.8'/>
      <circle cx='31.4' cy='8.2' r='3.9' fill='#fff' stroke='${hs}' stroke-width='0.8'/>
      <rect x='15.4' y='10.4' width='17.2' height='4.2' rx='2.1' fill='#fff' stroke='${hs}' stroke-width='0.8'/>
      <circle cx='24' cy='28.5' r='13' fill='${f}'/><ellipse cx='24' cy='33' rx='6.4' ry='4.6' fill='${sn}'/>
      <rect x='22.6' y='30.5' width='2.8' height='2.2' rx='1.1' fill='#5f4632'/>
      <path d='M24 32.9v1.6M24 34.5c-.9.9-2 .9-2.8.2M24 34.5c.9.9 2 .9 2.8.2' stroke='#5f4632' stroke-width='1' fill='none' stroke-linecap='round'/>
      <circle cx='18.6' cy='28' r='1.35' fill='#3d3830'/><circle cx='29.4' cy='28' r='1.35' fill='#3d3830'/>
      <circle cx='15.6' cy='31.5' r='2.1' fill='#f0b9a6' opacity='0.72'/><circle cx='32.4' cy='31.5' r='2.1' fill='#f0b9a6' opacity='0.72'/></svg>`
  }
  const loadImg = (svg) => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) })
  function drawWord(x, bg, fg, en) {
    x.fillStyle = bg; x.fillRect(0, 0, 512, 512)
    const wf = 172; x.textBaseline = 'alphabetic'; x.fillStyle = fg; x.font = wf + 'px Jua'
    const w = '한끼', tw = x.measureText(w).width, wH = wf * 0.72, eH = 38 * 0.72, top = (512 - (wH + 6 + eH)) / 2, wb = top + wH
    x.fillText(w, (512 - tw) / 2, wb)
    x.font = '700 38px GowunDodum'; x.fillStyle = en
    const t = 'HANKKI', ls = 14; let ew = 0; for (const c of t) ew += x.measureText(c).width + ls; ew -= ls
    let ex = (512 - ew) / 2; const eb = wb + wf * 0.20 + 6 + eH
    for (const c of t) { x.fillText(c, ex, eb); ex += x.measureText(c).width + ls }
  }
  // ㅎ 링 검출 (밝은 레이아웃 기준 — 색 무관, 좌표 동일)
  const t = document.createElement('canvas'); t.width = 512; t.height = 512; const tx = t.getContext('2d'); drawWord(tx, '#fffdf8', '#6b4f3a', '#b98a63')
  const d = tx.getImageData(0, 0, 512, 512).data, W = 512, H = 512, brown = i => d[i] < 160 && d[i + 1] < 130 && d[i + 2] < 110
  const outp = new Uint8Array(W * H), st = []
  for (let i = 0; i < W; i++) st.push(i, 0, i, H - 1); for (let j = 0; j < H; j++) st.push(0, j, W - 1, j)
  while (st.length) { const y = st.pop(), x = st.pop(); if (x < 0 || y < 0 || x >= W || y >= H) continue; const q = y * W + x; if (outp[q] || brown(q * 4)) continue; outp[q] = 1; st.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1) }
  let mnx = W, mxx = 0, mny = H, mxy = 0
  for (let y = 0; y < H * 0.6; y++) for (let x = 0; x < W * 0.45; x++) { const q = y * W + x; if (outp[q] || brown(q * 4)) continue; if (x < mnx) mnx = x; if (x > mxx) mxx = x; if (y < mny) mny = y; if (y > mxy) mxy = y }
  const cx = (mnx + mxx) / 2, cy = (mny + mxy) / 2
  let xl = 0; for (let x = 0; x < W; x++) if (brown((Math.round(cy) * W + x) * 4)) { xl = x; break }
  const Ro = cx - xl, faceR = Ro - BORDER, Wd = faceR / 13 * 48
  const bearL = await loadImg(BEAR('light')), bearD = await loadImg(BEAR('dark'))
  const render = (bg, fg, en, img) => { const c = document.createElement('canvas'); c.width = 512; c.height = 512; const o = c.getContext('2d'); drawWord(o, bg, fg, en); o.drawImage(img, cx - Wd / 2, cy - (28.5 / 48) * Wd - UP, Wd, Wd); return c.toDataURL('image/png') }
  const light = render('#fffdf8', '#6b4f3a', '#b98a63', bearL)
  const clay = render('#c9784f', '#fbf3e9', '#f4dcc9', bearD)
  // 비교판
  const bl = new Image(), bc = new Image(); await new Promise(r => { let n = 0; const done = () => (++n === 2) && r(); bl.onload = done; bc.onload = done; bl.src = light; bc.src = clay })
  const big = document.createElement('canvas'); big.width = 512 * 2 + 60; big.height = 512; const g = big.getContext('2d'); g.fillStyle = '#8f8f8f'; g.fillRect(0, 0, big.width, big.height); g.drawImage(bl, 20, 0); g.drawImage(bc, 512 + 40, 0)
  return { light, clay, compare: big.toDataURL('image/png') }
})
const { writeFileSync } = await import('fs')
const save = (name, url) => writeFileSync(OUTDIR + name, Buffer.from(url.split(',')[1], 'base64'))
save('확정-2색.png', out.compare); save('한끼로고-크림-512.png', out.light); save('한끼로고-클레이-512.png', out.clay)
console.log('saved to', OUTDIR)
await b.close()
