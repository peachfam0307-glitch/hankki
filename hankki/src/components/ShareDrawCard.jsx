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
// 📐 다시 설계한 뼈대 (2026-07-29) — docs/다꾸-리서치-2026-07-29.md 규칙대로.
//
//   예전 문제: 캐릭터·요리·제목이 셋 다 크고 셋 다 가운데라 **주인공이 없었다.**
//   특히 요리 아이콘이 아무 데도 안 걸린 채 캐릭터 옆 허공에 떠 있어 "왜 여깄지?" 싶었다
//   (창업자 "옆에 애매하게 붙이는 게 너무 이상해").
//
//   ⭐ 결정: **주인공은 요리.** 레시피 자랑 카드니까.
//      · 요리는 **프레임 안**에 담긴다 → 허공에 안 뜬다(규칙 6 "프레임에 맞춰")
//      · 마테가 그 프레임을 **붙잡는다** → 벽에 붙인 사진처럼 걸려 있다
//      · 꼬르곰·펭펭은 프레임에 **기대어** 자랑해주는 조연 → 요리와 관계가 생긴다
//      · 소품은 한 자리에 **뭉쳐서**(규칙 3), 프레임·캐릭터·뭉치가 **삼각**(규칙 5)
//
//   5장이 이 뼈대를 공유하고, **프레임 모양과 연출만 다르다** → 통일감 + 각자의 매력.
const F = { top: 232, size: 560, left: (1080 - 560) / 2 }

