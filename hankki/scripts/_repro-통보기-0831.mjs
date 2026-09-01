// 📊📊 재현 — 「이번 달 몇 건 / 900」 · 「오늘 몇 편 / 200」 운영자 통로 (창업자 확정 2026-08-31) 〔반영됨〕
//
// 📮 창업자 = *"worker에 「이번 달 몇 건 / 900」을 운영자만 보는 길 하나 만들자 — **이건 꼭 해야해**"*
//            → *"tidy도 붙여줘"*
//
// ⭐⭐ 이 판이 지키는 것 = **「열쇠 없이는 못 본다」 ＋ 「본 값이 진짜 카운터다」**
//   ⛔ 통계 창구는 «열어두면 남이 우리 사용량을 들여다본다». 그래서 열쇠 검사가 심장이다.
//   ⛔ 그리고 값이 «다른 칸»에서 오면 0으로 보인다 — 세는 키와 읽는 키가 같아야 한다.
//
// ⚠️ 워커는 Cloudflare 런타임이라 여기서 못 돌린다 → **파일에서 그 부분만 떼어** 흉내 KV 로 돌린다.
//    (기존 `_repro-웰컴20-0813.mjs` 와 같은 방식이다)
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-통보기-0831.mjs
import { readFileSync } from 'node:fs'

let 통과 = 0, 전체 = 0
const chk = (이름, 좋나, 덧 = '') => { 전체++; if (좋나) 통과++; console.log(`  ${좋나 ? '✅' : '❌'} ${이름}${덧 ? '  ' + 덧 : ''}`) }

const OCR = readFileSync(new URL('../ocr-proxy/worker.js', import.meta.url), 'utf8')
const TIDY = readFileSync(new URL('../ocr-proxy/worker-tidy.js', import.meta.url), 'utf8')

console.log('\n📊 「통 보는 눈」 — 두 워커\n')

// ── ① 열쇠 없이는 못 본다 (제일 중요) ────────────────────────────────
for (const [이름, 글] of [['OCR', OCR], ['다듬기', TIDY]]) {
  // ⛔⛔ [2026-09-01] 잣대를 옮겼다 — 전엔 「quota 라는 «낱말»이 처음 나오는 자리」로 창을 잘랐는데
  // 워커 «머리말»에 그 낱말이 들어가자 창이 통째로 주석으로 미끄러져 셋이 죽었다(규칙 18 ⓘ).
  // ✅ 이제 «진짜 길»(searchParams 로 quota 를 읽는 그 줄)에 못 박는다 — 주석이 늘어도 안 흔들린다.
  const 길 = 글.indexOf("searchParams.get(\x27quota\x27)")
  const 칸 = 글.slice(길 - 400, 길 + 1600)
  chk(`① ${이름} — 열쇠가 틀리면 401 로 막는다`,
    /준열쇠 !== env\.FOUNDER_SECRET.*401/s.test(칸))
  chk(`①-b ${이름} — 열쇠가 «서버 비밀»과 대조된다 (앱 토큰이 아니다)`,
    /env\.FOUNDER_SECRET/.test(칸))
}

// ── ② 세는 키와 읽는 키가 «같은 칸»인가 ──────────────────────────────
//    ⛔ 여기가 갈리면 화면엔 늘 0 이 뜬다 — 제일 조용한 사고다.
const OCR읽기 = /num\(kvq, `m:\$\{ymq\}`\)/.test(OCR) && /num\(kvq, `d:\$\{ymdq\}`\)/.test(OCR)
const OCR세기 = /inc\(kv, `m:\$\{ym\}`/.test(OCR) && /inc\(kv, `d:\$\{ymd\}`/.test(OCR)
chk('② OCR — 읽는 키(m:·d:)가 세는 키와 같다', OCR읽기 && OCR세기)

const TIDY읽기 = /num\(kvq, `td:\$\{날\}`\)/.test(TIDY)
const TIDY세기 = /td:\$\{ymd\}|통세기\(kv, ymd\)/.test(TIDY)
chk('②-b 다듬기 — 읽는 키(td:)가 세는 키와 같다', TIDY읽기 && TIDY세기)

// ⏰ 시간 잣대도 «세는 쪽»과 같아야 한다 — OCR 은 UTC, 다듬기는 KST 로 센다(각자 그렇게 굳어 있다)
chk('②-c OCR — 시간 잣대가 UTC 로 «세는 쪽»과 같다',
  /const t = new Date\(\)\n\s+const ymq = t\.toISOString\(\)/.test(OCR),
  '(여기만 KST 로 바꾸면 달 바뀔 때 0 으로 보인다)')
chk('②-d 다듬기 — 시간 잣대가 KST 로 «세는 쪽»과 같다', /const 날 = kstDay\(new Date\(\)\)/.test(TIDY))

// ── ③ 이 길이 «돈을 안 쓴다» ─────────────────────────────────────────
const OCR칸 = OCR.slice(OCR.indexOf("quota") - 200, OCR.indexOf("if (request.method !== 'POST')"))
chk('③ OCR — 이 길에서 Vision 을 안 부른다', !/VISION_URL|fetch\(`\$\{VISION_URL/.test(OCR칸))
const TIDY칸 = TIDY.slice(TIDY.indexOf("quota") - 200, TIDY.indexOf("if (request.method !== 'POST')"))
chk('③-b 다듬기 — 이 길에서 AI 를 안 부른다', !/env\.AI\.run|\.run\(/.test(TIDY칸))

// ── ④ 폰에서 열 수 있나 (GET ＋ ?key=) ───────────────────────────────
//    ⛔ 폰 브라우저는 헤더를 못 붙인다 — 그래서 이 길만 예외로 열어 뒀다.
for (const [이름, 글] of [['OCR', OCR], ['다듬기', TIDY]]) {
  const i = 글.indexOf("searchParams.get(\x27quota\x27)")   // ⭐ 위와 «같은» 잣대
  const 앞 = 글.slice(0, i)
  chk(`④ ${이름} — method 검사보다 «먼저» 온다 (GET 으로 열린다)`,
    !/if \(request\.method !== 'POST'\)/.test(앞.slice(앞.lastIndexOf('async fetch'))))
  chk(`④-b ${이름} — 헤더가 없으면 ?key= 로도 받는다`,
    /searchParams\.get\('key'\)/.test(글.slice(i - 400, i + 1200)))
}

// ── ⑤ 유저별 값은 «안» 준다 ──────────────────────────────────────────
//    ⛔ 「누가 몇 개 썼나」는 볼 이유가 없고, 보면 그게 곧 개인정보다.
chk('⑤ OCR — 유저별(u:·w:) 값을 안 내보낸다',
  !/u:\$\{|w:\$\{/.test(OCR.slice(OCR.indexOf('quota'), OCR.indexOf("if (request.method !== 'POST')"))))

// ── ⑥ KV 가 없을 때 «0 이라고 말하지 않는다» ─────────────────────────
chk('⑥ 다듬기 — KV 가 없으면 «모른다»고 말한다 (0 이라고 하지 않는다)',
  /KV 가 안 붙어 있어 셀 수가 없어요/.test(TIDY))

console.log(`\n🔢 ${통과}/${전체}`)
if (통과 !== 전체) { console.log('\n⛔ 통 보는 눈이 어긋난다.'); process.exit(1) }
console.log('✅ 열쇠 없이는 못 보고, 보는 값이 진짜 카운터다.')
