import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { 식비열림, 식비적음, 식비예산정함, 식비가게열림 } from '../stats'
import { todayKST } from '../today'
import { useNav } from '../App'
import { useModalBack } from '../useBackHandler'
import Portal from '../components/Portal'
import Icon from '../components/Icon'
import { openExternal } from '../utils'

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

// 📅 달 첫날·끝날 (KST 날짜 글자만 다룬다)
//   📅📅 [2026-09-20 창업자] *"나는 보통 9월 13일-10월 12일 이렇게 계산하거든? 근데 우리앱은 … 정해져있어"*
//   ⭐ 「달」은 «시작일»(store.foodBudget.start · 1~28 · 기본 1)부터 다음 시작일 «하루 전»까지다.
//      시작일 13 → 9/13~10/12 · 1/13~2/12 · 2/13~3/12 — 끝은 저절로라 달 길이와 무관하다(창업자 물음 *"31일인 달이랑 30일 달"*).
//   ⛔ 29~31 은 store 가 안 받는다(2월에 없다). 시작일 1 이면 예전 그대로(1일~말일).
const 두자리 = (n) => String(n).padStart(2, '0')
// 그 날짜가 든 «달 구간»의 첫날 — 오늘이 시작일보다 앞이면 지난달 시작일이 첫날이다
function 달첫날(날짜, 시작일 = 1) {
  const [y, m, d] = 날짜.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, 1))
  if (d < 시작일) t.setUTCMonth(t.getUTCMonth() - 1)
  return `${t.getUTCFullYear()}-${두자리(t.getUTCMonth() + 1)}-${두자리(시작일)}`
}
// 그 구간의 끝날 = 다음 시작일 하루 전 (첫날을 넣는다)
function 달끝날(첫날) {
  const [y, m] = 첫날.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, Number(첫날.slice(8, 10))))
  t.setUTCMonth(t.getUTCMonth() + 1); t.setUTCDate(t.getUTCDate() - 1)
  return t.toISOString().slice(0, 10)
}
const 달보기 = (s) => `${Number(s.slice(5, 7))}월`   // 시작일이 13이면 「9월」= 9/13~10/12 (구간 날짜는 옆에 같이 찍힌다)

