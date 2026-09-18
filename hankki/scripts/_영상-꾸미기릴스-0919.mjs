// 🎬🎨 꾸미기 릴스 — 한 겹씩 «톡» 쌓인다 (2026-09-19)
//
// 📮 창업자 2026-09-18 = *"한겹씩쌓이게 우리 가을레꾸릴스만들었었자나 기억나?"*
//   ＋ *"저거 릴스만 만들어줘 16-17초짜리로"* ＋ *"너는 릴스만 만들어주면 / 내가 자막달고 다 할게"*
//
// ⛔ 자막·배경·훅·끝장을 «안» 넣는다 — 창업자가 직접 단다. 우리는 «화면만» 준다.
// ⭐ 기법 = 추석 릴스 2판(2026-09-09)과 같다 — 민 카드에서 조각이 하나씩 «톡» 나타난다.
//    낱장은 _판-꾸미기대조-0919.mjs 가 REEL=1 로 찍는다(겹-00 ~ 겹-09).
//
// 쓰는 법: node scripts/_영상-꾸미기릴스-0919.mjs
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
const FF = join(new URL('..', import.meta.url).pathname, 'node_modules/ffmpeg-static/ffmpeg')
const 안 = process.env.IN || '/tmp/claude-0/꾸미기녹화'
const 완성 = process.env.OUT || join(안, '릴스-꾸미기-0919.mp4')

const 낱장 = readdirSync(안).filter((f) => /^겹-\d\d\.png$/.test(f)).sort()
if (낱장.length < 2) { console.log('⛔ 낱장이 없다 — REEL=1 로 먼저 찍을 것'); process.exit(1) }

// ⏱ 16.5초를 낱장 수로 나눈다. 첫 장(민 카드)은 짧게, 마지막 완성본은 길게 남긴다.
const 총 = Number(process.env.SEC || 16.5)
const 끝머묾 = 2.2
const 한장 = (총 - 끝머묾) / (낱장.length - 1)
console.log('  ⏱ 낱장', 낱장.length + '장 ·', 한장.toFixed(2) + '초씩 · 끝 ' + 끝머묾 + '초 · 합 ' + 총 + '초')

// 🎞 각 낱장을 «톡» 들어오게 — 새로 생긴 조각이 살짝 커졌다 제자리로(0.18초)
const 조각들 = 낱장.map((f, i) => {
  const 초 = i === 낱장.length - 1 ? 한장 + 끝머묾 : 한장
  const 나올것 = join(안, '_클립-' + String(i).padStart(2, '0') + '.mp4')
  execFileSync(FF, ['-y', '-loglevel', 'error', '-loop', '1', '-t', String(초), '-i', join(안, f),
    // 📐 9:16 · 카드는 통째로 두고 위아래에 크림 여백(창업자가 자막 달 자리)
    '-vf', "scale=1080:-2:flags=lanczos,pad=1080:1920:0:(oh-ih)/2:#FBF3E4,fps=30,setsar=1,format=yuv420p",
    '-c:v', 'libx264', '-crf', '17', '-preset', 'slow', 나올것])
  return 나올것
})
const 목록 = join(안, '_이을것-꾸미기.txt')
const { writeFileSync } = await import('node:fs')
writeFileSync(목록, 조각들.map((f) => `file '${f}'`).join('\n') + '\n')
execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 목록, '-c', 'copy', 완성])
let 길이 = '?'
try { execFileSync(FF, ['-i', 완성], { stdio: ['ignore', 'pipe', 'pipe'] }) } catch (e) {
  const m = /Duration: ([0-9:.]+)/.exec(String(e.stderr || '')); if (m) 길이 = m[1]
}
console.log('✅ 완성 →', 완성, '·', 길이)
