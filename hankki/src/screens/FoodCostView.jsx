import { useState } from 'react'
import { useStore } from '../store'
import { todayKST } from '../today'
import { useNav } from '../App'
import { useModalBack } from '../useBackHandler'
import Portal from '../components/Portal'
import Icon from '../components/Icon'

// 💰💰 식비 «보는 곳» — 장보기 탭 셋째 칸 (2026-09-17 시제품 · hold · ⏳창업자 판정 전)
//
//   📮 창업자 = *"주단위로 계획하는거랑 …"* · *"통계보기랑 외식적고 이런 것들"*
//   🔒 설계 관문 통과 2026-09-17 21:3x (1차 주 잣대·빈 화면 / 2차 X 는 묻고 지움·월요일 시작 / 3차 최근 8주만)
//
//   ⭐⭐ **잣대는 «주»다** — 창업자 2026-09-17 *"주단위로 계획하는거"*.
//      장 보는 리듬이 주 단위라, 마트 가기 «직전»에 쓸모있는 말은 「이번 달 32만 썼다」가 아니라
//      **「이번 주 8만 중 3만 남았다」** 이기 때문이다. 달은 아래에 작게만 둔다.
//
//   ⛔⛔ **「집밥 한 끼에 얼마」는 안 그린다** (창업자 2026-09-17 *"계산이 되는 건지? 멘트가 맞는건지"*)
//      장 본 걸론 아침·간식·도시락도 먹는데 분모(「만들었어요」 누른 수)는 저녁 몇 번뿐이라 **늘 부푼다**.
//      ✅ 대신 **「하루 식비」**(합 ÷ 날수)만 쓴다 — 적은 숫자로만 나오는 값이라 안 틀린다.
//
//   ⛔ 숫자는 **적은 것만**으로 셈한다. 안 적은 장보기는 0 이 아니라 «모르는 것»이라 조르지 않고 그냥 뺀다.

const 돈 = (n) => (n || 0).toLocaleString('ko-KR')

