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
  // 🔍 CTA — 바이럴 핵심. 크고 채운 알약으로 확 띄게 + 정사각 안전영역(bottom 150) 안에.
  //   (인스타는 4:5를 1:1로 크롭해서 맨 위/아래를 잘라냄 → 중요한 건 가운데 정사각 안에 둔다)
  const cta = (opt) => (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 150, textAlign: 'center' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '21px 46px', borderRadius: 999, background: opt.bg, color: opt.color, fontSize: 42, fontWeight: 800, boxShadow: opt.shadow }}>🔍 Play스토어 ‘한끼’ 검색</span>
    </div>
  )
  const img = (extra) => <img src={char.url} alt="" crossOrigin="anonymous" style={{ maxHeight: '100%', maxWidth: '86%', objectFit: 'contain', filter: DIE, ...extra }} />
  const slot = (s) => ({ position: 'absolute', left: 0, right: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', ...s })

  if (style === 'holo') {
    return (
      <div style={{ width: 1080, height: 1350, fontFamily: 'Jua, sans-serif', position: 'relative', overflow: 'hidden', background: 'radial-gradient(circle at 50% 32%,#343b4a,#2d3340 74%,#252a35)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.12) 6px,transparent 7px)', backgroundSize: '96px 96px' }} />
        <div style={{ position: 'absolute', top: 152, left: 60, fontSize: 42, color: '#f3e9dd' }}>한끼 ☾</div>
        <div style={{ position: 'absolute', top: 150, right: 56, width: 140, height: 140, borderRadius: '50%', border: '3px dashed rgba(255,220,140,.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ffe4a0', fontSize: 30, lineHeight: 1.15 }}>No.{String(no).padStart(2, '0')}<br /><span style={{ fontSize: 20 }}>✨레어</span></div>
        <div style={{ position: 'absolute', top: 320, left: 150, fontSize: 54 }}>✨</div><div style={{ position: 'absolute', top: 430, right: 150, fontSize: 58 }}>💛</div>
        <div style={{ position: 'absolute', top: 235, left: '50%', transform: 'translateX(-50%)', width: 510, height: 510, borderRadius: '50%', background: 'conic-gradient(from 20deg,#ff9aa2,#ffdac1,#e2f0cb,#b5ead7,#c7ceea,#f7c6ff,#ffabe0,#ff9aa2)', opacity: 0.3, filter: 'blur(3px)' }} />
        <div style={slot({ top: 230, height: 500 })}>{img()}</div>
        <div style={{ position: 'absolute', top: 775, left: 0, right: 0, textAlign: 'center', color: '#f6ede0', padding: '0 50px' }}>
          <div style={{ fontSize: 34, opacity: 0.85, marginBottom: 8 }}>오늘의 한 끼 ✨</div>
          <div style={{ lineHeight: 1.05, wordBreak: 'keep-all', fontSize: titleFont(title), background: 'linear-gradient(90deg,#ffd98a,#ffb0c4,#c7b3f0)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{title}</div>
          <div style={{ marginTop: 16 }}>{tags.map((x, i) => <span key={i} style={{ ...pill, background: 'rgba(255,255,255,.14)', color: '#ffe4a0' }}>{x}</span>)}</div>
        </div>
        {cta({ bg: '#ffe0a0', color: '#3a2a12', shadow: '0 8px 24px rgba(0,0,0,.4)' })}
      </div>
    )
  }
  if (style === 'pop') {
    return (
      <div style={{ width: 1080, height: 1350, fontFamily: 'Jua, sans-serif', position: 'relative', overflow: 'hidden', background: popBg }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.28) 8px,transparent 9px)', backgroundSize: '92px 92px' }} />
        <div style={{ position: 'absolute', top: 152, left: 60, fontSize: 42, color: '#fffdf8' }}>한끼 🧡</div>
        <div style={{ position: 'absolute', top: 150, right: 56, width: 140, height: 140, borderRadius: '50%', border: '3px dashed rgba(255,255,255,.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 29, lineHeight: 1.2 }}>오늘의<br />한 끼</div>
        <div style={{ position: 'absolute', top: 250, left: 150, fontSize: 60 }}>✨</div><div style={{ position: 'absolute', top: 470, right: 150, fontSize: 46 }}>✨</div>
        <div style={slot({ top: 230, height: 505 })}>{img()}</div>
        <div style={{ position: 'absolute', top: 775, left: 0, right: 0, textAlign: 'center', color: '#fffdf8', padding: '0 50px' }}>
          <div style={{ fontSize: 36, opacity: 0.95, marginBottom: 8 }}>오늘도 한 끼 해냈다</div>
          <div style={{ lineHeight: 1.05, wordBreak: 'keep-all', fontSize: titleFont(title), textShadow: '0 4px 0 rgba(150,55,30,.3)' }}>{title}</div>
          <div style={{ marginTop: 16 }}>{tags.map((x, i) => <span key={i} style={{ ...pill, background: 'rgba(255,253,248,.92)', color: '#c85535' }}>{x}</span>)}</div>
        </div>
        {cta({ bg: '#fffdf8', color: '#b0472a', shadow: '0 10px 22px rgba(90,35,20,.35)' })}
      </div>
    )
  }
  if (style === 'pola') {
    return (
      <div style={{ width: 1080, height: 1350, fontFamily: 'Jua, sans-serif', position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg,#dfe9d8,#d1e0d5 55%,#dae5e4)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(120,140,120,.13) 6px,transparent 7px)', backgroundSize: '90px 90px' }} />
        <div style={{ position: 'absolute', top: 152, left: 60, fontSize: 42, color: '#5c7256' }}>한끼 ♡</div>
        <div style={{ position: 'absolute', top: 200, left: '50%', transform: 'translateX(-50%) rotate(-3deg)', width: 640, background: '#fffef9', borderRadius: 14, padding: '30px 30px 0', boxShadow: '0 26px 50px rgba(80,95,80,.28)' }}>
          <div style={{ position: 'absolute', top: -18, left: 120, width: 190, height: 48, background: 'rgba(200,180,140,.55)', border: '2px dashed rgba(150,130,90,.4)', transform: 'rotate(-5deg)' }} />
          <div style={{ width: '100%', height: 500, borderRadius: 8, position: 'relative', overflow: 'hidden', background: 'radial-gradient(circle at 50% 40%,#f6f2ea,#e4ece0)' }}>
            <div style={{ position: 'absolute', top: 40, left: 52, fontSize: 48 }}>✨</div>
            <div style={slot({ inset: 0, top: 'auto', bottom: 0, height: '96%' })}>{img({ maxWidth: '70%', filter: 'drop-shadow(0 8px 12px rgba(60,40,25,.2))' })}</div>
          </div>
          <div style={{ fontFamily: 'Gaegu, sans-serif', fontSize: 44, color: '#5c7256', textAlign: 'center', padding: '20px 0 24px' }}>오늘의 {String(title).length > 7 ? String(title).slice(0, 6) + '…' : title} ♡</div>
        </div>
        <div style={{ position: 'absolute', top: 880, left: 0, right: 0, textAlign: 'center', color: '#3f4a3c', padding: '0 50px' }}>
          <div style={{ lineHeight: 1.05, wordBreak: 'keep-all', fontSize: Math.min(88, titleFont(title)) }}>{title}</div>
          <div style={{ marginTop: 12 }}>{tags.map((x, i) => <span key={i} style={{ ...pill, background: '#fffef9', color: '#5c7256' }}>{x}</span>)}</div>
        </div>
        {cta({ bg: '#5c7256', color: '#fffef9', shadow: '0 10px 22px rgba(70,90,70,.32)' })}
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
      <div style={{ position: 'absolute', bottom: 300, left: '50%', transform: 'translateX(-50%) rotate(-2deg)', background: '#fff5c8', padding: '22px 34px', borderRadius: 6, boxShadow: '0 8px 16px rgba(150,120,40,.2)', fontFamily: 'Gaegu, sans-serif', fontSize: 38, color: '#7a6533' }}>{tags.join('  ·  ')}</div>
      <div style={{ position: 'absolute', bottom: 150, left: 0, right: 0, textAlign: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '21px 46px', borderRadius: 999, background: '#8a6a3a', color: '#fff8ea', fontSize: 42, fontWeight: 800, boxShadow: '0 10px 22px rgba(120,90,40,.32)' }}>🔍 Play스토어 ‘한끼’ 검색</span>
      </div>
    </div>
  )
}

// ── 2장째: 실제 레시피카드 (재료·만드는 법) — 친구가 진짜 해먹을 수 있게 ──
function RecipeCard({ recipe }) {
  const title = recipe?.title || '오늘의 한 끼'
  const ings = (recipe?.ingredients || []).filter(Boolean)
  const steps = (recipe?.steps || []).filter(Boolean)
  const meta = [recipe?.time && `⏱ ${recipe.time}분`, recipe?.servings && `${recipe.servings}인분`, recipe?.difficulty].filter(Boolean)
  const isHead = (s) => /^\[.*\]$/.test(String(s).trim())
  const half = Math.ceil(ings.length / 2)
  const cols = [ings.slice(0, half), ings.slice(half)]
  const ingFont = ings.length > 16 ? 25 : ings.length > 11 ? 27 : 30
  const stepFont = steps.length > 7 ? 26 : steps.join('').length > 380 ? 27 : 30
  const shown = steps.slice(0, 7)
  const renderIng = (arr) => arr.map((x, i) => isHead(x)
    ? <div key={i} style={{ fontWeight: 800, color: '#c2703f', marginTop: 8, fontSize: ingFont }}>{String(x).replace(/[[\]]/g, '')}</div>
    : <div key={i} style={{ fontSize: ingFont, color: '#4a4136', lineHeight: 1.48, display: 'flex', gap: 7 }}><span style={{ color: '#d2a97f' }}>·</span><span>{x}</span></div>)
  return (
    <div style={{ width: 1080, height: 1350, fontFamily: 'Jua, sans-serif', position: 'relative', overflow: 'hidden', background: '#fbf6ec' }}>
      <div style={{ padding: '64px 70px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 30, color: '#c2703f', letterSpacing: 2 }}>🍳 오늘의 레시피</div>
        <div style={{ fontSize: title.length > 9 ? 60 : 72, color: '#3d3830', marginTop: 6, lineHeight: 1.1, wordBreak: 'keep-all' }}>{title}</div>
        {meta.length > 0 && <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 10 }}>{meta.map((m, i) => <span key={i} style={{ fontSize: 26, color: '#8a7d68', background: '#f0e7d8', padding: '7px 20px', borderRadius: 999 }}>{m}</span>)}</div>}
      </div>
      <div style={{ margin: '34px 58px 0', background: '#fffdf8', borderRadius: 24, padding: '24px 32px', boxShadow: '0 6px 16px rgba(120,90,50,.1)' }}>
        <div style={{ fontSize: 33, color: '#c2703f', marginBottom: 12 }}>🥕 재료</div>
        <div style={{ display: 'flex', gap: 28 }}>{cols.map((c, i) => <div key={i} style={{ flex: 1 }}>{renderIng(c)}</div>)}</div>
      </div>
      <div style={{ margin: '22px 58px 0' }}>
        <div style={{ fontSize: 33, color: '#c2703f', marginBottom: 10, paddingLeft: 6 }}>👩‍🍳 만드는 법</div>
        {shown.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 13, marginBottom: 11, alignItems: 'flex-start' }}>
            <span style={{ flex: '0 0 auto', width: 40, height: 40, borderRadius: '50%', background: '#e8916a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 23 }}>{i + 1}</span>
            <span style={{ fontSize: stepFont, color: '#4a4136', lineHeight: 1.42, paddingTop: 4 }}>{s}</span>
          </div>
        ))}
        {steps.length > 7 && <div style={{ fontSize: 26, color: '#a8987e', paddingLeft: 53, marginTop: 2 }}>… 전체 {steps.length}단계는 한끼 앱에서 →</div>}
      </div>
      <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '18px 42px', borderRadius: 999, background: '#5d3410', color: '#fffdf8', fontSize: 38, fontWeight: 800 }}>🔍 Play스토어 ‘한끼’ 검색</span>
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
  const card2Ref = useRef(null)
  const [page, setPage] = useState(1)
  const [scale, setScale] = useState(0.3)
  // 레시피 내용(재료·단계)이 있어야 2장째(레시피카드)를 붙인다. 없으면 1장만.
  const hasRecipe = !!((recipe?.ingredients || []).length || (recipe?.steps || []).length)

  const redraw = useCallback(() => { setDraw(drawState()); setPopBg(rnd(POP_BGS)) }, [])
  useEffect(() => {
    const fit = () => setScale(Math.min((window.innerWidth - 40) / 1080, (window.innerHeight * 0.6) / 1350))
    fit(); window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit)
  }, [])

  const share = useCallback(async () => {
    if (!cardRef.current || busy) return
    setBusy(true)
    try {
      const toFile = async (el, name) => { const u = await toPng(el, { pixelRatio: 2, cacheBust: true }); const b = await (await fetch(u)).blob(); return new File([b], name, { type: 'image/png' }) }
      const f1 = await toFile(cardRef.current, 'hankki-1.png')
      const files = [f1]
      if (hasRecipe && card2Ref.current) { try { files.push(await toFile(card2Ref.current, 'hankki-2-recipe.png')) } catch { /* 레시피카드 실패해도 1장은 보냄 */ } }
      const text = `『${title}』 오늘의 한 끼 🧡${files.length > 1 ? ' · 재료·레시피 같이!' : ''}\nPlay스토어에서 '한끼' 검색 🔍`
      if (navigator.canShare && navigator.canShare({ files })) { await navigator.share({ files, title, text, url: APP_URL }) }
      else if (navigator.canShare && navigator.canShare({ files: [f1] })) { await navigator.share({ files: [f1], title, text, url: APP_URL }) }
      else { const u = await toPng(cardRef.current, { pixelRatio: 2 }); const a = document.createElement('a'); a.href = u; a.download = 'hankki-card.png'; a.click() }
    } catch (e) { if (!(e && e.name === 'AbortError')) { /* noop */ } }
    setBusy(false)
  }, [busy, title, hasRecipe])

  const layer = { position: 'absolute', top: 0, left: 0 }
  const tabBtn = (on) => ({ padding: '7px 18px', borderRadius: 999, fontSize: 13.5, fontWeight: 800, border: 'none', background: on ? '#fffdf8' : 'rgba(255,255,255,.22)', color: on ? '#5d3410' : '#fff' })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(40,32,24,.72)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* 미리보기(스케일). 두 장 다 렌더(캡처용) — 안 보는 장은 opacity 0(랩퍼에만). 캡처 ref는 원본 카드에. */}
        <div style={{ width: 1080 * scale, height: 1350 * scale, position: 'relative', borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,.4)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <div style={{ ...layer, opacity: page === 1 ? 1 : 0 }}><div ref={cardRef}><Card {...draw} title={title} tags={tags} popBg={popBg} /></div></div>
            <div style={{ ...layer, opacity: page === 2 ? 1 : 0 }}><div ref={card2Ref}><RecipeCard recipe={recipe} /></div></div>
          </div>
        </div>
        {/* 페이지 토글 (레시피 있을 때만 2장) */}
        {hasRecipe && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="press" onClick={() => setPage(1)} style={tabBtn(page === 1)}>① 카드</button>
            <button className="press" onClick={() => setPage(2)} style={tabBtn(page === 2)}>② 레시피</button>
          </div>
        )}
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.82)', marginTop: 9, textAlign: 'center' }}>{hasRecipe ? '공유하면 2장(카드+레시피)이 함께 가요 🐻🐧' : '🔄 다시 뽑기로 마음에 들 때까지'}</div>
        {/* 버튼 */}
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button className="press" onClick={redraw} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '13px 22px', borderRadius: 999, background: '#fffdf8', color: '#5d3410', fontWeight: 800, fontSize: 15.5, border: 'none' }}>🔄 다시 뽑기</button>
          <button className="press" onClick={share} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '13px 26px', borderRadius: 999, background: '#5d3410', color: '#fffdf8', fontWeight: 800, fontSize: 15.5, border: 'none', opacity: busy ? 0.6 : 1 }}>{busy ? '만드는 중…' : '💌 공유하기'}</button>
        </div>
        <button className="press" onClick={onClose} style={{ marginTop: 12, padding: '8px 18px', background: 'transparent', color: 'rgba(255,255,255,.8)', fontSize: 14, fontWeight: 700, border: 'none' }}>닫기</button>
      </div>
    </div>
  )
}
