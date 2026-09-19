// 🔎 꾸미기 조각 값이 «앱에 실제로 있는 것»인지 검사한다 — 조용히 기본값으로 떨어지는 사고를 막는다 (2026-09-19)
//
// ⛔⛔ 왜 = 2026-09-19 새벽에 제목 글자가 «보라색이 아니라 흰색»으로 나왔다.
//    🔢 뿌리 = color 를 'lilac' 으로 줬는데 TEXT_COLORS 의 실제 키는 **'t_lilac'** 이다
//       (Stickers.jsx — STICKER_COLORS 를 `t_` 접두어로 감싸 글자 색 목록을 만든다)
//    ⛔⛔ 그런데 DecorLayer 는 못 찾으면 **오류도 경고도 없이** TEXT_COLORS[0](흰색)으로 떨어진다.
//       `const c = TEXT_COLORS.find((t) => t.key === it.color) || TEXT_COLORS[0]`
//    📌 **틀려도 아무 말을 안 해 준다** — 그래서 눈으로 볼 때까지 몰랐다. 같은 함정이 넷 더 있다:
//       · key       — 없는 조각이면 아무것도 안 그려진다(빈 자리)
//       · motion    — 없는 이름이면 그냥 안 움직인다
//       · fx        — 없는 이름이면 StickerFx 가 null 을 낸다(효과 없음)
//       · flip/flipY — ⛔`flipX` 는 **없는 필드다**. 좌우 뒤집기는 `flip` 이다(2026-09-18 에 조용히 안 먹었다)
//
// ✅ 그래서 «찍기 전에» 이 검사를 통과시킨다. 틀린 값이 하나라도 있으면 exit 1 로 죽는다.
//
// 쓰는 법
//   node scripts/꾸미기-값검사.mjs scripts/_판-꾸미기대조-0919.mjs
//   node scripts/꾸미기-값검사.mjs --값 '[{"type":"text","color":"t_lilac"}]'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const 앱 = dirname(dirname(fileURLToPath(import.meta.url)))
const 소스 = readFileSync(join(앱, 'src/components/Stickers.jsx'), 'utf8')

