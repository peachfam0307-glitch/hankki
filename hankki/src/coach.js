// 🧭 안내코치 키 = 여기 한 곳
//
// ⛔⛔ 왜 만들었나 (2026-08-08) — **키를 올렸더니 두 군데가 조용히 깨졌다.**
//   v10.05 에서 홈 코치를 `home2` → `home3` 으로 올렸다(안 올리면 이미 본 사람에게 새 단계가 영영 안 뜬다).
//   그런데 —
//   ⑴ 🐛 **설정 「기능 안내 다시 보기」가 `hankki:coach:home` 을 지우고 있었다.**
//      홈 키는 v8.60 에 이미 `home2` 였다 → **그때부터 홈 안내는 「다시 보기」로 안 돌아왔다.**
//      게다가 `brag` 는 목록에 아예 없었다. 유저가 눌러도 아무 일 안 나는 칸이 둘이었다.
//   ⑵ 🧪 **검사 스크립트 백여 개가 `hankki:coach:home2` 를 이름으로 심고 있었다.**
//      키가 올라가자 코치 오버레이가 다시 떠서 화면을 덮었고, `npm run smoke` 의 나가기 점검이
//      「장보기 탭을 못 누른다」로 **배포를 막았다.** 앱은 멀쩡한데 검사가 옛 이름을 보고 있었다.
//
// 📌 뿌리는 하나다 — **같은 이름을 여러 곳에 손으로 적어 뒀다.** 한 곳만 고치면 나머지가 낡는다.
// ⭐ 그래서 키는 여기서만 만든다. **올릴 땐 이 파일 한 줄만 고친다.**
// 🔒 `scripts/check-mistakes.mjs` 가 「이 파일 밖에서 `hankki:coach:` 문자열을 만들면」 배포를 막는다.
//    ⛔ 검사 스크립트는 이름으로 심지 말고 **접두어로 통째로** 막을 것(`seedCoachSeen` 참고) —
//       그래야 다음에 키를 올려도 안 낡는다.
const NS = 'hankki:coach:'

// 화면 → 저장 키. ⚠️ 값은 «본 적 있다» 표시라 올리면 모두에게 다시 뜬다(그게 올리는 이유다).
export const COACH = {
  home: `${NS}home3`,          // v8.60 home → home2 → v10.05 home3(한끼 일기 단계 추가)
  myrecipes: `${NS}myrecipes`,
  // 📔 「일기」 탭은 하단바에서 «따로 선 탭»인데 코치가 `myrecipes` 와 한 키를 썼다 →
  //    레시피 탭을 먼저 본 사람은 일기 탭에서 **영영 안내가 안 떴다**
  //    (창업자 2026-08-10 *"한끼일기는 눌러도안내코치가 없네"*). 키를 갈랐다.
  diary: `${NS}diary`,
  detail: `${NS}detail`,
  shop: `${NS}shop`,
  brag: `${NS}brag`,
  profile: `${NS}profile`,
}

// 설정 「기능 안내 다시 보기」가 지우는 목록 = 위 전부. ⛔손으로 다시 적지 말 것.
export const COACH_KEYS = Object.values(COACH)

// 검사·재현 스크립트에서 「코치를 다 본 상태」로 만들 때 쓰는 조각.
// ⭐ 이름을 안 쓰고 **접두어로** 막아서, 키를 올려도 이 조각은 안 낡는다.
export const SEED_COACH_SEEN = `
  try {
    const _get = Storage.prototype.getItem
    Storage.prototype.getItem = function (k) {
      if (typeof k === 'string' && k.startsWith('${NS}')) return '1'
      return _get.call(this, k)
    }
  } catch (e) { /* noop */ }
`
