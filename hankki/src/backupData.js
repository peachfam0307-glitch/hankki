import { 백업용잠그기 } from './diaryLock'

// 📦 백업 JSON 을 만드는 «한 곳».
//
// ⭐⭐ 왜 파일로 뺐나 = 이걸 부르는 데가 **둘**이 됐다 —
//    ⑴ 설정의 「백업 · 내보내기」(`ProfileScreen`) ⑵ ☁️클라우드 저장(`App` 의 저절로 올리기 · `CloudSheet`)
//    ⛔ 두 벌로 두면 «백업 파일에는 들어가는데 클라우드엔 안 들어가는 칸»이 생긴다.
//       그건 폰을 바꾼 «뒤에야» 드러난다 — 제일 늦게 발견되는 종류의 사고다.
//
// 🔐 잠긴 일기는 «본문만 잠가서» 담는다 (창업자 확정 ⓑ · 2026-08-19).
//    ⭐ 열쇠 = 이미 저장돼 있는 비번 «자국» → 백업할 때 비번을 안 물어도 된다.
//    ⚠️ `crypto.subtle` 이 없으면 평문으로 담지 않고 본문을 뺀다 — 새는 것보다 잃는 게 낫다.
//    📌 글씨체(`font`·`size`)는 글이 아니라서 안 잠근다.
export const 일기글자칸 = ['title', 'note', 'line', 'weather', 'note2', 'note3', 'note4']

// ⚠️ 잠그는 데 시간이 걸려 «비동기»다 — 부르는 쪽은 반드시 await.
//   ⛔ await 를 빼면 `JSON.stringify(Promise)` 가 `{}` 로 굳어 **백업이 통째로 빈다.**
export async function 백업만들기(store) {
  return {
    _app: 'hankki', _v: 2, _at: new Date().toISOString(),
    recipes: store.recipes, folders: store.folders, profile: store.profile,
    shops: store.shops, wishlist: store.wishlist, shoppingList: store.shoppingList, pantry: store.pantry,
    diary: await 백업용잠그기(store.diary, 일기글자칸),
    seedV: store.seedV, memoCleanV: store.memoCleanV, removedSeedIds: store.removedSeedIds,
    // 🔢🔢 **[2026-09-02] 「이사 도장」도 담는다 — 안 담으면 되살릴 때 이사가 «처음부터 또» 돈다.**
    //   ⛔⛔ 그 전엔 이 다섯이 백업에도 없고 `importAll` 도 안 넘겨서, 백업을 되살리면
    //      · 임시보관함에 «일부러» 남겨둔 것이 통째로 졸업하고(`inboxV`)
    //      · 유저가 「사진」 칩으로 세운 표지 도장이 또 지워지고(`coverV`)
    //      · **지운 샘플 일기가 되살아났다**(`sampleGone` · 창업자 2026-08-12 *"지워도 되게"*)
    //   ⭐ 되살리는 쪽(`store.jsx` `importAll`)은 **큰 값으로** 고른다 —
    //      도장이 없던 «옛 백업»을 되살려도 지금 폰이 이미 한 이사를 다시 하지 않는다.
    //   📌 이 파일 머리말이 말하는 그대로다 — **한 곳에서 만들어야 한쪽만 낡지 않는다.**
    politeV: store.politeV, qtyOnlyV: store.qtyOnlyV, inboxV: store.inboxV,
    coverV: store.coverV, sampleGone: store.sampleGone,
  }
}
