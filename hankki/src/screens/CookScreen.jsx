import { useState, useRef } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import TimerSheet from '../components/TimerSheet'
import CookBuddy from '../components/CookBuddy'
import KitchenGuideSheet from '../components/KitchenGuideSheet'
import MemoNote from '../components/MemoNote'
import CropSheet from '../components/CropSheet'
import { downscale } from '../components/DiaryEntrySheet'
import Portal from '../components/Portal'
import { scaleIngredient } from '../scale'
import { useWakeLock } from '../useWakeLock'
import { useLayerBack } from '../useBackHandler'
import { 항목묶어 } from '../stepBreak'
import { 열쇠받기, EARN, KEY_NAME, KEY_UNIT } from '../ocr'

// 요리 모드 — 풀스크린. 큰 글씨 · 화면 안 꺼짐 · 단계 타이머.
// 흐름: 0단계 = 재료 준비(요리의 시작) → 1~N단계 = 조리 단계.
export default function CookScreen({ id }) {
  const { recipes, cook, addDiary, updateDiary, updateRecipe, diary } = useStore()
  const nav = useNav()
  const r = recipes.find((x) => x.id === id)
  const steps = r?.steps || []
  const ings = r?.ingredients || []
  const [i, setI] = useState(0) // 0 = 재료 준비, 1..steps.length = 조리 단계
  const [showTimer, setShowTimer] = useState(false)
  const [showIng, setShowIng] = useState(false)
  // ☑️ 재료 준비 체크 — 🧪**테스터 의견**(창업자 전달 2026-08-09 *"아까 요리재료에 체크표시 넣었으면 좋겠다는 거 테스터 의견이야"*)
  //    원문 = *"요리 시작 누른 뒤 준비단계에서 체크박스가 있으면 어떨까. 단순 체크용도로."*
  //    ⭐ **저장하지 않는다.** 이건 «이번에 요리하는 동안»만 쓰는 표시라, 다음에 또 만들 땐 깨끗해야 한다.
  //       (레시피에 저장하면 다음번에 «남이 체크해둔 것»처럼 보인다)
  //    ⭐ 상태를 CookScreen 이 들고 있어서 조리 단계로 갔다 돌아와도 체크가 남는다.
  const [checked, setChecked] = useState({})
  const toggle = (k) => setChecked((c) => ({ ...c, [k]: !c[k] }))
  // 재료 시트 — 뒤로가기로 닫기(요리모드는 유지). 타이머 시트는 자체 처리.
  useLayerBack(showIng, () => setShowIng(false))
  useWakeLock() // 화면이 꺼지지 않게 (요리 모드)
  const prep = i === 0 // 재료 준비 화면인지
  // 📖 요리 가이드(계량·손질) — 🧪**테스터 의견**(창업자 전달 2026-08-14)
  //    원문 = *"재료손질 화면에서도 요리가이드 있었으면 좋겠데"* ＋ 창업자 풀이
  //    *"요리가이드 있자나 물음표. 그거 누르면 재료별 손질법이랑 계량하는거 등등 나오는거.
  //      그걸 «요리시작 누르고 재료 쭉 나열될 때»도 볼 수 있게 하면 좋겠다는거지"*
  //    ⭐ **새로 만든 게 0이다** — 「KitchenGuideSheet」 가 이미 계량 지표 ＋ 재료 손질법을 담고 있다.
  //       레시피 상세와 설정에서만 열리던 걸 **재료를 꺼내는 «바로 그 자리»** 에도 놓는다.
  //    📌 여기가 제일 필요한 자리다 — 손질법은 «읽을 때»가 아니라 «칼 잡을 때» 찾는다.
  const [guide, setGuide] = useState(false)
  // 📷📷 **완성 사진** — 창업자 2026-08-21 갈래 ⓒ 확정
  //    📮 *"음식앱인데 생동감이 부족하달까.. 음식사진이나 영상이 하나도 없으니까"*
  //    🔢 실측 = 앱이 쓰는 기본 레시피 **145편 · 진짜 사진 0편**(표지 icon 144 · none 1).
  //
  //    ⭐⭐ **사진이 «없는» 게 아니라 «버리고» 있었다** — 여기 `finish()` 가 `photo: null` 로 담았다.
  //       「다 만들었어요」를 누르는 그 순간이 **음식이 눈앞에 있는 유일한 순간**인데 안 물어봤다.
  //
  //    ⛔⛔ **「끝난 뒤 기록 시트를 띄우기」는 «이미 접은 길»이다** — `RecipeDetailScreen.jsx:170`
  //       *"별점·메모·사진을 묻는 폼이 앞을 막아서, 그게 요리 기록 탭이 죽은 이유 중 하나였다(마찰)"*
  //       ＋ 창업자가 「한 줄 남기기」에서도 사진 칸을 뺐다(*"이거 사진추가가 의미가 있어?"* · `OneLineSheet.jsx:9`).
  //    ✅ 그래서 **끝난 «뒤»가 아니라 끝나기 «전»에 «선택지»로 둔다.**
  //       안 누르면 화면도 흐름도 지금과 «한 글자도» 안 다르다 — 막는 게 없으니 그 마찰이 안 생긴다.
  //
  //    ⛔ 유니코드 이모지 금지(CLAUDE.md 핀) → 우리 `Icon name="camera"`.
  const [photo, setPhoto] = useState(null)
  const [cropSrc, setCropSrc] = useState(null)
  const photoRef = useRef(null)
  // 🎴 「표지로도 쓰기」 기본값 — **꾸민 표지가 있으면 «꺼짐»**.
  //    ⭐ 유저가 레꾸로 꾸며 둔 레시피를 내가 말없이 덮으면 «잃은 것»으로 읽힌다.
  //       (실제로 `decor` 는 안 지워지지만 아이콘 자리가 사진으로 바뀌어 «달라 보인다»)
  //    ⛔ 훅은 조건부 `return` «앞»에 — 뒤에 두면 훅 개수가 갈려 앱이 죽는다(v11.16 교훈).
  const [asCover, setAsCover] = useState(() => !(recipes.find((x) => x.id === id)?.decor?.length > 0))

  if (!r || steps.length === 0) {
    return (
      <div className="cook">
        <div className="cook-top">
          <button className="round-btn press" onClick={() => nav.pop()}><Icon name="x" size={22} /></button>
        </div>
        <div className="empty" style={{ marginTop: 40 }}>만드는 법 단계가 없어요.</div>
      </div>
    )
  }

  const last = i >= steps.length // 마지막 조리 단계 (i는 1..steps.length)

  const onPhotoFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCropSrc(reader.result) // 자르기부터 (일기 사진과 같은 흐름)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const finish = () => {
    // 오늘 이미 이 레시피 기록이 있으면(상세의 '만들었어요' 등) 중복으로 쌓지 않는다
    const today = new Date().toDateString()
    const 오늘것 = diary.find((d) => d.recipeId === r.id && new Date(d.at).toDateString() === today)
    if (!오늘것) {
      addDiary({ id: newId(), recipeId: r.id, title: r.title, source: r.source, at: Date.now(), rating: 0, note: '', photo })
      // 🎁 요리모드를 끝냈다 — 평생 1회. ⛔「처음인가」는 «서버»가 정한다(폰이 세면 지웠다 깔 때마다 또 받는다).
      열쇠받기(EARN.요리).then((받음) => { if (받음) nav.showToast(`요리모드를 처음 써봤어요 · ${KEY_NAME} 1${KEY_UNIT}를 더 받았어요`, 5200) })
      cook(r.id)
    } else if (photo && !오늘것.photo) {
      // ⭐ 오늘 이미 기록이 있어도 **찍은 사진은 안 버린다** — 그 기록에 사진만 채운다.
      //    ⛔ 이미 사진이 있으면 안 건드린다(유저가 넣어둔 걸 덮지 않는다).
      updateDiary(오늘것.id, { photo })
    }
    // 🎴 표지로도 — 유저가 켰을 때만. `decor`(레꾸 스티커)는 별개 층이라 안 죽는다(`Thumb.jsx:165`).
    //    ⛔ `imageFit` 은 «안» 넣는다 — 그건 자랑카드(판 전체가 그림)용이고,
    //       내 음식 사진은 창업자 확정대로 «이모지처럼 동그랗게»가 맞다(2026-08-17).
    if (photo && asCover) updateRecipe(r.id, { image: photo, thumb: 'photo' })
    nav.popAll()
    nav.showToast(
      photo
        ? (asCover ? '완성! 사진을 일기와 표지에 담았어요' : '완성! 사진과 함께 한끼 일기에 담았어요')
        : '완성! 한끼 일기에 담았어요 별점·팁은 레시피 화면에서',
    )
  }

  return (
    <div className="cook">
      <div className="cook-top">
        <button className="round-btn press" onClick={() => nav.pop()} aria-label="닫기"><Icon name="x" size={22} /></button>
        <div className="cook-title">{r.title}</div>
        <button className="cook-ing-btn press" onClick={() => setShowIng(true)}>재료</button>
      </div>

      <div className="cook-progress">
        {/* 0 = 재료 준비, 이후 조리 단계 */}
        {Array.from({ length: steps.length + 1 }).map((_, k) => (
          <button key={k} className={`cp-seg ${k <= i ? 'on' : ''}`} onClick={() => setI(k)} aria-label={k === 0 ? '재료 준비' : `${k}단계`} />
        ))}
      </div>

      {prep ? (
        <div className="cook-body">
          <div className="cook-stepno">재료 준비 <span>· 요리의 시작</span></div>
          {/* 📖 [2026-08-14 테스터] 재료를 꺼내는 «바로 이 자리»에서 계량·손질법을 열 수 있게.
              ⭐ 레시피 상세의 것과 «같은» 시트다 — 새로 만든 게 없다.
              ⚠️ 글자 버튼이다(옛 「?」 는 작고 뭔지 몰랐다 — 창업자 *"버튼 물음표 너무작고 모르니까"*). */}
          <button className="press" onClick={() => setGuide(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, margin: '8px auto 0', padding: '7px 14px', borderRadius: 999, background: 'var(--cream)', color: 'var(--brown)', fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap' }}>
            <Icon name="help" size={14} color="var(--brown)" />
            계량·손질
          </button>
          {/* 📌📌 지난번에 내가 남긴 한 줄 — «재료를 꺼내는 바로 이 자리»에 자동으로 붙는다
              📮 창업자 2026-08-19 *"그 한줄도 담에 만들때 바로 보여야 의미가 있는건데"*
                 ＋ *"약간 포스트잇 붙이듯이. 자동으로 붙여주면 유저는 편하겠지"*
              ⭐⭐ 여기가 그 자리인 이유 = 「간장 반만」은 **간장을 꺼내기 «전»에** 봐야 쓸모가 있다.
                 다 만들고 나서 보면 늦다. ⛔없으면 아무것도 안 그린다. */}
          <div style={{ width: '100%', maxWidth: 460, margin: '14px auto 0' }}>
            <MemoNote recipeId={r?.id} />
          </div>
          <div style={{ width: '100%', maxWidth: 460, margin: '4px auto 0', textAlign: 'left' }}>
            {/* ☑️ 눌러서 체크 — 🧪테스터 의견(창업자 전달 2026-08-09) *"준비단계에서 체크박스가 있으면 어떨까. 단순 체크용도로."*
                ⭐ 재료를 «꺼내면서» 하나씩 지워가는 자리다. 그래서 저장도 계산도 안 한다 — 표시만.
                ⭐ 줄 전체가 버튼이라 손가락이 작은 네모를 겨냥할 필요가 없다(최소 높이 44).
                ⛔ 유니코드 ✓ 대신 우리 아이콘(`check`)을 쓴다 — CLAUDE.md 핀. */}
            {ings.length ? ings.map((ing, k) => (
              <button
                key={k} type="button" className="press" aria-pressed={!!checked[k]}
                onClick={() => toggle(k)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11, width: '100%', minHeight: 44,
                  padding: '6px 4px', background: 'none', border: 'none', textAlign: 'left',
                }}>
                <span style={{
                  flex: '0 0 auto', width: 23, height: 23, borderRadius: 7,
                  border: checked[k] ? 'none' : '2px solid var(--line)',
                  background: checked[k] ? 'var(--brown)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {checked[k] && <Icon name="check" size={15} color="#fff" stroke={2.6} />}
                </span>
                {/* ⭐ 체크한 줄은 «흐리게 ＋ 취소선» — 「했다」가 한눈에 보인다(장보기 목록과 같은 문법)
                    ✍️ [창업자 2026-09-01] *"요리모드 첨에 재료나오는 화면도 글씨체 귀염체?로 바꿔야함."*
                       → `cook-ing` 이 귀염체를 준다. ⛔`.ing` 자체는 «안» 건드린다 —
                          레시피 «상세»의 재료 줄이 같은 클래스라 거기까지 손글씨가 된다(창업자가 말한 화면이 아니다). */}
                <span className="ing cook-ing" style={{
                  fontSize: 19, flex: 1, minWidth: 0,
                  opacity: checked[k] ? 0.44 : 1,
                  textDecoration: checked[k] ? 'line-through' : 'none',
                }}>{scaleIngredient(ing, 1)}</span>
              </button>
            )) : <div className="empty">재료 정보가 없어요.</div>}
          </div>
          {/* 안내 — 화면 안 꺼짐 · 타이머는 필요할 때 */}
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 9, width: '100%', maxWidth: 460 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 16.5, color: 'var(--text-sub)' }}>
              <Icon name="bulb" size={18} color="var(--brown)" stroke={1.8} />
              요리하는 동안 화면이 꺼지지 않아요.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 16.5, color: 'var(--text-sub)' }}>
              <Icon name="clock" size={18} color="var(--brown)" stroke={1.8} />
              타이머는 필요할 때 단계에서 눌러 쓰세요.
            </div>
          </div>
        </div>
      ) : (
        <div className="cook-body">
          {/* ※ [2026-09-01 창업자 판정 ⓐ] 곁말은 «빈 걸음»을 만들지 않고 이 걸음 아래 작게 붙는다.
              ⛔ 꼬르곰 판정(`CookBuddy`)엔 «첫 줄»만 준다 — 곁말은 시킬 일이 아니라 참고라서
                 거기 든 낱말(「돌려깎기」 등)로 캐릭터가 정해지면 안 된다. */}
          <CookBuddy stepText={String(steps[i - 1] || '').split('\n')[0]} />
          <div className="cook-stepno">STEP {i} <span>/ {steps.length}</span></div>
          <div className="cook-steptext">
            {/* ✂️· 「다진 마늘」처럼 «한 항목»이 줄에서 갈리지 않게 — 끊는 자리는 가운뎃점
                (창업자 2026-09-01 *"3큰술 · 다진마늘이잖아. 그럼 다진마늘부터 줄이 바뀌어야지"* · 왜·어떻게 = src/stepBreak.jsx) */}
            {항목묶어(String(steps[i - 1] || '').split('\n')[0])}
            {String(steps[i - 1] || '').split('\n').slice(1).map((t, j) => (
              <div key={j} className="step-tip">{t}</div>
            ))}
          </div>
          <button className="cook-timer press" onClick={() => setShowTimer(true)}>
            <Icon name="clock" size={19} color="var(--brown)" /> 이 단계 타이머 맞추기
          </button>
        </div>
      )}

      {/* 📷 완성 사진 — «마지막 단계에서만». 누르지 않으면 아무 일도 안 일어난다(막지 않는다). */}
      {last && (
        <div className={`cook-shot ${photo ? '' : 'cook-shot-empty'}`}>
          <input ref={photoRef} type="file" accept="image/*" onChange={onPhotoFile} style={{ display: 'none' }} />
          {photo ? (
            <>
              <img src={photo} alt="완성 사진" className="cook-shot-thumb" />
              {/* ⭐ 「표지로도 쓰기」 — 줄 전체가 버튼이라 손가락이 작은 네모를 겨냥할 필요가 없다(최소 높이 44) */}
              <button
                type="button" className="press cook-shot-cover" aria-pressed={asCover}
                onClick={() => setAsCover((v) => !v)}
              >
                <span className={`cook-shot-box ${asCover ? 'on' : ''}`}>
                  {asCover && <Icon name="check" size={15} color="#fff" stroke={2.6} />}
                </span>
                레시피 표지로도 쓰기
              </button>
              <button
                type="button" className="press cook-shot-x" aria-label="완성 사진 지우기"
                onClick={() => setPhoto(null)}
              >
                <Icon name="x" size={17} color="var(--text-sub)" />
              </button>
              {/* 📔 [2026-08-24 창업자 제보] **어디에 담기는지 말한다**
                  📮 *"요리모드→사진→레시피표지로 넣으시겠습니까? 하면 일기탭이랑 달력에자동저장되네..
                     난 레꾸표지만 되는 줄. **안내가 없어서.**"*
                  ⛔ 위 체크박스는 **표지만** 말한다. 그런데 사진은 체크와 «무관하게 항상»
                     일기(`addDiary`/`updateDiary` · 96·101줄)와 달력 칸(`MyRecipesScreen.jsx:157`)에 담긴다.
                  ⭐ 그래서 「도」를 쓴다 — 「표지로도 쓰기」와 «별개로» 이미 담긴다는 뜻.
                  ⛔ 체크박스 «안»에 넣지 않는다 — 그러면 「체크를 끄면 일기에도 안 가나?」로 읽힌다. */}
            </>
          ) : (
            // ⭕ [창업자 확정 2026-08-23 = 시안 ㉤] 동그라미 ＋ 아래 글자.
            //    ⛔ 옛 판(가로 점선 네모)은 «보이는데 안 읽혔다» — 창업자 본인도 이틀을 못 찾았다.
            //    ⭐ `aria-label` 은 「완성 사진 남기기」 그대로 — 보이는 글자는 원 아래라 짧아야 한다.
            <>
              <button
                type="button" className="press cook-shot-add" aria-label="완성 사진 남기기"
                onClick={() => photoRef.current?.click()}
              >
                <Icon name="camera" size={25} color="#fff" />
              </button>
              <span className="cook-shot-label">완성 사진</span>
            </>
          )}
        </div>
      )}
      {last && photo && (
        <div className="cook-shot-note">사진은 한끼 일기·달력에도 담겨요</div>
      )}

      <div className="cook-nav">
        <button className="cook-navbtn press" disabled={i === 0} onClick={() => setI((v) => Math.max(0, v - 1))}>
          이전
        </button>
        {prep ? (
          <button className="cook-navbtn primary press" onClick={() => setI(1)} disabled={steps.length === 0}>재료 준비 완료 · 시작 →</button>
        ) : last ? (
          <button className="cook-navbtn primary press" onClick={finish} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}><Icon name="check" size={17} />다 만들었어요</button>
        ) : (
          <button className="cook-navbtn primary press" onClick={() => setI((v) => v + 1)}>다음 →</button>
        )}
      </div>

      {showTimer && <TimerSheet label={`${r.title} · STEP ${i}`} onClose={() => setShowTimer(false)} />}
      {/* ✂️ 자르기 — 일기 사진과 «같은» 시트·같은 축소 함수를 쓴다(새로 만든 게 0이다) */}
      {cropSrc && (
        <CropSheet
          image={cropSrc}
          title="완성 사진 자르기"
          hint={<>모서리를 끌어 <b style={{ color: '#f0ede7' }}>음식만</b> 담아주세요.</>}
          doneLabel="이 부분만 담기"
          onDone={async (img) => { setCropSrc(null); setPhoto(await downscale(img)) }}
          onSkip={async () => { const s = cropSrc; setCropSrc(null); setPhoto(await downscale(s)) }}
          onCancel={() => setCropSrc(null)}
        />
      )}
      {/* 📖 요리 가이드(계량·손질) — 재료 준비 화면의 버튼이 연다 (테스터 의견 2026-08-14) */}
      {guide && <KitchenGuideSheet onClose={() => setGuide(false)} />}

      {showIng && (
       <Portal>
        <div className="sheet-mask" onClick={() => setShowIng(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 22 }}>
            <div className="emoji-sheet-head">
              <span>재료</span>
              <button className="press" onClick={() => setShowIng(false)} style={{ color: 'var(--text-sub)', fontSize: 16, fontWeight: 600 }}>닫기</button>
            </div>
            <div style={{ padding: '0 16px', maxHeight: '50vh', overflowY: 'auto' }}>
              {(r.ingredients || []).map((ing, k) => (
                <div key={k} className="ing">{scaleIngredient(ing, 1)}</div>
              ))}
            </div>
          </div>
        </div>
       </Portal>
      )}
    </div>
  )
}
