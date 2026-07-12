import { useState, useEffect, useRef } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import TimerSheet from '../components/TimerSheet'
import CookBuddy from '../components/CookBuddy'
import { scaleIngredient } from '../scale'

// 요리 모드 — 단계별 풀스크린. 큰 글씨 · 화면 안 꺼짐 · 단계 타이머 · 재료 보기.
export default function CookScreen({ id }) {
  const { recipes, cook, addDiary } = useStore()
  const nav = useNav()
  const r = recipes.find((x) => x.id === id)
  const steps = r?.steps || []
  const [i, setI] = useState(0)
  const [showTimer, setShowTimer] = useState(false)
  const [showIng, setShowIng] = useState(false)
  const wakeRef = useRef(null)

  // 화면이 꺼지지 않게 (Wake Lock). 지원 안 하면 조용히 무시.
  useEffect(() => {
    let stopped = false
    const req = async () => {
      try {
        if ('wakeLock' in navigator) wakeRef.current = await navigator.wakeLock.request('screen')
      } catch { /* noop */ }
    }
    req()
    const onVis = () => { if (document.visibilityState === 'visible' && !stopped) req() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      stopped = true
      document.removeEventListener('visibilitychange', onVis)
      try { wakeRef.current?.release() } catch { /* noop */ }
    }
  }, [])

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

  const last = i >= steps.length - 1
  const finish = () => {
    addDiary({ id: newId(), recipeId: r.id, title: r.title, source: r.source, at: Date.now(), rating: 0, note: '', photo: null })
    cook(r.id)
    nav.popAll()
    nav.showToast('완성! 일지에 기록했어요 🎉 별점·팁은 일지 탭에서')
  }

  return (
    <div className="cook">
      <div className="cook-top">
        <button className="round-btn press" onClick={() => nav.pop()} aria-label="닫기"><Icon name="x" size={22} /></button>
        <div className="cook-title">{r.title}</div>
        <button className="cook-ing-btn press" onClick={() => setShowIng(true)}>재료</button>
      </div>

      <div className="cook-progress">
        {steps.map((_, k) => (
          <button key={k} className={`cp-seg ${k <= i ? 'on' : ''}`} onClick={() => setI(k)} aria-label={`${k + 1}단계`} />
        ))}
      </div>

      <div className="cook-body">
        <CookBuddy stepText={steps[i]} />
        <div className="cook-stepno">STEP {i + 1} <span>/ {steps.length}</span></div>
        <div className="cook-steptext">{steps[i]}</div>
        <button className="cook-timer press" onClick={() => setShowTimer(true)}>
          <Icon name="clock" size={19} color="var(--brown)" /> 이 단계 타이머 맞추기
        </button>
      </div>

      <div className="cook-nav">
        <button className="cook-navbtn press" disabled={i === 0} onClick={() => setI((v) => Math.max(0, v - 1))}>
          이전
        </button>
        {last ? (
          <button className="cook-navbtn primary press" onClick={finish}>다 만들었어요 🎉</button>
        ) : (
          <button className="cook-navbtn primary press" onClick={() => setI((v) => v + 1)}>다음 →</button>
        )}
      </div>

      {showTimer && <TimerSheet label={`${r.title} · STEP ${i + 1}`} onClose={() => setShowTimer(false)} />}

      {showIng && (
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
      )}
    </div>
  )
}