// 📅 날짜 계산 — ⛔「오늘」은 여기서 만들지 않는다. 절대원칙 27 = `src/today.js` 의 todayKST() 한 곳뿐.
//    (2026-09-17 에 여기서 직접 만들었다가 `check-kst` 게이트가 잡았다 — 게이트가 값을 했다)
const 오늘 = () => todayKST()
// 🗓 'YYYY-MM-DD' 에 며칠을 더한다(빼면 음수) — 이미 만들어진 «날짜 글자»를 옮기는 것이라 시간대와 무관하다.
function 며칠뒤(날짜, n) {
  const d = new Date(날짜 + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
// 📅 그 날짜가 든 주의 «월요일»
function 주의첫날(날짜 = 오늘()) {
  const 요일 = (new Date(날짜 + 'T00:00:00Z').getUTCDay() + 6) % 7 // 월=0
  return 며칠뒤(날짜, -요일)
}
const 날보기 = (s) => `${Number(s.slice(5, 7))}.${Number(s.slice(8, 10))}`
const 요일보기 = (s) => '일월화수목금토'[new Date(s + 'T00:00:00Z').getUTCDay()]

export default function FoodCostView() {
  const store = useStore()
  const nav = useNav()
  const [적기, set적기] = useState(null)  // null | 'out' | 'shop'
  const [지울것, set지울것] = useState(null)

  const 줄들 = store.foodCost || []
  const 이번주 = 주의첫날()
  const 주끝 = 며칠뒤(이번주, 6)
  const 이번주줄 = 줄들.filter((e) => e.d >= 이번주 && e.d <= 주끝)
  const 주합 = 이번주줄.reduce((s, e) => s + e.won, 0)
  const 장보기합 = 이번주줄.filter((e) => e.k === 'shop').reduce((s, e) => s + e.won, 0)
  const 외식합 = 주합 - 장보기합

  // 📊 최근 8주 — ⛔5년치를 매번 훑지 않는다(관문 3차). 8주 밖은 안 보여준다.
  const 여덟주 = []
  for (let i = 7; i >= 0; i--) {
    const 첫 = 며칠뒤(이번주, -7 * i)
    const 끝 = 며칠뒤(첫, 6)
    여덟주.push({ 첫, 합: 줄들.filter((e) => e.d >= 첫 && e.d <= 끝).reduce((s, e) => s + e.won, 0) })
  }
  const 지난주합 = 여덟주[6]?.합 || 0
  const 쓴주 = 여덟주.filter((w) => w.합 > 0)
  const 주평균 = 쓴주.length ? Math.round(쓴주.reduce((s, w) => s + w.합, 0) / 쓴주.length) : 0
  const 제일큰주 = Math.max(1, ...여덟주.map((w) => w.합))

  // 🍚 하루 식비 = 「기록이 있는 날」 기준. ⛔안 적은 날을 0 으로 세면 값이 반토막 난다.
  const 최근28 = 며칠뒤(오늘(), -27)
  const 최근줄 = 줄들.filter((e) => e.d >= 최근28)
  const 적은날수 = new Set(최근줄.map((e) => e.d)).size
  const 하루 = 적은날수 >= 7 ? Math.round(최근줄.reduce((s, e) => s + e.won, 0) / 28) : null

  if (!줄들.length) {
    return (
      <div className="fc-empty">
        <div className="fc-empty-t">아직 적은 식비가 없어요</div>
        <div className="fc-empty-s">장보기에서 재료 옆에 <b>값</b>을 적으면 여기 모여요</div>
        <button className="press fc-out-btn" onClick={() => set적기('out')}>외식·배달 적기</button>
        {적기 && <적기시트 갈래={적기} 닫기={() => set적기(null)} store={store} nav={nav} />}
      </div>
    )
  }

  return (
    <div className="fc">
      {/* ⭐ 이번 «주» — 제일 크게. 지난주·평균을 옆에 둬서 많이 썼는지 «견줄» 수 있게 한다 */}
      <div className="fc-big">
        <div className="fc-k">이번 주 식비 <span className="fc-date">{날보기(이번주)} ~ {날보기(주끝)}</span></div>
        <div className="fc-v">{돈(주합)}<em>원</em></div>
        <div className="fc-ref">
          <span>지난주 <b>{지난주합 ? 돈(지난주합) + '원' : '없음'}</b></span>
          <span>주 평균 <b>{주평균 ? 돈(주평균) + '원' : '없음'}</b></span>
        </div>
      </div>

      {/* 🥕🍜 갈래 둘 — 막대가 한 색이 될 수 있어 «숫자를 같이» 적는다(관문 2차) */}
      <div className="fc-ratio">
        <div className="fc-bar">
          {장보기합 > 0 && <i className="a" style={{ width: `${Math.round((장보기합 / Math.max(1, 주합)) * 100)}%` }} />}
          {외식합 > 0 && <i className="b" style={{ width: `${Math.round((외식합 / Math.max(1, 주합)) * 100)}%` }} />}
        </div>
        <div className="fc-ratio-s">
          <span><b className="dot a" />장보기 {돈(장보기합)}원</span>
          <span><b className="dot b" />외식·배달 {돈(외식합)}원</span>
        </div>
      </div>

      <div className="fc-two">
        <div className="fc-half">
          <div className="fc-hk">하루 식비</div>
          {하루 ? <div className="fc-hv">{돈(하루)}<em>원</em></div> : <div className="fc-hwait">일주일 적으면 나와요</div>}
          {하루 && <div className="fc-hs">최근 4주로 셈했어요</div>}
        </div>
        <div className="fc-half">
          <div className="fc-hk">8주 흐름</div>
          <div className="fc-weeks">
            {여덟주.map((w, i) => (
              <b key={w.첫} className={i === 7 ? 'now' : ''} style={{ height: `${Math.max(3, Math.round((w.합 / 제일큰주) * 44))}px` }} />
            ))}
          </div>
          <div className="fc-hs">주마다 얼마 썼나</div>
        </div>
      </div>

      <button className="press fc-out-btn" onClick={() => set적기('out')}>외식·배달 적기</button>

      {/* 📜 적은 줄 — 주마다 묶는다. ⛔8주 밖은 안 그린다(관문 3차) */}
      {여덟주.slice().reverse().map((w) => {
        const 끝 = 며칠뒤(w.첫, 6)
        const 안 = 줄들.filter((e) => e.d >= w.첫 && e.d <= 끝).sort((a, b) => (a.d < b.d ? 1 : -1))
        if (!안.length) return null
        return (
          <div key={w.첫}>
            <div className="fc-wk-head">
              <span>{날보기(w.첫)} ~ {날보기(끝)}{w.첫 === 이번주 ? ' · 이번 주' : ''}</span>
              <b>{돈(w.합)}원</b>
            </div>
            <div className="fc-card">
              {안.map((e) => (
                <div key={e.id} className="fc-row">
                  <span className="fc-d">{날보기(e.d)} {요일보기(e.d)}</span>
                  <span className="fc-t">
                    {e.k === 'shop' ? '장보기' : '외식·배달'}
                    {e.memo && <small>{e.memo}</small>}
                    {e.items?.length > 0 && <small>{e.items.map((x) => x.n).join(' · ')}</small>}
                  </span>
                  <b className="fc-w">{돈(e.won)}원</b>
                  <button className="icon-btn press" onClick={() => set지울것(e)} aria-label="지우기">
                    <Icon name="x" size={16} color="var(--sand)" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {적기 && <적기시트 갈래={적기} 닫기={() => set적기(null)} store={store} nav={nav} />}
      {지울것 && (
        <지움확인 줄={지울것} 닫기={() => set지울것(null)} 지움={() => { store.removeFoodCost(지울것.id); set지울것(null); nav.showToast('지웠어요') }} />
      )}
    </div>
  )
}

// ⌨️ 적는 시트 — 가계부에서 «0·00·000 키»만 가져왔다(수입·이체·결제수단은 안 만든다 · 식비만 보는 앱이라)
function 적기시트({ 갈래, 닫기, store, nav }) {
  useModalBack(닫기)
  const [글, set글] = useState('')
  const [메모, set메모] = useState('')
  const [k, setK] = useState(갈래)
  const [날, set날] = useState(오늘())
  const 값 = Number(글) || 0
  const 누름 = (키) => {
    if (키 === '⌫') return set글((s) => s.slice(0, -1))
    if (키 === '지움') return set글('')
    set글((s) => {
      const 새것 = (s + 키).replace(/^0+/, '')
      return 새것.length > 7 ? s : 새것
    })
  }
  const 저장 = () => {
    if (!값) return
    store.addFoodCost({ d: 날, k, won: 값, memo: 메모.trim() || undefined })
    nav.showToast('적었어요')
    닫기()
  }
  return (
    <Portal>
      <div className="sheet-mask" onClick={닫기}>
        <div className="sheet fc-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="fc-seg">
            <button className={`press ${k === 'shop' ? 'on' : ''}`} onClick={() => setK('shop')}>장보기</button>
            <button className={`press ${k === 'out' ? 'on' : ''}`} onClick={() => setK('out')}>외식·배달</button>
          </div>
          <div className="fc-in">{값 ? 돈(값) : '0'}<b>원</b></div>
          {/* ⭐ 메모는 «안 적어도» 저장된다 — 필수로 하면 3초가 10초가 된다(설계 1차) */}
          <input className="fc-memo" value={메모} onChange={(e) => set메모(e.target.value.slice(0, 40))}
            placeholder={k === 'out' ? '뭐 먹었어요? (안 적어도 돼요)' : '어디서? (안 적어도 돼요)'} />
          <div className="fc-day">
            <button className="press" onClick={() => set날((d) => 며칠뒤(d, -1))}>‹</button>
            <span>{날 === 오늘() ? '오늘' : `${날보기(날)} ${요일보기(날)}`}</span>
            <button className="press" disabled={날 >= 오늘()} onClick={() => set날((d) => (d < 오늘() ? 며칠뒤(d, 1) : d))}>›</button>
          </div>
          <div className="fc-keys">
            {['1', '2', '3', '⌫', '4', '5', '6', '00', '7', '8', '9', '000', '', '0', '', '지움'].map((키, i) => (
              키 === ''
                ? <span key={i} />
                : <button key={i} className={`press fc-key${/^(⌫|지움)$/.test(키) ? ' bk' : ''}${/^0{2,3}$/.test(키) ? ' zz' : ''}`} onClick={() => 누름(키)}>{키}</button>
            ))}
          </div>
          <button className="press fc-save" disabled={!값} onClick={저장}>적었어요</button>
        </div>
      </div>
    </Portal>
  )
}

// 🗑 지우기는 «묻고» 지운다 — 목록에서 손가락이 스치면 기록이 사라진다(관문 2차)
function 지움확인({ 줄, 닫기, 지움 }) {
  useModalBack(닫기)
  return (
    <Portal>
      <div className="sheet-mask" onClick={닫기}>
        <div className="sheet fc-ask" onClick={(e) => e.stopPropagation()}>
          <div className="fc-ask-t">이 기록을 지울까요?</div>
          <div className="fc-ask-s">{날보기(줄.d)} · {줄.k === 'shop' ? '장보기' : '외식·배달'} · {돈(줄.won)}원</div>
          <div className="fc-ask-btns">
            <button className="press" onClick={닫기}>그대로 둘게요</button>
            <button className="press danger" onClick={지움}>지울게요</button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
