import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { toPng } from 'html-to-image'
import Icon from './Icon'

// 🎴 공유 "뽑기카드" — 레시피마다 스타일×곰펭 랜덤. 🔄로 다시뽑기(가챠), 공유는 Web Share.
// ⭐ 곰펭 풀 = src/assets/sharepool 폴더 전체를 glob → "폴더에 넣기만 하면 자동으로 다 쓰임"
//    (저장해두고 안 쓰는 문제를 코드가 구조적으로 차단. 새 포즈 추가 = 그냥 폴더에 넣으면 끝.)
const POOL = import.meta.glob('../assets/sharepool/*.png', { eager: true, query: '?url', import: 'default' })
const ENTRIES = Object.entries(POOL).map(([k, url]) => ({ name: k.split('/').pop(), url }))
const GOM = ENTRIES.filter((e) => /^(gom_|gn_|gp_gom)/.test(e.name))
const PENG = ENTRIES.filter((e) => /^(peng_|pn_|gp_peng)/.test(e.name))
const DUO = ENTRIES.filter((e) => /^(duo_|gp_duo)/.test(e.name))

const APP_URL = 'https://peachfam0307-glitch.github.io/hankki/'
const PRETTY_URL = 'peachfam0307-glitch.github.io/hankki'
const rnd = (a) => a[Math.floor(Math.random() * a.length)]
const titleFont = (t) => { const n = String(t).replace(/\s/g, '').length; return n <= 5 ? 104 : n <= 7 ? 88 : n <= 9 ? 74 : 62 }

// 레시피 태그: 실제 데이터(카테고리·태그)에서. 없으면 담백한 기본.
function tagsOf(recipe) {
  const t = [...(recipe?.tags || [])]
  if (recipe?.category && !t.includes(recipe.category)) t.unshift(recipe.category)
  return (t.length ? t : ['오늘의 한끼']).slice(0, 2)
}

// 스타일별 카테고리 규칙(적재적소): 콤비는 넓은 스타일(홀로·팝)에만.
function drawState() {
  const style = rnd(['holo', 'pop', 'pop', 'pola', 'diary'])
  let cat
  if (style === 'holo') cat = DUO.length ? DUO : GOM
  else if (style === 'pop') { const r = Math.random(); cat = r < 0.6 ? GOM : r < 0.82 ? PENG : (DUO.length ? DUO : GOM) }
  else { const r = Math.random(); cat = r < 0.72 ? GOM : (PENG.length ? PENG : GOM) } // pola·diary = 솔로
  return { style, char: rnd(cat.length ? cat : ENTRIES), no: 2 + Math.floor(Math.random() * 46) }
}

const DIE = 'drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff) drop-shadow(0 16px 22px rgba(60,40,25,.26))'
const POP_BGS = [
  'radial-gradient(circle at 50% 30%,#ffa579,#f4794f 68%,#e8623c)', 'radial-gradient(circle at 50% 30%,#ffd07a,#f6b23e 68%,#e89a2a)',
  'radial-gradient(circle at 50% 30%,#8fd0b0,#5fb88f 68%,#4aa079)', 'radial-gradient(circle at 50% 30%,#f79bc0,#ef7aa8 68%,#e5638f)',
]

