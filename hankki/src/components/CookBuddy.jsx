// 요리 친구 — 요리 모드에서 은은하게 움직이는 우리 꼬르곰.
//
// 예전엔 냄비·팬 SVG 도형이었다. 창업자 지적(2026-07-30 "요리시작할때 우리애들 나오면 좋겠고")대로
// 우리 캐릭터로 바꿨다. **요리 모드는 유저가 가장 오래 머무는 화면인데 정작 우리 애들이 없었다.**
//
// 단계 문구를 보고 알맞은 모습을 고른다(끓이기=냄비 든 꼬르곰 / 볶기=팬 / 반죽 / 면 / 손질).
// ⛔ 시선을 뺏지 않는다 — 작고 느리게, 말풍선 없이 그림만.
//    (`docs/리텐션-설계원칙-2026-07-30.md` — 캐릭터는 한 마디만, 또는 아무 말도)
// 모션은 앱 공용 클래스(`hk-m-*`, styles.css)를 쓴다. 옛 buddy-pot/buddy-pan 키프레임은 이제 안 쓴다.
import gomPot from '../assets/sharepool/gom_pot.png'
import gomPan from '../assets/sharepool/gom_pan.png'
import gomDough from '../assets/sharepool/gom_dough.png'
import gomPasta from '../assets/sharepool/gom_pasta.png'
import gomCarrot from '../assets/sharepool/gom_carrot.png'
import duoCooking from '../assets/sharepool/duo_cooking.png'

// ⚠️ 순서가 곧 우선순위 — 위에서 먼저 걸린 게 이긴다.
//    '면을 삶는다'는 면이 더 특정적이라 끓이기보다 위에,
//    '채소를 볶는다'가 손질로 안 가게 볶기를 손질보다 위에 둔다.
// ⛔ 한 글자 낱말은 쓰지 말 것 — 조건 어미·대명사에 걸려 엉뚱한 그림이 나온다.
//    실제로 잡은 오매칭(2026-07-30): `면` → *"끓어오르**면** 중불로"* 가 면 요리로 잡혔다.
//    `우리`(육수를 우리다) 도 대명사 "우리"에 걸린다 → `우려`로 좁혔다.
const KINDS = [
  { re: /파스타|스파게티|국수|우동|라면|소면|당면|면발|면을 |면이 |면 삶/, img: gomPasta, motion: 'hk-m-tongtong' },
  { re: /볶|튀기|굽|부치|지지|구워|노릇/, img: gomPan, motion: 'hk-m-tongtong' },
  { re: /반죽|섞|버무리|치대|무치|주무르/, img: gomDough, motion: 'hk-m-sway' },
  { re: /끓|삶|데치|우려|졸이|고아내/, img: gomPot, motion: 'hk-m-tongtong' },
  { re: /썰|다지|손질|채썰|깎|씻|다듬/, img: gomCarrot, motion: 'hk-m-tilt' },
]
// 기본 = 꼬르곰·펭펭이 함께 요리하는 컷(우리 대표 듀오)
const FALLBACK = { img: duoCooking, motion: 'hk-m-tongtong' }

export default function CookBuddy({ stepText = '' }) {
  const s = String(stepText)
  const pick = KINDS.find((k) => k.re.test(s)) || FALLBACK
  return (
    <div className="buddy">
      {/* 📏 크기는 **CSS 가 정한다**(`styles.css` 의 `.buddy img`) — 폰 104px · 패드 160px.
          ⛔ 여기 `style={{ height: … }}` 로 박으면 **인라인이 CSS 를 이겨서** 패드 media query 가 영영 안 먹는다.
             (2026-09-01 창업자 *"꼬르곰 크기 조금 키우고 … 자리많으니까"* 를 넣다가 그래서 CSS 로 옮겼다)
          🖼 원본 키 546~599px 이라 패드 160px 도 **3.4~3.7배 «축소»다**(검수 절대원칙 ③ 해상도) */}
      <img
        src={pick.img}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={pick.motion}
      />
    </div>
  )
}
