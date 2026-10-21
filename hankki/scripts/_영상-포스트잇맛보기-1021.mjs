// 🎬 릴스 질문 장면 맛보기 — 포스트잇 + 꼬르곰 (2026-10-21 · 창업자 「일단 한번해볼래」)
//   HTML 장면을 프레임마다 시간을 멈춰 찍고(getAnimations currentTime) ffmpeg-static 으로 mp4 를 굽는다
import { chromium } from 'playwright'
import { mkdirSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
const [,, html, out, 초 = '3.5'] = process.argv
const FPS = 30, 장 = Math.round(+초 * FPS), TMP = out + '.frames'
rmSync(TMP, { recursive: true, force: true }); mkdirSync(TMP, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } })
await p.goto('file://' + html); await p.waitForTimeout(600)
for (let i = 0; i < 장; i++) {
  await p.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t }), i * 1000 / FPS)
  await p.screenshot({ path: join(TMP, String(i).padStart(4, '0') + '.png') })
}
await b.close()
const FF = join(new URL('..', import.meta.url).pathname, 'node_modules/ffmpeg-static/ffmpeg')
execFileSync(FF, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(TMP, '%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', out])
console.log('✅', out, 장, '장')