export default function FoodCostView() {
  const store = useStore()
  const nav = useNav()
  const [적기, set적기] = useState(null)  // null | 'out' | 'shop'
  // 📊 식비 칸을 «열었다» — 이 판은 view==='cost' 일 때만 붙으니(ShopScreen) 붙는 순간이 곧 연 순간이다
  useEffect(() => { 식비열림() }, [])
  const [지울것, set지울것] = useState(null)
  const [고칠것, set고칠것] = useState(null)  // ✏️ 창업자 2026-09-18 «저기도 수정가능하게»
  const [예산고치기, set예산고치기] = useState(false)
  // 📅📅 [2026-09-17 창업자] *"주별 월별로도 통계 볼수있어? 아님 날짜를 며칠부터 며칠까지 정해서도?"* → 셋 다 된다.
  //   ⭐ 기본은 «주» — 장 보는 리듬이 주라서다. 달·기간은 눌러서 바꾼다.
  //   ⛔ 기록은 «전부» 남아 있다. 여기 8칸·12칸은 «보여주는 범위»일 뿐이다(5년이 쌓여도 안 지운다).
  const [잣대, set잣대] = useState('week')   // week | month | range
  const 시작일 = Math.min(28, Math.max(1, Number(store.foodBudget?.start) || 1))   // 📅 달 시작일(1~28)
  const [시작일고르기, set시작일고르기] = useState(false)
  const [기간, set기간] = useState(() => ({ 부터: 며칠뒤(todayKST(), -29), 까지: todayKST() }))

  const 줄들 = store.foodCost || []

  // 🗓 지금 보는 구간 — 잣대에 따라 갈린다
  const 구간 = 잣대 === 'week'
    ? { 부터: 주의첫날(), 까지: 며칠뒤(주의첫날(), 6), 이름: '이번 주' }
    : 잣대 === 'month'
      ? (() => { const 첫 = 달첫날(오늘(), 시작일); return { 부터: 첫, 까지: 달끝날(첫), 이름: 달보기(첫) } })()
      : { 부터: 기간.부터 <= 기간.까지 ? 기간.부터 : 기간.까지, 까지: 기간.부터 <= 기간.까지 ? 기간.까지 : 기간.부터, 이름: '고른 기간' }

  const 구간줄 = 줄들.filter((e) => e.d >= 구간.부터 && e.d <= 구간.까지)
  const 주합 = 구간줄.reduce((s, e) => s + e.won, 0)
  const 장보기합 = 구간줄.filter((e) => e.k === 'shop').reduce((s, e) => s + e.won, 0)
  const 외식합 = 주합 - 장보기합

  // 📊 막대 — 주면 8주, 달이면 12달. ⛔5년치를 매번 훑지 않는다(관문 3차).
  const 칸들 = []
  if (잣대 === 'month') {
    const 이번첫 = 달첫날(오늘(), 시작일)
    for (let i = 11; i >= 0; i--) {
      const d = new Date(이번첫 + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() - i)   // 시작일이 같으니 달만 뺀다(1~28 이라 안 밀린다)
      const 첫 = d.toISOString().slice(0, 10)
      칸들.push({ 첫, 끝: 달끝날(첫), 이름: 달보기(첫) })
    }
  } else {
    for (let i = 7; i >= 0; i--) {
      const 첫 = 며칠뒤(주의첫날(), -7 * i)
      칸들.push({ 첫, 끝: 며칠뒤(첫, 6), 이름: `${날보기(첫)}~` })
    }
  }
  const 여덟주 = 칸들.map((c) => ({ ...c, 합: 줄들.filter((e) => e.d >= c.첫 && e.d <= c.끝).reduce((s, e) => s + e.won, 0) }))
  const 지난주합 = 여덟주[여덟주.length - 2]?.합 || 0
  const 쓴주 = 여덟주.filter((w) => w.합 > 0)
  const 주평균 = 쓴주.length ? Math.round(쓴주.reduce((s, w) => s + w.합, 0) / 쓴주.length) : 0
  const 제일큰주 = Math.max(1, ...여덟주.map((w) => w.합))
  // ⛔⛔ [2026-09-17 창업자 실물] 첫 주엔 «견줄 것이 없다» — 그런데도 「지난주 없음」·「주 평균 134,000원」이 떴다.
  //    한 주뿐인데 「평균」이라고 말하면 그건 평균이 아니라 «같은 수를 두 번» 보여주는 것이다(거짓말에 가깝다).
  //    ✅ 그래서 쓴 주가 «둘 이상»일 때만 견주기 줄과 8주 막대를 그린다. 그 전엔 조용히 숨긴다.
  const 견줄만한가 = 쓴주.length >= 2
  // 💰 지금 잣대에 맞는 예산 — 주면 주 예산, 달이면 달 예산. 「날짜 고르기」엔 예산이 없다.
  const 예산 = 잣대 === 'month' ? (store.foodBudget?.m || 0) : (store.foodBudget?.w || 0)

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
      {/* 📅 잣대 고르기 — 주(기본) · 달 · 기간. 창업자 2026-09-17 *"주별 월별로도? 날짜를 며칠부터 며칠까지도?"*
            ⛔ [창업자 2026-09-17 *"표시가 안되어있어서 누를 수 있는지 몰겠어"*] 글자만 있으면 «눌러지는 줄» 모른다.
            ✅ 안 고른 칸도 «단추처럼» 보이게 테두리를 주고, 「기간」엔 달력 그림을 붙여 무엇이 나오는지 미리 알린다. */}
      <div className="fc-scale">
        {[['week', '주별'], ['month', '달별'], ['range', '날짜 고르기']].map(([v, 글]) => (
          <button key={v} className={`press ${잣대 === v ? 'on' : ''}`} onClick={() => set잣대(v)}>
            {/* ⛔ 아이콘 이름은 «있는 것»만 쓴다 — 없는 이름을 쓰면 조용히 빈 칸이 뜬다(Icon.jsx 목록에 calendar 가 없다) */}
            {v === 'range' && <Icon name="clock" size={13} color={잣대 === v ? 'var(--brown)' : 'var(--text-sub)'} />}
            {글}
          </button>
        ))}
      </div>
      {/* 📅 달 시작일 — 창업자 2026-09-20 *"9월 13일-10월 12일 이렇게 계산하거든"*. 달별에서만 보인다.
            ⭐ 시작일 하나로 끝난다 — 끝은 «다음 시작일 하루 전»이라 매달 저절로 굴러간다(끝날짜를 손으로 정하면 매달 두 번 만져야 한다). */}
      {잣대 === 'month' && (
        <button className="press fc-mstart" onClick={() => set시작일고르기(true)}>
          {/* 📮 창업자 2026-09-20 *"너무 길어"* → 구간 글자는 뺐다(위 상자에 9.13 ~ 10.12 가 이미 찍힌다) */}
          달 시작 <b>{시작일}일</b> · 바꾸기
        </button>
      )}
      {잣대 === 'range' && (
        <>
          <div className="fc-range-k">보고 싶은 날짜를 고르세요</div>
          <div className="fc-range">
            <input type="date" value={기간.부터} max={오늘()} onChange={(e) => set기간((g) => ({ ...g, 부터: e.target.value }))} />
            <span>~</span>
            <input type="date" value={기간.까지} max={오늘()} onChange={(e) => set기간((g) => ({ ...g, 까지: e.target.value }))} />
          </div>
          {/* ↩︎ 막대를 눌러 들어왔을 때 돌아가는 길 — 없으면 유저가 날짜를 손으로 되돌려야 한다 */}
          <button className="press fc-back" onClick={() => set잣대('week')}>이번 주로 돌아가기</button>
        </>
      )}

      {/* ⭐ 고른 구간 — 제일 크게. 지난 칸·평균을 옆에 둬서 많이 썼는지 «견줄» 수 있게 한다 */}
      <div className="fc-big">
        <div className="fc-k">{구간.이름} 식비 <span className="fc-date">{날보기(구간.부터)} ~ {날보기(구간.까지)}</span></div>
        <div className="fc-v">{돈(주합)}<em>원</em></div>
        {/* 💰💰 [2026-09-18 창업자 *"이번주 식비를 20만원안에서 살기를 했어. 남은 돈 보는 것도 정할 수 있어??"*]
              ⭐ 세웠으면 남은 돈을 «제일 크게» — 마트 앞에서 보는 건 「얼마 썼나」가 아니라 「얼마 남았나」다.
              ⛔ 넘어도 빨강으로 나무라지 않는다 — 주황 한 단계 ＋ 「12,000원 더 썼어요」(설계 관문 2차).
              ⛔ 「날짜 고르기」엔 예산이 없다 — 아무 기간이나 고른 것이라 견줄 예산이 없다. */}
        {잣대 !== 'range' && (예산 > 0 ? (
          <>
            <div className={`fc-bud ${주합 > 예산 ? 'over' : ''}`}>
              <i style={{ width: `${Math.min(100, Math.round((주합 / 예산) * 100))}%` }} />
            </div>
            <div className="fc-bud-s">
              <b>{주합 > 예산 ? `${돈(주합 - 예산)}원 더 썼어요` : `${돈(예산 - 주합)}원 남았어요`}</b>
              <button className="press" onClick={() => set예산고치기(true)}>예산 {돈(예산)}원 · 고치기</button>
            </div>
          </>
        ) : (
          <button className="press fc-bud-new" onClick={() => set예산고치기(true)}>
            {잣대 === 'month' ? '이번 달' : '이번 주'} 예산 정하기
          </button>
        ))}
        {견줄만한가 && (
          <div className="fc-ref">
            {지난주합 > 0 && 잣대 !== 'range' && <span>지난 {잣대 === 'month' ? '달' : '주'} <b>{돈(지난주합)}원</b></span>}
            <span>{잣대 === 'month' ? '달' : '주'} 평균 <b>{돈(주평균)}원</b></span>
          </div>
        )}
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
        {/* 📊 8주 막대 — 쓴 주가 하나뿐이면 나머지 일곱은 납작한 선이라 «허전하기만» 하다(창업자 실물 2026-09-17) */}
        {견줄만한가 && (
          <div className="fc-half">
            <div className="fc-hk">{잣대 === 'month' ? '12달' : '8주'} 흐름</div>
            {/* 👆 [2026-09-17 창업자 *"8주흐름은 누르면 자세히 보여??"*] → 누르면 그 칸만 본다.
                  ⭐ 「기간」 잣대로 바꿔 그 주(달)의 시작·끝을 넣는다 — 화면 하나로 끝나고 새 화면을 안 만든다.
                  ⛔ 빈 칸은 눌러도 소용없다(볼 게 없다) — 눌리지 않게 막는다. */}
            <div className="fc-weeks">
              {여덟주.map((w, i) => (
                <button key={w.첫} type="button" disabled={!w.합}
                  className={`press ${i === 여덟주.length - 1 ? 'now' : ''}`}
                  aria-label={`${w.이름} ${돈(w.합)}원 자세히`}
                  onClick={() => { set기간({ 부터: w.첫, 까지: w.끝 }); set잣대('range') }}>
                  {/* 💵 [2026-09-17 창업자 *"그래프아래 아무것도 안적혀있어서"*] — 막대만 있으면 «무엇을 보는지» 모른다.
                        ⭐ 만원 단위로 줄여 적는다(41,000 → 4). 여덟 칸에 여섯 자리를 넣으면 뭉개진다. */}
                  <em>{w.합 ? Math.round(w.합 / 10000) : ''}</em>
                  <i style={{ height: `${Math.max(3, Math.round((w.합 / 제일큰주) * 34))}px` }} />
                  <span>{잣대 === 'month' ? w.이름.replace('월', '') : Number(w.첫.slice(8, 10))}</span>
                </button>
              ))}
            </div>
            <div className="fc-hs">{잣대 === 'month' ? '달' : '월요일 날짜'} · 만원 · 누르면 그 {잣대 === 'month' ? '달' : '주'}만 봐요</div>
          </div>
        )}
      </div>

      <button className="press fc-out-btn" onClick={() => set적기('out')}>외식·배달 적기</button>

      {/* 📜 적은 줄 — 주(달)마다 묶는다. 「기간」을 고르면 그 안만 한 덩이로 본다. */}
      {(잣대 === 'range' ? [{ 첫: 구간.부터, 끝: 구간.까지, 합: 주합 }] : 여덟주.slice().reverse()).map((w) => {
        const 끝 = w.끝
        const 안 = 줄들.filter((e) => e.d >= w.첫 && e.d <= 끝).sort((a, b) => (a.d < b.d ? 1 : -1))
        if (!안.length) return null
        return (
          <div key={w.첫}>
            <div className="fc-wk-head">
              <span>{날보기(w.첫)} ~ {날보기(끝)}{w.첫 === 구간.부터 && 잣대 !== 'range' ? ` · ${구간.이름}` : ''}</span>
              <b>{돈(w.합)}원</b>
            </div>
            <div className="fc-card">
              {안.map((e) => (
                <div key={e.id} className="fc-row">
                  {/* ✏️ 줄을 누르면 «그 줄 그대로» 적기 시트가 열린다 — 창업자 2026-09-18 «저기도 수정가능하게»
                        ⭐ 누를 수 있다는 걸 «보이게» 한다(오른쪽 연필) — 안 보이면 없는 기능이다(값 칸에서 겪었다). */}
                  <button className="press fc-hit" onClick={() => set고칠것(e)} aria-label={`${날보기(e.d)} ${돈(e.won)}원 고치기`}>
                    <span className="fc-d">{날보기(e.d)} {요일보기(e.d)}</span>
                    {/* 🏷 [2026-09-18 창업자 «메모 잘리는 것도 같이 고쳐줘»] 주인공을 바꿨다.
                          ⛔ 전엔 「갈래 ＋ 메모」가 한 줄을 나눠 써서 «늘 메모가» 잘렸다(「외식·배달 쿠팡…」).
                          ⭐ 갈래는 둘 중 하나라 금액 옆에서 짐작되지만, 메모는 «거기서만» 알 수 있는 것이다.
                             그래서 메모가 있으면 메모를 앞에 두고 갈래를 작게 뒤로 보낸다 — 잘려도 잃는 것이 적다. */}
                    <span className="fc-t">
                      {/* ⛔ flex 안의 «맨 글자»에는 말줄임이 안 걸린다 — 반드시 칸으로 감싼다 */}
                      {e.memo
                        ? (<><span className="fc-m">{e.memo}</span><small>{e.k === 'shop' ? '장보기' : '외식·배달'}</small></>)
                        : (<span className="fc-m">{e.k === 'shop' ? '장보기' : '외식·배달'}</span>)}
                      {e.items?.length > 0 && <small>{e.items.map((x) => x.n).join(' · ')}</small>}
                    </span>
                    <b className="fc-w">{돈(e.won)}원</b>
                    <Icon name="edit" size={14} color="var(--sand)" />
                  </button>
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
      {고칠것 && <적기시트 갈래={고칠것.k} 고칠것={고칠것} 닫기={() => set고칠것(null)} store={store} nav={nav} />}
      {예산고치기 && <예산시트 칸={잣대 === 'month' ? 'm' : 'w'} 지금={예산} 닫기={() => set예산고치기(false)} store={store} nav={nav} />}
      {시작일고르기 && <시작일시트 지금={시작일} 닫기={() => set시작일고르기(false)} store={store} nav={nav} />}
      {지울것 && (
        <지움확인 줄={지울것} 닫기={() => set지울것(null)} 지움={() => { store.removeFoodCost(지울것.id); set지울것(null); nav.showToast('지웠어요') }} />
      )}
    </div>
  )
}

// 🏪🏪 「가서 보고 와서 적기」 — 창업자 2026-09-17 *"내가 자주가는 사이트를 추가할 수 있으면 좋겠어. 가서 보고와서 적게."*
//   ⭐ 장보기 칸은 **앱에 이미 있는 가게 목록**(`store.shops`)을 그대로 쓴다 — 유저가 「가게 편집」으로 더하고 지운 것이
//      여기 그대로 뜬다(규칙 22 = 목록을 손으로 또 적지 않는다). 그래서 «자주 가는 곳»이 사람마다 다르게 된다.
//   ⭐ 외식·배달은 그 목록에 없어서 셋만 기본으로 둔다. 주소는 2026-09-17 에 찾아 확인한 것이다.
//      ⚠️ 이 환경은 사람이 보는 웹을 못 열어 «직접 열어보진 못했다» — 창업자가 눌러 보고 틀리면 고친다.
//   🛒🛒 **쿠팡은 «파트너스 링크가 아니라 그냥 주소»다** (절대원칙 · 창업자 2026-09-15).
//      파트너스 링크를 누르면 그 뒤 24시간 개인 구매가 실적에 섞인다. 여긴 「값 보러 가는」 자리라 그냥 주소로 간다.
//      📮 창업자 2026-09-17 = *"나는 그렇게 해주고 유저들은 링크로. 그래야 우리도 수익이 나지."*
//      → ⏳ 유저에게 열 때 쿠팡을 파트너스 링크로 바꾼다. ⛔단축코드는 창업자만 만들 수 있어 «받아서» 박는다(ingLinks.js 와 같다).
//         지금은 식비가 창업자 열쇠 뒤에만 있어서 전부 그냥 주소다.
// ⌨️ 적는 시트 — 가계부에서 «0·00·000 키»만 가져왔다(수입·이체·결제수단은 안 만든다 · 식비만 보는 앱이라)
// ✏️ `고칠것` 이 있으면 «같은 시트»가 고치는 자리가 된다 — 창업자 2026-09-18 «저기도 수정가능하게»
//   ⭐ 화면을 하나 더 만들지 «않는다» — 적을 때와 고칠 때가 다르게 생기면 그게 또 배울 것이 된다.
function 적기시트({ 갈래, 고칠것, 닫기, store, nav }) {
  useModalBack(닫기)
  const [글, set글] = useState(고칠것 ? String(고칠것.won) : '')
  const [메모, set메모] = useState(고칠것?.memo || '')
  const [k, setK] = useState(갈래)
  const [날, set날] = useState(고칠것?.d || 오늘())
  const [가게추가, set가게추가] = useState(false)
  const [지울가게, set지울가게] = useState(null)
  // 🧮 계산기 모드 — 창업자 2026-09-17 *"계산기 모드도 쓸수있나??"*
  //   ⭐ 여러 곳에서 산 걸 «더해 가며» 한 줄로 적을 때 쓴다(가계부 스샷의 그 방식).
  //   ⛔ 곱하기·나누기는 안 넣는다 — 영수증 값을 더하는 자리라 ＋ 하나면 된다(시끄러우면 안 쓴다)
  const [더한것, set더한것] = useState([])
  // 🏪 갈래에 따라 다른 목록 — 장보기는 «앱의 가게 목록»(유저가 고친 게 그대로), 외식은 배달 앱 셋
  // 🏪 갈래에 맞는 곳만 · «최근 누른 순»으로 앞에 온다(창업자 «자주쓰는 곳을 앞으로»)
  const 가게들 = (store.costShops || []).filter((s) => (s.k === 'out') === (k === 'out')).sort((a, b) => (b.at || 0) - (a.at || 0))
  const 값 = Number(글) || 0
  const 합계값 = 더한것.reduce((s, n) => s + n, 0) + 값
  const 누름 = (키) => {
    if (키 === '⌫') return set글((s) => s.slice(0, -1))
    if (키 === '＋') return 더하기()
    if (키 === '지움') { set더한것([]); return set글('') }
    set글((s) => {
      const 새것 = (s + 키).replace(/^0+/, '')
      return 새것.length > 7 ? s : 새것
    })
  }
  const 저장 = () => {
    if (!합계값) return
    if (고칠것) {
      store.editFoodCost(고칠것.id, { d: 날, k, won: 합계값, memo: 메모 })
      nav.showToast('고쳤어요')
    } else {
      store.addFoodCost({ d: 날, k, won: 합계값, memo: 메모.trim() || undefined })
      식비적음('direct')   // 📊 시트에서 직접 적었다 (⛔고침은 안 센다 · 금액·메모는 안 보낸다)
      nav.showToast('적었어요')
    }
    닫기()
  }
  // 🧮 ＋ = 지금 친 값을 «담아 두고» 칸을 비운다. 다음 영수증을 이어서 친다.
  const 더하기 = () => { if (!값) return; set더한것((a) => [...a, 값]); set글('') }
  return (
    <Portal>
      <div className="sheet-mask" onClick={닫기}>
        <div className="sheet fc-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="fc-seg">
            <button className={`press ${k === 'shop' ? 'on' : ''}`} onClick={() => setK('shop')}>장보기</button>
            <button className={`press ${k === 'out' ? 'on' : ''}`} onClick={() => setK('out')}>외식·배달</button>
          </div>
          {/* 🧮 계산기 — 더한 것이 있으면 위에 줄줄이 보여주고 «합계»를 크게 */}
          {더한것.length > 0 && (
            <div className="fc-calc">
              {더한것.map((n, i) => <span key={i}>{돈(n)}</span>)}
              <span className="plus">＋</span>
              <span>{돈(값)}</span>
            </div>
          )}
          <div className="fc-in">{돈(합계값) || '0'}<b>원</b></div>
          {/* ⭐ 메모는 «안 적어도» 저장된다 — 필수로 하면 3초가 10초가 된다(설계 1차) */}
          <input className="fc-memo" value={메모} onChange={(e) => set메모(e.target.value.slice(0, 40))}
            placeholder={k === 'out' ? '뭐 먹었어요? (안 적어도 돼요)' : '어디서? (안 적어도 돼요)'} />
          {/* 🏪 가서 보고 와서 적기 — 누르면 «새 창»으로 열려 이 시트는 그대로 남는다(적던 금액도 안 날아간다).
                ⭐ 이름은 그 자리에서 메모에 채워 둔다 — 돌아와서 숫자만 치면 끝난다. */}
          {가게들.length > 0 && (
            <div className="fc-shops">
              <div className="fc-shops-k">가서 보고 올까요?</div>
              <div className="fc-shops-row">
                {가게들.map((s) => (
                  <button key={s.id} className="press fc-shop" onClick={() => { set메모(s.name); store.usedCostShop(s.id); 식비가게열림(s.id); openExternal(s.url) }}
                    onContextMenu={(e) => { e.preventDefault(); set지울가게(s) }}>{s.name}</button>
                ))}
                {/* ➕ 자주 가는 곳을 «내가» 더한다 — 이름과 주소만. 꾹 누르면 지운다. */}
                <button className="press fc-shop add" onClick={() => set가게추가(true)}>＋ 추가</button>
              </div>
            </div>
          )}
          <div className="fc-day">
            <button className="press" onClick={() => set날((d) => 며칠뒤(d, -1))}>‹</button>
            <span>{날 === 오늘() ? '오늘' : `${날보기(날)} ${요일보기(날)}`}</span>
            <button className="press" disabled={날 >= 오늘()} onClick={() => set날((d) => (d < 오늘() ? 며칠뒤(d, 1) : d))}>›</button>
          </div>
          <div className="fc-keys">
            {['1', '2', '3', '⌫', '4', '5', '6', '00', '7', '8', '9', '000', '지움', '0', '', '＋'].map((키, i) => (
              키 === ''
                ? <span key={i} />
                : <button key={i} className={`press fc-key${/^(⌫|지움)$/.test(키) ? ' bk' : ''}${/^0{2,3}$/.test(키) ? ' zz' : ''}${키 === '＋' ? ' plus' : ''}`} onClick={() => 누름(키)}>{키}</button>
            ))}
          </div>
          <button className="press fc-save" disabled={!합계값} onClick={저장}>{고칠것 ? '고쳤어요' : '적었어요'}</button>
        </div>
      </div>
      {가게추가 && <가게추가시트 갈래={k} 닫기={() => set가게추가(false)} store={store} nav={nav} />}
      {지울가게 && (
        <지움확인2 이름={지울가게.name} 닫기={() => set지울가게(null)} 지움={() => { store.removeCostShop(지울가게.id); set지울가게(null) }} />
      )}
    </Portal>
  )
}

// 🗑 가게 지우기 확인 — 꾹 누르면 뜬다(실수로 사라지면 안 된다)
function 지움확인2({ 이름, 닫기, 지움 }) {
  useModalBack(닫기)
  return (
    <Portal>
      <div className="sheet-mask" onClick={닫기}>
        <div className="sheet fc-ask" onClick={(e) => e.stopPropagation()}>
          <div className="fc-ask-t">「{이름}」을 목록에서 뺄까요?</div>
          <div className="fc-ask-s">적어둔 식비는 그대로 남아요</div>
          <div className="fc-ask-btns">
            <button className="press" onClick={닫기}>그대로 둘게요</button>
            <button className="press danger" onClick={지움}>뺄게요</button>
          </div>
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

// 🏪➕ 자주 가는 곳 더하기 — 이름·주소만. ⛔우리가 목록을 정하지 않는다(사람마다 다니는 곳이 다르다).
function 가게추가시트({ 갈래, 닫기, store, nav }) {
  useModalBack(닫기)
  const [이름, set이름] = useState('')
  const [주소, set주소] = useState('')
  const 저장 = () => {
    if (!이름.trim() || !주소.trim()) return
    store.addCostShop({ name: 이름, url: 주소, k: 갈래 })
    nav.showToast('더했어요')
    닫기()
  }
  return (
    <Portal>
      <div className="sheet-mask" onClick={닫기}>
        <div className="sheet fc-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="fc-ask-t" style={{ marginBottom: 12 }}>자주 가는 곳 더하기</div>
          {/* ⛔ 시트가 «두 장 겹친다»(적기 시트 위에 이 시트) — 같은 class 를 쓰면 아래 칸이 잡힌다. 이름을 따로 준다. */}
          <input className="fc-memo fc-add-name" value={이름} onChange={(e) => set이름(e.target.value.slice(0, 20))} placeholder="이름 (예: 홈플러스)" />
          <input className="fc-memo fc-add-url" style={{ marginTop: 8 }} value={주소} onChange={(e) => set주소(e.target.value.trim())} placeholder="주소 (예: homeplus.co.kr)" inputMode="url" />
          <div className="fc-hs" style={{ textAlign: 'left', marginTop: 8 }}>주소는 그 앱·사이트를 열었을 때 주소창에 뜨는 글자예요</div>
          <button className="press fc-save" disabled={!이름.trim() || !주소.trim()} onClick={저장}>더할게요</button>
        </div>
      </div>
    </Portal>
  )
}

// 💰⌨️ 예산 정하기 — 창업자 2026-09-18 *"이번주 식비를 20만원안에서 살기를 했어"*
//   ⭐ 빈 칸만 던지지 않는다 — «지난 주(달)에 얼마 썼나»를 먼저 보여준다(가계부 스샷 3번의 그 자리).
//   ⛔ 만 원 미만은 못 넣는다 · 「안 정할래요」로 지운다(막대가 사라진다).
function 예산시트({ 칸, 지금, 닫기, store, nav }) {
  useModalBack(닫기)
  const [글, set글] = useState(지금 ? String(지금) : '')
  const 값 = Number(글) || 0
  const 줄들 = store.foodCost || []
  const 지난 = (() => {
    if (칸 === 'm') {
      const 시작일 = Math.min(28, Math.max(1, Number(store.foodBudget?.start) || 1))
      const d = new Date(달첫날(오늘(), 시작일) + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() - 1)
      const 첫 = d.toISOString().slice(0, 10)
      return 줄들.filter((e) => e.d >= 첫 && e.d <= 달끝날(첫)).reduce((s, e) => s + e.won, 0)
    }
    const 첫 = 며칠뒤(주의첫날(), -7)
    return 줄들.filter((e) => e.d >= 첫 && e.d <= 며칠뒤(첫, 6)).reduce((s, e) => s + e.won, 0)
  })()
  const 누름 = (키) => {
    if (키 === '⌫') return set글((s) => s.slice(0, -1))
    if (키 === '지움') return set글('')
    if (키 === '＋') return
    set글((s) => { const 새것 = (s + 키).replace(/^0+/, ''); return 새것.length > 8 ? s : 새것 })
  }
  return (
    <Portal>
      <div className="sheet-mask" onClick={닫기}>
        <div className="sheet fc-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="fc-ask-t" style={{ marginBottom: 4 }}>{칸 === 'm' ? '이번 달' : '이번 주'} 식비, 얼마 안에 쓸까요?</div>
          <div className="fc-hs" style={{ textAlign: 'left', marginBottom: 10 }}>안 정해도 돼요 · 정하면 남은 돈이 보여요</div>
          <div className="fc-in">{값 ? 돈(값) : '0'}<b>원</b></div>
          {지난 > 0 && <div className="fc-bud-ref">지난 {칸 === 'm' ? '달' : '주'}엔 <b>{돈(지난)}원</b> 썼어요</div>}
          <div className="fc-keys">
            {['1', '2', '3', '⌫', '4', '5', '6', '00', '7', '8', '9', '000', '지움', '0', '', ''].map((키, i) => (
              키 === ''
                ? <span key={i} />
                : <button key={i} className={`press fc-key${/^(⌫|지움)$/.test(키) ? ' bk' : ''}${/^0{2,3}$/.test(키) ? ' zz' : ''}`} onClick={() => 누름(키)}>{키}</button>
            ))}
          </div>
          <button className="press fc-save" disabled={!!값 && 값 < 10000} onClick={() => { store.setFoodBudget(칸, 값); if (값) 식비예산정함(); nav.showToast(값 ? '예산을 정했어요' : '예산을 지웠어요'); 닫기() }}>
            {값 ? (값 < 10000 ? '만 원부터 정할 수 있어요' : '이걸로 할게요') : '안 정할래요'}
          </button>
        </div>
      </div>
    </Portal>
  )
}

// 📅📅 달 시작일 고르기 — 창업자 2026-09-20 *"나는 보통 9월 13일-10월 12일 이렇게 계산하거든"*
//   ⭐ 1~28 만 — 29·30·31 은 2월에 없어서 구간이 깨진다(창업자 물음 *"31일인 달이랑 30일 달이 있을텐데"* → 그래서 시작일만 받는다).
//   ⭐ 고르면 달별 합계·달 예산·12달 흐름·지난 달이 전부 그 구간으로 바뀐다. 적어 둔 기록은 안 건드린다(잣대만 바뀐다).
//   📮 창업자 2026-09-20 *"1-31까지 다 저렇게 해야해? 숫자만 입력한다던가"* → 판 대신 «숫자 한 칸». 치면 그 자리에서 구간을 미리 보여준다.
function 시작일시트({ 지금, 닫기, store, nav }) {
  useModalBack(닫기)
  const [글, set글] = useState(String(지금))
  const 값 = Math.floor(Number(글) || 0)
  const 되나 = 값 >= 1 && 값 <= 28
  const 보기 = (d) => (d === 1 ? '1일 ~ 말일' : `${d}일 ~ 다음 달 ${d - 1}일`)
  const 정하기 = () => { if (!되나) return; store.setFoodMonthStart(값); nav.showToast(`달을 ${보기(값)}로 셀게요`); 닫기() }
  return (
    <Portal>
      <div className="sheet-mask" onClick={닫기}>
        <div className="sheet fc-ask" onClick={(e) => e.stopPropagation()}>
          <div className="fc-ask-t">달은 며칠부터 셀까요?</div>
          <div className="fc-ask-s">월급날 기준으로 살림하면 그 날짜를 적으세요</div>
          <div className="fc-mstart-in">
            <input type="number" inputMode="numeric" min={1} max={28} value={글} autoFocus
              onChange={(e) => set글(e.target.value.replace(/\D/g, '').slice(0, 2))}
              onKeyDown={(e) => { if (e.key === 'Enter') 정하기() }} />
            <span>일부터</span>
          </div>
          <div className="fc-bud-ref">{되나 ? <>→ <b>{보기(값)}</b></> : 글 ? '1~28 사이로 적어주세요 (29·30·31일은 2월에 없어요)' : ' '}</div>
          <div className="fc-ask-btns">
            <button className="press" onClick={닫기}>그대로 둘게요</button>
            <button className="press danger" disabled={!되나} onClick={정하기}>이걸로 할게요</button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