function Card({ style, char, no, title, tags, popBg, cover, washi, washi2, deco, deco2, word, foodIcon, pal }) {
  const pill = { display: 'inline-block', padding: '11px 28px', borderRadius: 40, fontSize: 31, margin: '0 4px' }
  const cta = (opt) => cover ? null : (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 148, textAlign: 'center' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '21px 46px', borderRadius: 999, background: opt.bg, color: opt.color, fontSize: 42, fontWeight: 800, boxShadow: opt.shadow }}>Play스토어 ‘한끼’ 검색</span>
    </div>
  )
  const brand = (col) => <div style={{ position: 'absolute', top: 138, left: 62, fontSize: 42, color: col }}>한끼</div>

  // 🍱 주인공 = 요리. 프레임 안에 담아 '걸려 있게' 한다.
  //    ⚠️ 원본이 250~370px 라 너무 키우면 흐려진다 → 340px 선에서 멈춘다.
  const dish = (size = 340) => foodIcon && S(foodIcon)
    ? <img src={S(foodIcon)} alt="" crossOrigin="anonymous" style={{ width: size, height: size, objectFit: 'contain', maxWidth: 'none', filter: 'drop-shadow(0 12px 18px rgba(60,40,25,.22))' }} />
    : <div style={{ width: size, height: size }} />

  // 🐻 조연 = 꼬르곰·펭펭. 프레임 오른쪽 아래에 **걸쳐** 세운다(겹쳐야 관계가 생긴다).
  // 🐻 조연 = 꼬르곰·펭펭. 프레임에 **걸쳐** 세운다(겹쳐야 관계가 생긴다).
  //    ⚠️ 서는 자리는 카드마다 다르게 — 5장이 다 오른쪽이면 구성이 똑같아 보인다(창업자 지적).
  const buddy = (extra) => (
    <img src={char.url} alt="" crossOrigin="anonymous"
      style={{ position: 'absolute', height: 388, maxWidth: 'none', objectFit: 'contain', filter: DIE, zIndex: 5, ...extra }} />
  )

  const titleBlock = (col, tagBg, tagCol, grad) => (
    <div style={{ position: 'absolute', top: cover ? 1006 : 906, left: 0, right: 0, textAlign: 'center', padding: '0 70px' }}>
      <div style={{ lineHeight: 1.04, wordBreak: 'keep-all', fontSize: Math.min(86, titleFont(title)), color: grad ? 'transparent' : col, ...(grad ? { background: grad, WebkitBackgroundClip: 'text', backgroundClip: 'text' } : null) }}>{title}</div>
      <div style={{ marginTop: 14 }}>{tags.map((x, i) => <span key={i} style={{ ...pill, background: tagBg, color: tagCol }}>{x}</span>)}</div>
    </div>
  )

  if (style === 'holo') {
    // 🌙 ① 홀로 — **희귀 수집카드**. 요리를 둥근 홀로 창에 넣고 금테를 두른다.
    return (
      <div style={{ width: 1080, height: 1350, fontFamily: 'Jua, sans-serif', position: 'relative', overflow: 'hidden', background: 'radial-gradient(circle at 50% 34%,#3d445a,#2e3441 70%,#242833)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.09) 5px,transparent 6px)', backgroundSize: '104px 104px' }} />
        {brand('#f3e9dd')}
        <div style={{ position: 'absolute', top: 136, right: 58, width: 146, height: 146, borderRadius: '50%', border: '3px dashed rgba(255,220,140,.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ffe4a0', fontSize: 30, lineHeight: 1.15 }}>No.{String(no).padStart(2, '0')}<br /><span style={{ fontSize: 20 }}>레어</span></div>
        {/* 홀로 창 */}
        <div style={{ position: 'absolute', left: F.left, top: F.top, width: F.size, height: F.size, borderRadius: '50%', background: 'conic-gradient(from 20deg,#ff9aa2,#ffdac1,#e2f0cb,#b5ead7,#c7ceea,#f7c6ff,#ffabe0,#ff9aa2)', opacity: 0.42, filter: 'blur(6px)' }} />
        <div style={{ position: 'absolute', left: F.left + 34, top: F.top + 34, width: F.size - 68, height: F.size - 68, borderRadius: '50%', background: 'radial-gradient(circle at 42% 34%,#fffaf0,#f2e6d4 74%)', border: '6px solid rgba(255,226,160,.95)', boxShadow: '0 24px 50px -14px rgba(0,0,0,.55), inset 0 3px 0 rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {dish(330)}
        </div>
        <St k="dn_sparkle" w={150} style={{ left: 78, top: 402, transform: 'rotate(-10deg)', zIndex: 6 }} />
        <St k="dn_star" w={92} style={{ left: 176, top: 546, transform: 'rotate(12deg)', zIndex: 6 }} />
        <St k="dn_shoot" w={124} style={{ left: 44, top: 606, transform: 'rotate(-14deg)', zIndex: 6 }} />
        {buddy({ height: 356, top: 486, right: 40 })}
        {titleBlock('#f6ede0', 'rgba(255,255,255,.14)', '#ffe4a0', 'linear-gradient(90deg,#ffd98a,#ffb0c4,#c7b3f0)')}
        {cta({ bg: '#ffe0a0', color: '#3a2a12', shadow: '0 8px 24px rgba(0,0,0,.4)' })}
      </div>
    )
  }

  if (style === 'pop') {
    // 🍊 ② 컬러팝 — **쨍한 스티커팩**. 굵은 흰 다이컷 테두리를 두른 각진 프레임.
    return (
      <div style={{ width: 1080, height: 1350, fontFamily: 'Jua, sans-serif', position: 'relative', overflow: 'hidden', background: popBg }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.26) 9px,transparent 10px)', backgroundSize: '104px 104px' }} />
        {brand('#fffdf8')}
        <div style={{ position: 'absolute', top: 136, right: 58, width: 146, height: 146, borderRadius: '50%', border: '3px dashed rgba(255,255,255,.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 29, lineHeight: 1.2 }}>오늘의<br />한 끼</div>
        <div style={{ position: 'absolute', left: F.left, top: F.top, width: F.size, height: F.size, borderRadius: 46, background: '#fffdf8', border: '14px solid #fff', boxShadow: '0 26px 48px -14px rgba(120,45,25,.45)', transform: 'rotate(-2.5deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 32, backgroundImage: 'radial-gradient(rgba(0,0,0,.045) 6px,transparent 7px)', backgroundSize: '58px 58px' }} />
          {dish(346)}
        </div>
        <St k={washi} w={288} style={{ left: 196, top: 200, transform: 'rotate(-22deg)', zIndex: 6 }} />
        <St k={deco} w={142} style={{ right: 58, top: 456, transform: 'rotate(12deg)', zIndex: 6 }} />
        <St k={pal.decos[1]} w={94} style={{ right: 168, top: 600, transform: 'rotate(-10deg)', zIndex: 6 }} />
        <St k={word} w={190} style={{ right: 40, top: 690, transform: 'rotate(8deg)', zIndex: 6 }} />
        {buddy({ left: 40, top: 470 })}
        {titleBlock('#fffdf8', 'rgba(255,253,248,.94)', '#c85535')}
        {cta({ bg: '#fffdf8', color: '#b0472a', shadow: '0 10px 22px rgba(90,35,20,.35)' })}
      </div>
    )
  }

  if (style === 'summer') {
    // 🏖 ③ 여름 한정 — **시즌 엽서**. 요리를 둥근 창(배 창문)에 넣고 바다 위에 띄운다.
    const sDie = 'drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff) drop-shadow(0 3px 0 #fff) drop-shadow(0 -3px 0 #fff) drop-shadow(0 18px 20px rgba(20,90,110,.42))'
    return (
      <div style={{ width: 1080, height: 1350, fontFamily: 'Jua, sans-serif', position: 'relative', overflow: 'hidden', background: 'linear-gradient(165deg,#ddf3f4,#aee0ee 52%,#c6ece0)' }}>
        <div style={{ position: 'absolute', top: -80, right: -70, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%,rgba(255,247,208,.95),rgba(255,238,170,.45) 46%,transparent 70%)' }} />
        <svg viewBox="0 0 1080 340" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 340 }}>
          <path d="M0 140 C160 100 260 180 420 160 C600 138 700 80 900 116 C990 132 1040 140 1080 132 L1080 340 L0 340Z" fill="#8ad8de" opacity=".5" />
          <path d="M0 192 C180 154 300 222 480 206 C680 188 780 142 980 172 C1030 180 1060 184 1080 180 L1080 340 L0 340Z" fill="#59bccd" opacity=".6" />
          <path d="M0 248 C200 220 320 274 520 262 C720 250 820 220 1080 244 L1080 340 L0 340Z" fill="#ffffff" opacity=".45" />
        </svg>
        {brand('#2b7f8c')}
        <div style={{ position: 'absolute', top: 140, right: 56, transform: 'rotate(7deg)', fontSize: 30, color: '#fff', background: 'linear-gradient(180deg,#ff9fae,#ff7f92)', padding: '12px 26px', borderRadius: 16, boxShadow: '0 8px 16px -6px rgba(220,90,110,.6),inset 0 2px 0 rgba(255,255,255,.4)' }}>여름 한정</div>
        {/* 둥근 창 */}
        <div style={{ position: 'absolute', left: F.left, top: F.top, width: F.size, height: F.size, borderRadius: '50%', background: 'linear-gradient(170deg,#fbfdfd,#e6f6f8)', border: '16px solid #fff', boxShadow: '0 28px 54px -16px rgba(25,105,130,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '46%', borderRadius: '50% 50% 40% 40%', background: 'linear-gradient(180deg,rgba(255,255,255,.75),rgba(255,255,255,0))' }} />
          {dish(338)}
        </div>
        <St k={washi} w={300} style={{ left: 268, top: 178, transform: 'rotate(-4deg)', zIndex: 6 }} />
        <St k={deco} w={138} style={{ right: 62, top: 486, transform: 'rotate(11deg)', zIndex: 6 }} />
        <St k={pal.decos[1]} w={92} style={{ right: 172, top: 626, transform: 'rotate(-9deg)', zIndex: 6 }} />
        <St k={word} w={190} style={{ right: 44, top: 716, transform: 'rotate(7deg)', zIndex: 6 }} />
        {buddy({ filter: sDie, left: 66, top: 470, height: 380 })}
        {titleBlock('#144e5c', 'rgba(255,255,255,.88)', '#2b7f8c')}
        {cta({ bg: '#fffdf8', color: '#2b7f8c', shadow: '0 10px 22px rgba(30,110,130,.35)' })}
      </div>
    )
  }

  if (style === 'pola') {
    // 📸 ④ 폴꾸 — **벽에 붙인 사진**. 마테가 폴라로이드를 붙잡고, 손글씨 캡션이 달린다.
    const cap = String(title)
    return (
      <div style={{ width: 1080, height: 1350, fontFamily: 'Jua, sans-serif', position: 'relative', overflow: 'hidden', background: pal.bg }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${pal.line} 1.5px,transparent 1.5px),linear-gradient(90deg,${pal.line} 1.5px,transparent 1.5px)`, backgroundSize: '58px 58px' }} />
        {brand(pal.ink)}
        <div style={{ position: 'absolute', left: F.left - 22, top: F.top - 6, width: F.size + 44, background: '#fffef9', borderRadius: 12, padding: '28px 28px 0', boxShadow: '0 26px 50px -12px rgba(80,80,70,.34)', transform: 'rotate(-2.5deg)' }}>
          <div style={{ width: '100%', height: 470, borderRadius: 6, background: 'radial-gradient(circle at 50% 40%,#fffdf6,#f4efe3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {dish(338)}
          </div>
          <div style={{ fontFamily: 'Gaegu, sans-serif', fontSize: cap.length > 11 ? 34 : cap.length > 8 ? 39 : 44, color: pal.ink, textAlign: 'center', padding: '18px 0 22px', whiteSpace: 'nowrap' }}>오늘의 {cap}</div>
          {/* 마테가 사진을 벽에 붙인다 — 프레임 밖으로 삐져나오게 */}
          <St k={washi} w={296} style={{ top: -36, left: 84, transform: 'rotate(-7deg)', zIndex: 3 }} />
          <St k={washi2} w={224} style={{ bottom: -30, left: -56, transform: 'rotate(-16deg)', zIndex: 3 }} />
        </div>
        <St k={deco} w={138} style={{ left: 58, top: 456, transform: 'rotate(-12deg)', zIndex: 6 }} />
        <St k={pal.decos[1]} w={88} style={{ left: 158, top: 596, transform: 'rotate(10deg)', zIndex: 6 }} />
        <St k={word} w={184} style={{ left: 38, top: 660, transform: 'rotate(-8deg)', zIndex: 6 }} />
        {buddy({ top: 512, height: 372, right: 34 })}
        {titleBlock(pal.sub, '#fffef9', pal.ink)}
        {cta({ bg: pal.cta, color: '#fffef9', shadow: `0 10px 22px ${pal.shadow}` })}
      </div>
    )
  }

  // 📔 ⑤ 다꾸 — **다이어리 한 페이지**. 격자 노트에 도일리(스캘롭) 프레임으로 요리를 붙였다.
  const scallop = 'radial-gradient(circle at 50% 0,transparent 22px,#fffef9 23px) 0 0/46px 46px repeat-x'
  return (
    <div style={{ width: 1080, height: 1350, fontFamily: 'Jua, sans-serif', position: 'relative', overflow: 'hidden', background: '#f8f3ea', backgroundImage: `linear-gradient(${pal.line} 1.5px,transparent 1.5px),linear-gradient(90deg,${pal.line} 1.5px,transparent 1.5px)`, backgroundSize: '56px 56px' }}>
      {brand(pal.ink)}
      <div style={{ position: 'absolute', left: F.left, top: F.top, width: F.size, height: F.size, borderRadius: '50%', background: '#fffef9', border: `9px dashed ${pal.ink}33`, boxShadow: '0 22px 44px -14px rgba(90,85,70,.32)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 26, borderRadius: '50%', border: `3px solid ${pal.ink}22` }} />
        <div style={{ display: 'none' }}>{scallop}</div>
        {dish(342)}
      </div>
      <St k={washi} w={292} style={{ left: 236, top: 186, transform: 'rotate(-7deg)', zIndex: 6 }} />
      <St k={washi2} w={232} style={{ left: 172, top: 742, transform: 'rotate(-9deg)', zIndex: 6 }} />
      <St k={deco} w={140} style={{ right: 56, top: 430, transform: 'rotate(12deg)', zIndex: 6 }} />
      <St k={pal.decos[1]} w={92} style={{ right: 178, top: 566, transform: 'rotate(-9deg)', zIndex: 6 }} />
      <St k={word} w={188} style={{ right: 44, top: 706, transform: 'rotate(8deg)', zIndex: 6 }} />
      {buddy({ left: 36, top: 480 })}
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
