import { useState } from 'react'
import Portal from './Portal'
import GoogleButton from './GoogleButton'
import AppleButton from './AppleButton'          // 🍎 아이폰 앱 안에서만 보이는 둘째 단추(큰 틀 4)
import { 앱안인가 } from '../nativeAuth'
import { useModalBack } from '../useBackHandler'
import { 로그인 } from '../cloud'
import { 무료열쇠상한, KEY_NAME, KEY_UNIT } from '../ocr'
import { COACH } from '../coach'
import duoHi from '../assets/sharepool/duo_hi.png'

// ☁️📣 로그인 안내 팝업 — «이미 쓰고 있던 사람»에게 딱 한 번.
//
// 📮 창업자 2026-09-06 = *"그럼 로그인 안내부터 하자 ㄱㄱ"* → *"안내 팝업이 낫지않을까??"*
//    → *"근데 로그인안하면 사라지는거 맞지 않아??"* · *"로그인을 해야 남는거잖아."* → 문구 확정(아래 그대로)
//
// ⭐⭐ 왜 있나 = 9/4 실물 = 월간 활성 27 · 로그인 6(실제 4). **23명이 로그인 없이 쓴다.**
//    9/5 창업자 정정 = 로그인은 «두 대 쓰는 사람 기능»이 아니라 **「데이터를 지키는」 기능**이다
//    (이유 셋 = 날아가는 것 막기 · 열쇠 10→30 · 동기화). 그런데 화면 셋(첫 화면·홈 한 줄·설정 카드)이
//    **전부 「새 폰에서도 이어서 써요」 하나만** 말하고 있었다. 안 하는 게 당연했다.
//    ＋ 홈 한 줄은 «닫으면 영영 안 뜬다»(nudges.js K_CLOUDHOME) — 쓰던 사람 대부분은 이미 닫았다.
//
// ⛔ 리텐션 원칙(재촉 금지)을 지키는 선
//    · **한 번만** — 어떻게 닫아도 «봤음»(뒤로가기 포함 · NewsPopup 과 같은 방식)
//    · **잃을 게 있는 사람만** — 로그인 안 함 ＋ 내 레시피 1편 이상(갓 깐 사람은 안 본다 · 백업 줄과 같은 잣대)
//    · **다른 팝업과 안 겹친다** — 소식 팝업·온보딩·코치마크가 뜨는 날은 다음에(HomeScreen 에서 가른다)
//    · 「사라져요」는 겁주기가 아니라 **사실**이다(창업자 *"로그인을 해야 남는거잖아"*) — 사실 ＋ 다음 행동.
//
// ⛔ 숫자를 «글자로» 박지 않는다 — 열쇠 상한은 `무료열쇠상한()`(서버 값 우선) · 편수는 홈이 세서 준다.
// ⛔ 유니코드 이모지 금지 — 첫 화면과 같은 곰펭 그림(`duo_hi.png`)을 쓴다.
// 🔒 `_repro-로그인안내팝업-0906.mjs` 가 「뜨는 조건 · 한 번만 · 문구」를 잰다.

// ⛔⛔ 열쇠는 `COACH` 목록(`hankki:coach:loginpop`)에 둔다 — 검사판이 접두어(SEED_COACH_SEEN · 295판)로도
//    이름(Object.values(COACH) · 15판)으로도 이 팝업을 «본 상태»로 열기 때문이다.
//    `hankki:nudge:` 아래 두었더니 2026-09-06 스모크에서 재현판 4개를, 접두어만 빌렸더니 1개(아이콘갈아끼우기)를 이 팝업이 덮었다.
//    9/1 「소식 팝업이 배포를 두 번 죽인」 것과 같은 사고 — 그때는 판 210개에 끄기를 심었고, 이번엔 열쇠 자리로 푼다.
const KEY = COACH.loginpop // '1' = 봤음(로그인·나중에·뒤로가기 전부)

