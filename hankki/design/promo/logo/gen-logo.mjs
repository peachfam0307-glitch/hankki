// 한끼 로고 생성기 (아이디어 저장용) — 워드마크 "한끼"를 그리고, ㅎ 동그라미를
// 픽셀로 검출한 좌표에 곰(또는 냄비)을 정확히 얹어 로고/아이콘을 렌더한다.
//
// 왜 이렇게? 폰트 글자 위에 마스코트를 눈대중으로 얹으면 계속 어긋남 →
// 캔버스에 워드마크를 그린 뒤 "한"의 ㅎ 카운터(구멍)를 flood-fill로 찾아
// 그 중심에 곰 얼굴중심을 맞춘다. IX/iTop 은 끼의 ㅣ(맨 오른쪽 획) 꼭대기.
//
// 실행(이 환경):
//   /opt/node22/bin/node design/promo/logo/gen-logo.mjs [out.png]
//   - Chromium/Playwright: /opt/pw-browsers/chromium-1194/chrome-linux/chrome
//   - 폰트(Jua/GowunDodum)는 ../fonts-embed.css 의 base64 사용 (오프라인 OK)
//
// 곰/냄비 SVG 소스: bear-chef.svg / pot-lecreuset.svg (여기 인라인과 동일)
import pw from '/opt/node22/lib/node_modules/playwright/index.js'
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const OUT = process.argv[2] || new URL('./previews/_gen.png', import.meta.url).pathname
const FONTS = new URL('../fonts-embed.css', import.meta.url).pathname

const HTML = `<!doctype html><meta charset=utf-8><link rel=stylesheet href="file://${FONTS}"><canvas id=c></canvas>`

const b = await pw.chromium.launch({ executablePath: CHROME })
const p = await (await b.newContext({ deviceScaleFactor: 2 })).newPage()
await p.setContent(HTML, { waitUntil: 'networkidle' })
await p.waitForTimeout(300)

