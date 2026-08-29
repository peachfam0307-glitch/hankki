// ✂️🚨 **4화 「요리 타이머 폭발물 처리반」 — 릴스 합성판**
//
// 📮 창업자 2026-08-29 지시 (시간순) =
//    ① *"처음에 화면이 지지직? 거려"* → *"번쩍번쩍 거렸어 초반에"*
//    ② *"군더더기 장면은 버리고, 요리모드에서 몇번은 넘겨서 다음화면 보여주고"*
//    ③ *"3번"*(＝병맛 시안 붙이기)
//    ④ *"**처리반 나올때 화면 깜빡거려**"*
//    ⑤ *"자막이나 알려주는 포인트가 없어서 무슨 내용인지 모를 것 같아"* ·
//       *"우리ui나올때 뭐가뭔지 안내해줘야 할 것 같아"* · *"좀 재밌게. 우리시안이 병맛이니까"*
//    ⑥ *"**처음에 타이머 홍보시안나올때 빨간색 불?? 사이렌처럼 그런 효과 낼 수는 없나**"*
//    ⑦ *"네가 컨셉을 잡아서 넣어야해. … 스토리보드를 만들어놓음 더 좋지"*
//
// ⛔⛔ **④ 「처리반 나올 때 깜빡」의 정체 = 그림이 아니라 «이음매»였다.**
//    🔢 인트로 구간 84프레임을 하나씩 견줘 보니 **프레임 간 차이 0** — 그림은 완전히 멎어 있었다.
//    ⭐ 진짜 원인 = 조각 셋을 따로 인코딩해 **`concat -c copy`** 로 붙인 것.
//       타임스탬프가 이어지지 않아 **재생기에서만** 툭 끊긴다(프레임을 뽑아 보면 안 보인다).
//    ✅ 이제 **한 번의 ffmpeg 안에서 filter_complex concat** 으로 통째로 인코딩한다 → 이음매가 «없다».
//    📌 규칙 18 그대로 — 「안 보인다」가 「없다」가 아니었다. **재생과 프레임 추출이 서로 다른 것을 본다.**
//
// 🎨 **컨셉 = 「긴급 출동 무전」**(창업자 ⑦ 에 답해 내가 잡았다)
//    시안이 폭발물 처리반이니 **릴스 전체를 작전 무전 보고**로 통일한다.
//    ⑥ 사이렌 = 좌우에서 **빨간 빛이 번갈아** 들어온다(⛔화면 전체를 물들이면 사이렌이 아니라 «오류 화면»으로 보인다).
//
// 📐 **레이아웃을 바꿨다 — 앱을 조금 줄이고 위에 자막 띠를 만든다.**
//    ⛔ 앱이 화면을 꽉 채우면 자막을 얹을 데가 UI 위밖에 없어 **정작 보여줄 것을 가린다.**
//    ✅ 위 250px = 자막 자리 · 아래 = 앱. **자리가 늘 같아서 눈이 자막을 찾지 않아도 된다.**
//
// 실행: node scripts/_영상-릴스자막-0829.mjs && node scripts/_영상-타이머릴스-편집-0829.mjs
import { readFileSync, existsSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { createRequire } from 'node:module'

const require_ = createRequire(import.meta.url)
const FF = require_('ffmpeg-static')
const ROOT = new URL('..', import.meta.url).pathname
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/릴스'
const 시안 = join(ROOT, 'design/promo/병맛시리즈-창업자-2026-08-28/난리났습니다-8화/4화-요리타이머-폭발물처리반.png')
const 원본 = join(OUT, '4화-타이머-앱실사.webm')
const 완성 = join(OUT, '4화-타이머-릴스.mp4')

// 📐 인스타 릴스 = 1080×1920(9:16). ⛔다른 비율이면 인스타가 제멋대로 잘라낸다.
const W = 1080, H = 1920, FPS = 30
const 자막띠 = 250          // 위쪽 자막 자리
const 아래여백 = 30
const 인트로초 = 3.0, 아웃트로초 = 2.4

for (const f of [시안, 원본]) if (!existsSync(f)) { console.error(`✗ 없다: ${f}`); process.exit(1) }
const 자막들 = JSON.parse(readFileSync(join(OUT, '자막/자막목록.json'), 'utf8'))

let 잘라낼초 = 0
try { 잘라낼초 = JSON.parse(readFileSync(join(OUT, '자를지점.json'), 'utf8')).잘라낼초 } catch {}
if (!잘라낼초) { console.error('✗ 자를지점.json 이 없다 — 녹화 대본을 먼저 돌린다'); process.exit(1) }
const 자르기 = (잘라낼초 + 0.4).toFixed(2)   // ⭐ webm 타임스탬프와 벽시계가 딱 맞진 않아 0.4초 더

// 🎨 바탕색은 시안 «모서리에서 직접 뽑는다» — 손으로 적으면 다른 화 시안에서 어긋난다
const 뽑기 = execFileSync(FF, ['-v', 'error', '-i', 시안, '-vf', 'crop=8:8:4:4,scale=1:1',
  '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 20 })
const 배경색 = `0x${[...뽑기.subarray(0, 3)].map((v) => v.toString(16).padStart(2, '0')).join('')}`

// 🚨 사이렌 — 좌우에서 빨간 빛이 «번갈아» 들어온다
//    · `sin` 이 양수일 땐 왼쪽, 음수일 땐 오른쪽 → 진짜 경광등처럼 오간다
//    · 초록·파랑을 함께 살짝 낮춰야 「빨개졌다」로 읽힌다(빨강만 올리면 그냥 밝아진다)
//    ⛔ 세게 주면 캐릭터 얼굴까지 빨개져 «사이렌»이 아니라 «화면 오류»로 보인다 → 가장자리에만, 옅게.
const 회전 = 1.3   // 초당 왕복 횟수
const 빛 = `(max(0,1-X/300)*max(0,sin(2*PI*${회전}*T)) + max(0,1-(${W}-X)/300)*max(0,-sin(2*PI*${회전}*T)))`
const 사이렌 = `geq=r='min(255, r(X,Y) + 115*${빛})':g='g(X,Y)*(1-0.24*${빛})':b='b(X,Y)*(1-0.24*${빛})'`

// ── ffmpeg 한 방 ──
const 입력 = [
  '-loop', '1', '-t', String(인트로초), '-i', 시안,          // 0 인트로
  '-ss', 자르기, '-i', 원본,                                  // 1 본편
  '-loop', '1', '-t', String(아웃트로초), '-i', 시안,        // 2 아웃트로
  ...자막들.flatMap((s) => ['-i', s.파일]),                   // 3.. 자막
]

const 시안필터 = `scale=${W}:-2,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:${배경색},${사이렌},format=yuv420p,fps=${FPS},setsar=1`
const 앱높이 = H - 자막띠 - 아래여백
const 필터 = [
  `[0:v]${시안필터}[intro]`,
  `[2:v]${시안필터}[outro]`,
  // ⭐ 앱은 «높이»를 맞춘다 — 폭을 맞추면 하단 타이머 바가 잘리는데 그게 이 릴스의 심장이다
  `[1:v]scale=-2:${앱높이},pad=${W}:${H}:(ow-iw)/2:${자막띠}:${배경색},format=yuv420p,fps=${FPS},setsar=1[app0]`,
  ...자막들.map((s, i) =>
    `[app${i}][${i + 3}:v]overlay=(W-w)/2:6:enable='between(t,${s.초},${s.끝})'[app${i + 1}]`),
  `[intro][app${자막들.length}][outro]concat=n=3:v=1:a=0[v]`,
].join(';')

console.log(`🎨 시안 바탕색 ${배경색} · 🚨 사이렌 ${회전}회/초 · 💬 자막 ${자막들.length}장`)
execFileSync(FF, ['-y', '-v', 'error', ...입력, '-filter_complex', 필터, '-map', '[v]',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-g', String(FPS * 2), '-fps_mode', 'cfr', '-r', String(FPS),
  '-movflags', '+faststart', 완성], { stdio: ['ignore', 'pipe', 'inherit'] })

const 크기 = (statSync(완성).size / 1024 / 1024).toFixed(2)
console.log(`\n✅ 완성 = ${완성}`)
console.log(`   ${W}×${H} · ${FPS}fps · ${크기}MB · 앞 ${자르기}초 잘라냄`)
console.log(`   🚨 인트로 ${인트로초}s ＋ 앱 실사(자막 ${자막들.length}) ＋ 아웃트로 ${아웃트로초}s`)
console.log(`   ⭐ 조각을 «따로 붙이지 않고» 한 번에 인코딩했다 — 이음매 깜빡임 없음\n`)
