// 🔎 갓 깐 폰의 백업이 «무엇으로» 100KB 를 넘나 — 칸별 크기 ＋ 기본 레시피가 원본과 같은가 (2026-09-30)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4391, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const { allBasicRecipes } = await import('../src/data/basics.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const p = await (await b.newContext({ viewport: { width: 390, height: 860 } })).newPage()
await p.addInitScript(SEED_COACH_SEEN)
await p.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
await p.goto('http://127.0.0.1:4391/hankki/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
const s = JSON.parse(await p.evaluate(() => localStorage.getItem('hankki:v1')))
const kb = (v) => (JSON.stringify(v ?? null).length / 1024).toFixed(1)
console.log('전체', kb(s), 'KB')
for (const k of Object.keys(s)) console.log('  ', k.padEnd(16), kb(s[k]), 'KB')
const 원본 = new Map(allBasicRecipes.map((r) => [r.id, r]))
let 같음 = 0, 다름 = 0, 씨앗아님 = 0
const 다른칸 = {}
for (const r of s.recipes) {
  const o = 원본.get(r.id)
  if (!o) { 씨앗아님++; continue }
  const 칸 = new Set([...Object.keys(r), ...Object.keys(o)])
  const 달라 = [...칸].filter((k) => k !== 'savedAt' && JSON.stringify(r[k]) !== JSON.stringify(o[k]))
  if (!달라.length) 같음++; else { 다름++; for (const k of 달라) 다른칸[k] = (다른칸[k] || 0) + 1 }
}
console.log(`기본 레시피 원본과 같음 ${같음} · 다름 ${다름} · 씨앗 아님 ${씨앗아님}`)
console.log('다른 칸', 다른칸)
await b.close(); srv.close()