// ── 1080×1350 카드 (캡처 대상) ──
function Card({ style, char, no, title, tags, popBg }) {
  const pill = { display: 'inline-block', padding: '11px 28px', borderRadius: 40, fontSize: 31, margin: '0 4px' }
  const foot = (color) => (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 66, textAlign: 'center', color }}>
      <div style={{ fontSize: 29, opacity: 0.85 }}>전체 레시피는 한끼 앱에서 →</div>
    </div>
  )
  const urlPill = (bg, color) => (
    <div style={{ display: 'inline-block', marginTop: 12, padding: '11px 32px', borderRadius: 34, fontSize: 27, fontFamily: 'Gaegu, sans-serif', background: bg, color }}>나도 꾸미러 가기 · {PRETTY_URL}</div>
  )
  const img = (extra) => <img src={char.url} alt="" crossOrigin="anonymous" style={{ maxHeight: '100%', maxWidth: '86%', objectFit: 'contain', filter: DIE, ...extra }} />
  const slot = (s) => ({ position: 'absolute', left: 0, right: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', ...s })

  if (style === 'holo') {
    return (
      <div style={{ width: 1080, height: 1350, fontFamily: 'Jua, sans-serif', position: 'relative', overflow: 'hidden', background: 'radial-gradient(circle at 50% 32%,#343b4a,#2d3340 74%,#252a35)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.12) 6px,transparent 7px)', backgroundSize: '96px 96px' }} />
        <div style={{ position: 'absolute', top: 56, left: 60, fontSize: 42, color: '#f3e9dd' }}>한끼 ☾</div>
        <div style={{ position: 'absolute', top: 52, right: 56, width: 140, height: 140, borderRadius: '50%', border: '3px dashed rgba(255,220,140,.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ffe4a0', fontSize: 30, lineHeight: 1.15 }}>No.{String(no).padStart(2, '0')}<br /><span style={{ fontSize: 20 }}>✨레어</span></div>
        <div style={{ position: 'absolute', top: 320, left: 150, fontSize: 54 }}>✨</div><div style={{ position: 'absolute', top: 430, right: 150, fontSize: 58 }}>💛</div>
        <div style={{ position: 'absolute', top: 280, left: '50%', transform: 'translateX(-50%)', width: 560, height: 560, borderRadius: '50%', background: 'conic-gradient(from 20deg,#ff9aa2,#ffdac1,#e2f0cb,#b5ead7,#c7ceea,#f7c6ff,#ffabe0,#ff9aa2)', opacity: 0.3, filter: 'blur(3px)' }} />
        <div style={slot({ top: 270, height: 590 })}>{img()}</div>
        <div style={{ position: 'absolute', top: 900, left: 0, right: 0, textAlign: 'center', color: '#f6ede0', padding: '0 50px' }}>
          <div style={{ fontSize: 34, opacity: 0.85, marginBottom: 8 }}>오늘의 한 끼 ✨</div>
          <div style={{ lineHeight: 1.05, wordBreak: 'keep-all', fontSize: titleFont(title), background: 'linear-gradient(90deg,#ffd98a,#ffb0c4,#c7b3f0)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{title}</div>
          <div style={{ marginTop: 16 }}>{tags.map((x, i) => <span key={i} style={{ ...pill, background: 'rgba(255,255,255,.14)', color: '#ffe4a0' }}>{x}</span>)}</div>
        </div>
        {foot('#e9dccb')}<div style={{ position: 'absolute', left: 0, right: 0, bottom: 66, textAlign: 'center' }}>{urlPill('rgba(255,255,255,.12)', '#f3e9dd')}</div>
      </div>
    )
  }
  if (style === 'pop') {
    return (
      <div style={{ width: 1080, height: 1350, fontFamily: 'Jua, sans-serif', position: 'relative', overflow: 'hidden', background: popBg }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.28) 8px,transparent 9px)', backgroundSize: '92px 92px' }} />
        <div style={{ position: 'absolute', top: 56, left: 60, fontSize: 42, color: '#fffdf8' }}>한끼 🧡</div>
        <div style={{ position: 'absolute', top: 52, right: 56, width: 140, height: 140, borderRadius: '50%', border: '3px dashed rgba(255,255,255,.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 29, lineHeight: 1.2 }}>오늘의<br />한 끼</div>
        <div style={{ position: 'absolute', top: 250, left: 150, fontSize: 60 }}>✨</div><div style={{ position: 'absolute', top: 470, right: 150, fontSize: 46 }}>✨</div>
        <div style={slot({ top: 250, height: 600 })}>{img()}</div>
        <div style={{ position: 'absolute', top: 905, left: 0, right: 0, textAlign: 'center', color: '#fffdf8', padding: '0 50px' }}>
          <div style={{ fontSize: 36, opacity: 0.95, marginBottom: 8 }}>오늘도 한 끼 해냈다</div>
          <div style={{ lineHeight: 1.05, wordBreak: 'keep-all', fontSize: titleFont(title), textShadow: '0 4px 0 rgba(150,55,30,.3)' }}>{title}</div>
          <div style={{ marginTop: 16 }}>{tags.map((x, i) => <span key={i} style={{ ...pill, background: 'rgba(255,253,248,.92)', color: '#c85535' }}>{x}</span>)}</div>
        </div>
        {foot('#fffdf8')}<div style={{ position: 'absolute', left: 0, right: 0, bottom: 66, textAlign: 'center' }}>{urlPill('rgba(90,35,20,.32)', '#fffdf8')}</div>
      </div>
    )
  }
  if (style === 'pola') {
    return (
      <div style={{ width: 1080, height: 1350, fontFamily: 'Jua, sans-serif', position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg,#dfe9d8,#d1e0d5 55%,#dae5e4)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(120,140,120,.13) 6px,transparent 7px)', backgroundSize: '90px 90px' }} />
        <div style={{ position: 'absolute', top: 56, left: 60, fontSize: 42, color: '#5c7256' }}>한끼 ♡</div>
        <div style={{ position: 'absolute', top: 210, left: '50%', transform: 'translateX(-50%) rotate(-3deg)', width: 660, background: '#fffef9', borderRadius: 14, padding: '32px 32px 0', boxShadow: '0 26px 50px rgba(80,95,80,.28)' }}>
          <div style={{ position: 'absolute', top: -18, left: 120, width: 190, height: 48, background: 'rgba(200,180,140,.55)', border: '2px dashed rgba(150,130,90,.4)', transform: 'rotate(-5deg)' }} />
          <div style={{ width: '100%', height: 600, borderRadius: 8, position: 'relative', overflow: 'hidden', background: 'radial-gradient(circle at 50% 40%,#f6f2ea,#e4ece0)' }}>
            <div style={{ position: 'absolute', top: 40, left: 52, fontSize: 48 }}>✨</div>
            <div style={slot({ inset: 0, top: 'auto', bottom: 0, height: '96%' })}>{img({ maxWidth: '70%', filter: 'drop-shadow(0 8px 12px rgba(60,40,25,.2))' })}</div>
          </div>
          <div style={{ fontFamily: 'Gaegu, sans-serif', fontSize: 44, color: '#5c7256', textAlign: 'center', padding: '20px 0 24px' }}>오늘의 {String(title).length > 7 ? String(title).slice(0, 6) + '…' : title} ♡</div>
        </div>
        <div style={{ position: 'absolute', top: 1000, left: 0, right: 0, textAlign: 'center', color: '#3f4a3c', padding: '0 50px' }}>
          <div style={{ lineHeight: 1.05, wordBreak: 'keep-all', fontSize: Math.min(88, titleFont(title)) }}>{title}</div>
          <div style={{ marginTop: 12 }}>{tags.map((x, i) => <span key={i} style={{ ...pill, background: '#fffef9', color: '#5c7256' }}>{x}</span>)}</div>
        </div>
        {foot('#5c7256')}<div style={{ position: 'absolute', left: 0, right: 0, bottom: 66, textAlign: 'center' }}>{urlPill('rgba(255,255,255,.7)', '#5c7256')}</div>
      </div>
    )
  }
  // diary (다꾸)
  const tape = (s) => <div style={{ position: 'absolute', background: 'rgba(210,224,205,.62)', border: '1.5px dashed rgba(120,140,110,.4)', ...s }} />
  return (
    <div style={{ width: 1080, height: 1350, fontFamily: 'Jua, sans-serif', position: 'relative', overflow: 'hidden', background: '#f6f1e8', backgroundImage: 'linear-gradient(#e7ded0 1.5px,transparent 1.5px),linear-gradient(90deg,#e7ded0 1.5px,transparent 1.5px)', backgroundSize: '56px 56px' }}>
      {tape({ top: 60, left: 150, width: 230, height: 56, transform: 'rotate(-6deg)' })}
      {tape({ top: 52, right: 130, width: 190, height: 52, transform: 'rotate(5deg)', background: 'rgba(240,210,175,.6)', borderColor: 'rgba(180,140,95,.4)' })}
      <div style={{ position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', fontFamily: 'Gaegu, sans-serif', fontSize: 40, color: '#b1937a' }}>♡ 오늘의 한 끼 ♡</div>
      <div style={{ position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center', fontSize: titleFont(title), color: '#4a3f33', lineHeight: 1.05 }}>{title}</div>
      <div style={{ position: 'absolute', top: 370, left: '50%', transform: 'translateX(-50%) rotate(-3deg)', width: 500, display: 'flex', justifyContent: 'center' }}><img src={char.url} alt="" crossOrigin="anonymous" style={{ width: '100%', filter: DIE }} /></div>
      <div style={{ position: 'absolute', top: 430, left: 150, fontSize: 56, transform: 'rotate(-12deg)' }}>✏️</div>
      <div style={{ position: 'absolute', top: 560, right: 150, fontSize: 48, color: '#e6a4a0' }}>♡</div>
      <div style={{ position: 'absolute', top: 820, left: 180, fontSize: 40, color: '#e8b74d' }}>✿</div>
      <div style={{ position: 'absolute', bottom: 250, left: '50%', transform: 'translateX(-50%) rotate(-2deg)', background: '#fff5c8', padding: '22px 34px', borderRadius: 6, boxShadow: '0 8px 16px rgba(150,120,40,.2)', fontFamily: 'Gaegu, sans-serif', fontSize: 38, color: '#7a6533' }}>{tags.join('  ·  ')}</div>
      <div style={{ position: 'absolute', bottom: 110, left: 0, right: 0, textAlign: 'center', color: '#9a8a72' }}>
        <div style={{ fontSize: 30, fontFamily: 'Gaegu, sans-serif' }}>전체 레시피는 한끼 앱에서 →</div>
        <div style={{ display: 'inline-block', marginTop: 12, padding: '10px 30px', borderRadius: 30, background: '#eae0cf', fontFamily: 'Gaegu, sans-serif', fontSize: 27, color: '#8a7a62' }}>나도 꾸미러 가기 · {PRETTY_URL}</div>
      </div>
    </div>
  )
}

export default function ShareDrawCard({ recipe, onClose }) {
  const title = recipe?.title || '오늘의 한 끼'
  const tags = useMemo(() => tagsOf(recipe), [recipe])
  const [draw, setDraw] = useState(drawState)
  const [popBg, setPopBg] = useState(() => rnd(POP_BGS))
  const [busy, setBusy] = useState(false)
  const cardRef = useRef(null)
  const [scale, setScale] = useState(0.3)

  const redraw = useCallback(() => { setDraw(drawState()); setPopBg(rnd(POP_BGS)) }, [])
  useEffect(() => {
    const fit = () => setScale(Math.min((window.innerWidth - 40) / 1080, (window.innerHeight * 0.66) / 1350))
    fit(); window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit)
  }, [])

  const share = useCallback(async () => {
    if (!cardRef.current || busy) return
    setBusy(true)
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true })
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], 'hankki-card.png', { type: 'image/png' })
      const payload = { files: [file], title, text: `『${title}』 오늘의 한 끼 🧡 한끼\n나도 만들기 → ${APP_URL}`, url: APP_URL }
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share(payload) }
      else { const a = document.createElement('a'); a.href = dataUrl; a.download = 'hankki-card.png'; a.click() }
    } catch (e) { if (!(e && e.name === 'AbortError')) { /* noop */ } }
    setBusy(false)
  }, [busy, title])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(40,32,24,.72)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* 미리보기 (스케일) */}
        <div style={{ width: 1080 * scale, height: 1350 * scale, position: 'relative', borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,.4)' }}>
          <div ref={cardRef} style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <Card {...draw} title={title} tags={tags} popBg={popBg} />
          </div>
        </div>
        {/* 버튼 */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button className="press" onClick={redraw} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '13px 22px', borderRadius: 999, background: '#fffdf8', color: '#5d3410', fontWeight: 800, fontSize: 15.5, border: 'none' }}>🔄 다시 뽑기</button>
          <button className="press" onClick={share} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '13px 26px', borderRadius: 999, background: '#5d3410', color: '#fffdf8', fontWeight: 800, fontSize: 15.5, border: 'none', opacity: busy ? 0.6 : 1 }}>{busy ? '만드는 중…' : '💌 공유하기'}</button>
        </div>
        <button className="press" onClick={onClose} style={{ marginTop: 14, padding: '8px 18px', background: 'transparent', color: 'rgba(255,255,255,.8)', fontSize: 14, fontWeight: 700, border: 'none' }}>닫기</button>
      </div>
    </div>
  )
}
