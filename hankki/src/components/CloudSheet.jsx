import { useEffect, useState } from 'react'
import Portal from './Portal'
import Icon from './Icon'
import GoogleButton from './GoogleButton'
import KeyGift from './KeyGift'
import { 로그인, 로그아웃, 사람지켜보기, 요약, 올리기, 내려받기, 미리붙기, 받았다표시, 받았다지우기 } from '../cloud'
import { 자동받기켤까 } from '../nudges'

// ☁️ 클라우드 저장 시트 — 「새 폰에서도 그대로 나오게」
//
// 📮 창업자 확정 = 프로덕션 통과 «직후 1번»(2026-08-16) · 짝 = 🅰 파이어베이스(2026-08-20)
// ✅ 바닥은 실물로 닫혔다(2026-08-21 창업자 폰 — 팝업 로그인 ✅ · 내 칸 ✅ · 남의 칸 막힘 ✅)
//
// ⭐⭐ **이 화면이 지키는 것 = 「고르게 한다」**
//   ⛔ 자동 병합을 안 한다. 자동으로 합치면 **어느 쪽이 이겼는지 유저가 모른 채 데이터가 사라진다.**
//   ✅ 두 판을 «나란히 보여주고» 어느 쪽으로 덮을지 **유저가 고른다**(규칙 18 ⓙ — 이미 깔린 폰).
//   📌 그래서 단추 이름도 「동기화」가 아니라 **「이 폰 것으로 덮기」/「클라우드 것으로 덮기」**다 —
//      «덮는다»는 말을 숨기지 않는다.
//
// ⚠️ 세기는 정직하게 — **사진은 안 올라간다.** 화면에 그대로 적는다(창업자 확정 「글자부터」).

const 때 = (iso) => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const p = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
  } catch { return '' }
}

// 🈳 «클라우드가 비었나» — 문서가 아예 없거나, 있어도 레시피·일기가 0이면 비었다.
//   ⛔ CloudGate 와 «같은 잣대»다(`r.있나 && (r.레시피 || r.일기)`).
//      첫 화면과 설정이 다르게 판단하면 유저가 「어느 게 맞지?」가 된다.
const 비었다 = (r) => !(r && r.있나 && (r.레시피 || r.일기))

