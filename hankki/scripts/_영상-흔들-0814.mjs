// 🎥 창업자 영상에서 «무엇이 흔들리나»를 프레임마다 «숫자로» 잰다
//    📮 창업자 2026-08-14 *"해결안됐어 찍어줘?"* → 12.4초 · 1080×2340 · 114fps 화면 녹화
//
// ⭐⭐ 갈림길이 «하나»다 — **하단바도 같이 움찔거리나.**
//    · 하단바도 움직인다 → 막대 문제가 아니라 **앱 상자가 숨쉬는 것**(주소창 접힘에 높이가 따라간다)
//    · 막대만 움직인다   → 막대를 붙이는 방식이 아직 문제
//
// ⛔ 눈으로 보면 놓친다 — 114fps 라 1~2프레임짜리 튐은 사람 눈에 「덜덜」로만 남는다.
//    📌 그래서 프레임마다 «자리»를 재서 프레임 사이 «차이»를 본다.
//
// 재는 것 셋 (전부 픽셀에서 직접)
//   ① 하단바 윗변  = 화면 아래쪽에서 «가로로 쭉 이어진 경계»를 찾는다
//   ② 회색 막대    = 오른쪽 끝 기둥에서 «주변보다 어두운 짧은 토막»
//   ③ 내용         = 가운데 가로줄 한 줄을 이전 프레임과 맞춰 몇 px 굴렀나
//
// ⛔ 프레임을 통째로 메모리에 올리면 죽는다 — 3초 × 114fps × 1080×2340 = **864MB**(실제로 죽었다).
//    ✅ 그래서 ⑴raw 를 «파일»로 흘리고 ⑵필요한 «띠»만 잘라서 읽는다.
//       잘라도 되는 이유 = 재는 게 셋뿐이고 전부 자리가 정해져 있다(오른쪽 끝 · 아래쪽 · 가운데 기둥).
import { spawnSync } from 'node:child_process'
import { writeFileSync, openSync, readSync, closeSync, statSync, unlinkSync } from 'node:fs'

const FF = process.env.FFMPEG || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/ffm/node_modules/ffmpeg-static/ffmpeg'
const V = process.argv[2]
const 시작 = process.argv[3] || '0'
const 길이 = process.argv[4] || '12.5'
if (!V) { console.error('쓰기: node _영상-흔들-0814.mjs <영상> [시작초] [길이초]'); process.exit(1) }

// ⭐ 가로는 그대로 둔다(막대가 오른쪽 «끝»이라 가로를 줄이면 뭉개진다). 세로도 그대로 — 대신 파일로.
const W = 1080, H = 2340
const FPS = 60 // 114 를 다 볼 필요는 없다 — 창업자 눈에 보이는 덜덜은 여러 px 짜리다
const RAW = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/raw.gray'
const r = spawnSync(FF, [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-ss', 시작, '-t', 길이, '-i', V,
  '-vf', `fps=${FPS},format=gray`, '-f', 'rawvideo', '-pix_fmt', 'gray', RAW,
])
if (r.status !== 0) { console.error(r.stderr.toString().slice(0, 800)); process.exit(1) }
const 프레임크기 = W * H
const N = Math.floor(statSync(RAW).size / 프레임크기)
console.log(`\n🎥 프레임 ${N}장 (${시작}초부터 ${길이}초 · ${FPS}fps · ${W}×${H} 회색조)\n`)

// 한 프레임씩만 메모리에 둔다
const fd = openSync(RAW, 'r')
const 한장 = Buffer.allocUnsafe(프레임크기)
let 실린프레임 = -1
const 싣기 = (f) => { if (f !== 실린프레임) { readSync(fd, 한장, 0, 프레임크기, f * 프레임크기); 실린프레임 = f } }
// ⚠️ 두 프레임을 «동시에» 봐야 하는 곳(굴림)이 있어 이전 프레임은 따로 담는다
const 지난장 = Buffer.allocUnsafe(프레임크기)
let 실린지난 = -1
const 싣기2 = (f) => { if (f !== 실린지난) { readSync(fd, 지난장, 0, 프레임크기, f * 프레임크기); 실린지난 = f } }
const px = (f, x, y) => { 싣기(f); return 한장[y * W + x] }
const px2 = (f, x, y) => { 싣기2(f); return 지난장[y * W + x] }

