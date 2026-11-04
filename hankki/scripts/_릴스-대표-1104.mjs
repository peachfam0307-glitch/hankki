// 🎬 대표 홍보 릴스 「아직도 우리 앱을 모르세요???」 이어 붙이기 (2026-11-04)
//   재료 = design/promo/대표릴스-2611/장면영상/장면N.mp4 (0번은 로고 합성판) · 8번 = 앱 홈 추석→핼러윈 녹화
//   자막 = 창업자 확정 문장(docs/릴스-왜아직도안쓰세요-2026-11-04-스토리보드.md 맨 아래) — 글자는 AI 가 아니라 여기서 얹는다
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname
const IN = join(ROOT, 'design/promo/대표릴스-2611/장면영상')
const W = process.argv[2] || '/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad/대표릴스/조립'
mkdirSync(W, { recursive: true })
const 자막 = [
  ['0', '아직도 우리 앱을', '모르세요???'],
  ['1', '한끼는 아직 100일도 안 된', '아기 앱이지만요,'],
  ['2', '매주 새 레시피가', '올라오고'],
  ['3', '귀여운 친구들로 MZ 감성', '꾸미기와 일기를 쓰고'],
  ['4', '꽂이로 구별해 꽂고,', '메모로 나만의 레시피를 저장하고'],
  ['5', '고딩 키우는 주부가', '써 본 템도 추천받고'],
  ['6', '식비 가계부랑', '장보기까지 한 번에 하고'],
  ['7', '레시피를 귀여운 카드로 친구들과', '공유할 수도 있어요. 신박 그 자체'],
  ['8', '추석, 핼러윈엔', '홈 테마도 이렇게 바뀌었어요.'],
  ['9', '한끼 가족이 많아지면 레시피, 살림템도', '나누는 공간을 만들고 싶은 꿈이 있어요.'],
  ['10', '이렇게 좋은 앱,', '아직도 안 쓰실 거예요?'],
]
// ⛔ setContent 페이지는 file:// 를 못 읽는다(1판에서 글꼴·그림이 다 빠졌다) → data: 로 넣는다
const 데이터 = (f, t) => `data:${t};base64,` + readFileSync(join(ROOT, f)).toString('base64')
const 글꼴 = 데이터('src/assets/fonts/blackhansans-korean-400.woff2', 'font/woff2')
const 아이콘 = 데이터('public/icons/icon-512-v7.png', 'image/png')
const 로고 = 데이터('src/assets/logo-hankki-cream.png', 'image/png')
const css = `@font-face{font-family:BH;src:url(${글꼴})}html,body{margin:0;width:1080px;height:1920px;background:transparent}
.cap{position:absolute;left:30px;right:30px;bottom:260px;text-align:center;font-family:BH;line-height:1.1}
.cap span{display:inline-block;white-space:nowrap;border-radius:26px}
.l1{font-size:74px;color:#fff;background:#3B2C25;padding:16px 36px 20px;box-shadow:0 12px 0 #1f1713}
.l2{font-size:84px;color:#3B2C25;background:#FFEDAB;padding:14px 36px 18px;margin-top:20px;box-shadow:0 12px 0 #d9b02c}`
const 맞추기 = `for(const s of document.querySelectorAll('.cap span')){let f=parseFloat(getComputedStyle(s).fontSize);while(s.offsetWidth>1010&&f>30){f-=2;s.style.fontSize=f+'px'}}`
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } })
for (const [n, a, c] of 자막) {
  await p.setContent(`<style>${css}</style><div class=cap><span class=l1>${a}</span><br><span class=l2>${c}</span></div>`)
  await p.evaluate(맞추기); await p.evaluate(() => document.fonts.ready)
  await p.screenshot({ path: join(W, `자막${n}.png`), omitBackground: true })
}
// 끝 장 — 로고 + 「지금 바로 깔아 보세요!」 + 두 스토어 알약(꼬르곰 아이콘 앞)
await p.setContent(`<style>${css}
body{background:#FFFDF7}.end{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:BH;color:#3B2C25}
.end img.lg{width:640px}.end .t{font-size:100px;margin-top:40px}
.pill{display:flex;align-items:center;gap:22px;margin-top:70px;background:#3B2C25;color:#fff;border-radius:999px;padding:22px 44px 22px 22px;font-size:46px;font-family:system-ui,sans-serif;font-weight:700}
.pill img{width:96px;height:96px;border-radius:24px}</style>
<div class=end><img class=lg src="${로고}"><div class=t>지금 바로 깔아 보세요!</div>
<div class=pill><img src="${아이콘}"><span>App Store · Google Play 에서<br>「한끼 레시피북」 검색</span></div></div>`)
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300)
await p.screenshot({ path: join(W, '끝장.png') })
await b.close()
// 장면마다 자막 얹기 → 1080×1920 · 30fps · 2.4초(9번만 3초)
const ff = (...a) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...a])
const 조각 = []
for (const [n] of 자막) {
  const src = n === '0' ? join(IN, '장면0-로고.mp4') : n === '8' ? join(IN, '장면8-앱홈.mp4') : join(IN, `장면${n}.mp4`)
  const 길이 = n === '9' || n === '7' ? '3' : '2.4'
  const out = join(W, `조각${n}.mp4`)
  ff('-i', src, '-i', join(W, `자막${n}.png`), '-filter_complex', '[0]scale=1080:1920,setsar=1,fps=30[v];[v][1]overlay=0:0,format=yuv420p', '-t', 길이, '-an', out)
  조각.push(out)
}
const 끝 = join(W, '조각끝.mp4')
ff('-loop', '1', '-t', '2.5', '-i', join(W, '끝장.png'), '-vf', "scale=1080:1920,setsar=1,fps=30,zoompan=z='min(1+0.0008*on,1.05)':d=1:s=1080x1920:fps=30,format=yuv420p", '-an', 끝)
조각.push(끝)
writeFileSync(join(W, 'list.txt'), 조각.map((f) => `file '${f}'`).join('\n'))
ff('-f', 'concat', '-safe', '0', '-i', join(W, 'list.txt'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30', join(W, '대표릴스-1판.mp4'))
console.log('✅', join(W, '대표릴스-1판.mp4'))
