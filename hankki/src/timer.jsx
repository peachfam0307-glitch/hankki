import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react'

// 전역 요리 타이머 — 화면을 옮겨다녀도 유지되고, 끝나면 소리+진동으로 알린다.
const TimerCtx = createContext(null)
export const useTimer = () => useContext(TimerCtx)

const SOUND_KEY = 'hankki:sound'

// Web Audio 로 알람음을 즉석에서 생성 (오디오 파일 없이 오프라인에서도 동작).
// 한 음(note) 재생 헬퍼.
function note(c, freq, t0, dur, { type = 'sine', vol = 0.4, glide } = {}) {
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (glide) osc.frequency.exponentialRampToValueAtTime(glide, t0 + dur * 0.9)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g)
  g.connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

// 귀여운 알람음 모음. play(c, t0) 로 스케줄한다.
export const SOUNDS = [
  {
    id: 'ding', name: '딩동', emoji: '🔔',
    play: (c, t) => { for (let k = 0; k < 2; k++) { const b = t + k * 0.85; note(c, 784, b, 0.45, { type: 'triangle', vol: 0.4 }); note(c, 523, b + 0.42, 0.5, { type: 'triangle', vol: 0.42 }) } },
  },
  {
    id: 'sparkle', name: '뾰로롱', emoji: '✨',
    play: (c, t) => { const s = [523, 659, 784, 1047, 784, 1047]; for (let k = 0; k < 2; k++) s.forEach((f, i) => note(c, f, t + k * 0.9 + i * 0.1, 0.16, { type: 'sine', vol: 0.34 })) },
  },
  {
    id: 'chick', name: '삐약삐약', emoji: '🐤',
    play: (c, t) => { const s = [1320, 1500, 1320, 1500, 1180, 1500]; for (let k = 0; k < 2; k++) s.forEach((f, i) => note(c, f, t + k * 0.95 + i * 0.12, 0.08, { type: 'sine', vol: 0.3, glide: f * 1.15 })) },
  },
  {
    id: 'marimba', name: '마림바', emoji: '🎐',
    play: (c, t) => { const s = [523, 659, 784, 1047]; for (let k = 0; k < 2; k++) s.forEach((f, i) => note(c, f, t + k * 0.75 + i * 0.13, 0.4, { type: 'triangle', vol: 0.36 })) },
  },
  {
    id: 'bell', name: '종소리', emoji: '🎶',
    play: (c, t) => { for (let k = 0; k < 3; k++) { const b = t + k * 0.6; note(c, 988, b, 0.7, { type: 'sine', vol: 0.34 }); note(c, 1976, b, 0.5, { type: 'sine', vol: 0.12 }) } },
  },
]

function makeBeeper() {
  let ctx = null
  const ensure = () => {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    if (!ctx) ctx = new AC()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }
  const playById = (id) => {
    try {
      const c = ensure()
      if (!c) return
      const snd = SOUNDS.find((s) => s.id === id) || SOUNDS[0]
      snd.play(c, c.currentTime + 0.02)
    } catch { /* noop */ }
  }
  return {
    prime: () => { try { ensure() } catch { /* noop */ } },
    play: playById,
  }
}

export function TimerProvider({ children }) {
  const [timer, setTimer] = useState(null) // { total, remaining, label, done, endAt }
  const [soundId, setSoundId] = useState(() => {
    try { return localStorage.getItem(SOUND_KEY) || 'ding' } catch { return 'ding' }
  })
  const beeper = useRef(null)
  if (!beeper.current) beeper.current = makeBeeper()
  const tick = useRef(null)
  const soundRef = useRef(soundId)
  soundRef.current = soundId

  const clearTick = useCallback(() => {
    if (tick.current) { clearInterval(tick.current); tick.current = null }
  }, [])

  const fire = useCallback(() => {
    beeper.current.play(soundRef.current)
    if (navigator.vibrate) navigator.vibrate([300, 160, 300, 160, 400])
  }, [])

  const run = useCallback((endAt) => {
    clearTick()
    tick.current = setInterval(() => {
      const rem = Math.round((endAt - Date.now()) / 1000)
      if (rem <= 0) {
        clearTick()
        setTimer((t) => (t ? { ...t, remaining: 0, done: true } : t))
        fire()
      } else {
        setTimer((t) => (t ? { ...t, remaining: rem } : t))
      }
    }, 250)
  }, [clearTick, fire])

  const start = useCallback((seconds, label = '타이머') => {
    if (!seconds || seconds < 1) return
    beeper.current.prime()
    const endAt = Date.now() + seconds * 1000
    setTimer({ total: seconds, remaining: seconds, label, done: false, endAt })
    run(endAt)
  }, [run])

  const stop = useCallback(() => { clearTick(); setTimer(null) }, [clearTick])

  const addMinute = useCallback((mins = 1) => {
    setTimer((t) => {
      if (!t) return t
      const endAt = (t.done ? Date.now() : t.endAt) + mins * 60000
      run(endAt)
      return { ...t, endAt, remaining: Math.round((endAt - Date.now()) / 1000), done: false, total: t.total + mins * 60 }
    })
  }, [run])

  const setSound = useCallback((id) => {
    setSoundId(id)
    try { localStorage.setItem(SOUND_KEY, id) } catch { /* noop */ }
  }, [])

  const previewSound = useCallback((id) => {
    beeper.current.prime()
    beeper.current.play(id)
  }, [])

  useEffect(() => () => clearTick(), [clearTick])

  return (
    <TimerCtx.Provider value={{ timer, start, stop, addMinute, soundId, setSound, previewSound }}>
      {children}
    </TimerCtx.Provider>
  )
}

export function fmtTime(sec = 0) {
  const s = Math.max(0, Math.round(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}
