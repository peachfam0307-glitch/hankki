import { useRef, useState } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import { useBackHandler } from '../useBackHandler'
import { guessCategory, openExternal } from '../utils'
import { parseRecipeText } from '../parseRecipe'
import { fetchLinkRecipe } from '../linkReader'
import { guessFoodIcon } from '../components/FoodIcon'
import Icon from '../components/Icon'
import Portal from '../components/Portal'

// '사진으로 가져오기'와 '직접 작성하기'는 결국 같은 작성 화면 — 하나로 합쳤다.
// 캡처는 작성 화면에서 재료/만드는 법 칸별로 읽어 채운다(인식이 훨씬 정확).
const OPTIONS = [
  // 제일 많이 쓰는 방법이라 맨 위
  { key: 'write', icon: 'photo', title: '사진 · 직접 작성하기', desc: '캡처는 재료·만드는 법 칸별로 읽어 채워요', color: '#8AA07A' },
  { key: 'instagram', icon: 'instagram', title: 'Instagram', desc: '인스타그램 게시물 가져오기', color: '#C13584' },
  { key: 'youtube', icon: 'youtube', title: 'YouTube', desc: '유튜브 영상 정보 가져오기', color: '#E33' },
  { key: 'text', icon: 'edit', title: '텍스트 붙여넣기', desc: '레시피 글을 붙여넣으면 자동 정리', color: '#B0895E' },
  { key: 'link', icon: 'link', title: '링크 붙여넣기', desc: '웹사이트 주소를 붙여넣기', color: '#9B8B79' },
]

