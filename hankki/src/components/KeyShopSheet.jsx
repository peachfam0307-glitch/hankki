import { useEffect, useState } from 'react'
import Portal from './Portal'
import { useModalBack } from '../useBackHandler'
import { SKU, buy, canBuy, details, 아이폰인가 } from '../billing'
import { 결제상태, getOcrLeft, KEY_NAME, KEY_UNIT } from '../ocr'
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
}

export default function KeyShopSheet ({ onClose, showToast }) {
  const [상태, set상태] = useState('보는중')   // 보는중 · unavailable · login · off · on
  const [상품, set상품] = useState(null)       // { price, title } — 구글이 준 값
  const [바쁨, set바쁨] = useState(false)
  const [탈, set탈] = useState('')
  const 닫기 = () => { if (!바쁨) onClose() }
  useModalBack(닫기)

  const 살펴보기 = async () => {
    set상태('보는중'); set탈('')
    if (!(await canBuy())) { set상태('unavailable'); return }
    const s = await 결제상태()
    if (s !== 'on') { set상태(s); return }
    const d = (await details([SKU.ocr20]))[0]
    // ⛔ 가격을 못 받으면 단추를 안 그린다 — 우리가 「990원」을 박아 쓰면 언젠가 틀린다(스토어는 1,000원이다)
    if (!d || !d.price) { set상태('off'); return }
    set상품(d); set상태('on')
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
    set바쁨(true); set탈('')
    const 전 = Number(getOcrLeft().paid) || 0
    const r = await buy(SKU.ocr20)
    set바쁨(false)
    if (!r.ok) { if (r.reason !== 'cancel') set탈(말[r.reason] || 말.fail); return }
    const 지금 = Number(getOcrLeft().paid) || 0
    // ⭐ 서버가 열쇠를 넣었는지는 «서버 답»으로만 말한다 — 폰이 추측해서 「들어왔어요」라고 하지 않는다
    if (r.synced && r.synced.ok && 지금 > 전) { showToast?.(`${KEY_NAME} ${지금 - 전}${KEY_UNIT}가 들어왔어요`); onClose(); return }
    set탈(말.later)
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--cream)', borderRadius: 14, padding: '12px 14px', marginBottom: 12 }}>
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
            </div>

            {상태 === '보는중' && <div className="t-sub" style={{ fontSize: 15, padding: '6px 2px 10px' }}>상점을 여는 중…</div>}
            {(상태 === 'unavailable' || 상태 === 'off') && (
              <div style={{ background: '#f6ece4', color: '#7a4a2c', fontSize: 15.5, fontWeight: 600, lineHeight: 1.55, borderRadius: 11, padding: '10px 12px', marginBottom: 10 }}>{말[상태]}</div>
            )}

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
                <button
                  className="press"
                  onClick={사자}
                  disabled={바쁨}
                  style={{
                    width: '100%', padding: '13px 12px', borderRadius: 14, border: 'none',
                    background: 바쁨 ? '#cbb39f' : '#b5714a', color: '#fff', fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em',
                  }}
                >
                  {바쁨 ? '열쇠를 넣는 중…' : `${상품.price} · 사기`}
                </button>
                {/* 🧾 고지 — 창업자 10/22 ⓐ 「남은 열쇠만 환불」 · 전자상거래법 17조 2항 5호(가분 콘텐츠)·6항(미리 표시) */}
                <div className="t-sub" style={{ fontSize: 13.5, lineHeight: 1.65, marginTop: 10, wordBreak: 'keep-all' }}>
                  산 {KEY_NAME}는 바로 계정에 담겨요. 쓴 {KEY_NAME}는 환불되지 않고, 남은 {KEY_NAME}는 환불을 요청할 수 있어요.
                  {/* 🍎 아이폰은 환불을 «애플»이 한다 — 우리가 해 줄 수 없다(앱스토어 구매 내역에서 요청) */}
                  {아이폰인가() ? '환불은 App Store 구매 내역에서 요청할 수 있어요.' : '환불은 설정 「도움말 및 문의」로 알려 주세요.'}
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
