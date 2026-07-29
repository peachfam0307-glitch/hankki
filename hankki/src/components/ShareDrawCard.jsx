import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { toPng, toJpeg } from 'html-to-image'
import { PHOTO_FAMILY } from './Stickers'   // 🍱 요리 아이콘을 카드에도 쓴다
import { guessFoodIcon } from './FoodIcon'
const S = (k) => PHOTO_FAMILY[k]?.src

// 🎴 공유 "뽑기카드" — 레시피마다 스타일×곰펭 랜덤. 🔄로 다시뽑기(가챠), 공유는 Web Share.
// ⭐ 곰펭 풀 = src/assets/sharepool 폴더 전체를 glob → "폴더에 넣기만 하면 자동으로 다 쓰임"
//    (저장해두고 안 쓰는 문제를 코드가 구조적으로 차단. 새 포즈 추가 = 그냥 폴더에 넣으면 끝.)
const POOL = import.meta.glob('../assets/sharepool/*.png', { eager: true, query: '?url', import: 'default' })
const ENTRIES = Object.entries(POOL).map(([k, url]) => ({ name: k.split('/').pop(), url }))
const GOM = ENTRIES.filter((e) => /^(gom_|gn_|gp_gom)/.test(e.name))
const PENG = ENTRIES.filter((e) => /^(peng_|pn_|gp_peng)/.test(e.name))
const DUO = ENTRIES.filter((e) => /^(duo_|gp_duo)/.test(e.name))

const APP_URL = 'https://peachfam0307-glitch.github.io/hankki/'
const rnd = (a) => a[Math.floor(Math.random() * a.length)]
const titleFont = (t) => { const n = String(t).replace(/\s/g, '').length; return n <= 5 ? 104 : n <= 7 ? 88 : n <= 9 ? 74 : 62 }

// 레시피 태그: 실제 데이터(카테고리·태그)에서. 없으면 담백한 기본.
function tagsOf(recipe) {
  const t = [...(recipe?.tags || [])]
  if (recipe?.category && !t.includes(recipe.category)) t.unshift(recipe.category)
  return (t.length ? t : ['오늘의 한끼']).slice(0, 2)
}

// 스타일별 카테고리 규칙(적재적소): 콤비는 넓은 스타일(홀로·팝·여름)에만.
function drawState() {
  const m = new Date().getMonth() + 1
  const isSummer = m >= 6 && m <= 8   // 여름 스킨은 6~8월에만 등장(한정 수집감)
  const pool = isSummer
    ? ['warm', 'plum', 'sky', 'mustard', 'summer', 'night', 'summer']
    : ['warm', 'plum', 'sky', 'mustard', 'night', 'warm']
  const key = (() => {
    try { const v = new URLSearchParams(location.search).get('card'); if (v && SKINS[v]) return v } catch { /* noop */ }
    return rnd(pool)
  })()
  const skin = SKINS[key]
  // 밤·여름은 콤비도 잘 어울리고, 나머지는 솔로 위주(캐릭터가 크게 들어가서)
  const r = Math.random()
  const cat = (key === 'night' || key === 'summer')
    ? (r < 0.5 ? GOM : r < 0.78 ? PENG : (DUO.length ? DUO : GOM))
    : (r < 0.68 ? GOM : (PENG.length ? PENG : GOM))
  return { skin, char: rnd(cat.length ? cat : ENTRIES), no: 2 + Math.floor(Math.random() * 46) }
}

