// 🔬 `getFontEmbedCSS` 가 «실제로» 무엇을 내놓는지 본다 — 판정 기준을 짐작하지 않으려고.
//   ⛔ 2026-08-05: 「쓸 수 있나」 판정을 눈대중으로 짰다가 늘 «못 쓴다»가 나와 캡처가 다시 느려졌다.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = Number(process.env.PORT || 4342)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
process.on('exit', () => { try { srv.kill() } catch { /* noop */ } })
await new Promise((r) => setTimeout(r, 900))

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const page = await (await browser.newContext()).newPage()
await page.goto(`http://127.0.0.1:${PORT}/`)
await page.waitForTimeout(5000)

// 앱이 이미 불러온 html-to-image 를 그대로 쓴다 — 번들 안에서 fontCSS 가 도는 것과 같은 조건
const r = await page.evaluate(async () => {
  await document.fonts.ready
  const faces = []
  for (const s of [...document.styleSheets]) {
    try { for (const rule of s.cssRules) if (rule.constructor.name === 'CSSFontFaceRule') faces.push(rule.style.fontFamily) }
    catch { /* 다른 출처 시트는 못 읽는다 */ }
  }
  // 앱 번들의 fontEmbed 모듈을 직접 부를 수 없으니, 같은 라이브러리를 동적 import 한다
  let css = null, err = null
  try {
    const mod = await import('/assets/' + (window.__H2I || ''))
    css = typeof mod.getFontEmbedCSS === 'function' ? await mod.getFontEmbedCSS(document.body) : null
  } catch (e) { err = String(e).slice(0, 120) }
  return { faceCount: faces.length, faces: [...new Set(faces)], fontsSize: document.fonts.size, css: css ? css.slice(0, 0) : null, cssLen: css ? css.length : 0, err }
})
console.log('📋 문서에 등록된 @font-face:', r.faceCount, '개')
for (const f of r.faces) console.log('   ·', f)
console.log('📦 document.fonts.size =', r.fontsSize)
if (r.err) console.log('⚠️ 라이브러리 직접 import 실패(예상됨):', r.err)
await browser.close()
