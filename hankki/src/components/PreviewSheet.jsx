import { useMemo } from 'react'
import Portal from './Portal'
import Icon from './Icon'
import { useModalBack } from '../useBackHandler'
import { whatsNew, unitOf, foldPacks } from '../data/whatsnew'
import { StickerArt } from './Stickers'

// 📣 한끼 소식 — «방금 열렸어요» · «곧 열려요» · «그다음엔».
//
// ⭐⭐ 2026-08-03 창업자: *"새로 열릴때 꼭 안내페이지에 올라오도록 해."*
//   우리 업데이트는 **날짜가 저절로 연다**(주간 레시피·꾸미기·카드 전부 `from`).
//   배포도 푸시도 없다 — 그래서 9/1 에 꾸미기 45컷이 열려도 **앱이 한마디도 안 했다.**
//   위 두 절은 `data/whatsnew.js` 가 **날짜 게이트와 «같은 데이터»** 를 읽어 만든다.
//   ⛔ 여기에 손으로 적지 말 것 — 손으로 적은 목록은 반드시 낡는다(이 파일이 그 증거였다).
//
// 업데이트 예고 — '준비 중인 기능'을 보여줘 기대감을 준다.
// 정직 원칙: 없는 걸 '됩니다'라 하지 않고 '준비 중/곧'으로만 안내.
// 아이콘은 이모지 대신 커스텀 라인아이콘(브랜드 통일).
// 'AI가 사진→레시피'는 이제 실제 동작(가져오기의 캡처 OCR·링크 읽기) → 예고 목록에서 뺐다.
// ⛔ 유저가 모르는 말을 쓰지 않는다 — 창업자가 "도장·컨페티·내 사진 프레임은 뭐야?"라고
//    물었다(2026-07-30). 만든 사람이 모르면 유저는 100% 모른다 → 기대감이 안 생긴다.
//    셋 다 코드·자산이 0인 아이디어였는데 '준비 중'을 달고 있어 과장이기도 했다.
//    → `docs/_아껴둠/`으로 옮기고 목록에서 뺐다.
// ⛔ 주기를 약속하지 않는다 — '계절마다'·'매달' 둘 다 한 번 못 지키면 신뢰가 깨진다.
//    '주부의 장바구니'와 같은 방식으로 "계속 늘어나요"만 말한다(태그 '계속'과 같은 톤).
//    실제 운영은 매달 드립(재고 300컷+) — 그건 로드맵 문서에만 적고 UI엔 약속하지 않는다.
// ⚠️ '새 꾸미기팩' 줄은 뺐다 — 이제 «곧 열려요»가 **언제 몇 컷인지 콕 집어** 말한다.
//    두 군데서 같은 얘기를 하면 아래 것이 겉돌고, 오히려 두루뭉술해 보인다.
// ⚠️⚠️ [2026-08-29] '주부의 장바구니 확장' 줄도 **같은 이유로** 뺐다.
//    📮 창업자가 폰 캡처로 잡았다 = *"젤 아래 주부의장바구니 확장은 겹치지않아?"*
//    ⭐ v11.83 부터 «방금 열렸어요»가 「새로 담은 살림템 3」 ＋ **제품 이름 셋까지** 콕 집어 말한다.
//       그런데 아래에서 「계속 채워가요」로 또 말하니 두루뭉술한 쪽이 겉돈다 — 위 꾸미기팩과 판박이다.
//    ⭐ 게다가 **아이콘이 둘 다 `cart`** 라 한 화면에 같은 그림이 두 번 떴다.
//    📌 이 칸의 일 = 「아직 «없는» 것」을 예고하는 것. 장바구니는 이제 **매주 실제로 열린다** —
//       예고가 아니라 «하고 있는 일»이라 여기 있을 자리가 아니다.
//       「계속 늘어나요」는 말로 하는 것보다 **매주 3개씩 뜨는 게 훨씬 세다.**
const UPCOMING = [
  { icon: 'book', title: '내 레시피북, PDF로 소장', desc: '꾸민 표지 그대로 예쁜 책 한 권.', tag: '나중에' },
  { icon: 'chat', title: '내 꾸민 레시피 자랑', desc: '취향 비슷한 사람들과 구경하고 나눠요.', tag: '나중에' },
]

// 종류마다 아이콘 하나 — 글자를 안 읽어도 «뭐가 늘었는지»가 보인다.
// ⚠️ 우리 세트에 없는 이름을 쓰면 아무것도 안 그려진다 → 전체 목록 = `Icon.jsx`.
const KIND_ICON = { '이번 주 레시피': 'diary', '꾸미기': 'palette', '레꾸자랑 카드': 'star', '장바구니': 'cart' }

