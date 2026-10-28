// 🎃📣 10/16 「10월 한끼 레꾸자랑」 이벤트 릴스 (2026-10-04)
// 📮 창업자 = *"이걸 표지로 하고 위에 영상을 달자. 참여방법 쓰고, 간단하게 레꾸자랑에 올려준다는것까지"*
// 흐름 = 표지(GPT 그림 ＋ 제목) 2.5초 → ① 꾸미기 녹화(통단호박 · 빠르게) → ② 공유 → 인스타 → DM(그림으로) → ③ 인스타·레꾸자랑에 올려드려요 → 끝 장
// ⚠️ ②의 «공유 창»은 폰 자체 화면이라 녹화가 안 된다 → 그림 카드로 보여 준다(창업자에게 말함 2026-10-04)
// 쓰는 법: SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_shot-레꾸자랑이벤트릴스-1004.mjs
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const 앱 = dirname(dirname(fileURLToPath(import.meta.url)))
const FF = join(앱, 'node_modules/ffmpeg-static/ffmpeg')
const 곳 = join(앱, 'design/promo/인스타-2610')
const 밖 = process.env.OUT || '/tmp/claude-0/레꾸자랑이벤트릴스'
const 표지 = join(곳, '표지-레꾸자랑이벤트-2026-10-16.png')
const 배경 = join(곳, '배경-레꾸자랑-gpt원본.png')
const 꾸미기 = join(곳, '릴스-꾸미기-통단호박-2026-10-04.mp4')
const 낼파일 = join(곳, '릴스-레꾸자랑이벤트-2026-10-16.mp4')
for (const f of [표지, 배경, 꾸미기]) if (!existsSync(f)) { console.error('⛔ 없다:', f); process.exit(1) }
rmSync(밖, { recursive: true, force: true }); mkdirSync(join(밖, 's2'), { recursive: true }); mkdirSync(join(밖, 's3'), { recursive: true }); mkdirSync(join(밖, 's0'), { recursive: true })

