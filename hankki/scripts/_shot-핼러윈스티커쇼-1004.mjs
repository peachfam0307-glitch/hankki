// 🎃✨ 핼러윈 «오픈하는 스티커» 쭉 보여주기 + 통단호박 꾸미기 릴스에 이어붙이기 (2026-10-04)
// 📮 창업자 = *"펭펭 효과 이렇게 하고 우리오픈하는 스티커들 예쁘게 만들어서 쭉 보여주자"*
// ⭐ 스티커 목록은 손으로 안 적는다 — Stickers.jsx 의 `열쇠까지: '2026-10-16'` 줄에서 읽는다(규칙 22).
// 흐름 = [꾸미기 릴스 17.5초(꾸미기릴스-녹화.mjs 결과)] → 0.5초 이음 → [스티커 쇼 6초] → 0.5초 이음 → [끝 장 3초]
// 쓰는 법: SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_shot-핼러윈스티커쇼-1004.mjs
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const 앱 = dirname(dirname(fileURLToPath(import.meta.url)))
const FF = join(앱, 'node_modules/ffmpeg-static/ffmpeg')
const 밖 = process.env.OUT || '/tmp/claude-0/핼러윈스티커쇼'
const 앞영상 = join(앱, 'design/promo/인스타-2610/릴스-꾸미기-통단호박-2026-10-04.mp4')
const 낼파일 = join(앱, 'design/promo/인스타-2610/릴스-통단호박-핼러윈-2026-10-14.mp4')
if (!existsSync(앞영상)) { console.error('⛔ 먼저 꾸미기 릴스를 굽는다 → node scripts/꾸미기릴스-녹화.mjs docs/꾸미기릴스-시안-통단호박-2026-10-04.json'); process.exit(1) }
rmSync(밖, { recursive: true, force: true }); mkdirSync(join(밖, 'show'), { recursive: true })

const src = readFileSync(join(앱, 'src/components/Stickers.jsx'), 'utf8')
const 키들 = []
for (const 줄 of src.split('\n')) {
  if (!줄.includes("열쇠까지: '2026-10-16'") || !줄.includes('items:')) continue
  for (const m of 줄.match(/items: \[([^\]]*)\]/)[1].matchAll(/'([a-z_0-9]+)'/g)) if (existsSync(join(앱, 'src/assets/stickers/photo', m[1] + '.png'))) 키들.push(m[1])
}
console.log('스티커', 키들.length)
const 짐 = (p, t = 'png') => `data:image/${t};base64,` + readFileSync(p).toString('base64')
const 폰트 = readFileSync(join(앱, 'src/assets/fonts/gowun-dodum-korean-400.woff2')).toString('base64')
const 폰트L = readFileSync(join(앱, 'src/assets/fonts/gowun-dodum-latin-400.woff2')).toString('base64')
const 펠트 = 짐(join(앱, 'src/assets/decorbg/halloween-felt.webp'), 'webp')
const 아이콘 = 짐(join(앱, 'public/icons/icon-512-v7.png'))
const 머리 = `<style>@font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트}) format('woff2');unicode-range:U+AC00-D7A3,U+1100-11FF,U+3130-318F}
@font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트L}) format('woff2')}
*{margin:0;padding:0;box-sizing:border-box;font-family:GD,sans-serif}body{width:1080px;height:1920px;overflow:hidden;position:relative;background:url(${펠트}) center/cover}
.제목{position:absolute;left:60px;right:60px;top:110px;z-index:5;background:rgba(48,34,66,.88);color:#fff;border-radius:40px;padding:34px 20px;text-align:center;font-size:64px;line-height:1.3;font-weight:700}
.제목 small{display:block;font-size:42px;opacity:.85;margin-top:6px}
.판{position:absolute;left:0;right:0;top:420px;display:grid;grid-template-columns:repeat(3,1fr);gap:26px;padding:0 50px;animation:올라 6s cubic-bezier(.45,0,.55,1) .2s both}
@keyframes 올라{from{transform:translateY(0)}to{transform:translateY(var(--끝))}}
.칸{background:rgba(255,250,244,.92);border-radius:34px;aspect-ratio:1;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 24px rgba(60,40,70,.18);animation:톡 .45s cubic-bezier(.2,1.5,.4,1) var(--at) both}
@keyframes 톡{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
.칸 img{max-width:84%;max-height:84%;object-fit:contain;animation:흔 1.6s ease-in-out var(--at) infinite alternate}
@keyframes 흔{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}
.끝{position:absolute;inset:0;background:#3b2c4f;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:60px;color:#fff}
.끝 .큰{font-size:84px;font-weight:700;text-align:center;line-height:1.3}
.알약{display:inline-flex;align-items:center;gap:16px;background:#fff;border-radius:999px;padding:24px 46px 24px 26px;font-size:42px;color:#5a4b6b;line-height:1.35}
.알약 img{width:90px;height:90px;border-radius:22px}</style>`
const 줄수 = Math.ceil(키들.length / 3), 칸높 = (1080 - 100 - 52) / 3 + 26
const 끝 = -Math.max(0, 420 + 줄수 * 칸높 - 1820)
const 칸들 = 키들.map((k, i) => `<div class="칸" style="--at:${(0.15 + Math.min(i, 9) * 0.07).toFixed(2)}s"><img src="${짐(join(앱, 'src/assets/stickers/photo', k + '.png'))}"></div>`).join('')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const pg = await (await b.newContext({ viewport: { width: 1080, height: 1920 } })).newPage()
await pg.setContent(`<!doctype html><html><head>${머리}</head><body><div class="제목">10월 16일, 할로윈 꾸미기 오픈<small>친구들 · 프레임 · 접시 · 종이·씰 · 마테 ${키들.length}가지</small></div><div class="판" style="--끝:${끝}px">${칸들}</div></body></html>`)
await pg.waitForTimeout(800); await pg.evaluate(() => document.getAnimations().forEach((a) => a.pause()))
const 쇼 = 6.5, 칸수 = Math.round(쇼 * 30)
for (let i = 0; i < 칸수; i++) { await pg.evaluate((t) => document.getAnimations().forEach((a) => { a.currentTime = t }), (i / 30) * 1000); await pg.screenshot({ path: join(밖, 'show', 'f' + String(i).padStart(4, '0') + '.png') }) }
await pg.setContent(`<!doctype html><html><head>${머리}</head><body><div class="끝"><div class="큰">10월 16일<br>할로윈 꾸미기 오픈</div><span class="알약"><img src="${아이콘}"><span>App Store · Google Play 에서<br><b style="color:#3b2c4f;font-size:52px">한끼 레시피북</b> 검색</span></span></div></body></html>`)
await pg.waitForTimeout(300); await pg.screenshot({ path: join(밖, 'end.png') })
await b.close()

