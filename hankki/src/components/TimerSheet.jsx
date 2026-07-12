import { useState } from 'react'
import { useTimer, SOUNDS } from '../timer'
import Icon from './Icon'

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
  const { start, soundId, setSound, previewSound } = useTimer()
  const [min, setMin] = useState(5)
  const [sec, setSec] = useState(0)

  const go = (m) => { start(m * 60, label); onClose() }
  const goCustom = () => { const s = min * 60 + sec; if (s > 0) { start(s, label); onClose() } }

  return (
    <div className="sheet-mask" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 22 }}>
        <div className="emoji-sheet-head">
          <span>⏱ 타이머 맞추기</span>
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

          <div className="emoji-cat" style={{ marginTop: 18 }}>알림음 (눌러서 미리듣기)</div>
          <div className="sound-row">
            {SOUNDS.map((s) => (
              <button
                key={s.id}
                className={`sound-chip press ${soundId === s.id ? 'on' : ''}`}
                onClick={() => { setSound(s.id); previewSound(s.id) }}
              >
                <span style={{ fontSize: 21 }}>{s.emoji}</span>
                <span>{s.name}</span>
              </button>
            ))}
          </div>

          <button className="btn-primary press" style={{ width: '100%', marginTop: 20 }} onClick={goCustom}>
            {min}분 {sec > 0 ? `${sec}초 ` : ''}시작
          </button>
        </div>
      </div>
    </div>
  )
}
