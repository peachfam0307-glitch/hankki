import { useState } from 'react'
import Portal from './Portal'
import Icon from './Icon'
import { useModalBack } from '../useBackHandler'
import { setPin, checkPin, getHint, hasPin, resetAllLocks } from '../diaryLock'

// 🔒 비번 네 자리 — 일기 잠금 (창업자 확정 2026-08-15)
//
// ⭐ **우리 숫자판을 그린다.** 폰 키보드를 띄우지 않는다 —
//    ⑴ 키보드가 올라오면 화면이 위로 밀려 자물쇠가 가려진다
//    ⑵ 종이 다이어리 자물쇠는 «돌리는 것»이지 타이핑하는 게 아니다
//    ⛔ UI에 유니코드 이모지 금지(CLAUDE.md) — 숫자는 글자라 괜찮고, 자물쇠는 우리 Icon 이다.
//
// mode = 'set'(처음 잠글 때 비번 정하기) | 'check'(열 때 확인)

const 점 = (n, len) => (n < len ? '●' : '○')

function 숫자판({ onNum, onBack, disabled }) {
  const 칸 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '←']
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 9, maxWidth: 268, margin: '0 auto' }}>
      {칸.map((c, i) => {
        if (!c) return <span key={i} />
        const 지우기 = c === '←'
        return (
          <button
            key={i}
            type="button"
            className="press"
            disabled={disabled}
            onClick={() => (지우기 ? onBack() : onNum(c))}
            style={{
              padding: '15px 0', borderRadius: 14, border: 'none',
              background: 지우기 ? 'transparent' : 'var(--cream)',
              color: 지우기 ? 'var(--text-sub)' : 'var(--brown)',
              fontSize: 지우기 ? 19 : 21, fontWeight: 700,
              opacity: disabled ? 0.4 : 1,
            }}
            aria-label={지우기 ? '지우기' : c}
          >
            {c}
          </button>
        )
      })}
    </div>
  )
}

