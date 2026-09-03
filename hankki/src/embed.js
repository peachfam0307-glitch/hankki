// 유튜브·인스타그램 링크 → 앱 안에 띄울 수 있는 공식 임베드 주소로 변환.
// '영상 보면서 쓰기' — 위에 영상을 고정하고 아래에서 레시피를 적는 화면에 쓴다.
export function embedUrl(url = '') {
  const u = String(url)
  let m = u.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})/)
  if (m) {
    // 🖼 [창업자 확정 2026-09-03] `thumb` = 영상 «그림»만 가져오는 주소.
    //   📮 창업자 = *"재생창은 보이게 하고 누르면 앱으로 가게해야지"*
    //             · *"우리앱에서 직접 재생만 안하면 되자나 미리보기정도는 보여줘도 되지"*
    //   ⭐⭐ 그림은 **임베드가 아니다** — 앱 안에서 «틀지» 않으므로 Developer Policies III.E.4.j
    //      (*"each YouTube video that it **embeds**"*)의 「영상마다 Made for Kids 확인」이 안 걸린다.
    //   ⛔ `src`(임베드 주소)는 남겨 둔다 — 편집 화면 「영상 보면서 쓰기」가 아직 쓴다.
    //      ⛔ 레시피 «상세»에선 `src` 를 쓰지 않는다. 거긴 `thumb` 만이다.
    //   🔢 `hqdefault` = 480×360. 그림이 없으면 화면에서 `onError` 로 그 칸을 통째로 감춘다.
    return { type: 'youtube', id: m[1], src: `https://www.youtube.com/embed/${m[1]}?playsinline=1`, thumb: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`, ratio: '16/9' }
  }
  m = u.match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]+)/)
  if (m) {
    const kind = m[1] === 'p' ? 'p' : 'reel'
    // 🎞 `kind` 를 «내보낸다» — 화면이 「릴스로 보기」와 「원본 글 보기」를 가려 말하려면 이게 필요하다.
    //   ⛔ 「영상」이라고 뭉뜽그리면 사진 글(`p`)일 때 «거짓말»이 된다.
    //      눌러볼 이유를 만든다고 없는 것을 있다고 하면, 그건 미끼지 안내가 아니다.
    return { type: 'instagram', kind, id: m[2], src: `https://www.instagram.com/${kind}/${m[2]}/embed`, ratio: '4/5' }
  }
  return null
}

// 🔖🔖 [2026-09-04] SNS 표(▶ · 🔗)를 «두 화면»이 같은 자로 잰다 — 레시피 탭 ＋ 홈 SNS 상자.
//   📮 창업자 = *"왼쪽에 달지 않았어?? (레시피에는??)"* — 홈에도 같은 표를 달면서 잣대를 «베끼려» 했다.
//   ⛔⛔ 베끼면 반드시 갈린다 — v11.02 「책갈피」 이름이 일곱 곳에 흩어졌던 게 정확히 그 사고다.
//      그래서 잣대를 여기 «한 곳»에 두고 두 화면이 같이 부른다(CLAUDE.md 「같은 기능은 같은 이름」).
//
// ⑴ SNS에서 온 편인가 — 칩 개수·거르기·표 붙이기가 쓴다. 매체를 안 가린다(유튜브·인스타·앞으로 뭐든).
export const SNS인가 = (r) => !!(r?.sourceUrl || '').trim()
// ⑵ 앱에서 «재생»되는가 — ▶ 표가 쓴다. ⛔인스타는 재생이 안 되므로 ▶ 를 붙이지 않는다
//    (▶ 를 붙여 놓고 눌렀는데 안 나오면 그게 거짓말이다). 그 편은 🔗 로 「나가서 본다」를 말한다.
export const 영상인가 = (r) => embedUrl(r?.sourceUrl || '')?.type === 'youtube'