const DIE = 'drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff) drop-shadow(0 16px 22px rgba(60,40,25,.26))'
// 🎨 스킨 — 뼈대는 같고 **색과 연출만** 바뀐다(2026-07-19 시안의 변주 방식).
//    여름·홀로그램밤 2장은 창업자 요청으로 같은 문법에 맞춰 새로 만든 것.
const wave = (
  <svg viewBox="0 0 1080 300" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 280, zIndex: 1 }}>
    <path d="M0 150 C170 108 280 186 440 166 C620 144 720 88 920 122 C1000 136 1046 144 1080 138 L1080 300 L0 300Z" fill="#8ad8de" opacity=".42" />
    <path d="M0 200 C190 162 310 228 490 212 C690 194 790 150 990 178 C1036 186 1062 190 1080 186 L1080 300 L0 300Z" fill="#5cbdcd" opacity=".5" />
    <path d="M0 252 C210 224 330 276 530 264 C730 252 830 224 1080 246 L1080 300 L0 300Z" fill="#ffffff" opacity=".42" />
  </svg>
)
const sun = <div style={{ position: 'absolute', right: -70, top: -80, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%,rgba(255,246,198,.95),rgba(255,235,155,.42) 46%,transparent 70%)', zIndex: 1 }} />
const stars = (
  <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
    {[[130, 250, 5], [300, 180, 3], [860, 210, 4], [720, 120, 3], [180, 470, 3], [980, 380, 4], [420, 300, 3]].map((s, i) => (
      <div key={i} style={{ position: 'absolute', left: s[0], top: s[1], width: s[2] * 2, height: s[2] * 2, borderRadius: '50%', background: '#fff5d0', opacity: 0.75, boxShadow: `0 0 ${s[2] * 4}px rgba(255,240,190,.9)` }} />
    ))}
  </div>
)

const SKINS = {
  // ☀️ 웜 오렌지 (시안 c1b)
  warm: {
    key: 'warm', bg: '#f4f0e8', arc: '#efd9b0', blob: 'radial-gradient(120% 120% at 34% 30%,#f2a074,#e6875a 55%,#d9724a)', blobShadow: 'rgba(160,80,50,.5)',
    brand: '#7a5a3f', stamp: '#c47a58', kick: '#c47a58', kick_: '오늘도, 한 끼', head: '#3a3128', point: '#d9724a', mark: 'rgba(217,114,74,.22)',
    chipRing: 'rgba(216,150,110,.25)', chipText: '#8a5f3c', die: '#fffdf8', foot: '#a8916f',
    stampTop: <b style={{ fontSize: 31 }}>오늘의</b>, stampBottom: '한 끼',
  },
  // 🍇 플럼 (시안 c2b)
  plum: {
    key: 'plum', bg: '#f2eef0', arc: '#dcc6d4', blob: 'radial-gradient(120% 120% at 34% 30%,#b98aa4,#9b6a86 55%,#84577a)', blobShadow: 'rgba(90,50,75,.5)',
    brand: '#7a5a6a', stamp: '#9b6a86', kick: '#9b6a86', kick_: '오늘도 수고했어,', head: '#3a2f36', point: '#9b6a86', mark: 'rgba(155,106,134,.2)',
    chipRing: 'rgba(180,140,165,.25)', chipText: '#7d5a6d', die: '#fffdf8', foot: '#a892a0',
    stampTop: <b style={{ fontSize: 31 }}>오늘의</b>, stampBottom: '한 끼',
  },
  // 🩵 스카이 (시안 c4b)
  sky: {
    key: 'sky', bg: '#eef2f4', arc: '#cbe1ee', blob: 'radial-gradient(120% 120% at 34% 30%,#9ccbe6,#6fb2d6 55%,#5a9ec6)', blobShadow: 'rgba(50,90,120,.5)',
    brand: '#4b6f88', stamp: '#5a9ec6', kick: '#5a9ec6', kick_: '오늘도 무사히,', head: '#2f4459', point: '#4f9ec8', mark: 'rgba(79,158,200,.2)',
    chipRing: 'rgba(120,170,205,.25)', chipText: '#4b7a96', die: '#fffdf8', foot: '#93a8b6',
    stampTop: <b style={{ fontSize: 31 }}>오늘의</b>, stampBottom: '한 끼',
  },
  // 🌾 머스터드 (시안 c5a)
  mustard: {
    key: 'mustard', bg: '#f6f1e3', arc: '#eddcae', blob: 'radial-gradient(120% 120% at 34% 30%,#f0c368,#e0a93f 55%,#cd9530)', blobShadow: 'rgba(150,110,35,.5)',
    brand: '#7d6330', stamp: '#c98f2e', kick: '#c98f2e', kick_: '같이 먹어야 맛있지,', head: '#3d3520', point: '#c98f2e', mark: 'rgba(201,143,46,.22)',
    chipRing: 'rgba(205,165,80,.28)', chipText: '#8a6a2c', die: '#fffdf8', foot: '#ab9866',
    stampTop: <b style={{ fontSize: 31 }}>오늘의</b>, stampBottom: '한 끼',
  },
  // 🏖 여름 한정 (신규) — 바다 blob + 해 + 물결. 6~8월에만 뽑기 풀에 등장.
  summer: {
    key: 'summer', bg: 'linear-gradient(168deg,#e6f4f5,#d3ecf2 60%,#dff1ea)', arc: '#ffe6a8',
    blob: 'radial-gradient(120% 120% at 34% 30%,#7fd4dd,#4fb6cb 55%,#3a9cbd)', blobShadow: 'rgba(30,110,135,.5)',
    brand: '#2b7f8c', stamp: '#2f96a6', kick: '#2f96a6', kick_: '시원하게, 여름 한 끼', head: '#14424f', point: '#2f96a6', mark: 'rgba(47,150,166,.2)',
    chipRing: 'rgba(110,190,205,.3)', chipText: '#2b7f8c', die: '#ffffff', foot: '#1d6472',
    stampTop: <b style={{ fontSize: 30 }}>여름</b>, stampBottom: 'SEASON',
    overlay: <>{sun}{wave}</>,
  },
  // 🌙 홀로그램 밤 (신규) — 어두운 바탕에 홀로 덩어리. 수집카드 넘버링.
  night: {
    key: 'night', bg: 'radial-gradient(circle at 26% 18%,#333a4d,#262b3a 62%,#1e2230)', arc: 'rgba(255,222,150,.35)',
    blob: 'conic-gradient(from 20deg,#ff9aa2,#ffdac1,#e2f0cb,#b5ead7,#c7ceea,#f7c6ff,#ffabe0,#ff9aa2)', blobShadow: 'rgba(0,0,0,.55)',
    brand: '#e8dcc9', stamp: '#ffe4a0', kick: '#ffcf8a', kick_: '오늘 밤은, 이걸로', head: '#f6ede0', point: '#ffd98a', mark: 'rgba(255,217,138,.22)',
    chipRing: 'rgba(255,220,150,.3)', chipText: '#8a6a3a', die: '#fffdf8', foot: '#c3b49a',
    stampTop: <b style={{ fontSize: 27 }}>NO.</b>, stampBottom: '',
    blobExtra: <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 40% 34%,rgba(20,22,32,.12),rgba(20,22,32,.62) 74%)' }} />,
    overlay: stars, numbered: true,
  },
}

