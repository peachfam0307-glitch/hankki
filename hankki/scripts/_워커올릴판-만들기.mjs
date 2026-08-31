// 📤📤 **Cloudflare 에 «붙여 넣을 판»을 만든다** — 2026-08-31
//
// 🚨 왜 필요한가 = `ocr-proxy/worker.js` 를 **그대로 올리면 안 된다**(그 파일 맨 위 경고).
//    「한 묶음 = 1장」(batch) 코드가 들어 있는데 **창업자가 2026-08-13 밤에 물렸다** —
//    📮 *"그냥 1장당 1장 카운트하기로 정했어"*
//    그대로 올리면 ⑴화면 문구 「사진 1장에 1장씩 써요」가 거짓말이 되고
//                ⑵전역 900이 더 빨리 차서 그 달에 다른 사람이 못 쓴다.
//
// ⭐ 그 경고엔 «어떻게» 하라고도 적혀 있다 — *"올려야 한다면 «batch 부분을 뺀 판»을 만들어 올린다."*
//    이 판이 그걸 **손이 아니라 코드로** 한다. 손으로 지우면 다음에 또 실수한다.
//
// ⭐ 하는 일은 두 줄뿐이다 — `batch` 를 «늘 빈 값», `sameBatch` 를 «늘 거짓»으로 굳힌다.
//    그러면 아래 로직이 저절로 「사진 1장 = 1장」으로 돈다. ⛔코드를 지우지 않아 판이 안 갈린다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_워커올릴판-만들기.mjs
//   → ocr-proxy/_올릴판-worker.js 가 생긴다. **이 파일을 복붙한다.**
import { readFileSync, writeFileSync } from 'node:fs'

const 안 = new URL('../ocr-proxy/worker.js', import.meta.url)
const 밖 = new URL('../ocr-proxy/_올릴판-worker.js', import.meta.url)
let s = readFileSync(안, 'utf8')

const 바꿀것 = [
  [
    "    const batch = String(body.batch || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40)\n    let sameBatch = false\n    if (kv && batch) sameBatch = (await kv.get(`b:${uid}:${batch}`)) !== null",
    "    // 🔒 [올릴 판] 「묶음 1장」을 «끈다» — 창업자 확정 2026-08-13 = \"그냥 1장당 1장 카운트하기로 정했어\".\n    //   ⛔ 이 두 줄을 되살리지 말 것. 되살리면 화면 문구가 거짓말이 되고 전역 900이 빨리 찬다.\n    //   (원본은 저장소 ocr-proxy/worker.js · 이 판은 scripts/_워커올릴판-만들기.mjs 가 만든다)\n    const batch = ''\n    const sameBatch = false",
  ],
]

for (const [옛, 새] of 바꿀것) {
  if (!s.includes(옛)) { console.log('⛔ 못 찾았다 — worker.js 가 바뀌었다. 이 판을 고쳐야 한다.'); process.exit(1) }
  s = s.replace(옛, 새)
}

// 맨 위 경고를 «올릴 판»에 맞게 바꿔 준다 — 안 그러면 붙여넣은 사람이 또 헷갈린다
s = s.replace(
  '// 🚨🚨🚨 ═══ 이 파일을 «그대로» Cloudflare 에 올리지 말 것 ═══════════',
  '// ✅✅✅ ═══ 이 파일이 «올리는 판»이다 (자동 생성 · 손으로 고치지 말 것) ═══\n' +
  '//   📌 원본 = ocr-proxy/worker.js · 만드는 법 = node scripts/_워커올릴판-만들기.mjs\n' +
  '//   ⭐ 원본과 다른 곳은 «한 곳»뿐 — 「묶음 1장」을 껐다(창업자 확정 2026-08-13).\n' +
  '// ═══════════════════════════════════════════════════════════════════\n' +
  '// (아래는 원본 경고 그대로 — 왜 껐는지가 적혀 있다)\n' +
  '// 🚨 ═══ 원본 파일은 «그대로» Cloudflare 에 올리지 말 것 ═══════════',
)

writeFileSync(밖, s)

// ── 진짜로 꺼졌나 «재서» 확인한다 (⛔만들어놓고 안 재면 이 판이 있으나 마나다) ──
const 만든것 = readFileSync(밖, 'utf8')
const 확인 = [
  ['묶음이 꺼졌다 (batch 가 늘 빈 값)', /const batch = ''/.test(만든것)],
  ['묶음이 꺼졌다 (sameBatch 가 늘 거짓)', /const sameBatch = false/.test(만든것)],
  ['묶음 표식을 KV 에 안 쓴다', !/kv\.get\(`b:\$\{uid\}/.test(만든것)],
  ['웰컴 30 이 들어 있다', /WELCOME_FREE: 30/.test(만든것)],
  ['통 보는 눈이 들어 있다', /quota/.test(만든것) && /MONTHLY_GLOBAL - 월/.test(만든것)],
  // ⛔ 잣대를 정확히 — 설명 주석의 「AIza...」에 헛걸리면 안 된다(진짜 열쇠는 20자가 넘게 이어진다)
  ['Vision 열쇠는 서버 것만 쓴다 (파일에 박힌 열쇠 0)',
    /env\.VISION_KEY/.test(만든것) && !/AIza[0-9A-Za-z_-]{20,}/.test(만든것)],
]
let 나쁨 = 0
for (const [이름, 좋나] of 확인) { console.log(`  ${좋나 ? '✅' : '❌'} ${이름}`); if (!좋나) 나쁨++ }
console.log(나쁨 ? '\n⛔ 올리면 안 된다.' : `\n✅ 붙여넣을 파일 = hankki/ocr-proxy/_올릴판-worker.js  (${Math.round(만든것.length / 1024)}KB)`)
process.exit(나쁨 ? 1 : 0)
