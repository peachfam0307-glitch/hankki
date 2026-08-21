import { useEffect, useState } from 'react'
import Portal from './Portal'
import Icon from './Icon'
import { 로그인, 로그아웃, 사람지켜보기, 요약, 올리기, 내려받기, 미리붙기 } from '../cloud'

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

export default function CloudSheet({ onClose, 백업만들기, 불러오기끝, showToast, 폰레시피, 폰일기 }) {
  const [사람, set사람] = useState(undefined) // undefined = 아직 모름 · null = 로그아웃
  const [구름, set구름] = useState(null) // { 있나, 언제, 레시피, 일기 }
  const [바쁨, set바쁨] = useState('')
  const [탈, set탈] = useState('')

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

  const 감싸기 = async (무엇, 하기) => {
    set탈(''); set바쁨(무엇)
    try { await 하기() } catch (e) { set탈(고운말(e)) } finally { set바쁨('') }
  }

  const 눌러로그인 = () => 감싸기('로그인', async () => { await 로그인() })

  const 올리자 = () => 감싸기('올리기', async () => {
    const 백업 = await 백업만들기()
    const r = await 올리기(백업)
    set구름(await 요약())
    const 뒤 = r.건너뛴것.length ? ` · ${r.건너뛴것.length}개는 너무 커서 못 올렸어요` : ''
    showToast(`클라우드에 올렸어요${뒤}`)
  })

  const 내려받자 = () => 감싸기('내려받기', async () => {
    const data = await 내려받기()
    if (!data) { set탈('클라우드에 아직 아무것도 없어요'); return }
    불러오기끝(data) // ⭐ 백업 불러오기와 «같은 흐름» — 잠긴 일기 비번 묻기까지 여기서 처리된다
    onClose()
  })

  const 나가자 = () => 감싸기('로그아웃', async () => { await 로그아웃(); set구름(null) })

  return (
    <Portal>
      <div className="sheet-mask" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 22 }}>
          <div className="emoji-sheet-head">
            <span>클라우드 저장</span>
            <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
          </div>

          <div style={{ padding: '2px 16px 0' }}>
            {사람 === undefined && <div className="t-sub" style={{ fontSize: 13, padding: '10px 0' }}>준비하는 중…</div>}

            {사람 === null && (
              <>
                <div className="t-sub" style={{ fontSize: 13, lineHeight: 1.65, marginBottom: 12, whiteSpace: 'pre-line' }}>
                  지금 레시피는 <b>이 폰 안에만</b> 있어요.{'\n'}구글 계정에 매어 두면 <b>새 폰·패드에서도 그대로</b> 나와요.
                </div>
                <div style={{ background: 'var(--cream)', borderRadius: 12, padding: '12px 13px', marginBottom: 14, fontSize: 12.5, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                  <b style={{ color: 'var(--brown)' }}>미리 알아둘 것</b>{'\n'}
                  · <b>사진은 안 올라가요</b> — 글자만 올려요. 사진은 폰과 백업 파일에 그대로 있어요{'\n'}
                  · <b>저절로 안 해요</b> — 눌러야 올라가고 눌러야 내려와요{'\n'}
                  · 잠가둔 일기는 <b>잠긴 채로</b> 올라가요
                </div>
                <button className="btn-primary press" disabled={!!바쁨} onClick={눌러로그인}>
                  {바쁨 === '로그인' ? '기다려 주세요…' : '구글로 로그인'}
                </button>
              </>
            )}

            {사람 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <Icon name="cloud" size={20} color="var(--brown)" stroke={2} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {사람.이름 || '로그인됨'}
                  </div>
                  <button className="press" disabled={!!바쁨} onClick={나가자} style={{ color: 'var(--text-sub)', fontSize: 12.5, fontWeight: 600 }}>로그아웃</button>
                </div>

                {/* ⭐⭐ 두 판을 «나란히» 보여준다 — 이게 「고르게 한다」의 실체다 */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  <판 제목="📱 이 폰" 레시피={폰레시피} 일기={폰일기} 언제="지금" />
                  <판
                    제목="☁️ 클라우드"
                    레시피={구름?.있나 ? 구름.레시피 : 0}
                    일기={구름?.있나 ? 구름.일기 : 0}
                    언제={구름 == null ? '보는 중…' : 구름.있나 ? 때(구름.언제) : '아직 비었어요'}
                  />
                </div>

                <button className="btn-primary press" disabled={!!바쁨} onClick={올리자}>
                  {바쁨 === '올리기' ? '올리는 중…' : '📱 이 폰 것으로 클라우드 덮기'}
                </button>
                <div className="t-sub" style={{ fontSize: 11.5, lineHeight: 1.5, margin: '7px 2px 12px' }}>
                  클라우드에 있던 건 <b>이 폰 것으로 바뀌어요.</b>
                </div>

                <button className="btn-ghost press" style={{ width: '100%' }} disabled={!!바쁨 || !구름?.있나} onClick={내려받자}>
                  {바쁨 === '내려받기' ? '내려받는 중…' : '☁️ 클라우드 것으로 이 폰 덮기'}
                </button>
                <div className="t-sub" style={{ fontSize: 11.5, lineHeight: 1.5, margin: '7px 2px 0' }}>
                  이 폰에 있던 건 <b>클라우드 것으로 바뀌어요.</b> 남기고 싶은 게 있으면 <b>먼저 위 단추</b>를 눌러 올려두세요.
                </div>
              </>
            )}

            {탈 && (
              <div style={{ marginTop: 12, background: 'var(--cream)', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, lineHeight: 1.6, color: 'var(--text)' }}>
                {탈}
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  )
}

function 판({ 제목, 레시피, 일기, 언제 }) {
  return (
    <div style={{ flex: 1, background: 'var(--cream)', borderRadius: 12, padding: '11px 12px' }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--brown)' }}>{제목}</div>
      <div style={{ fontSize: 13, marginTop: 5, lineHeight: 1.5 }}>
        레시피 <b>{레시피}</b><br />일기 <b>{일기}</b>
      </div>
      <div className="t-sub" style={{ fontSize: 11, marginTop: 4 }}>{언제}</div>
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
