import { useEffect, useState } from 'react'
import Portal from './Portal'
import { useModalBack } from '../useBackHandler'
import { SKU, buy, canBuy, details, 아이폰인가 } from '../billing'
import { 결제상태, 결제동의, 구매자표, 상점빚, getOcrLeft, KEY_NAME, KEY_UNIT } from '../ocr'
import { 로그인 } from '../cloud'
import uiKeyOne from '../assets/ui/key_one.png'
import uiShop from '../assets/ui/hankki_shop.png'

// 🏪 한끼상점 — 레시피열쇠 20개 사기 (2026-10-22 · 창업자 10/4 확정 자리 Ⓑ·Ⓒ 에서 열린다)
//
// ⭐ 창업자 확정 = 값 990원·20개(Play 는 1,000원으로 올림 · 가격은 «스토어가 준 값» 그대로) ·
//    환불 = 「남은 열쇠만 환불」(10/22 ⓐ) · 로그인한 사람만 산다(10/22 ⓐ)
// ⛔ 판매 스위치(`상점열쇠()`)가 꺼져 있으면 이 시트를 여는 자리 자체가 안 그려진다.
//
// 🔒 사기 «전»에 세 가지를 본다 — 하나라도 아니면 구매 단추를 안 그린다(죽은 단추 금지 · PackBuySheet 와 같은 원칙)
//   ① 이 기기에서 구글 결제가 되나(`canBuy` · 웹·아이폰은 안 된다)
//   ② 로그인 «확인»이 되나 — 안 되면 「로그인하고 사기」(로그아웃 구매는 서버가 못 받아 3일 뒤 자동 환불된다)
//   ③ 서버 결제가 켜져 있나 — 꺼진 서버에 팔면 확인을 못 해 똑같이 자동 환불된다
// ⚠️ 유니코드 이모지 금지(창업자 2026-07-26) — 그림은 우리 스티커.

const 말 = {
  unavailable: 'Google Play · App Store 에서 받은 앱에서만 살 수 있어요.',
  pending: '결제 승인을 기다리고 있어요. 승인되면 자동으로 들어와요.',
  off: '상점을 준비하고 있어요. 조금 뒤에 다시 열어 주세요.',
  fail: '결제가 끝까지 가지 못했어요. 잠시 뒤에 다시 해 볼래요?',
  later: '결제는 됐어요. 열쇠는 다음에 앱을 켤 때 자동으로 들어와요.',
  // 🚫 환불 3번째부터(창업자 10/23 ④ · 10/24 시안 ②)
  blocked: '환불 기록이 많아 지금은 구매할 수 없어요. 궁금한 점은 설정 「도움말 및 문의」로 알려 주세요.',
  // 🧪 연습 결제(TestFlight·심사)는 한 계정 하루 한 번만 열쇠가 들어온다(창업자 10/24)
  sandbox: '연습 결제는 하루 한 번만 열쇠가 들어와요. 내일 다시 해 볼 수 있어요.',
  consent: '동의를 저장하지 못했어요. 잠시 뒤에 다시 해 볼래요?',
  // 🍎 다른 한끼 계정으로 산 구매(구매자 표가 다름) — 그 계정으로 로그인하면 들어온다(10/24 점검)
  other: '다른 한끼 계정으로 산 구매예요. 그 계정으로 로그인하면 열쇠가 들어와요.',
}
// 한 번에 사는 수 — 완료 화면이 「빚부터 메워 덜 보이는」 까닭을 셀 때 쓴다(서버 `결제.소모성` 과 같다)
const 묶음수 = 20