export default function CloudSheet({ onClose, 백업만들기, 불러오기끝, showToast, 폰레시피, 폰일기, 백업열기 }) {
  const [사람, set사람] = useState(undefined) // undefined = 아직 모름 · null = 로그아웃
  const [구름, set구름] = useState(null) // { 있나, 언제, 레시피, 일기 }
  const [바쁨, set바쁨] = useState('')
  const [탈, set탈] = useState('')
  const [자세히, set자세히] = useState(false)   // 「자세히」 접기 — 통상은 닫혀 있다

  // ⭐ 시트가 뜨자마자 파이어베이스를 «몰래» 받아 둔다.
  //   ⛔ 안 그러면 [로그인]을 누른 뒤에 받느라 사이가 뜨고, 그 사이에 «누른 손짓»이 끊겨 팝업이 막힌다.
  useEffect(() => { 미리붙기() }, [])
  useEffect(() => 사람지켜보기(set사람), [])

  useEffect(() => {
    if (!사람) { set구름(null); return }
    let 살아있나 = true
    요약().then((r) => { if (살아있나) set구름(r) }).catch(() => { if (살아있나) set구름(null) })
    return () => { 살아있나 = false }
  }, [사람])

  // ☁️🈳 «클라우드가 비었나» — 창업자 확정 ㄱ＋ㄴ (2026-08-27)
  //   📮 창업자 = *"쓰던 유저가 처음 로그인하면 기존꺼 어떻게 불러와?? 이거 안내도 있어야 할 것 같아."*
  //   ⭐ 쓰던 사람이 «처음» 로그인하면 반드시 이 상태다 — 클라우드가 0이고 아랫단추가 회색이다.
  //      그런데 화면이 «왜» 회색인지 한 글자도 안 말해준다 → 「고장인가?」로 읽힌다.
  //   ⛔ 게다가 그때 윗단추 설명(「클라우드에 «있던» 건 …」)은 말이 안 된다 — 있던 게 없다.
  //   ⚠️ `구름 == null` 은 «비었다»가 아니라 «아직 모른다»(보는 중)다.
  //      섞으면 시트가 뜨자마자 글자가 한 번 깜빡였다 되돌아온다.
  //   ⭐ 잣대를 «하나»로 뒀다 — 위 `비었다()`. 화면 글자와 ㉠(저절로 올리기)이 같은 판단을 한다.
  //     ⛔ 둘이 갈리면 「비었다」고 써놓고 안 올리는 화면이 나온다.
  const 비었나 = 구름 != null && 비었다(구름)

  const 감싸기 = async (무엇, 하기) => {
    set탈(''); set바쁨(무엇)
    try { await 하기() } catch (e) { set탈(고운말(e)) } finally { set바쁨('') }
  }

  // ☁️⚡ ㉠ — 로그인하면 «그 자리에서 바로» 올린다 (⛔클라우드가 비어 있을 때만) · 창업자 확정 2026-08-27
  //   📮 창업자 = *"정리하면 로그인하면 지금까지 쓴거 자동저장된다는거지?? 내가 백업파일 따로 안받아도."*
  //             → 갈래 ㉠㉡ 중 *"㉠으로 하자"*
  //   ⛔⛔ 그 전엔 «아니었다» — 안전장치 ②(`받았나`)가 첫 올리기를 막아서
  //      쓰던 사람은 손으로 「이 폰 것으로 덮기」를 눌러야만 올라갔다.
  //      ⭐⭐ 그런데 «새로 깐» 사람은 CloudGate 가 알아서 표시해 줘 저절로 올라갔다 — 거꾸로였다.
  //         레시피가 쌓인 사람일수록 잃을 게 큰데 그 사람만 안 올라갔다.
  //         (코드 주석엔 그 걱정이 이미 적혀 있었는데 정작 그 경우를 못 막고 있었다)
  //   ✅ 위험이 0인 근거 = **클라우드가 비었을 때만** 한다. 덮을 게 아예 없다.
  //      ⛔ 클라우드에 뭐가 있으면 손도 안 댄다 — 두 판을 보여주고 «고르게 한다»(창업자 확정).
  //      ⛔ 앱을 지웠다 깐 빈 폰이 클라우드를 덮는 길도 그대로 막혀 있다(그땐 클라우드가 «안» 비었다).
  const 눌러로그인 = () => 감싸기('로그인', async () => {
    await 로그인()
    const r = await 요약()
    set구름(r)
    if (!비었다(r)) return          // 클라우드에 뭐가 있다 → 유저가 고른다
    받았다표시()                    // ⭐ 이제부터 앱 켤 때마다 저절로 올라간다(안전장치 ②)
    const 백업 = await 백업만들기()
    const 올린결과 = await 올리기(백업)
    set구름(await 요약())
    const 뒤 = 올린결과.건너뛴것.length ? ` · ${올린결과.건너뛴것.length}개는 너무 커서 못 올렸어요` : ''
    showToast(`지금까지 쓴 걸 클라우드에 올렸어요${뒤}`)
  })

  const 올리자 = () => 감싸기('올리기', async () => {
    const 백업 = await 백업만들기()
    // ⭐ 손으로 「이 폰 것으로 덮기」를 눌렀다 = 유저가 «폰 판»을 골랐다는 뜻 → 그 뒤론 저절로 올려도 된다
    받았다표시()
    const r = await 올리기(백업)
    set구름(await 요약())
    const 뒤 = r.건너뛴것.length ? ` · ${r.건너뛴것.length}개는 너무 커서 못 올렸어요` : ''
    showToast(`클라우드에 올렸어요${뒤}`)
  })

  const 내려받자 = () => 감싸기('내려받기', async () => {
    const data = await 내려받기()
    if (!data) { set탈('클라우드에 아직 아무것도 없어요'); return }
    받았다표시() // ⭐ 가져왔다 → 이제부터 저절로 올려도 안전하다(안전장치 ②)
    불러오기끝(data, '클라우드') // ⭐ 백업 불러오기와 «같은 흐름» — 잠긴 일기 비번 묻기까지 여기서 처리된다
    onClose()
  })

  // ⛔ 로그아웃하면 «봤다» 표식도 지운다 — 다른 계정으로 로그인했을 때
  //    옛 표식이 남아 있으면 «남의 클라우드»를 이 폰 것으로 덮어버린다.
  const 나가자 = () => 감싸기('로그아웃', async () => { await 로그아웃(); 받았다지우기(); set구름(null) })

  return (
    <Portal>
      <div className="sheet-mask" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 22 }}>
          <div className="emoji-sheet-head">
            <span>클라우드 저장</span>
            <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 15, fontWeight: 600 }}>닫기</button>
          </div>

          <div style={{ padding: '2px 16px 0' }}>
            {사람 === undefined && <div className="t-sub" style={{ fontSize: 15, padding: '10px 0' }}>준비하는 중…</div>}

            {사람 === null && (
              <>
                {/* ⚠️ 안내는 «두 줄»까지만 (창업자 2026-08-21 — *"안내는 심플 명확하게"* · *"통상적인 수준에서 하자"*)
                    ⛔ 내 첫 안은 「미리 알아둘 것」 세 줄이었고 창업자가 잡았다 —
                       *"미리알아둘것은 무슨말인지 이해가안된다"* · *"다른앱들 저런거 안내해주는걸 못본거같은데"*
                    ⭐ 남긴 한 줄 = **사진** 하나뿐이다. 그것만 «기대와 다른 것»이라, 안 알리면
                       나중에 *"내 음식 사진 어디 갔어"* 가 된다. 나머지는 단추 이름이 이미 말한다.
                    📌 그리고 창업자 지적대로 **「사진」이 아니라 「내가 넣은 사진」**이다 —
                       기본 레시피 사진은 «주소»라 그대로 따라온다. 뭉뚱그리면 유저가 반대로 읽는다. */}
                {/* 📖 자세한 것은 «눌러야» 펴진다 — 장보기의 「더보기·접기」와 같은 모양이라 처음 보는 게 아니다
                    📮 창업자 = *"로그인하면 뭐가바뀌는지 안내버튼을 누르면 자세히 읽어보게한다거나"*
                    ⛔⛔ 여기 원래 «두 줄 설명 ＋ 「뭐가 올라가는지 자세히」»가 따로 있었다. 둘 다 무른 말이다 —
                       창업자 2026-08-21 = *"안내도 «올라가는 것» 이런거 말고 직관적이고 명확하게"*.
                       ⭐ 「올라간다」는 우리가 코드를 읽는 말이지 유저가 쓰는 말이 아니다(저장돼요 / 저장되지 않아요).
                    ⛔ ＋ 첫 화면은 «접힌 한 줄»인데 여기만 «설명 두 줄 ＋ 단추»라 모양도 갈렸다.
                       📌 「한 글자도 다르지 않게」라고 바로 아래 적어두고 정작 이 자리를 안 맞췄다. */}
                <button
                  className="press"
                  onClick={() => set자세히((v) => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-sub)', fontSize: 14.5, fontWeight: 600, padding: '6px 0', marginBottom: 자세히 ? 8 : 14 }}
                >
                  {자세히 ? '접기' : '로그인하면 새 폰에서도 이어서 써요'}
                  <Icon name={자세히 ? 'chevron-up' : 'chevron-down'} size={15} color="var(--sand)" />
                </button>
                {/* 📢 안내문은 «첫 화면(CloudGate)과 한 글자도 다르지 않게» 둔다.
                    ⛔ 같은 내용을 두 곳에서 다르게 쓰면 유저가 「어느 게 맞지?」가 된다.
                       (⛓「같은 기능은 탭이 달라도 같은 이름」과 같은 규칙) */}
                {자세히 && (
                  <div style={{ background: 'var(--cream)', borderRadius: 12, padding: '14px 15px', marginBottom: 14, fontSize: 14.5, lineHeight: 1.85, whiteSpace: 'pre-line' }}>
                    · 새 폰이나 패드에 다시 깔아도 레시피 · 일기 · 냉장고 · 장보기가 그대로 이어져요.{'\n'}
                    · 꾸민 표지도 같이 저장돼요 (스티커 · 글씨 · 배경 · 레꾸자랑 카드).{'\n'}
                    · <b>직접 넣은 사진은 저장되지 않아요.</b> 사진은 이 폰과 백업 파일에 그대로 남아요.{'\n'}
                    · 잠가둔 일기는 잠긴 채로 저장돼요.
                  </div>
                )}
                {/* 🔵🔴🟡🟢 첫 화면과 «같은 단추»를 쓴다 — 같은 기능은 화면이 달라도 같은 모양 */}
                <GoogleButton label="Google 계정으로 로그인" busy={바쁨 === '로그인'} disabled={!!바쁨} onClick={눌러로그인} />
                {/* 🎁 선물 안내 — 첫 화면(CloudGate)과 «같은 부품»
                    ⛔⛔ 2026-09-01 까지 이 줄이 «첫 화면에만» 있었다. 그런데 첫 화면은 «새로 깐 사람»만 본다
                       → 이미 쓰던 사람은 설정에서 열어도 선물 얘기를 한 글자도 못 봤다(창업자가 잡았다). */}
                <KeyGift />
                {/* 📷 **첫 화면(CloudGate)과 한 글자도 다르지 않은 한 줄** (창업자 2026-08-31 *"잘보이게 적어줘"*)
                    ⛔ 접힌 안내 «안»에만 두면 안 읽는다 — 그런데 이건 나중에 알면 늦는 말이다. */}
                <div className="t-sub" style={{ fontSize: 13.5, lineHeight: 1.6, textAlign: 'center', textWrap: 'balance', marginTop: 10 }}>
                  직접 넣은 사진은 저장되지 않아요 · 백업 파일로 남겨요
                </div>
              </>
            )}

            {사람 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <Icon name="cloud" size={20} color="var(--brown)" stroke={2} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: 15.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {사람.이름 || '로그인됨'}
                  </div>
                  <button className="press" disabled={!!바쁨} onClick={나가자} style={{ color: 'var(--text-sub)', fontSize: 14.5, fontWeight: 600 }}>로그아웃</button>
                </div>

                {/* ⭐⭐ 두 판을 «나란히» 보여준다 — 이게 「고르게 한다」의 실체다 */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  <판 아이콘="phone" 제목="이 폰" 레시피={폰레시피} 일기={폰일기} 언제="지금" />
                  <판
                    아이콘="cloud"
                    제목="클라우드"
                    레시피={구름?.있나 ? 구름.레시피 : 0}
                    일기={구름?.있나 ? 구름.일기 : 0}
                    언제={구름 == null ? '보는 중…' : 구름.있나 ? 때(구름.언제) : '아직 비었어요'}
                  />
                </div>

                <button className="btn-primary press" disabled={!!바쁨} onClick={올리자} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {바쁨 === '올리기' ? '올리는 중…' : <><Icon name="phone" size={16} color="#fff" /> 이 폰 것으로 클라우드 덮기</>}
                </button>
                <div className="t-sub" style={{ fontSize: 14, lineHeight: 1.5, margin: '7px 2px 12px' }}>
                  {/* ㄱ. 비었으면 「있던 건」이 말이 안 된다 — 처음 올리는 사람에게 맞는 말로 */}
                  {비었나
                    ? <>지금 이 폰에 있는 게 <b>통째로 올라가요.</b></>
                    : <>클라우드에 있던 건 <b>이 폰 것으로 바뀌어요.</b></>}
                </div>

                {/* ⛔ 레시피·일기가 0인 판을 내려받으면 «이 폰이 통째로 비워진다» → 그때도 막는다 */}
                <button className="btn-ghost press" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} disabled={!!바쁨 || !구름?.있나 || 비었나} onClick={내려받자}>
                  {바쁨 === '내려받기' ? '내려받는 중…' : <><Icon name="cloud" size={16} color="var(--brown)" /> 클라우드 것으로 이 폰 덮기</>}
                </button>
                <div className="t-sub" style={{ fontSize: 14, lineHeight: 1.5, margin: '7px 2px 0' }}>
                  {/* ㄴ. 회색 단추의 «정체»를 말해준다 — 이 말이 없으면 고장으로 읽힌다 */}
                  {비었나
                    ? <>클라우드가 비어서 <b>아직 내려받을 게 없어요.</b></>
                    : <>이 폰에 있던 건 <b>클라우드 것으로 바뀌어요.</b> 남기고 싶은 게 있으면 <b>먼저 위 단추</b>를 눌러 올려두세요.</>}
                </div>

                {/* 📷 백업 권유 — 창업자 확정 2026-08-27 *"백업받으라는 것도 알려주는게 좋겠어"* ＋ *"심플하게 통상적으로. 구구절절금지"*
                    ⭐ 클라우드가 있어도 백업이 여전히 필요한 이유는 «하나»뿐 — **사진**(클라우드에 안 올라간다).
                       폰이 죽으면 사진은 백업 파일에만 남는다. 그래서 이유를 «반 줄»만 붙였다.
                    ⛔⛔ `nudges.js:135` 는 «클라우드가 이기면 백업 권유를 숨긴다»로 돼 있다 — 사진이 빠지는 걸 그때는 안 봤다.
                       ⭐ 그 줄은 «안 건드렸다». 홈 쪽지를 되살리면 시끄럽고, 여기가 클라우드를 켠 사람이 보는 자리다. */}
                {백업열기 && (
                  <button
                    className="press"
                    onClick={백업열기}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, width: '100%', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)', color: 'var(--text-sub)', fontSize: 14.5, lineHeight: 1.5, textAlign: 'left' }}
                  >
                    <span>사진은 클라우드에 저장되지 않아요 · <b>백업 받기</b></span>
                    <Icon name="chevron-right" size={15} color="var(--sand)" />
                  </button>
                )}

                {/* 🔄🔄 [2026-09-04] 저절로 맞추기 «기록 ＋ 되돌리기» — ⛔지금은 창업자 기기에서만 보인다.
                    📮 창업자 = *"폰-패드는 동기화가 꼬이면 진자 답없어서.."*
                    ⭐⭐ 이 두 칸이 있는 이유 = **9/1 사고 때 「무슨 일이 있었는지」가 한 줄도 없었다.**
                       그래서 원인을 못 찾았고, 원인을 못 찾으니 다시 켤 수가 없었다.
                       · 기록 = 무엇이 오갔나 (＝다음에 꼬여도 원인을 «읽을» 수 있다)
                       · 되돌리기 = 꼬였을 때 «돌아갈 자리» (얹기 «전»에 뜬 벌이다)
                    ⛔ 유저에겐 안 보인다 — 자동 받기 자체가 아직 창업자 기기에서만 돌아서(`자동받기켤까`),
                       유저 폰엔 «기록도 벌도» 안 생긴다. 빈 칸만 보여주는 건 고장으로 읽힌다. */}
                {자동받기켤까() && <맞춘기록 불러오기끝={불러오기끝} onClose={onClose} showToast={showToast} 지금판={백업만들기} />}
              </>
            )}

            {탈 && (
              <div style={{ marginTop: 12, background: 'var(--cream)', borderRadius: 10, padding: '10px 12px', fontSize: 14.5, lineHeight: 1.6, color: 'var(--text)' }}>
                {탈}
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  )
}