/** 아직 안 봤나? — ⛔ 저장소를 못 읽는 폰이면 «봤음»으로 친다(매번 뜨는 게 더 나쁘다) */
export const needsLoginNudge = () => { try { return localStorage.getItem(KEY) !== '1' } catch { return false } }
export const markLoginNudgeSeen = () => { try { localStorage.setItem(KEY, '1') } catch { /* 저장 못 해도 화면은 돈다 */ } }

function 고운말(e) {
  const c = (e && e.code) || ''
  if (c.includes('popup-blocked')) return '로그인 창이 막혔어요. 다시 눌러 주세요.'
  if (c.includes('popup-closed') || c.includes('cancelled-popup')) return '로그인 창을 닫으셨어요.'
  if (c.includes('network')) return '인터넷이 불안해요. 잠시 뒤에 다시 눌러 주세요.'
  return '잘 안 됐어요. 「나중에 하기」로 넘어가도 돼요.'
}

/**
 * @param {{ recipes: number, diaries: number, onLater: () => void, onLoggedIn: () => void }} p
 *   recipes    = 내 레시피 편수(홈이 `myRecipeCount` 로 센 값) · diaries = 내 일기 편수(`myDiaryCount`)
 *                ⭐ 첫 줄은 «있는 것만» 부른다 — 둘 다면 「레시피 N편·일기 M편」, 하나면 그것만(0편을 부르면 남 얘기가 된다)
 *   onLater    = 「나중에 하기」·뒤로가기 — 부모가 «봤음» 표시 ＋ 닫는다
 *   onLoggedIn = 로그인 성공 — 부모가 «봤음» 표시 ＋ 설정의 클라우드 시트로 보낸다(올리기·가져오기는 거기 몫)
 */
