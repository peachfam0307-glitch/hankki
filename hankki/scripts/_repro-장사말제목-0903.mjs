// 🛒🏷 「제목이 «광고 문구»로 들어온다」 — 제목 사다리 네 번째 모양 (2026-09-03) 〔smoke〕
//
// 📮 창업자 폰 실물 = 그릇 협찬 글에 레시피가 딸려 있었는데 제목이
//    **「에뚜알퓨터 초특가로 진행 중이니」** → *"T로 되어있는 레시피야 **제목이 좀 당황스럽지만** 큰술로 바뀌었어"*
// 📮 그리고 창업자가 «없을 때 어떻게 할지»까지 정했다 —
//    *"레시피에 제목이 없으면 제목없음으로 나갈 수 밖에 없지않을까.."* → *"**차라리 제목없음으로 나가는게 낫겠다.**"*
//
// ⭐⭐ **이 판이 재는 것 = 「그 문구 하나를 막았나」가 «아니다».**
//    `_repro-제목사다리-0902` 주석에 내가 이렇게 적어 뒀다 —
//    *"같은 버그가 세 번 난 게 아니라 «사람이 세 가지로 쓴 것»이다. **네 번째 모양이 반드시 또 온다.**"*
//    ⑴해시태그 더미 ⑵계량 머리말 ⑶끝쉼표 → **⑷장사말(광고·협찬) 머리말.** 이게 그 넷째다.
//    ⭐ 그래서 **「버리고 «다음 줄»을 보나」**(＝사다리가 살아 있나)와
//       **「끝내 못 찾으면 «빈 채로» 내주나」**(＝앱이 「제목없음」으로 저장할 수 있나) 둘을 잰다.
//
// ⛔⛔ **제일 위험한 칸 = ⑥ 「재료·걸음은 안 거른다」.**
//    제목이 비면 유저가 알아채고 한 줄 적으면 되지만 **재료가 사라지면 유저는 없어진 줄도 모른다.**
//    낱말 목록으로 거르는 잣대라 «넓게» 쓰면 반드시 멀쩡한 재료를 먹는다.
//
// ⚠️ **정직하게 — 창업자 원문(rawText)은 못 받았다.** 폰 캡처 두 장으로 «재구성»한 글이다.
//    ⭐ 그래도 **제목으로 나온 글자와 재료 첫 줄은 캡처에 찍힌 그대로**라 그 둘은 실물이다.
//
// ⭐ 잣대 = 앱이 진짜 쓰는 모듈(절대원칙 30) — `parseRecipeText`·`머리에서제목`·`mergeTidy`·`자리표제목`
//
// 실행: node scripts/_repro-장사말제목-0903.mjs   (exit 0 = 통과)
// 🏷 이름표 = 반영됨
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseRecipeText, 머리에서제목, 장사말줄, 자리표제목, NO_TITLE } from '../src/parseRecipe.js'
import { mergeTidy } from '../src/tidy.js'

const 뿌리 = join(dirname(fileURLToPath(import.meta.url)), '..')
let 통과 = 0
let 실패 = 0
const 칸 = (이름, 조건, 실물) => {
  if (조건) { 통과++; console.log(`  ✅ ${이름}`) } else { 실패++; console.log(`  ❌ ${이름}${실물 !== undefined ? ` — 실물: ${JSON.stringify(실물)}` : ''}`) }
}

// ⛔ 캡처에 «그대로» 찍힌 두 줄 — 한 글자도 안 고친다(고치면 재는 게 달라진다)
const 광고제목 = '에뚜알퓨터 초특가로 진행 중이니'
const 그릇줄 = '클래식 슬림 오발 플레이트 280 (현재 소량 남아있음)'

console.log('① 창업자 폰에 뜬 그 제목 — 그대로 넣어 본다')
{
  칸('「장사말줄」이 그 문구를 잡는다', 장사말줄(광고제목) === true, 광고제목)
  칸('요리 이름은 «안» 잡는다 (거짓 경보 0)',
    !['돼지목살 숙성구이', '콩나물무침', '보쌈 무김치', '짬뽕밥', '초당옥수수 솥밥', '간장게장'].some(장사말줄))
}

console.log('② 광고 줄이 «맨 앞»이어도 다음 줄에서 이름을 집는다 (버리는 게 아니라 건너뛴다)')
{
  const 글 = `KT 12:10
${광고제목}
돼지목살 숙성 양념구이
${그릇줄}
돼지목살 2kg, 다진 마늘 5T
양조간장 6T
한입 크기로 잘라주고, 2덩이는 스테이크용으로 빼두기
냉장고에서 반나절 정도 숙성 후 구워주세요`
  const r = parseRecipeText(글, { fromOcr: true })
  칸('제목이 광고 문구가 «아니다»', r.title !== 광고제목, r.title)
  칸('제목에 「초특가」·「진행 중」이 안 남는다', !장사말줄(r.title || ''), r.title)
  칸('다음 줄의 요리 이름을 집었다', /돼지목살/.test(r.title || ''), r.title)
  // ⛔ 제목을 집었다고 재료가 사라지면 안 된다
  칸('재료가 살아 있다', r.ingredients.length >= 2, r.ingredients.length)
}

console.log('③ 이름이 «어디에도» 없으면 제목을 비운다 → 앱이 「제목없음」으로 저장한다')
{
  const 글 = `KT 12:10
${광고제목}
${그릇줄}
돼지목살 2kg, 다진 마늘 5T
한입 크기로 잘라주고 양념장을 부어주기`
  const r = parseRecipeText(글, { fromOcr: true })
  칸('제목이 광고 문구가 «아니다»', r.title !== 광고제목, r.title)
  칸('제목이 «빈다»(지어내지 않는다)', !r.title || !장사말줄(r.title), r.title)
  // ⭐ 빈 제목이 앱에서 어떻게 되나 = 「제목없음」. 그 자리표를 앱이 «알아본다»
  칸('빈 제목을 자리표로 본다', 자리표제목(r.title) === true, r.title)
}