export default function ImportScreen() {
  const { addRecipe } = useStore()
  const nav = useNav()
  const [flow, setFlow] = useState(null) // instagram | youtube | link | text
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [help, setHelp] = useState(false)
  const [aiPreview, setAiPreview] = useState(false) // AI 자동정리 미리보기(곧 출시)
  const [linkBusy, setLinkBusy] = useState(false)
  const linkCancel = useRef(false)

  // 뒤로가기: 열린 시트·하위 흐름을 먼저 닫는다(바로 홈으로 안 나가게).
  useBackHandler(() => {
    if (aiPreview) { setAiPreview(false); return true }
    if (help) { setHelp(false); return true }
    if (flow) { setFlow(null); return true }
    return false
  })

  const saveText = () => {
    const t = text.trim()
    if (!t) return
    const r = parseRecipeText(t)
    // pop 하지 않고 push → 뒤로가기 시 '가져오기'로 복귀. (저장하면 편집기가 popAll로 홈)
    // 메모는 직접 입력 전용 — 분류 안 된 찌꺼기를 메모에 붙이지 않는다
    nav.push({ name: 'editor', prefill: { source: 'manual', title: r.title, ingredients: r.ingredients, steps: r.steps } })
  }

  const choose = (key) => {
    if (key === 'write') {
      // 사진·직접 작성 — 작성 화면에서 재료/만드는 법 칸별 📷 로 채운다.
      // pop 하지 않고 그대로 push → 뒤로가기 시 '가져오기' 초기 화면으로 돌아온다.
      nav.push({ name: 'editor' })
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

  // 링크 자동 읽기(베타) — 유튜브 설명·블로그 본문을 읽어 재료·순서까지 채운다.
  // 아무리 오래 걸려도 25초 안에는 결과(또는 실패)를 돌려준다.
  const readLink = async () => {
    const u = url.trim()
    if (!u || linkBusy) return
    linkCancel.current = false
    setLinkBusy(true)
    const r = await Promise.race([
      fetchLinkRecipe(u).catch(() => null),
      new Promise((res) => setTimeout(() => res(null), 25000)),
    ])
    setLinkBusy(false)
    if (linkCancel.current) return
    if (r && r.full) {
      const parsed = parseRecipeText(r.text, { fromOcr: true })
      const hasContent = parsed.ingredients.length || parsed.steps.length
      nav.push({
        name: 'editor',
        prefill: {
          source: flow === 'youtube' ? 'youtube' : 'link',
          title: title.trim() || parsed.title || r.title || '',
          ingredients: parsed.ingredients,
          steps: parsed.steps,
          sourceUrl: u, // 메모는 직접 입력 전용 — 자동으로 채우지 않는다
        },
      })
      nav.showToast(hasContent ? '링크에서 레시피를 읽어왔어요 ✨' : '글을 읽어왔어요 · 내용을 확인해 주세요')
    } else if (r && r.title) {
      addRecipe(makeInboxRecipe({ source: flow || 'link', title: r.title, sourceUrl: u }))
      nav.pop()
      nav.push({ name: 'inbox' })
      nav.showToast('본문은 못 읽어서 제목만 채웠어요 · Inbox 저장')
    } else {
      nav.showToast('이 링크는 자동으로 읽지 못했어요 · 아래 "링크만 저장"을 이용해 주세요')
    }
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

      {linkBusy && (
        <div className="ocr-overlay">
          <div className="ocr-box">
            <div className="ocr-spin" />
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 14 }}>링크에서 내용을 읽는 중…</div>
            <div className="t-sub" style={{ marginTop: 5, fontSize: 13 }}>페이지에 따라 10~25초 걸려요</div>
            <button
              className="press"
              onClick={() => { linkCancel.current = true; setLinkBusy(false) }}
              style={{ marginTop: 16, padding: '9px 22px', borderRadius: 12, background: 'var(--cream)', color: 'var(--text-sub)', fontSize: 13.5, fontWeight: 600 }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {!flow ? (
        <div className="pad">
          <div className="h-title" style={{ marginTop: 6 }}>가져오기</div>
          <div className="t-sub" style={{ marginTop: 8, marginBottom: 18, fontSize: 14 }}>
            레시피를 가져오는 방법을 선택해 주세요.
          </div>

          {/* AI 자동정리 — 곧 출시 미리보기(시그니처) */}
          <button
            className="press"
            onClick={() => setAiPreview(true)}
            style={{
              width: '100%', textAlign: 'left', marginBottom: 18, padding: '15px 16px',
              borderRadius: 18, border: '1px solid #d6e5cd',
              background: 'linear-gradient(135deg, #f2f8ed, #e8f1df)',
              display: 'flex', alignItems: 'center', gap: 13,
            }}
          >
            <div style={{
              width: 46, height: 46, borderRadius: 14, flexShrink: 0, fontSize: 24,
              background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(90,120,70,.16)',
            }}>✨</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 14.5, fontWeight: 800, color: '#4a7a45' }}>사진 찍으면 레시피가 돼요</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: '#7fa06a', borderRadius: 999, padding: '2px 7px' }}>곧 출시</span>
              </div>
              <div style={{ fontSize: 12.3, lineHeight: 1.5, color: 'var(--text-sub)' }}>
                캡처·링크만 올리면 AI가 재료·순서까지 척척
              </div>
            </div>
            <Icon name="chevron-right" size={18} color="#8aa07a" />
          </button>

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
          <div className="t-sub" style={{ marginTop: 6, marginBottom: 12, fontSize: 14 }}>
            {flow === 'instagram'
              ? '인스타는 캡션 글자를 복사할 수 없어요. 화면을 캡처해서 올리는 게 제일 정확해요.'
              : '영상엔 글자가 없어요. 설명(더보기)을 붙여넣거나, 화면을 캡처해서 올려주세요.'}
          </div>

          {/* 앱 바로 열기 — 링크 복사·캡처하러 갈 때 편하게 */}
          <button
            className="press"
            onClick={() => openExternal(flow === 'instagram' ? 'https://www.instagram.com/' : 'https://www.youtube.com/')}
            style={{
              width: '100%', marginBottom: 12, padding: 12, borderRadius: 'var(--r-md)',
              background: flowMeta.color, color: '#fff', fontSize: 14, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}
          >
            <Icon name={flowMeta.icon} size={18} color="#fff" stroke={2} /> {flowMeta.title} 열기 ↗
          </button>

          {/* 1순위 — 캡처해서 사진으로 (어디서나 가장 확실) */}
          <div className="card" style={{ padding: 15, marginBottom: 12, background: 'var(--cream)', border: 'none' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brown)', marginBottom: 6 }}>📷 캡처해서 올리기 · 추천</div>
            <div style={{ fontSize: 12.8, lineHeight: 1.65, color: 'var(--text)', marginBottom: 12 }}>
              레시피가 보이는 화면을 <b>캡처(스크린샷)</b>한 뒤, 작성 화면에서
              <b> 재료 사진·만드는 법 사진</b>을 각각 올리면 훨씬 정확하게 채워져요.
            </div>
            <button
              className="btn-primary press"
              style={{ width: '100%' }}
              onClick={() => {
                nav.push({ name: 'editor', prefill: { source: flow, sourceUrl: url.trim() } })
              }}
            >
              캡처한 사진으로 작성하기 →
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

          {/* 3순위 — 링크 자동 읽기(베타) / 링크만 저장 */}
          <div className="card" style={{ padding: 14, border: 'none' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>🔗 링크로 가져오기</div>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={placeholderFor(flow)} inputMode="url" style={{ marginBottom: 8 }} />
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목 (선택 · 비우면 자동)" style={{ marginBottom: 12 }} />
            {flow === 'youtube' && (
              <button className="btn-primary press" style={{ width: '100%', marginBottom: 8, opacity: url.trim() ? 1 : 0.5 }} onClick={readLink} disabled={!url.trim() || linkBusy}>
                {linkBusy ? '읽는 중…' : '✨ 설명란 자동으로 읽어오기 (베타)'}
              </button>
            )}
            <button
              className="btn-ghost press"
              style={{ width: '100%', marginBottom: 8 }}
              onClick={() => {
                nav.push({ name: 'editor', prefill: { source: flow, sourceUrl: url.trim(), watch: true } })
              }}
              disabled={!url.trim()}
            >
              {flow === 'youtube' ? '📺 영상 보면서 직접 적기' : '📷 미리보기 띄우고 직접 적기'}
            </button>
            <button className="btn-ghost press" style={{ width: '100%' }} onClick={saveLink} disabled={!url.trim()}>
              링크만 Inbox에 저장 (바로가기)
            </button>
            {flow === 'youtube' && (
              <div className="t-sub" style={{ fontSize: 11.5, marginTop: 8, lineHeight: 1.5 }}>
                ⚠️ 자동 읽기는 <b>영상 설명(더보기)에 레시피를 적어둔 영상만</b> 돼요.
                설명에 없으면 <b>영상 보면서 직접 적기</b>나, 레시피 화면 <b>캡쳐 → 사진으로 가져오기</b>를 이용해 주세요.
              </div>
            )}
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
            링크는 <b>바로가기(북마크)</b>로 저장하는 기능이에요. 레시피 내용까지 담으려면
            화면을 <b>캡쳐해서 사진으로 가져오기</b>가 제일 확실해요.
          </div>

          <div className="field">
            <label>링크 주소</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={placeholderFor(flow)} inputMode="url" autoFocus />
          </div>
          <div className="field">
            <label>제목 (선택)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예) 이모네 갈비찜" />
          </div>

          <button className="btn-primary press" style={{ marginBottom: 10, opacity: url.trim() ? 1 : 0.5 }} onClick={saveLink} disabled={!url.trim()}>
            🔗 링크를 Inbox에 저장 (바로가기)
          </button>
          <button className="btn-ghost press" style={{ width: '100%', marginBottom: 16 }} onClick={readLink} disabled={!url.trim() || linkBusy}>
            {linkBusy ? '본문 읽는 중…' : '✨ 본문 자동 읽기 시도 (베타)'}
          </button>

          <div className="card" style={{ padding: 14, background: 'var(--cream)', border: 'none', display: 'flex', gap: 10 }}>
            <Icon name="inbox" size={20} color="var(--brown)" />
            <div className="t-sub" style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--brown)' }}>
              자동 읽기는 블로그에 따라 되기도, 안 되기도 해요(로그인 필요 페이지는 불가).
              안 되면 링크만 저장해 두고 <b>캡쳐</b>나 <b>텍스트 붙여넣기</b>로 옮겨주세요.
            </div>
          </div>
        </div>
      )}

      {aiPreview && (
       <Portal>
        <div className="sheet-mask" onClick={() => setAiPreview(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 26 }}>
            <div className="emoji-sheet-head">
              <span>✨ AI 자동정리</span>
              <button className="press" onClick={() => setAiPreview(false)} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
            </div>
            <div style={{ padding: '4px 18px 0' }}>
              {/* 곧 출시 · 헤드라인 */}
              <div style={{ textAlign: 'center', padding: '8px 0 18px' }}>
                <span style={{ display: 'inline-block', marginBottom: 12, padding: '4px 12px', borderRadius: 999, background: '#eef5ea', color: '#4a7a45', fontSize: 12, fontWeight: 800 }}>곧 출시 ✨</span>
                <div style={{ fontSize: 21, fontWeight: 900, color: 'var(--brown)', lineHeight: 1.3, letterSpacing: '-0.02em' }}>사진 찍으면<br />레시피가 돼요</div>
                <div className="t-sub" style={{ fontSize: 13, marginTop: 9, lineHeight: 1.6 }}>캡처만 올리면 재료·순서를<br />칸칸이 알아서 정리해드려요.</div>
              </div>

              {/* 장점 */}
              <div className="card" style={{ padding: '4px 2px', background: 'var(--cream)', border: 'none' }}>
                {[
                  ['📷', '캡처 사진 인식', '레시피 화면을 캡처만 하면 재료·순서를 칸칸이 자동으로 채워요.'],
                  ['🔗', '인스타·유튜브 링크', '링크만 붙여넣어도 내용을 읽어 레시피로 정리해요.'],
                  ['⏱️', '옮겨적기 끝', '손으로 하나하나 타이핑할 필요 없이 몇 초면 완성.'],
                  ['✍️', '언제든 손보기', 'AI가 정리한 결과는 마음대로 고치고 다듬을 수 있어요.'],
                ].map(([emo, t, b]) => (
                  <div key={t} style={{ display: 'flex', gap: 11, padding: '11px 13px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 20, lineHeight: 1.2 }}>{emo}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{t}</div>
                      <div className="t-sub" style={{ fontSize: 12.3, lineHeight: 1.5 }}>{b}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="t-sub" style={{ fontSize: 12, lineHeight: 1.65, marginTop: 16, textAlign: 'center', color: 'var(--brown)' }}>
                지금은 <b>캡처·텍스트·링크</b>로 담을 수 있어요.<br />AI 자동정리가 준비되면 가장 먼저 알려드릴게요 💛
              </div>
            </div>
          </div>
        </div>
       </Portal>
      )}

      {help && (
       <Portal>
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
                  2. 한끼 → 가져오기 → <b>사진·직접 작성하기</b><br />
                  → 작성 화면에서 <b>재료 사진·만드는 법 사진</b>을 각각 올리면 정확하게 채워져요. <span className="t-sub" style={{ fontSize: 11.5 }}>길면 2~3장 나눠서 이어 붙여도 돼요!</span>
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
       </Portal>
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
