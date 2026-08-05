// 🔒🔒 «파는 것이 어디로든 새는가» — **전수** 검사
//
// ⛔⛔ **왜 만들었나 (2026-08-05, 창업자 *"다른 것도 새는 것 없는지 전수검사해"*)**
//   그날 「비 오는 창」(가을 유료팩 배경)에 `pack` 을 붙여 놓고 **거르는 곳을 안 만든** 걸
//   AAB 굽기 직전에 잡았다. 그러다 보니 더 큰 게 보였다 —
//   기존 검사(`check-packmix.mjs`)는 **딱 두 곳만** 보고 있었다:
//     ⒜ 꾸미기 서랍(`STICKER_GROUPS[].items`)  ⒝ 공유 카드(`cardSeasons.js`)
//   **배경·모션·효과·표지 아이콘·아바타·씬풀·기본 레시피는 아무도 안 보고 있었다.**
//
//   📌 배운 것 = **「검사가 있다」와 「검사가 «전부»를 본다」는 다른 말이다.**
//      두 곳을 보는 검사는 세 번째 구멍을 «통과»시킨다. 그래서 이 파일은 **소스 전체**를 훑는다.
//
// 🔎 어떻게 — 파는 키가 `src/` 어디에든 «문자열»로 나오면 잡는다.
//   허용되는 곳은 셋뿐이다:
//     ① `src/data/paidPacks.js`            — 명단 자신
//     ② `Stickers.jsx` 의 `PHOTO_RATIO`     — 등록표(여기 있어야 그림이 뜬다. 서랍 노출과 무관)
//     ③ 주석                                 — 사람이 읽는 글
//   그 밖의 자리에 나오면 **무료로 닿을 수 있다는 뜻**이라 세운다.
//
// ⚠️ 이 검사는 «이름»으로 본다. 같은 그림이 다른 이름으로 들어온 경우는
//    `paidPacks.js` 의 `alias` 가 있어야 잡힌다(2026-08-03 사고) — 그것도 함께 본다.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')

const paid = await import(join(SRC, 'data', 'paidPacks.js'))
const PACKS = paid.PAID_PACKS

// ── 파는 키 모으기 — packed ＋ alias 의 «무료 이름» 쪽까지
const sellKey = new Map()   // 키 → 팩 라벨
for (const p of PACKS) {
  for (const k of p.packed || []) sellKey.set(k, p.label)
  // 🔁 같은 그림이 다른 이름으로도 있다 → 그 이름도 「파는 것」이다
  for (const [mine, free] of Object.entries(p.alias || {})) {
    if ((p.packed || []).includes(mine)) sellKey.set(free, `${p.label}(별명 ${mine})`)
  }
  // ⛔ freed 에 «적어둔 것»만 무료로 나갈 수 있다
  for (const k of p.freed || []) sellKey.delete(k)
}
// 배경·모션·효과 — `pack` 이 붙은 것은 파는 것이다
const jsx = readFileSync(join(SRC, 'components', 'Stickers.jsx'), 'utf8')
const gated = { bg: [], motion: [], fx: [] }
const grabGated = (constName, bucket) => {
  const i = jsx.indexOf(`${constName} = [`)
  if (i < 0) return
  const j = jsx.indexOf('\n]', i)
  // ⚠️⚠️ **중첩 객체가 있으면 `{…}` 통짜 정규식은 못 잡는다.**
  //   2026-08-05: DECOR_BACKGROUNDS 의 「비 오는 창」은 style: {…} 를 품고 있어서
  //   `\{[^{}]*?\}` 가 통과해 버렸고, 검사가 **「pack 붙은 배경이 없다」고 거짓말**했다.
  //   (오늘만 세 번째 「검사가 틀린」 사례다 — 검사도 실물로 확인해야 한다)
  //   ✅ 그래서 **줄 단위**로 본다 — 우리 자료는 key 와 pack 이 늘 같은 줄에 있다.
  for (const line of jsx.slice(i, j).split('\n')) {
    const k = line.match(/key: '(\w+)'/)
    // ⚠️ `hidden: true` 는 **애초에 피커에 안 나온다** — 잠금을 따질 대상이 아니다.
    //   2026-08-05: 이걸 안 빼서 검사가 「pack 붙은 배경 7개」라고 부풀려 셌고,
    //   그걸 보고 «무료 배경 5개가 사라진다»고 잘못 말할 뻔했다(실제로는 원래부터 숨김이었다).
    if (k && /pack: '\w+'/.test(line) && !/hidden: true/.test(line)) bucket.push(k[1])
  }
}
grabGated('DECOR_BACKGROUNDS', gated.bg)
grabGated('MOTIONS', gated.motion)
grabGated('FX_KINDS', gated.fx)