const 짐 = (p, t = 'png') => `data:image/${t};base64,` + readFileSync(p).toString('base64')
const 폰 = (n) => readFileSync(join(앱, 'src/assets/fonts', n)).toString('base64')
const 아이콘 = 짐(join(앱, 'public/icons/icon-512-v7.png'))
const 그림 = 짐(배경)
const 유령 = 짐(join(앱, 'src/assets/stickers/photo/hw_11.png'))
const 머리 = `<style>@font-face{font-family:BH;src:url(data:font/woff2;base64,${폰('blackhansans-korean-400.woff2')})}@font-face{font-family:BH;src:url(data:font/woff2;base64,${폰('blackhansans-latin-400.woff2')})}
@font-face{font-family:JU;src:url(data:font/woff2;base64,${폰('jua-korean-400.woff2')})}@font-face{font-family:JU;src:url(data:font/woff2;base64,${폰('jua-latin-400.woff2')})}@font-face{font-family:SD;src:url(data:font/woff2;base64,${폰('singleday-korean-400.woff2')})}
*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;position:relative;overflow:hidden;background:transparent}
.밤{position:absolute;inset:0;background:url(${그림}) center/cover;filter:blur(6px) brightness(.55);transform:scale(1.05)}
.띠{position:absolute;left:60px;right:60px;top:120px;background:rgba(43,18,61,.92);color:#fff;border-radius:40px;padding:30px 20px;text-align:center;font-family:BH;font-size:56px;line-height:1.25}
.띠 b{color:#ffb347}
.줄{position:absolute;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:18px;top:820px}
.알{width:220px;height:220px;border-radius:60px;background:#fff8ee;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:JU;font-size:46px;color:#2b123d;box-shadow:0 16px 40px rgba(0,0,0,.4);animation:톡 .45s cubic-bezier(.2,1.5,.4,1) var(--at) both}
.알 .그{font-family:BH;font-size:110px;line-height:1.1}
.화{font-family:BH;font-size:90px;color:#ffb347;animation:톡 .4s ease var(--at) both}
@keyframes 톡{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
.손{position:absolute;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.55);border:8px solid #fff;animation:손 2.4s ease-in-out .3s both}
@keyframes 손{0%{left:150px;top:880px;opacity:0}10%{opacity:1}30%{left:155px;top:885px;transform:scale(.8)}45%{left:480px;top:885px;transform:scale(1)}60%{left:485px;top:885px;transform:scale(.8)}75%{left:810px;top:885px;transform:scale(1)}90%{left:815px;top:885px;transform:scale(.8);opacity:1}100%{opacity:0}}
.큰{position:absolute;left:0;right:0;text-align:center;font-family:BH;color:#fff;text-shadow:0 8px 0 #6b2fa0}
.카드{position:absolute;left:90px;right:90px;top:700px;background:#fff8ee;border-radius:44px;padding:50px 40px;text-align:center;font-family:JU;color:#2b123d;font-size:60px;line-height:1.5;box-shadow:0 20px 50px rgba(0,0,0,.45);animation:톡 .5s cubic-bezier(.2,1.4,.4,1) .2s both}
.카드 b{font-family:BH;color:#ff7a1a}
.유령{position:absolute;right:70px;bottom:250px;width:340px;animation:둥 1s ease-in-out infinite alternate}
@keyframes 둥{from{transform:translateY(0) rotate(-5deg)}to{transform:translateY(-30px) rotate(5deg)}}
.표바{position:absolute;inset:0;background:url(${그림}) center/cover;animation:줌 2.6s ease-out both}
@keyframes 줌{from{transform:scale(1.12)}to{transform:scale(1)}}
.내림{position:absolute;left:0;right:0;text-align:center;animation:내림 .5s cubic-bezier(.2,1.3,.4,1) var(--at) both}
@keyframes 내림{from{opacity:0;transform:translateY(-60px)}to{opacity:1;transform:none}}
.팡{animation-name:팡}@keyframes 팡{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:none}}
.올림{position:absolute;bottom:70px;left:60px;right:60px;background:rgba(255,248,238,.94);border-radius:36px;padding:30px 40px;font-family:JU;color:#2b123d;font-size:48px;line-height:1.55;box-shadow:0 14px 40px rgba(0,0,0,.4);animation:올림 .55s cubic-bezier(.2,1.2,.4,1) var(--at) both}
@keyframes 올림{from{opacity:0;transform:translateY(120px)}to{opacity:1;transform:none}}
.반짝{position:absolute;color:#ffe9a8;font-size:70px;text-shadow:0 0 24px #ffd36b;animation:반짝 1s ease-in-out var(--at) both}
@keyframes 반짝{0%{opacity:0;transform:scale(.3) rotate(0)}50%{opacity:1;transform:scale(1.2) rotate(90deg)}100%{opacity:0;transform:scale(.4) rotate(180deg)}}
.끝{position:absolute;inset:0;background:#3b2c4f;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:60px;color:#fff}
.끝 .제{font-family:BH;font-size:96px;text-align:center;line-height:1.25}
.알약{display:inline-flex;align-items:center;gap:16px;background:#fff;border-radius:999px;padding:24px 46px 24px 26px;font-family:JU;font-size:42px;color:#5a4b6b;line-height:1.35}
.알약 img{width:90px;height:90px;border-radius:22px}</style>`
const 판 = (몸) => `<!doctype html><html><head>${머리}</head><body>${몸}</body></html>`
const 장면 = {
  // 🎬 표지 — 「이걸 표지로 하고 이어지게」·「효과도 주면 좋겠어」(창업자 2026-10-04) · 마지막 칸 = 표지 그대로(릴스 표지로 고른다)
  s0: { 길이: 3.4, 몸: `<div class="표바"></div><div style="position:absolute;inset:0 0 auto 0;height:900px;background:linear-gradient(180deg,rgba(25,10,45,.7),rgba(25,10,45,0))"></div>
    <div class="반짝" style="left:140px;top:300px;--at:.3s">✦</div><div class="반짝" style="left:880px;top:250px;--at:.7s">✦</div><div class="반짝" style="left:960px;top:700px;--at:1.1s">✦</div><div class="반짝" style="left:80px;top:760px;--at:1.5s">✦</div>
    <div class="내림" style="top:95px;font-family:JU;color:#ffb347;font-size:64px;--at:.05s">10월 한끼</div>
    <!-- ✏️ 창업자 2026-10-06 「b주황할게」 = 손글씨 제목(_판-레꾸자랑제목-1006 B) ＋ 금손 줄 주황 알약 -->
    <div class="내림" style="top:150px;--at:.15s"><span style="display:inline-block;font-family:SD;font-size:230px;line-height:1;color:#fff;-webkit-text-stroke:8px #ff7a1a;paint-order:stroke fill;text-shadow:0 10px 30px rgba(0,0,0,.5);transform:rotate(-3deg)">레꾸자랑</span></div>
    <div class="내림 팡" style="top:410px;--at:.55s"><span style="display:inline-block;font-family:JU;font-size:54px;color:#fff;letter-spacing:2px;padding:10px 46px;border-radius:999px;background:#ff7a1a;box-shadow:0 8px 24px rgba(0,0,0,.35)">꾸미기 금손 모십니다</span></div>
    <div class="내림 팡" style="top:510px;font-family:BH;color:#fff;font-size:100px;text-shadow:0 6px 0 #ff7a1a,0 12px 30px rgba(0,0,0,.5);--at:.85s">10.16 ~ 10.26</div>
    <div class="올림" style="--at:1.15s"><div><b style="color:#ff7a1a">①</b> 할로윈 꾸미기로 요리 사진 꾸미기</div><div><b style="color:#ff7a1a">②</b> 공유 → 인스타 → <b>DM 보내기</b></div><div><b style="color:#ff7a1a">③</b> 10월 28일 한끼 인스타에 올려드려요</div></div>` },
  // ② 공유 → 인스타 → DM — 손가락 동그라미가 차례로 «누른다»
  s2: { 길이: 3.2, 몸: `<div class="밤"></div><div class="띠"><b>②</b> 공유 → 인스타 → DM 보내기</div>
    <div class="줄"><div class="알" style="--at:.2s"><div class="그">↗</div>공유</div><div class="화" style="--at:.6s">→</div>
    <div class="알" style="--at:.9s"><div class="그">◎</div>인스타</div><div class="화" style="--at:1.3s">→</div>
    <div class="알" style="--at:1.6s"><div class="그">✈</div>DM</div></div><div class="손"></div>
    <div class="큰" style="top:1260px;font-size:52px">@annyeong_hankki 로 보내주세요</div>` },
  // ③ 올려드려요
  s3: { 길이: 3.2, 몸: `<div class="밤"></div><div class="띠"><b>③</b> 한끼 인스타에 올려드려요</div>
    <div class="카드">보내주신 할로윈 레꾸<br><b>10월 28일</b><br>한끼 인스타에 올려드려요</div>
    <img class="유령" src="${유령}">` },
}
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const pg = await (await b.newContext({ viewport: { width: 1080, height: 1920 } })).newPage()
for (const [k, s] of Object.entries(장면)) {
  await pg.setContent(판(s.몸)); await pg.waitForTimeout(600); await pg.evaluate(() => document.getAnimations().forEach((a) => a.pause()))
  for (let i = 0; i < Math.round(s.길이 * 30); i++) { await pg.evaluate((t) => document.getAnimations().forEach((a) => { a.currentTime = t }), (i / 30) * 1000); await pg.screenshot({ path: join(밖, k, 'f' + String(i).padStart(4, '0') + '.png') }) }
}
await pg.setContent(판('<div class="띠" style="top:120px"><b>①</b> 할로윈 꾸미기로 요리 사진 꾸미기</div>')); await pg.waitForTimeout(300); await pg.screenshot({ path: join(밖, 't1.png'), omitBackground: true })
await pg.setContent(판(`<div class="끝"><div class="제">10월 한끼 레꾸자랑<br><span style="color:#ffb347">10.16 ~ 10.26</span></div><span class="알약"><img src="${아이콘}"><span>App Store · Google Play 에서<br><b style="color:#3b2c4f;font-size:52px">한끼 레시피북</b> 검색</span></span></div>`)); await pg.waitForTimeout(300); await pg.screenshot({ path: join(밖, 'end.png') })
await b.close()

