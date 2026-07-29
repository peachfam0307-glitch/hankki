import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { toPng, toJpeg } from 'html-to-image'
import Icon from './Icon'
// ⛔ UI엔 유니코드 이모지를 쓰지 않는다 — 우리 아이콘·스티커만(CLAUDE.md 핀).
//    v8.63에서 앱 전체를 정리할 때 이 시트는 '보류'로 빠져 🔄💌🖼🐻🐧가 남아 있었다(2026-07-29 정리).
import uiDuoHi from '../assets/stickers/photo/gp_duohi.png'

// 🎴 공유 "뽑기카드" — 레시피마다 스타일×곰펭 랜덤. 🔄로 다시뽑기(가챠), 공유는 Web Share.
// ⭐ 곰펭 풀 = src/assets/sharepool 폴더 전체를 glob → "폴더에 넣기만 하면 자동으로 다 쓰임"
//    (저장해두고 안 쓰는 문제를 코드가 구조적으로 차단. 새 포즈 추가 = 그냥 폴더에 넣으면 끝.)
const POOL = import.meta.glob('../assets/sharepool/*.png', { eager: true, query: '?url', import: 'default' })
const ENTRIES = Object.entries(POOL).map(([k, url]) => ({ name: k.split('/').pop(), url }))
// 🍳 **레시피 자랑 카드엔 음식·요리 컷만 쓴다.**
//    예전엔 포즈 컷(엄지·브이·인사)을 쓰고 요리 아이콘을 옆에 따로 붙였는데,
//    그게 허공에 뜬 것처럼 어색했다(창업자 "음식 빼, 카드 이상해져").
//    ⭐ 2026-07-29 풀 확장: sharepool 밖에 요리·음식 컷이 더 있었다
//       (창업자 "요리하는 거, 음식 먹고 들고 있고… 자산 많잖아" / "이거말고 더있잖아 찾아봐").
//       · `곰펭-에피소드-2507/낱개` → duo_cooking·cart·dessert / gom_shop·shop_walk / peng_shop
//       · `음식라이프-…/콤비장면` **2시트가 아예 안 잘려 있었다** → duo_cook·serve·eat·menu·tea·popcorn
//       · 여름 흰배경 컷(`sm_*`)은 앱엔 있었지만 카드 풀엔 없었다
//    ⚠️ duo_n_beer(맥주)는 전체이용가 때문에 제외.
const COOK = /^(gom_(carrot|dough|eat|heartplate|nyam|pan|pasta|pot|shop|shop_walk|surprise)|peng_(nyam|shop)|pn_(cake|drink|fruit|icecream)|duo_(cart|cook|cooking|dessert|eat|menu|popcorn|serve|tea|n_cheers|rest|shop))/
// 🏖 여름 스킨 전용 — 수박·냉면·빙수를 12월 카드에 올리면 이상하니까 여름 카드에서만 뽑는다.
const SUMMER = /^(sm_|duo_(bingsu|naengmyeon|watermelon))/
const pickPool = (re, withSummer) => {
  const ok = (n) => COOK.test(n) || (withSummer && SUMMER.test(n))
  const hit = ENTRIES.filter((e) => re.test(e.name) && ok(e.name))
  return hit.length ? hit : ENTRIES.filter((e) => re.test(e.name))   // 없으면 전체로 폴백
}
// 📸 씬 풀 — **배경이 통째로 그려진 컷**(주방·마트·캠핑·야시장·노을 피크닉).
//    배경만 지우면 그림이 부서지고, 그대로 큰 히어로로 쓰면 "카드 속 카드"처럼 겉돈다.
//    그래서 **폴라로이드 카드의 사진 자리에만** 쓴다 — 거긴 원래 네모 사진 자리라
//    배경이 있는 게 오히려 자연스럽다(빈 그라데이션이던 자리가 채워진다).
//    ⚠️ 흰 테두리 두른 띠부씰 버전은 꾸미기 스티커용으로 따로 있다(docs `낱개-씬-띠부씰`).
const SCENES = Object.entries(import.meta.glob('../assets/scenepool/*.png', { eager: true, query: '?url', import: 'default' }))
  .map(([k, url]) => ({ name: k.split('/').pop(), url, scene: true }))