// 🖼 미리보기 한 줄 — ⭐**글자만 있으면 광고가 안 된다** (창업자 2026-08-03 *"가을 이모지팩도 광고해야하지 않아?"*).
//    ⛔ `StickerArt` 는 우리 그림을 그린다(유니코드 이모지 아님).
export function Peek({ keys = [], size = 46 }) {
  if (!keys.length) return null
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
      {keys.map((k) => (
        <span key={k} style={{
          width: size, height: size, borderRadius: 11, background: 'var(--surface)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
          <span style={{ width: size - 10, height: size - 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <StickerArt id={k} style={{ maxWidth: '100%', maxHeight: '100%' }} />
          </span>
        </span>
      ))}
    </div>
  )
}

function NewsRow({ it, tone }) {
  // 🎁 선물이면 «선물»이라고 말하고 컷을 전부 편다 (창업자 2026-08-30
  //    *"가을의정원접시세트도 특별한 선물로 한 줄적어줘. 안내판에 그달 주는 선물 이미지가 다들어가면 좋겠는데..."*)
  //    ⛔ 아이콘도 갈아 끼운다 — 나머지와 같은 팔레트 아이콘이면 목록에 묻힌다.
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--cream)', borderRadius: 14, padding: '12px 13px' }}>
      <span style={{ flex: '0 0 auto', width: 26, display: 'inline-flex', justifyContent: 'center', paddingTop: 1 }}>
        <Icon name={it.gift ? 'gift' : (KIND_ICON[it.kind] || 'sparkle')} size={22} color={tone} stroke={1.7} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 16.5, fontWeight: 800 }}>{it.title}</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: tone, background: 'var(--surface)', borderRadius: 999, padding: '2px 8px' }}>
            {/* 🔢 단위 = 「종」 (창업자 2026-08-30 *"다른 것들도 숫자 옆에 종을 붙여줘"*) */}
            {it.gift ? it.giftLabel : it.kind} {it.count}{unitOf(it.kind)}
          </span>
        </div>
        {it.why && <div className="t-sub" style={{ fontSize: 15.5, marginTop: 3, lineHeight: 1.4 }}>{it.why}</div>}
        {/* 💬 쓰는 법 = 서랍의 `hint` 를 그대로 (창업자 2026-08-30 *"접시 사용법도 아래 적어줘"*) */}
        {it.gift && it.hint && <div className="t-sub" style={{ fontSize: 15.5, marginTop: 3, lineHeight: 1.4 }}>{it.hint}</div>}
        <Peek keys={it.gift ? it.giftKeys : it.peek} />
      </div>
    </div>
  )
}

