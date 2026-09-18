// ✂️🎥 녹화 여섯 조각 → 릴스 한 편 (9:16) — 2026-09-19
//
// ⭐ 하는 일 = ⑴조각마다 «앱이 켜지는 앞부분»을 잘라내고 ⑵9:16 으로 여백을 채워 ⑶이어붙인다.
//   ⛔ 앞부분(스플래시·홈 대기)은 릴스에선 «군더더기»다 — 창업자 *"군더더기 빼고 딱 중요한 흐름만"*.
//      녹화는 context 를 만드는 순간 시작돼서 그 몇 초를 피할 수가 없다. 그래서 «여기서» 잘라낸다.
//   🔢 자르는 초는 눈으로 판을 보고 정한 값이다(1fps 판 → scripts 밖 판N.png). 기억으로 적지 않았다.
//
// 쓰는 법: node scripts/_영상-흐름릴스-편집-0919.mjs
import { execFileSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
const FF = join(new URL('..', import.meta.url).pathname, 'node_modules/ffmpeg-static/ffmpeg')
const 안 = process.env.IN || '/tmp/claude-0/녹화-식비흐름'
const 밖 = process.env.OUT || '/tmp/claude-0/녹화-식비흐름'
const 바탕 = '#FBF3E4'   // 🍞 식탁보 크림 — 예고 릴스와 같은 결

// [파일, 앞에서 잘라낼 초]
const 조각 = [
  ['01-①레시피-골라담기.webm', 4.0],
  ['02-②장보기-금액적기.webm', 3.0],
  ['03-③식비-배달외식.webm', 3.0],
  ['04-④식비-예산.webm', 6.5],
  ['05-⑤식비-주별달별.webm', 3.0],
  ['06-⑥냉장고-만들요리.webm', 5.5],
]
const 낱개 = []
for (const [이름, 앞] of 조각) {
  const 길 = join(안, 이름)
  if (!existsSync(길)) { console.log('  ⚠️ 없다 —', 이름); continue }
  const 나올것 = join(밖, '_잘린-' + 이름.replace('.webm', '.mp4'))
  execFileSync(FF, ['-y', '-loglevel', 'error', '-ss', String(앞), '-i', 길,
    // 📐 9:16(1080x1920) — 폰 화면은 통째로 두고 «여백»만 채운다(⛔화면을 자르지 않는다)
    '-vf', `scale=-2:1920,pad=1080:1920:(ow-iw)/2:0:${바탕},fps=30,setsar=1,format=yuv420p`,
    '-an', '-c:v', 'libx264', '-crf', '17', '-preset', 'slow', 나올것])
  낱개.push(나올것)
  console.log('  ✂️', 이름, '앞', 앞 + '초 잘라냄')
}
const 목록 = join(밖, '_이을것.txt')
writeFileSync(목록, 낱개.map((f) => `file '${f}'`).join('\n') + '\n')
const 완성 = join(밖, '릴스-식비흐름-0919.mp4')
execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 목록, '-c', 'copy', 완성])
// ⏱ 길이는 «돌려서» 얻는다 — ffmpeg 은 -i 만 주면 exit 1 이라 잡아서 읽는다
let 길이 = '?'
try { execFileSync(FF, ['-i', 완성], { stdio: ['ignore', 'pipe', 'pipe'] }) } catch (e) {
  const m = /Duration: ([0-9:.]+)/.exec(String(e.stderr || '')); if (m) 길이 = m[1]
}
console.log('✅ 완성 →', 완성, '·', 길이)
