// 🎁🍂 **「철 지난 선물」이 제철인 척하지 않나** (배포 게이트 · 2026-09-02)
//
// 📮 창업자 확정 2026-09-02 = 갈래 셋 중 **ⓑ 「철 지난 선물만 내린다」**
//    그 앞 = *"한꺼번에 하니까 너무 많이 주는 것 같아 보여."* ·
//           *"그리고 서랍에 선물 넣는 것도 뺄지 고민해보자."*
//
// ⭐⭐ **왜 게이트인가 = 「절반만 고쳐진 채로 사흘을 갔다」**
//    2026-08-30 에 «순서»는 내렸다(`giftUp` 으로 정렬) — 그런데 **오렌지 알약은 안 따라 내려왔다.**
//    9월인데 「출시기념 여름」(12컷)에 알약이 그대로 붙어 있었고, 화면은 멀쩡해 보였다.
//    📌 **한 잣대(`giftUp`)를 두 곳에서 써야 하는데 한 곳만 썼다** — 이런 건 조용히 어긋난다.
//
// ⛔ **뺏는 게 아니다** — 컷도, 「받은 선물」 시트 목록도 그대로다(한 번 준 것은 빼앗지 않는다).
//    없어지는 건 «지금 제철인 척»뿐이다.
//
// 🧪 규칙 12 = 알약 조건을 `g.gift` 로 되돌리거나 `giftUp` 에서 계절을 빼면 **exit 1**.
import { readFileSync } from 'node:fs'

let bad = 0
const 적기 = (ok, m) => { console.log(`  ${ok ? 'ok ' : '✗'} ${m}`); if (!ok) bad++ }

const 서랍 = readFileSync(new URL('../src/components/DecorEditor.jsx', import.meta.url), 'utf8')
const 시트 = readFileSync(new URL('../src/components/GiftPackSheet.jsx', import.meta.url), 'utf8')

console.log('\n── 철 지난 선물 ──')

// ① 알약(GiftTag)은 «제철 선물»에만 붙는다
//    ⛔ 주석에도 `<GiftTag` 가 나올 수 있으니 «그리는 자리»만 본다 → `{...&& <GiftTag`
const 알약자리 = [...서랍.matchAll(/\{([^{}\n]*?)&&\s*<GiftTag/g)].map((m) => m[1].trim())
적기(알약자리.length > 0, `알약을 그리는 자리를 찾았다 (${알약자리.length}곳)`)
for (const 조건 of 알약자리) {
  적기(/giftUp\s*\(/.test(조건), `알약 조건이 «제철»을 본다 — \`${조건}\` (⛔\`g.gift\` 만 보면 철 지난 선물에도 붙는다)`)
}

// ② 그 `giftUp` 이 진짜로 계절을 본다 — 이름만 같고 속이 비면 ①이 헛것이 된다
const g = 서랍.match(/const giftUp = [^\n]*/)?.[0] || ''
적기(/seasonRank\s*\(/.test(g), `\`giftUp\` 이 계절을 잰다 — ${g.trim() || '(못 찾음)'}`)
적기(/\.gift\b/.test(g), '`giftUp` 이 「선물인가」도 같이 본다')
// ③ 「열린 날(`from`)이 있나」 — 창업자 확정 2026-09-02 검수판 ⑦ *"이것도 내린다"*
//    ⛔ 이게 빠지면 **계절이 안 붙은 선물이 영원히 맨 위 ＋ 알약**이 된다(「출시 축하」가 그랬다).
적기(/\.from\b/.test(g), '`giftUp` 이 「열린 날(`from`)이 있나」도 본다 (⛔없으면 옛 선물이 영영 위에 남는다)')

// ③ 묶음이 아닌 선물(배경·모션)에도 계절이 붙어 있다
//    ⛔ 안 붙이면 `제철()` 이 늘 참이라 **영영 맨 위**에 남는다 — 여름 물결이 겨울에도 위에 뜬다.
const 덩이 = 시트.match(/const EXTRA_GIFTS = \[([\s\S]*?)\n\]/)?.[1] || ''
const 줄들 = 덩이.split('\n').filter((l) => /\{\s*cat:/.test(l))
적기(줄들.length > 0, `묶음 아닌 선물을 찾았다 (${줄들.length}줄)`)
for (const l of 줄들) {
  const 이름 = l.match(/title:\s*'([^']*)'/)?.[1] || l.trim().slice(0, 40)
  적기(/season:/.test(l), `「${이름}」에 계절이 붙어 있다`)
}

console.log(bad ? `\n✗ ${bad}칸 실패` : '\n✅ 철 지난 선물 통과')
process.exit(bad ? 1 : 0)
