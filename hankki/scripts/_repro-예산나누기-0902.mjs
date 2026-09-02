// ⏱⏱ 「AI 가 되다 안 되다」 — 앱과 워커가 «예산»을 나눠 쓰나 (2026-09-02) 〔smoke〕
//
// 📮 창업자 = *"불안정하다.. ai가 읽을때가 있고 못읽을때가 있고.. 열쇠는 차감안된거지? (못읽으면)"*
//    → 폰 실물 이유 = **`기본 정리예요(timeout)`**
// 📮📮 그리고 못 박았다 = *"**땜빵하는 설계는 절대금지**"* · *"**절대원칙이야. 그때그때 땜빵금지야.**"*
//
// ⛔⛔ **그래서 「앱 대기 60초 → 150초」를 «안» 한다.** 절대원칙 34 의 잣대 셋에 다 걸린다
//    (①숫자만 바꾼다 ②왜 150인지 잰 근거가 없다 ③175초 걸리면 똑같이 잃는다).
//
// 🔎 **진짜 뿌리 = 둘이 예산을 안 나눈다**
//    앱은 60초 세고 끊는데, 워커는 남은 시간을 몰라서 **앱이 끊은 뒤에도 다음 모델을 부른다**
//    → 아무도 못 받는 답에 뉴런을 태운다(전역 하루 통 = 우리 돈 · 절대원칙 32).
//
// ⭐⭐ **이 판은 «흉내»가 아니라 워커의 `fetch` 를 그대로 부른다**(절대원칙 30) —
//    가짜 `env.AI.run` 이 «느리게» 답하도록 두고, 진짜 모델 차례 루프가 도는 것을 잰다.
//
// ⚠️ **정직하게 — 이 판이 «못» 하는 것**
//    진짜 Workers AI 가 몇 초 걸리는지는 여기서 확인할 수 없다(workers.dev 로 못 나간다).
//    이 판은 「예산이 모자라면 안 부른다」를 지킬 뿐이고, **실제 시간은 워커 로그(`BUDGET_OUT`)가 말한다.**
//
// 실행: node scripts/_repro-예산나누기-0902.mjs   (exit 0 = 통과)
// 🏷 이름표 = 반영됨
import worker from '../ocr-proxy/worker-tidy.js'
import { tidyRecipe } from '../src/tidy.js'

let 통과 = 0
let 실패 = 0
const 칸 = (이름, 조건, 실물) => {
  if (조건) { 통과++; console.log(`  ✅ ${이름}`) } else { 실패++; console.log(`  ❌ ${이름}${실물 !== undefined ? ` — 실물: ${JSON.stringify(실물)}` : ''}`) }
}

const 글 = '보쌈 무김치인데 무는 1.5kg 이고 소금 2스푼 넣고 두 시간 절인 뒤에 고춧가루 7스푼과 까나리액젓 4스푼을 넣고 버무려요'

// ── 워커를 부르는 판 ─────────────────────────────────────────────
// ⛔ KV 를 안 붙인다 — 붙이면 상한 검사가 먼저 걸려 모델 루프까지 못 간다(여기서 재려는 건 루프다).
const 워커돌리기 = async ({ budgetMs, 한판걸리는시간 = 400 }) => {
  const 부른모델 = []
  const env = {
    AI: {
      run: async (model) => {
        부른모델.push(model)
        await new Promise((r) => setTimeout(r, 한판걸리는시간))
        return { 답없음: true } // ⛔ 레시피가 아니다 → 워커가 다음 모델로 넘어간다
      },
    },
  }
  const req = new Request('https://x/', {
    method: 'POST',
    // ⭐ 오리진은 워커가 «진짜로» 받는 값이라야 한다 — 안 주면 `forbidden_origin` 에서 먼저 끝나고
    //    모델 루프까지 못 간다(그러면 통과했는데 아무것도 안 잰다 · 규칙 18 ⓘ).
    headers: { 'content-type': 'application/json', origin: 'https://peachfam0307-glitch.github.io' },
    body: JSON.stringify({ text: 글, ...(budgetMs ? { budgetMs } : {}) }),
  })
  const resp = await worker.fetch(req, env, { waitUntil() {} })
  let 몸 = null
  try { 몸 = await resp.json() } catch { 몸 = null }
  return { 부른모델, status: resp.status, 몸 }
}

console.log('① 예산을 «안» 주면 예전과 똑같이 돈다 (옛 앱과 섞여도 안전)')
{
  const a = await 워커돌리기({ budgetMs: 0 })
  칸('모델을 «둘 이상» 부른다', a.부른모델.length >= 2, a.부른모델)
  칸('예산 때문이 아닌 이유로 끝난다', a.몸 && a.몸.error !== 'budget_out', a.몸)
}

console.log('② 예산이 모자라면 «다음» 모델을 안 부른다')
{
  // 한 판 400ms · 예산 600ms → 첫 판 뒤 400+3000(여유) >= 600 이라 둘째를 안 부른다
  const b = await 워커돌리기({ budgetMs: 600 })
  칸('부른 모델이 «하나»뿐이다', b.부른모델.length === 1, b.부른모델)
  칸('이유가 「budget_out」이다', b.몸 && b.몸.error === 'budget_out', b.몸)
}

console.log('③ ⛔ 예산이 아무리 적어도 «첫» 모델은 부른다')
{
  // 「아껴서 아무것도 안 하는」 것이 제일 나쁘다 — 한 번은 반드시 걸어 본다.
  const c = await 워커돌리기({ budgetMs: 1 })
  칸('첫 모델은 불렀다', c.부른모델.length === 1, c.부른모델)
}

console.log('④ 앱이 「남은 예산」을 실어 보낸다')
{
  const 본것 = []
  const 옛fetch = globalThis.fetch
  globalThis.fetch = async (url, opt) => {
    본것.push(JSON.parse(opt.body))
    return { ok: true, json: async () => ({ title: '보쌈 무김치', ingredients: ['무 1.5kg'], steps: ['썰어요'], memo: '' }) }
  }
  try {
    await tidyRecipe(글)
    const b = 본것[0] || {}
    칸('`budgetMs` 를 보낸다', typeof b.budgetMs === 'number', b.budgetMs)
    칸('0보다 크다', b.budgetMs > 0, b.budgetMs)
    // ⛔ 앱이 세는 시간(60초)보다 클 수 없다 — 크면 워커가 「아직 여유 있다」고 잘못 판단한다
    칸('앱이 기다리는 시간을 안 넘는다', b.budgetMs <= 60000, b.budgetMs)
    칸('글자도 같이 보낸다(옛 칸을 안 깨뜨렸다)', typeof b.text === 'string' && b.text.length > 0)
  } finally { globalThis.fetch = 옛fetch }
}

console.log(`\n${통과}/${통과 + 실패} 통과`)
process.exit(실패 ? 1 : 0)