const GOM = pickPool(/^gom_/)
const PENG = pickPool(/^(peng_|pn_)/)
const DUO = pickPool(/^duo_/)
// 여름 스킨은 **여름 컷만** — 요리 컷이 섞이면 바다·물결 배경에 여름 느낌이 죽는다.
const summerOnly = (re) => {
  const hit = ENTRIES.filter((e) => re.test(e.name) && SUMMER.test(e.name))
  return hit.length ? hit : pickPool(re)
}
const S_GOM = summerOnly(/^(gom_|sm_gom_)/)
const S_PENG = summerOnly(/^(peng_|pn_|sm_peng_)/)
const S_DUO = summerOnly(/^(duo_|sm_duo_)/)

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
    ? ['warm', 'panel', 'pola', 'mag', 'summer', 'night', 'summer']
    : ['warm', 'panel', 'pola', 'mag', 'night', 'warm']
  const key = (() => {
    try { const v = new URLSearchParams(location.search).get('card'); if (v && SKINS[v]) return v } catch { /* noop */ }
    return rnd(pool)
  })()
  const skin = SKINS[key]
  // 밤·여름은 콤비도 잘 어울리고, 나머지는 솔로 위주(캐릭터가 크게 들어가서)
  // 여름 스킨만 여름 컷(수박·빙수·바비큐)까지 포함한 풀에서 뽑는다.
  const r = Math.random()
  const [g, p, d] = key === 'summer' ? [S_GOM, S_PENG, S_DUO] : [GOM, PENG, DUO]
  const cat = key === 'pola' && SCENES.length && r < 0.65 ? SCENES     // 폴라로이드는 씬 사진 위주
    : (key === 'night' || key === 'summer')
      ? (r < 0.5 ? g : r < 0.78 ? p : (d.length ? d : g))
      : (r < 0.68 ? g : (p.length ? p : g))
  return { skin, char: rnd(cat.length ? cat : ENTRIES), no: 2 + Math.floor(Math.random() * 46) }
}

const DIE = 'drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff) drop-shadow(0 16px 22px rgba(60,40,25,.26))'
// 🎴 카드 6종 — **색이 아니라 구조가 다르다**(창업자 "다 똑같이 할 거야?" 2026-07-29).
//    warm=좌상단 볼드타이포+blob · panel=위 컬러패널+센터제목 · pola=폴라로이드+마테
//    mag=매거진(EST·바코드) · summer=해·바다·물결 · night=수집카드 넘버링+홀로 창
const SKINS = {
  warm: { key: 'warm' }, panel: { key: 'panel' }, pola: { key: 'pola' },
  mag: { key: 'mag' }, summer: { key: 'summer' }, night: { key: 'night' },
}

// ── 1080×1350 카드 (캡처 대상) ──
//
// 📐 2026-07-19 시안(`docs/카드-시안-2507/`)의 문법. 규칙 = docs/카드-디자인시스템-정리-2026-07-29.md
//
//    ⭐ 이 시스템의 심장 = **아주 큰 타이포 + 큰 색면**. 제목 **120~150px**.
//       (예전 내 카드는 62~88px 이었고 그게 밋밋함의 주범이었다. 줄이지 말 것.)
//
//    ⚠️ 시안엔 레이아웃이 **3계열**이었다. 색만 바꾼 6장은 "다 똑같다"는 판정을 받았다
//       (창업자 2026-07-29). 그래서 6장은 **구조가 서로 다르다**:
//         ① 웜 blob(A)  ② 컬러 패널(B)  ③ 폴꾸(C)  ④ 매거진(C)  ⑤ 여름  ⑥ 홀로그램 밤
//
//    ⚠️ 요리 아이콘은 **넣지 않는다**(창업자 "음식 빼, 카드 이상해져").
//       시안은 캐릭터 그림 자체에 음식이 들어 있었지 따로 합성한 게 아니었다.

const PAD = 64
const GRAIN = 'radial-gradient(rgba(150,120,80,.06) 1px,transparent 1px)'
const STAR_D = 'M50 3 L61 13 L75 9 L79 24 L93 30 L88 45 L96 58 L84 66 L85 81 L70 82 L61 94 L50 86 L39 94 L30 82 L15 81 L16 66 L4 58 L12 45 L7 30 L21 24 L25 9 L39 13 Z'

