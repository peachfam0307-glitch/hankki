import { useRef, useState } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import { guessCategory } from '../utils'
import { parseRecipeText } from '../parseRecipe'
import { ocrImage } from '../ocr'
import { guessFoodIcon } from '../components/FoodIcon'
import Icon from '../components/Icon'

function readAsDataURL(file) {
  return new Promise((resolve) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => resolve(null)
    r.readAsDataURL(file)
  })
}

// 사진 desc 는 아래 OPTIONS 에서 여러 장 안내로 바꾼다.

const OPTIONS = [
  { key: 'instagram', icon: 'instagram', title: 'Instagram', desc: '인스타그램 게시물 가져오기', color: '#C13584' },
  { key: 'youtube', icon: 'youtube', title: 'YouTube', desc: '유튜브 영상 정보 가져오기', color: '#E33' },
  { key: 'text', icon: 'edit', title: '텍스트 붙여넣기', desc: '레시피 글을 붙여넣으면 자동 정리', color: '#B0895E' },
  { key: 'link', icon: 'link', title: '링크 붙여넣기', desc: '웹사이트 주소를 붙여넣기', color: '#9B8B79' },
  { key: 'photo', icon: 'photo', title: '사진으로 가져오기', desc: '여러 장 캡처도 한 번에 읽어 정리', color: '#8AA07A' },
  { key: 'manual', icon: 'pen', title: '직접 작성하기', desc: '직접 레시피를 작성하기', color: '#B98A4E' },
]