export default function PreviewSheet({ onClose }) {
  useModalBack(onClose) // 뒤로가기 → 닫기
  // ⚠️ 시트를 여는 순간 한 번만 센다 — 열어둔 채 숫자가 흔들리면 안 된다.
  const news = useMemo(() => whatsNew(), [])
  // 📦 팩 줄은 «갈래마다 한 줄»로 접는다 — 안 접으면 9/1 에 열 줄이 깔려
  //    맨 아래 장바구니가 파묻힌다(창업자 2026-08-31 *"너무 길어서(가을팩안내땜에)"*).
  //    ⛔ 「곧 열려요」도 같이 접는다 — 하루 전엔 그 열 줄이 «거기»에 서 있다(8/31 실측 1113px).
  const opened = useMemo(() => foldPacks(news.opened), [news])
  const soon = useMemo(() => (news.upcoming ? foldPacks(news.upcoming.items) : []), [news])
  const hasNews = news.opened.length > 0 || !!news.upcoming
  const dday = news.upcoming
    ? (news.upcoming.dday === 0 ? '오늘' : news.upcoming.dday === 1 ? '내일' : `${news.upcoming.dday}일 뒤`)
    : ''
  return (
    <Portal>
      <div className="sheet-mask" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'calc(18px + var(--safe-bottom))', maxHeight: 'calc(100dvh - 40px)' }}>
          <div className="emoji-sheet-head">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><Icon name="gift" size={19} color="var(--tease-ic)" stroke={1.7} /> 한끼 소식</span>
            <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 16, fontWeight: 600 }}>닫기</button>
          </div>
          <div style={{ padding: '2px 16px 0' }}>

            {/* 📱📱 «패드·폴드에서도 써요» (창업자 2026-08-13 *"우리앱 패드에서도 되는 것도 안내해야해"* ·
                    자리를 물으니 *"실사용자들이알아야지."* → **스토어가 아니라 앱 안**이다)
                ⭐ 왜 「한끼 소식」인가 = 이 시트는 **이미 깐 사람**이 보는 자리다. 스토어 설명·스크린샷은
                   «설치를 고르는 사람»이 보는 것이라 실사용자에겐 안 닿는다.
                   ⛔ 온보딩에도 안 넣었다 — 처음 켤 때 한 번이라 **이미 깐 사람은 영영 못 본다.**
                ⭐ 그리고 이건 진짜 «새 소식»이다 — 가로·큰 화면은 2026-08-09 v10.07~10.08 에 열었고
                   (`vite.config.js` 웹 매니페스트 ＋ `android/twa-manifest.json` **두 곳**의 세로 잠금을 풀었다)
                   유저는 그게 열린 걸 모른다.
                ⛔ 「곧」이 아니라 «지금 된다» — 없는 걸 된다고도, 되는 걸 안 된다고도 안 한다(이 파일 정직 원칙).
                ⚠️ 폰의 「자동 회전」이 꺼져 있으면 안 돌아간다 — 기기 설정이라 앱이 못 바꾼다. 그래서 한 줄 덧붙였다. */}
            <div style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              background: 'var(--cream)', borderRadius: 14, padding: '11px 13px', marginBottom: 14,
            }}>
              {/* ⛔ 처음엔 `phone` 을 썼는데 **우리 아이콘 목록에 없는 이름**이라 빈 칸이 될 뻔했다
                  (`Icon.jsx` 를 세어 보고 잡았다 · 규칙 18 — 있는 줄 알고 쓰지 말 것).
                  ⭐ `bulb` 가 오히려 맞다 — 이건 새 기능 광고가 아니라 «알려주는 팁»이다. */}
              <Icon name="bulb" size={18} color="var(--brown)" stroke={1.9} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16.5, fontWeight: 800, marginBottom: 3 }}>패드·폴드에서도 써요</div>
                <div className="t-sub" style={{ fontSize: 15, lineHeight: 1.55 }}>
                  큰 화면에선 레시피가 좌우 두 칸으로 열리고, 일기 종이도 더 커져요.
                  폰을 눕혀도 돼요 — 안 돌아가면 폰의 <b>자동 회전</b>을 켜 보세요.
                </div>
              </div>
            </div>

            {/* 🎁 방금 열렸어요 — ⛔ 없으면 이 절을 통째로 안 그린다(빈 자리 금지) */}
            {news.opened.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '2px 0 9px' }}>
                  <Icon name="sparkle" size={16} color="var(--brown)" stroke={2} />
                  <span style={{ fontSize: 16.5, fontWeight: 900, color: 'var(--brown)' }}>방금 열렸어요</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {opened.map((it, i) => <NewsRow key={`o${i}`} it={it} tone="var(--brown)" />)}
                </div>
              </>
            )}

            {/* ⏳ 곧 열려요 — 다음 «한 날짜»만. 3개월치를 늘어놓으면 기대가 아니라 목록이 된다 */}
            {news.upcoming && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: news.opened.length ? '18px 0 9px' : '2px 0 9px' }}>
                  <Icon name="clock" size={16} color="var(--tease-ic)" stroke={2} />
                  <span style={{ fontSize: 16.5, fontWeight: 900, color: 'var(--tease-ic)' }}>곧 열려요</span>
                  <span className="t-sub" style={{ fontSize: 15, marginLeft: 'auto', fontWeight: 700 }}>{dday}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {soon.map((it, i) => <NewsRow key={`u${i}`} it={it} tone="var(--tease-ic)" />)}
                </div>
              </>
            )}

            <p className="t-sub" style={{ fontSize: 16, margin: hasNews ? '20px 0 12px' : '0 0 14px', lineHeight: 1.55 }}>
              {hasNews
                ? '그다음엔 이런 걸 준비하고 있어요.'
                : <>한끼가 이런 걸 준비하고 있어요.<br />준비되면 가장 먼저 보여드릴게요 :)</>}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {UPCOMING.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--cream)', borderRadius: 14, padding: '12px 13px' }}>
                  <span style={{ flex: '0 0 auto', width: 26, display: 'inline-flex', justifyContent: 'center', paddingTop: 1 }}><Icon name={f.icon} size={22} color="var(--tease-ic)" stroke={1.7} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 16.5, fontWeight: 800 }}>{f.title}</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--brown)', background: 'var(--surface)', borderRadius: 999, padding: '2px 8px' }}>{f.tag}</span>
                    </div>
                    <div className="t-sub" style={{ fontSize: 15.5, marginTop: 3, lineHeight: 1.4 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="t-sub" style={{ fontSize: 15, textAlign: 'center', margin: '14px 0 2px', color: 'var(--sand)' }}>
              지금 쌓아둔 레시피는 새 기능이 나와도 그대로 이어져요.
            </p>
          </div>
        </div>
      </div>
    </Portal>
  )
}
