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
const 배속 = Number(process.env.BAESOK || 1.4)   // 🐇 1.0 = 녹화 그대로 · 클수록 빠르다
// 🐇🐇 장면마다 «더» 조이는 값 — 📮 창업자 2026-09-18 = *"5초까지가 좀 느려"*
//   ⭐ 첫 5초 = ①에서 재료 셋을 하나씩 체크하는 자리. 뜻은 한 번에 읽히는데 세 번 반복이라 늘어진다.
//      그 장면만 1.6배 더 조인다(뒤 장면은 그대로 — 거기선 숫자가 바뀌는 걸 봐야 한다).
const 덧배속 = { '01': 1.6 }

const 표길 = join(안, '자를곳.json')
if (!existsSync(표길)) { console.log('⛔ 자를곳.json 이 없다 — 녹화부터 돌릴 것'); process.exit(1) }
const 조각 = JSON.parse(readFileSync(표길, 'utf8'))

const 낱개 = []
for (const { 파일, 자를초 } of 조각) {
  const 길 = join(안, 파일)
  if (!existsSync(길)) { console.log('  ⚠️ 없다 —', 파일); continue }
  const 나올것 = join(밖, '_잘린-' + 파일.replace('.webm', '.mp4'))
  const 이배속 = 배속 * (덧배속[파일.slice(0, 2)] || 1)
  execFileSync(FF, ['-y', '-loglevel', 'error', '-ss', String(자를초), '-i', 길,
    // 📐 9:16(1080x1920) — 폰 화면은 통째로 두고 «여백»만 채운다(⛔화면을 자르지 않는다)
    // 📐 녹화가 이미 1080x1920(9:16) 이다 — 여백을 채울 일이 없다(창업자 *"화면이 왜 이리 작아?"*)
    // 📐 녹화가 이미 1080x1920(9:16) 이다 — 여백을 채울 일이 없다(창업자 *"화면이 왜 이리 작아?"*)
    // 🐇 배속 = 손잡이 하나로 조인다 — 📮 창업자 2026-09-18 *"속도 더 빨리해도 돼"*
    //   ⭐ 다시 녹화하지 않고 여기서 조절한다(BAESOK=1.6 처럼 줘도 된다).
    // 📐 녹화가 «페이지 크기 그대로»(390x694) 라 회색 여백이 0 이다 — 여기서 늘리면 꽉 찬다.
    //   ⛔ 전엔 틀을 1080x1920 으로 줬는데 Playwright 이 페이지를 «안 키워서» 구석에 박혔고,
    //      그 회색까지 통째로 늘리는 바람에 화면이 계속 작았다(창업자 *"4등분되어있어"*).
    '-vf', `setpts=PTS/${이배속},scale=1080:1920:flags=lanczos,fps=30,setsar=1,format=yuv420p`,
    '-an', '-c:v', 'libx264', '-crf', '17', '-preset', 'slow', 나올것])
  낱개.push(나올것)
  console.log('  ✂️', 파일, '앞', 자를초 + '초 잘라냄 ·', 이배속.toFixed(2) + '배속')
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
