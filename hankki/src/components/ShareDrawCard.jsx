import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { toPng, toJpeg } from 'html-to-image'
import { PHOTO_FAMILY } from './Stickers' // 🎗 우리 스티커(마테·데코·글자·음식)를 카드에도 쓴다
import { guessFoodIcon } from './FoodIcon'

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

// 🎗 카드에 우리 스티커를 얹는 도구.
//   ⚠️ 예전 카드가 심심했던 진짜 이유 = **CSS 도형과 유니코드 글자로만** 만들어서다.
//      마스킹테이프 22종·데코·글자 스티커·음식 아이콘 218종을 하나도 안 썼다
//      (테이프는 `점선 네모`, 반짝임은 `✨` 글자). 앱 안에서 유저가 꾸민 것보다
//      공유 카드가 못생긴 상태였음 → 이제 진짜 스티커를 붙인다.
const S = (key) => PHOTO_FAMILY[key]?.src
const St = ({ k, w, style }) => {
  const src = S(k)
  if (!src) return null
  const r = PHOTO_FAMILY[k]?.ratio || 1
  // ⚠️ styles.css 의 전역 `img { max-width: 100% }` 때문에, 폭 0인 뭉치 상자 안에서
  //    스티커가 8px 로 찌그러졌다(2026-07-29 실제 발생). 폭을 직접 정하므로 상한을 푼다.
  return <img src={src} alt="" crossOrigin="anonymous" style={{ position: 'absolute', width: w, height: w / r, maxWidth: 'none', objectFit: 'contain', ...style }} />
}
// 🎨 팔레트 — **배경색과 소품 색을 세트로** 묶는다(창업자 "배경색이랑 잘 어울리게").
//    예전엔 마테·데코를 각각 따로 랜덤으로 뽑아서, 초록 배경에 핑크 리본 + 노란 별 + 무지개가
//    따로 노는 일이 생겼다. 이제 한 팔레트 안에서만 고른다 → 뭘 뽑아도 톤이 맞는다.
//    다시 뽑기 = 팔레트가 통째로 바뀜(가챠 맛은 그대로).
const PALETTES = [
  { key: 'sage', bg: 'linear-gradient(160deg,#e3ecdb,#d4e2d7 55%,#dce7e5)', line: 'rgba(120,140,115,.10)', ink: '#5c7256', sub: '#3f4a3c', cta: '#5c7256', shadow: 'rgba(70,90,70,.32)',
    washi: ['wt_grid_white', 'wt_heart_cream', 'wt_daisy_yellow'], decos: ['dn_plant', 'dn_sparkle', 'dn_star', 'dn_coffee'],
    words: ['tw_daebak', 'tw_fav', 'tw_hearty', 'tw_ourhankki', 'tw_nexttime'] },
  { key: 'butter', bg: 'linear-gradient(160deg,#f7efdc,#f2e6cd 55%,#efe6d6)', line: 'rgba(160,135,85,.11)', ink: '#a3803f', sub: '#5b4a2c', cta: '#a3803f', shadow: 'rgba(120,95,45,.32)',
    washi: ['wt_daisy_yellow', 'wt_grid_white', 'wt_heart_cream'], decos: ['dn_star', 'dn_sparkle', 'dn_coffee', 'dn_bunting'],
    words: ['tw_honey', 'tw_tasty', 'tw_best', 'tw_wow', 'tw_5min'] },
  { key: 'rose', bg: 'linear-gradient(160deg,#f7e6e3,#f2dbd8 55%,#f0e2dd)', line: 'rgba(180,120,115,.10)', ink: '#c4746e', sub: '#6b4a45', cta: '#c4746e', shadow: 'rgba(150,80,75,.3)',
    washi: ['wt_ribbon_pink', 'wt_gingham', 'wt_cherry'], decos: ['dn_cherry', 'dn_ribbon', 'dn_peach', 'dc_nd05'],
    words: ['tw_success', 'tw_welldone', 'tw_yummy', 'tw_first', 'tw_better'] },
  { key: 'lavender', bg: 'linear-gradient(160deg,#eae5f3,#e2dcef 55%,#e6e3f0)', line: 'rgba(130,115,170,.10)', ink: '#7d6bab', sub: '#4d4266', cta: '#7d6bab', shadow: 'rgba(90,75,140,.3)',
    washi: ['wt_dot_lavender', 'wt_daisy_lavender', 'wt_ribbon_lavender'], decos: ['dn_sachet', 'dn_sparkle', 'dn_star', 'dc_nd01'],
    words: ['tw_more', 'tw_goodday', 'tw_again', 'tw_mom'] },
  { key: 'sky', bg: 'linear-gradient(160deg,#e0eef3,#d3e7f0 55%,#dceeea)', line: 'rgba(90,140,165,.10)', ink: '#4a90a8', sub: '#2f5666', cta: '#4a90a8', shadow: 'rgba(45,100,125,.3)',
    washi: ['wt_stripe_blue', 'wt_cloud', 'wt_grid_white'], decos: ['dn_shoot', 'dn_star', 'dn_sparkle', 'dc_nd08'],
    words: ['tw_fail', 'tw_salty', 'tw_night'] },
  // 🏖 여름 팔레트 — 6~8월에만 뽑기 풀에 들어간다(아래 PALETTES_OF 참고).
  //    여름 마테(파도·조개·불가사리·야자·수박)가 여기서만 나와서 '여름 한정' 느낌을 준다.
  { key: 'summer', bg: 'linear-gradient(160deg,#dcf1f2,#bfe6ee 55%,#cdeee4)', line: 'rgba(60,140,160,.11)', ink: '#2f96a6', sub: '#144e5c', cta: '#2b7f8c', shadow: 'rgba(30,110,130,.35)',
    washi: ['wt_wave', 'wt_stripe_blue', 'wt_shell'], decos: ['dn_star', 'dn_sparkle', 'dn_shoot', 'dn_peach'],
    words: ['tw_salty', 'tw_fail', 'tw_tasty'] },
]
// 제철 팔레트만 섞는다 — 여름 톤이 8월까지만 등장해 '한정' 감각이 살아난다.
const PALETTES_OF = (month) => (month >= 6 && month <= 8 ? PALETTES : PALETTES.filter((p) => p.key !== 'summer'))
const titleFont = (t) => { const n = String(t).replace(/\s/g, '').length; return n <= 5 ? 104 : n <= 7 ? 88 : n <= 9 ? 74 : 62 }