// 제목 2줄 나누기 — 이 시스템은 2줄 볼드 타이포가 기본
// ⛔ **낱말 중간은 절대 자르지 않는다.** 예전엔 띄어쓰기가 없으면 글자 수를 반으로 잘랐는데,
//    창업자가 추가한 "교촌허니콤보"가 **"교촌허 / 니콤보"** 로 나왔다(2026-07-29 폰 제보).
//    한글은 어디가 낱말 경계인지 코드가 알 수 없다 → **띄어쓰기가 없으면 한 줄로 두고**,
//    대신 `headSize`가 칸 너비에 맞춰 글자를 줄인다.
function splitTitle(t) {
  const s = String(t || '오늘의 한 끼').trim()
  const sp = [...s.matchAll(/\s/g)].map((m) => m.index)
  if (!sp.length) return [s, '']                    // 띄어쓰기 없음 → 안 쪼갠다
  const mid = s.length / 2                          // 있으면 가장 균형 잡힌 곳에서
  const at = sp.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a))
  return [s.slice(0, at), s.slice(at + 1)]
}
// `lines` = **실제로 렌더되는 줄들.** 2줄 레이아웃은 `[l1, l2]`, 한 줄 레이아웃은 `['l1 l2']` 를 넘긴다.
// `avail` = 그 칸에서 쓸 수 있는 가로 px. 큰 타이포가 이 시스템의 심장이라 기본은 크게 두되,
//           **칸을 넘기면 그만큼 줄인다**(Jua 한글은 글자폭 ≈ 글자크기, letterSpacing -3 보정).
const headSize = (lines, base = 150, avail = 1080 - PAD * 2) => {
  const n = Math.max(1, ...lines.map((x) => String(x || '').length))
  const f = n <= 4 ? 1 : n <= 5 ? 0.92 : n <= 6 ? 0.8 : n <= 7 ? 0.7 : n <= 9 ? 0.59 : 0.5
  return Math.min(Math.round(base * f), Math.floor(avail / n) + 3)
}
function metaOf(recipe, tags) {
  const c = []
  if (recipe?.time) c.push(`${recipe.time}분`)
  if (recipe?.servings) c.push(`${recipe.servings}인분`)
  tags.forEach((t) => c.length < 3 && c.push(t))
  return c.slice(0, 3)
}
const die8 = (c) => `drop-shadow(3px 0 0 ${c}) drop-shadow(-3px 0 0 ${c}) drop-shadow(0 3px 0 ${c}) drop-shadow(0 -3px 0 ${c}) drop-shadow(3px 3px 0 ${c}) drop-shadow(-3px 3px 0 ${c}) drop-shadow(3px -3px 0 ${c}) drop-shadow(-3px -3px 0 ${c}) drop-shadow(0 22px 20px rgba(60,40,25,.34))`