console.log('④ 머리에서제목 — 광고 줄 하나만 있으면 빈손, 이름이 섞이면 이름')
{
  칸('광고 줄만 = 빈손', 머리에서제목(`KT 12:10\n${광고제목}\n${그릇줄}`) === '', 머리에서제목(`KT 12:10\n${광고제목}\n${그릇줄}`))
  const 섞임 = 머리에서제목(`KT 12:10\n${광고제목}\n돼지목살 숙성 양념구이`)
  칸('광고 줄 «뒤»의 이름은 집는다', /돼지목살/.test(섞임), 섞임)
}

console.log('⑤ AI 가 광고 줄을 제목으로 줘도 «안 받는다» (mergeTidy · 절대원칙 30)')
{
  const 기본 = { title: '돼지목살 숙성 양념구이', ingredients: ['돼지목살 2kg'], steps: ['구워요'], memo: '' }
  const m = mergeTidy(기본, { title: 광고제목, ingredients: ['돼지목살 2kg'], steps: ['구워요'], memo: '' })
  칸('AI 광고 제목을 버린다', m.title !== 광고제목, m.title)
  칸('규칙 파서 제목이 살아난다', m.title === '돼지목살 숙성 양념구이', m.title)
  // ⛔ 멀쩡한 AI 제목은 그대로 받아야 한다 — 거르기가 세면 이 칸이 죽는다
  const m2 = mergeTidy(기본, { title: '돼지목살 숙성구이', ingredients: [], steps: [], memo: '' })
  칸('멀쩡한 AI 제목은 그대로 받는다', m2.title === '돼지목살 숙성구이', m2.title)
}

console.log('⑥ ⛔⛔ 재료·걸음은 «안» 거른다 — 여기가 이 판의 심장')
{
  const 글 = `돼지목살 숙성 양념구이
재료
초특가 한우 등심 300g
할인 중인 양조간장 6T
만드는 법
1. 세일하는 마늘 5T를 넣고 버무려주세요`
  const r = parseRecipeText(글, { fromOcr: true })
  const 재료글 = r.ingredients.join(' / ')
  const 걸음글 = r.steps.join(' / ')
  칸('「초특가」 든 재료가 안 사라진다', /초특가 한우 등심/.test(재료글), r.ingredients)
  칸('「할인」 든 재료가 안 사라진다', /할인/.test(재료글), r.ingredients)
  칸('「세일」 든 걸음이 안 사라진다', /세일/.test(걸음글), r.steps)
}

console.log('⑦ 자리표 판정이 «한 곳»에서 나온다 (App·상세가 같은 자를 쓴다)')
{
  칸('빈 제목 = 자리표', 자리표제목('') === true)
  칸('「사진 레시피」 = 자리표(옛 것도 그대로)', 자리표제목('사진 레시피') === true)
  칸(`「${NO_TITLE}」 = 자리표`, 자리표제목(NO_TITLE) === true)
  칸('진짜 요리 이름 = 자리표 아님', 자리표제목('돼지목살 숙성 양념구이') === false)
  // ⛔ 앞뒤 공백만 있는 것도 빈 것이다
  칸('공백뿐인 제목 = 자리표', 자리표제목('   ') === true)
}

console.log('⑧ 배선 — 앱이 진짜로 그 잣대를 «부르나» (규칙 18 ⓘ)')
{
  const 읽기 = (p) => readFileSync(join(뿌리, p), 'utf8')
  const ed = 읽기('src/screens/EditorScreen.jsx')
  칸('편집 화면이 NO_TITLE 을 파서에서 가져온다', /import \{[^}]*NO_TITLE[^}]*\} from '\.\.\/parseRecipe'/.test(ed))
  칸('제목이 비어도 저장이 «안» 막힌다', /const canSave = hasDraftContent/.test(ed))
  칸('제목이 비면 NO_TITLE 로 저장한다', /f\.title\.trim\(\) \|\| NO_TITLE/.test(ed))
  const app = 읽기('src/App.jsx')
  칸('공유받기 판정이 자리표제목을 부른다', /자동제목인가 = 자리표제목\(/.test(app))
  칸('App 이 자리표제목을 가져온다', /import \{[^}]*자리표제목[^}]*\} from '\.\/parseRecipe'/.test(app))
  const dt = 읽기('src/screens/RecipeDetailScreen.jsx')
  칸('상세 「다시 정리」도 자리표제목을 부른다', /const 자리표 = 자리표제목\(r\.title\)/.test(dt))
  const td = 읽기('src/tidy.js')
  칸('AI 합치기가 요리이름만을 거친다', /title: 요리이름만\(/.test(td))
  // ⛔⛔ 파서는 장사말을 «읽기는» 해야 한다 — 재료·걸음에서 그 낱말을 지우면 안 된다
  const pr = 읽기('src/parseRecipe.js')
  칸('장사말 잣대는 «제목 자리»에서만 쓴다',
    (pr.match(/요리이름만\(/g) || []).length <= 2 && !/ingredients:[^\n]*요리이름만/.test(pr))
}

console.log(`\n${실패 ? '⛔' : '✅'} ${통과}칸 통과 · ${실패}칸 죽음`)
process.exit(실패 ? 1 : 0)