export default function LoginNudge({ recipes = 0, diaries = 0, onLater, onLoggedIn }) {
  useModalBack(onLater)
  // 📔 창업자 확정 문구 = 「내가 저장한 레시피 N편·일기 M편이 사라져요」 — 있는 것만 부른다
  const 잃을것 = [recipes > 0 && { n: recipes, 말: '레시피' }, diaries > 0 && { n: diaries, 말: '일기' }].filter(Boolean)
  const [바쁨, set바쁨] = useState(false)
  const [탈, set탈] = useState('')
  const { 비로그인, 로그인: 로그인상한 } = 무료열쇠상한()

  const 눌러로그인 = async (공급자 = 'google.com') => {
    set탈(''); set바쁨(true)
    try {
      await 로그인(공급자)
      onLoggedIn()
    } catch (e) {
      // ⛔ 실패해도 시트를 닫지 않는다 — 닫으면 «봤음»이 되어 다시는 못 권한다. 나가는 길은 「나중에 하기」뿐.
      set탈(고운말(e)); set바쁨(false)
    }
  }

  // 📏 줄간격 — 창업자 *"줄간격 신경써서 해줘"*.
  //    제목 1.35 · 본문 1.7 · 이유 세 줄은 «한 줄에 한 문장»이라 줄 사이를 8px 로 띄운다(붙으면 한 문단으로 읽힌다).
  return (
    <Portal>
      <div className="sheet-mask" onClick={onLater}>
        <div
          className="sheet"
          onClick={(e) => e.stopPropagation()}
          style={{ paddingBottom: 'calc(18px + var(--safe-bottom))', maxHeight: 'calc(100dvh - 40px)' }}
        >
          {/* ✍️ 글씨체 = 주아(창업자 2026-09-06 *"글씨체는 주아체로 바꿔줘"*) — 온보딩·스토어 스샷과 같은 얼굴.
              ⛔ 주아는 굵기가 400 하나다 → fontWeight 를 세우지 않는다(가짜 굵게가 뭉갠다). 크기로 위계를 준다. */}
          <div style={{ padding: '6px 22px 0', textAlign: 'center', fontFamily: "'Jua', sans-serif" }}>
            <img src={duoHi} alt="" aria-hidden draggable={false} style={{ width: 150, maxWidth: '48%', display: 'block', margin: '0 auto' }} />

            {/* 🔐🔐 **[창업자 확정 2026-09-08 00:1x] 「앞으로 저장할 것」까지 말한다 ＋ 0편에게도 띄운다.**
                📮 창업자 = *"**앞으로 저장하는 것들을 잃게 된다고 알려줘야할 듯**"* → *"**0편인 사람한테도 뜨게 하자**"*
                ⛔⛔ 그 전 문구는 **이미 쌓은 것만** 말했다 — 「내가 저장한 레시피 1편이 사라져요」.
                   1편 있는 사람은 «1편쯤이야» 하고 넘긴다. **진짜 손해는 앞으로 쌓을 전부**인데 그 말이 없었다.
                ⛔⛔ 그리고 0편이면 이 자리가 **통째로 깨졌다** — `잃을것` 이 빈 배열이라
                   「내가 저장한 **이** 사라져요」가 된다. 0편에게 띄우려면 이 갈래가 «반드시» 있어야 한다.
                ⭐ 0편이 제일 위험하다 — 잃을 게 없어 보이지만 **앞으로 쌓을 것을 통째로** 잃는다. */}
            <div style={{ fontSize: 24, fontWeight: 400, lineHeight: 1.35, letterSpacing: '-0.01em', marginTop: 10, textWrap: 'balance' }}>
              {잃을것.length ? (
                <>
                  앱을 지우거나 폰을 바꾸면
                  <br />내가 저장한 {잃을것.map((x, i) => (
                    <span key={x.말}>{i > 0 && '·'}{x.말} <span style={{ color: 'var(--brown)' }}>{x.n}편</span></span>
                  ))}이 사라져요
                </>
              ) : (
                <>
                  앱을 지우거나 폰을 바꾸면
                  <br />앞으로 저장할 레시피와 일기가
                  <br /><span style={{ color: 'var(--brown)' }}>모두</span> 사라져요
                </>
              )}
            </div>

            {/* ⭐ 쌓인 게 있는 사람에게도 «앞으로»를 알려준다 — 위 큰 글씨는 짧게 두고 여기서 한 줄로.
                ⛔ 0편이면 위에서 이미 「앞으로」를 말했으므로 두 번 하지 않는다. */}
            {잃을것.length > 0 && (
              <div className="t-sub" style={{ fontSize: 15, lineHeight: 1.6, marginTop: 8 }}>
                앞으로 저장할 것도 함께 사라져요
              </div>
            )}

            <div className="t-sub" style={{ fontSize: 16, lineHeight: 1.7, marginTop: 14 }}>
              구글로 로그인하면 —
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, textAlign: 'left', margin: '8px auto 0', maxWidth: 300 }}>
              {[
                '폰을 바꿔도, 앱을 다시 깔아도 그대로 남아요',
                `무료 ${KEY_NAME}가 ${비로그인}${KEY_UNIT} → ${로그인상한}${KEY_UNIT}로 늘어요`,
                '패드에서도 이어서 써요',
              ].map((줄) => (
                <div key={줄} style={{ display: 'flex', gap: 8, fontSize: 16.5, lineHeight: 1.55 }}>
                  <span style={{ color: 'var(--brown)', flex: '0 0 auto' }}>·</span>
                  <span>{줄}</span>
                </div>
              ))}
            </div>

            {탈 && <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--brown)', marginTop: 14 }}>{탈}</div>}
          </div>

          <div style={{ padding: '18px 18px 0' }}>
            <GoogleButton label="구글로 로그인" busy={바쁨} onClick={() => 눌러로그인('google.com')} />
            {/* 🍎 아이폰 «앱 안»에서만 — 구글 다음(열쇠 갈래 ⓑ) */}
            {앱안인가() && <AppleButton busy={바쁨} disabled={바쁨} onClick={() => 눌러로그인('apple.com')} />}
            <button
              className="press" onClick={onLater} disabled={바쁨}
              style={{ width: '100%', marginTop: 10, color: 'var(--text-sub)', fontSize: 16.5, fontWeight: 400, padding: '8px 0', fontFamily: "'Jua', sans-serif" }}
            >
              나중에 하기
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
