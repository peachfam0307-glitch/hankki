// 링크 자동 읽기 — 유튜브 설명·블로그 본문을 무료 읽기 서비스로 가져와
// 레시피(제목·재료·순서)로 정리한다. 서버 없이 동작하는 베타 기능:
//  1순위 r.jina.ai (페이지 전체 텍스트, CORS 허용)
//  2순위 noembed.com (제목·작성자만이라도)
// 실패해도 앱은 링크 북마크로 안전하게 저장한다.

const TIMEOUT = 12000

function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT)
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t))
}

// ── 유튜브 주소 ─────────────────────────────────────────────────────────
// watch?v= · youtu.be/ · /shorts/ · /live/ · /embed/ · m.youtube.com · 뒤에 붙는
// si=·t=·list= 같은 파라미터까지 전부 같은 영상ID로 정리한다.
// (창업자 제보 "숏츠, 영상 다 같음" — 형태가 달라도 결과가 똑같이 이상했다)
export function youtubeId(raw = '') {
  const s = String(raw).trim()
  if (!s) return ''
  let u
  try {
    u = new URL(/^https?:\/\//i.test(s) ? s : 'https://' + s)
  } catch {
    return ''
  }
  const host = u.hostname.replace(/^(www|m)\./, '')
  const ok = (id) => (/^[\w-]{8,20}$/.test(id || '') ? id : '')
  if (host === 'youtu.be') return ok(u.pathname.slice(1).split('/')[0])
  if (host !== 'youtube.com' && host !== 'youtube-nocookie.com') return ''
  if (u.pathname === '/watch') return ok(u.searchParams.get('v'))
  const m = u.pathname.match(/^\/(?:shorts|live|embed|v)\/([^/?#]+)/)
  return m ? ok(m[1]) : ''
}

export function isYouTube(url) {
  return !!youtubeId(url)
}

// ── 본문이 아닌 글 걸러내기 ─────────────────────────────────────────────
// 쿠키 동의·로그인 벽·봇 검사 페이지는 글자 수만 많고 내용은 없다. 예전엔 길이만 보고
// 통과시켜서 "Before you continue to YouTube…" 같은 영어 안내문이 그대로 재료·순서
// 칸에 박혔다(창업자 제보 "영어로 이상한 말만 복사됨").
const JUNK_MARKS = [
  'before you continue',
  'we use cookies',
  'cookies and data to',
  'sign in to confirm',
  'accept all',
  'reject all',
  'enable javascript',
  'javascript is disabled',
  'verify you are human',
  'just a moment',
  'checking your browser',
  'access denied',
  'captcha',
  '자동 등록 방지',
  '로그인이 필요',
]
export function looksLikeJunk(text = '') {
  const t = String(text)
  if (!t.trim()) return true
  const low = t.toLowerCase()
  if (JUNK_MARKS.some((k) => low.includes(k))) return true
  // 한글이 거의 없는 글은, 레시피 낱말이라도 있어야 본문으로 인정한다.
  // (영어 레시피 블로그는 ingredients·tbsp 같은 낱말로 통과된다)
  const hangul = (t.match(/[가-힣]/g) || []).length
  if (hangul < t.length * 0.02) {
    return !/(ingredient|instruction|direction|recipe|preheat|tbsp|tsp|\bcups?\b|minutes)/i.test(t)
  }
  return false
}

// 제목도 같이 걸러야 한다. 동의문 페이지의 제목은 "YouTube"·"Just a moment…" 같은 껍데기라
// 그대로 저장하면 Inbox에 "YouTube"라는 레시피가 쌓인다(실제로 그렇게 저장됐다).
const JUNK_TITLES = ['youtube', 'instagram', 'error', 'sign in', 'log in', '로그인', 'redirecting']
export function looksLikeJunkTitle(t = '') {
  const s = String(t).trim()
  if (!s) return true
  const low = s.toLowerCase().replace(/[.…\s]+$/, '')
  if (JUNK_TITLES.includes(low)) return true
  return JUNK_MARKS.some((k) => low.includes(k)) || /^just a moment|^attention required/.test(low)
}

// 네이버 블로그는 본문이 iframe 안에 있어 원 주소로는 읽기 어렵다.
// blog.naver.com/아이디/글번호 → 본문이 바로 나오는 PostView·모바일 주소로 바꿔 시도한다.
function candidateUrls(raw) {
  const url = raw.trim()
  const urls = [url]
  const m = url.match(/blog\.naver\.com\/([\w.-]+)\/(\d+)/)
  if (m) {
    urls.unshift(`https://m.blog.naver.com/${m[1]}/${m[2]}`)
    urls.unshift(`https://blog.naver.com/PostView.naver?blogId=${m[1]}&logNo=${m[2]}`)
  }
  return urls
}

// jina 응답: "Title: ...\nURL Source: ...\nMarkdown Content:\n<본문>"
function parseJina(text) {
  const titleM = text.match(/^Title:\s*(.+)$/m)
  const idx = text.indexOf('Markdown Content:')
  let body = idx >= 0 ? text.slice(idx + 'Markdown Content:'.length) : text
  // 마크다운 잡음 제거: 이미지, 링크(글자만 남김), 헤딩 기호, 구분선
  body = body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^[-=*_]{3,}\s*$/gm, '')
    .replace(/[|`>]/g, ' ')
  return { title: titleM ? titleM[1].trim() : '', body: body.trim() }
}

export async function fetchLinkRecipe(rawUrl) {
  // 유튜브는 읽지 않는다. 페이지가 자바스크립트로 그려지고 동의 벽이 있어 읽기 서비스로는
  // 영상 설명이 아니라 영어 안내문만 온다(창업자 제보 "영어로 이상한 말만 복사됨").
  // 제목만 가져오는 건 의미가 없다고 판단해(창업자 2026-07-29) oEmbed도 쓰지 않는다.
  // 제대로 하려면 서버 + YouTube Data API 가 필요 → 앱에선 '준비 중'으로 안내한다.
  if (isYouTube(rawUrl)) return null

  const urls = candidateUrls(rawUrl)
  let titleOnly = ''

  // 1) 본문 읽기 (jina reader)
  for (const u of urls) {
    try {
      const res = await fetchWithTimeout('https://r.jina.ai/' + u, {
        headers: { Accept: 'text/plain', 'x-timeout': '15' },
      })
      if (!res.ok) continue
      const raw = await res.text()
      const { title, body } = parseJina(raw)
      if (body && body.replace(/\s/g, '').length > 60 && !looksLikeJunk(body)) {
        return { title, text: body, full: true }
      }
      if (title && !titleOnly && !looksLikeJunkTitle(title)) titleOnly = title
    } catch {
      /* 다음 후보로 */
    }
  }

  // 2) 원문 HTML 폴백 (allorigins) — 네이버 블로그 본문(.se-main-container) 등
  for (const u of urls.slice(0, 2)) {
    try {
      const res = await fetchWithTimeout('https://api.allorigins.win/raw?url=' + encodeURIComponent(u))
      if (!res.ok) continue
      const html = await res.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')
      doc.querySelectorAll('script,style,noscript').forEach((n) => n.remove())
      const el =
        doc.querySelector('.se-main-container') ||
        doc.querySelector('#postViewArea') ||
        doc.querySelector('article') ||
        doc.body
      const text = (el?.textContent || '').replace(/\n{3,}/g, '\n\n').trim()
      const title = (doc.querySelector('.se-title-text')?.textContent || doc.title || '').trim()
      if (text.replace(/\s/g, '').length > 80 && !looksLikeJunk(text)) return { title, text, full: true }
      if (title && !titleOnly && !looksLikeJunkTitle(title)) titleOnly = title
    } catch {
      /* 다음 후보로 */
    }
  }

  // 3) 제목만이라도 (noembed)
  try {
    const res = await fetchWithTimeout('https://noembed.com/embed?url=' + encodeURIComponent(rawUrl))
    if (res.ok) {
      const j = await res.json()
      if (j && j.title && !j.error && !looksLikeJunkTitle(j.title)) return { title: String(j.title).trim(), text: '', full: false }
    }
  } catch {
    /* noop */
  }

  return titleOnly ? { title: titleOnly, text: '', full: false } : null
}
