// 🗑 계정 · 데이터 삭제 시트 — 「클라우드 비우기」 ＋ 「계정 삭제」 (2026-09-08 · 큰 틀 6-① · 창업자 확정 ⓑ *"B로가자"*)
//
// 왜 = 애플 5.1.1(v) = 앱 «안»에서 계정 삭제를 시작할 수 있어야 한다 · Play 도 앱 안 삭제 경로를 요구한다.
//   실측 = `delete-account.html` 이 「설정 → 클라우드 저장 → ［클라우드 비우기］」를 약속했는데 **그 단추가 앱에 없었다**
//   (`클라우드비우기()` 를 부르는 곳 0 · 계획 §12). 이 시트가 그 약속을 «진짜»로 만든다.
//
// ⭐ 셋을 가른다 — ①서버 기록 ②로그인 계정 ③이 폰의 데이터.
//   · 「클라우드 비우기」 = ①만 (로그인 유지)
//   · 「계정 삭제」      = ①＋② (재인증 → 기록 → 계정 · 순서 = `cloud.js 계정삭제()` 주석)
//   · ⛔ ③은 어느 쪽도 «안» 건드린다 — 우리 제일 큰 약속(레시피 보관). 원하면 앱을 지우면 된다(문서에 그대로).
//
// 실수 방지 = 확인은 «같은 시트 안»에서(시트 위에 시트를 겹치면 뒤로가기 층이 꼬인다 · ProfileScreen 주석) ·
//   계정 삭제는 **「삭제」 두 글자 입력** · 진행 중엔 닫기 잠금 · 로그인 안 한 사람에겐 단추를 «숨긴다»(지울 계정이 없다).
// 실패의 모양 = 계정 삭제가 중간에 끊기면 `cloud.js` 가 「기록은 지웠고 계정만 남았어요 · 한 번 더」로 던진다 → 그 글을 그대로 보여준다.
//
// 재현판 = scripts/_repro-계정삭제-0908.mjs

import { useEffect, useState } from 'react'
import Portal from './Portal'
import Icon from './Icon'
import { useModalBack } from '../useBackHandler'
import { 사람지켜보기, 요약, 미리붙기, 클라우드비우기, 계정삭제, 받았다지우기 } from '../cloud'

const 확인글자 = '삭제'