export default function LockSheet({ mode = 'check', onClose, onDone }) {
  useModalBack(onClose)
  const [pin, setPinText] = useState('')
  const [confirm, setConfirm] = useState(null) // set 모드 2단계: 처음 친 네 자리
  const [hint, setHint] = useState('')
  const [step, setStep] = useState(mode === 'set' ? 'first' : 'check') // first | again | hint | check
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [잊음, set잊음] = useState(false)

  const 저장된힌트 = getHint()

  const 눌러 = async (c) => {
    if (busy || pin.length >= 4) return
    const next = pin + c
    setPinText(next)
    setErr('')
    if (next.length < 4) return
    // 네 자리가 찼다 — 단계마다 할 일이 다르다
    setBusy(true)
    try {
      if (step === 'first') {
        setConfirm(next)
        setPinText('')
        setStep('again')
      } else if (step === 'again') {
        if (next !== confirm) {
          setErr('두 번 친 게 서로 달라요 · 처음부터 다시')
          setPinText('')
          setConfirm(null)
          setStep('first')
        } else {
          setPinText('')
          setStep('hint')
        }
      } else if (step === 'check') {
        const ok = await checkPin(next)
        if (ok) { onDone(); return }
        setErr('비번이 안 맞아요')
        setPinText('')
      }
    } finally {
      setBusy(false)
    }
  }

  const 힌트마치기 = async () => {
    setBusy(true)
    const ok = await setPin(confirm, hint.trim())
    setBusy(false)
    if (!ok) { setErr('저장이 안 됐어요 · 잠시 뒤 다시'); return }
    onDone()
  }

  const 제목 = { first: '비번 네 자리를 정해줘', again: '한 번 더 눌러줘', hint: '잊었을 때 볼 힌트', check: '비번 네 자리' }[step]

  return (
    <Portal>
      <div className="sheet-mask" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'calc(14px + var(--safe-bottom))' }}>
          <div className="emoji-sheet-head">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Icon name="lock" size={17} color="var(--brown)" />
              {제목}
            </span>
            <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
          </div>

          <div style={{ padding: '4px 16px 0' }}>
            {step === 'hint' ? (
              <>
                {/* 💡 힌트는 «건너뛸 수 있다» — 강제하면 아무 말이나 치고 넘어간다.
                    ⛔ 비번 자체를 힌트에 적지 말라고 한 줄로 말해 준다(실제로 그렇게 적는 사람이 많다). */}
                <div className="t-sub" style={{ fontSize: 12.5, lineHeight: 1.65, marginBottom: 11 }}>
                  비번은 되찾을 길이 없어서 <b style={{ color: 'var(--brown)' }}>이 힌트가 하나뿐인 실마리</b>예요. 안 써도 돼요.<br />
                  <b style={{ color: 'var(--brown)' }}>비번 숫자 자체는 적지 말기</b> — 남도 같이 보게 되니까.
                </div>
                <input
                  value={hint}
                  onChange={(e) => setHint(e.target.value.slice(0, 40))}
                  placeholder="예: 우리 결혼기념일"
                  style={{ width: '100%', padding: '12px 13px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--cream)', fontSize: 14.5, marginBottom: 12 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="press" disabled={busy} onClick={힌트마치기} style={{ flex: 1, padding: 13, borderRadius: 12, background: 'var(--cream)', color: 'var(--text-sub)', fontWeight: 600, fontSize: 14, border: 'none' }}>
                    안 쓸래
                  </button>
                  <button className="press" disabled={busy} onClick={힌트마치기} style={{ flex: 1.5, padding: 13, borderRadius: 12, background: 'var(--brown)', color: '#fff', fontWeight: 700, fontSize: 14.5, border: 'none' }}>
                    잠그기
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* ⚪ 네 자리 — 점으로만 보여준다 */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 15, fontSize: 26, color: 'var(--brown)', letterSpacing: '.04em', margin: '6px 0 4px' }}>
                  {[0, 1, 2, 3].map((i) => <span key={i}>{점(i, pin.length)}</span>)}
                </div>
                <div style={{ minHeight: 34, textAlign: 'center', fontSize: 12.5, lineHeight: 1.5, padding: '4px 0 6px', color: err ? 'var(--danger)' : 'var(--text-sub)', fontWeight: err ? 700 : 500 }}>
                  {err || (step === 'check'
                    ? (저장된힌트 ? `힌트 · ${저장된힌트}` : '이 일기는 잠겨 있어요')
                    : step === 'first' ? '이 비번으로 일기를 잠가' : '틀리지 않게 한 번 더')}
                </div>
                <숫자판 onNum={눌러} onBack={() => { setPinText(pin.slice(0, -1)); setErr('') }} disabled={busy} />

                {/* ⚠️⚠️ **「못 찾는다」를 «정하는 그 순간»에 말한다** (창업자 2026-08-15
                    *"비밀번호는 찾을 수 없다는 안내(서버에 저장되지 않아 비번을 찾기어려움)"*)
                    ⭐ 잊은 «뒤»에 알려주면 늦다 — 그때는 이미 못 여는 일기가 생긴 뒤다.
                    ⭐⭐ 그리고 이건 **우리 약점이 아니라 강점**이다. 서버가 0개라 우리도 못 본다.
                       그래서 「우리가 안 갖고 있어서」를 «먼저» 말하고 「그래서 못 찾아준다」로 잇는다.
                    ⛔ 「완전 암호화」라고는 쓰지 않는다 — 이건 «가리는 것»이다. */}
                {step === 'first' && (
                  <div style={{ marginTop: 14, padding: '11px 13px', borderRadius: 12, background: 'var(--cream)', fontSize: 12.5, lineHeight: 1.65, color: 'var(--text-sub)' }}>
                    비번은 <b style={{ color: 'var(--brown)' }}>이 폰에만</b> 있어요 · 서버에 저장하지 않아요.
                    <br />그래서 <b style={{ color: 'var(--danger)' }}>잊으면 찾아드릴 수 없어요</b> — 다음에 힌트를 남길 수 있어요.
                  </div>
                )}

                {/* 🆘 잊었을 때 — ⛔ 우회 코드는 만들지 않는다(있으면 잠금이 아니다).
                    ✅ 대신 «무엇을 잃는지 먼저 말하고» 확인을 받는다. 조용히 지우지 않는다. */}
                {step === 'check' && hasPin() && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                    {!잊음 ? (
                      <button className="press" onClick={() => set잊음(true)} style={{ width: '100%', padding: '9px 0', background: 'none', border: 'none', color: 'var(--text-sub)', fontSize: 12.5, fontWeight: 600, textDecoration: 'underline' }}>
                        비번을 잊었어
                      </button>
                    ) : (
                      <>
                        <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-sub)', marginBottom: 10 }}>
                          되찾는 길이 없어서 <b style={{ color: 'var(--danger)' }}>잠금을 아예 없애는 것</b>밖에 안 돼.
                          <br />일기 글과 사진은 <b style={{ color: 'var(--brown)' }}>그대로 남아</b> — 잠긴 날들이 전부 다시 열릴 뿐이야.
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="press" onClick={() => set잊음(false)} style={{ flex: 1, padding: 11, borderRadius: 12, background: 'var(--cream)', color: 'var(--text-sub)', fontWeight: 600, fontSize: 13.5, border: 'none' }}>
                            그만둘래
                          </button>
                          <button className="press" onClick={() => { resetAllLocks(); onDone({ reset: true }) }} style={{ flex: 1, padding: 11, borderRadius: 12, background: 'var(--cream)', color: 'var(--danger)', fontWeight: 700, fontSize: 13.5, border: 'none' }}>
                            잠금 없애기
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Portal>
  )
}
