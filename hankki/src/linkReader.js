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
      if (body && body.replace(/\s/g, '').length > 60) {
        return { title, text: body, full: true }
      }
      if (title && !titleOnly) titleOnly = title
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
      if (text.replace(/\s/g, '').length > 80) return { title, text, full: true }
      if (title && !titleOnly) titleOnly = title
    } catch {
      /* 다음 후보로 */
    }
  }

  // 3) 제목만이라도 (noembed)
  try {
    const res = await fetchWithTimeout('https://noembed.com/embed?url=' + encodeURIComponent(rawUrl))
    if (res.ok) {
      const j = await res.json()
      if (j && j.title && !j.error) return { title: String(j.title), text: '', full: false }
    }
  } catch {
    /* noop */
  }

  return titleOnly ? { title: titleOnly, text: '', full: false } : null
}
