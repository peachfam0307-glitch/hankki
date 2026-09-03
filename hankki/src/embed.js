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
    return { type: 'instagram', src: `https://www.instagram.com/${kind}/${m[2]}/embed`, ratio: '4/5' }
  }
  return null
}