export default function DeleteAccountSheet ({ onClose, showToast }) {
  const [사람, set사람] = useState(undefined)   // undefined = 아직 모름 · null = 로그아웃
  const [구름, set구름] = useState(null)
  const [단계, set단계] = useState('메뉴')       // 메뉴 · 비우기확인 · 삭제확인
  const [입력, set입력] = useState('')
  const [바쁨, set바쁨] = useState('')
  const [탈, set탈] = useState('')

  // ⛔ 진행 중엔 뒤로가기·배경 눌러도 안 닫힌다 — 반쯤 지운 채 화면이 사라지면 유저가 결과를 모른다
  const 닫기 = () => { if (!바쁨) onClose() }
  useModalBack(닫기)

  useEffect(() => { 미리붙기() }, [])   // 재인증 팝업이 «누른 순간» 열리게 미리 받아 둔다(CloudSheet 와 같은 이유)
  useEffect(() => 사람지켜보기(set사람), [])
  useEffect(() => {
    if (!사람) { set구름(null); return }
    let 살아있나 = true
    요약().then((r) => { if (살아있나) set구름(r) }).catch(() => { if (살아있나) set구름(null) })
    return () => { 살아있나 = false }
  }, [사람])

  const 기록수 = 구름?.있나 ? (구름.레시피 || 0) + (구름.일기 || 0) : 0

  const 비우자 = async () => {
    set탈(''); set바쁨('비우기')
    try {
      const r = await 클라우드비우기()
      // ⭐ 「받았다」 표식을 지운다 — 안 지우면 다음 켤 때 «저절로 올리기»가 빈 클라우드를 보고 폰 것을 «다시» 올려 비우기가 무효가 된다
      받았다지우기()
      set구름(await 요약().catch(() => null))
      set단계('메뉴')
      showToast?.(`클라우드 기록 ${Math.max(0, r.지운것 - 1)}건을 지웠어요 · 이 폰의 레시피는 그대로예요`)
    } catch (e) { set탈(고운말(e)) } finally { set바쁨('') }
  }

  const 지우자 = async () => {
    if (입력.trim() !== 확인글자) { set탈(`「${확인글자}」 두 글자를 그대로 입력해 주세요`); return }
    set탈(''); set바쁨('삭제')
    try {
      await 계정삭제()
      showToast?.('계정을 지웠어요 · 이 폰의 레시피는 그대로예요')
      onClose()
    } catch (e) { set탈(고운말(e)) } finally { set바쁨('') }
  }

  const 웹안내 = () => { try { const a = document.createElement('a'); a.href = (import.meta.env.BASE_URL || './') + 'delete-account.html'; a.target = '_blank'; a.rel = 'noopener'; a.click() } catch { /* noop */ } }

  return (
    <Portal>
      <div className="sheet-mask" onClick={닫기}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 22 }}>
          <div className="emoji-sheet-head">
            <span>계정 · 데이터 삭제</span>
            <button className="press" onClick={닫기} disabled={!!바쁨} style={{ color: 'var(--text-sub)', fontSize: 15, fontWeight: 600 }}>닫기</button>
          </div>

          <div style={{ padding: '2px 16px 0' }}>
            {사람 === undefined && <div className="t-sub" style={{ fontSize: 15, padding: '10px 0' }}>준비하는 중…</div>}

            {/* 로그인 안 한 사람 = 지울 계정이 없다 → 단추 없이 사실 한 줄 */}
            {사람 === null && (
              <div style={{ background: 'var(--cream)', borderRadius: 12, padding: '14px 15px', fontSize: 14.5, lineHeight: 1.8 }}>
                로그인하지 않아서 클라우드에 저장된 기록이 없어요.{'\n'}
                <b>이 폰의 데이터는 앱을 지우면 함께 지워져요.</b>
              </div>
            )}

            {사람 && 단계 === '메뉴' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Icon name="cloud" size={20} color="var(--brown)" stroke={2} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: 15.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{사람.이름 || '로그인됨'}</div>
                  <div className="t-sub" style={{ fontSize: 13.5 }}>{구름 == null ? '보는 중…' : `클라우드 기록 ${기록수}건`}</div>
                </div>

                <button className="btn-ghost press" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} disabled={!!바쁨} onClick={() => { set탈(''); set단계('비우기확인') }}>
                  <Icon name="cloud" size={16} color="var(--brown)" /> 클라우드 비우기
                </button>
                <div className="t-sub" style={{ fontSize: 14, lineHeight: 1.5, margin: '7px 2px 12px' }}>
                  클라우드에 저장된 기록만 지워요. <b>로그인은 그대로</b>예요.
                </div>

                <button className="btn-primary press" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--danger)' }} disabled={!!바쁨} onClick={() => { set탈(''); set입력(''); set단계('삭제확인') }}>
                  <Icon name="trash" size={16} color="#fff" /> 계정 삭제
                </button>
                <div className="t-sub" style={{ fontSize: 14, lineHeight: 1.5, margin: '7px 2px 0' }}>
                  클라우드 기록과 <b>로그인 계정을 지워요.</b> 되돌릴 수 없어요.
                </div>
              </>
            )}

            {사람 && 단계 === '비우기확인' && (
              <>
                <div style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 6 }}>클라우드 기록 {기록수}건을 지울까요?</div>
                <div className="t-sub" style={{ fontSize: 14.5, lineHeight: 1.7, marginBottom: 14 }}>이 폰의 레시피·일기는 그대로 남아요. 다음에 「이 폰 것으로 클라우드 덮기」를 누르면 다시 올라가요.</div>
                <button className="btn-primary press" style={{ width: '100%', background: 'var(--danger)' }} disabled={!!바쁨} onClick={비우자}>{바쁨 === '비우기' ? '지우는 중…' : '클라우드 비우기'}</button>
                <button className="press" style={{ width: '100%', marginTop: 10, color: 'var(--text-sub)', fontSize: 15, fontWeight: 600, padding: '8px 0' }} disabled={!!바쁨} onClick={() => set단계('메뉴')}>그만두기</button>
              </>
            )}

            {사람 && 단계 === '삭제확인' && (
              <>
                <div style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 6 }}>계정을 지울까요?</div>
                <div className="t-sub" style={{ fontSize: 14.5, lineHeight: 1.7, marginBottom: 12, whiteSpace: 'pre-line' }}>
                  · 클라우드 기록 {기록수}건과 로그인 계정이 지워져요.{'\n'}
                  · 이 폰의 레시피·일기는 그대로 남아요.{'\n'}
                  · 안전을 위해 <b>한 번 더 로그인</b>을 물어봐요.
                </div>
                <input
                  value={입력} onChange={(e) => set입력(e.target.value)} disabled={!!바쁨}
                  placeholder={`「${확인글자}」 라고 입력`} inputMode="text" autoComplete="off"
                  style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--line)', borderRadius: 12, padding: '12px 14px', fontSize: 16, marginBottom: 10, background: 'var(--card)', color: 'var(--text)' }}
                />
                <button className="btn-primary press" style={{ width: '100%', background: 'var(--danger)' }} disabled={!!바쁨 || 입력.trim() !== 확인글자} onClick={지우자}>{바쁨 === '삭제' ? '지우는 중…' : '계정 삭제'}</button>
                <button className="press" style={{ width: '100%', marginTop: 10, color: 'var(--text-sub)', fontSize: 15, fontWeight: 600, padding: '8px 0' }} disabled={!!바쁨} onClick={() => set단계('메뉴')}>그만두기</button>
              </>
            )}

            {탈 && (
              <div style={{ marginTop: 12, background: 'var(--cream)', borderRadius: 10, padding: '10px 12px', fontSize: 14.5, lineHeight: 1.6, color: 'var(--text)' }}>{탈}</div>
            )}

            {/* 자세한 것(보관 기간·이메일 요청)은 웹 안내로 — 시트에 다 적으면 벽이 된다 */}
            <button className="press" onClick={웹안내} style={{ display: 'flex', alignItems: 'center', gap: 5, width: '100%', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)', color: 'var(--text-sub)', fontSize: 14.5, lineHeight: 1.5, textAlign: 'left' }}>
              <span>보관 기간 · 이메일로 요청하기 <b>자세히</b></span>
              <Icon name="chevron-right" size={15} color="var(--sand)" />
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}

function 고운말 (e) {
  const m = String(e?.message || e || '')
  if (/popup-closed|cancelled|canceled|취소/i.test(m)) return '로그인 창이 닫혀서 아무것도 지우지 않았어요'
  if (/network/i.test(m)) return '인터넷 연결을 확인한 뒤 다시 눌러 주세요 · 아무것도 지우지 않았어요'
  return m || '잠시 뒤 다시 해주세요'
}
