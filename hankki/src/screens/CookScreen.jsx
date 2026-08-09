import { useState } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import TimerSheet from '../components/TimerSheet'
import CookBuddy from '../components/CookBuddy'
import Portal from '../components/Portal'
import { scaleIngredient } from '../scale'
import { useWakeLock } from '../useWakeLock'
import { useLayerBack } from '../useBackHandler'

// 요리 모드 — 풀스크린. 큰 글씨 · 화면 안 꺼짐 · 단계 타이머.
// 흐름: 0단계 = 재료 준비(요리의 시작) → 1~N단계 = 조리 단계.
export default function CookScreen({ id }) {
  const { recipes, cook, addDiary, diary } = useStore()
  const nav = useNav()
  const r = recipes.find((x) => x.id === id)
  const steps = r?.steps || []
  const ings = r?.ingredients || []
  const [i, setI] = useState(0) // 0 = 재료 준비, 1..steps.length = 조리 단계
  const [showTimer, setShowTimer] = useState(false)
  const [showIng, setShowIng] = useState(false)
  // ☑️ 재료 준비 체크 — 창업자 2026-08-09 *"준비단계에서 체크박스가 있으면 어떨까. 단순 체크용도로."*
  //    ⭐ **저장하지 않는다.** 이건 «이번에 요리하는 동안»만 쓰는 표시라, 다음에 또 만들 땐 깨끗해야 한다.
  //       (레시피에 저장하면 다음번에 «남이 체크해둔 것»처럼 보인다)
  //    ⭐ 상태를 CookScreen 이 들고 있어서 조리 단계로 갔다 돌아와도 체크가 남는다.
  const [checked, setChecked] = useState({})
  const toggle = (k) => setChecked((c) => ({ ...c, [k]: !c[k] }))
  // 재료 시트 — 뒤로가기로 닫기(요리모드는 유지). 타이머 시트는 자체 처리.
  useLayerBack(showIng, () => setShowIng(false))
  useWakeLock() // 화면이 꺼지지 않게 (요리 모드)
  const prep = i === 0 // 재료 준비 화면인지

  if (!r || steps.length === 0) {
    return (
      <div className="cook">
        <div className="cook-top">
          <button className="round-btn press" onClick={() => nav.pop()}><Icon name="x" size={22} /></button>
        </div>
        <div className="empty" style={{ marginTop: 40 }}>만드는 법 단계가 없어요.</div>
      </div>
    )
  }

  const last = i >= steps.length // 마지막 조리 단계 (i는 1..steps.length)
  const finish = () => {
    // 오늘 이미 이 레시피 기록이 있으면(상세의 '만들었어요' 등) 중복으로 쌓지 않는다
    const today = new Date().toDateString()
    const dup = diary.some((d) => d.recipeId === r.id && new Date(d.at).toDateString() === today)
    if (!dup) {
      addDiary({ id: newId(), recipeId: r.id, title: r.title, source: r.source, at: Date.now(), rating: 0, note: '', photo: null })
      cook(r.id)
    }
    nav.popAll()
    nav.showToast('완성! 요리 기록에 담았어요 별점·팁은 레시피 화면에서')
  }

  return (
    <div className="cook">
      <div className="cook-top">
        <button className="round-btn press" onClick={() => nav.pop()} aria-label="닫기"><Icon name="x" size={22} /></button>
        <div className="cook-title">{r.title}</div>
        <button className="cook-ing-btn press" onClick={() => setShowIng(true)}>재료</button>
      </div>

      <div className="cook-progress">
        {/* 0 = 재료 준비, 이후 조리 단계 */}
        {Array.from({ length: steps.length + 1 }).map((_, k) => (
          <button key={k} className={`cp-seg ${k <= i ? 'on' : ''}`} onClick={() => setI(k)} aria-label={k === 0 ? '재료 준비' : `${k}단계`} />
        ))}
      </div>

      {prep ? (
        <div className="cook-body">
          <div className="cook-stepno">재료 준비 <span>· 요리의 시작</span></div>
          <div style={{ width: '100%', maxWidth: 460, margin: '4px auto 0', textAlign: 'left' }}>
            {/* ☑️ 눌러서 체크 — 창업자 2026-08-09 *"준비단계에서 체크박스가 있으면 어떨까. 단순 체크용도로."*
                ⭐ 재료를 «꺼내면서» 하나씩 지워가는 자리다. 그래서 저장도 계산도 안 한다 — 표시만.
                ⭐ 줄 전체가 버튼이라 손가락이 작은 네모를 겨냥할 필요가 없다(최소 높이 44).
                ⛔ 유니코드 ✓ 대신 우리 아이콘(`check`)을 쓴다 — CLAUDE.md 핀. */}
            {ings.length ? ings.map((ing, k) => (
              <button
                key={k} type="button" className="press" aria-pressed={!!checked[k]}
                onClick={() => toggle(k)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11, width: '100%', minHeight: 44,
                  padding: '6px 4px', background: 'none', border: 'none', textAlign: 'left',
                }}>
                <span style={{
                  flex: '0 0 auto', width: 23, height: 23, borderRadius: 7,
                  border: checked[k] ? 'none' : '2px solid var(--line)',
                  background: checked[k] ? 'var(--brown)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {checked[k] && <Icon name="check" size={15} color="#fff" stroke={2.6} />}
                </span>
                {/* ⭐ 체크한 줄은 «흐리게 ＋ 취소선» — 「했다」가 한눈에 보인다(장보기 목록과 같은 문법) */}
                <span className="ing" style={{
                  fontSize: 17, flex: 1, minWidth: 0,
                  opacity: checked[k] ? 0.44 : 1,
                  textDecoration: checked[k] ? 'line-through' : 'none',
                }}>{scaleIngredient(ing, 1)}</span>
              </button>
            )) : <div className="empty">재료 정보가 없어요.</div>}
          </div>
          {/* 안내 — 화면 안 꺼짐 · 타이머는 필요할 때 */}
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 9, width: '100%', maxWidth: 460 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: 'var(--text-sub)' }}>
              <Icon name="bulb" size={18} color="var(--brown)" stroke={1.8} />
              요리하는 동안 화면이 꺼지지 않아요.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: 'var(--text-sub)' }}>
              <Icon name="clock" size={18} color="var(--brown)" stroke={1.8} />
              타이머는 필요할 때 단계에서 눌러 쓰세요.
            </div>
          </div>
        </div>
      ) : (
        <div className="cook-body">
          <CookBuddy stepText={steps[i - 1]} />
          <div className="cook-stepno">STEP {i} <span>/ {steps.length}</span></div>
          <div className="cook-steptext">{steps[i - 1]}</div>
          <button className="cook-timer press" onClick={() => setShowTimer(true)}>
            <Icon name="clock" size={19} color="var(--brown)" /> 이 단계 타이머 맞추기
          </button>
        </div>
      )}

      <div className="cook-nav">
        <button className="cook-navbtn press" disabled={i === 0} onClick={() => setI((v) => Math.max(0, v - 1))}>
          이전
        </button>
        {prep ? (
          <button className="cook-navbtn primary press" onClick={() => setI(1)} disabled={steps.length === 0}>재료 준비 완료 · 시작 →</button>
        ) : last ? (
          <button className="cook-navbtn primary press" onClick={finish} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}><Icon name="check" size={17} />다 만들었어요</button>
        ) : (
          <button className="cook-navbtn primary press" onClick={() => setI((v) => v + 1)}>다음 →</button>
        )}
      </div>

      {showTimer && <TimerSheet label={`${r.title} · STEP ${i}`} onClose={() => setShowTimer(false)} />}

      {showIng && (
       <Portal>
        <div className="sheet-mask" onClick={() => setShowIng(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 22 }}>
            <div className="emoji-sheet-head">
              <span>재료</span>
              <button className="press" onClick={() => setShowIng(false)} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
            </div>
            <div style={{ padding: '0 16px', maxHeight: '50vh', overflowY: 'auto' }}>
              {(r.ingredients || []).map((ing, k) => (
                <div key={k} className="ing">{scaleIngredient(ing, 1)}</div>
              ))}
            </div>
          </div>
        </div>
       </Portal>
      )}
    </div>
  )
}