export default function KeyShopSheet ({ onClose, showToast }) {
  const [상태, set상태] = useState('보는중')   // 보는중 · unavailable · login · off · on
  const [상품, set상품] = useState(null)       // { price, title } — 구글이 준 값
  const [바쁨, set바쁨] = useState(false)
  const [탈, set탈] = useState('')
  const [받은수, set받은수] = useState(0)
  const [채운수, set채운수] = useState(0)   // 💸 빚부터 메운 수(창업자 10/24 C)
  const [남은빚, set남은빚] = useState(0)   // 💸 다 못 메운 빚(빚이 20 넘을 때)
  const [동의, set동의] = useState(false)   // ✅ 아이폰만 — 체크해야 사기 단추가 눌린다(창업자 10/23 Ⓐ · 10/24 아이폰만)
  const 동의필요 = 아이폰인가()
  const 닫기 = () => { if (!바쁨) onClose() }
  useModalBack(닫기)

  const 살펴보기 = async () => {
    set상태('보는중'); set탈('')
    // ⏱ 8초 안에 답이 없으면 「다시 시도」 — 답 안 오는 단계가 하나라도 있으면 「여는 중」이 끝없이 남았다(창업자 10/23 실측 · 앱 다시 켜서 풀림)
    let 늦음 = false
    const 시계 = setTimeout(() => { 늦음 = true; set상태('slow') }, 8000)
    const 끝 = (s) => { clearTimeout(시계); if (!늦음) set상태(s) }
    if (!(await canBuy())) return 끝('unavailable')
    // ⭐ 서버 확인과 가격 묻기는 서로 상관없다 → 동시에 묻는다
    const [s, list] = await Promise.all([결제상태(), details([SKU.ocr20])])
    if (s !== 'on') return 끝(s)
    // 🍎 구매자 표 없이 사지 않는다 — 표 없는 구매는 «먼저 보낸 계정»이 가져갈 수 있다(10/24 점검)
    if (아이폰인가() && !구매자표()) return 끝('off')
    const d = list[0]
    // ⛔ 가격을 못 받으면 단추를 안 그린다 — 우리가 「990원」을 박아 쓰면 언젠가 틀린다(스토어는 1,000원이다)
    if (!d || !d.price) return 끝('off')
    if (!늦음) set상품(d)
    끝('on')
  }
  useEffect(() => { 살펴보기() }, [])

  const 로그인하자 = async () => {
    set바쁨(true); set탈('')
    try { await 로그인('google.com') } catch { set탈('로그인을 마치지 못했어요. 다시 해 볼래요?') }
    set바쁨(false)
    살펴보기()
  }

  const 사자 = async () => {
    if (바쁨) return
    if (동의필요 && !동의) return
    set바쁨(true); set탈('')
    // ✅ 동의를 «먼저» 서버에 적는다 — 못 적으면 사지 않는다(동의 없이 산 거래는 애플에 사용량을 못 알린다)
    if (동의필요 && !(await 결제동의())) { set바쁨(false); set탈(말.consent); return }
    const 전 = Number(getOcrLeft().paid) || 0
    const 전빚 = 상점빚()
    const r = await buy(SKU.ocr20)
    set바쁨(false)
    if (!r.ok) { if (r.reason !== 'cancel') set탈(말[r.reason] || 말.fail); return }
    // 이번 거래의 서버 답 — 애플은 거래 번호(id) · 구글은 영수증(token)으로 «이번 것»만 찾는다
    //   ⛔ 같은 상품의 다른 답으로 대신하지 않는다 — 예전 구매가 «된» 걸 보고 이번 것도 됐다고 말할 뻔했다(10/24 점검)
    const 답들 = r.synced && Array.isArray(r.synced.results) ? r.synced.results : []
    const 이번 = 답들.find((x) => x && String(x.id != null ? x.id : x.token) === String(r.token)) || null
    if (이번 && 이번.시험한도) { set탈(말.sandbox); return }
    // ⭐ 서버가 열쇠를 넣었는지는 «서버 답»으로만 말한다 — 폰이 추측해서 「들어왔어요」라고 하지 않는다
    // 🎉 위 띠(토스트)는 너무 작았다(창업자 10/23) → 시트 안에서 크게 보여 주고 「확인」으로 닫는다
    if (r.synced && r.synced.ok && 이번 && 이번.ok) {
      const 지금 = Number.isFinite(Number(r.synced.paid)) ? Number(r.synced.paid) : Number(getOcrLeft().paid) || 0
      // 💸 빚이 있었으면 그만큼 먼저 메워져 덜 보인다 — 까닭을 같이 말한다(창업자 10/24 C) · 아직 남은 빚도
      set채운수(전빚 > 0 ? Math.min(전빚, 묶음수) : 0)
      set남은빚(Math.max(0, Number(r.synced.빚) || 0))
      set받은수(Math.max(0, 지금 - 전)); set상태('done'); return
    }
    // 이번 거래가 «안 된» 까닭별로 — 가족 승인 대기는 «아직 결제 전»이다(「결제는 됐어요」라고 하지 않는다)
    const 왜 = 이번 && !이번.ok ? 이번.reason : ''
    set탈(왜 === 'pending' ? 말.pending : 왜 === 'not_this_account' || 왜 === 'other_account' ? 말.other : 말.later)
  }

  return (
    <Portal>
      <div className="sheet-mask" onClick={닫기}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'calc(20px + var(--safe-bottom))' }}>
          <div className="emoji-sheet-head">
            <span>한끼상점</span>
            <button className="press" onClick={닫기} disabled={바쁨} style={{ color: 'var(--text-sub)', fontSize: 16, fontWeight: 600 }}>닫기</button>
          </div>

          <div style={{ padding: '2px 16px 0' }}>
            {/* 상품 칸 — 완료 화면에선 숨긴다(창업자 10/23 「완료에서는 숨기자」) */}
            {상태 !== 'done' && <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--cream)', borderRadius: 14, padding: '12px 14px', marginBottom: 12 }}>
              <img src={uiShop} alt="" aria-hidden="true" draggable={false} style={{ width: 64, height: 'auto', flex: 'none' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>
                  <img src={uiKeyOne} alt="" aria-hidden="true" draggable={false} style={{ width: 18, height: 18, objectFit: 'contain' }} />
                  {KEY_NAME} 20{KEY_UNIT}
                </div>
                <div className="t-sub" style={{ fontSize: 14.5, lineHeight: 1.55, marginTop: 3, wordBreak: 'keep-all' }}>
                  사진 한 장을 AI로 읽을 때 1{KEY_UNIT}씩 써요. 무료 {KEY_NAME}를 다 쓴 뒤에 쓰여요.
                </div>
              </div>
            </div>}

            {상태 === '보는중' && <div className="t-sub" style={{ fontSize: 15, padding: '6px 2px 10px' }}>상점을 여는 중…</div>}
            {상태 === 'slow' && (
              <>
                <div style={{ background: '#f6ece4', color: '#7a4a2c', fontSize: 15.5, fontWeight: 600, lineHeight: 1.55, borderRadius: 11, padding: '10px 12px', marginBottom: 10 }}>연결이 늦어지고 있어요.</div>
                <button className="btn-primary press" style={{ width: '100%' }} onClick={살펴보기}>다시 시도</button>
              </>
            )}

            {상태 === 'done' && (
              <div style={{ textAlign: 'center', padding: '8px 4px 4px' }}>
                <img src={uiKeyOne} alt="" aria-hidden="true" draggable={false} style={{ width: 72, height: 72, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 8 }}>{KEY_NAME} {채운수 ? 묶음수 : 받은수}{KEY_UNIT}가 들어왔어요</div>
                <div className="t-sub" style={{ fontSize: 15, lineHeight: 1.6, marginTop: 6, marginBottom: 16, wordBreak: 'keep-all' }}>
                  {/* 💸 빚부터 메워 덜 보이는 까닭(창업자 10/24 C) */}
                  {남은빚
                    ? `환불된 구매에서 쓴 ${KEY_NAME}를 먼저 채웠어요. 아직 ${남은빚}${KEY_UNIT}가 남아 있어 지금은 AI 읽기를 할 수 없어요.`
                    : 채운수 ? `환불된 구매에서 쓴 ${채운수}${KEY_UNIT}를 먼저 채워 지금 ${받은수}${KEY_UNIT}예요.` : '사진 가져오기에서 바로 쓸 수 있어요.'}
                </div>
                <button className="btn-primary press" style={{ width: '100%' }} onClick={onClose}>확인</button>
              </div>
            )}
            {(상태 === 'unavailable' || 상태 === 'off' || 상태 === 'blocked') && (
              <div style={{ background: '#f6ece4', color: '#7a4a2c', fontSize: 15.5, fontWeight: 600, lineHeight: 1.55, borderRadius: 11, padding: '10px 12px', marginBottom: 10, wordBreak: 'keep-all' }}>{말[상태]}</div>
            )}
            {상태 === 'blocked' && <div className="t-sub" style={{ fontSize: 13.5, lineHeight: 1.65, marginBottom: 4 }}>무료 {KEY_NAME}는 그대로 쓸 수 있어요.</div>}

            {상태 === 'login' && (
              <>
                <div className="t-sub" style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 10 }}>산 {KEY_NAME}는 계정에 담겨요. 폰을 바꿔도 그대로예요.</div>
                {/* 🍎 아이폰은 로그인 방법이 둘(구글·애플)이라 여기서 하나로 정하면 «다른 계정»이 생길 수 있다 → 설정의 로그인으로 보낸다 */}
                {아이폰인가()
                  ? <div style={{ background: 'var(--cream)', borderRadius: 11, padding: '10px 12px', fontSize: 15, lineHeight: 1.55 }}>설정 「로그인하러 가기」에서 로그인한 뒤 다시 열어 주세요.</div>
                  : <button className="btn-primary press" style={{ width: '100%' }} disabled={바쁨} onClick={로그인하자}>{바쁨 ? '잠시만요…' : '로그인하고 사기'}</button>}
              </>
            )}

            {상태 === 'on' && 상품 && (
              <>
                {/* ✅ 아이폰만 — 환불 요청 때 애플이 묻는 «사용량»을 보내려면 동의가 있어야 한다(애플 원문 customerConsented · 창업자 10/23 Ⓐ) */}
                {동의필요 && (
                  <label className="press" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--cream)', borderRadius: 12, padding: '11px 12px', marginBottom: 10, fontSize: 15, lineHeight: 1.55, wordBreak: 'keep-all', cursor: 'pointer' }}>
                    <input type="checkbox" checked={동의} disabled={바쁨} onChange={(e) => set동의(e.target.checked)} style={{ width: 22, height: 22, flex: 'none', marginTop: 1, accentColor: '#b5714a' }} />
                    <span>(필수) 환불을 요청하면 이 구매에서 <b>쓴 {KEY_NAME} 수</b>를 Apple에 알리는 데 동의해요.</span>
                  </label>
                )}
                <button
                  className="press"
                  onClick={사자}
                  disabled={바쁨 || (동의필요 && !동의)}
                  style={{
                    width: '100%', padding: '13px 12px', borderRadius: 14, border: 'none',
                    background: 바쁨 || (동의필요 && !동의) ? '#cbb39f' : '#b5714a', color: '#fff', fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em',
                  }}
                >
                  {바쁨 ? '열쇠를 넣는 중…' : `${상품.price} · 사기`}
                </button>
                {/* 🧾 고지 — 창업자 10/22 ⓐ 「남은 열쇠만 환불」 · 전자상거래법 17조 2항 5호(가분 콘텐츠)·6항(미리 표시) */}
                <div className="t-sub" style={{ fontSize: 13.5, lineHeight: 1.65, marginTop: 10, wordBreak: 'keep-all' }}>
                  산 {KEY_NAME}는 바로 계정에 담겨요. 쓴 {KEY_NAME}는 환불되지 않고, 남은 {KEY_NAME}는 환불을 요청할 수 있어요.
                  {/* 🍎 아이폰은 환불을 «애플»이 한다 — 우리가 해 줄 수 없다(앱스토어 구매 내역에서 요청) */}
                  {' '}{아이폰인가() ? '환불은 App Store 구매 내역에서 요청할 수 있어요.' : '환불은 설정 「도움말 및 문의」로 알려 주세요.'}
                  {/* 🧾 거래기록 열람(전자상거래법 시행령 6조 ②항 · 2026-10-23) — 스토어 구매 내역 ＋ 요청하면 메일로 */}
                  {' '}구매 내역은 {아이폰인가() ? 'App Store' : 'Google Play'}에서 볼 수 있고, 거래 기록이 필요하면 「도움말 및 문의」로 알려 주세요.
                </div>
              </>
            )}

            {탈 && (
              <div style={{ background: '#f6ece4', color: '#7a4a2c', fontSize: 15, fontWeight: 600, lineHeight: 1.55, borderRadius: 11, padding: '10px 12px', marginTop: 10 }}>{탈}</div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  )
}