const 앞길이 = (() => { try { execFileSync(FF, ['-i', 앞영상], { stdio: 'pipe' }) } catch (e) { const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(String(e.stderr)); return m[1] * 3600 + m[2] * 60 + Number(m[3]) } })()
const 이음 = 0.5, 끝장 = 3, 첫장 = 2
// 🎃 [창업자 2026-10-04 「젤 첫 화면에 할로윈 배경만 딱 띄워줄수있어? 거기에 내가 자막 넣게. 단호박도 따 빼고」 · 「2초정도」] → 펠트 배경만 2초
const f = `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,settb=AVTB,format=yuv420p[b]`
  + `;[1:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0xf6efe6,fps=30,settb=AVTB,format=yuv420p[a];[2:v]fps=30,settb=AVTB,format=yuv420p[s];[3:v]fps=30,settb=AVTB,format=yuv420p[e]`
  + `;[b][a]xfade=transition=fade:duration=${이음}:offset=${(첫장 - 이음).toFixed(2)}[ba]`
  + `;[ba][s]xfade=transition=fade:duration=${이음}:offset=${(첫장 + 앞길이 - 2 * 이음).toFixed(2)}[as];[as][e]xfade=transition=fade:duration=${이음}:offset=${(첫장 + 앞길이 + 쇼 - 3 * 이음).toFixed(2)},format=yuv420p[v]`
execFileSync(FF, ['-y', '-loop', '1', '-framerate', '30', '-t', String(첫장), '-i', join(앱, 'src/assets/decorbg/halloween-felt.webp'), '-i', 앞영상, '-framerate', '30', '-i', join(밖, 'show', 'f%04d.png'), '-loop', '1', '-framerate', '30', '-t', String(끝장 + 이음), '-i', join(밖, 'end.png'),
  '-filter_complex', f, '-map', '[v]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', 낼파일], { stdio: 'inherit' })
console.log('✅', 낼파일)
