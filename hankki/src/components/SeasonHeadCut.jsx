// 🧢 탭 상단바 캐릭터 — 명절엔 «바꿔 끼운다».
// 📮 창업자 확정 2026-09-09 = *"그 자리에 넣어야지 기존캐릭터떼고"* · *"이대로가자"*
//   ⛔ 위에 얹지 않는다 — 한 화면에 캐릭터가 둘이 되면 안 된다(2026-08-13 장보기 판단과 같은 결).
//   ⭐ 키움 1.32 · 아래로 5px. 그런데 «상단바 높이는 안 늘어난다» —
//      지금도 음수 여백으로 줄 밖에 나와 있어서, 키운 만큼 음수 여백을 키우면
//      줄에 «기여하는» 높이가 그대로다. 그래서 아래 내용이 하나도 안 밀린다.
//   📄 실측·판정 전문 = `docs/명절-탭상단바-창업자확정-2026-09-09.md`
import { 탭컷, 키움, 내림 } from '../data/seasonDecor.js'
import { useSeasonCuts } from '../season/useSeasonCuts.js'

export default function SeasonHeadCut({ 탭, 기본, 폭, 높이, 여백, 모션, style }) {
  const { 철, 컷 } = useSeasonCuts()
  const 키 = 철 && 탭컷[철]?.[탭]
  const 명절 = 키 && 컷?.[키]

  // 🍚 평상시 — 지금까지 쓰던 그대로.
  if (!명절) {
    return (
      <img src={기본} alt="" draggable={false} width={폭} height={높이} className={모션}
        style={{ display: 'block', objectFit: 'contain', margin: `${여백}px 0`, ...style }} />
    )
  }

  // 🎑🎃 명절 — 높이만 키우고 폭은 «그림 비율대로» 늘어나게 둔다(찌그러지면 안 된다).
  const 새높이 = Math.round(높이 * 키움)
  // 줄에 «기여하는» 높이 = 높이 + 여백×2. 그 값을 그대로 유지하는 새 여백.
  const 기여 = 높이 + 여백 * 2
  const 새여백 = Math.round((기여 - 새높이) / 2)
  return (
    <img
      src={명절} alt="" draggable={false} height={새높이} className={모션}
      onError={(e) => { e.currentTarget.style.display = 'none' }}
      style={{
        display: 'block', objectFit: 'contain', width: 'auto', height: 새높이,
        // ⬇ 아래로 5px — 창업자 *"머리가 닿아 다들"*
        marginTop: 새여백 + 내림, marginBottom: 새여백 - 내림,
        flex: '0 0 auto',
        ...style,
      }}
    />
  )
}
