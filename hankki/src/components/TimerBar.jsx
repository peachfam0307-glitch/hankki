import { useTimer, fmtTime } from '../timer'
import Icon from './Icon'

// 화면 하단(내비 위)에 떠 있는 진행 타이머. 끝나면 강조 + '확인'.
export default function TimerBar({ bottom = 0 }) {
  const { timer, stop, addMinute } = useTimer()
  if (!timer) return null
  const pct = timer.total ? Math.min(100, (1 - timer.remaining / timer.total) * 100) : 0
  return (
    <div className={`timer-bar ${timer.done ? 'done' : ''}`} style={{ bottom }}>
      {!timer.done && <div className="timer-bar-fill" style={{ width: pct + '%' }} />}
      <div className="timer-bar-in">
        <span className="tb-emoji"><Icon name={timer.done ? 'alert' : 'clock'} size={19} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="tb-label">{timer.done ? '시간 다 됐어요!' : timer.label}</div>
          <div className="tb-time">{timer.done ? '완료' : fmtTime(timer.remaining)}</div>
        </div>
        {!timer.done && (
          <button className="tb-btn press" onClick={() => addMinute(1)}>+1분</button>
        )}
        <button className="tb-btn primary press" onClick={stop}>
          {timer.done ? '확인' : <Icon name="x" size={16} color="#fff" stroke={2.6} />}
        </button>
      </div>
    </div>
  )
}
