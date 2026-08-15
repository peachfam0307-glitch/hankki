import { useState } from 'react'
import { useTimer, SOUNDS } from '../timer'
import Icon from './Icon'
import Portal from './Portal'
import { useModalBack } from '../useBackHandler'

const PRESETS = [1, 3, 5, 10, 15, 30]

function Stepper({ label, value, setValue, max, step = 1 }) {
  const clamp = (v) => Math.max(0, Math.min(max, v))
  return (
    <div className="timer-stepper">
      <button className="press" onClick={() => setValue((v) => clamp(v - step))} aria-label="줄이기"><Icon name="minus" size={18} color="var(--brown)" /></button>
      <div className="ts-val"><b>{value}</b>{label}</div>
      <button className="press" onClick={() => setValue((v) => clamp(v + step))} aria-label="늘리기"><Icon name="plus" size={18} color="var(--brown)" /></button>
    </div>
  )
}

export default function TimerSheet({ label = '요리 타이머', onClose }) {
  useModalBack(onClose) // 뒤로가기 → 닫기
  const { start, soundId, setSound, previewSound } = useTimer()
  const [min, setMin] = useState(5)
  const [sec, setSec] = useState(0)

  const go = (m) => { start(m * 60, label); onClose() }
  const goCustom = () => { const s = min * 60 + sec; if (s > 0) { start(s, label); onClose() } }

  return (
   <Portal>
    <div className="sheet-mask" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 22 }}>
        <div className="emoji-sheet-head">
          <span>타이머 맞추기</span>
          <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
        </div>
        <div style={{ padding: '2px 16px 0' }}>
          <div className="timer-presets">
            {PRESETS.map((m) => (
              <button key={m} className="timer-preset press" onClick={() => go(m)}>{m}분</button>
            ))}
          </div>

          <div className="timer-custom">
            <Stepper label="분" value={min} setValue={setMin} max={180} />
            <span style={{ fontWeight: 800, color: 'var(--sand)', fontSize: 20 }}>:</span>
            <Stepper label="초" value={sec} setValue={setSec} max={59} step={10} />
          </div>

          {/* 🔔 [2026-08-13 테스터 · 창업자 전달 *"타이머 눌렀을때 알림음 있는지 모르더라 … 너무 작거나 잘 안보여"*]
              ⛔ 첫 판 = `emoji-cat`(작은 회색 라벨)로 「알림음 (눌러서 미리듣기)」 한 줄뿐이었다.
                 소리는 «나는데» 난다는 걸 모르니, 타이머를 켜 두고도 화면을 못 떠났다.
              ✅ 「끝나면 알려준다」를 «먼저» 말하고, 미리듣기는 그다음에 안내한다. */}
          <div style={{ marginTop: 18, fontSize: 14, fontWeight: 800, color: 'var(--brown)', letterSpacing: '-.3px' }}>
            끝나면 이 소리로 알려드려요
          </div>
          <div className="t-sub" style={{ fontSize: 12.5, marginTop: 3, marginBottom: 8 }}>눌러서 미리 들어볼 수 있어요</div>
          <div className="sound-row">
            {SOUNDS.map((s) => (
              <button
                key={s.id}
                className={`sound-chip press ${soundId === s.id ? 'on' : ''}`}
                onClick={() => { setSound(s.id); previewSound(s.id) }}
              >
                {/* ⛔ 유니코드 이모지를 쓰지 않는다. 딱 맞는 우리 아이콘이 없고(삐약삐약·마림바·종소리),
                    이름 자체가 소리 설명이라 **아이콘 열을 통째로 뺐다**(v8.63 '사용팁'과 같은 방식). */}
                <span>{s.name}</span>
              </button>
            ))}
          </div>

          <button className="btn-primary press" style={{ width: '100%', marginTop: 20 }} onClick={goCustom}>
            {min}분 {sec > 0 ? `${sec}초 ` : ''}시작
          </button>
          {/* ⭐ 「다른 화면에 있어도 울린다」를 «반드시» 말한다 — 타이머는 전역이라 실제로 그런데,
              그걸 모르면 유저가 타이머 화면에 붙들려 앉아 있는다(테스터가 그랬다). */}
          <div style={{ marginTop: 9, textAlign: 'center', fontSize: 12.8, lineHeight: 1.5, color: 'var(--brown)' }}>
            <b style={{ fontWeight: 800 }}>소리와 진동</b>으로 알려드려요<br />
            <span className="t-sub" style={{ fontSize: 12.3 }}>다른 화면에 있어도 울려요</span>
          </div>
        </div>
      </div>
    </div>
   </Portal>
  )
}