// 레시피 태그: 실제 데이터(카테고리·태그)에서. 없으면 담백한 기본.
function tagsOf(recipe) {
  const t = [...(recipe?.tags || [])]
  if (recipe?.category && !t.includes(recipe.category)) t.unshift(recipe.category)
  return (t.length ? t : ['오늘의 한끼']).slice(0, 2)
}

// 스타일별 카테고리 규칙(적재적소): 콤비는 넓은 스타일(홀로·팝·여름)에만.
// 🔧 카드 확인용 스위치 — 주소에 `?card=pola:rose` 를 붙이면 그 스타일·팔레트로 고정된다.
//    (랜덤이라 원하는 조합을 뽑기까지 계속 다시 뽑아야 해서 시안 비교·검수가 사실상 불가능했다.)
//    파라미터가 없으면 아무 일도 안 한다 = 실사용엔 영향 없음.
function forced() {
  try {
    const v = new URLSearchParams(location.search).get('card')
    if (!v) return null
    const [style, palKey] = v.split(':')
    return { style: style || null, pal: PALETTES.find((p) => p.key === palKey) || null }
  } catch { return null }
}

function drawState() {
  const f = forced()
  const m = new Date().getMonth() + 1
  const pal = f?.pal || rnd(PALETTES_OF(m))    // 🎨 팔레트 먼저 — 배경과 소품이 한 세트
  const wi = Math.floor(Math.random() * pal.decos.length)
  const isSummer = m >= 6 && m <= 8 // 여름 시즌카드는 6~8월에만 뽑기 풀에 등장(한정 수집감). 그 외 계절 미노출.
  const style = f?.style || rnd(isSummer ? ['holo', 'pop', 'summer', 'pola', 'diary', 'summer'] : ['holo', 'pop', 'pop', 'pola', 'diary'])
  let cat
  if (style === 'holo') cat = DUO.length ? DUO : GOM
  else if (style === 'pop' || style === 'summer') { const r = Math.random(); cat = r < 0.6 ? GOM : r < 0.82 ? PENG : (DUO.length ? DUO : GOM) }
  else { const r = Math.random(); cat = r < 0.72 ? GOM : (PENG.length ? PENG : GOM) } // pola·diary = 솔로
  return {
    style, char: rnd(cat.length ? cat : ENTRIES), no: 2 + Math.floor(Math.random() * 46),
    pal, washi: pal.washi[0], washi2: pal.washi[1], deco: pal.decos[wi % pal.decos.length], deco2: pal.decos[(wi + 1) % pal.decos.length], word: rnd(pal.words),
  }
}

