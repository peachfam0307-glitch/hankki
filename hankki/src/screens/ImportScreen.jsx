import { useRef, useState } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import { guessCategory } from '../utils'
import Icon from '../components/Icon'

const OPTIONS = [
  { key: 'instagram', icon: 'instagram', title: 'Instagram', desc: '인스타그램 게시물 가져오기', color: '#C13584' },
  { key: 'youtube', icon: 'youtube', title: 'YouTube', desc: '유튜브 영상 정보 가져오기', color: '#E33' },
  { key: 'link', icon: 'link', title: '링크 붙여넣기', desc: '웹사이트 주소를 붙여넣기', color: '#9B8B79' },
  { key: 'photo', icon: 'photo', title: '사진으로 가져오기', desc: '레시피 사진을 분석하여 저장', color: '#8AA07A' },
  { key: 'manual', icon: 'pen', title: '직접 작성하기', desc: '직접 레시피를 작성하기', color: '#B98A4E' },
]

const OPEN_URL = { instagram: 'https://www.instagram.com', youtube: 'https://www.youtube.com' }

export default function ImportScreen() {
  const { addRecipe } = useStore()
  const nav = useNav()
  const [flow, setFlow] = useState(null) // instagram | youtube | link
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [help, setHelp] = useState(false)
  const fileRef = useRef(null)

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

  const onFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      // 사진을 넣으면 편집 화면을 열고 바로 글자를 자동 인식(OCR)
      nav.pop()
      nav.push({ name: 'editor', prefill: { image: reader.result, source: 'photo', autoOcr: true } })
    }
    reader.readAsDataURL(file)
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

      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />

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
      ) : (
        <div className="pad fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 4 }}>
            <div className="opt-ico">
              <Icon name={flowMeta.icon} size={24} color={flowMeta.color} stroke={1.7} />
            </div>
            <div className="h-title" style={{ fontSize: 22 }}>{flowMeta.title}</div>
          </div>
          <div className="t-sub" style={{ marginTop: 6, marginBottom: 16, fontSize: 14 }}>
            {flow === 'link' ? '레시피가 있는 웹페이지 주소를 붙여넣어 주세요.' : `${flowMeta.title} 링크를 복사해 붙여넣거나, 아래 방법으로 바로 보내세요.`}
          </div>

          {(flow === 'instagram' || flow === 'youtube') && (
            <div className="card" style={{ padding: 14, marginBottom: 16, background: 'var(--cream)', border: 'none' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--brown)', marginBottom: 6 }}>💡 복사 없이 더 쉽게</div>
              <div style={{ fontSize: 12.8, lineHeight: 1.65, color: 'var(--text)' }}>
                {flowMeta.title} 게시물에서 <b>공유(↗)</b> 아이콘 → 목록에서 <b>‘한끼’</b>를 고르면 복사·붙여넣기 없이 바로 Inbox에 담겨요.
              </div>
              <button
                className="press"
                onClick={() => window.open(OPEN_URL[flow], '_blank', 'noopener,noreferrer')}
                style={{ marginTop: 11, padding: '9px 14px', borderRadius: 10, background: '#fff', color: 'var(--brown)', fontWeight: 700, fontSize: 13 }}
              >
                {flowMeta.title} 열기 →
              </button>
            </div>
          )}

          <div className="field">
            <label>링크 주소</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={placeholderFor(flow)}
              inputMode="url"
              autoFocus
            />
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
                <div className="imp-tip-h">📲 제일 편해요 — 앱에서 바로 공유</div>
                <div className="imp-tip-b">
                  1. 인스타·유튜브·블로그에서 게시물 열기<br />
                  2. <b>공유(↗ 종이비행기 / ⋯)</b> 아이콘 탭<br />
                  3. 목록에서 <b>‘한끼’</b> 선택<br />
                  → 복사·붙여넣기 없이 자동으로 Inbox에 담겨요! <span className="t-sub" style={{ fontSize: 11.5 }}>(앱을 설치해야 공유 목록에 떠요)</span>
                </div>
              </div>
              <div className="imp-tip">
                <div className="imp-tip-h">🔗 링크로 가져오기</div>
                <div className="imp-tip-b">
                  1. 게시물에서 <b>‘링크 복사’</b><br />
                  2. 한끼 → 가져오기 → Instagram/링크 → <b>붙여넣기</b>
                </div>
              </div>
              <div className="imp-tip">
                <div className="imp-tip-h">📷 사진으로 가져오기</div>
                <div className="imp-tip-b">
                  레시피가 적힌 사진·캡처를 고르면 글자를 자동으로 읽어 재료·순서를 채워줘요.<br />
                  <span className="t-sub" style={{ fontSize: 11.5 }}>또렷하고 글자가 큰 사진일수록 정확해요. 화면 캡처가 사진 촬영보다 잘 읽혀요.</span>
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