// ② = 창업자 폰 녹화 편집본(_shot-공유녹화편집-1004.mjs 결과) — 그림 장면 s2 대신 (창업자 2026-10-04 「우리아까만든 표지도 넣어서」)
const 공유편집 = join(앱, 'design/promo/인스타-2610/공유-인스타DM-편집.mp4')
const 길 = (p) => { try { execFileSync(FF, ['-i', p], { stdio: 'pipe' }) } catch (e) { const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(String(e.stderr)); return m[1] * 3600 + m[2] * 60 + Number(m[3]) } }
const 표지초 = 장면.s0.길이, 빨리 = 2.4, 꾸미기초 = 길(꾸미기) / 빨리, 이음 = 0.5, 끝장 = 3, s2 = 길(공유편집), s3 = 장면.s3.길이
let o = 표지초 - 이음
const f = `[0:v]fps=30,settb=AVTB,format=yuv420p[c]`
  // ✂️ 「꾸미기 과정빼자」(창업자 2026-10-04) — ① 꾸미기 장면(입력 1·2)은 안 쓴다 · 표지 → ② 폰녹화로 바로
  + `;[3:v]fps=30,settb=AVTB,format=yuv420p[s2];[4:v]fps=30,settb=AVTB,format=yuv420p[s3];[5:v]fps=30,settb=AVTB,format=yuv420p[e]`
  + `;[c][s2]xfade=transition=fade:duration=${이음}:offset=${o.toFixed(2)}[x2]`
  + `;[x2][s3]xfade=transition=slideleft:duration=${이음}:offset=${(o += s2 - 이음).toFixed(2)}[x3]`
  + `;[x3][e]xfade=transition=fade:duration=${이음}:offset=${(o += s3 - 이음).toFixed(2)},format=yuv420p[v]`
execFileSync(FF, ['-y', '-framerate', '30', '-i', join(밖, 's0', 'f%04d.png'), '-i', 꾸미기,
  '-loop', '1', '-framerate', '30', '-t', String(꾸미기초 + 1), '-i', join(밖, 't1.png'),
  '-i', 공유편집, '-framerate', '30', '-i', join(밖, 's3', 'f%04d.png'),
  '-loop', '1', '-framerate', '30', '-t', String(끝장 + 이음), '-i', join(밖, 'end.png'),
  '-filter_complex', f, '-map', '[v]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', 낼파일], { stdio: 'inherit' })
console.log('✅', 낼파일)
