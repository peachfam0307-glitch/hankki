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
  // 🎨 배경 판(남색 격자 ＋ 자막) 위에 «폰 화면»을 얹는다 — 창업자 2026-09-18 *"배경넣고 자막 얹자"*
  //   ⭐ 판은 _판-흐름릴스자막-0919.mjs 가 미리 찍어 둔다.
  //   ⛔ 자리 값(866x1541 · 107,311)은 «그 판과 같아야» 한다 — 한쪽만 고치면 어긋난다.
  // 📐 녹화는 «페이지 크기 그대로»(390x694) 라 회색 여백이 0 이다.
  //   ⛔ 전엔 녹화 틀을 1080x1920 으로 줬는데 Playwright 이 페이지를 «안 키워서» 구석에 박혔고,
  //      그 회색까지 통째로 늘리는 바람에 화면이 계속 작았다(창업자 *"4등분되어있어"*).
  const 판 = join(안, '배경-' + 파일.slice(0, 2) + '.png')
  const 판있나 = existsSync(판)
  execFileSync(FF, ['-y', '-loglevel', 'error',
    ...(판있나 ? ['-loop', '1', '-i', 판] : []),
    '-ss', String(자를초), '-i', 길,
    ...(판있나
      ? ['-filter_complex', `[1:v]setpts=PTS/${이배속},scale=866:1541:flags=lanczos,fps=30[폰];[0:v][폰]overlay=107:311:shortest=1,setsar=1,format=yuv420p`]
      : ['-vf', `setpts=PTS/${이배속},scale=1080:1920:flags=lanczos,fps=30,setsar=1,format=yuv420p`]),
    '-an', '-c:v', 'libx264', '-crf', '17', '-preset', 'slow', 나올것])
  낱개.push(나올것)
  console.log('  ✂️', 파일, '앞', 자를초 + '초 잘라냄 ·', 이배속.toFixed(2) + '배속', 판있나 ? '· 배경＋자막' : '')
}
// 🎬 훅(앞)·끝장(뒤) — 멈춘 판이라 몇 초 늘여서 만든다
const 멈춘판 = (이름, 초) => {
  const 판 = join(안, '배경-' + 이름 + '.png')
  if (!existsSync(판)) return null
  const 나올것 = join(밖, '_잘린-00-' + 이름 + '.mp4')
  execFileSync(FF, ['-y', '-loglevel', 'error', '-loop', '1', '-t', String(초), '-i', 판,
    '-vf', 'fps=30,setsar=1,format=yuv420p', '-c:v', 'libx264', '-crf', '17', '-preset', 'slow', 나올것])
  console.log('  🎬 멈춘 판', 이름, 초 + '초')
  return 나올것
}
const 줄줄이 = [멈춘판('훅', 1.8), ...낱개, 멈춘판('끝', 2.6)].filter(Boolean)
const 목록 = join(밖, '_이을것.txt')
writeFileSync(목록, 줄줄이.map((f) => `file '${f}'`).join('\n') + '\n')
const 완성 = join(밖, '릴스-식비흐름-0919.mp4')
execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 목록, '-c', 'copy', 완성])
// ⏱ 길이는 «돌려서» 얻는다 — ffmpeg 은 -i 만 주면 exit 1 이라 잡아서 읽는다
let 길이 = '?'
try { execFileSync(FF, ['-i', 완성], { stdio: ['ignore', 'pipe', 'pipe'] }) } catch (e) {
  const m = /Duration: ([0-9:.]+)/.exec(String(e.stderr || '')); if (m) 길이 = m[1]
}
console.log('✅ 완성 →', 완성, '·', 길이)
