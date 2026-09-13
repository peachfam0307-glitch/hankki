#!/usr/bin/env node
// 🔒 재료 링크 표 검사 — `src/data/ingLinks.js` (2026-09-12)
//
// 📮 창업자 = *"다 붙여야지.. 그리고 장보기에 들어가는 것도 다 붙이자"*
//
// ⭐ 막는 것은 **「틀린 것」 다섯**뿐이다. 표가 «비어 있어도» 통과한다 —
//    링크는 창업자가 파트너스에서 하나씩 만들어야 해서 채우는 데 시간이 걸린다.
//    ⛔ 「몇 개 이상 채워라」로 막으면 배포가 볼모가 된다. 그건 게이트가 할 일이 아니다.
import { readFileSync } from 'node:fs'

const il = readFileSync('src/data/ingLinks.js', 'utf8')
const store = readFileSync('src/store.jsx', 'utf8')
const 탈 = []
const 알림 = []   // ⚠️ 막지는 않지만 눈에 보여야 하는 것 (파트너스 아닌 주소)

// ── ① 파트너스 링크가 아닌 주소 = 수수료 0원인데 붙은 줄 안다
const 표 = [...il.matchAll(/^\s*'([^']+)':\s*'([^']+)',?(.*)$/gm)].map((m) => ({
  이름: m[1], 주소: m[2],
  // ⛇묶음 표시 = 창업자가 «한 줄로» 준 것 (「계란 / 달걀」). 아래 ② 가 이걸 보고 봐준다.
  묶음: (m[3].match(/⛇묶음:\s*(.+?)\s*$/) || [])[1]?.split(/\s*\/\s*/).map((x) => x.trim()),
}))
for (const { 이름, 주소 } of 표)
  if (!주소.startsWith('https://link.coupang.com/'))
    // 🛒 [창업자 확정 2026-09-12] 쿠팡에 없는 것은 다른 몰 주소를 쓴다 — 창업자 *"쿠팡에 없어서 넣은거야"*
    //   ⭐ 수수료 0원이지만 유저는 살 수 있다. 못 사는 링크보다 낫다 → **막지 않고 «세어서 알린다».**
    //   ⛔ 다만 «주소 모양»은 본다 — http/https 가 아니면 그건 오타다.
    if (!/^https?:\/\//.test(주소)) 탈.push(`⛔ 「${이름}」 주소가 이상하다 — ${주소}`)
    else 알림.push(`⚠️ 「${이름}」 은 파트너스가 아니다(수수료 0원) — ${주소.replace(/^https?:\/\//, '').split('/')[0]}`)

// ── ② 같은 주소가 두 재료에 = 2026-09-08 「짝 밀림」 사고의 모양
//    ⭐ 다만 **창업자가 «일부러» 한 줄로 준 묶음**은 봐준다 — 「계란 / 달걀」은 같은 게 맞다.
//       📮 창업자 2026-09-12 = *"링크 같은거 몇개 있거든,"* · *"계란이 달걀이자나"*
//       그 표시(`// ⛇묶음:`)는 `_판-재료링크넣기.mjs` 가 **한 줄로 받은 것에만** 단다.
//       ⛔ 손으로 표시를 달아 검사를 통과시키지 말 것 — 그러면 그물이 없는 것과 같다.
const 본것 = new Map()
for (const { 이름, 주소, 묶음 } of 표) {
  const 앞 = 본것.get(주소)
  if (앞 && !(묶음 && 묶음.includes(앞) && 묶음.includes(이름)))
    탈.push(`⛔ 「${앞}」 와 「${이름}」 이 **같은 주소**를 쓴다 — ${주소}\n   👉 붙여넣다 한 칸 밀렸을 때 나는 모양이다(2026-09-08 에 61개 중 둘이 뒤바뀌었다). 둘 다 다시 확인할 것.\n   ⭐ 일부러 같은 것이면 「${앞} / ${이름}   주소」 처럼 «한 줄로» 줘서 다시 넣는다.`)
  본것.set(주소, 이름)
}

// ── ③ 「안 사는 것」인데 링크가 붙었다 = 앞뒤가 안 맞는다
const 안파는것 = [...((il.match(/안파는것 = new Set\(\[([\s\S]*?)\]\)/) || ['', ''])[1]).matchAll(/'([^']+)'/g)].map((m) => m[1])
if (안파는것.length === 0) 탈.push('⛔ `안파는것` 을 못 읽었다 — 파일 모양이 바뀌었다. 이 검사를 고칠 것.')
for (const { 이름 } of 표)
  if (안파는것.includes(이름))
    탈.push(`⛔ 「${이름}」 은 «안 사는 것»으로 적어 놓고 링크를 붙였다 — 둘 중 하나가 틀렸다.\n   📮 창업자 2026-09-12 = *"밥면수이런건 말고"*`)

// ── ④ 담는 자리가 링크를 «안 부르면» 표가 통째로 죽는다 (조용히)
//    ⭐ 진짜 위험은 표가 비는 게 아니라 **이어주는 줄이 언젠가 사라지는 것**이다.
if (!/from '.\/data\/ingLinks'/.test(store) || !/ingLink\(/.test(store))
  탈.push('⛔ `store.jsx` 가 `ingLink()` 를 안 부른다 — 표를 채워도 장보기에 링크가 안 붙는다.\n   👉 `addShopItems`·`addShopItem` 두 자리에서 부른다(레시피 담기·자유 입력이 다 여기를 지난다).')
for (const 자리 of ['addShopItems', 'addShopItem']) {
  const i = store.indexOf(`case '${자리}': {`)
  if (i < 0) { 탈.push(`⛔ \`store.jsx\` 에서 \`${자리}\` 를 못 찾았다 — 이 검사를 고칠 것.`); continue }
  if (!/ingLink\(/.test(store.slice(i, i + 900))) 탈.push(`⛔ \`${자리}\` 가 \`ingLink()\` 를 안 부른다 — 그 길로 담은 것만 수수료가 0원이 된다.`)
}

// ── ⑤ 한살림(noBuy) 에 링크를 붙이면 8/17 에 링크 뺀 일이 헛일이 된다
const j = store.indexOf("case 'addShopItem': {")
if (j > 0 && !/noBuy\s*\?\s*''\s*:/.test(store.slice(j, j + 900)))
  탈.push('⛔ `addShopItem` 이 `noBuy`(한살림 = 조합원 전용)에도 링크를 붙인다.\n   📮 창업자 2026-08-17 = *"링크안달면되고"* — 사러가기를 «안 그리는» 줄이다.')

// ── ⑥ 표에 넣은 이름이 «우리 재료 어디에도 없다» = 만들고도 한 줄도 안 붙는다
//    ⭐⭐ 이게 창업자를 «두 번 일»하게 만드는 자리다 — 링크는 만들었는데 앱에선 수수료 0원이고,
//       조용해서 아무도 모른다. 그래서 배포를 막는다(📮 *"최대한 내가 두번일안하게"* 2026-09-12).
//    ⚠️ 재료는 대괄호를 «세면서» 읽는다 — 짧은 정규식은 소제목 `'[국물]'` 의 `]` 에서 멈춘다
//       (2026-08-15 에 그래서 234줄을 못 보고 있었다 · `check-picks.mjs` 주석 참고).
if (표.length) {
  const 덩어리 = (src) => {
    const out = []
    for (const m of src.matchAll(/ingredients:\s*\[/g)) {
      let i = m.index + m[0].length, d = 1; const s = i
      while (i < src.length && d > 0) {
        const c = src[i]
        if (c === "'") { i++; while (i < src.length && src[i] !== "'") i += src[i] === '\\' ? 2 : 1 }
        else if (c === '[') d++; else if (c === ']') d--
        i++
      }
      out.push(src.slice(s, i - 1))
    }
    return out
  }
  let 재료글 = ''
  for (const f of ['weekly', 'seed', 'basics', 'paidPacks']) {
    let s; try { s = readFileSync(`src/data/${f}.js`, 'utf8') } catch { continue }
    for (const d of 덩어리(s)) 재료글 += d
  }
  if (재료글.length < 5000) 탈.push('⛔ 재료를 거의 못 읽었다 — 데이터 파일 모양이 바뀌었다. 이 검사를 고칠 것.')
  else for (const { 이름 } of 표)
    if (!재료글.includes(이름))
      탈.push(`⛔ 「${이름}」 은 우리 레시피 재료에 «한 줄도» 없다 — 링크를 만들고도 한 푼도 안 붙는다.\n   👉 철자를 확인할 것(「다진마늘」↔「다진 마늘」처럼 공백 하나로 갈린다).\n   📌 \`node scripts/_판-재료링크넣기.mjs\` 로 넣으면 이 실수가 애초에 안 난다.`)
}

if (탈.length) { console.error('\n' + 탈.join('\n\n') + '\n'); process.exit(1) }
if (알림.length) console.log('\n' + 알림.join('\n') + '\n   ⭐ 쿠팡에 들어오면 파트너스 주소로 바꾼다 (창업자 2026-09-12)\n')
console.log(`✅ 재료 링크 표 — 링크 ${표.length}개 · 안 사는 것 ${안파는것.length}개 · 담는 자리 둘 다 이어져 있다`)
