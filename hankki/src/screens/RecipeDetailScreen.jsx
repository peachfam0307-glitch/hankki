import { useState, useRef } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import SourceBadge from '../components/SourceBadge'
import TimerSheet from '../components/TimerSheet'
import DiaryEntrySheet, { Stars } from '../components/DiaryEntrySheet'
import Portal from '../components/Portal'
import ConfirmSheet from '../components/ConfirmSheet'
import FoodIcon, { guessFoodIcon } from '../components/FoodIcon'
import DecorLayer from '../components/DecorLayer'
import DecorEditor from '../components/DecorEditor'
import KitchenGuideSheet from '../components/KitchenGuideSheet'
import { shareDecoratedCover } from '../shareCover'
import { scaleIngredient } from '../scale'
import { dateLabel, openExternal } from '../utils'
import { SOURCES } from '../data/seed'
import { picksForIngredients, productLink, productMall } from '../data/curation'
import { useWakeLock } from '../useWakeLock'
import { useLayerBack } from '../useBackHandler'
import CoachMarks, { needsCoach } from '../components/CoachMarks'
import ShareDrawCard from '../components/ShareDrawCard'

// 첫 방문 코치마크 — 숨어 있는 중요 기능을 반짝이며 알려준다(창업자 딸 아이디어 ⭐)
const COACH_KEY = 'hankki:coach:detail'
const COACH_STEPS = [
  { sel: '[data-coach="edit"]', label: '✏️ 편집', desc: '재료·만드는 법, 언제든 고칠 수 있어요' },
  { sel: '[data-coach="shop"]', label: '🛒 재료 장보기 담기', desc: '필요한 재료를 한 번에 장보기 리스트에 담아요. 담은 건 장보기 탭에서 체크하며 사면 편해요' },
  { sel: '[data-coach="pantry"]', label: '🌿 주부의 장바구니', desc: '18년차 주부가 진짜 쓰는 재료예요. 탭하면 바로 사러가기로 연결돼요' },
  { sel: '[data-coach="share"]', label: '💌 친구와 레시피 공유하기', desc: '재료·만드는 법이 담긴 예쁜 카드로 보내요' },
  { sel: '[data-coach="decor"]', label: '🎨 레시피 꾸미기', desc: '스티커·마스킹테이프·손글씨로 나만의 표지!' },
  { sel: '[data-coach="cook"]', label: '🍳 요리 시작', desc: '큰 글씨 요리모드 · 화면 안 꺼짐 · 단계 타이머' },
]

// 재료 목록에서 '[양념]'·'[소스]'·'[드레싱]'처럼 대괄호만 있는 줄은 소제목(헤더)으로 그린다.
// (장보기 담기·인분 환산에서 제외) — 전 레시피 양념/소스 표기 통일용.
const isIngHeader = (s) => /^\[[^\]]+\]$/.test(String(s).trim())

