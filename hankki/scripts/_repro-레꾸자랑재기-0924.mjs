// 🎴📊 레꾸자랑 «제대로 재기» 재현판 — 2026-09-24
//
// 📮 창업자 = *"레꾸자랑 된 것 좀 보고싶다 한달이 넘었는데 아직 한번도 못재는게 말이 안돼."*
//          ＋ *"진짜 공유를 몇명이 했나. 내가꾸민거 몇건 랜덤 몇건 각각"* ＋ *"다각도로 이유를 재고, 뿌리를 고쳐."*
//
// 🌲 뿌리 넷 (그날 코드로 확인)
//   ① ~09-14      = 「보냈다」 숫자 자체가 없었다
//   ② 09-14~09-23 = 이름이 겹쳐(useRef 섀도잉) 부를 때마다 조용히 죽었다 — 고침은 _repro-계측구멍-0922
//   ③ 내가 꾸민 것·랜덤이 «같은 이름»(brag_shared)으로 섞였다 → 각각 몇 건인지 못 가른다
//   ④ 공유창을 «닫은» 것이 저장 폴백과 같은 값으로 돌아와 「사진으로 저장했어요」라고 거짓말하고 brag_saved_fallback 로 셌다
//   ⑤ 받은 사람이 눌러 들어온 것을 못 셌다 — 주소에 꼬리표가 없고, 아이폰 앱에선 capacitor:// 주소가 실려 «못 여는 링크»였다
//
// 이 판은 «고친 모양이 되돌아가면» 죽는다.
import { readFileSync } from 'node:fs'
const 뿌리 = new URL('../', import.meta.url)
const 읽기 = (p) => readFileSync(new URL(p, 뿌리), 'utf8')
const stats = 읽기('src/stats.js'), cover = 읽기('src/shareCover.js'), sdc = 읽기('src/components/ShareDrawCard.jsx')
const brag = 읽기('src/screens/BragScreen.jsx'), detail = 읽기('src/screens/RecipeDetailScreen.jsx')
let 죽음 = 0
const 재다 = (이름, 됐나) => { console.log(`${됐나 ? '✅' : '⛔'} ${이름}`); if (!됐나) 죽음++ }

// ③ 갈래
재다('③ 자랑보냄이 랜덤을 brag_shared_random 으로 가른다', /종류 === '랜덤' \? 'brag_shared_random' : 'brag_shared'/.test(stats))
for (const [n, s] of [['BragScreen', brag], ['RecipeDetail', detail]]) {
  재다(`③ ${n} 랜덤 카드 onShared = 자랑보냄('랜덤')`, /<ShareDrawCard[\s\S]{0,200}?자랑보냄\('랜덤'\)/.test(s))
  재다(`③ ${n} 「지금 보내기」 = 자랑보냄('표지') · 이어보내기는 안 센다`, /if \(!pending\?\.이어보내기\) \{ try \{ 자랑보냄\('표지'\)/.test(s))
  // ④ 닫기
  재다(`④ ${n} 닫은 것은 «저장했어요» 앞에서 갈린다`, /res && res\.취소\) \{ try \{ 자랑창닫음\(\)[\s\S]{0,200}?res\.ok && res\.shared === false/.test(s))
  // 누름
  재다(`누름 ${n} 표지 보내기 첫머리에서 자랑보내기누름()`, /try \{ 자랑보내기누름\(\) \}/.test(s))
  재다(`누름·닫기·저장 ${n} 랜덤 카드에 onTap·onCancel·onSavedFallback`, /onTap=\{자랑보내기누름\} onCancel=\{자랑창닫음\} onSavedFallback=\{자랑사진저장\}/.test(s))
}
재다('④ shareCover — AbortError 는 취소: true', /AbortError'\) return \{ ok: true, shared: false, 취소: true \}/.test(cover))
재다('④ 랜덤 카드 — AbortError 자리 셋에서 onCancel', (sdc.match(/onCancel\?\.\(\)/g) || []).length >= 3)
재다('누름 랜덤 카드 — share() 첫머리에서 onTap', /if \(!cardRef\.current \|\| busy\) return\n\s*try \{ onTap\?\.\(\) \}/.test(sdc))
// ⑤ 받은 사람
재다('⑤ 공유 주소 = https 고정 ＋ ?from=brag', /export const 자랑주소 = 'https:\/\/peachfam0307-glitch\.github\.io\/hankki\/\?from=brag'/.test(cover))
재다('⑤ 표지 payload 가 appUrl 대신 자랑주소', /const url = 자랑주소/.test(cover))
재다('⑤ 랜덤 카드 두 곳이 url: 자랑주소', (sdc.match(/url: 자랑주소/g) || []).length === 2)
재다('⑤ 앱이 from=brag 을 brag_arrive 로 센다', /get\('from'\) !== 'brag'\) return[\s\S]{0,200}행동보내기\('brag_arrive'\)/.test(stats))
재다('⑤ 다시왔나() 첫머리에서 자랑타고왔나()', /if \(통계꺼짐\(\)\) return\n\s*자랑타고왔나\(\)/.test(stats))

console.log(죽음 ? `\n⛔ ${죽음}칸 죽었다` : '\n✅ 레꾸자랑 재기 — 전부 통과')
process.exit(죽음 ? 1 : 0)