function Card({ char, no, title, tags, cover, recipe, skin }) {
  const K = skin
  const [l1, l2] = splitTitle(title)
  const meta = metaOf(recipe, tags)
  const grain = <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '7px 7px', pointerEvents: 'none', zIndex: 2 }} />
  const brand = (col, extra) => <div style={{ position: 'absolute', top: PAD - 4, left: PAD, fontFamily: 'Jua, sans-serif', fontSize: 34, color: col, letterSpacing: 1, zIndex: 8, ...extra }}>한끼</div>
  const stamp = (col, top, bottom, extra) => (
    <div style={{ position: 'absolute', top: 70, right: PAD, width: 138, height: 138, transform: 'rotate(11deg)', zIndex: 9, ...extra }}>
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0 }}><path d={STAR_D} fill="none" stroke={col} strokeWidth="3.2" /></svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Jua, sans-serif', color: col, lineHeight: 1.05, textAlign: 'center' }}>
        <b style={{ fontSize: 30 }}>{top}</b><span style={{ fontSize: 18, letterSpacing: 3, marginTop: 3 }}>{bottom}</span>
      </div>
    </div>
  )
  const metabar = (col, sep) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'GowunDodum, sans-serif', fontSize: 30, color: col }}>
      {meta.map((m, i) => (<span key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>{i > 0 && <span style={{ width: 6, height: 6, borderRadius: 3, background: sep }} />}{m}</span>))}
    </div>
  )
  const chips = (ring, text) => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {meta.map((c, i) => <span key={i} style={{ padding: '11px 24px', borderRadius: 999, background: '#fffdf8', boxShadow: `0 8px 20px -12px rgba(120,80,50,.5), inset 0 0 0 2px ${ring}`, fontFamily: 'Jua, sans-serif', fontSize: 28, color: text }}>{c}</span>)}
    </div>
  )
  const foot = (wm, url) => (
    <div style={{ position: 'absolute', left: PAD, bottom: 52, zIndex: 8 }}>
      <div style={{ fontFamily: 'Jua, sans-serif', fontSize: 26, color: wm }}>한끼</div>
      <div style={{ marginTop: 6, fontSize: 19, color: url, fontFamily: 'GowunDodum, sans-serif' }}>Play스토어 ‘한끼’ 검색</div>
    </div>
  )
  const more = (col, sub) => !cover && (
    <div style={{ position: 'absolute', left: PAD, bottom: 148, zIndex: 8, fontFamily: 'Jua, sans-serif', fontSize: 34, color: col }}>
      레시피 보러가기
      <span style={{ display: 'block', fontFamily: 'GowunDodum, sans-serif', fontSize: 24, color: sub, fontWeight: 700, marginTop: 8 }}>한끼 앱에서 →</span>
    </div>
  )
  const hero = (st) => <img src={char.url} alt="" crossOrigin="anonymous" style={{ position: 'absolute', maxWidth: 'none', objectFit: 'contain', zIndex: 7, ...st }} />
  const shell = (bg, kids) => <div style={{ width: 1080, height: 1350, fontFamily: 'GowunDodum, sans-serif', position: 'relative', overflow: 'hidden', background: bg }}>{kids}</div>

  // ═══ ① 웜 blob — 좌상단 볼드 타이포 + 우하단 색 덩어리가 화면 밖으로 ═══
  if (K.key === 'warm') {
    const hs = headSize([l1, l2], 150, 1080 - PAD - 340)   // 좌상단 2줄(우측 340은 도장·blob 자리)
    return shell('#f4f0e8', <>
      {grain}
      <div style={{ position: 'absolute', left: -150, top: -150, width: 360, height: 360, borderRadius: '50%', border: '26px solid #efd9b0', opacity: 0.62 }} />
      <div style={{ position: 'absolute', right: -160, bottom: -160, width: 920, height: 920, borderRadius: '50%', background: 'radial-gradient(120% 120% at 34% 30%,#f2a074,#e6875a 55%,#d9724a)', boxShadow: '0 30px 60px -30px rgba(160,80,50,.5)' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundImage: 'radial-gradient(rgba(255,255,255,.14) 5px,transparent 6px)', backgroundSize: '60px 60px' }} />
      </div>
      {brand('#7a5a3f')}{stamp('#c47a58', '오늘의', '한 끼')}
      <div style={{ position: 'absolute', left: PAD, top: 150, right: 340, zIndex: 5 }}>
        <div style={{ fontFamily: 'Gaegu, sans-serif', fontWeight: 700, fontSize: 42, color: '#c47a58' }}>오늘도, 한 끼</div>
        <div style={{ marginTop: 2, fontFamily: 'Jua, sans-serif', fontSize: hs, lineHeight: 0.98, letterSpacing: -3, color: '#3a3128', wordBreak: 'keep-all' }}>
          {l1}{l2 && <><br /><span style={{ position: 'relative', display: 'inline-block', color: '#d9724a' }}>
            <span style={{ position: 'absolute', left: -4, right: -4, bottom: 6, height: 20, background: 'rgba(217,114,74,.22)', borderRadius: 6 }} />
            <span style={{ position: 'relative' }}>{l2}</span></span></>}
        </div>
        <div style={{ marginTop: 30 }}>{chips('rgba(216,150,110,.25)', '#8a5f3c')}</div>
      </div>
      {hero({ right: 2, bottom: 146, height: 600, filter: die8('#fffdf8') })}
      {more('#3a3128', '#c47a58')}{foot('#7a5a3f', '#a8916f')}
    </>)
  }

  // ═══ ② 컬러 패널 — 위 둥근 패널 안에 캐릭터, 아래는 가운데 정렬 ═══
  if (K.key === 'panel') {
    const hs = headSize([`${l1} ${l2}`.trim()], 128)   // 한 줄로 렌더된다
    return shell('#f6f1e6', <>
      {grain}
      <div style={{ position: 'absolute', left: PAD, top: 132, right: PAD, height: 660, borderRadius: 72, background: 'radial-gradient(120% 130% at 30% 22%,#8fd3b6,#5cbb94 58%,#48a17c)', boxShadow: '0 34px 64px -28px rgba(40,110,85,.5)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.16) 6px,transparent 7px)', backgroundSize: '72px 72px' }} />
        <div style={{ position: 'absolute', left: '50%', top: '-30%', width: 700, height: 700, marginLeft: -350, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,255,255,.3),transparent 62%)' }} />
      </div>
      {brand('#3f7a63')}
      {stamp('#ffffff', '오늘의', '한 끼', { top: 176, right: 104 })}
      {hero({ left: '50%', transform: 'translateX(-50%)', top: 214, height: 596, filter: die8('#fffdf8') })}
      <div style={{ position: 'absolute', left: PAD, right: PAD, top: 838, textAlign: 'center', zIndex: 8 }}>
        <div style={{ fontFamily: 'Gaegu, sans-serif', fontWeight: 700, fontSize: 40, color: '#4f9b7c' }}>따뜻한 집밥 한 그릇</div>
        <div style={{ marginTop: 6, fontFamily: 'Jua, sans-serif', fontSize: hs, lineHeight: 1.0, letterSpacing: -2, color: '#2f4a3f', wordBreak: 'keep-all' }}>
          {l1} {l2 && <span style={{ color: '#48a17c' }}>{l2}</span>}
        </div>
        <div style={{ marginTop: 26 }}>{metabar('#5f7d70', '#a8c8b8')}</div>
      </div>
      {more('#2f4a3f', '#4f9b7c')}{foot('#3f7a63', '#93ab9f')}
    </>)
  }

  // ═══ ③ 폴꾸 — 폴라로이드를 마테로 벽에 붙이고 손글씨 캡션 ═══
  if (K.key === 'pola') {
    const hs = headSize([`${l1} ${l2}`.trim()], 112)   // 한 줄
    const tape = (st) => <div style={{ position: 'absolute', width: 190, height: 52, background: 'rgba(226,196,168,.72)', boxShadow: '0 5px 12px rgba(90,55,70,.16)', zIndex: 9, ...st }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(255,255,255,.34),transparent 45%)' }} />
    </div>
    return shell('#f8eef0', <>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(190,150,160,.12) 1.5px,transparent 1.5px),linear-gradient(90deg,rgba(190,150,160,.12) 1.5px,transparent 1.5px)', backgroundSize: '58px 58px' }} />
      {grain}
      {brand('#9a5468')}
      <div style={{ position: 'absolute', left: 150, top: 150, width: 780, background: '#fffdf9', borderRadius: 10, padding: '34px 34px 0', boxShadow: '0 30px 56px -20px rgba(120,80,95,.4)', transform: 'rotate(-2deg)', zIndex: 6 }}>
        <div style={{ width: '100%', height: 620, borderRadius: 4, background: 'radial-gradient(circle at 50% 38%,#fdf7f4,#f2e6e6)', position: 'relative', overflow: 'hidden' }}>
          {/* 씬 컷은 사진처럼 칸을 꽉 채우고(cover), 다이컷 캐릭터는 바닥에 세운다. */}
          <img src={char.url} alt="" crossOrigin="anonymous" style={char.scene
            ? { position: 'absolute', inset: 0, width: '100%', height: '100%', maxWidth: 'none', objectFit: 'cover' }
            : { position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)', height: '96%', maxWidth: 'none', objectFit: 'contain' }} />
        </div>
        {/* 캡션은 짧은 손글씨로 고정 — 아래 큰 제목과 같은 말이 두 번 나오면 지저분하다. */}
        <div style={{ fontFamily: 'Gaegu, sans-serif', fontWeight: 700, fontSize: 46, color: '#9a5468', textAlign: 'center', padding: '20px 0 26px', transform: 'rotate(-.8deg)', whiteSpace: 'nowrap' }}>오늘도 한 끼, 해냈다</div>
      </div>
      {tape({ left: 214, top: 128, transform: 'rotate(-9deg)' })}
      {tape({ right: 176, top: 136, transform: 'rotate(7deg)', background: 'rgba(232,182,190,.7)' })}
      <div style={{ position: 'absolute', left: PAD, right: PAD, top: 990, textAlign: 'center', zIndex: 8 }}>
        <div style={{ fontFamily: 'Jua, sans-serif', fontSize: hs, lineHeight: 1.0, letterSpacing: -2, color: '#4a3038', wordBreak: 'keep-all' }}>
          {l1} {l2 && <span style={{ color: '#c4708a' }}>{l2}</span>}
        </div>
        <div style={{ marginTop: 20 }}>{metabar('#8a6270', '#dcb6c0')}</div>
      </div>
      {more('#4a3038', '#c4708a')}{foot('#9a5468', '#bb96a2')}
    </>)
  }

  // ═══ ④ 매거진 — EST 2026 · MARKET ISSUE · 바코드 ═══
  if (K.key === 'mag') {
    const hs = headSize([`${l1} ${l2}`.trim()], 116)   // 한 줄
    return shell('#eef1ea', <>
      {grain}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 78, textAlign: 'center', zIndex: 6 }}>
        <div style={{ fontSize: 24, letterSpacing: 6, color: '#7e8b74' }}>EST. 2026 · 오늘도 한 끼</div>
        <div style={{ fontFamily: 'Jua, sans-serif', fontSize: 132, letterSpacing: 8, color: '#33422e', lineHeight: 1.02, marginTop: 4 }}>한끼</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 10, fontSize: 21, letterSpacing: 3, color: '#6f7d66' }}>
          <span>TODAY’S ISSUE</span><span style={{ width: 42, height: 1, background: '#9aa891' }} /><span>vol.{String(no).padStart(2, '0')}</span><span style={{ width: 42, height: 1, background: '#9aa891' }} /><span>오늘의 한 끼</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: '50%', top: 386, width: 640, height: 640, marginLeft: -320, borderRadius: '50%', background: 'radial-gradient(120% 120% at 32% 26%,#cfe0c4,#b6cfa8 58%,#a3c194)', boxShadow: '0 30px 60px -30px rgba(70,100,55,.45)' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundImage: 'radial-gradient(rgba(255,255,255,.18) 5px,transparent 6px)', backgroundSize: '58px 58px' }} />
      </div>
      <div style={{ position: 'absolute', left: PAD, top: 470, width: 210, fontSize: 25, lineHeight: 1.5, color: '#5d6b55', zIndex: 8 }}>제철 재료<b style={{ display: 'block', fontFamily: 'Jua, sans-serif', fontSize: 33, color: '#33422e' }}>200% 활용법</b></div>
      <div style={{ position: 'absolute', right: PAD, top: 470, width: 210, textAlign: 'right', fontSize: 25, lineHeight: 1.5, color: '#5d6b55', zIndex: 8 }}>냉장고 털어<b style={{ display: 'block', fontFamily: 'Jua, sans-serif', fontSize: 33, color: '#33422e' }}>15분 집밥</b></div>
      {hero({ left: '50%', transform: 'translateX(-50%)', top: 428, height: 560, filter: die8('#fffdf8') })}
      <div style={{ position: 'absolute', left: PAD, right: PAD, top: 1020, textAlign: 'center', zIndex: 8 }}>
        <div style={{ fontFamily: 'Jua, sans-serif', fontSize: hs, lineHeight: 1.0, letterSpacing: -2, color: '#2c3a27', wordBreak: 'keep-all' }}>
          {l1} {l2 && <span style={{ color: '#6f9a58' }}>{l2}</span>}
        </div>
        <div style={{ marginTop: 16, fontSize: 26, color: '#67775e' }}>{meta.join('   ·   ')}</div>
      </div>
      <div style={{ position: 'absolute', right: PAD, bottom: 56, textAlign: 'right', zIndex: 8 }}>
        <div style={{ display: 'flex', gap: 3, justifyContent: 'flex-end' }}>
          {[3, 1, 2, 1, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3].map((w, i) => <span key={i} style={{ width: w, height: 46, background: '#33422e' }} />)}
        </div>
        <div style={{ marginTop: 8, fontSize: 19, letterSpacing: 2, color: '#7e8b74' }}>한끼 no.{String(no).padStart(2, '0')}</div>
      </div>
      {foot('#4d5c45', '#8b9a82')}
    </>)
  }

  // ═══ ⑤ 여름 한정 — 해·바다·물결. 6~8월에만 등장 ═══
  if (K.key === 'summer') {
    const hs = headSize([l1, l2], 138, 1080 - PAD - 330)   // 좌상단 2줄
    return shell('linear-gradient(168deg,#e8f5f6,#cfeaf1 56%,#dcf0e9)', <>
      <div style={{ position: 'absolute', right: -78, top: -86, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%,rgba(255,246,196,.98),rgba(255,232,148,.5) 44%,transparent 70%)' }} />
      {/* 물결은 캐릭터 발밑에서 끝나야 한다 — 높으면 캐릭터가 물에 잠긴 것처럼 보인다. */}
      <svg viewBox="0 0 1080 460" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 390, zIndex: 1 }}>
        <path d="M0 190 C170 140 280 230 440 208 C620 184 720 112 920 156 C1000 174 1046 184 1080 176 L1080 460 L0 460Z" fill="#8ad8de" opacity=".45" />
        <path d="M0 262 C190 216 310 296 490 278 C690 258 790 202 990 236 C1036 246 1062 250 1080 246 L1080 460 L0 460Z" fill="#4fb6cb" opacity=".55" />
        <path d="M0 340 C210 306 330 368 530 354 C730 340 830 306 1080 332 L1080 460 L0 460Z" fill="#ffffff" opacity=".5" />
      </svg>
      {grain}
      {brand('#2b7f8c')}
      <div style={{ position: 'absolute', top: 74, right: PAD, transform: 'rotate(8deg)', fontFamily: 'Jua, sans-serif', fontSize: 31, color: '#fff', background: 'linear-gradient(180deg,#ff9fae,#ff7f92)', padding: '13px 28px', borderRadius: 18, boxShadow: '0 10px 18px -6px rgba(220,90,110,.6), inset 0 2px 0 rgba(255,255,255,.4)', zIndex: 9 }}>여름 한정</div>
      <div style={{ position: 'absolute', left: PAD, top: 176, right: 330, zIndex: 6 }}>
        <div style={{ fontFamily: 'Gaegu, sans-serif', fontWeight: 700, fontSize: 44, color: '#2f96a6' }}>시원하게, 여름 한 끼</div>
        <div style={{ marginTop: 4, fontFamily: 'Jua, sans-serif', fontSize: hs, lineHeight: 0.99, letterSpacing: -3, color: '#12404d', wordBreak: 'keep-all' }}>
          {l1}{l2 && <><br /><span style={{ position: 'relative', display: 'inline-block', color: '#2f96a6' }}>
            <span style={{ position: 'absolute', left: -4, right: -4, bottom: 6, height: 18, background: 'rgba(47,150,166,.2)', borderRadius: 6 }} />
            <span style={{ position: 'relative' }}>{l2}</span></span></>}
        </div>
        <div style={{ marginTop: 28 }}>{chips('rgba(110,190,205,.32)', '#2b7f8c')}</div>
      </div>
      {hero({ right: 20, bottom: 232, height: 560, filter: die8('#ffffff') })}
      {more('#12404d', '#2f96a6')}{foot('#1d6472', '#2b7f8c')}
    </>)
  }

  // ═══ ⑥ 홀로그램 밤 — 수집카드. 큰 넘버링 + 홀로 창 ═══
  const hs = headSize([`${l1} ${l2}`.trim()], 124)   // 한 줄
  return shell('radial-gradient(circle at 26% 16%,#343c52,#262b3b 60%,#1c2029)', <>
    <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
      {[[120, 236, 5], [306, 172, 3], [872, 202, 4], [718, 116, 3], [176, 452, 3], [986, 372, 4], [430, 288, 3], [92, 640, 3], [960, 700, 4]].map((s, i) => (
        <div key={i} style={{ position: 'absolute', left: s[0], top: s[1], width: s[2] * 2, height: s[2] * 2, borderRadius: '50%', background: '#fff6d8', opacity: 0.8, boxShadow: `0 0 ${s[2] * 5}px rgba(255,240,190,.9)` }} />
      ))}
    </div>
    <div style={{ position: 'absolute', inset: 14, borderRadius: 34, border: '2px solid rgba(255,222,150,.42)', zIndex: 3, pointerEvents: 'none' }} />
    {brand('#f0e4d0')}
    <div style={{ position: 'absolute', top: 62, right: PAD, textAlign: 'right', zIndex: 9 }}>
      <div style={{ fontFamily: 'Jua, sans-serif', fontSize: 74, lineHeight: 0.9, color: '#ffd98a', letterSpacing: -2 }}>No.{String(no).padStart(2, '0')}</div>
      <div style={{ fontSize: 20, letterSpacing: 6, color: 'rgba(255,222,150,.8)', marginTop: 4 }}>HOLO RARE</div>
    </div>
    {/* ⚠️ 홀로 원판은 캐릭터보다 커야 한다 — 작으면 발이 테두리를 밟아 어색하다(2026-07-29 수정). */}
    <div style={{ position: 'absolute', left: '50%', top: 238, width: 664, height: 664, marginLeft: -332, borderRadius: '50%', background: 'conic-gradient(from 20deg,#ff9aa2,#ffdac1,#e2f0cb,#b5ead7,#c7ceea,#f7c6ff,#ffabe0,#ff9aa2)', opacity: 0.62, filter: 'blur(4px)', zIndex: 2 }} />
    <div style={{ position: 'absolute', left: '50%', top: 274, width: 592, height: 592, marginLeft: -296, borderRadius: '50%', background: 'radial-gradient(circle at 40% 34%,rgba(255,252,240,.14),rgba(24,28,38,.6) 72%)', border: '4px solid rgba(255,226,160,.7)', boxShadow: 'inset 0 4px 0 rgba(255,255,255,.14)', zIndex: 3 }} />
    {hero({ left: '50%', transform: 'translateX(-50%)', top: 336, height: 496, filter: die8('#fffdf8') })}
    <div style={{ position: 'absolute', left: PAD, right: PAD, top: 918, textAlign: 'center', zIndex: 8 }}>
      <div style={{ fontFamily: 'Gaegu, sans-serif', fontWeight: 700, fontSize: 38, color: '#ffcf8a' }}>오늘 밤은, 이걸로</div>
      <div style={{ marginTop: 4, fontFamily: 'Jua, sans-serif', fontSize: hs, lineHeight: 1.0, letterSpacing: -2, wordBreak: 'keep-all', background: 'linear-gradient(90deg,#ffd98a,#ffb0c4,#c7b3f0)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
        {l1} {l2}
      </div>
      <div style={{ marginTop: 22 }}>{metabar('#cbbfa8', 'rgba(255,222,150,.55)')}</div>
    </div>
    {more('#f0e4d0', '#ffcf8a')}{foot('#e8dcc9', '#a99d88')}
  </>)
}

// ── 2장째: 실제 레시피카드 (재료·만드는 법) — 친구가 진짜 해먹을 수 있게 ──
// export: 꾸민 표지 공유(shareDecoratedCover)에서도 이 레시피카드를 2장째로 함께 보낸다.
export function RecipeCard({ recipe }) {
  const title = recipe?.title || '오늘의 한 끼'
  const ings = (recipe?.ingredients || []).filter(Boolean)
  const steps = (recipe?.steps || []).filter(Boolean)
  // ⛔ 시계 이모지를 붙이지 않는다 — '분'이 이미 시간이라는 뜻이고, 이 글자는 **공유 이미지에 그대로 박힌다.**
  const meta = [recipe?.time && `${recipe.time}분`, recipe?.servings && `${recipe.servings}인분`, recipe?.difficulty].filter(Boolean)
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
  const [draw, setDraw] = useState(drawState)
  // busy = null 이거나 '지금 뭘 만들고 있는지' 한 줄. 문자열도 참이라 disabled·opacity 판정은 그대로 돈다.
  // ⚠️ 예전엔 버튼 글자만 '만드는 중…'으로 바뀌어서, 캡처가 오래 걸리면 먹통처럼 보였다
  //    (창업자 제보 2026-07-30 "레꾸자랑 공유하기 만들때 기다려달라는 멘트 안 떠").
  //    레꾸자랑의 '꾸민 표지' 경로엔 전체 오버레이가 있었는데 이 랜덤 카드 경로엔 없었다.
  const [busy, setBusy] = useState(null)
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
    setBusy(hasRecipe ? '카드 + 레시피 2장 준비 중이에요' : '카드를 그리고 있어요')
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
    setBusy(null)
  }, [busy, title, hasRecipe])

  // 🖼 이 카드를 레시피 표지로 저장 — CTA 없는 cover 카드를 이미지로 캡처해 부모(레시피 화면)에 넘긴다.
  const saveCover = useCallback(async () => {
    if (!coverRef.current || busy) return
    setBusy('레시피 표지로 저장하는 중이에요')
    try {
      const opt = { pixelRatio: 1.5, quality: 0.86, cacheBust: true, backgroundColor: '#ffffff' }
      // 폰트 임베드 단계에서 외부 stylesheet fetch가 막히면(드묾) skipFonts로 폴백 — 표지 저장이 끊기지 않게.
      let url
      try { url = await toJpeg(coverRef.current, opt) } catch { url = await toJpeg(coverRef.current, { ...opt, skipFonts: true }) }
      await onSaveCover?.(url)
      onClose?.()
    } catch (e) { /* noop */ }
    setBusy(null)
  }, [busy, onSaveCover, onClose])

  const layer = { position: 'absolute', top: 0, left: 0 }
  const tabBtn = (on) => ({ padding: '7px 18px', borderRadius: 999, fontSize: 13.5, fontWeight: 800, border: 'none', background: on ? '#fffdf8' : 'rgba(255,255,255,.22)', color: on ? '#5d3410' : '#fff' })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(40,32,24,.72)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      {/* 만드는 중 로딩 오버레이 — 레꾸자랑 '꾸민 표지' 경로와 같은 모양·같은 문구 톤.
          캡처(카드+레시피 2장)에 몇 초 걸려도 먹통처럼 안 보이게. 이 모달 위(zIndex 310)에 덮는다. */}
      {busy && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'fixed', inset: 0, zIndex: 310, background: 'rgba(30,26,22,.62)', backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}
        >
          <div className="ocr-spin" />
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>예쁜 카드 만드는 중…</div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 12.5 }}>{busy}</div>
          <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 11.5 }}>잠깐만 기다려 주세요</div>
        </div>
      )}
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* 미리보기(스케일). 두 장 다 렌더(캡처용) — 안 보는 장은 opacity 0(랩퍼에만). 캡처 ref는 원본 카드에. */}
        <div style={{ width: 1080 * scale, height: 1350 * scale, position: 'relative', borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,.4)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <div style={{ ...layer, opacity: page === 1 ? 1 : 0 }}><div ref={cardRef}><Card {...draw} title={title} tags={tags} recipe={recipe} /></div></div>
            <div style={{ ...layer, opacity: page === 2 ? 1 : 0 }}><div ref={card2Ref}><RecipeCard recipe={recipe} /></div></div>
            {/* 표지 저장용 숨은 카드(CTA 없음). 화면엔 안 보이고 캡처만. */}
            <div style={{ ...layer, opacity: 0, pointerEvents: 'none' }}><div ref={coverRef}><Card {...draw} title={title} tags={tags} recipe={recipe} cover /></div></div>
          </div>
        </div>
        {/* 페이지 토글 (레시피 있을 때만 2장) */}
        {hasRecipe && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="press" onClick={() => setPage(1)} style={tabBtn(page === 1)}>① 카드</button>
            <button className="press" onClick={() => setPage(2)} style={tabBtn(page === 2)}>② 레시피</button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 12.5, color: 'rgba(255,255,255,.82)', marginTop: 9 }}>
          {hasRecipe
            ? <>공유하면 2장(카드+레시피)이 함께 가요<img src={uiDuoHi} alt="" draggable={false} style={{ width: 24, height: 24, objectFit: 'contain' }} /></>
            : <><Icon name="refresh" size={14} stroke={2} />다시 뽑기로 마음에 들 때까지</>}
        </div>
        {/* 버튼 */}
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button className="press" onClick={redraw} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '13px 22px', borderRadius: 999, background: '#fffdf8', color: '#5d3410', fontWeight: 800, fontSize: 15.5, border: 'none' }}><Icon name="refresh" size={17} stroke={2.2} />다시 뽑기</button>
          <button className="press" onClick={share} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '13px 26px', borderRadius: 999, background: '#5d3410', color: '#fffdf8', fontWeight: 800, fontSize: 15.5, border: 'none', opacity: busy ? 0.6 : 1 }}>{busy ? '만드는 중…' : <><Icon name="share" size={17} stroke={2.2} />공유하기</>}</button>
        </div>
        {onSaveCover && (
          <button className="press" onClick={saveCover} disabled={busy} style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 999, background: 'rgba(255,255,255,.14)', color: '#fffdf8', fontWeight: 700, fontSize: 13.5, border: '1px solid rgba(255,255,255,.34)', opacity: busy ? 0.6 : 1 }}><Icon name="photo" size={15} stroke={2} />이 카드를 내 레시피 표지로</button>
        )}
        <button className="press" onClick={onClose} style={{ marginTop: 12, padding: '8px 18px', background: 'transparent', color: 'rgba(255,255,255,.8)', fontSize: 14, fontWeight: 700, border: 'none' }}>닫기</button>
      </div>
    </div>
  )
}
