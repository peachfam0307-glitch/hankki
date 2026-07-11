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

const GUESS = {
  instagram: '명란 크림 파스타',
  youtube: '닭갈비 볶음밥',
  link: '단호박 스프',
}

export default function ImportScreen() {
  const { addRecipe } = useStore()
  const nav = useNav()
  const [flow, setFlow] = useState(null) // instagram | youtube | link
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
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
    const t = title.trim() || GUESS[flow] || '새 레시피'
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
      addRecipe(makeInboxRecipe({ source: 'photo', title: '사진 레시피', image: reader.result }))
      nav.pop()
      nav.push({ name: 'inbox' })
      nav.showToast('사진을 Inbox에 저장했어요')
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

          <div
            className="card"
            style={{ marginTop: 20, padding: 16, display: 'flex', alignItems: 'center', gap: 12, background: 'var(--cream)', border: 'none' }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>가져오기가 어렵다면?</div>
              <div className="t-sub" style={{ marginTop: 3 }}>도움말 보기</div>
            </div>
            <div className="opt-ico" style={{ background: '#fff' }}>
              <Icon name="help" size={22} color="var(--sand)" />
            </div>
          </div>
        </div>
      ) : (
        <div className="pad fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 4 }}>
            <div className="opt-ico">
              <Icon name={flowMeta.icon} size={24} color={flowMeta.color} stroke={1.7} />
            </div>
            <div className="h-title" style={{ fontSize: 22 }}>{flowMeta.title}</div>
          </div>
          <div className="t-sub" style={{ marginTop: 6, marginBottom: 22, fontSize: 14 }}>
            {flow === 'link' ? '레시피가 있는 웹페이지 주소를 붙여넣어 주세요.' : `${flowMeta.title} 주소를 붙여넣어 주세요.`}
          </div>

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
    </div>
  )
}

function placeholderFor(flow) {
  if (flow === 'instagram') return 'https://instagram.com/p/...'
  if (flow === 'youtube') return 'https://youtube.com/watch?v=...'
  return 'https://...'
}

export function makeInboxRecipe({ source, title, sourceUrl = '', image = null, category }) {
  return {
    id: newId(),
    title,
    emoji: '🍽️',
    image,
    source,
    category: category || guessCategory(title + ' ' + sourceUrl),
    tags: [],
    time: 0,
    servings: 0,
    difficulty: '',
    ingredients: [],
    steps: [],
    memo: '',
    sourceUrl,
    status: 'unsorted',
    folder: null,
    favorite: false,
    cooked: 0,
    savedAt: Date.now(),
  }
}