// ── src 전체 파일 목록
const files = []
const walk = (d) => {
  for (const e of readdirSync(d)) {
    const p = join(d, e)
    if (statSync(p).isDirectory()) { if (e !== 'assets') walk(p) }
    else if (/\.(js|jsx)$/.test(e)) files.push(p)
  }
}
walk(SRC)

// 주석 줄인가 — 넉넉하게 본다(`//`·`*`·`/*` 로 시작하면 글)
const isComment = (line) => /^\s*(\/\/|\*|\/\*)/.test(line)

const hits = []
for (const f of files) {
  const rel = relative(ROOT, f)
  if (rel.endsWith('data/paidPacks.js')) continue            // ① 명단 자신
  const text = readFileSync(f, 'utf8')
  const isStickers = rel.endsWith('components/Stickers.jsx')
  // ② PHOTO_RATIO 블록의 줄 범위 (등록표는 노출이 아니다)
  let ratioFrom = -1, ratioTo = -1
  if (isStickers) {
    const a = text.slice(0, text.indexOf('const PHOTO_RATIO = {')).split('\n').length
    const b = text.slice(0, text.indexOf('\n}', text.indexOf('const PHOTO_RATIO = {'))).split('\n').length
    ratioFrom = a; ratioTo = b + 1
  }
  const lines = text.split('\n')
  lines.forEach((line, idx) => {
    const no = idx + 1
    if (isComment(line)) return                              // ③ 주석
    if (isStickers && no >= ratioFrom && no <= ratioTo) return
    for (const m of line.matchAll(/'([\w-]+)'/g)) {
      const key = m[1]
      if (sellKey.has(key)) hits.push({ rel, no, key, why: `유료팩 컷 — ${sellKey.get(key)}` })
    }
  })
}

// ── 배경·모션·효과가 «거르는 곳»을 실제로 지나가나
const dec = readFileSync(join(SRC, 'components', 'DecorEditor.jsx'), 'utf8')
const gateOk = {
  bg: /DECOR_BACKGROUNDS\.filter\([\s\S]{0,120}?b\.pack/.test(dec),
  motion: /pickableMotions/.test(dec) && /owned\.has\(m\.pack\)/.test(jsx),
  fx: /pickableFx/.test(dec) && /owned\.has\(f\.pack\)/.test(jsx),
}

let fail = 0
const bad = (m) => { console.log(`  ❌ ${m}`); fail++ }
const ok = (m) => console.log(`  ✅ ${m}`)

console.log('🔒 파는 것이 새는가 — 전수 검사\n')
console.log(`📦 파는 키 ${sellKey.size}개 · 훑은 파일 ${files.length}개`)

console.log('\n① 유료팩 컷이 소스 어디에 쓰였나')
if (!hits.length) ok('명단·등록표·주석 밖에는 한 곳도 없다')
else {
  const byFile = new Map()
  for (const h of hits) {
    if (!byFile.has(h.rel)) byFile.set(h.rel, [])
    byFile.get(h.rel).push(h)
  }
  for (const [rel, list] of byFile) {
    bad(`${rel} — ${list.length}곳`)
    for (const h of list.slice(0, 6)) console.log(`       ${h.no}줄  '${h.key}'  (${h.why})`)
    if (list.length > 6) console.log(`       … 외 ${list.length - 6}곳`)
  }
}

console.log('\n② 잠금이 붙은 것이 실제로 걸러지나')
const show = (name, keys, pass, how) => {
  if (!keys.length) { console.log(`  ⏭  ${name} — pack 붙은 게 아직 없다`); return }
  if (pass) ok(`${name} ${keys.length}개(${keys.join(' ')}) — ${how}`)
  else bad(`${name} ${keys.length}개(${keys.join(' ')}) — «거르는 곳이 없다». 무료로 풀린다`)
}
show('배경', gated.bg, gateOk.bg, '피커가 b.pack 을 본다')
show('모션', gated.motion, gateOk.motion, 'pickableMotions 가 owned 를 본다')
show('효과', gated.fx, gateOk.fx, 'pickableFx 가 owned 를 본다')

if (fail) {
  console.error('\n⛔ 전수 검사 실패 — 파는 것이 무료로 닿을 수 있다.')
  console.error('   📌 절대원칙 = 「파는건 공유카드로도 안내보내는게 맞지」(창업자 2026-08-03)')
  console.error('   👉 무료로 내보낼 컷이면 paidPacks.js 의 freed 에 «적어야» 한다. 안 적으면 못 나간다.')
  process.exit(1)
}
console.log('\n✅ 전수 검사 통과 — 파는 것이 무료 자리에 한 곳도 없다\n')
