// 🖼 명절 컷 그림 — ⛔ 이 파일을 «정적으로» import 하지 말 것.
//   철이 아닌 유저까지 355KB 를 받게 된다. 부르는 곳은 `useSeasonCuts.js` 하나뿐이고
//   거기서 `import()` 로 «철일 때만» 받는다 (절대원칙 32 — 유저 수 × 용량).
// 🔢 webp 84 로 담았다 — png 원본 2,456KB → 355KB (1/7). 표시 크기의 3배까지만 줄였다.
import 추석소품01 from '../assets/stickers/season/추석소품01.webp'
import duo301 from '../assets/stickers/season/duo301.webp'
import duo401 from '../assets/stickers/season/duo401.webp'
import duo101 from '../assets/stickers/season/duo101.webp'
import 거미줄02 from '../assets/stickers/season/거미줄02.webp'
import 거미줄03 from '../assets/stickers/season/거미줄03.webp'
import 박쥐짙은02 from '../assets/stickers/season/박쥐짙은02.webp'
import 박쥐짙은03 from '../assets/stickers/season/박쥐짙은03.webp'
import 박쥐짙은04 from '../assets/stickers/season/박쥐짙은04.webp'
import cs_b02 from '../assets/stickers/season/cs_b02.webp'
import hb09 from '../assets/stickers/season/hb09.webp'
import hb12 from '../assets/stickers/season/hb12.webp'
import hw_02 from '../assets/stickers/season/hw_02.webp'
import hw_03 from '../assets/stickers/season/hw_03.webp'
import hw_06 from '../assets/stickers/season/hw_06.webp'
import hw_09 from '../assets/stickers/season/hw_09.webp'
import hw_13 from '../assets/stickers/season/hw_13.webp'
// 🇰🇷 명절 한복 컷 — 📮창업자 2026-09-09 *"한끼소식이랑 아직 안해봤어요 자리에.. 쟤들만 한복아니니까 이상해서"*
import 한복곰 from '../assets/stickers/season/한복곰.webp'
import 한복펭 from '../assets/stickers/season/한복펭.webp'

export default {
  추석소품01, duo301, duo401, duo101, 거미줄02, 거미줄03,
  박쥐짙은02, 박쥐짙은03, 박쥐짙은04,
  cs_b02, hb09, hb12, hw_02, hw_03, hw_06, hw_09, hw_13,
  한복곰, 한복펭,
}