export default function RecipeDetailScreen({ id }) {
  const { recipes, toggleFavorite, cook, removeRecipe, addShopItems, addShopItem, diary, addDiary, removeDiary, updateRecipe } = useStore()
  const nav = useNav()
  useWakeLock() // 레시피를 보며 요리할 때 화면이 꺼지지 않게
  const [menu, setMenu] = useState(false)
  const [timer, setTimer] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [logEntry, setLogEntry] = useState(null)
  const [decorOpen, setDecorOpen] = useState(false)
  const [guide, setGuide] = useState(false) // 요리 가이드(계량·손질) 시트
  const [drawOpen, setDrawOpen] = useState(false) // 🎴 공유 뽑기카드
  const [shareSheet, setShareSheet] = useState(false) // 공유 두 갈래 시트
  // 인라인 오버레이(꾸미기·더보기 메뉴) — 뒤로가기로 닫기.
  // (타이머·삭제확인·기록·가이드 시트는 각자 자체 처리)
  useLayerBack(decorOpen, () => setDecorOpen(false))
  useLayerBack(menu, () => setMenu(false))
  const [coach, setCoach] = useState(() => needsCoach(COACH_KEY))
  const iconRef = useRef(null)
  const coverRef = useRef(null) // 꾸민 표지(레꾸) 캡처용
  const r = recipes.find((x) => x.id === id)
  const baseServings = r?.servings || 0
  const [servings, setServings] = useState(baseServings || 1)
  const ratio = baseServings ? servings / baseServings : 1

  if (!r) {
    return (
      <div className="screen">
        <div className="topbar-back">
          <button className="icon-btn press" onClick={() => nav.pop()}><Icon name="chevron-left" size={24} /></button>
        </div>
        <div className="empty">레시피를 찾을 수 없어요.</div>
      </div>
    )
  }

  const info = [
    r.time ? `${r.time}분` : null,
    r.servings ? `${r.servings}인분` : null,
    r.difficulty || null,
  ].filter(Boolean)

  const myEntries = diary.filter((d) => d.recipeId === id).sort((a, b) => b.at - a.at)
  const latestEntry = myEntries[0]
  const cookedN = r?.cooked || myEntries.length

  const onCook = () => {
    // 오늘 이미 기록이 있으면(요리모드 완료 등) 새로 만들지 않고 그 기록을 이어서 쓴다 — 하루 두 번 집계 방지
    const today = new Date().toDateString()
    const existing = myEntries.find((d) => new Date(d.at).toDateString() === today)
    if (existing) {
      setLogEntry(existing)
      nav.showToast('오늘 기록에 이어서 남겨요 ✍️')
      return
    }
    const entry = { id: newId(), recipeId: r.id, title: r.title, source: r.source, at: Date.now(), rating: 0, note: '', photo: null }
    addDiary(entry)
    cook(r.id)
    setLogEntry(entry)
    nav.showToast('만들었어요! 요리 기록에 남겼어요 🎉')
  }

  const del = () => {
    setMenu(false)
    setConfirmDel(true)
  }
  const doDelete = () => {
    removeRecipe(r.id)
    nav.pop()
    nav.showToast('레시피를 삭제했어요')
  }

  // 💌 공유 = 두 갈래 시트: 🎴 랜덤 뽑기카드(정적) / 🎨 내 꾸민 표지(효과 보이게 캡처)
  const onShare = () => { setMenu(false); setShareSheet(true) }
  // 꾸민 표지가 있나(배경·스티커·데코 중 하나라도) → 있으면 "내 꾸민 표지로" 옵션 노출
  const isDecorated = (r.decor && r.decor.length) || (r.decorBg && r.decorBg !== 'none') || r.thumb === 'none'
  const doShareCover = async () => {
    setShareSheet(false)
    nav.showToast('🎨 내가 꾸민 표지 그대로 공유 · 이미지 만드는 중…')
    const appUrl = location.origin + location.pathname.replace(/[^/]*$/, '')
    await shareDecoratedCover({ coverEl: coverRef.current, title: r.title, info, appUrl })
  }

  // 이 레시피가 쓴 '주부의 장바구니' 제품(재료에 제품명이 적혀 있으면 자동 매칭) — 구매 연결
  // 재료뿐 아니라 메모도 스캔한다. (특화 제품만 재료에 이름 남기고, 나머지 내 제품은 메모로 옮겼기 때문)
  const pantryPicks = picksForIngredients([...(r?.ingredients || []), r?.memo || ''])
  const addAllPicks = () => {
    pantryPicks.forEach((p) => addShopItem({ name: p.name, url: productLink(p) }))
    nav.showToast(`장바구니 재료 ${pantryPicks.length}개를 장보기에 담았어요 🛒`)
  }

  return (
    <div className="screen fade" style={{ paddingBottom: 0 }}>
      {/* 공유 카드용 숨은 아이콘 (SVG 직렬화 소스) */}
      <div ref={iconRef} aria-hidden style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
        <FoodIcon name={r.icon || guessFoodIcon(r.title)} size={240} />
      </div>

      {/* 상단 오버레이 바 */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5, display: 'flex', justifyContent: 'space-between', padding: '10px 12px', paddingTop: 'calc(10px + var(--safe-top))' }}>
        <button className="round-btn press" onClick={() => nav.pop()} aria-label="뒤로"><Icon name="chevron-left" size={22} /></button>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* 편집 — 연필 아이콘만으론 약해서 글자 라벨 붙인 알약으로 (직관적으로 눈에 띄게) */}
          <button
            className="press"
            onClick={() => nav.push({ name: 'editor', id: r.id })}
            data-coach="edit"
            aria-label="편집"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 38, padding: '0 14px', background: 'rgba(250,250,248,0.95)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', color: 'var(--brown)', fontSize: 13.5, fontWeight: 800, borderRadius: 999, boxShadow: '0 2px 10px rgba(0,0,0,.18)' }}
          >
            <Icon name="edit" size={17} color="var(--brown)" stroke={2.4} /> 편집
          </button>
          <button className="round-btn press" onClick={() => toggleFavorite(r.id)} aria-label="즐겨찾기">
            <Icon name="bookmark" size={20} color={r.favorite ? '#c2703f' : 'currentColor'} style={{ fill: r.favorite ? '#c2703f' : 'none' }} />
          </button>
          {/* 공유 — 눈에 띄게 채움색(포인트 브라운) 알약. 바이럴 진입점이라 강조. */}
          <button
            className="press"
            onClick={onShare}
            data-coach="share"
            aria-label="친구와 레시피 공유하기"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 38, padding: '0 16px', background: 'var(--brown)', color: '#fffdf8', fontSize: 13.5, fontWeight: 800, borderRadius: 999, boxShadow: '0 3px 12px rgba(120,70,40,.32)', border: 'none' }}
          >
            <Icon name="share" size={17} color="#fffdf8" stroke={2.3} /> 공유
          </button>
          <button className="round-btn press" onClick={() => setMenu(true)} aria-label="더보기"><Icon name="more" size={22} /></button>
        </div>
      </div>

      {/* 히어로 이미지(표지) — 꾸미기 스티커·포스트잇이 이 위에 얹힌다. ref로 통째 캡처(자랑 공유) */}
      <div ref={coverRef} style={{ position: 'relative' }}>
        <Thumb recipe={r} ratio="1/1" radius={0} emojiSize="4.5rem" style={{ borderRadius: 0 }} />
        <DecorLayer items={r.decor || []} />
        {/* 표지 꾸미기 — 솔직한 버튼으로 눈에 띄게(포인트색 채운 알약). 캡처에선 제외(data-nocapture) */}
        <button
          className="press"
          onClick={() => setDecorOpen(true)}
          data-coach="decor"
          data-nocapture
          aria-label="레시피 꾸미기"
          style={{ position: 'absolute', bottom: 12, right: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--brown)', color: '#fff', fontSize: 13.5, fontWeight: 800, padding: '9px 15px', borderRadius: 999, boxShadow: '0 4px 14px rgba(0,0,0,.3)' }}
        >
          🎨 레시피 꾸미기
        </button>
      </div>

      <div className="pad" style={{ paddingTop: 18, paddingBottom: 120 }}>
        {r.status === 'unsorted' && (
          <button
            className="card press"
            style={{ width: '100%', textAlign: 'left', padding: 14, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', background: 'var(--cream)', border: 'none' }}
            onClick={() => nav.push({ name: 'editor', id: r.id })}
          >
            <Icon name="edit" size={20} color="var(--brown)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--brown)' }}>아직 정리 전이에요</div>
              <div className="t-sub" style={{ fontSize: 12.5 }}>제목·재료·태그를 정리하고 레시피로 저장하기</div>
            </div>
            <Icon name="chevron-right" size={18} color="var(--brown)" />
          </button>
        )}

        {/* 즐겨찾기는 상단 오버레이 북마크 하나로 통일 (중복 버튼 정리) */}
        <div className="h-title" style={{ fontSize: 24 }}>{r.title}</div>

        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
          <SourceBadge source={r.source} size={16} showLabel={false} />
          <span className="t-sub" style={{ marginLeft: 2 }}>{SOURCES[r.source]?.label || '링크'}에서 가져옴</span>
          {/* 저장 날짜 — 자동 기록(savedAt) */}
          {r.savedAt && <span className="t-sub">· {dateLabel(r.savedAt)} 저장</span>}
        </div>

        {info.length > 0 && (
          <div className="info-pills" style={{ marginTop: 16 }}>
            {info.map((t) => (
              <span key={t} className="info-pill">{t}</span>
            ))}
          </div>
        )}

        {r.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {r.tags.map((t) => (
              <span key={t} className="tag"># {t}</span>
            ))}
          </div>
        )}

        {/* 내 요리 기록 — 위로 올려 잘 보이게. 별점·만든 횟수·최근 메모 요약, 탭하면 남기기/보기.
            (‘나만의 팁’은 이제 표지 꾸미기 포스트잇·글자로 — 역할이 겹치지 않게 분리) */}
        {(myEntries.length > 0 || cookedN > 0) && (
          <button
            className="card press"
            onClick={() => { if (latestEntry) setLogEntry(latestEntry) }}
            style={{ width: '100%', textAlign: 'left', marginTop: 18, padding: 13, display: 'flex', gap: 12, alignItems: 'center', background: 'var(--cream)', border: 'none' }}
          >
            {latestEntry?.photo ? (
              <img src={latestEntry.photo} alt="" style={{ width: 50, height: 50, borderRadius: 12, objectFit: 'cover', flex: '0 0 auto' }} />
            ) : (
              <div style={{ width: 50, height: 50, borderRadius: 12, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', fontSize: 22 }}>✍️</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 14.5, fontWeight: 700 }}>내 요리 기록</span>
                {latestEntry?.rating > 0 && <Stars value={latestEntry.rating} onChange={() => {}} size={13} />}
              </div>
              <div className="t-sub" style={{ fontSize: 12.5, marginTop: 3 }}>
                {cookedN}번 만들었어요{latestEntry ? ` · ${dateLabel(latestEntry.at)}` : ''}
              </div>
              {latestEntry?.note && (
                <div style={{ fontSize: 13, marginTop: 4, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>“{latestEntry.note}”</div>
              )}
            </div>
            <Icon name="chevron-right" size={18} color="var(--sand)" />
          </button>
        )}

        {r.ingredients?.length > 0 && (
          <>
            <div className="sec-head" style={{ marginTop: 26, marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div className="h-section">재료</div>
                <button className="press" onClick={() => setGuide(true)} aria-label="계량·손질 가이드" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 999, background: 'var(--cream)' }}>
                  <Icon name="help" size={14} color="var(--brown)" />
                </button>
              </div>
              <button
                className="mini-buy press"
                data-coach="shop"
                onClick={() => {
                  addShopItems(r.ingredients.filter((ing) => !isIngHeader(ing)).map((ing) => scaleIngredient(ing, ratio)))
                  nav.showToast('재료를 장보기 리스트에 담았어요 🛒')
                }}
              >
                장보기 담기
              </button>
            </div>
            {baseServings > 0 && (
              <div className="serv-row">
                <span className="serv-label">인분</span>
                <button className="serv-btn press" onClick={() => setServings((v) => Math.max(1, v - 1))} aria-label="줄이기"><Icon name="minus" size={16} color="var(--brown)" /></button>
                <span className="serv-val">{servings}인분</span>
                <button className="serv-btn press" onClick={() => setServings((v) => Math.min(20, v + 1))} aria-label="늘리기"><Icon name="plus" size={16} color="var(--brown)" /></button>
                {servings !== baseServings && <button className="serv-reset press" onClick={() => setServings(baseServings)}>기본 {baseServings}인분</button>}
              </div>
            )}
            <div>
              {r.ingredients.map((ing, i) => (
                isIngHeader(ing)
                  ? <div key={i} className="ing-head">{ing.trim().replace(/^\[|\]$/g, '')}</div>
                  : <div key={i} className="ing">{scaleIngredient(ing, ratio)}</div>
              ))}
            </div>
          </>
        )}

        {/* 주부의 장바구니 픽 — 이 레시피가 쓴 제품을 바로 사러가기. 재료 바로 밑(잘 보이는 자리)·수익 연결 */}
        {pantryPicks.length > 0 && (
          <div data-coach="pantry" className="card" style={{ marginTop: 20, padding: 14, background: 'var(--cream)', border: '1.5px solid var(--cream-deep)' }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--brown)', marginBottom: 6 }}>🛒 이 레시피, 이걸로 만들었어요</div>
            <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 10, lineHeight: 1.55 }}>재료를 <b style={{ color: 'var(--brown)' }}>왜 쓰는지 설명</b>은 <b style={{ color: 'var(--brown)' }}>🌿 장보기 → 주부의 장바구니</b>에 있어요</div>
            {pantryPicks.map((p) => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid rgba(0,0,0,.05)' }}>
                <span style={{ fontSize: 22, flex: '0 0 auto' }}>{p.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{p.name}</span>
                  {productMall(p) && <span style={{ marginLeft: 6, fontSize: 10.5, fontWeight: 700, color: 'var(--brown)', background: 'var(--cream-deep)', borderRadius: 5, padding: '1px 6px' }}>{productMall(p)}</span>}
                </div>
                <button className="press" onClick={() => openExternal(productLink(p))} style={{ flex: '0 0 auto', padding: '6px 13px', borderRadius: 10, background: 'var(--cream-deep)', color: 'var(--brown)', fontWeight: 800, fontSize: 12.5 }}>사러가기</button>
              </div>
            ))}
            <button className="press" onClick={addAllPicks} style={{ width: '100%', marginTop: 11, padding: '11px 0', borderRadius: 12, background: 'var(--brown)', color: '#fff', fontWeight: 800, fontSize: 14 }}>🛒 이 재료 다 담기</button>
            <div style={{ fontSize: 11.5, color: 'var(--text-sub)', textAlign: 'center', marginTop: 7, lineHeight: 1.5 }}>담아두고 장보기에서 체크하며 사면 편해요 · 18년차 주부가 진짜 쓰는 재료예요 🌿</div>
          </div>
        )}

        {r.steps?.length > 0 && (
          <>
            <div className="sec-head" style={{ marginTop: 26, marginBottom: 6 }}>
              <div className="h-section">만드는 법</div>
              <button className="mini-buy press" onClick={() => setTimer(true)}>⏱ 타이머</button>
            </div>
            <div>
              {r.steps.map((s, i) => (
                <div key={i} className="step">
                  <div className="n">{i + 1}</div>
                  <div className="txt">{s}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {r.memo && (
          <>
            <div className="h-section" style={{ marginTop: 26, marginBottom: 8 }}>메모</div>
            <div className="card" style={{ padding: 14, fontSize: 14, lineHeight: 1.6, color: 'var(--text)', background: 'var(--cream)', border: 'none', whiteSpace: 'pre-line' }}>
              {r.memo}
            </div>
          </>
        )}

        {r.sourceUrl && (
          <>
            <div className="h-section" style={{ marginTop: 26, marginBottom: 8 }}>원본 링크</div>
            <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="card press" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, textDecoration: 'none', color: 'var(--text)' }}>
              <Icon name="link" size={20} color="var(--sand)" />
              <span style={{ flex: 1, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sourceUrl}</span>
              <Icon name="chevron-right" size={18} color="var(--sand)" />
            </a>
          </>
        )}

      </div>

      {/* 하단 액션 — 요리 시작 / 만들었어요 */}
      <div className="action-bar" style={{ display: 'flex', gap: 10 }}>
        {r.steps?.length > 0 && (
          <button className="btn-primary press" data-coach="cook" style={{ flex: 1 }} onClick={() => nav.push({ name: 'cook', id: r.id })}>
            요리 시작 →
          </button>
        )}
        <button
          className={r.steps?.length > 0 ? 'btn-ghost press' : 'btn-primary press'}
          style={{ flex: r.steps?.length > 0 ? '0 0 auto' : 1, paddingLeft: 18, paddingRight: 18 }}
          onClick={onCook}
        >
          만들었어요 🎉
        </button>
      </div>

      {/* 첫 방문 코치마크 — 화면 어두워지고 중요 버튼이 반짝이며 안내 */}
      {coach && <CoachMarks storageKey={COACH_KEY} steps={COACH_STEPS} onDone={() => setCoach(false)} />}

      {decorOpen && (
        <DecorEditor
          recipe={r}
          onSave={(items, bg, thumb) => {
            updateRecipe(r.id, { decor: items, decorBg: bg || 'none', thumb })
            setDecorOpen(false)
            const dressed = items.length || (bg && bg !== 'none') || thumb === 'none'
            nav.showToast(dressed ? '표지를 예쁘게 꾸몄어요 🎀' : '꾸미기를 비웠어요')
          }}
          onClose={() => setDecorOpen(false)}
        />
      )}

      {timer && <TimerSheet label={r.title} onClose={() => setTimer(false)} />}

      {confirmDel && (
        <ConfirmSheet
          title="레시피 삭제"
          message={`『${r.title}』 레시피를 삭제할까요?`}
          confirmLabel="삭제하기"
          danger
          onConfirm={doDelete}
          onClose={() => setConfirmDel(false)}
        />
      )}

      {logEntry && (
        <DiaryEntrySheet
          entry={logEntry}
          onClose={() => setLogEntry(null)}
          onDelete={() => { removeDiary(logEntry.id); setLogEntry(null); nav.showToast('기록을 삭제했어요') }}
        />
      )}

      {guide && <KitchenGuideSheet onClose={() => setGuide(false)} />}

      {shareSheet && (
        <Portal>
          <div className="sheet-mask" onClick={() => setShareSheet(false)}>
            <div className="sheet" onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: 16.5, fontWeight: 800, textAlign: 'center', color: 'var(--text)' }}>친구랑 공유하기 💌</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-sub)', textAlign: 'center', margin: '4px 0 16px' }}>예쁜 카드로 카톡·인스타에 톡 보내요</div>
              <button className="press" onClick={() => { setShareSheet(false); setDrawOpen(true) }}
                style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', padding: '15px 16px', borderRadius: 16, background: 'var(--cream)', border: 'none', marginBottom: 10, textAlign: 'left' }}>
                <span style={{ fontSize: 30 }}>🎴</span>
                <span><span style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--text)' }}>랜덤 카드 뽑기</span><br /><span style={{ fontSize: 12.5, color: 'var(--text-sub)' }}>곰펭이 매번 다르게 · 안 꾸며도 예쁘게</span></span>
              </button>
              <button className="press" onClick={isDecorated ? doShareCover : () => { setShareSheet(false); setDecorOpen(true) }}
                style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', padding: '15px 16px', borderRadius: 16, background: 'var(--cream)', border: 'none', textAlign: 'left' }}>
                <span style={{ fontSize: 30 }}>🎨</span>
                <span><span style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--text)' }}>내가 꾸민 표지로</span><br /><span style={{ fontSize: 12.5, color: 'var(--text-sub)' }}>{isDecorated ? '배경·스티커·효과 그대로 캡처' : '먼저 예쁘게 꾸며볼까요 →'}</span></span>
              </button>
            </div>
          </div>
        </Portal>
      )}

      {drawOpen && <Portal><ShareDrawCard recipe={r} onClose={() => setDrawOpen(false)} onSaveCover={(img) => { updateRecipe(r.id, { thumb: 'photo', image: img }); nav.showToast('카드를 표지로 저장했어요 ✨') }} /></Portal>}

      {menu && (
       <Portal>
        <div className="sheet-mask" onClick={() => setMenu(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            {/* 공유는 상단 공유 아이콘으로 이동 — 여기엔 삭제만(실수 방지로 한 겹 숨김) */}
            <button className="sheet-item press" onClick={del} style={{ color: 'var(--danger)' }}>
              <Icon name="trash" size={20} color="var(--danger)" /> 삭제하기
            </button>
            <hr className="divider" />
            <button className="sheet-item press" onClick={() => setMenu(false)} style={{ justifyContent: 'center', color: 'var(--text-sub)' }}>
              닫기
            </button>
          </div>
        </div>
       </Portal>
      )}
    </div>
  )
}