// 🔄 저절로 맞추기 기록 ＋ 되돌리기 (⛔창업자 기기 전용 — 부르는 쪽에서 이미 걸렀다)
//   ⭐ 모듈을 «늦게» 들여온다 — 로그인 안 한 사람의 첫 화면에 동기화 코드가 딸려 들어가지 않게.
function 맞춘기록 ({ 불러오기끝, onClose, showToast, 지금판 }) {
  const [폄, set폄] = useState(false)
  const [줄들, set줄들] = useState(null)
  const [벌들, set벌들] = useState([])

  useEffect(() => {
    if (!폄) return
    let 살아있나 = true
    ;(async () => {
      try {
        const [기록, 되돌] = await Promise.all([import('../syncLog'), import('../syncUndo')])
        const [ㄱ, ㄴ] = await Promise.all([기록.읽기(), 되돌.벌목록()])
        if (!살아있나) return
        set줄들(ㄱ.slice(0, 8).map((줄) => ({ 때: 줄.때, 글: 기록.한줄로(줄) })))
        set벌들(ㄴ)
      } catch { if (살아있나) set줄들([]) }
    })()
    return () => { 살아있나 = false }
  }, [폄])

  // ⛔ 되돌리기는 «한 번에» 얹는다 — 반만 들어가는 창을 만들지 않는다.
  //    얹는 길은 클라우드 내려받기가 쓰는 그 함수(`불러오기끝`) 그대로다.
  const 되돌리자 = async (벌) => {
    try {
      const { 되돌리기 } = await import('../syncUndo')
      const 판 = await 되돌리기(벌.id, { 지금: await 지금판() })
      if (!판) { showToast('그 자리를 못 찾았어요'); return }
      try {
        const { 적기 } = await import('../syncLog')
        await 적기({ 한일: '되돌림', 되돌린것: (판.recipes || []).length })
      } catch { /* 기록이 안 남아도 되돌리기는 한다 */ }
      불러오기끝(판, '되돌리기')
      onClose()
    } catch { showToast('되돌리지 못했어요') }
  }

  return (
    <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
      <button
        className="press"
        onClick={() => set폄((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-sub)', fontSize: 14.5, fontWeight: 600, padding: '2px 0' }}
      >
        저절로 맞춘 기록
        <Icon name={폄 ? 'chevron-up' : 'chevron-down'} size={15} color="var(--sand)" />
      </button>

      {폄 && (
        <div style={{ marginTop: 10 }}>
          {줄들 === null && <div className="t-sub" style={{ fontSize: 14 }}>보는 중…</div>}
          {줄들 !== null && !줄들.length && (
            <div className="t-sub" style={{ fontSize: 14, lineHeight: 1.6 }}>아직 저절로 맞춘 적이 없어요.</div>
          )}
          {줄들 !== null && !!줄들.length && (
            <div style={{ background: 'var(--cream)', borderRadius: 12, padding: '10px 12px', fontSize: 14, lineHeight: 1.75 }}>
              {줄들.map((줄, i) => (
                <div key={i} style={{ display: 'flex', gap: 8 }}>
                  <span className="t-sub" style={{ flex: '0 0 auto' }}>{때(줄.때)}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>{줄.글}</span>
                </div>
              ))}
            </div>
          )}

          {/* ↩️ 되돌리기 — 벌이 있을 때만 보인다(없는 단추를 회색으로 두면 「고장인가」가 된다) */}
          {!!벌들.length && (
            <div style={{ marginTop: 12 }}>
              <div className="t-sub" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>
                맞추기 <b>바로 전</b>으로 돌아갈 수 있어요.
              </div>
              {벌들.map((벌) => (
                <button
                  key={벌.id}
                  className="btn-ghost press"
                  style={{ width: '100%', marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => 되돌리자(벌)}
                >
                  <Icon name="undo" size={15} color="var(--brown)" />
                  {때(벌.때)}로 되돌리기 (레시피 {벌.레시피})
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function 판({ 아이콘, 제목, 레시피, 일기, 언제 }) {
  return (
    <div style={{ flex: 1, background: 'var(--cream)', borderRadius: 12, padding: '11px 12px' }}>
      {/* ⛔ 여기 「📱」「☁️」 유니코드 이모지가 박혀 있었다 — 창업자가 강력·반복 명시한 금지 항목이다.
          ＋ 바로 윗줄엔 우리 `cloud` 아이콘이 있어 «한 화면에 구름이 두 종류»였다(2026-08-27 캡처로 잡았다). */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14.5, fontWeight: 700, color: 'var(--brown)' }}>
        <Icon name={아이콘} size={15} color="var(--brown)" />
        <span>{제목}</span>
      </div>
      <div style={{ fontSize: 15, marginTop: 5, lineHeight: 1.5 }}>
        레시피 <b>{레시피}</b><br />일기 <b>{일기}</b>
      </div>
      <div className="t-sub" style={{ fontSize: 14, marginTop: 4 }}>{언제}</div>
    </div>
  )
}

// ⛔ 파이어베이스 오류 코드를 그대로 보여주지 않는다 — 유저는 그걸 읽고 할 수 있는 게 없다.
//   ⭐ 「무엇이 막혔는지 ＋ 그래서 뭘 하면 되는지」로 바꾼다.
function 고운말(e) {
  const c = (e && e.code) || ''
  if (c.includes('popup-blocked')) return '로그인 창이 막혔어요. 다시 눌러 주세요.'
  if (c.includes('popup-closed') || c.includes('cancelled-popup')) return '로그인 창을 닫으셨어요. 다시 하시려면 눌러 주세요.'
  if (c.includes('network')) return '인터넷이 불안해요. 잠시 뒤에 다시 눌러 주세요.'
  if (c.includes('permission-denied')) return '권한이 막혔어요. 로그아웃했다가 다시 로그인해 주세요.'
  if (c.includes('unavailable')) return '지금 클라우드에 못 닿았어요. 잠시 뒤에 다시 눌러 주세요.'
  return (e && e.message) || '잘 안 됐어요. 잠시 뒤에 다시 눌러 주세요.'
}