// 📖 앱 소스에서 «실제로 있는 값»을 읽어 온다. ⛔여기에 목록을 손으로 적지 않는다 — 손으로 적으면 낡는다.
const 뽑기 = (재, 몇 = 1) => { const 낸 = new Set(); let m; while ((m = 재.exec(소스))) 낸.add(m[몇]); return 낸 }
const 스티커색 = [...뽑기(/\{\s*key:\s*'([a-z0-9_]+)',\s*color:\s*'#/g)]
const 글자색 = new Set(['white', 'charcoal', 'coral', 'mustard', ...스티커색.filter((k) => !['coral', 'charcoal'].includes(k)).map((k) => 't_' + k)])
const 모션 = 뽑기(/MOTIONS\s*=\s*\[[\s\S]*?\n\]/g) && (() => { const b = 소스.match(/export const MOTIONS\s*=\s*\[([\s\S]*?)\n\]/); return new Set([...(b?.[1] || '').matchAll(/key:\s*'([a-z0-9_]+)'/g)].map((m) => m[1])) })()
const 효과 = (() => { const b = 소스.match(/export const FX_KINDS\s*=\s*\[([\s\S]*?)\n\]/); return new Set([...(b?.[1] || '').matchAll(/key:\s*'([a-z0-9_]+)'/g)].map((m) => m[1])) })()
const 글씨체 = (() => { const b = 소스.match(/export const TEXT_FONTS\s*=\s*\[([\s\S]*?)\n\]/); return new Set([...(b?.[1] || '').matchAll(/key:\s*'([a-z0-9_]+)'/g)].map((m) => m[1])) })()
// 🧩 조각 이름 = 원본 PNG 가 있는 것 ＋ 코드가 그리는 벡터 조각
const 걷기 = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? 걷기(join(d, e.name)) : (e.name.endsWith('.png') ? [e.name.slice(0, -4)] : []))
const 조각 = new Set(걷기(join(앱, 'src/assets/stickers')))
const 벡터 = 뽑기(/^\s{2}([a-z][a-z0-9_]+):\s*\{\s*(?:vb|art|node)/gm)
벡터.forEach((k) => 조각.add(k))

// ⛔ 있으면 «반드시» 틀린 필드 — 조용히 무시되는 것들
const 없는필드 = { flipX: 'flip', flipy: 'flipY', rotate: 'r', scale: 's', size: 's', text_color: 'color' }

const 값읽기 = () => {
  const i = process.argv.indexOf('--값')
  if (i >= 0) return JSON.parse(process.argv[i + 1])
  const f = process.argv[2]
  if (!f) { console.error('⛔ 검사할 파일이나 --값 을 달라'); process.exit(2) }
  const t = readFileSync(join(앱, f.replace(/^hankki\//, '')), 'utf8')
  // `it: { ... }` 꼴을 통째로 긁어 «필드 이름과 문자열 값»만 본다(코드 실행은 안 한다)
  return [...t.matchAll(/it:\s*\{([^}]*)\}/g)].map((m) => {
    const o = {}
    for (const [, k, v] of m[1].matchAll(/([a-zA-Z_]+):\s*'([^']*)'/g)) o[k] = v
    for (const [, k] of m[1].matchAll(/([a-zA-Z_]+):\s*(?:true|false|-?[\d.]+|Number\()/g)) if (!(k in o)) o[k] = '(숫자/참거짓)'
    return o
  })
}

const 틀림 = []
const 본다 = (것, i) => {
  const 어디 = `${i + 1}번째 조각`
  for (const k of Object.keys(것)) if (없는필드[k]) 틀림.push(`${어디}: 필드 «${k}» 는 앱에 없다 → «${없는필드[k]}» 로 쓴다 (조용히 무시된다)`)
  if (것.type === 'text') {
    if (것.color && !글자색.has(것.color)) {
      const 비슷 = 글자색.has('t_' + 것.color) ? `«t_${것.color}»` : [...글자색].filter((c) => c.includes(것.color)).join(', ') || '(없음)'
      틀림.push(`${어디}: 글자 색 «${것.color}» 가 TEXT_COLORS 에 없다 → 흰색으로 «조용히» 떨어진다. 비슷한 것 = ${비슷}`)
    }
    if (것.font && 글씨체.size && !글씨체.has(것.font)) 틀림.push(`${어디}: 글씨체 «${것.font}» 가 TEXT_FONTS 에 없다`)
  } else if (것.key) {
    if (!조각.has(것.key)) 틀림.push(`${어디}: 조각 «${것.key}» 를 못 찾았다 → 빈 자리로 그려진다`)
  }
  if (것.motion && 모션?.size && !모션.has(것.motion)) 틀림.push(`${어디}: 모션 «${것.motion}» 가 MOTIONS 에 없다 → 안 움직인다`)
  if (것.fx && !효과.has(것.fx)) 틀림.push(`${어디}: 효과 «${것.fx}» 가 FX_KINDS 에 없다 → 효과가 안 나온다`)
}

const 것들 = 값읽기()
것들.forEach(본다)
console.log(`🔎 조각 ${것들.length}개를 봤다`)
console.log(`   아는 값 = 조각 ${조각.size} · 글자색 ${글자색.size} · 모션 ${모션?.size ?? '?'} · 효과 ${효과.size} · 글씨체 ${글씨체.size}`)
if (!틀림.length) { console.log('✅ 조용히 떨어질 값이 없다.'); process.exit(0) }
console.log('\n⛔ 조용히 틀릴 값 ' + 틀림.length + '개 — 찍어도 «오류 없이» 엉뚱하게 나온다')
for (const t of 틀림) console.log('   · ' + t)
process.exit(1)
