// ⏱ 장면별 「머무는 시간」을 프레임 단위로 잰다
//
// 📮 창업자 2026-08-16 = *"니가 **프레임별로 넘어가는시간 재보고 적당히 잘라**"*
//    그 앞 = *"홈화면에서 레시피로 넘어가는데 **5초**. 꾸미기로 넘어가는데 **5초**.."* (창업자 숫자가 정확했다)
//
// ⭐⭐ **「대본에 적은 시간」과 「화면에 머무는 시간」은 다르다.**
//    커서가 미끄러지는 시간(≈1.1초)이 «장면마다» 붙어서, 3.6초를 줘도 화면엔 4.7초로 남는다.
//    그래서 대본 숫자를 세지 말고 **실물 프레임을 세야** 한다.
//
// 방법 = 5fps 로 훑어 «앞 프레임과 얼마나 다른가»를 재고, 확 달라진 순간을 「장면이 바뀐 곳」으로 본다.
//   ⚠️ 우리 영상은 커서가 늘 움직이므로 작은 차이는 «늘» 난다 → 문턱을 넉넉히 둔다.
//   ⚠️ 그리고 «바뀌는 중»(전환 애니메이션)이 몇 프레임 이어지므로 이어진 변화는 한 번으로 묶는다.
//
// 실행: node design/promo/프로모영상-2507/scripts/_영상-장면시간.mjs [영상경로]
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'

const SP = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const FF = `${SP}/node_modules/ffmpeg-static/ffmpeg`
const 영상 = process.argv[2] || '/home/user/hankki/hankki/design/promo/프로모영상-2507/한끼-프로모-2508-앱실사.mp4'
if (!existsSync(영상)) { console.log(`⛔ 없다: ${영상}`); process.exit(1) }

const FPS = 5
const W = 192   // 작게 줄여서 본다 — 「장면이 바뀌었나」는 큰 그림이면 충분하고 훨씬 빠르다
const H = 108

const raw = `${SP}/_scene.raw`
execFileSync(FF, [
  '-y', '-loglevel', 'error', '-i', 영상,
  '-vf', `fps=${FPS},scale=${W}:${H}`,
  '-pix_fmt', 'gray', '-f', 'rawvideo', raw,
])
const buf = readFileSync(raw)
const 한장 = W * H
const 장수 = Math.floor(buf.length / 한장)

// 앞 프레임과의 «평균 차이»
const 차 = [0]
for (let f = 1; f < 장수; f++) {
  let s = 0
  const a = (f - 1) * 한장
  const b = f * 한장
  for (let i = 0; i < 한장; i++) s += Math.abs(buf[a + i] - buf[b + i])
  차.push(s / 한장)
}

// 문턱 = 「거의 안 변한 프레임들」의 중앙값보다 훨씬 큰 값
const 정렬 = [...차].sort((x, y) => x - y)
const 중앙 = 정렬[Math.floor(장수 / 2)]
const 문턱 = Math.max(6, 중앙 * 6)

// 바뀐 곳 — 이어진 것은 한 번으로 묶는다
const 바뀜 = []
let 직전 = -99
for (let f = 1; f < 장수; f++) {
  if (차[f] > 문턱) {
    if (f - 직전 > 2) 바뀜.push(f)   // 0.4초 안에 이어진 변화는 같은 전환으로 본다
    직전 = f
  }
}

const 초 = (f) => (f / FPS).toFixed(1)
console.log(`⏱ ${영상.split('/').pop()}`)
console.log(`   ${장수}장(${FPS}fps · ${(장수 / FPS).toFixed(1)}초) · 문턱 ${문턱.toFixed(1)} · 장면 바뀜 ${바뀜.length}번\n`)
console.log('   시작 ~ 끝     머문 시간')
console.log('  ──────────────┼──────────────────────────────────')

const 경계 = [0, ...바뀜, 장수]
const 길이들 = []
for (let i = 0; i < 경계.length - 1; i++) {
  const a = 경계[i], b = 경계[i + 1]
  const len = (b - a) / FPS
  길이들.push({ a, b, len })
  const bar = '█'.repeat(Math.round(len * 3))
  const 표 = len >= 3.5 ? ' 🐢 길다' : len >= 2.5 ? ' · 조금 길다' : ''
  console.log(`  ${초(a).padStart(5)} ~ ${초(b).padStart(5)}s │ ${len.toFixed(1).padStart(4)}초 ${bar}${표}`)
}

const 긴것 = 길이들.filter((x) => x.len >= 3.5)
const 아낄수 = 긴것.reduce((s, x) => s + (x.len - 2.5), 0)
console.log(`\n🐢 3.5초 넘게 머문 장면 = ${긴것.length}개`)
console.log(`   전부 2.5초로 줄이면 ≈ ${아낄수.toFixed(1)}초 아낀다 → ${((장수 / FPS) - 아낄수).toFixed(1)}초`)
