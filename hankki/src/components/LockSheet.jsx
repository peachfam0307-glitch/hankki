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

// lockedCount = 지금 잠겨 있는 일기가 몇 장인가. 「없애면 몇 장이 지워지는지」를 «미리» 말하려고 받는다.
export default function LockSheet({ mode = 'check', onClose, onDone, lockedCount = 0 }) {
  useModalBack(onClose)
  const [pin, setPinText] = useState('')
  const [confirm, setConfirm] = useState(null) // set 모드 2단계: 처음 친 네 자리
  const [hint, setHint] = useState('')
  const [step, setStep] = useState(mode === 'set' ? 'first' : 'check') // first | again | hint | check
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [잊음, set잊음] = useState(false) // false | true(1단 안내) | 2(진짜 지울지 마지막 확인)

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

  // 🗣🗣 **[2026-08-16] 화면 글자는 «해요체»다** — 창업자 제보 *"일기 잠금 안내 반말임 (잠금푸는 안내도)"*
  //   ⭐ 앱은 처음부터 「~어요」로 말한다(「비번이 안 맞아요」·「잠가 둔 일기예요」).
  //      그런데 **이 시트만 반말이 섞여** 있었다 — 같은 화면 안에서 말투가 튀면 남의 글처럼 읽힌다.
  //   ⛔ 아래 «화면에 나가는 글자»에는 반말을 쓰지 않는다(주석·변수명은 반말이어도 된다).
  const 제목 = { first: '비번 네 자리를 정해 주세요', again: '한 번 더 눌러 주세요', hint: '잊었을 때 볼 힌트', check: '비번 네 자리' }[step]

  return (
    <Portal>
      <div className="sheet-mask" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'calc(14px + var(--safe-bottom))' }}>
          <div className="emoji-sheet-head">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Icon name="lock" size={17} color="var(--brown)" />
              {제목}
            </span>
            <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 16, fontWeight: 600 }}>닫기</button>
          </div>

          <div style={{ padding: '4px 16px 0' }}>
            {step === 'hint' ? (
              <>
                {/* 💡 힌트는 «건너뛸 수 있다» — 강제하면 아무 말이나 치고 넘어간다.
                    ⛔ 비번 자체를 힌트에 적지 말라고 한 줄로 말해 준다(실제로 그렇게 적는 사람이 많다). */}
                <div className="t-sub" style={{ fontSize: 15.5, lineHeight: 1.65, marginBottom: 11 }}>
                  비번은 되찾을 길이 없어서 <b style={{ color: 'var(--brown)' }}>이 힌트가 하나뿐인 실마리</b>예요. 안 써도 돼요.<br />
                  <b style={{ color: 'var(--brown)' }}>비번 숫자 자체는 적지 말기</b> — 남도 같이 보게 되니까.
                </div>
                <input
                  value={hint}
                  onChange={(e) => setHint(e.target.value.slice(0, 40))}
                  placeholder="예: 우리 결혼기념일"
                  style={{ width: '100%', padding: '12px 13px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--cream)', fontSize: 16.5, marginBottom: 12 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="press" disabled={busy} onClick={힌트마치기} style={{ flex: 1, padding: 13, borderRadius: 12, background: 'var(--cream)', color: 'var(--text-sub)', fontWeight: 600, fontSize: 16, border: 'none' }}>
                    안 쓸래요
                  </button>
                  <button className="press" disabled={busy} onClick={힌트마치기} style={{ flex: 1.5, padding: 13, borderRadius: 12, background: 'var(--brown)', color: '#fff', fontWeight: 700, fontSize: 16.5, border: 'none' }}>
                    잠그기
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* ⚪ 네 자리 — 점으로만 보여준다 */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 15, fontSize: 27, color: 'var(--brown)', letterSpacing: '.04em', margin: '6px 0 4px' }}>
                  {[0, 1, 2, 3].map((i) => <span key={i}>{점(i, pin.length)}</span>)}
                </div>
                <div style={{ minHeight: 34, textAlign: 'center', fontSize: 15.5, lineHeight: 1.5, padding: '4px 0 6px', color: err ? 'var(--danger)' : 'var(--text-sub)', fontWeight: err ? 700 : 500 }}>
                  {err || (step === 'check'
                    ? (저장된힌트 ? `힌트 · ${저장된힌트}` : '이 일기는 잠겨 있어요')
                    : step === 'first' ? '이 비번으로 일기를 잠가요' : '틀리지 않게 한 번 더')}
                </div>
                <숫자판 onNum={눌러} onBack={() => { setPinText(pin.slice(0, -1)); setErr('') }} disabled={busy} />

                {/* ⚠️⚠️ **「못 찾는다」를 «정하는 그 순간»에 말한다** (창업자 2026-08-15
                    *"비밀번호는 찾을 수 없다는 안내(서버에 저장되지 않아 비번을 찾기어려움)"*)
                    ⭐ 잊은 «뒤»에 알려주면 늦다 — 그때는 이미 못 여는 일기가 생긴 뒤다.
                    ⭐⭐ 그리고 이건 **우리 약점이 아니라 강점**이다. 서버가 0개라 우리도 못 본다.
                       그래서 「우리가 안 갖고 있어서」를 «먼저» 말하고 「그래서 못 찾아준다」로 잇는다.
                    ⛔ 「완전 암호화」라고는 쓰지 않는다 — 이건 «가리는 것»이다. */}
                {step === 'first' && (
                  <div style={{ marginTop: 14, padding: '11px 13px', borderRadius: 12, background: 'var(--cream)', fontSize: 15.5, lineHeight: 1.65, color: 'var(--text-sub)' }}>
                    비번은 <b style={{ color: 'var(--brown)' }}>이 폰에만</b> 있어요 · 서버에 저장하지 않아요.
                    <br />그래서 <b style={{ color: 'var(--danger)' }}>잊으면 찾아드릴 수 없어요</b> — 다음에 힌트를 남길 수 있어요.
                  </div>
                )}

                {/* 🆘🆘 잊었을 때 — ⛔ 우회 코드는 만들지 않는다(있으면 잠금이 아니다).
                    🔓🔓 **[2026-08-16 창업자 판정 ⒜] 「잠금 없애기」는 잠긴 일기를 «같이 지운다».**
                      📮 창업자 *"일기잠금 의미없어. 비번 잊으면 잠금 풀게 해뒀잖아.
                         **누구든 비번 몇번 틀리면 잠금풀면 일기 다 봄**"* → 갈래 넷 중 ⒜ 선택.
                      ⛔⛔ **옛 판이 정확히 그 「정문」이었다** — 비번을 «모르는» 사람도 두 번 눌러
                         잠긴 일기를 전부 열 수 있었다. 폰을 빌려준 사람·가족·주운 사람 누구나.
                         ＋ 어제 내가 CLAUDE.md 에 *"우회 코드는 만들지 않는다"* 라고 적어놓고
                            정작 「잠금 해제」를 우회로로 만들어 뒀다. 규칙을 적은 사람이 어긴 자리다.
                      ✅ 이제 **내용을 지워야만 잠금이 풀린다** → 훔쳐볼 길이 사라진다.
                      ⭐ 우리 원칙 *"조용히 지우지 않는다"* 는 지킨다 — **몇 장이 지워지는지 먼저 말하고,
                         「지운다」는 낱말을 단추에 박고, 확인을 «한 번 더» 받는다.**
                      ⚠️ 진짜 잊은 사람은 그 일기를 잃는다. 그게 ⒜의 값이고, 그래서 두 번 묻는다. */}
                {step === 'check' && hasPin() && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                    {!잊음 ? (
                      <button className="press" onClick={() => set잊음(true)} style={{ width: '100%', padding: '9px 0', background: 'none', border: 'none', color: 'var(--text-sub)', fontSize: 15.5, fontWeight: 600, textDecoration: 'underline' }}>
                        비번을 잊었어요
                      </button>
                    ) : (
                      <>
                        <div style={{ fontSize: 15.5, lineHeight: 1.6, color: 'var(--text-sub)', marginBottom: 10 }}>
                          비번은 이 폰에만 있어서 <b style={{ color: 'var(--brown)' }}>되찾을 길이 없어요</b>.
                          <br />잠금을 없애려면 <b style={{ color: 'var(--danger)' }}>잠긴 일기 {lockedCount}장을 함께 지워야</b> 해요
                          {잊음 === 2 ? <> — <b style={{ color: 'var(--danger)' }}>지우면 되돌릴 수 없어요.</b></> : '.'}
                          <br />
                          <span style={{ color: 'var(--text-sub)' }}>
                            {잊음 === 2
                              ? '정말 지울까요? 이 단추를 누르면 바로 지워져요.'
                              : '내용만 남기고 잠금을 푸는 길은 없어요 — 그러면 남도 그렇게 열 수 있으니까요.'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="press" onClick={() => set잊음(false)} style={{ flex: 1, padding: 11, borderRadius: 12, background: 'var(--cream)', color: 'var(--text-sub)', fontWeight: 600, fontSize: 16.5, border: 'none' }}>
                            그만둘래요
                          </button>
                          <button
                            className="press"
                            onClick={() => {
                              // 1단 = 「지울래요」로 뜻을 밝힌다 · 2단 = 진짜 지운다. 한 번 눌러서는 안 지워진다.
                              if (잊음 !== 2) { set잊음(2); return }
                              resetAllLocks()
                              onDone({ reset: true, deleteLocked: true })
                            }}
                            style={{ flex: 1.5, padding: 11, borderRadius: 12, background: 잊음 === 2 ? 'var(--danger)' : 'var(--cream)', color: 잊음 === 2 ? '#fff' : 'var(--danger)', fontWeight: 700, fontSize: 16.5, border: 'none' }}
                          >
                            {잊음 === 2 ? `${lockedCount}장 지우기` : `잠긴 일기 ${lockedCount}장 지우고 풀기`}
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