const DIE = 'drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff) drop-shadow(0 16px 22px rgba(60,40,25,.26))'
const POP_BGS = [
  'radial-gradient(circle at 50% 30%,#ffa579,#f4794f 68%,#e8623c)', 'radial-gradient(circle at 50% 30%,#ffd07a,#f6b23e 68%,#e89a2a)',
  'radial-gradient(circle at 50% 30%,#8fd0b0,#5fb88f 68%,#4aa079)', 'radial-gradient(circle at 50% 30%,#f79bc0,#ef7aa8 68%,#e5638f)',
]

// ── 1080×1350 카드 (캡처 대상) ──
//
// 📐 5장 공통 뼈대 — 예전엔 카드마다 제목 위치·여백이 제각각이라 "미감이 없다"는 판정을 받았다.
//    이제 다섯 장이 같은 격자를 쓴다:
//      브랜드 150 · 소품뭉치A(우상) · 주인공+요리 250~830 · 소품뭉치B(좌하)
//      · 제목 880 · 태그 · CTA(bottom 150)
//
// 🎯 소품은 '뭉쳐서' 놓는다 — 다꾸의 기본(리서치: docs/다꾸-리서치-2026-07-29.md 규칙 3).
//    예전엔 사방에 하나씩 균등하게 뿌려서 허전했다. 이제 한 자리에 2~3개를 겹쳐 쌓고,
//    크기에 위계를 준다(큰 것 1 · 중간 1 · 작은 1) → 리듬이 생긴다.
const CL = [
  { w: 1.0, dx: 0, dy: 0, r: -9 },
  { w: 0.62, dx: 0.72, dy: 0.52, r: 11 },
  { w: 0.44, dx: -0.3, dy: 0.74, r: -16 },
]
function Cluster({ keys, x, y, size = 150, flip = false }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 0, height: 0, zIndex: 4 }}>
      {keys.slice(0, 3).map((k, i) => {
        const c = CL[i]
        return <St key={i} k={k} w={size * c.w}
          style={{ left: (flip ? -1 : 1) * c.dx * size, top: c.dy * size, transform: `rotate(${c.r}deg)` }} />
      })}
    </div>
  )
}