// ── 1080×1350 카드 (캡처 대상) ──
//
// 📐 2026-07-19 시안(`docs/카드-시안-2507/`)의 문법을 그대로 옮긴 것.
//    창업자 판정: "예전 시안이 훨씬 예쁘다." 규칙 정리 = docs/카드-디자인시스템-정리-2026-07-29.md
//
//    ⭐ 이 시스템의 심장은 **아주 큰 타이포와 큰 색면**이다.
//       · 제목 **142~150px** (예전 내 카드는 62~88px 이었고 그게 밋밋함의 주범)
//       · 우하단으로 **920px 색 덩어리(blob)** 가 화면 밖까지 삐져나간다
//       · 좌상단으로 **아치(테두리 26px)** 가 삐져나간다
//       · 캐릭터 **560~600px**, 흰 다이컷
//    ⚠️ 제목 크기를 줄이지 말 것. 줄이는 순간 이 카드는 평범해진다.

const PAD = 64
const GRAIN = 'radial-gradient(rgba(150,120,80,.06) 1px,transparent 1px)'

// 제목을 두 줄로 — 이 시스템은 2줄 볼드 타이포가 기본이다.
function splitTitle(t) {
  const s = String(t || '오늘의 한 끼').trim()
  const sp = [...s.matchAll(/\s/g)].map((m) => m.index)
  if (sp.length) {                                  // 띄어쓰기가 있으면 가장 균형 잡힌 곳에서
    const mid = s.length / 2
    const at = sp.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a))
    return [s.slice(0, at), s.slice(at + 1)]
  }
  if (s.length <= 5) return [s, '']
  const at = Math.ceil(s.length / 2)
  return [s.slice(0, at), s.slice(at)]
}
const headSize = (a, b) => {
  const n = Math.max(a.length, b.length)
  return n <= 4 ? 150 : n <= 5 ? 138 : n <= 6 ? 120 : n <= 7 ? 104 : n <= 9 ? 88 : 74
}

