import { Fragment, useMemo, useRef, useState } from 'react'
import { COACH } from '../coach'
import { useStore } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import TabTips from '../components/TabTips'
import TabTalk from '../components/TabTalk'
import PromptSheet from '../components/PromptSheet'
import ConfirmSheet from '../components/ConfirmSheet'
import FoodIcon, { guessFoodIcon, dishCatOf } from '../components/FoodIcon'
// 🔖 인덱스 = 창업자가 고른 요리사모자 클립 (`ck_27` · 2026-08-18 확정)
//    📮 *"하나만 고른다면 요리사모자(아무것도 없는거)"* · *"그러자 1개만 넣자. 제일 깔끔하긴해"*
import idxChef from '../assets/ui/idx_chef.png'
// ⭐⭐ [2026-08-18 창업자] 안 걸린 칸 = **같은 모자의 «연한 판»**
//    📮 *"연한책갈피가 **모양이 같지 않아서 안누르고 싶게 생기지 않아??**
//        인덱스를 붙이는 자리에다 **연한요리사모자**를 만들면??"*
//    ⭐ 정확한 지적이었다 — 안 걸림이 «책갈피(∪)» 이고 걸림이 «요리사모자» 라
//       **모양이 아예 달라서 「누르면 이게 저렇게 된다」가 안 읽힌다.**
//       유저는 책갈피가 채워질 거라 예상하는데 엉뚱한 게 나온다.
//    🔬 만드는 법 셋을 견줬다 — ⓐ외곽선만 · ⓑ통째로 30% · ⓒ실루엣
//       ✅ⓐ = 지금 책갈피와 «같은 문법»(선화)이라 안 튀고 26px 에서도 형태가 보인다
//       ⛔ⓑ = 창업자가 이미 거부한 흐릿함(*"흐림은 네말대로 지저분해보여"*)
//       ⛔ⓒ = 26px 에선 뭉개진 덩어리라 뭔지 모른다
import idxChefFaint from '../assets/ui/idx_chef_faint.png'
// ⛔ 2026-08-07 — 「요리 기록 남기기」 시트와 「한마디 청하기」를 이 화면에서 뺐다.
//    앨범을 누르면 «그날 일기»로 가고(화면 이름이 「한끼 일기」다), 둘 다 «레시피 상세»에 그대로 있다.
//    (DiaryEntrySheet · ReviewAskSheet · shouldAskReview import 제거)
import { dateLabel, matchKo } from '../utils'
// 📺 「영상」 칩이 쓰는 잣대 — 상세에서 재생하는 것과 «같은 자»다(절대원칙 30)
import { embedUrl } from '../embed'
// 📺 이 화면에서 묻는 것은 «둘»이고, 자도 «둘»이다 — 이름으로 갈라 둔다(⛔같은 걸로 착각하지 말 것).
//
// ⭐⭐ [창업자 확정 2026-09-03] 칩 이름 = **「SNS」**. 📮 창업자 = *"ⓐ로 가자"*
//   ⛔ 왜 「영상」이 아닌가 — 우리가 고르는 잣대는 **「출처 링크가 붙었나」**지 「재생되나」가 아니다.
//      **인스타 편은 앱에서 재생이 «안 된다»**(정책상 · `RecipeDetailScreen.jsx` 참조) → 원본 링크로 나간다.
//      그런데도 SNS 요리다. 「영상」으로 이름 붙이면 **인스타 편이 뜨는 순간 이름이 틀려진다.**
//   ⭐ 앱이 이미 그렇게 쓴다 — 가져오기 화면 「SNS 보다가 캡처해서 바로 한끼로」(`ImportScreen.jsx:86`).
//   ⭐ 홈의 「SNS 요리」 상자와 **같은 말**이다(창업자 = *"홈에도 이름 통일해야하는데"*).
//   ⛔ 「영상으로 보기」 단추는 «안» 건드린다 — 거긴 진짜 재생되는 자리라 맞는 말이다.
//
// ⑴ SNS에서 온 편인가 — 칩 개수·거르기가 쓴다. 매체를 안 가린다(유튜브·인스타·앞으로 뭐든).
const SNS인가 = (r) => !!(r?.sourceUrl || '').trim()
// ⑵ 앱에서 «재생»되는가 — 썸네일 ▶ 표가 쓴다. ⛔인스타는 재생이 안 되므로 ▶ 를 붙이지 않는다
//    (▶ 를 붙여 놓고 눌렀는데 안 나오면 그게 거짓말이다).
const 영상인가 = (r) => embedUrl(r?.sourceUrl || '')?.type === 'youtube'
import { useBackHandler } from '../useBackHandler'
import CoachMarks, { needsCoach } from '../components/CoachMarks'
import gomHeader from '../assets/gom-header.png' // 뉴 물결 꼬르곰(인사) — 레시피 탭 상단 마스코트
import pengNyam from '../assets/ui/wave/peng_nyam1.png' // 🐧 펭펭(한 술) — 한끼 일기 상단
// 🔖 이름은 «한 곳»에서만 온다(`src/favName.js`)
import { FAV_NAME, FAV_ADD, FAV_REMOVE } from '../favName'
// 🖼 일기 사진이 「큰 창고」에 있으면 쪽지(`idb://…`)다 — 달력·앨범도 꺼내서 그려야 한다
import StoredImg from '../photoView'

// 레시피 탭 첫 방문 코치마크 — 모아보기·요리 기록 세그먼트 안내
const MYRECIPES_COACH_KEY = COACH.myrecipes
const MYRECIPES_COACH_STEPS = [
  { sel: '[data-coach="collection"]', label: '모아보기', desc: '저장한 레시피를 한눈에 · 폴더·카테고리로 정리돼요' },
  { sel: '[data-coach="gridsize"]', label: '⊞ 보기 바꾸기', desc: '크게 2줄 ↔ 촘촘히 3줄 · 사진 큼직하게 보거나 한눈에 많이 보거나' },
  { sel: '[data-coach="log"]', label: '한끼 일기', desc: '요리하고 "만들었어요!" 한 번이면 별점·사진·팁이 쌓여요 · 다음엔 "그때 그 맛" 그대로 재현!' },
]

// 📔 「일기」 탭 코치 — ⛔예전엔 «없었다.**
//   하단바에서 「레시피」와 「일기」가 따로 선 탭인데 **코치 키를 같이 썼다**(`COACH.myrecipes`).
//   레시피 탭을 먼저 본 사람은 일기 탭에서 안내가 영영 안 떴고, 뜬다 해도 내용이
//   「모아보기·보기 바꾸기」라 **달력도 일기 쓰기도 한 줄도 안 알려줬다.**
//   (창업자 2026-08-10 *"한끼일기는 눌러도안내코치가 없네"*)
const DIARY_COACH_KEY = COACH.diary
const DIARY_COACH_STEPS = [
  { sel: '[data-coach="cal"]', label: '요리 달력', desc: '요리한 날엔 그날 만든 음식이 떠요 · 날짜를 누르면 그날 일기로 바로 가요' },
  { sel: '[data-coach="diary-write"]', label: '오늘 일기 쓰기', desc: '속지를 고르고 · 일기를 쓰고 · 스티커로 예쁘게 꾸며요' },
]

// 카테고리와 연결된 기본 폴더 — 삭제 불가(사용자가 만든 폴더만 지울 수 있게)
// ⛔⛔ 여기와 `theme.js` 의 `CATEGORIES` 는 «같이» 고쳐야 한다 — 하나만 고치면
//    칩엔 있는데 폴더가 «지워지는» 갈래가 생긴다. 2026-09-03 에 중식을 넣으며 둘 다 고쳤다.
const DEFAULT_FOLDERS = new Set(['한식', '중식', '양식', '일식', '간식', '아시안'])

