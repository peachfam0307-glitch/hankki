import { useEffect, useState } from 'react'
import Icon from './Icon'
import PromptSheet from './PromptSheet'
import ConfirmSheet from './ConfirmSheet'
import GoogleButton from './GoogleButton'
import { useStore } from '../store'
import { APP_TAGLINE } from '../version'
import { markCloudGateSeen } from '../nudges'
import { 잠긴장수, 백업풀기 } from '../diaryLock'
import { 로그인, 요약, 내려받기, 미리붙기, 받았다표시 } from '../cloud'
import KeyGift from './KeyGift'
import duoHi from '../assets/sharepool/duo_hi.png'

// ☁️🚪 클라우드 첫 화면 — 앱을 켜자마자 «맨 처음» 뜬다. 소개보다 앞.
//
// 📮 창업자 2026-08-21 = *"새유저는 그냥 첫화면에 로그인하고시작
//    **왜냐면 온보드는 그냥 건너뛰기할수도있어**"*
// ⛔⛔ 내 첫 안은 소개 «마지막 장»이었고 창업자가 잡았다 — 「건너뛰기」가 매 장 오른쪽 위에 있어
//    **첫 장에서 통째로 넘어간다**(`Onboarding.jsx:543` 실측). 마지막 장은 못 보는 사람이 생긴다.
//
// ⭐⭐ **벽이 아니다** — 「그냥 둘러볼게요」로 지나간다. 그래도 «안 보고» 지나갈 수는 없다.
//    📌 이미 깔린 사람도 안 막힌다(그 사람들은 홈 한 줄로 만난다).
//
// ⭐ 덤 = 로그인하면 **클라우드에 자기 것이 있는지 우리가 바로 안다** → 「가져올까요?」 한 번이면 끝.
//    그 전엔 「이미 다른 기기에서 쓰고 있었어요 · 백업 불러오기」를 «찾아서» 눌러야 했고 파일도 있어야 했다.
//
// ⚠️ 안내는 «두 줄»까지만 — 창업자 *"안내는 심플 명확하게"* · *"통상적인 수준에서 하자"*
//    자세한 것은 「자세히」를 눌러야 펴진다(장보기의 「더보기·접기」와 같은 모양).