// 레시피 메타 → 흰 알약 칩 3개
function chipsOf(recipe, tags) {
  const c = []
  if (recipe?.time) c.push(`${recipe.time}분`)
  if (recipe?.servings) c.push(`${recipe.servings}인분`)
  tags.forEach((t) => c.length < 3 && c.push(t))
  return c.slice(0, 3)
}

function Card({ style, char, no, title, tags, cover, recipe, foodIcon, skin }) {
  const [l1, l2] = splitTitle(title)
  const hs = headSize(l1, l2)
  const chips = chipsOf(recipe, tags)
  const S_ = skin

  const grain = <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '7px 7px', pointerEvents: 'none' }} />
  const arc = <div style={{ position: 'absolute', left: -150, top: -150, width: 360, height: 360, borderRadius: '50%', border: `26px solid ${S_.arc}`, opacity: 0.62 }} />
  const blob = (
    <div style={{ position: 'absolute', right: -160, bottom: -160, width: 920, height: 920, borderRadius: '50%', background: S_.blob, boxShadow: `0 30px 60px -30px ${S_.blobShadow}` }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundImage: 'radial-gradient(rgba(255,255,255,.14) 5px,transparent 6px)', backgroundSize: '60px 60px' }} />
      {S_.blobExtra}
    </div>
  )
  const brand = <div style={{ position: 'absolute', top: PAD - 4, left: PAD, fontFamily: 'Jua, sans-serif', fontSize: 34, color: S_.brand, letterSpacing: 1, zIndex: 5 }}>한끼</div>
  const stamp = (
    <div style={{ position: 'absolute', top: 70, right: PAD, width: 138, height: 138, transform: 'rotate(11deg)', zIndex: 6 }}>
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0 }}>
        <path d="M50 3 L61 13 L75 9 L79 24 L93 30 L88 45 L96 58 L84 66 L85 81 L70 82 L61 94 L50 86 L39 94 L30 82 L15 81 L16 66 L4 58 L12 45 L7 30 L21 24 L25 9 L39 13 Z" fill="none" stroke={S_.stamp} strokeWidth="3.2" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Jua, sans-serif', color: S_.stamp, lineHeight: 1.05, textAlign: 'center' }}>
        {S_.stampTop}<span style={{ fontSize: 18, letterSpacing: 3, marginTop: 3 }}>{S_.stampBottom}</span>
      </div>
    </div>
  )
  const headBlock = (
    <div style={{ position: 'absolute', left: PAD, top: 150, right: 360, zIndex: 5 }}>
      <div style={{ fontFamily: 'Gaegu, sans-serif', fontWeight: 700, fontSize: 42, color: S_.kick }}>{S_.kick_}</div>
      <div style={{ marginTop: 2, fontFamily: 'Jua, sans-serif', fontSize: hs, lineHeight: 0.98, letterSpacing: -3, color: S_.head, wordBreak: 'keep-all' }}>
        {l1}
        {l2 && (
          <><br />
            <span style={{ position: 'relative', display: 'inline-block', color: S_.point }}>
              <span style={{ position: 'absolute', left: -4, right: -4, bottom: 6, height: 20, background: S_.mark, borderRadius: 6 }} />
              <span style={{ position: 'relative' }}>{l2}</span>
            </span>
          </>
        )}
      </div>
      <div style={{ marginTop: 30, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {chips.map((c, i) => (
          <span key={i} style={{ padding: '11px 24px', borderRadius: 999, background: '#fffdf8', boxShadow: `0 8px 20px -12px rgba(120,80,50,.5), inset 0 0 0 2px ${S_.chipRing}`, fontFamily: 'Jua, sans-serif', fontSize: 28, color: S_.chipText }}>{c}</span>
        ))}
      </div>
    </div>
  )
  const DIE8 = `drop-shadow(3px 0 0 ${S_.die}) drop-shadow(-3px 0 0 ${S_.die}) drop-shadow(0 3px 0 ${S_.die}) drop-shadow(0 -3px 0 ${S_.die}) drop-shadow(3px 3px 0 ${S_.die}) drop-shadow(-3px 3px 0 ${S_.die}) drop-shadow(3px -3px 0 ${S_.die}) drop-shadow(-3px -3px 0 ${S_.die}) drop-shadow(0 22px 20px rgba(60,40,25,.34))`
  const hero = (
    <img src={char.url} alt="" crossOrigin="anonymous"
      style={{ position: 'absolute', right: 6, bottom: 148, height: 560, maxWidth: 'none', objectFit: 'contain', zIndex: 7, filter: DIE8 }} />
  )
  // 요리는 캐릭터 옆, **색 덩어리 위**에 놓는다 — 색면이 바탕이 돼줘서 허공에 안 뜬다.
  const dish = foodIcon && S(foodIcon) ? (
    <img src={S(foodIcon)} alt="" crossOrigin="anonymous"
      style={{ position: 'absolute', right: 452, bottom: 172, width: 264, maxWidth: 'none', objectFit: 'contain', zIndex: 7, filter: DIE8 }} />
  ) : null
  const more = !cover && (
    <div style={{ position: 'absolute', left: PAD, bottom: 152, zIndex: 6, fontFamily: 'Jua, sans-serif', fontSize: 34, color: S_.head }}>
      레시피 보러가기
      <span style={{ display: 'block', fontFamily: 'GowunDodum, sans-serif', fontSize: 24, color: S_.kick, fontWeight: 700, marginTop: 8 }}>한끼 앱에서 →</span>
    </div>
  )
  const foot = (
    <div style={{ position: 'absolute', left: PAD, bottom: 56, zIndex: 6 }}>
      <div style={{ fontFamily: 'Jua, sans-serif', fontSize: 26, color: S_.brand }}>한끼</div>
      <div style={{ marginTop: 7, fontSize: 19, color: S_.foot, fontFamily: 'GowunDodum, sans-serif' }}>Play스토어 ‘한끼’ 검색</div>
    </div>
  )

  return (
    <div style={{ width: 1080, height: 1350, fontFamily: 'GowunDodum, sans-serif', position: 'relative', overflow: 'hidden', background: S_.bg, color: S_.head }}>
      {grain}{arc}{blob}
      {S_.overlay}
      {brand}{stamp}{headBlock}
      {dish}{hero}
      {more}{foot}
    </div>
  )
}

// ── 2장째: 실제 레시피카드 (재료·만드는 법) — 친구가 진짜 해먹을 수 있게 ──
// export: 꾸민 표지 공유(shareDecoratedCover)에서도 이 레시피카드를 2장째로 함께 보낸다.
export function RecipeCard({ recipe }) {
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

export default function ShareDrawCard({ recipe, onClose, onSaveCover }) {
  const title = recipe?.title || '오늘의 한 끼'
  const tags = useMemo(() => tagsOf(recipe), [recipe])
  const foodIcon = useMemo(() => recipe?.icon || guessFoodIcon(recipe?.title || ''), [recipe])
  const [draw, setDraw] = useState(drawState)
  const [busy, setBusy] = useState(false)
  const cardRef = useRef(null)
  const card2Ref = useRef(null)
  const coverRef = useRef(null) // 표지 저장용(CTA 없는 cover 카드)
  const [page, setPage] = useState(1)
  const [scale, setScale] = useState(0.3)
  // 레시피 내용(재료·단계)이 있어야 2장째(레시피카드)를 붙인다. 없으면 1장만.
  const hasRecipe = !!((recipe?.ingredients || []).length || (recipe?.steps || []).length)

  const redraw = useCallback(() => setDraw(drawState()), [])
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

  // 🖼 이 카드를 레시피 표지로 저장 — CTA 없는 cover 카드를 이미지로 캡처해 부모(레시피 화면)에 넘긴다.
  const saveCover = useCallback(async () => {
    if (!coverRef.current || busy) return
    setBusy(true)
    try {
      const opt = { pixelRatio: 1.5, quality: 0.86, cacheBust: true, backgroundColor: '#ffffff' }
      // 폰트 임베드 단계에서 외부 stylesheet fetch가 막히면(드묾) skipFonts로 폴백 — 표지 저장이 끊기지 않게.
      let url
      try { url = await toJpeg(coverRef.current, opt) } catch { url = await toJpeg(coverRef.current, { ...opt, skipFonts: true }) }
      await onSaveCover?.(url)
      onClose?.()
    } catch (e) { /* noop */ }
    setBusy(false)
  }, [busy, onSaveCover, onClose])

  const layer = { position: 'absolute', top: 0, left: 0 }
  const tabBtn = (on) => ({ padding: '7px 18px', borderRadius: 999, fontSize: 13.5, fontWeight: 800, border: 'none', background: on ? '#fffdf8' : 'rgba(255,255,255,.22)', color: on ? '#5d3410' : '#fff' })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(40,32,24,.72)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* 미리보기(스케일). 두 장 다 렌더(캡처용) — 안 보는 장은 opacity 0(랩퍼에만). 캡처 ref는 원본 카드에. */}
        <div style={{ width: 1080 * scale, height: 1350 * scale, position: 'relative', borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,.4)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <div style={{ ...layer, opacity: page === 1 ? 1 : 0 }}><div ref={cardRef}><Card {...draw} title={title} tags={tags} recipe={recipe} foodIcon={foodIcon} /></div></div>
            <div style={{ ...layer, opacity: page === 2 ? 1 : 0 }}><div ref={card2Ref}><RecipeCard recipe={recipe} /></div></div>
            {/* 표지 저장용 숨은 카드(CTA 없음). 화면엔 안 보이고 캡처만. */}
            <div style={{ ...layer, opacity: 0, pointerEvents: 'none' }}><div ref={coverRef}><Card {...draw} title={title} tags={tags} recipe={recipe} foodIcon={foodIcon} cover /></div></div>
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
        {onSaveCover && (
          <button className="press" onClick={saveCover} disabled={busy} style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 999, background: 'rgba(255,255,255,.14)', color: '#fffdf8', fontWeight: 700, fontSize: 13.5, border: '1px solid rgba(255,255,255,.34)', opacity: busy ? 0.6 : 1 }}>🖼 이 카드를 내 레시피 표지로</button>
        )}
        <button className="press" onClick={onClose} style={{ marginTop: 12, padding: '8px 18px', background: 'transparent', color: 'rgba(255,255,255,.8)', fontSize: 14, fontWeight: 700, border: 'none' }}>닫기</button>
      </div>
    </div>
  )
}
