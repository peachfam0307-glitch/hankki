// 🖼☑️ **그림이 이름과 어긋난 자리 — 창업자 검수판** (2026-09-14)
//
// 📮 창업자 = *"가지무침이 만두로 바뀐거 실화야???????????"* → *"앞으로 업뎃에 이런 사고 없도록 전체검수하고 구멍다 잡아"*
//
// ⭐ `check-iconmatch.mjs` 의 「판정대기」 목록을 **그림과 함께** 한 장으로 뽑는다.
//    ⛔ 아이콘은 **창업자가 고른다**(규칙 11) — 내가 「같다/다르다」를 정하지 않는다.
//    ⭐ 그래서 판정할 것만 크게 보여주고, 번호로 답할 수 있게 한다.
//
// ⛔ PIL 로 안 만든다 — 이 환경엔 한글 폰트가 없어 글자가 네모로 깨진다(실제로 한 번 그랬다).
//    ✅ 브라우저로 그린다. 우리 앱이 쓰는 그림 파일을 그대로 불러 «앱과 같은 컷»을 본다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-그림짝검수-0914.mjs
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const 대기 = (() => {
  const s = readFileSync(join(ROOT, 'scripts/check-iconmatch.mjs'), 'utf8')
  const b = s.slice(s.indexOf('const 판정대기 = {'), s.indexOf('\n}', s.indexOf('const 판정대기 = {')))
  return [...b.matchAll(/'([^']+)':\s*'([^']+)',\s*\/\/\s*(.*)/g)].map((m) => ({ 제목: m[1], 붙은이름: m[2], 메모: m[3].trim() }))
})()
if (!대기.length) { console.error('⛔ 판정대기 목록을 못 읽었다 — check-iconmatch.mjs 의 모양이 바뀌었다.'); process.exit(1) }

// 🔎 제목 → 실제로 붙는 그림 키 (check-iconmatch 와 «같은 순서»로 구한다)
const store = readFileSync(join(ROOT, 'src/store.jsx'), 'utf8')
const 표읽기 = (이름) => {
  const i = store.indexOf(`const ${이름} = {`)
  if (i < 0) return {}
  const body = store.slice(i, store.indexOf('\n  }', i))
  const 표 = {}
  for (const m of body.matchAll(/(?:'([^']+)'|([A-Za-z][\w]*))\s*:\s*'([^']+)'/g)) 표[m[1] || m[2]] = m[3]
  return 표
}
const F38 = 표읽기('ICON_FORCE_V38'), SV88 = 표읽기('ICON_SWAP_V88'), FV88 = 표읽기('ICON_FORCE_V88')
const SGR = 표읽기('ICON_SWAP_GR'), S0827 = 표읽기('ICON_SWAP_0827')
const { allBasicRecipes } = await import('../src/data/basics.js')
const 최종그림 = (제목) => {
  const r = allBasicRecipes.find((x) => String(x.title).trim() === 제목)
  if (!r) return null
  let g = r.icon
  if (F38[제목]) g = F38[제목]
  if (FV88[제목]) g = FV88[제목]; else if (SV88[g]) g = SV88[g]
  if (SGR[g]) g = SGR[g]
  if (S0827[g]) g = S0827[g]
  return g
}

const 칸들 = 대기.map((x, i) => ({ ...x, 번호: i + 1, 키: 최종그림(x.제목) })).filter((x) => x.키)
console.log(`📋 검수판에 실을 칸 ${칸들.length}개`)

const html = `<!doctype html><meta charset="utf-8">
<style>
  body { margin:0; background:#FAF7F2; font-family:system-ui,-apple-system,'Malgun Gothic',sans-serif; color:#3A2A20; }
  h1 { font-size:30px; margin:22px 20px 6px; }
  .안내 { margin:0 20px 18px; font-size:17px; line-height:1.6; color:#6B5646; }
  .안내 b { color:#8A4A28; }
  .판 { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; padding:0 20px 28px; }
  .칸 { background:#fff; border:2px solid #E6DCD2; border-radius:16px; padding:12px; }
  .번호 { display:inline-block; background:#5C4535; color:#fff; border-radius:999px; padding:2px 12px; font-size:19px; font-weight:800; }
  .그림 { width:100%; height:230px; display:flex; align-items:center; justify-content:center; margin:8px 0; }
  .그림 img { max-width:100%; max-height:100%; }
  .제목 { font-size:21px; font-weight:800; line-height:1.35; }
  .붙은 { font-size:17px; color:#A15A30; margin-top:4px; }
  .메모 { font-size:15.5px; color:#7A6555; margin-top:6px; line-height:1.5; }
  .의심 { border-color:#D98A6A; background:#FFF8F4; }
</style>
<h1>그림이 이름과 어긋난 자리 ${칸들.length}군데</h1>
<div class="안내">
  왼쪽 그림이 <b>지금 그 레시피에 붙어 있는 그림</b>이야.<br>
  <b>「같은 거야」</b> 인지 <b>「바꿔야 해」</b> 인지만 번호로 알려줘. (예: 1·5·12 는 바꿔 / 나머지는 같은 거)<br>
  🚨 테두리가 진한 칸은 내가 보기에 <b>특히 의심</b>되는 자리야.
</div>
<div class="판">
${칸들.map((x) => `  <div class="칸${/[❓🚨]/.test(x.메모) ? ' 의심' : ''}">
    <span class="번호">${x.번호}</span>
    <div class="그림"><img src="/photo/${x.키}.png"></div>
    <div class="제목">${x.제목}</div>
    <div class="붙은">붙은 그림 이름 — ${x.붙은이름}</div>
    <div class="메모">${x.메모.replace(/^[❓🚨]\s*/, (m) => m)}</div>
  </div>`).join('\n')}
</div>`

const MIME = { '.png': 'image/png', '.html': 'text/html' }
const srv = createServer((q, s) => {
  const p = decodeURIComponent(q.url.split('?')[0])
  if (p === '/' || p === '/index.html') { s.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return s.end(html) }
  try {
    const b = readFileSync(join(ROOT, 'src/assets/stickers', p.replace('/photo/', 'photo/')))
    s.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }); s.end(b)
  } catch { s.writeHead(404); s.end('') }
})
await new Promise((r) => srv.listen(4495, r))

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const p = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 })
await p.goto('http://127.0.0.1:4495/', { waitUntil: 'networkidle' })
await p.waitForTimeout(600)
const 낼것 = join(ROOT, 'docs/검수판-그림짝-2026-09-14.png')
await p.screenshot({ path: 낼것, fullPage: true })
await b.close(); srv.close()
console.log('✅ ' + 낼것)