const dataUrl = await p.evaluate(async () => {
  await document.fonts.ready
  // ── 곰곰 셰프 (좌우대칭, 귀 위 모자). tone: 'light'|'dark' ──
  const BEAR = (tone) => {
    const f = tone === 'dark' ? '#cf9f76' : '#b98a63', ei = tone === 'dark' ? '#e6c6a1' : '#d9b593', sn = tone === 'dark' ? '#f2e4cd' : '#ecd9bd'
    return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' width='320' height='320'>
      <circle cx='14.6' cy='19.4' r='4.7' fill='${f}'/><circle cx='33.4' cy='19.4' r='4.7' fill='${f}'/>
      <circle cx='14.6' cy='19.4' r='2.3' fill='${ei}'/><circle cx='33.4' cy='19.4' r='2.3' fill='${ei}'/>
      <circle cx='16.6' cy='8.2' r='3.9' fill='#fff' stroke='#a5825f' stroke-width='1.1'/>
      <circle cx='24' cy='5.4' r='4.5' fill='#fff' stroke='#a5825f' stroke-width='1.1'/>
      <circle cx='31.4' cy='8.2' r='3.9' fill='#fff' stroke='#a5825f' stroke-width='1.1'/>
      <rect x='15.4' y='10.4' width='17.2' height='4.2' rx='2.1' fill='#fff' stroke='#a5825f' stroke-width='1.1'/>
      <circle cx='24' cy='28.5' r='13' fill='${f}'/><ellipse cx='24' cy='33' rx='6.4' ry='4.6' fill='${sn}'/>
      <rect x='22.6' y='30.5' width='2.8' height='2.2' rx='1.1' fill='#5f4632'/>
      <path d='M24 32.9v1.6M24 34.5c-.9.9-2 .9-2.8.2M24 34.5c.9.9 2 .9 2.8.2' stroke='#5f4632' stroke-width='1' fill='none' stroke-linecap='round'/>
      <circle cx='18.6' cy='28' r='1.35' fill='#3d3830'/><circle cx='29.4' cy='28' r='1.35' fill='#3d3830'/>
      <circle cx='15.6' cy='31.5' r='2.1' fill='#f0b9a6' opacity='0.72'/><circle cx='32.4' cy='31.5' r='2.1' fill='#f0b9a6' opacity='0.72'/></svg>`
  }
  const loadImg = (svg) => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) })
  // ── 워드마크 "한끼" + HANKKI ──
  function drawWord(x, bg, fg, en) {
    x.fillStyle = bg; x.fillRect(0, 0, 512, 512)
    const wordF = 172, enF = 38, gap = 6
    x.textBaseline = 'alphabetic'; x.fillStyle = fg; x.font = wordF + 'px Jua'
    const w = '한끼', tw = x.measureText(w).width
    const wH = wordF * 0.72, eH = enF * 0.72, blockH = wH + gap + eH, top = (512 - blockH) / 2, wb = top + wH
    x.fillText(w, (512 - tw) / 2, wb)
    if (en) {
      x.font = '700 ' + enF + "px GowunDodum"; x.fillStyle = en
      const t = 'HANKKI', ls = 14; let ew = 0; for (const c of t) ew += x.measureText(c).width + ls; ew -= ls
      let ex = (512 - ew) / 2; const eb = wb + wordF * 0.20 + gap + eH
      for (const c of t) { x.fillText(c, ex, eb); ex += x.measureText(c).width + ls }
    }
  }
  // ── ㅎ 구멍 + 끼의 ㅣ 검출 ──
  function detect(en) {
    const t = document.createElement('canvas'); t.width = 512; t.height = 512; const x = t.getContext('2d'); drawWord(x, '#fffdf8', '#6b4f3a', en ? '#b98a63' : null)
    const d = x.getImageData(0, 0, 512, 512).data, W = 512, H = 512, brown = i => d[i] < 160 && d[i + 1] < 130 && d[i + 2] < 110
    const out = new Uint8Array(W * H), st = []
    for (let i = 0; i < W; i++) st.push(i, 0, i, H - 1); for (let j = 0; j < H; j++) st.push(0, j, W - 1, j)
    while (st.length) { const y = st.pop(), xx = st.pop(); if (xx < 0 || y < 0 || xx >= W || y >= H) continue; const q = y * W + xx; if (out[q] || brown(q * 4)) continue; out[q] = 1; st.push(xx + 1, y, xx - 1, y, xx, y + 1, xx, y - 1) }
    let sx = 0, sy = 0, n = 0
    for (let y = 0; y < H * 0.6; y++) for (let xx = 0; xx < W * 0.45; xx++) { const q = y * W + xx; if (out[q] || brown(q * 4)) continue; sx += xx; sy += y; n++ }
    let mx = 0; for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) if (brown((y * W + xx) * 4) && xx > mx) mx = xx
    let ix = 0, iw = 0, iTop = H; for (let y = 0; y < H; y++) for (let xx = mx - 34; xx <= mx; xx++) if (brown((y * W + xx) * 4)) { ix += xx; iw++; if (y < iTop) iTop = y }
    return { HX: sx / n, HY: sy / n, IX: ix / iw, iTop }
  }
  const { HX, HY } = detect(true)
  const bearL = await loadImg(BEAR('light')), bearD = await loadImg(BEAR('dark'))
  const Wd = 130
  const card = (bg, fg, en, img) => { const c = document.createElement('canvas'); c.width = 512; c.height = 512; const o = c.getContext('2d'); drawWord(o, bg, fg, en); o.drawImage(img, HX - Wd / 2, HY - (28.5 / 48) * Wd, Wd, Wd); return c }
  const a = card('#fffdf8', '#6b4f3a', '#b98a63', bearL)   // ① 밝은 크림
  const b2 = card('#c9784f', '#fbf3e9', '#f4dcc9', bearD)  // ② 클레이
  const big = document.createElement('canvas'); big.width = 512 * 2 + 60; big.height = 532; const g = big.getContext('2d')
  g.fillStyle = '#8f8f8f'; g.fillRect(0, 0, big.width, big.height); g.drawImage(a, 20, 10); g.drawImage(b2, 512 + 40, 10)
  return big.toDataURL('image/png')
})
const { writeFileSync } = await import('fs')
writeFileSync(OUT, Buffer.from(dataUrl.split(',')[1], 'base64'))
console.log('saved', OUT)
await b.close()