function Card({ style, char, no, title, tags, popBg, cover, washi, washi2, deco, deco2, word, foodIcon, pal }) {
  const pill = { display: 'inline-block', padding: '11px 28px', borderRadius: 40, fontSize: 31, margin: '0 4px' }
  // 🔍 CTA — 바이럴 핵심. 크고 채운 알약으로 확 띄게 + 정사각 안전영역(bottom 150) 안에.
  //   (인스타는 4:5를 1:1로 크롭해서 맨 위/아래를 잘라냄 → 중요한 건 가운데 정사각 안에 둔다)
  //   cover 모드(표지 저장용)에선 CTA를 숨긴다 — 공유가 아니라 내 레시피 표지라서.
  const cta = (opt) => cover ? null : (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 150, textAlign: 'center' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '21px 46px', borderRadius: 999, background: opt.bg, color: opt.color, fontSize: 42, fontWeight: 800, boxShadow: opt.shadow }}>Play스토어 ‘한끼’ 검색</span>
    </div>
  )
  // 주인공은 크게 — 카드의 절반을 차지해야 눈이 먼저 간다(예전엔 1/3이라 허전했다).
  const hero = (extra) => (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 262, height: 560, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <img src={char.url} alt="" crossOrigin="anonymous" style={{ maxHeight: '100%', maxWidth: '66%', objectFit: 'contain', filter: DIE, ...extra }} />
    </div>
  )
  // 요리 아이콘은 주인공 오른쪽 발치에 — 캐릭터가 '그 요리를 옆에 두고 있는' 구도
  const dish = (extra) => foodIcon && S(foodIcon) ? (
    <img src={S(foodIcon)} alt="" crossOrigin="anonymous"
      style={{ position: 'absolute', right: 74, top: 604, width: 268, objectFit: 'contain', transform: 'rotate(4deg)', filter: DIE, ...extra }} />
  ) : null
  // 제목 묶음 — 다섯 장 모두 같은 높이에서 시작한다
  const titleBlock = (col, tagBg, tagCol) => (
    <div style={{ position: 'absolute', top: cover ? 966 : 872, left: 0, right: 0, textAlign: 'center', color: col, padding: '0 64px' }}>
      <div style={{ lineHeight: 1.04, wordBreak: 'keep-all', fontSize: Math.min(88, titleFont(title)) }}>{title}</div>
      <div style={{ marginTop: 14 }}>{tags.map((x, i) => <span key={i} style={{ ...pill, background: tagBg, color: tagCol }}>{x}</span>)}</div>
    </div>
  )
  const brand = (col) => <div style={{ position: 'absolute', top: 150, left: 62, fontSize: 42, color: col }}>한끼</div>
  // 문구 스티커 = 작은 포인트. 제목 왼쪽 빈자리에 살짝 기울여 붙인다.
  const wordSticker = () => <St k={word} w={186} style={{ top: 236, right: 214, transform: 'rotate(7deg)', zIndex: 4 }} />

  if (style === 'holo') {
    // 🌙 홀로(밤) — 어두운 배경은 '희귀 수집카드' 정체성이라 유지.
    //    ⛔ 글자 스티커는 안 붙인다: 파스텔 칭찬 라벨과 홀로그램 톤은 정반대라 서로 싸운다(창업자 지적).
    return (
      <div style={{ width: 1080, height: 1350, fontFamily: 'Jua, sans-serif', position: 'relative', overflow: 'hidden', background: 'radial-gradient(circle at 50% 34%,#3a4152,#2d3340 72%,#242833)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.10) 5px,transparent 6px)', backgroundSize: '104px 104px' }} />
        <div style={{ position: 'absolute', top: 250, left: '50%', transform: 'translateX(-50%)', width: 560, height: 560, borderRadius: '50%', background: 'conic-gradient(from 20deg,#ff9aa2,#ffdac1,#e2f0cb,#b5ead7,#c7ceea,#f7c6ff,#ffabe0,#ff9aa2)', opacity: 0.28, filter: 'blur(4px)' }} />
        {brand('#f3e9dd')}
        <div style={{ position: 'absolute', top: 148, right: 58, width: 144, height: 144, borderRadius: '50%', border: '3px dashed rgba(255,220,140,.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ffe4a0', fontSize: 30, lineHeight: 1.15 }}>No.{String(no).padStart(2, '0')}<br /><span style={{ fontSize: 20 }}>레어</span></div>
        <Cluster keys={['dn_sparkle', 'dn_star', 'dn_shoot']} x={92} y={372} size={168} />
        {hero()}
        {/* 어두운 배경에 어두운 그릇이 묻혀 칙칙했다 → 홀로 후광을 깔아 띄운다 */}
        {foodIcon && S(foodIcon) && (
          <div style={{ position: 'absolute', right: 78, top: 596, width: 296, height: 296 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 42% 38%,rgba(255,242,205,.62),rgba(200,180,255,.3) 56%,transparent 72%)', filter: 'blur(2px)' }} />
            <img src={S(foodIcon)} alt="" crossOrigin="anonymous" style={{ position: 'absolute', left: '9%', top: '9%', width: '82%', height: '82%', objectFit: 'contain', transform: 'rotate(4deg)', filter: DIE }} />
          </div>
        )}
        <div style={{ position: 'absolute', top: cover ? 966 : 872, left: 0, right: 0, textAlign: 'center', padding: '0 64px' }}>
          <div style={{ lineHeight: 1.04, wordBreak: 'keep-all', fontSize: Math.min(88, titleFont(title)), background: 'linear-gradient(90deg,#ffd98a,#ffb0c4,#c7b3f0)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{title}</div>
          <div style={{ marginTop: 14 }}>{tags.map((x, i) => <span key={i} style={{ ...pill, background: 'rgba(255,255,255,.14)', color: '#ffe4a0' }}>{x}</span>)}</div>
        </div>
        {cta({ bg: '#ffe0a0', color: '#3a2a12', shadow: '0 8px 24px rgba(0,0,0,.4)' })}
      </div>
    )
  }

  if (style === 'pop') {
    // 🍊 컬러팝 — 쨍한 단색이 정체성이라 배경은 그대로. 소품 뭉치로 채운다.
    //    우리 스티커는 전부 흰 다이컷이 있어 진한 배경에서도 또렷하다.
    return (
      <div style={{ width: 1080, height: 1350, fontFamily: 'Jua, sans-serif', position: 'relative', overflow: 'hidden', background: popBg }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.26) 7px,transparent 8px)', backgroundSize: '96px 96px' }} />
        {brand('#fffdf8')}
        <St k={washi} w={264} style={{ top: 74, left: 214, transform: 'rotate(-7deg)' }} />
        <div style={{ position: 'absolute', top: 148, right: 58, width: 144, height: 144, borderRadius: '50%', border: '3px dashed rgba(255,255,255,.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 29, lineHeight: 1.2 }}>오늘의<br />한 끼</div>
        <Cluster keys={[deco, pal.decos[1], deco2]} x={92} y={330} size={166} />
        {hero()}
        {dish()}
        {wordSticker()}
        {titleBlock('#fffdf8', 'rgba(255,253,248,.94)', '#c85535')}
        {cta({ bg: '#fffdf8', color: '#b0472a', shadow: '0 10px 22px rgba(90,35,20,.35)' })}
      </div>
    )
  }

  if (style === 'summer') {
    // 🏖 여름 한정 — 배경(하늘·바다·물결·해)은 그대로 두고, 곰펭을 바다 위에 바로 세운다.
    //    예전엔 하늘색 둥근 판을 깔고 그 위에 얹어서 '카드 속 카드'처럼 겉돌았다(창업자 지적).
    const sHero = { maxHeight: '100%', maxWidth: '64%', objectFit: 'contain', filter: 'drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff) drop-shadow(0 3px 0 #fff) drop-shadow(0 -3px 0 #fff) drop-shadow(0 18px 20px rgba(20,90,110,.42))' }
    return (
      <div style={{ width: 1080, height: 1350, fontFamily: 'Jua, sans-serif', position: 'relative', overflow: 'hidden', background: 'linear-gradient(165deg,#dcf2f3,#b3e2ee 52%,#c4ebdf)' }}>
        <div style={{ position: 'absolute', top: -80, right: -70, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%,rgba(255,247,208,.95),rgba(255,238,170,.45) 46%,transparent 70%)' }} />
        <svg viewBox="0 0 1080 300" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 300 }}>
          <path d="M0 120 C160 80 260 160 420 140 C600 118 700 60 900 96 C990 112 1040 120 1080 112 L1080 300 L0 300Z" fill="#8ad8de" opacity=".5" />
          <path d="M0 170 C180 132 300 200 480 184 C680 166 780 120 980 150 C1030 158 1060 162 1080 158 L1080 300 L0 300Z" fill="#59bccd" opacity=".62" />
          <path d="M0 224 C200 196 320 250 520 238 C720 226 820 196 1080 220 L1080 300 L0 300Z" fill="#ffffff" opacity=".45" />
        </svg>
        {brand('#2b7f8c')}
        <div style={{ position: 'absolute', top: 146, right: 56, transform: 'rotate(7deg)', fontSize: 30, color: '#fff', background: 'linear-gradient(180deg,#ff9fae,#ff7f92)', padding: '12px 26px', borderRadius: 16, boxShadow: '0 8px 16px -6px rgba(220,90,110,.6),inset 0 2px 0 rgba(255,255,255,.4)' }}>여름 한정</div>
        <St k={washi} w={272} style={{ top: 82, left: 210, transform: 'rotate(-6deg)' }} />
        <Cluster keys={[deco, pal.decos[1], deco2]} x={92} y={342} size={166} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 262, height: 560, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <img src={char.url} alt="" crossOrigin="anonymous" style={sHero} />
        </div>
        {dish()}
        {wordSticker()}
        {titleBlock('#144e5c', 'rgba(255,255,255,.86)', '#2b7f8c')}
        {cta({ bg: '#fffdf8', color: '#2b7f8c', shadow: '0 10px 22px rgba(30,110,130,.35)' })}
      </div>
    )
  }

  if (style === 'pola') {
    // 📸 폴꾸 — 폴라로이드에 마테를 걸치고, 사진칸에 꼬르곰·펭펭 + 그 요리.
    const cap = String(title)
    return (
      <div style={{ width: 1080, height: 1350, fontFamily: 'Jua, sans-serif', position: 'relative', overflow: 'hidden', background: pal.bg }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${pal.line} 1.5px,transparent 1.5px),linear-gradient(90deg,${pal.line} 1.5px,transparent 1.5px)`, backgroundSize: '58px 58px' }} />
        {brand(pal.ink)}
        <div style={{ position: 'absolute', top: 236, left: '50%', transform: 'translateX(-50%) rotate(-3deg)', width: 654, background: '#fffef9', borderRadius: 14, padding: '30px 30px 0', boxShadow: '0 26px 50px rgba(80,95,80,.3)' }}>
          <div style={{ width: '100%', height: 486, borderRadius: 8, position: 'relative', overflow: 'hidden', background: 'radial-gradient(circle at 50% 40%,#f8f5ef,#ebefe8)' }}>
            <div style={{ position: 'absolute', inset: 0, top: 'auto', bottom: 0, height: '96%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <img src={char.url} alt="" crossOrigin="anonymous" style={{ maxHeight: '100%', maxWidth: '62%', objectFit: 'contain', filter: 'drop-shadow(0 8px 12px rgba(60,40,25,.2))' }} />
            </div>
            {foodIcon && S(foodIcon) && (
              <img src={S(foodIcon)} alt="" crossOrigin="anonymous"
                style={{ position: 'absolute', right: 16, bottom: 10, width: 224, objectFit: 'contain', filter: 'drop-shadow(0 8px 14px rgba(60,40,25,.26))' }} />
            )}
          </div>
          <div style={{ fontFamily: 'Gaegu, sans-serif', fontSize: cap.length > 11 ? 34 : cap.length > 8 ? 39 : 44, color: pal.ink, textAlign: 'center', padding: '20px 0 24px', whiteSpace: 'nowrap' }}>오늘의 {cap}</div>
          {/* 마테는 프레임 밖으로 삐져나오게(폴꾸 기법) */}
          <St k={washi} w={290} style={{ top: -34, left: 92, transform: 'rotate(-6deg)', zIndex: 3 }} />
          <St k={washi2} w={216} style={{ top: -28, right: -54, transform: 'rotate(14deg)', zIndex: 3 }} />
        </div>
        <Cluster keys={[deco, pal.decos[1], deco2]} x={78} y={534} size={142} />
        {wordSticker()}
        {titleBlock(pal.sub, '#fffef9', pal.ink)}
        {cta({ bg: pal.cta, color: '#fffef9', shadow: `0 10px 22px ${pal.shadow}` })}
      </div>
    )
  }

  // 📔 diary (다꾸) — 격자 노트에 마테로 붙인 다이어리 한 장.
  return (
    <div style={{ width: 1080, height: 1350, fontFamily: 'Jua, sans-serif', position: 'relative', overflow: 'hidden', background: '#f7f2e9', backgroundImage: `linear-gradient(${pal.line} 1.5px,transparent 1.5px),linear-gradient(90deg,${pal.line} 1.5px,transparent 1.5px)`, backgroundSize: '56px 56px' }}>
      {brand(pal.ink)}
      <St k={washi} w={286} style={{ top: 78, left: 212, transform: 'rotate(-6deg)' }} />
      <St k={washi2} w={228} style={{ top: 128, right: 62, transform: 'rotate(8deg)' }} />
      <Cluster keys={[deco, pal.decos[1], deco2]} x={92} y={342} size={166} />
      {hero()}
      {dish()}
      {wordSticker()}
      {titleBlock(pal.sub, '#fffef9', pal.ink)}
      {cta({ bg: '#8a6a3a', color: '#fff8ea', shadow: '0 10px 22px rgba(120,90,40,.32)' })}
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
  // 🍱 그 레시피의 요리 아이콘 — 카드가 '무슨 음식'인지 그림으로 말해준다(예전엔 제목 글자뿐이었다)
  const foodIcon = useMemo(() => recipe?.icon || guessFoodIcon(recipe?.title || ''), [recipe])
  const [draw, setDraw] = useState(drawState)
  const [popBg, setPopBg] = useState(() => rnd(POP_BGS))
  const [busy, setBusy] = useState(false)
  const cardRef = useRef(null)
  const card2Ref = useRef(null)
  const coverRef = useRef(null) // 표지 저장용(CTA 없는 cover 카드)
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
            <div style={{ ...layer, opacity: page === 1 ? 1 : 0 }}><div ref={cardRef}><Card {...draw} title={title} tags={tags} popBg={popBg} foodIcon={foodIcon} /></div></div>
            <div style={{ ...layer, opacity: page === 2 ? 1 : 0 }}><div ref={card2Ref}><RecipeCard recipe={recipe} /></div></div>
            {/* 표지 저장용 숨은 카드(CTA 없음). 화면엔 안 보이고 캡처만. */}
            <div style={{ ...layer, opacity: 0, pointerEvents: 'none' }}><div ref={coverRef}><Card {...draw} title={title} tags={tags} popBg={popBg} foodIcon={foodIcon} cover /></div></div>
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
