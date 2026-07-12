// 유튜브·인스타그램 링크 → 앱 안에 띄울 수 있는 공식 임베드 주소로 변환.
// '영상 보면서 쓰기' — 위에 영상을 고정하고 아래에서 레시피를 적는 화면에 쓴다.
export function embedUrl(url = '') {
  const u = String(url)
  let m = u.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})/)
  if (m) {
    return { type: 'youtube', src: `https://www.youtube.com/embed/${m[1]}?playsinline=1`, ratio: '16/9' }
  }
  m = u.match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]+)/)
  if (m) {
    const kind = m[1] === 'p' ? 'p' : 'reel'
    return { type: 'instagram', src: `https://www.instagram.com/${kind}/${m[2]}/embed`, ratio: '4/5' }
  }
  return null
}