const dayKey = (ts) => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}
// 🗓 달 키 — `dayKey` 의 앞 두 토막과 «같은 모양»이라 `dayFilter` 를 잘라 그대로 견줄 수 있다.
//   ⛔ 달 이름을 글자로 만들지 말 것(「8월」) — 해가 넘어가면 작년 8월과 섞인다.
const ymKey = (ts) => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth()}`
}

// 🗓 월간 요리 달력 — 요리한 날에 «그날 만든 음식»이 뜬다. 날짜를 누르면 그날 기록만 모아본다.
//
// ⭐⭐ 2026-08-06 창업자 확정 ② — 예전엔 **점 하나**였다(높이 6px).
//    점은 「했다/안 했다」만 말한다. 달력을 다시 열어보게 만드는 건 «무엇을 해먹었나»다.
//    우리는 음식 아이콘을 236컷 갖고 있다 — 그게 여기서 값을 한다.
//    ⛔ 두 번 해먹어도 점이 두 개가 아니었다(점 «안»에 숫자가 들어갔다) → 구석에 `+N`.
// 📔 `diaryDays` = 다이어리를 쓴 날(`'y-m-d'` Set). 요리와 «따로» 받는다 —
//    다이어리는 요리가 아니라서 음식 아이콘 자리에 못 들어가고, 「N번」에도 안 세어진다.
//    ⭐ 대신 칸 왼쪽 위에 작은 펜 표시. **요리를 안 한 날에도 눌러서 다이어리로 갈 수 있다.**
// 📔📔 **칸을 누르면 «그날 일기»로 바로 간다** (창업자 2026-08-09 밤
//    📮 *"달력에서 아이콘을 누르면 바로 일기로 들어가게 하면 좋을 것 같아"*)
//    ⛔ 전엔 칸을 누르면 «아래 목록만» 걸러졌다. 그런데 폴드처럼 큰 화면에선 그 목록이 화면 밖이라
//       **눌러도 아무 일도 안 일어난 것처럼** 보였다(창업자 가족이 「먹통」으로 여겼다).
//    ⭐ 잃는 게 없다 — 일기 화면(`DiaryScreen`)이 그날 «요리 기록»까지 같이 보여준다(47줄 필터).
//       오히려 목록 거르기보다 더 많이 본다.
function CookCalendar({ entries, diaryDays, selected, onSelect, onOpenDay, iconFor }) {
  const [ym, setYm] = useState(() => {
    const n = new Date()
    return { y: n.getFullYear(), m: n.getMonth() }
  })
  // 날짜별로 «기록 자체»를 모아둔다 — 개수만 세면 무엇을 만들었는지 못 그린다.
  // entries 는 최신순이라 [0] 이 그날 마지막에 남긴 기록이다.
  const byDay = useMemo(() => {
    const map = {}
    for (const e of entries) {
      const k = dayKey(e.at)
      map[k] = map[k] || []
      map[k].push(e)
    }
    return map
  }, [entries])
  const first = new Date(ym.y, ym.m, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate()
  const today = new Date()
  const isToday = (d) => today.getFullYear() === ym.y && today.getMonth() === ym.m && today.getDate() === d
  const move = (diff) => {
    setYm((p) => {
      const d = new Date(p.y, p.m + diff, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
    onSelect(null)
  }
  const monthCount = entries.filter((e) => {
    const d = new Date(e.at)
    return d.getFullYear() === ym.y && d.getMonth() === ym.m
  }).length
  return (
    <div className="card cal-card">
      <div className="cal-head">
        <button className="press cal-nav" onClick={() => move(-1)} aria-label="이전 달"><Icon name="chevron-left" size={18} color="var(--text-sub)" /></button>
        <div className="cal-title">{ym.y}년 {ym.m + 1}월 <span className="t-sub" style={{ fontSize: 15, fontWeight: 600 }}>· {monthCount}번</span></div>
        <button className="press cal-nav" onClick={() => move(1)} aria-label="다음 달"><Icon name="chevron-right" size={18} color="var(--text-sub)" /></button>
      </div>
      <div className="cal-grid cal-week">
        {['일', '월', '화', '수', '목', '금', '토'].map((w, i) => (
          <span key={w} style={{ color: i === 0 ? '#c46b5a' : 'var(--text-sub)' }}>{w}</span>
        ))}
      </div>
      <div className="cal-grid">
        {Array.from({ length: startPad }, (_, i) => <span key={'p' + i} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1
          const k = `${ym.y}-${ym.m}-${d}`
          const list = byDay[k]
          const n = list ? list.length : 0
          const top = list && list[0]
          const on = selected === k
          const hasDiary = diaryDays.has(k)
          // 🗓 [2026-08-12] 아무것도 없는 «지난 날»도 누를 수 있어야 한다.
          //   📮 창업자 *"달력에 날짜누르면 바로 일기로 들어가지는지 확인"*
          //   🔬 재현으로 확정 — 빈 칸이 `disabled` 라 **지난 날엔 일기를 쓰러 갈 길이 아예 없었다**
          //      (아래 「일기 쓰기」 단추도 `dayFilter || 오늘` 이라 오늘로만 열린다).
          //   ⛔ **앞날은 그대로 막는다** — 아직 안 온 날의 일기를 쓰는 건 뜻이 안 맞는다.
          const 앞날 = new Date(ym.y, ym.m, d).setHours(0, 0, 0, 0) > new Date().setHours(0, 0, 0, 0)
          return (
            <button
              key={d}
              className={`press cal-day ${on ? 'on' : ''} ${isToday(d) ? 'today' : ''}`}
              // 📔 누르면 «그날 일기»로 바로 간다(위 주석). 고른 표시도 남겨 둔다 —
              //    돌아왔을 때 어느 날을 봤는지 알 수 있고, 아래 「N월 N일 일기」 단추도 그 날짜를 쓴다.
              onClick={() => { if (앞날) return; onSelect(k); onOpenDay?.(k) }}
              disabled={앞날}
            >
              <span className="cal-num">{d}</span>
              {hasDiary && <span className="cal-diary" aria-label="일기 쓴 날"><Icon name="pen" size={9} /></span>}
              {top && (
                // 사진을 남겼으면 사진이, 아니면 그날 만든 음식 아이콘이 칸에 뜬다.
                <span className="cal-food">
                  {top.photo
                    ? <StoredImg src={top.photo} alt="" loading="lazy" />
                    : <FoodIcon name={iconFor(top)} size={24} />}
                </span>
              )}
              {n > 1 && <span className="cal-more">+{n - 1}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// 📔 initView = 「일기」 탭으로 들어오면 «한끼 일기»부터 보여준다 (창업자 2026-08-07
//    *"맨 아래 바에 한끼일기도 넣자. 일기쓰려면 레시피에서 한끼일기 또 들어가야 하니까"*)
//    ⚠️ App 이 key 를 달리 줘서 «다시 마운트»되게 한다 — 안 그러면 초기값이 안 먹는다.
export default function MyRecipesScreen({ initView = 'grid' }) {
  const { recipes, folders, addFolder, removeFolder, removeRecipe, diary, removeDiary, toggleFavorite } = useStore()
  const nav = useNav()
  const [view, setView] = useState(initView) // grid | log | folders
  const [coach, setCoach] = useState(() => needsCoach(MYRECIPES_COACH_KEY))
  const [dCoach, setDCoach] = useState(() => needsCoach(DIARY_COACH_KEY)) // 📔 일기 탭 전용
  const [folder, setFolder] = useState('전체')
  // 모아보기 크기 — 'big'(2열·이름 크게) | 'small'(3열 그리드). 선택은 기억된다.
  const [gridSize, setGridSizeState] = useState(() => {
    try { return localStorage.getItem('hankki:gridSize') || 'big' } catch { return 'big' }
  })
  const setGridSize = (v) => {
    setGridSizeState(v)
    try { localStorage.setItem('hankki:gridSize', v) } catch { /* noop */ }
  }
  // 🔍 탭 안에서 찾기 — 우상단 돋보기로 열고 닫는다(화면을 안 떠난다)
  const [searchOpen, setSearchOpen] = useState(false)
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(false)
  // 편집 모드 다중 선택 — 카드 탭으로 체크하고 아래 바에서 한 번에 삭제(하나씩 지우기 불편 해소)
  const [sel, setSel] = useState(() => new Set())
  const [delSelAsk, setDelSelAsk] = useState(false)
  const toggleSel = (id) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const exitEdit = () => { setEdit(false); setSel(new Set()) }
  // 요리 기록도 동일한 다중 선택 삭제 (모아보기와 별도 상태)
  const [logEdit, setLogEdit] = useState(false)
  const [logSel, setLogSel] = useState(() => new Set())
  const [delLogAsk, setDelLogAsk] = useState(false)
  const toggleLogSel = (id) => setLogSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const exitLogEdit = () => { setLogEdit(false); setLogSel(new Set()) }
  // 카드를 꾹(길게) 누르면 바로 선택 모드 진입 — 갤러리 앱과 같은 습관 지원.
  // 손가락이 12px 이상 움직이면(스크롤) 취소, 발동 후의 클릭은 무시(중복 토글 방지).
  // hold(onFire) 로 공용화 — 모아보기·요리 기록 둘 다 사용.
  const lpTimer = useRef(null)
  const lpFired = useRef(false)
  const lpStart = useRef({ x: 0, y: 0 })
  const hold = (onFire) => ({
    onPointerDown: (e) => {
      lpFired.current = false
      lpStart.current = { x: e.clientX, y: e.clientY }
      clearTimeout(lpTimer.current)
      lpTimer.current = setTimeout(() => {
        lpFired.current = true
        try { if (navigator.vibrate) navigator.vibrate(15) } catch { /* noop */ }
        onFire()
      }, 450)
    },
    onPointerMove: (e) => {
      if (Math.hypot(e.clientX - lpStart.current.x, e.clientY - lpStart.current.y) > 12) clearTimeout(lpTimer.current)
    },
    onPointerUp: () => clearTimeout(lpTimer.current),
    onPointerCancel: () => clearTimeout(lpTimer.current),
    onContextMenu: (e) => e.preventDefault(),
  })
  const lpDown = (r) => hold(() => { setEdit(true); setSel((s) => { const n = new Set(s); n.add(r.id); return n }) }).onPointerDown
  const lpMove = (e) => {
    if (Math.hypot(e.clientX - lpStart.current.x, e.clientY - lpStart.current.y) > 12) clearTimeout(lpTimer.current)
  }
  const lpEnd = () => clearTimeout(lpTimer.current)
  const [newFolder, setNewFolder] = useState(false)
  const [delFolder, setDelFolder] = useState(null) // 삭제할 사용자 폴더 이름

  // 한마디 청하기 — 기록 시트를 닫는 순간. 상세 화면과 «같은 자리»다.
  // ⭐ 기록을 제일 많이 여닫는 곳이 여기라, 상세에만 걸면 사실상 아무한테도 안 물어보게 된다.


  // 뒤로가기 처리는 모달(요리기록 시트 등)까지 포함해 아래(상태 선언 뒤)에서 한 번에 등록한다.

  const sorted = useMemo(() => recipes.filter((r) => r.status === 'sorted').sort((a, b) => b.savedAt - a.savedAt), [recipes])
  // 스마트 폴더 — ★즐겨찾기 / 🍳자주 해먹는. 실제 폴더와 안 겹치게 '__' 접두 키를 쓴다.
  const favCount = sorted.filter((r) => r.favorite).length
  const oftenCount = sorted.filter((r) => (r.cooked || 0) > 0).length
  // 📺 [창업자 확정 2026-09-03] 「영상」 칩 — 유튜브 영상이 붙은 레시피만 모아 본다.
  //   📮 창업자 = *"홈 화면에 SNS레시피 해서 추가하면 되니까"* → *"탭을 따로 만들필요가 있을까??"* → **"칩으로 하자"**
  //   ⛔ 탭을 새로 만들지 않는다 — 하단바가 이미 여섯이고, 무엇보다 **레시피가 두 군데로 갈리면**
  //      검색·책갈피·장보기 담기가 전부 두 벌이 된다. 칩은 «같은 목록»을 거르기만 한다.
  //   ⭐ 잣대는  — **상세에서 실제로 재생되는 것과 «같은 자»다**(절대원칙 30).
  //      ⛔ 「sourceUrl 에 youtube 가 들었나」로 세면 안 된다 — 그러면 칩엔 뜨는데 영상은 안 나오는 편이 생긴다.
  //   ⭐⭐ 잣대는 «한 곳»에 둔다 — 칩 개수 · 거르기 · 썸네일 ▶ 표 셋이 같은 자를 쓴다.
  //      ⛔ 같은 식을 세 군데 적으면 하나만 고쳤을 때 「칩엔 3편인데 ▶ 는 5개」처럼 갈린다.
  const SNS수 = useMemo(() => sorted.filter(SNS인가).length, [sorted])
  // 🔖🔖 [2026-08-18] 책갈피가 카드 «위로 14px» 나가므로 그만큼 자리를 비운다.
  //   ⛔ 안 비웠더니 **맨 윗줄 책갈피가 필터 칩 줄에 가렸다**(실측 = 큰 2건 · 작은 3건).
  //   ⭐ 줄 사이도 같은 이유로 벌린다 — 아랫줄 책갈피가 «윗줄 이름표 «글자»»를 덮었다.
  //      🔢 Range 로 «글자가 실제로 차지하는 상자»를 재서 작은 격자 22건.
  //         ⛔ `.name` div 로 재면 49건이 나오는데 그건 «카드 폭 전체»라 이름표가 왼쪽 정렬일 때
  //            오른쪽 빈칸까지 세어진다 — 규칙 18 ⓘ(검사가 «무엇을» 보는가).
  //   ⛔ `.grid2`·`.grid3` 자체는 안 고친다 — 책갈피가 없는 다른 화면(즐겨찾기·홈)까지 성겨진다.
  //   🧪 `scripts/_probe-책갈피가림-0818.mjs` 가 지킨다(되돌리면 실패한다).
  const 책갈피자리 = { paddingTop: 14, rowGap: gridSize === 'big' ? 24 : 22 }
  // 🔍 레시피 탭 «안에서» 찾기 (창업자 요청 2026-08-05 — *"레시피탭에 검색기능 있으면 좋겠어"*)
  //   ⛔ 예전엔 우상단 돋보기가 «탭을 떠나» 전체 검색 화면으로 튕겨 나갔다.
  //      내가 담아둔 것에서 찾고 싶은데 기본 레시피까지 섞여 나오고, 돌아오려면 뒤로가기를 눌러야 했다.
  //   ⭐ 이제 그 자리에서 열리고, 치는 대로 걸러진다. 전체(기본 레시피 포함) 검색은 홈 상단 검색창이 맡는다.
  //   ⚠️ 찾는 중엔 폴더를 무시한다 — 어느 폴더에 넣었는지 기억나면 안 찾는다.
  //   ⭐ 2026-08-10 — 초성으로도 찾게 올렸다(`matchKo`). 장보기 탭은 v9.70 부터 되는데
  //      여기는 글자를 다 쳐야 했다. **같은 기능인데 탭마다 다르면 「되나 안 되나」를 매번 시험하게 된다.**
  const query = q.trim().toLowerCase()
  const hit = (r) =>
    matchKo([r.title, r.category, r.folder, ...(r.tags || []), ...(r.ingredients || [])].filter(Boolean).join(' '), query)
  const list = query
    ? sorted.filter(hit)
    : folder === '전체' ? sorted
      : folder === '__fav' ? sorted.filter((r) => r.favorite)
      : folder === '__often' ? sorted.filter((r) => (r.cooked || 0) > 0).sort((a, b) => (b.cooked || 0) - (a.cooked || 0))
      : folder === '__sns' ? sorted.filter(SNS인가)
      : sorted.filter((r) => (r.folder || r.category) === folder)
  const countIn = (name) => sorted.filter((r) => (r.folder || r.category) === name).length
  // ⛔ 새 칩 열쇠()를 여기 «안» 넣으면 「폴더 삭제」 단추가 뜬다 — 폴더가 아닌데 폴더로 읽힌다
  const isUserFolder = folder !== '전체' && folder !== '__fav' && folder !== '__often' && folder !== '__sns' && !DEFAULT_FOLDERS.has(folder)

  // 요리 기록(내가 만든 요리 아카이브) — 앨범 + 캘린더
  // 📔📔 **요리 기록과 다이어리를 가른다** — 둘 다 `diary` 배열에 살고 `kind` 로만 구분된다.
  //   ⛔ 안 가르면 다이어리 한 장이 **「이번 달 N번」에 세어지고**(요리를 안 했는데)
  //      앨범엔 **제목 없는 빈 칸**으로 뜨며 최애 요리 집계까지 오염된다.
  //   ⚠️ `kind` 가 없는 옛 기록은 전부 요리다 — 그래야 이미 깔린 폰이 안 깨진다.
  const entries = useMemo(() => diary.filter((d) => d.kind !== 'diary').sort((a, b) => b.at - a.at), [diary])
  // 다이어리는 «날짜»만 쓴다(달력 표시용). 내용은 다이어리 화면이 보여준다.
  const diaryDays = useMemo(() => new Set(diary.filter((d) => d.kind === 'diary').map((d) => dayKey(d.at))), [diary])
  const [dayFilter, setDayFilter] = useState(null) // 'y-m-d' | null — 캘린더에서 고른 날

  // 🐛🐛 기록의 아이콘은 레시피에 «저장된» 값을 먼저 본다.
  //   여태 제목으로 다시 추측해서(`guessFoodIcon(e.title)`), 사람이 직접 고른 아이콘이
  //   앨범에서 무시됐다. **v9.77 에서 표지에 고친 것(`iconPicked`)과 똑같은 버그**다.
  //   달력 칸에 음식을 띄우려면 어차피 이 값이 필요해서 한 번에 고친다.
  //   ⚠️ 레시피를 지웠으면 기록만 남으므로 제목 추측으로 되돌아간다(그림이 아예 없는 것보단 낫다).
  const iconById = useMemo(() => {
    const m = {}
    for (const r of recipes) if (r.icon) m[r.id] = r.icon
    return m
  }, [recipes])
  const iconFor = (e) => iconById[e.recipeId] || guessFoodIcon(e.title)

  // 안드로이드 뒤로가기(버튼·제스처): 열린 모달·시트·필터를 먼저 닫는다.
  // (안 닫으면 뒤로가기가 화면을 넘어 '앱 종료'로 샌다.) 나중에 뜬 레이어부터 하나씩.
  // 비모달 상태(달력·세그먼트·필터)만 처리 — 모달(기록·삭제확인·폴더추가 시트)은 각 시트가 자체 처리.
  useBackHandler(() => {
    if (dayFilter) { setDayFilter(null); return true }
    if (logEdit) { exitLogEdit(); return true }
    if (edit) { exitEdit(); return true }
    if (view !== 'grid') { setView('grid'); return true }
    if (folder !== '전체') { setFolder('전체'); return true }
    return false
  }, { tabLevel: true }) // 탭 화면 — 위에 상세·요리 등 스택 화면이 있으면 이 핸들러는 잠재운다
  const now = new Date()
  // 📊📊 [2026-08-12] 통계 둘을 마저 만들었다 — 창업자 폰 제보 *"통계는 저게다야? 우리얘기했던거있었는데"*
  //   📄 `docs/요리기록-다이어리-방향-2026-08-05.md` §2 에서 넷을 정해놓고 **둘만 만들어져 있었다**
  //      ✅이번 달 몇 회 ✅최애 요리 ／ ❌갈래별 횟수 ❌이번 달 «처음» 만든 요리
  //   ⛔ 「지난달보다 3번 적어요」 같은 «평가»는 안 넣는다 — 세기만 한다(`docs/리텐션-설계원칙-2026-07-30.md`).
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`
  // ⚠️ `now` 를 의존성에 쓰면 «렌더마다 새 객체»라 useMemo 가 매번 다시 돈다 → 달 키(글자)로 잡는다.
  const inMonth = (at) => { const d = new Date(at); return `${d.getFullYear()}-${d.getMonth()}` === monthKey }
  const monthEntries = useMemo(() => entries.filter((e) => inMonth(e.at)), [entries, monthKey])
  const thisMonth = monthEntries.length
  // 갈래별 — 이번 달에 «뭘» 해먹었나. 많은 순 셋만(넷부터는 띠가 두 줄로 접힌다).
  const catTop = useMemo(() => {
    const c = {}
    for (const e of monthEntries) {
      const cat = dishCatOf(iconFor(e))
      if (cat) c[cat] = (c[cat] || 0) + 1
    }
    return Object.entries(c).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko')).slice(0, 3)
  }, [monthEntries, iconById])
  // 이번 달 «처음» 만든 요리 — 그 전엔 한 번도 안 만든 것. 최대 4개.
  //   ⭐ 「이번 달에 만든 것」이 아니다 — 늘 하던 걸 또 한 건 «처음»이 아니다.
  //   ⚠️ 요리 «기록» 전체에서 제일 이른 날을 찾아야 한다. 이번 달만 보면 지난달에 한 것도 처음이 된다.
  const firstTimes = useMemo(() => {
    const earliest = {}
    for (const e of entries) {
      const cur = earliest[e.title]
      if (!cur || +new Date(e.at) < +new Date(cur.at)) earliest[e.title] = e
    }
    return Object.values(earliest)
      .filter((e) => inMonth(e.at))
      .sort((a, b) => +new Date(b.at) - +new Date(a.at))
      .slice(0, 4)
  }, [entries, monthKey])
  // 최애 요리 — 제일 많이 만든 메뉴
  const topDish = useMemo(() => {
    const c = {}
    for (const e of entries) c[e.title] = (c[e.title] || 0) + 1
    const best = Object.entries(c).sort((a, b) => b[1] - a[1])[0]
    return best && best[1] >= 2 ? best[0] : null
  }, [entries])
  // 📅📅 [창업자 2026-08-17] **날짜를 골라도 「그 달」이 안 사라진다.**
  //   📮 *"일기에서 날짜를 누르면 그날에 만든 음식이 보이잖아. **근데 그 달에 만든 음식 전체도 보였으면 좋겠어.**"*
  //   📮 ＋ *"처음들어가면 그달에만든게 보이는데 **일기쓰고 나면 날짜꺼만 보여.** 다른탭에 나갔다가 다시오면 다 보이고."*
  //   ⭐⭐ 창업자가 본 그대로였다 — 달력 칸이 `onSelect(k)`(거르기 켜기)와 `onOpenDay(k)`(일기로 이동)를
  //      **한 번에** 한다(위 `CookCalendar`). 그래서 일기를 쓰고 돌아오면 거르기가 «살아 있어» 그날 것만 남고,
  //      탭을 나갔다 오면 화면이 다시 마운트돼 거르기가 풀려서 «다 보인다». 오락가락한 게 아니라 이 구조였다.
  //   ⛔ **거르기를 없애지 않는다** — 그날 것만 보는 건 창업자가 «쓰는» 기능이다(*"그날에 만든 음식이 보이잖아"*).
  //   ✅ **덜어내지 말고 얹는다** = 위에 「그날」, 아래에 「그 달 전체」. 둘 다 보인다.
  //   ⚠️ 「그 달」의 기준 = **고른 날이 속한 달**. 달력에서 달을 넘기면 `move()` 가 `onSelect(null)` 을 부르니
  //      달력이 보고 있는 달과 언제나 같다 — 달력 상태를 밖으로 끌어낼 필요가 없다.
  const dayList = useMemo(
    () => (dayFilter ? entries.filter((e) => dayKey(e.at) === dayFilter) : []),
    [entries, dayFilter],
  )
  const pickedYm = dayFilter ? dayFilter.split('-').slice(0, 2).join('-') : null
  // 🔁🔁 [창업자 2026-08-17] **「그 달」 묶음은 «겹치지 않는다».**
  //   📮 *"한달치니까 겹치지 않게 하자. **3번 같은 걸 만들면 3번 보이게 되잖아**"*
  //   ⭐⭐ 창업자가 «한 달»이라는 길이에서 답을 냈다 — 하루면 같은 요리를 두 번 할 일이 드물지만
  //      **한 달이면 제육볶음을 세 번 한다.** 그대로 세면 같은 그림이 세 칸을 먹고, 그 달에 «무엇을»
  //      해먹었는지가 오히려 안 보인다. 이 묶음의 목적은 «횟수»가 아니라 «무엇»이다.
  //      (횟수는 바로 위 통계 띠가 「이번 달 N번」으로 이미 말한다 — 두 번 말할 이유가 없다.)
  //   ⛔ 겹치는 자리가 «둘»이라 둘 다 막는다 —
  //      ⑴ 같은 요리를 여러 번 (창업자가 짚은 것) ⑵ 그날 것이 그 달에도 또 (내가 물어본 것)
  //   ⚠️ 남기는 것은 «가장 최근» 한 판 — `entries` 가 최신순이라 처음 만난 것이 그것이다.
  //   ⚠️ 같은 요리의 잣대 = **제목**. `recipeId` 는 레시피를 지우면 끊기고, 유저 눈에 보이는 건 제목이다.
  //   ⛔ 날짜를 «안» 골랐을 땐 손대지 않는다 — 그건 「나의 요리 앨범」이고 한 장씩 쌓이는 게 그 자리의 뜻이다.
  const monthList = useMemo(() => {
    if (!pickedYm) return entries
    const 본것 = new Set()
    const out = []
    for (const e of entries) {
      if (ymKey(e.at) !== pickedYm) continue
      if (dayKey(e.at) === dayFilter) continue // ⑵ 위 「그날」 묶음에 이미 있다
      if (본것.has(e.title)) continue          // ⑴ 같은 요리는 한 번만
      본것.add(e.title)
      out.push(e)
    }
    return out
  }, [entries, pickedYm, dayFilter])
  // 🖐 「전체 선택」이 잡을 것 = **화면에 실제로 있는 것 전부**(그날 ＋ 그 달).
  //    ⛔ `monthList` 하나만 쓰면 그날 묶음이 선택에서 빠진다 — 겹침을 없앤 «뒤»엔 둘이 남남이다.
  const shownAll = useMemo(() => [...dayList, ...monthList], [dayList, monthList])
  const openRecipe = (e) => {
    if (recipes.some((r) => r.id === e.recipeId)) nav.push({ name: 'detail', id: e.recipeId })
  }

  // 🖼 앨범 한 칸 — **그리드가 둘이 되어(그날 · 그 달) 한 곳으로 모았다.**
  //   ⛔ 복사해 두 벌로 두지 말 것. 꾹 누름·편집 체크·별점이 붙어 있어 한쪽만 고치면 바로 갈린다.
  const albumTile = (e) => {
    const on = logEdit && logSel.has(e.id)
    return (
      <button
        key={e.id}
        className="album-tile press"
        aria-label={`${e.title} 기록 보기`}
        style={{ position: 'relative', opacity: logEdit && !on ? 0.75 : 1, outline: on ? '3px solid var(--brown)' : 'none', outlineOffset: -3, WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
        {...hold(() => { setLogEdit(true); setLogSel((s) => { const n = new Set(s); n.add(e.id); return n }) })}
        onClick={() => {
          if (lpFired.current) { lpFired.current = false; return } // 꾹 누름 발동 직후 클릭 무시
          if (logEdit) toggleLogSel(e.id)
          // 📔📔 **「한끼 일기」에서 누르면 «그날 일기»로 간다** (창업자 2026-08-07)
          //   ⛔ 전엔 「요리 기록 남기기」 시트가 떴다 — 창업자 *"이거 없애기로 하지않았어? 일기에서 만든음식 누르면 떠."*
          //   ⭐ v9.80 에 없앤 건 **「만들었어요」 누르면 «자동으로» 뜨던 것**이고,
          //      여기 «직접 누르는 길»은 남아 있었다. 화면 이름이 「한끼 일기」인데 요리 기록이 뜨니 앞뒤가 안 맞았다.
          //   ⭐ 기록(별점·사진·팁) 고치기는 **레시피 상세**에 그대로 있다(`RecipeDetailScreen` 「내 요리 기록」 카드)
          //      → 잃는 길이 없다.
          //   ⚠️ 딸려온 것 = 이 화면의 「한마디 청하기」가 그 시트 닫히는 자리를 썼다.
          //      화면을 옮기는 길에 묻는 건 실례라 여기선 안 묻고 **레시피 상세 쪽에 맡긴다**(거긴 그대로 산다).
          else nav.push({ name: 'diary', day: dayKey(e.at) })
        }}
      >
        {e.photo ? (
          <StoredImg src={e.photo} alt="" loading="lazy" />
        ) : (
          <div className="album-icon"><FoodIcon name={iconFor(e)} size={34} /></div>
        )}
        {/* ⭐ [2026-08-17 창업자 *"음식 아이콘에 별은 뭐야?"*] = 「만들었어요!」 하고 «매긴 별점».
            ⛔ 여기만 **유니코드 글자 `★`** 였다 — 별점을 «매기는» 자리(`DiaryEntrySheet` 의 `Stars`)는
               우리 `Icon name="star"` 를 쓴다. **같은 것을 두 모양으로 그리고 있었다.**
               우리 규칙은 「UI엔 우리 스티커·아이콘만」이라 여기가 예외로 남아 있던 자리다. */}
        {e.rating > 0 && !logEdit && (
          <span className="album-star">
            <Icon name="star" size={10} color="#ffd66b" style={{ fill: '#ffd66b' }} />
            {e.rating}
          </span>
        )}
        <span className="album-cap">{e.title}</span>
        {logEdit && (
          <span aria-hidden style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', background: on ? 'var(--brown)' : 'rgba(255,255,255,0.92)', border: on ? 'none' : '1.8px solid rgba(0,0,0,0.22)', boxShadow: '0 1px 5px rgba(0,0,0,0.22)' }}>
            {on && <Icon name="check" size={14} color="#fff" stroke={3} />}
          </span>
        )}
      </button>
    )
  }

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {/* 인사하는 꼬르곰 — 홈 상단에 있던 걸 이리로 옮겼다(창업자 2026-07-29).
              장보기·레꾸자랑엔 이미 곰이 있어 겹치고, 설정은 잘 안 가서 여기로. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* 🐧 [2026-08-13 창업자 제보] *"레시피, 한끼일기탭은 «같은 모양» 꼬르곰이"* ＋ *"펭펭이든 친구들이든 우리애들"*
                ⭐ 한 화면인데 제목만 갈리니 **같은 곰이 두 탭에 그대로** 있었다 → 일기일 땐 펭펭이 한 술 뜬다(냠냠).
                   일기 = «먹은 것을 적는 자리» 라 숟가락 든 컷이 맞다. */}
            {view === 'log' ? (
              <img src={pengNyam} alt="" draggable={false} width={34} height={44} className="hk-m-nyam" style={{ display: 'block', objectFit: 'contain', transformOrigin: 'bottom center', margin: '-5px 0' }} />
            ) : (
              <img src={gomHeader} alt="" draggable={false} width={42} height={42} className="hk-m-sway" style={{ display: 'block', objectFit: 'contain', transformOrigin: 'bottom center', margin: '-4px 0' }} />
            )}
            {/* 🏷 제목은 «지금 보고 있는 것»을 말한다 — 「일기」 탭으로 들어왔는데 머리글이
                「레시피」면 어디에 있는지 헷갈린다(검수판에서 드러났다). */}
            <div className="h-title">{view === 'log' ? '한끼 일기' : '레시피'}</div>
          </div>
          {/* 📔 [2026-08-18 창업자 제보] *"한끼일기에 도움말에도 책갈피가 있어 잘못쓴것 같은데"*
              ⛔ 여기가 «항상» tab="myrecipes" 였다 — 바로 윗줄에서 제목은 갈라 놓고 도움말만 안 갈랐다.
                 그래서 한끼 일기에서 「?」를 누르면 책갈피·보기 바꾸기 같은 «없는 기능»이 안내됐다. */}
          <TabTips tab={view === 'log' ? 'log' : 'myrecipes'} />
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {view === 'grid' && (
            <>
              <button className="t-more press" style={{ marginRight: 2, fontSize: 16 }} onClick={() => (edit ? exitEdit() : setEdit(true))}>
                {edit ? '완료' : '편집'}
              </button>
              {/* 크게 보기(2열) ↔ 그리드(3열) 전환 */}
              <button className="icon-btn press" data-coach="gridsize" onClick={() => setGridSize(gridSize === 'big' ? 'small' : 'big')} aria-label="보기 방식 전환">
                <Icon name={gridSize === 'big' ? 'grid-small' : 'grid-big'} size={21} color="var(--text-sub)" />
              </button>
            </>
          )}
          {view === 'log' && entries.length > 0 && (
            <button className="t-more press" style={{ marginRight: 2, fontSize: 16 }} onClick={() => (logEdit ? exitLogEdit() : setLogEdit(true))}>
              {logEdit ? '완료' : '편집'}
            </button>
          )}
          <button
            className="icon-btn press"
            onClick={() => { setView('grid'); setSearchOpen((v) => { if (v) setQ(''); return !v }) }}
            aria-label={searchOpen ? '찾기 닫기' : '내 레시피에서 찾기'}
          >
            <Icon name={searchOpen ? 'x' : 'search'} size={22} />
          </button>
        </div>
      </div>

      {/* 💬 한 화면에 탭이 둘이라 대사도 갈린다 — 제목·캐릭터·도움말과 «같은 잣대»(`view === 'log'`).
          ⛔ 여기만 안 가르면 한끼 일기에서 「여기에 다 모았어」가 뜬다(2026-08-18 도움말 사고와 같은 뿌리). */}
      <TabTalk tab={view === 'log' ? 'log' : 'myrecipes'} />

      {/* 세그먼트 — 일지 탭을 '요리 기록'으로 흡수 */}
      <div className="pad">
        <div className="segment">
          <button className={`seg ${view === 'grid' ? 'on' : ''}`} data-coach="collection" onClick={() => setView('grid')}>모아보기</button>
          {/* 🏷 「요리 기록」 → **「요리 일지」** (창업자 2026-08-06 *"요리기록-이름바꾸기"*)
            ⭐ 창업자가 쓴 말을 그대로 쓴다 — *"속지를 고르고 **일지**를 쓰고 예쁘게 꾸며요"*.
            ⛔ 이 탭은 이제 요리 기록만 있는 곳이 아니다 — **달력 ＋ 다이어리 ＋ 요리 아카이브** 셋이 산다.
               「기록」은 별점·사진만 가리키는 말이라 다이어리가 안 담긴다. 「일지」가 셋을 다 품는다. */}
          <button className={`seg ${view === 'log' ? 'on' : ''}`} data-coach="log" onClick={() => setView('log')}>한끼 일기</button>
        </div>
      </div>

      {view === 'log' && (
        // eslint-disable-next-line
        <div className="pad fade log-2col">
          {/* 🗓🗓 `log-2col` = **가로에서 왼쪽 달력 · 오른쪽 나머지 2단**(창업자 2026-08-16 · CSS 는 styles.css 맨 끝)
              ⛔⛔ 여기서 **함정을 둘이나 밟았다. 둘 다 주석 때문이다.**
                ⑴ 이 주석을 «div 밖»(`{view === 'log' && (` 다음 줄)에 뒀더니 빌드가 죽었다 —
                   **JSX 주석은 «자식» 자리에서만 된다.** 표현식이 열리는 자리엔 «JS 주석»을 쓴다.
                ⑵ 그걸 설명하려고 주석 «안»에 별표·빗금 닫는 짝을 적었더니 **거기서 주석이 끝났다.**
                   뒷부분이 화면에 «글자»로 새어 나와 **격자 칸을 하나 더 먹고 2단이 무너졌다.**
                   ⭐ 빌드는 통과한다 — 글자가 보일 뿐이라 «찍어서 재보기 전엔 모른다»(규칙 21).
              📌 규칙 = **주석 안에 닫는 짝을 적지 않는다.** 백틱 함정(CLAUDE.md)과 같은 뿌리다. */}
          {/* 🗓 요리 달력 — **맨 위 · 항상 펼쳐 둔다.** (창업자 확정 2026-08-06 ②)
              ⛔ 예전엔 `useState(false)` 로 **기본이 접힘**이었고, 「요리 달력 보기 ▾」를 눌러야 나왔다.
                 그래서 만든 사람(창업자)조차 안 썼다 — 이 탭이 죽은 이유의 하나가 **기능이 모자란 게
                 아니라 자리를 잘못 준 것**이었다. 접기 버튼도 같이 없앴다(가릴 이유가 없어졌다). */}
          {(entries.length > 0 || diaryDays.size > 0) && (
            <div data-coach="cal" className="log-cal">
              <CookCalendar entries={entries} diaryDays={diaryDays} selected={dayFilter} onSelect={setDayFilter} onOpenDay={(k) => nav.push({ name: 'diary', day: k })} iconFor={iconFor} />
            </div>
          )}

          <div className="log-main">
          {/* 📔 다이어리 쓰기 — 창업자 2026-08-06 *"따로 아이콘을 하나 파서 다이어리 쓰기
              (날짜 넣고 쓰면 달력에 저장되도록)"*
              ⭐ 요리를 «안 한 날»에도 쓸 수 있어야 한다 — 그래서 「만들었어요」와 별개 입구다.
              ⚠️ 날짜를 고르는 UI 를 새로 만들지 않았다 — **달력이 바로 위에 있다.**
                 날짜를 골라 두고 누르면 그날, 안 고르면 오늘. (새 UI 0개) */}
          <button
            className="press"
            data-coach="diary-write"
            onClick={() => nav.push({ name: 'diary', day: dayFilter || dayKey(Date.now()) })}
            style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 12, padding: '11px 0', borderRadius: 12, background: 'var(--brown)', color: '#fff', fontSize: 16.5, fontWeight: 800, border: 'none' }}
          >
            <Icon name="pen" size={16} color="#fff" />
            {/* ⛔ 이미 쓴 날에 「쓰기」라고 하면 «새로 쓴다»로 읽혀 덮어쓸까 봐 안 누른다. */}
            {(() => {
              const day = dayFilter || dayKey(Date.now())
              const verb = diaryDays.has(day) ? '일기 보기' : '일기 쓰기'
              return dayFilter
                ? `${Number(dayFilter.split('-')[1]) + 1}월 ${dayFilter.split('-')[2]}일 ${verb}`
                : `오늘 ${verb}`
            })()}
          </button>
          {/* 📔 **버튼 아래에 「뭘 하는 곳인지」 한 줄** (창업자 2026-08-06
              *"아이콘 아래에 속지를 고르고 일지를 쓰고 예쁘게 꾸며요 이런식으로 안내를 해주면 좋을 듯해"*)
              ⛔ 바로 아래 설명은 **요리 아카이브**(별점·사진·팁) 얘기라, 다이어리 버튼을 누르기 전에
                 읽히는 글이 딴 기능 설명이었다. 버튼과 설명이 어긋나면 안 누른다. */}
          <div className="t-sub" style={{ fontSize: 15.5, textAlign: 'center', marginBottom: 14, lineHeight: 1.55 }}>
            속지를 고르고 · 일기를 쓰고 · 예쁘게 꾸며요
          </div>

          {/* 📊📊 [2026-08-12] 통계 띠가 «일기만 쓴 사람»에겐 아예 안 보이던 것.
              📮 창업자 *"한끼일기 통계는 언제 반영돼?"* — 답은 «바로»인데, 조건이 `entries.length > 0`
                 하나뿐이라 **요리 기록이 0이면 띠 자체가 안 그려졌다.** 일기만 쓰면 영영 못 본다.
              🔬 재현으로 확정(`_repro-일기삭제-0812` ③) — 일기 1장만 있을 때 통계띠 false.
              ✅ 요리 기록 «또는» 일기가 하나라도 있으면 그린다 ＋ **일기 수를 칸으로 추가**.
                 ⛔ 요리 기록 수(`entries`)와 일기 수(`diaryDays`)는 «다른 것»이라 합치지 않는다. */}
          {(entries.length > 0 || diaryDays.size > 0) && (
            <div className="card" style={{ padding: '11px 14px', marginBottom: 12, background: 'var(--cream)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap', fontSize: 16, fontWeight: 600 }}>
              <span>이번 달 <b style={{ color: 'var(--brown)' }}>{thisMonth}</b>번</span>
              <span style={{ color: 'var(--sand)' }}>·</span>
              <span>총 <b style={{ color: 'var(--brown)' }}>{entries.length}</b>개</span>
              {diaryDays.size > 0 && (
                <>
                  <span style={{ color: 'var(--sand)' }}>·</span>
                  <span>일기 <b style={{ color: 'var(--brown)' }}>{diaryDays.size}</b>일</span>
                </>
              )}
              {topDish && (
                <>
                  <span style={{ color: 'var(--sand)' }}>·</span>
                  <span>최애 <b style={{ color: 'var(--brown)' }}>{topDish}</b></span>
                </>
              )}
              {/* 🥘 갈래별 — 「이번 달에 뭘 해먹었나」. 위 줄과 성격이 달라(횟수 vs 종류) 줄을 나눈다.
                  ⭐ 갈래 이름은 픽커 탭 그대로다 — 유저가 아이콘 고를 때 이미 본 말이라 따로 배울 게 없다. */}
              {catTop.length > 0 && (
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap', fontSize: 15.5, paddingTop: 7, marginTop: 1, borderTop: '1px solid var(--line)' }}>
                  {catTop.map(([label, n], i) => (
                    <Fragment key={label}>
                      {i > 0 && <span style={{ color: 'var(--sand)' }}>·</span>}
                      <span>{label} <b style={{ color: 'var(--brown)' }}>{n}</b></span>
                    </Fragment>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 🌱 이번 달 «처음» 만든 요리 — 격려도 평가도 아닌데 보면 기분이 좋다.
              (`docs/요리기록-다이어리-방향-2026-08-05.md` §2 ⭐ 「넣을 것」)
              ⛔ 「N개나 도전했어요!」 같은 칭찬 문구는 안 붙인다 — 평가가 되고 우리 톤도 아니다.
              ⚠️ 갓 시작한 사람은 «전부»가 처음이라 이 칸이 앨범과 똑같아진다 → 기록이 5개는 돼야 뜬다. */}
          {firstTimes.length > 0 && entries.length >= 5 && (
            <div className="card" style={{ padding: '10px 12px 11px', marginBottom: 12, background: 'var(--cream)', border: 'none' }}>
              <div className="t-sub" style={{ fontSize: 15, marginBottom: 8 }}>이번 달 처음 만든 요리</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {firstTimes.map((e) => (
                  <button
                    key={e.id}
                    className="press"
                    onClick={() => openRecipe(e)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: 62, minHeight: 44 }}
                  >
                    <FoodIcon name={iconFor(e)} size={34} />
                    {/* ⛔⛔ [2026-08-16 고침] **긴 이름이 62px 칸을 넘쳐 옆 이름과 «붙어» 보였다.**
                        🔢 실측 = 「수제 떡갈비」＋「목살돼지갈비구이」가 `수제 떡갈비목살돼지갈비구이` 로 읽혔다.
                           폰 세로에서도 똑같아서 **내 가로 2단 작업 때문이 아니라 원래 있던 버그**다.
                        ⭐ 뿌리 = `overflow: hidden` 은 있는데 **span 이 자기 폭을 안 가졌다.**
                           flex 칸의 자식이라 «내용만큼» 늘어나서, 잘릴 폭 자체가 없었다.
                           ＋`wordBreak: keep-all` 이라 「목살돼지갈비구이」는 띄어쓰기가 없어 «한 낱말»이라 안 꺾인다.
                        ✅ `width: 100%` 한 줄 — 그제서야 62px 에서 잘리고 두 줄 말줄임이 실제로 돈다.
                        📌 규칙 21 로 잡았다 — 숫자는 다 초록불이었고 **판을 열어보고서야 보였다.** */}
                    {/* ⚠️ `overflowWrap: anywhere` 를 같이 준다 — `keep-all` 만으로는 「목살돼지갈비구이」처럼
                        **띄어쓰기 없는 긴 이름이 «한 낱말»이라 안 꺾여** 두 줄 말줄임이 아예 안 돈다(한 줄에서 싹둑).
                        ⭐ `anywhere` 는 «담을 수 없을 때만» 꺾으므로 「수제 떡갈비」처럼 띄어쓰기 있는 이름은
                           지금처럼 낱말 단위로 그대로 꺾인다. 둘을 같이 두는 게 맞다. */}
                    <span style={{ width: '100%', fontSize: 15, lineHeight: 1.25, textAlign: 'center', wordBreak: 'keep-all', overflowWrap: 'anywhere', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{e.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 나의 요리 앨범 — 설명은 앨범 «바로 위»로 내렸다. 달력이 먼저 보여야 해서. */}
          <div className="t-sub" style={{ fontSize: 15.5, lineHeight: 1.55, marginBottom: 10 }}>
            {/* ✍️ [2026-08-12] 창업자 *"한끼일기에 나만의 별점~~블라블라 하는거 설명 바꾸면 좋겠어."*
                ⛔ 옛 문구는 «기능 설명»이었다 — 「별점·사진·나만의 팁을 남겨두면 … 재현해요」.
                   무엇을 «할 수 있는지»만 말하고, 왜 남기고 싶은지는 한 마디도 없었다.
                ⭐ 우리 컨셉은 「성취」가 아니라 **「흔적」**이다(`docs/리텐션-설계원칙-2026-07-30.md`).
                   그래서 「실력이 쌓인다」(성취)를 빼고 **「그날이 남는다」**로 바꿨다.
                ⛔ 재촉·평가·숫자 자랑 금지. ⛔ 「매일」 같은 약속도 안 한다(스트릭 금지와 같은 뿌리). */}
            <b style={{ color: 'var(--text)' }}>오늘 뭘 해먹었는지</b>가 한 장씩 쌓여요. 사진 한 장, 별점 하나면 충분해요 — 나중에 넘겨보면 <b style={{ color: 'var(--text)' }}>그날의 내가</b> 보여요.
          </div>

          {entries.length === 0 ? (
            <div className="empty" style={{ marginTop: 10 }}>{'아직 기록이 없어요.\n요리하고 "만들었어요!"만 눌러도 별점·사진이 한 장씩 쌓여요.\n다음에 "그때 그 맛"을 그대로 재현하는 나만의 요리 일기예요'}</div>
          ) : (
            <>
              {/* 📅 날짜를 골랐을 때만 «그날» 묶음이 위에 선다. 알약을 누르면 거르기가 풀린다. */}
              {dayFilter && (
                <>
                  <button className="press" onClick={() => setDayFilter(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '2px 0 10px', padding: '6px 12px', borderRadius: 999, background: 'var(--brown)', color: '#fff', fontSize: 15.5, fontWeight: 700 }}>
                    {Number(dayFilter.split('-')[1]) + 1}월 {dayFilter.split('-')[2]}일의 요리 {dayList.length}개 <Icon name="x" size={13} color="#fff" stroke={2.4} />
                  </button>
                  {/* ⛔ 요리를 안 한 날에도 일기는 쓴다 — 그때 아래가 통째로 비면 «고장»으로 읽힌다.
                      전엔 앨범이 빈 채로 끝나서 화면에 아무것도 없었다. 이제 그 아래에 그 달이 이어진다. */}
                  {dayList.length === 0 ? (
                    <div className="t-sub" style={{ fontSize: 15.5, margin: '0 2px 14px' }}>이 날 만든 요리는 없어요.</div>
                  ) : (
                    <div className="album-grid" style={{ marginBottom: 16 }}>{dayList.map(albumTile)}</div>
                  )}
                  {/* 🗓 그 달 머리글 — 아래 앨범이 «무엇의 묶음»인지 말해 준다.
                      ⛔ 이 줄이 없으면 그날 것과 달 것이 한 덩어리로 보여 더 헷갈린다.
                      ⚠️ 「다른」은 **그날 것이 있을 때만** 붙인다 — 일기만 쓴 날엔 뺀 게 없어서
                         「다른」이라고 하면 «어디에 견줘 다른지»가 없는 말이 된다. */}
                  <div className="t-sub" style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--brown)', margin: '0 2px 8px' }}>
                    {Number(dayFilter.split('-')[1]) + 1}월에 만든 {dayList.length > 0 ? '다른 ' : ''}요리 {monthList.length}개
                  </div>
                </>
              )}
              <div className="album-grid">{monthList.map(albumTile)}</div>
            </>
          )}
          </div>{/* .log-main */}
        </div>
      )}

      {view === 'grid' && searchOpen && (
        <div className="pad fade" style={{ marginBottom: 10 }}>
          <div className="searchbar">
            <Icon name="search" size={19} color="var(--text-sub)" />
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="내 레시피에서 찾기 · 제목 · 재료 · 태그"
              autoComplete="off"
              autoFocus
            />
            {q && (
              <button className="press" onClick={() => setQ('')} aria-label="지우기">
                <Icon name="x" size={18} color="var(--text-sub)" />
              </button>
            )}
          </div>
          {query && (
            <div className="t-sub" style={{ margin: '10px 2px 0', fontSize: 15.5 }}>
              ‘{q.trim()}’ — 내 레시피 {list.length}개
            </div>
          )}
        </div>
      )}

      {view === 'grid' && (
        <>
          {/* 찾는 중엔 폴더 칩을 감춘다 — 어느 폴더에 넣었는지 기억나면 애초에 안 찾는다 */}
          <div className="hscroll" style={{ marginBottom: 8, display: query ? 'none' : undefined }}>
            <button className={`pill press ${folder === '전체' ? 'active' : ''}`} onClick={() => setFolder('전체')}>전체 {sorted.length}</button>
            {/* ⭐ [2026-08-17 창업자 *"바꿔"*] 유니코드 글자 `★` → 우리 별 아이콘.
                ⛔ 앱에서 유니코드 별을 쓰던 곳이 둘이었다(앨범 배지 · 이 칩) — 이걸로 0이 된다.
                ⚠️ `currentColor` 로 둔다 — 칩은 눌리면 글자색이 바뀌는데(`.pill.active`)
                   색을 박으면 별만 안 따라가서 «그때만» 어긋난다. `.pill` 이 이미 flex 라 정렬은 그대로.
                🔖🔖 **[2026-08-18 창업자 확정] 별 → 요리사모자 · 「즐겨찾기」 → 「책갈피」**
                   📮 *"아니면 **즐겨찾기 버튼 앞에 요리사모자를 넣어봐.**"* → 갈래 여섯을 찍어 **② 모자＋글자** 확정
                   📮 이름 = *"3번가자"*(책갈피). 그 앞에 창업자가 «my pick» 을 냈는데 실측으로 접었다 —
                      ⑴「픽」은 장보기의 **「이번 주 픽」(제품)**으로 이미 쓰인다(＋레시피 메모 여러 편)
                      ⑵**화면에 보이는 영어 낱말이 0개**라 유일한 영어가 된다(창업자 스스로 *"혼자영어인가ㅋ"*)
                   ⭐⭐ **칩의 모자 = 카드의 모자** → 「이 모자가 책갈피구나」를 유저가 저절로 배운다.
                      「모아보기 단추」를 새로 만들 필요가 없다 — 이 자리가 이미 그것이다.
                   ⭐ 별점을 접고 인덱스로 갔는데 **별(★)이 여기 남아 있었다.** 이걸로 0이 된다.
                   ⚠️ 이름은 여섯 곳을 «같이» 바꿨다(여기 · 사용법 · 설정 메뉴 · 설정 통계 · 모아보기 화면 제목·빈칸).
                      ⛓ CLAUDE.md 「같은 기능은 탭이 달라도 같은 이름」 — 한 곳만 바꾸면 말이 갈라진다.
                ⛔⛔ 이 주석은 `{favCount > 0 && (` **«바깥»**에 둔다 — 그 괄호 안은 «표현식» 자리라
                   JSX 주석을 넣으면 객체 리터럴로 파싱돼 **빌드가 죽는다**(오늘 실제로 죽였다 · CLAUDE.md 함정). */}
            {favCount > 0 && (
              <button className={`pill press ${folder === '__fav' ? 'active' : ''}`} onClick={() => setFolder('__fav')}>
                <img src={idxChef} alt="" className="pill-chef" />
                {FAV_NAME} {favCount}
              </button>
            )}
            {oftenCount > 0 && (
              <button className={`pill press ${folder === '__often' ? 'active' : ''}`} onClick={() => setFolder('__often')}>자주 {oftenCount}</button>
            )}
            {SNS수 > 0 && (
              <button className={`pill press ${folder === '__sns' ? 'active' : ''}`} onClick={() => setFolder('__sns')}>
                <Icon name="play" size={13} />
                SNS {SNS수}
              </button>
            )}
            {folders.map((c) => (
              <button key={c} className={`pill press ${folder === c ? 'active' : ''}`} onClick={() => setFolder(c)}>{c} {countIn(c)}</button>
            ))}
            <button className="pill press" style={{ borderStyle: 'dashed', color: 'var(--text-sub)' }} onClick={() => setNewFolder(true)}>＋ 폴더</button>
          </div>
          <div className="pad">
            {/* 사용자가 만든 폴더는 여기서 바로 삭제(폴더·태그 탭을 없애 모아보기로 흡수) */}
            {isUserFolder && (
              <button className="press" onClick={() => setDelFolder(folder)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 10, padding: '6px 11px', borderRadius: 999, background: 'var(--cream)', color: 'var(--text-sub)', fontSize: 15.5, fontWeight: 600 }}>
                <Icon name="x" size={13} color="var(--text-sub)" stroke={2.2} /> ‘{folder}’ 폴더 삭제
              </button>
            )}
            {list.length === 0 ? (
              <div className="empty">
                {query
                  ? '찾는 레시피가 없어요.\n제목·재료·태그 중 아무 낱말로 찾아보세요.'
                  : '이 폴더에 레시피가 없어요.\n가져오기로 채워보세요.'}
              </div>
            ) : (
              <div className={gridSize === 'big' ? 'grid2' : 'grid3'} style={책갈피자리}>
                {list.map((r) => {
                  const on = edit && sel.has(r.id)
                  return (
                    <div key={r.id} className="grid-card" style={{ position: 'relative' }}>
                      {/* 편집 모드: 카드 탭 = 선택 토글(여러 개 골라 한 번에 삭제) */}
                      <button
                        className="press"
                        style={{ textAlign: 'left', width: '100%', opacity: edit && !on ? 0.75 : 1, WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
                        onPointerDown={lpDown(r)}
                        onPointerMove={lpMove}
                        onPointerUp={lpEnd}
                        onPointerCancel={lpEnd}
                        onContextMenu={(e) => e.preventDefault()}
                        onClick={() => {
                          if (lpFired.current) { lpFired.current = false; return } // 꾹 누름 발동 직후 클릭은 무시
                          if (edit) toggleSel(r.id)
                          else nav.push({ name: 'detail', id: r.id })
                        }}
                      >
                        <div style={{ position: 'relative', ...(on ? { outline: '3px solid var(--brown)', outlineOffset: -3, borderRadius: gridSize === 'big' ? 16 : 12 } : null) }}>
                          <Thumb recipe={r} ratio="1/1" radius={gridSize === 'big' ? 16 : 12} emojiSize={gridSize === 'big' ? undefined : '1.6rem'} showDecor />
                          {/* 📺 [2026-09-03] 썸네일 위 「영상 있음」 표
                              ⭐ 위 「영상 N」 칩은 «모아 보는» 것이고, 이건 «이 줄이 영상 편인가»를 그 자리에서 알려준다.
                                 칩을 안 눌러도 목록을 훑다가 보인다.
                              ⭐ 잣대는 칩·상세와 «같은 자» = embedUrl(...).type === 'youtube' (절대원칙 30)
                              ⛔ <button> 을 쓰지 않는다 — 카드 전체가 button 이라 중첩 버튼이 된다(북마크 때와 같은 자리).
                                 pointerEvents: 'none' 이라 눌러도 카드가 눌린다. */}
                          {/* 🔗🔗 [창업자 2026-09-03] *"광어깻잎무침에 영상마크 안붙었어"* → *"그거 광어에만 안붙었다고"*
                              ⛔ 인스타 편엔 ▶ 를 «일부러» 안 붙였었다 — 앱에서 재생이 안 되는데 ▶ 를 붙이면
                                 「누르면 재생된다」는 거짓 약속이 된다. 하지만 그러면 «SNS 편인 줄도 모른다»(창업자가 짚은 게 그거다).
                              ✅ 그래서 **표를 둘로** 나눴다 — 유튜브 ▶(재생) · 그 밖의 SNS 🔗(나가서 보기).
                                 표가 하는 말이 실제와 같아진다. ⛔되돌리려면 이 절만 지우면 된다. */}
                          {SNS인가(r) && (
                            <span
                              aria-hidden="true"
                              /* 🔖 판이 «어떤 표인지»를 정확히 읽게 이름표를 단다.
                                 ⛔ 색·자리로 찾으면 «꾸민 표지»의 스티커(절대배치 span)와 헷갈린다 —
                                    실제로 콩국수에서 그렇게 잘못 잡혔다(2026-09-03). */
                              /* ⛔⛔ [창업자 확정 2026-09-03 · ⓐ] **표는 🔗 하나뿐이다.**
                                 앱 «안»에서 재생하지 않기로 했으므로(III.E.4.j · 상세 화면 주석 참조)
                                 유튜브도 인스타도 **눌러서 밖에서 본다** → 표가 갈릴 이유가 없다.
                                 ⛔ ▶ 를 다시 넣지 말 것 — 재생하지 않는데 ▶ 는 거짓 약속이다. */
                              data-sns="link"
                              style={{
                                position: 'absolute', left: 5, top: 5, pointerEvents: 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: gridSize === 'big' ? 24 : 20, height: gridSize === 'big' ? 24 : 20,
                                borderRadius: 6, background: 'rgba(255,255,255,.92)', color: 'var(--brown)',
                              }}
                            >
                              <Icon name="link" size={gridSize === 'big' ? 17 : 14} />
                            </span>
                          )}
                        </div>
                        <div className="name" style={gridSize === 'small' ? { fontSize: 15, marginTop: 5 } : undefined}>{r.title}</div>
                        {gridSize === 'big' && <div className="date">{dateLabel(r.savedAt)}</div>}
                      </button>
                      {/* 🔖🔖 [2026-08-17 창업자] **북마크를 목록에서 «바로» 누른다.**
                          📮 *"근데 그 북마크는 **나도 한번도 안썼어 번거로워서. 레시피에 들어가서 눌러야 하니까**"*
                          📮 → *"**북마크를 밖으로 빼면 되겠다 레시피 속이 아니라**"* · *"(**잘 보이게** 해줘.)"*
                          ⭐⭐ 창업자가 «왜 안 쓰는지»를 그대로 말해줬다 — 기능이 모자란 게 아니라 **자리가 멀었다.**
                             상세로 들어가 상단바를 눌러야 했으니, 목록을 훑다가 「이거 좋았지」 하는 순간에 못 누른다.
                          ⭐ 그래서 **안 찜한 것도 늘 보이게** 한다(빈 책갈피). 안 보이면 「누를 수 있는 줄」을 모른다.
                          ⛔ 카드 «밖»에 둔다 — 카드 전체가 `<button>` 이라 안에 넣으면 **중첩 버튼**이 되어
                             북마크를 눌러도 카드가 같이 눌려 상세로 튕겨 나간다.
                          ⛔ 고르기(편집) 중엔 감춘다 — 체크 동그라미와 **같은 자리**(top/right)라 겹친다. */}
                      {!edit && (
                        <button
                          className={`fav-dot press${r.favorite ? ' on' : ''}`}
                          aria-label={r.favorite ? `${r.title} ${FAV_REMOVE}` : `${r.title} ${FAV_ADD}`}
                          aria-pressed={!!r.favorite}
                          onClick={(ev) => { ev.stopPropagation(); toggleFavorite(r.id) }}
                        >
                          {/* 🔖🔖 [2026-08-18 창업자 확정] 걸린 것 = **요리사모자 클립이 카드 밖으로 걸친다.**
                              📮 *"딱 레시피 안에 넣기보다 **바깥에 걸쳐서** 넣는게 더 예쁜거 같아 레꾸도 안해치고"*
                              📮 *"오른쪽 완전끝말고 **살짝 왼쪽으로**"* → 셋을 견줘 **G3**(right 12px) 확정
                              📮 크기 = *"난 크기는 **26**이제일 괜찮아보이는데"* ＋ *"**표시용이니까 존재감이 너무 크면 곤란해**"*
                              🔢 26px 이면 폭 17px(이 컷 가로/세로 0.65) · 꾸민 표지를 가리는 넓이 **4% 미만**
                                 — 40px 은 48%, 44px 은 80% 를 가린다(콩국수 샘플 표지 실측).
                              ⭐ 큰 격자도 **같은 26px** — 창업자 *"큰 격자도 너무 크지않게 맞추면좋겠어"*.
                                 큰 격자는 카드가 1.5배라 44px 에서도 5%밖에 안 가리지만, 격자를 오갈 때
                                 크기가 변하면 「같은 물건」으로 안 읽힌다.
                              ⏳ **안 걸린 칸은 «아직 지금 그대로»**(연한 책갈피). 창업자 확정은 「텅 비우기」인데
                                 텅 비우면 **누를 자리가 사라져** 거는 방법을 길게 누르기로 옮겨야 한다 → 다음 단계. */}
                          <img
                            src={r.favorite ? idxChef : idxChefFaint}
                            alt=""
                            className="idx-clip"
                          />
                        </button>
                      )}
                      {edit && (
                        <div aria-hidden style={{ position: 'absolute', top: 7, right: 7, width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', background: on ? 'var(--brown)' : 'rgba(255,255,255,0.92)', border: on ? 'none' : '1.8px solid rgba(0,0,0,0.22)', boxShadow: '0 1px 5px rgba(0,0,0,0.22)' }}>
                          {on && <Icon name="check" size={15} color="#fff" stroke={3} />}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* 요리 기록 편집 모드 하단 바 */}
      {logEdit && view === 'log' && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(var(--nav-h) + 14px + var(--safe-bottom))', zIndex: 40, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 999, padding: '9px 12px 9px 18px', boxShadow: '0 8px 26px rgba(60,45,30,0.22)' }}>
            <span style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--text)' }}>
              {logSel.size > 0 ? `${logSel.size}개 선택` : '기록을 눌러 선택'}
            </span>
            {/* ⚠️ 「전체」 = **지금 화면에 있는 것**이다(옛 `shown`) — 그날 묶음 ＋ 그 달 묶음.
                ⛔ 겹침을 없앤 뒤로 둘은 남남이라, 한쪽만 세면 나머지가 선택에서 빠진다. */}
            <button className="press" style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text-sub)', padding: '6px 8px' }}
              onClick={() => setLogSel(logSel.size === shownAll.length ? new Set() : new Set(shownAll.map((e) => e.id)))}>
              {logSel.size === shownAll.length && shownAll.length > 0 ? '전체 해제' : '전체 선택'}
            </button>
            <button className="press" disabled={logSel.size === 0}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 999, background: logSel.size ? 'var(--danger)' : 'var(--cream)', color: logSel.size ? '#fff' : 'var(--text-sub)', fontSize: 16.5, fontWeight: 800 }}
              onClick={() => logSel.size && setDelLogAsk(true)}>
              <Icon name="trash" size={15} color={logSel.size ? '#fff' : 'var(--text-sub)'} /> 삭제
            </button>
          </div>
        </div>
      )}

      {delLogAsk && (
        <ConfirmSheet
          title="선택한 요리 기록 삭제"
          message={`선택한 요리 기록 ${logSel.size}개를 삭제할까요?\n삭제하면 되돌릴 수 없어요.`}
          confirmLabel={`${logSel.size}개 삭제하기`}
          danger
          onConfirm={() => {
            const n = logSel.size
            logSel.forEach((id) => removeDiary(id))
            setLogSel(new Set())
            nav.showToast(`요리 기록 ${n}개를 삭제했어요`)
          }}
          onClose={() => setDelLogAsk(false)}
        />
      )}

      {/* 모아보기 편집 모드 하단 바 */}
      {edit && view === 'grid' && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(var(--nav-h) + 14px + var(--safe-bottom))', zIndex: 40, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 999, padding: '9px 12px 9px 18px', boxShadow: '0 8px 26px rgba(60,45,30,0.22)' }}>
            <span style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--text)' }}>
              {sel.size > 0 ? `${sel.size}개 선택` : '카드를 눌러 선택'}
            </span>
            <button className="press" style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text-sub)', padding: '6px 8px' }}
              onClick={() => setSel(sel.size === list.length ? new Set() : new Set(list.map((r) => r.id)))}>
              {sel.size === list.length && list.length > 0 ? '전체 해제' : '전체 선택'}
            </button>
            <button className="press" disabled={sel.size === 0}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 999, background: sel.size ? 'var(--danger)' : 'var(--cream)', color: sel.size ? '#fff' : 'var(--text-sub)', fontSize: 16.5, fontWeight: 800 }}
              onClick={() => sel.size && setDelSelAsk(true)}>
              <Icon name="trash" size={15} color={sel.size ? '#fff' : 'var(--text-sub)'} /> 삭제
            </button>
          </div>
        </div>
      )}

      {delSelAsk && (
        <ConfirmSheet
          title="선택한 레시피 삭제"
          message={`선택한 레시피 ${sel.size}개를 삭제할까요?\n삭제하면 되돌릴 수 없어요.`}
          confirmLabel={`${sel.size}개 삭제하기`}
          danger
          onConfirm={() => {
            const n = sel.size
            sel.forEach((id) => removeRecipe(id))
            setSel(new Set())
            nav.showToast(`레시피 ${n}개를 삭제했어요`)
          }}
          onClose={() => setDelSelAsk(false)}
        />
      )}

      {newFolder && (
        <PromptSheet
          title="새 폴더"
          fields={[{ key: 'name', label: '폴더 이름', placeholder: '예) 자주 만드는' }]}
          onSubmit={({ name }) => { const nm = name.trim(); if (nm) addFolder(nm) }}
          onClose={() => setNewFolder(false)}
        />
      )}

      {delFolder && (
        <ConfirmSheet
          title="폴더 삭제"
          message={`'${delFolder}' 폴더를 삭제할까요?\n안에 있던 레시피는 지워지지 않고 카테고리로 돌아가요.`}
          confirmLabel="삭제하기"
          danger
          onConfirm={() => { removeFolder(delFolder); nav.showToast('폴더를 삭제했어요') }}
          onClose={() => setDelFolder(null)}
        />
      )}

      {/* ⛔ 「요리 기록 남기기」 시트는 2026-08-07 에 여기서 뺐다 —
             「한끼 일기」 앨범을 누르면 «그날 일기»로 간다(위 `album-tile` 참고).
             기록 고치기와 「한마디 청하기」는 **레시피 상세**에 그대로 있다. */}
      {/* ⭐ 보고 있는 것에 맞는 코치만 띄운다 — 일기 화면에서 「보기 바꾸기」를 안내하면 앞뒤가 안 맞고,
          그 단추는 일기 화면에 «있지도 않다»(코치가 그 단계를 건너뛴다). */}
      {coach && view !== 'log' && <CoachMarks storageKey={MYRECIPES_COACH_KEY} steps={MYRECIPES_COACH_STEPS} onDone={() => setCoach(false)} />}
      {dCoach && view === 'log' && <CoachMarks storageKey={DIARY_COACH_KEY} steps={DIARY_COACH_STEPS} onDone={() => setDCoach(false)} />}
    </>
  )
}
