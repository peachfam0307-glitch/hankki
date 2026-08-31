// 🔒 「한 이름·한 접두어가 «두 세트»를 가리키나」 — 등록하기 «전»에 잡는다.
//
// ⛔⛔ 왜 필요한가 (2026-08-10 실제로 둘 잡았다)
//   `paidPacks.js` 는 팩 소속을 **`key.startsWith(접두어)`** 로 판정한다(308줄).
//   그래서 «성격이 다른» 두 세트가 같은 접두어를 쓰면, 등록하는 순간 **한쪽이 엉뚱한 팩에 딸려 들어간다.**
//   ⭐ 그러면 2026-08-03 절대원칙에 걸린다 — **유료팩에 들어간 컷은 무료로 닿는 어떤 자리에도 못 나간다.**
//   실측 사례 ⑴ `xn` = 「크리스마스 유료팩 소품 12컷」과 「겨울·크리스마스 «캐릭터» 34컷」이 같이 쓴다.
//            그대로 등록하면 겨울 카드용 곰·펭 솔로가 통째로 유료팩에 잠긴다.
//         ⑵ `hp01` = 「한복 곰」과 「한복 펭펭」 두 그림이 «같은 파일 이름»이다.
//   📌 같은 종류 전례 = 2026-08-03 `xt`↔`wt` (무료 마테 26개가 잠길 뻔했다).
//
// ⭐⭐ 왜 「팩 접두어와 겹치나」로 안 보나 — 첫 판을 그렇게 짰더니 **234컷이 나왔다.**
//   추석팩 낱개가 `ci_`, 가을팩 낱개가 `pf_` 인 건 «일부러 그런 것»이라 전부 거짓 경보였다.
//   📌 **시끄러운 게이트는 죽은 게이트다.** 그래서 「한 이름이 두 곳을 가리키나」만 본다.
//
// ⚠️ 실패로 안 만든다(경고만) — 재고는 「아직 안 정한 것」이라 배포를 막을 자리가 아니다.
//   ⭐ 등록된 키가 새는 건 `check-packleak.mjs` 가 실패로 잡는다(역할이 다르다).
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const 재고뿌리 = join(ROOT, 'docs/stickers')

// ⭐⭐ 「두 세트에 걸쳤다」만으로는 시끄럽다 — 두 번째 판이 **35건**이었고 거의 다 «같은 그림을 여러 번 받은 세대 차이»였다
//    (`food_bread` 가 세 폴더에 있는 건 재업로드일 뿐 사고가 아니다).
//    ✅ **진짜 위험 = 「유료팩 접두어」이면서 「두 세트에 걸친 것」** — 두 조건을 «같이» 만족할 때만 잡는다.
//    유료팩 접두어가 아니면 startsWith 판정에 안 걸리므로 세트가 겹쳐도 팩이 섞이지 않는다.
const 팩접두어 = [...new Set(
  [...readFileSync(join(ROOT, 'src/data/paidPacks.js'), 'utf-8').matchAll(/prefixes:\s*\[([^\]]*)\]/g)]
    .flatMap((m) => (m[1].match(/'[^']+'/g) || []).map((s) => s.replace(/'/g, '')))
    .filter(Boolean),
)]
if (!팩접두어.length) {
  console.error('⛔ paidPacks.js 에서 prefixes 를 하나도 못 읽었다 — 정규식이 낡았다')
  process.exit(1)
}
// 그 키가 어느 팩 접두어에 걸리나 (없으면 null = 안전)
const 팩걸림 = (key) => 팩접두어.find((p) => key.startsWith(p)) || null

// ── 재고 낱개를 훑는다 — `낱개` 가 들어간 폴더만(원본시트는 안 본다)
//    ⭐ 「세트」 = 재고 최상위 폴더 하나. 그 안의 `낱개-제외`·`낱개-보관` 은 같은 세트로 친다
//       (제외본·보관본이 같은 접두어인 건 정상이다).
const 컷 = []   // { key, pre, 세트 }
const 훑기 = (dir, 세트, depth = 0) => {
  if (depth > 4) return
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    let st
    try { st = statSync(p) } catch { continue }
    if (st.isDirectory()) {
      if (e === '원본시트') continue
      훑기(p, 세트 || e, depth + 1)
      continue
    }
    if (!e.endsWith('.png') || !dir.includes('낱개')) continue
    const key = e.replace('.png', '')
    const m = key.match(/^([a-z]+_?)/i)
    if (m) 컷.push({ key, pre: m[1], 세트 })
  }
}
if (existsSync(재고뿌리)) {
  for (const e of readdirSync(재고뿌리)) {
    const p = join(재고뿌리, e)
    try { if (statSync(p).isDirectory()) 훑기(p, e) } catch { /* 건너뜀 */ }
  }
}

const 경고 = []

// ① 같은 파일 이름이 «두 세트»에 — 이름만 보고는 어느 그림인지 알 수 없다
const 이름별 = new Map()
for (const c of 컷) {
  if (!이름별.has(c.key)) 이름별.set(c.key, new Set())
  이름별.get(c.key).add(c.세트)
}
for (const [key, s] of 이름별) {
  const 팩 = 팩걸림(key)
  if (s.size > 1 && 팩) 경고.push(`⛔ 같은 이름 '${key}' 이 ${s.size}곳에 (유료팩 '${팩}' 에 걸린다) — ${[...s].join(' · ')}`)
}

// ② 같은 접두어가 «두 세트»에 — 등록하면 팩 판정이 통째로 섞인다
const 접두어별 = new Map()
for (const c of 컷) {
  if (!접두어별.has(c.pre)) 접두어별.set(c.pre, new Map())
  const m = 접두어별.get(c.pre)
  m.set(c.세트, (m.get(c.세트) || 0) + 1)
}
for (const [pre, m] of [...접두어별].sort((a, b) => b[1].size - a[1].size)) {
  const 팩 = 팩걸림(pre)
  if (m.size > 1 && 팩) {
    경고.push(`⛔ 같은 접두어 '${pre}' 가 ${m.size}곳에 (유료팩 '${팩}' 에 걸린다) — ${[...m].map(([k, v]) => `${k}(${v}컷)`).join(' · ')}`)
  }
}

if (!경고.length) {
  console.log('✅ 재고 이름 검사 — 한 이름·한 접두어가 두 세트를 가리키는 일 0건')
  process.exit(0)
}
console.log(`⚠️  재고 이름이 겹친다 — ${경고.length}건 (등록 «전»에 정할 것)`)
for (const w of 경고) console.log('   ' + w)
console.log('\n   👉 접두어가 겹치면 `paidPacks.js` 의 startsWith 판정이 «두 세트를 한 팩»으로 묶는다.')
console.log('   👉 유료팩에 들어간 컷은 무료 자리(카드 뽑기·서랍)에 영영 못 나간다(2026-08-03 절대원칙).')
process.exit(0)