export default function CloudGate({ onDone }) {
  const { importAll } = useStore()
  const [열림, set열림] = useState(false)   // 「자세히」 펼침
  const [바쁨, set바쁨] = useState('')
  const [탈, set탈] = useState('')
  const [찾음, set찾음] = useState(null)     // 클라우드에 있던 것 { 레시피, 일기, 언제 }
  const [잠금물음, set잠금물음] = useState(null)
  const [물음, set물음] = useState(false)     // 「나중에 하기」를 누르면 한 번 물어본다

  // ⛔ 팝업은 누른 «그 순간» 열려야 브라우저가 안 막는다 → 화면이 뜰 때 미리 받아 둔다.
  useEffect(() => { 미리붙기() }, [])

  const 지나가기 = () => { markCloudGateSeen(); onDone() }

  const 눌러로그인 = async () => {
    set탈(''); set바쁨('로그인')
    try {
      await 로그인()
      const r = await 요약()
      if (r.있나 && (r.레시피 || r.일기)) { set찾음(r); set바쁨(''); return }
      // ⭐ 클라우드가 비어 있으면 = 처음 쓰는 사람. **가져올 게 없으니 「봤다」로 친다.**
      //   📌 이 표식이 있어야 다음에 앱을 켤 때 «저절로 올리기»가 돈다(안전장치 ②).
      받았다표시()
      지나가기()
    } catch (e) {
      set탈(고운말(e)); set바쁨('')
    }
  }

  const 가져오기 = async () => {
    set탈(''); set바쁨('가져오기')
    try {
      const data = await 내려받기()
      if (!data) { 지나가기(); return }
      importAll(data)
      받았다표시() // ⭐ 가져왔다 → 이제부터 저절로 올려도 안전하다(안전장치 ②)
      const n = 잠긴장수(data.diary)
      // ⭐ 잠긴 일기는 «먼저 담고» 비번을 묻는다 — 비번을 먼저 물으면 「모르겠다」는 사람이 다 못 가져온다.
      if (n) { set잠금물음({ n, data }); set바쁨(''); return }
      지나가기()
    } catch (e) {
      set탈(고운말(e)); set바쁨('')
    }
  }

  const 잠금풀기 = async ({ pin }) => {
    const p = String(pin || '').trim()
    const d = 잠금물음
    set잠금물음(null)
    if (!p || !d) { 지나가기(); return }
    try {
      const { 일기목록, 푼수 } = await 백업풀기(d.data.diary, p)
      if (푼수) importAll({ ...d.data, diary: 일기목록 })
    } catch { /* 못 풀면 잠긴 채로 둔다 — 안 지운다 */ }
    지나가기()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 210, background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
      padding: 'calc(var(--safe-top) + 24px) 24px calc(var(--safe-bottom) + 28px)',
      overflowY: 'auto',
    }}>
      {/* ⬇️ 아래로 몬다 — 창업자 확정 2026-08-21 = *"B로 가자"* (＝*"단추를 조금 내리고 레꾸해요 위는 좀 올리자"*)
          📮 창업자가 다른 앱 로그인 창을 보내 줬고(*"다른사이트로그인창"*) 그 앱이 이 짜임이다.
          ⭐ 얻는 것 둘 = ⑴단추가 «엄지 닿는 자리»로 내려온다 ⑵곰펭이 커져 먼저 눈에 든다.
             📌 첫 화면에서 제일 센 무기가 곰펭인데 가운데로 모으면 168px 로 작았다.

          ⛔⛔ `justifyContent: 'flex-end'` 로 하지 않는다 — 「자세히」를 펴면 내용이 화면보다 길어지는데
             그때 flex-end 는 **위쪽이 잘려서 스크롤로도 못 올라간다**(브라우저 공통 함정).
             ✅ `flex-start` ＋ 그림에 `margin-top: auto` = 평소엔 아래로 몰리고, 길어지면 auto 가 0 이 되어
                위부터 정상으로 굴러간다. **보이는 건 같고 안 깨진다.** */}
      {/* 🕳 위가 휑하던 것 — 창업자 확정 2026-08-31 = *"위에 좀 휑한데 «뭘 넣자니 지저분할 것 같고»"* → 시안 다섯 중 **「나」**
          ⭐⭐ 새로 넣은 요소는 **0개**다. 지렛대는 «곰펭↔글자 사이 간격»(34 → 110) 하나 —
             곰펭만 위로 올라가고 **글자·단추 덩어리는 한 픽셀도 안 움직인다**(제목 위치 634px 그대로 · 실측).
             📌 그래서 창업자가 걱정한 「지저분」이 구조적으로 안 생긴다.
          🔢 실측(412×915) = 위 빈 자리 **421 → 319px** · 단추는 아래에서 **127px 그대로**(8/21 엄지 자리 확정 유지)
          ⛔⛔ `width` 와 `maxWidth` 는 **한 몸이다** — 62% 를 그대로 두면 240 을 줘도 **226px 로 잘린다**
             (412px 화면 안쪽 364px × 62% = 225.7). 판을 뽑을 때 이걸 모르고 한 번 헛돌았다.
          ⛔ 240 이 안전선이다 — 원본이 760px 이라 3배 화면에서 240×3=720 ≤ 760 → **1.06배**(1.0 밑이면 흐려진다).
          ⛔ 간격을 170 까지 벌리지 않는다 — 412×640 에서 내용이 넘쳐 **단추가 87px 까지 올라왔다**(엄지 자리가 깨진다).
             110 은 320·360·412 폭 × 640~915 높이에서 전부 멀쩡했다. */}
      <img src={duoHi} alt="" style={{ width: 240, maxWidth: '66%', margin: 'auto auto 110px', display: 'block' }} />

      {!찾음 ? (
        <>
          {/* ⭐⭐ 통상적인 앱 로그인 화면 그대로 — 이름 · 한 줄 · 단추.
              📮 창업자 2026-08-21 = *"아니 그냥 «통상적인 앱들 가입하는 창» 있잖아"* · *"매어둘까요 그런거말고"*
              ⛔ 내 첫 안은 「레시피를 계정에 매어둘까요?」였다 — 우리끼리 쓰는 말이라 처음 온 사람은 못 알아듣는다.
                 게다가 로그인 화면에서 «기능 설명»을 하면 그 자체로 낯설다. 앱들은 이름과 단추만 둔다.
              📌 「왜 로그인하나」는 아래 «작은 줄»로 내렸다 — 궁금한 사람만 편다. */}
          <div style={{ textAlign: 'center', marginBottom: 26 }}>
            <div style={{ fontSize: 31, fontWeight: 800, color: 'var(--brown)', letterSpacing: '-.02em' }}>한끼</div>
            <div className="t-sub" style={{ fontSize: 15, marginTop: 7 }}>{APP_TAGLINE}</div>
          </div>

          {/* 🔵🔴🟡🟢 구글 규정 단추 — 창업자가 보내 준 다른 앱 캡처 그대로(2026-08-21).
              ⛔ 우리 파란 단추(`btn-primary`)로 두지 말 것 — 「우리 앱 단추」로 보이지 «구글 단추»로 안 보인다. */}
          <GoogleButton busy={바쁨 === '로그인'} disabled={!!바쁨} onClick={눌러로그인} />

          {/* 📷📷 **사진 한 줄만 «펴서» 둔다** (창업자 2026-08-31 *"유저들한테 안내를 꼭 해야겠네"* → *"잘보이게 적어줘"*)
              ⛔ 그 전엔 이 말이 아래 「자세히」 «안»에 접혀 있었다 — **창업자 본인도 모르고 있었다.**
                 만든 사람이 모르면 유저는 더 모른다. 그런데 이건 **나중에 알면 늦는 말**이다
                 (새 폰에서 내려받고 «나서야» 「내 사진 어디 갔어」가 된다).
              ⭐ **한 줄만 꺼낸다** — 넷을 다 꺼내면 안내가 아니라 벽이 된다.
                 나머지 셋은 «좋은 소식»이라 늦게 알아도 손해가 없고, 이것만 «기대와 다른 것»이다.
              ⭐ 오늘 ⓑ(자랑카드는 올린다) 덕에 알릴 말이 **하나로 줄었다** — 짧아야 읽힌다.
              📌 자리 = **단추 «바로 밑»**. 「나중에 하기」 아래에 두면 그 단추를 설명하는 말로 읽힌다.
              ⛔ 문구는 아래 「자세히」·설정 시트와 **한 몸**이다. 고칠 땐 세 곳을 같이 고친다. */}
          {/* 🎁🎁 [창업자 2026-09-01] **「로그인하면 열쇠 20개 더」를 «잘 보이게».**
              📮 *"유저한테 화면에안내도 적어줘(로그인화면에)"* → *"**잘보이게에~@@**"*
              ⭐⭐ 이건 **「왜 로그인하나」의 답**이다 — 위 주석의 *"로그인 화면에서 «기능 설명»을 하면 낯설다"*
                 와 어긋나지 않는다. 기능 설명이 아니라 **혜택 한 줄**이고, 앱들이 흔히 두는 자리다.
              ⛔ **한 줄로 둔다** — 길어지면 다시 「낯선 화면」이 된다(그 판단은 그대로 살아 있다).
              ⛔⛔ **숫자를 «글자로» 박지 않는다** — `로그인보너스()` 가 서버가 준 두 상한의 차를 준다.
                 📌 상한을 바꾸는 날 문구만 낡는 사고를 여기서 미리 막는다(`ocr.js` 의 「5회」 교훈).
              ⛔ 유니코드 이모지 금지 — 우리 열쇠 그림(`key_one.png`)을 쓴다(절대원칙). */}
          {/* ⭐ 설정 시트(CloudSheet)와 «같은 부품» — 복사하면 한쪽만 고쳐져 갈라진다 */}
          <KeyGift />

          <div className="t-sub" style={{ fontSize: 13.5, lineHeight: 1.6, textAlign: 'center', textWrap: 'balance', marginTop: 11 }}>
            직접 넣은 사진은 저장되지 않아요 · 백업 파일로 남겨요
          </div>

          {/* ⛔ 이 줄을 «버튼»으로 만들지 않는다 — 둘이 같은 무게로 서면 「뭘 눌러야 하나」가 된다.
              (소개 마지막 장의 「이미 다른 기기에서…」와 같은 이유) */}
          {/* ⛔ 「둘러보기」가 아니다 (창업자 2026-08-21 = *"그냥 둘러보기??"*) —
              우리 앱은 로그인 없이도 **전부 다 쓴다.** 「둘러보기」는 「구경만 하고 제대로는 못 쓴다」로 읽혀 **사실과 다르다.**
              ✅ 「나중에 하기」 = 미루는 것이 «로그인»뿐임이 그대로 읽힌다. */}
          <button
            className="press" onClick={() => set물음(true)} disabled={!!바쁨}
            style={{ width: '100%', marginTop: 13, color: 'var(--text-sub)', fontSize: 15.5, fontWeight: 600, padding: '6px 0' }}
          >
            나중에 하기
          </button>

          {/* 📖 「왜 로그인하나」 — 눌러야 펴진다. 장보기의 「더보기·접기」와 같은 모양이라 처음 보는 게 아니다.
              📮 창업자 = *"로그인하면 뭐가바뀌는지 안내버튼을 누르면 자세히 읽어보게한다거나"* */}
          <button
            className="press"
            onClick={() => set열림((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', color: 'var(--text-sub)', fontSize: 14.5, padding: '6px 0', marginTop: 22, marginBottom: 열림 ? 10 : 0 }}
          >
            로그인하면 새 폰에서도 이어서 써요
            <Icon name={열림 ? 'chevron-up' : 'chevron-down'} size={15} color="var(--sand)" />
          </button>

          {/* 📢 통상적인 «안내문» 형식 — 한 줄에 한 문장. 갈래를 나누지 않는다.
              📮 창업자 2026-08-21 = *"안내도 «올라가는 것» 이런거 말고 직관적이고 명확하게.
                 «통상적인 안내문형식»으로 적어"*
              ⛔ 내 첫 안은 「올라가는 것 / 안 올라가는 것」 두 칸이었다 — 그건 «우리가 코드를 보며 쓰는 틀»이지
                 안내문이 아니다. 유저는 갈래를 배우려고 이걸 읽지 않는다.
              ⭐ 문체는 해요체로 통일(절대원칙 30). ⛔「합니다」체를 섞지 않는다. */}
          {열림 && (
            <div style={{ background: 'var(--cream)', borderRadius: 12, padding: '14px 15px', marginTop: 2, marginBottom: 4, fontSize: 14.5, lineHeight: 1.85, whiteSpace: 'pre-line' }}>
              · 새 폰이나 패드에 다시 깔아도 레시피 · 일기 · 냉장고 · 장보기가 그대로 이어져요.{'\n'}
              · 꾸민 표지도 같이 저장돼요 (스티커 · 글씨 · 배경 · 레꾸자랑 카드).{'\n'}
              · <b>직접 넣은 사진은 저장되지 않아요.</b> 사진은 이 폰과 백업 파일에 그대로 남아요.{'\n'}
              · 잠가둔 일기는 잠긴 채로 저장돼요.
            </div>
          )}
        </>
      ) : (
        // ⭐ 로그인해 보니 클라우드에 «자기 것»이 있었다 — 새 폰에서 제일 반가운 화면이다
        <>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.4 }}>저장해둔 게 있어요</div>
            <div className="t-sub" style={{ fontSize: 15.5, lineHeight: 1.65, marginTop: 9 }}>
              레시피 <b>{찾음.레시피}</b>개 · 일기 <b>{찾음.일기}</b>장
            </div>
          </div>
          <button className="btn-primary press" style={{ width: '100%' }} disabled={!!바쁨} onClick={가져오기}>
            {바쁨 === '가져오기' ? '가져오는 중…' : '가져오기'}
          </button>
          <button
            className="press" onClick={지나가기} disabled={!!바쁨}
            style={{ width: '100%', marginTop: 13, color: 'var(--text-sub)', fontSize: 15.5, fontWeight: 600, padding: '6px 0' }}
          >
            나중에 할래요
          </button>
        </>
      )}

      {탈 && (
        <div style={{ marginTop: 16, background: 'var(--cream)', borderRadius: 10, padding: '10px 12px', fontSize: 14.5, lineHeight: 1.6, textAlign: 'center' }}>
          {탈}
        </div>
      )}

      {/* ⚠️ 「나중에 하기」를 누르면 «한 번» 물어본다.
          📮 창업자 2026-08-21 = *"나중에 하기를 누르면 안내팝업. **모르고 그냥 해볼수있으니까**"*
          ⛔⛔ 창업자 말 중 「저장이 안 된다」는 «정확히는 틀리다» — 코드로 확인했다(`store.jsx:691`).
             로그인을 안 해도 **폰 안에는 저장된다.** 안 되는 건 «폰 밖»이다.
             ✅ 그래서 「저장이 안 돼요」가 아니라 **「이 폰에만 저장돼요」**로 쓴다.
                📌 이게 더 정확하면서 «더 무서운» 사실이기도 하다 — 폰을 바꾸면 없어진다.
          ⛔ 겁주지 않는다(`docs/리텐션-설계원칙-2026-07-30.md`) — **사실 ＋ 다음 행동**까지만.
             그래서 마지막 줄이 「설정에서 언제든 로그인할 수 있어요」다. 막다른 길이 아니라고 말해 준다. */}
      {물음 && (
        <ConfirmSheet
          title="로그인 없이 시작할까요?"
          message={'레시피와 일기가 이 폰에만 저장돼요.\n폰을 바꾸거나 앱을 지우면 없어져요.\n\n설정에서 언제든 로그인할 수 있어요.'}
          confirmLabel="그냥 시작하기"
          onConfirm={() => { set물음(false); 지나가기() }}
          onClose={() => set물음(false)}
        />
      )}

      {잠금물음 && (
        <PromptSheet
          title="잠가둔 일기가 있어요"
          fields={[{ key: 'pin', label: `${잠금물음.n}장이 잠겨 있어요 · 비번 네 자리`, value: '', placeholder: '••••' }]}
          submitLabel="열기"
          onSubmit={잠금풀기}
          onClose={() => 잠금풀기({})}
        />
      )}
    </div>
  )
}

// ⛔ 파이어베이스 오류 코드를 그대로 보여주지 않는다 — 유저는 그걸 읽고 할 수 있는 게 없다.
function 고운말(e) {
  const c = (e && e.code) || ''
  if (c.includes('popup-blocked')) return '로그인 창이 막혔어요. 다시 눌러 주세요.'
  if (c.includes('popup-closed') || c.includes('cancelled-popup')) return '로그인 창을 닫으셨어요.'
  if (c.includes('network')) return '인터넷이 불안해요. 잠시 뒤에 다시 눌러 주세요.'
  // ⛔ 옛 이름 「그냥 둘러볼게요」가 여기 남아 있었다 — 창업자가 2026-08-21 에 물린 말이다(*"그냥 둘러보기??"*).
  //   화면 단추는 「나중에 하기」인데 오류 문구만 옛 이름이라 «같은 것을 두 이름»으로 불렀다.
  //   📌 v11.02 「책갈피」와 같은 자리 — 이름을 바꾸면 그 이름이 «뜨는 곳 전부»를 같이 바꾼다.
  return '잘 안 됐어요. 「나중에 하기」로 넘어가도 돼요.'
}