// ① 하단바 윗변 — 아래쪽 500px 안에서 «위아래 밝기 차»가 제일 큰 가로줄
//    ⚠️ 한 기둥만 보면 글자·아이콘에 속는다 → 가로로 여러 곳을 «평균»낸다
const 하단바윗변 = (f) => {
  const xs = [120, 260, 400, 540, 680, 820, 960]
  let 최고 = -1, 자리 = -1
  for (let y = H - 500; y < H - 40; y++) {
    let 위 = 0, 아래 = 0
    for (const x of xs) { 위 += px(f, x, y - 6); 아래 += px(f, x, y + 6) }
    const 차 = Math.abs(위 - 아래) / xs.length
    if (차 > 최고) { 최고 = 차; 자리 = y }
  }
  return { y: 자리, 세기: Math.round(최고) }
}

// ② 회색 막대 — 오른쪽 끝에서 «주변보다 어두운» 짧은 토막의 가운데
//    ⭐ 막대는 폭 3px·불투명도 0.38 이라 «살짝» 어둡다 → 같은 y 의 «왼쪽 배경»과 견준다
const 막대 = (f) => {
  let 최고 = -1, x막대 = -1
  // 어느 기둥에 막대가 있나 먼저 찾는다(기기마다 오른쪽 여백이 다르다)
  for (let x = W - 60; x < W - 4; x++) {
    let 합 = 0
    for (let y = 300; y < H - 400; y += 4) 합 += Math.max(0, px(f, x - 40, y) - px(f, x, y))
    if (합 > 최고) { 최고 = 합; x막대 = x }
  }
  // 그 기둥에서 «어두운 구간»의 위·아래 끝
  const 어둡나 = (y) => px(f, x막대 - 40, y) - px(f, x막대, y) > 6
  let 위 = -1, 아래 = -1
  for (let y = 200; y < H - 300; y++) if (어둡나(y)) { if (위 < 0) 위 = y; 아래 = y }
  return { x: x막대, 위, 아래, 길이: 아래 - 위, 가운데: 위 < 0 ? -1 : (위 + 아래) / 2 }
}

// ③ 내용이 몇 px 굴렀나 — 가운데 세로 기둥을 이전 프레임과 맞춰 본다
const 굴림 = (f, g) => {
  const x = 300, y0 = 700, y1 = 1700
  let 최고 = -1, 답 = 0
  for (let d = -260; d <= 260; d += 2) {
    let 합 = 0, n = 0
    for (let y = y0; y < y1; y += 3) {
      const yy = y + d
      if (yy < 100 || yy > H - 400) continue
      합 += Math.abs(px(f, x, y) - px2(g, x, yy)); n++
    }
    const 점수 = -합 / Math.max(1, n)
    if (점수 > 최고) { 최고 = 점수; 답 = d }
  }
  return 답
}

const 줄 = []
for (let f = 0; f < N; f++) {
  const nav = 하단바윗변(f)
  const b = 막대(f)
  줄.push({ f, 초: +(f / 114.29 + +시작).toFixed(3), nav: nav.y, navSe: nav.세기, barX: b.x, bar: b.가운데, barLen: b.길이 })
}
// 굴림은 이웃 프레임끼리
for (let i = 1; i < 줄.length; i++) 줄[i].굴림 = 굴림(i, i - 1)

const 값 = (k) => 줄.map((x) => x[k]).filter((v) => v > 0)
const 가짓수 = (k) => new Set(값(k)).size
console.log('📊 프레임 내내 이 값들이 얼마나 흔들렸나\n')
for (const [k, 이름] of [['nav', '하단바 윗변'], ['barX', '막대 기둥(x)'], ['barLen', '막대 길이']]) {
  const v = 값(k)
  const mn = Math.min(...v), mx = Math.max(...v)
  console.log(`   ${mx - mn > 2 ? '⛔' : '✅'} ${이름} : ${mn} ~ ${mx} (폭 ${mx - mn}px · ${가짓수(k)}가지)`)
}

writeFileSync('/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/흔들.json', JSON.stringify(줄))
console.log('\n📄 프레임별 값 = scratchpad/흔들.json')

// ⭐ 「하단바가 움직인 순간」을 뽑아 보여준다 — 이게 갈림길이다
const 튐 = []
for (let i = 1; i < 줄.length; i++) {
  const d = 줄[i].nav - 줄[i - 1].nav
  if (Math.abs(d) > 2) 튐.push({ 초: 줄[i].초, 하단바: `${줄[i - 1].nav} → ${줄[i].nav}`, 차: d, 그때굴림: 줄[i].굴림 })
}
console.log(`\n🚨 하단바가 «2px 넘게» 튄 순간 : ${튐.length}번`)
for (const t of 튐.slice(0, 25)) console.log('   ', JSON.stringify(t))
if (튐.length > 25) console.log(`    … 그리고 ${튐.length - 25}번 더`)