export default function ImportScreen() {
  const { addRecipe } = useStore()
  const nav = useNav()
  const [flow, setFlow] = useState(null) // instagram | youtube | link | text
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [help, setHelp] = useState(false)
  const [busy, setBusy] = useState(null) // null | { total, cur, pct }
  const fileRef = useRef(null)

  const saveText = () => {
    const t = text.trim()
    if (!t) return
    const r = parseRecipeText(t)
    nav.pop()
    nav.push({ name: 'editor', prefill: { source: 'manual', title: r.title, ingredients: r.ingredients, steps: r.steps, memo: r.memo } })
  }

  const choose = (key) => {
    if (key === 'manual') {
      nav.pop()
      nav.push({ name: 'editor' })
    } else if (key === 'photo') {
      fileRef.current?.click()
    } else {
      setFlow(key)
      setUrl('')
      setTitle('')
    }
  }

  const saveLink = () => {
    const t = title.trim() || `${flowMeta?.title || '새'} 레시피`
    addRecipe(makeInboxRecipe({ source: flow, title: t, sourceUrl: url.trim() }))
    nav.pop()
    nav.push({ name: 'inbox' })
    nav.showToast('Inbox에 저장했어요 · 나중에 정리해요')
  }

  // 사진 한 장이든 여러 장(길어서 나눠 캡처)이든, 다 읽어 하나의 레시피로 정리.
  const onFile = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    const images = (await Promise.all(files.map(readAsDataURL))).filter(Boolean)
    if (!images.length) return

    setBusy({ total: images.length, cur: 1, pct: 0 })
    let combined = ''
    for (let k = 0; k < images.length; k++) {
      const t = await ocrImage(images[k], (pct) => setBusy({ total: images.length, cur: k + 1, pct }))
      if (t && t.trim()) combined += (combined ? '\n' : '') + t.trim()
    }
    setBusy(null)

    const r = combined ? parseRecipeText(combined) : { title: '', ingredients: [], steps: [], memo: '' }
    nav.pop()
    // 캡처 사진은 '글자 읽기'용일 뿐 — 썸네일(아이콘)과 분리한다. 그래서 image 는 넘기지 않는다.
    nav.push({
      name: 'editor',
      prefill: { source: 'photo', title: r.title, ingredients: r.ingredients, steps: r.steps, memo: r.memo, autoOcr: false },
    })
  }

  const flowMeta = OPTIONS.find((o) => o.key === flow)

  return (
    <div className="screen fade" style={{ paddingBottom: 24 }}>
      <div className="topbar-back">
        <button className="icon-btn press" onClick={() => (flow ? setFlow(null) : nav.pop())} aria-label="닫기">
          <Icon name={flow ? 'chevron-left' : 'x'} size={24} />
        </button>
        <div style={{ fontSize: 16, fontWeight: 700 }} />
        <div style={{ width: 40 }} />
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFile} style={{ display: 'none' }} />

      {busy && (
        <div className="ocr-overlay">
          <div className="ocr-box">
            <div className="ocr-spin" />
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 14 }}>
              사진에서 글자 읽는 중…
            </div>
            <div className="t-sub" style={{ marginTop: 5, fontSize: 13 }}>
              {busy.total > 1 ? `${busy.total}장 중 ${busy.cur}장째 · ` : ''}{busy.pct}%
            </div>
          </div>
        </div>
      )}

      {!flow ? (
        <div className="pad">
          <div className="h-title" style={{ marginTop: 6 }}>가져오기</div>
          <div className="t-sub" style={{ marginTop: 8, marginBottom: 22, fontSize: 14 }}>
            레시피를 가져오는 방법을 선택해 주세요.
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            {OPTIONS.map((o, i) => (
              <div key={o.key}>
                <button className="opt-row press" onClick={() => choose(o.key)}>
                  <div className="opt-ico">
                    <Icon name={o.icon} size={24} color={o.color} stroke={1.7} />
                  </div>
                  <div className="t">
                    <div className="a">{o.title}</div>
                    <div className="b">{o.desc}</div>
                  </div>
                  <Icon name="chevron-right" size={18} color="var(--sand)" />
                </button>
                {i < OPTIONS.length - 1 && <hr className="divider" style={{ marginLeft: 74 }} />}
              </div>
            ))}
          </div>

          <button
            className="card press"
            style={{ width: '100%', textAlign: 'left', marginTop: 20, padding: 16, display: 'flex', alignItems: 'center', gap: 12, background: 'var(--cream)', border: 'none' }}
            onClick={() => setHelp(true)}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>가져오기가 어렵다면?</div>
              <div className="t-sub" style={{ marginTop: 3 }}>인스타·유튜브에서 한끼로 보내는 법 보기</div>
            </div>
            <div className="opt-ico" style={{ background: '#fff' }}>
              <Icon name="help" size={22} color="var(--sand)" />
            </div>
          </button>
        </div>
      ) : flow === 'text' ? (
        <div className="pad fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 4 }}>
            <div className="opt-ico"><Icon name="edit" size={24} color="#B0895E" stroke={1.7} /></div>
            <div className="h-title" style={{ fontSize: 22 }}>텍스트 붙여넣기</div>
          </div>
          <div className="t-sub" style={{ marginTop: 6, marginBottom: 16, fontSize: 14 }}>
            인스타 캡션·블로그·메모의 레시피 글을 그대로 붙여넣으면 제목·재료·순서로 자동 정리해요.
          </div>
          <textarea
            className="diary-note"
            style={{ minHeight: 220 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'여기에 레시피 글을 붙여넣어 주세요.\n\n예)\n된장크림파스타\n스파게티 200g\n된장 1큰술\n생크림 200ml\n1. 면을 삶는다\n2. 팬에 된장을 풀고 생크림을 넣는다'}
            autoFocus
          />
          <button className="btn-primary press" style={{ marginTop: 18 }} onClick={saveText}>
            자동 정리하기 →
          </button>
        </div>
      ) : flow === 'instagram' || flow === 'youtube' ? (
        <div className="pad fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 4 }}>
            <div className="opt-ico"><Icon name={flowMeta.icon} size={24} color={flowMeta.color} stroke={1.7} /></div>
            <div className="h-title" style={{ fontSize: 22 }}>{flowMeta.title}</div>
          </div>
          <div className="t-sub" style={{ marginTop: 6, marginBottom: 16, fontSize: 14 }}>
            {flow === 'instagram'
              ? '인스타는 캡션 글자를 복사할 수 없어요. 화면을 캡처해서 올리는 게 제일 정확해요.'
              : '영상엔 글자가 없어요. 설명(더보기)을 붙여넣거나, 화면을 캡처해서 올려주세요.'}
          </div>

          {/* 1순위 — 캡처해서 사진으로 (어디서나 가장 확실) */}
          <div className="card" style={{ padding: 15, marginBottom: 12, background: 'var(--cream)', border: 'none' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brown)', marginBottom: 6 }}>📷 캡처해서 올리기 · 추천</div>
            <div style={{ fontSize: 12.8, lineHeight: 1.65, color: 'var(--text)', marginBottom: 12 }}>
              레시피가 보이는 화면을 <b>캡처(스크린샷)</b>한 뒤 올리면, 글자를 자동으로 읽어 재료·순서까지 채워줘요.
              글이 길면 <b>2~3장 나눠</b> 캡처해도 한 번에 정리돼요.
            </div>
            <button className="btn-primary press" style={{ width: '100%' }} onClick={() => fileRef.current?.click()}>
              캡처한 사진 올리기
            </button>
          </div>

          {/* 2순위 — 글자를 복사할 수 있으면 텍스트로 */}
          <button
            className="card press"
            style={{ width: '100%', textAlign: 'left', padding: 14, marginBottom: 12, background: 'var(--cream)', border: 'none' }}
            onClick={() => { setFlow('text'); setText('') }}
          >
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--brown)', marginBottom: 4 }}>✍️ 글자를 복사할 수 있다면</div>
            <div className="t-sub" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
              {flow === 'youtube' ? '영상 설명(더보기)' : '레시피 글'}을 복사해 <b>텍스트로 붙여넣기</b> → 더 깔끔해요.
            </div>
          </button>

          {/* 3순위 — 링크만 저장(북마크) */}
          <div className="card" style={{ padding: 14, border: 'none' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>🔗 링크만 저장 · 나중에 보기</div>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={placeholderFor(flow)} inputMode="url" style={{ marginBottom: 8 }} />
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목 (선택 · 비우면 자동)" style={{ marginBottom: 12 }} />
            <button className="btn-ghost press" style={{ width: '100%' }} onClick={saveLink} disabled={!url.trim()}>
              링크를 Inbox에 저장
            </button>
          </div>

          <div className="t-sub" style={{ fontSize: 12, lineHeight: 1.6, marginTop: 14, textAlign: 'center' }}>
            💡 앱을 <b>설치</b>하면 {flowMeta.title} 공유(↗) 목록에 <b>‘한끼’</b>가 떠서 링크를 바로 보낼 수 있어요.
          </div>
        </div>
      ) : (
        <div className="pad fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 4 }}>
            <div className="opt-ico"><Icon name={flowMeta.icon} size={24} color={flowMeta.color} stroke={1.7} /></div>
            <div className="h-title" style={{ fontSize: 22 }}>{flowMeta.title}</div>
          </div>
          <div className="t-sub" style={{ marginTop: 6, marginBottom: 16, fontSize: 14 }}>
            레시피가 있는 웹페이지 주소를 붙여넣어 주세요. 블로그 글은 <b>복사해서 ‘텍스트 붙여넣기’</b>로 가져오면 재료·순서까지 정리돼요.
          </div>

          <div className="field">
            <label>링크 주소</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={placeholderFor(flow)} inputMode="url" autoFocus />
          </div>
          <div className="field">
            <label>제목 (선택)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="비워두면 자동으로 채워요" />
          </div>

          <div className="card" style={{ padding: 14, background: 'var(--cream)', border: 'none', display: 'flex', gap: 10 }}>
            <Icon name="inbox" size={20} color="var(--brown)" />
            <div className="t-sub" style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--brown)' }}>
              가져온 레시피는 바로 저장되지 않고 <b>Inbox</b>에 임시 보관돼요. 나중에 제목·태그·폴더를 정리할 수 있어요.
            </div>
          </div>

          <button className="btn-primary press" style={{ marginTop: 22 }} onClick={saveLink}>
            Inbox에 저장하기
          </button>
        </div>
      )}

      {help && (
        <div className="sheet-mask" onClick={() => setHelp(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 24 }}>
            <div className="emoji-sheet-head">
              <span>레시피 가져오는 법</span>
              <button className="press" onClick={() => setHelp(false)} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
            </div>
            <div style={{ padding: '2px 16px 0' }}>
              <div className="imp-tip">
                <div className="imp-tip-h">📷 인스타그램 — 캡처해서 올리기 (제일 정확)</div>
                <div className="imp-tip-b">
                  인스타는 캡션 글자를 복사할 수 없어요.<br />
                  1. 레시피가 보이는 화면을 <b>캡처(스크린샷)</b><br />
                  2. 한끼 → 가져오기 → <b>사진으로 가져오기</b><br />
                  → 글자를 자동으로 읽어 재료·순서를 채워줘요. <span className="t-sub" style={{ fontSize: 11.5 }}>길면 2~3장 나눠 캡처해도 한 번에!</span>
                </div>
              </div>
              <div className="imp-tip">
                <div className="imp-tip-h">✍️ 유튜브·블로그 — 글자 복사되면 붙여넣기</div>
                <div className="imp-tip-b">
                  유튜브 <b>설명(더보기)</b>이나 블로그 글은 대개 복사돼요.<br />
                  복사 → 가져오기 → <b>텍스트 붙여넣기</b> → 자동 정리! <span className="t-sub" style={{ fontSize: 11.5 }}>복사가 안 되면 캡처해서 사진으로.</span>
                </div>
              </div>
              <div className="imp-tip">
                <div className="imp-tip-h">📲 앱 설치하면 — 공유로 바로 담기</div>
                <div className="imp-tip-b">
                  앱을 설치하면 인스타·유튜브 <b>공유(↗)</b> 목록에 <b>‘한끼’</b>가 떠요.<br />
                  <span className="t-sub" style={{ fontSize: 11.5 }}>단, 인스타 공유는 ‘링크’만 보내져요(캡션은 안 와요). 내용까지 담으려면 캡처가 확실해요.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function placeholderFor(flow) {
  if (flow === 'instagram') return 'https://instagram.com/p/...'
  if (flow === 'youtube') return 'https://youtube.com/watch?v=...'
  return 'https://...'
}

export function makeInboxRecipe({ source, title, sourceUrl = '', image = null, category, memo = '' }) {
  return {
    id: newId(),
    title,
    // 가져온 레시피도 기본 썸네일은 브랜드 아이콘(통일감). 사진은 원하면 편집에서 고른다.
    thumb: 'icon',
    icon: guessFoodIcon(title),
    emoji: '🍽️',
    image,
    source,
    category: category || guessCategory(title + ' ' + memo),
    tags: [],
    time: 0,
    servings: 0,
    difficulty: '',
    ingredients: [],
    steps: [],
    memo,
    sourceUrl,
    status: 'unsorted',
    folder: null,
    favorite: false,
    cooked: 0,
    savedAt: Date.now(),
  }
}
