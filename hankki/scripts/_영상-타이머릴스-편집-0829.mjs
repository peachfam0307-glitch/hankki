// ✂️🎬 **4화 「요리 타이머 폭발물 처리반」 — 릴스 편집판**
//
// 📮 창업자 2026-08-29 지시 셋 =
//    ① *"처음에 화면이 지지직? 거려."* → *"**번쩍번쩍 거렸어 초반에**"*
//    ② *"군더더기 장면은 버리고, 요리모드에서 몇번은 넘겨서 다음화면 보여주고, 2번으로 진행."*
//    ③ *"3번"*(＝병맛 시안 붙이기) → *"3번 어제 줬는데 또없어???????????"*
//
// ⛔⛔ **①②는 «녹화 대본»(`_영상-타이머릴스-0829.mjs`)이 고쳤다. 이 파일은 ③과 마무리만 한다.**
//    · ① 녹화 크기를 viewport×2 로 맞춰 «줄이는 계산»을 없앴다 ＋ 로딩 구간 초를 남긴다
//    · ② 걸음 두 번 더 넘김 ＋ 상세에 다시 안 머문다
//
// ⭐⭐ **시안을 «앞뒤»에 붙이는 이유** — 앱 화면만으로는 「그래서 뭐가 좋은데」가 안 읽힌다.
//    시안이 그 말을 대신한다(*"요리는 감이 아니라 타이밍입니다"* ＋ Play스토어 안내까지 이미 그려져 있다).
//    ⛔ 그래서 **자막을 따로 얹지 않는다** — 얹으면 시안이 하는 말과 두 번 말하게 된다.
//
// ⛔ 폰트는 `design/promo/fonts` 에 **woff2 뿐**이라 ffmpeg 자막(ttf 필요)에 못 쓴다.
//    자막이 꼭 필요해지면 그때 ttf 를 받는다. 지금은 시안이 그 몫을 한다.
//
// 실행: node /home/user/hankki/hankki/scripts/_영상-타이머릴스-편집-0829.mjs
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { createRequire } from 'node:module'

const require_ = createRequire(import.meta.url)
const FF = require_('ffmpeg-static')
const ROOT = new URL('..', import.meta.url).pathname
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/릴스'
const 시안 = join(ROOT, 'design/promo/병맛시리즈-창업자-2026-08-28/난리났습니다-8화/4화-요리타이머-폭발물처리반.png')
const 원본 = join(OUT, '4화-타이머-앱실사.webm')

// 📐 인스타 릴스 = **1080×1920**(9:16). ⛔다른 비율로 올리면 인스타가 «제멋대로» 잘라낸다.
const W = 1080, H = 1920, FPS = 30
const 인트로초 = 2.8, 아웃트로초 = 2.0

for (const f of [시안, 원본]) if (!existsSync(f)) { console.error(`✗ 없다: ${f}`); process.exit(1) }
mkdirSync(join(OUT, '편집'), { recursive: true })

// ⏱ 「어디부터가 진짜인가」는 **녹화 대본이 남긴 값**을 읽는다 — ⛔손으로 옮겨 적으면 다시 찍을 때 낡는다
let 잘라낼초 = 0
try { 잘라낼초 = JSON.parse(readFileSync(join(OUT, '자를지점.json'), 'utf8')).잘라낼초 } catch {}
if (!잘라낼초) { console.error('✗ 자를지점.json 이 없다 — 녹화 대본을 먼저 돌린다'); process.exit(1) }
// ⭐ webm 타임스탬프와 벽시계가 딱 맞진 않는다 → **0.4초 더** 자른다(모자라면 번쩍임이 남는다)
const 자르기 = (잘라낼초 + 0.4).toFixed(2)

const ff = (args) => execFileSync(FF, ['-y', '-v', 'error', ...args], { stdio: ['ignore', 'pipe', 'inherit'] })

// ── ① 시안을 릴스 판에 앉힌다 ──
// ⭐ 시안은 **4:5**(1122×1402)이고 릴스는 9:16 이라 위아래가 남는다.
//    ⛔ 잘라 맞추면 제목이나 Play스토어 줄이 날아간다 → **폭을 맞추고 남는 데는 시안의 «자기 배경색»으로 채운다.**
//    바탕색은 시안 모서리에서 «직접 뽑는다»(손으로 적으면 다른 화 시안에서 어긋난다).
const 바탕 = execFileSync(FF, ['-v', 'error', '-i', 시안,
  '-vf', 'crop=8:8:4:4,scale=1:1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 20 })
const 배경색 = `0x${[...바탕.subarray(0, 3)].map((v) => v.toString(16).padStart(2, '0')).join('')}`
console.log(`🎨 시안 바탕색 = ${배경색}`)

const 인트로 = join(OUT, '편집/1-인트로.mp4')
const 아웃트로 = join(OUT, '편집/3-아웃트로.mp4')
const 본편 = join(OUT, '편집/2-본편.mp4')
const 완성 = join(OUT, '4화-타이머-릴스.mp4')

const 시안필터 = `scale=${W}:-2,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:${배경색},format=yuv420p`
for (const [길이, 낼것] of [[인트로초, 인트로], [아웃트로초, 아웃트로]]) {
  ff(['-loop', '1', '-t', String(길이), '-i', 시안, '-vf', 시안필터, '-r', String(FPS),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', 낼것])
}

// ── ② 앱 실사 = 앞을 자르고 릴스 판에 앉힌다 ──
// ⭐ 앱 녹화는 **780×1688**(0.462)이라 릴스(0.5625)보다 «길쭉»하다.
//    ⛔ 폭을 맞추면 위아래가 잘려 **상단바와 하단 탭이 날아간다** — 하단 타이머 바가 이 릴스의 «심장»이라 절대 안 된다.
//    ✅ **높이를 맞추고 좌우를 채운다.**
ff(['-ss', 자르기, '-i', 원본,
  '-vf', `scale=-2:${H},pad=${W}:${H}:(ow-iw)/2:0:${배경색},format=yuv420p`,
  '-r', String(FPS), '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-an', 본편])

// ── ③ 이어 붙인다 ──
const 목록 = join(OUT, '편집/목록.txt')
require_('node:fs').writeFileSync(목록, [인트로, 본편, 아웃트로].map((f) => `file '${f}'`).join('\n'))
ff(['-f', 'concat', '-safe', '0', '-i', 목록, '-c', 'copy', 완성])

// 🔢 크기는 «만든 파일»에서 다시 읽는다(규칙 18 — 계산한 값을 결과라고 말하지 않는다)
const 크기 = (require_('node:fs').statSync(완성).size / 1024 / 1024).toFixed(2)
console.log(`\n✅ 완성 = ${완성}`)
console.log(`   ${W}×${H} · ${FPS}fps · ${크기}MB`)
console.log(`   앞 ${자르기}초(로딩·번쩍임) 잘라냄 · 인트로 ${인트로초}s ＋ 앱 실사 ＋ 아웃트로 ${아웃트로초}s\n`)
