// ✂️🎥 녹화 여섯 조각 → 릴스 한 편 (9:16) — 2026-09-19
//
// ⭐ 하는 일 = ⑴조각마다 «준비 구간»을 잘라내고 ⑵9:16 으로 여백을 채워 ⑶이어붙인다.
//
// ⛔⛔ 자르는 초를 «눈대중으로 적지 않는다» — 녹화가 `자를곳.json` 에 스스로 적어 둔 값을 읽는다.
//    📮 창업자 2026-09-18 = *"중간중간 홈으로 왔다갔다 쓸데없는 장면이 많아"*
//    🌲 뿌리 = 전 판은 내가 판(1fps 그림)을 보고 「앞 3초」 하고 손으로 적었다. 장면마다 앱 켜지는
//       시간이 달라서 그 값이 늘 어긋났고, 그 어긋난 만큼 «홈 화면»이 릴스에 남았다.
//    ✅ 이제 녹화가 「준비 끝난 시각」을 재서 넘겨준다 — 홈은 한 칸도 안 남는다.
//
// 쓰는 법: node scripts/_영상-흐름릴스-편집-0919.mjs
import { execFileSync } from 'node:child_process'
import { existsSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
const FF = join(new URL('..', import.meta.url).pathname, 'node_modules/ffmpeg-static/ffmpeg')
const 안 = process.env.IN || '/tmp/claude-0/녹화-식비흐름'
const 밖 = process.env.OUT || '/tmp/claude-0/녹화-식비흐름'
const 바탕 = '#FBF3E4'   // 🍞 식탁보 크림 — 예고 릴스와 같은 결

const 표길 = join(안, '자를곳.json')
if (!existsSync(표길)) { console.log('⛔ 자를곳.json 이 없다 — 녹화부터 돌릴 것'); process.exit(1) }
const 조각 = JSON.parse(readFileSync(표길, 'utf8'))

const 낱개 = []
for (const { 파일, 자를초 } of 조각) {
  const 길 = join(안, 파일)
  if (!existsSync(길)) { console.log('  ⚠️ 없다 —', 파일); continue }
  const 나올것 = join(밖, '_잘린-' + 파일.replace('.webm', '.mp4'))
  execFileSync(FF, ['-y', '-loglevel', 'error', '-ss', String(자를초), '-i', 길,
    // 📐 9:16(1080x1920) — 폰 화면은 통째로 두고 «여백»만 채운다(⛔화면을 자르지 않는다)
    '-vf', `scale=-2:1920,pad=1080:1920:(ow-iw)/2:0:${바탕},fps=30,setsar=1,format=yuv420p`,
    '-an', '-c:v', 'libx264', '-crf', '17', '-preset', 'slow', 나올것])
  낱개.push(나올것)
  console.log('  ✂️', 파일, '앞', 자를초 + '초 잘라냄')
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
