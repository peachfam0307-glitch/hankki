#!/usr/bin/env node
// 🤖🔐 AI 다듬기 «허락» 재현판 — 2026-09-08 (큰 틀 6-② · 창업자 확정 ⓑ)
//
// 재는 것
//   ① 허락 전엔 tidyRecipe 가 «한 바이트도» 안 보낸다(fetch 0) · 이유 = 동의안함 · 저장도 안 남긴다(시트가 없으면 못 물은 것)
//   ② 'no' 면 fetch 0 · 다시묻기=true 면 시트에 다시 묻는다
//   ③ 시트가 'yes' 라 답하면 그때부터 fetch 가 나가고 답이 폰에 남는다(다음엔 안 묻는다)
//   ④ 묻는 중에 또 부르면 시트는 «한 번»만 뜬다(같은 약속)
//   ⑤ 뒤로가기(답 없음) = 저장 안 함 · 이번엔 안 보냄
//   ⑥ 글자 = 시트에 무엇을·어디로·왜·보관 넷 · 방침 4-1·8-다 · 설정 줄 · 수동 단추 셋은 대기창 «앞»에서 다시묻기 · App 에 시트 마운트
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 읽기 = (p) => fs.readFileSync(path.join(여기, '..', p), 'utf8')
let 나쁨 = 0
const 잰다 = (좋나, 이름, 덧 = '') => { if (!좋나) 나쁨++; console.log(`  ${좋나 ? '✅' : '⛔'} ${이름}${덧 ? ' — ' + 덧 : ''}`) }

// 가짜 폰 — localStorage · window(이벤트)
const 서랍 = new Map()
globalThis.localStorage = { getItem: (k) => (서랍.has(k) ? 서랍.get(k) : null), setItem: (k, v) => { 서랍.set(k, String(v)) }, removeItem: (k) => { 서랍.delete(k) } }
const 듣는이 = new Map()
globalThis.window = {
  addEventListener: (n, f) => { 듣는이.set(n, [...(듣는이.get(n) || []), f]) },
  removeEventListener: (n, f) => { 듣는이.set(n, (듣는이.get(n) || []).filter((g) => g !== f)) },
  dispatchEvent: (e) => { (듣는이.get(e.type) || []).forEach((f) => f(e)); return true },
}
globalThis.CustomEvent = class { constructor (type, o) { this.type = type; this.detail = o?.detail } }
let fetch수 = 0
globalThis.fetch = async () => { fetch수++; return { ok: false, status: 599 } }

const A = await import('../src/aiConsent.js')
const T = await import('../src/tidy.js')
const 글 = '재료: 두부 1모, 김치 200g, 돼지고기 150g, 대파 1대, 고춧가루 1큰술 · 만드는 법: 김치를 볶다가 물을 붓고 끓인 뒤 두부를 넣는다'

console.log('\n🤖🔐 AI 다듬기 허락\n')

// ① 시트 없음 = 못 물었다 → 안 보냄 · 저장 안 함
{
  fetch수 = 0; 서랍.clear()
  const r = await T.tidyRecipe(글, '')
  잰다(r === null && fetch수 === 0 && A.AI동의상태() === null, '① 허락 전(시트도 없음) = fetch 0 · 답 저장 안 함', `fetch ${fetch수} · 상태 ${A.AI동의상태()}`)
}
// 가짜 시트를 붙인다 — 다음 답을 미리 정해 둔다
let 다음답 = null, 뜬횟수 = 0
window.addEventListener(A.동의이벤트, (e) => { 뜬횟수++; e.detail.받았다(); setTimeout(() => e.detail.답(다음답), 0) })

// ② 'no' → fetch 0 · 다시묻기면 다시 뜬다
{
  fetch수 = 0; 서랍.clear(); 뜬횟수 = 0; 다음답 = 'no'
  const r = await T.tidyRecipe(글, '')
  잰다(r === null && fetch수 === 0 && A.AI동의상태() === 'no' && 뜬횟수 === 1, '② 「사용 안 함」 = fetch 0 · no 저장 · 시트 1번', `fetch ${fetch수} · 뜸 ${뜬횟수}`)
  const 다시 = await A.AI동의받기()
  잰다(다시 === false && 뜬횟수 === 1, '  ②-b no 인 채로 자동 길이 또 오면 «안 묻고» 안 보낸다')
  다음답 = 'yes'
  const 다시2 = await A.AI동의받기({ 다시묻기: true })
  잰다(다시2 === true && 뜬횟수 === 2 && A.AI동의상태() === 'yes', '  ②-c 단추를 직접 누르면(다시묻기) 다시 묻고 yes 로 바뀐다')
}
// ③ yes → fetch 나간다 · 다음엔 안 묻는다
{
  fetch수 = 0; 뜬횟수 = 0
  await T.tidyRecipe(글, '')
  잰다(fetch수 >= 1 && 뜬횟수 === 0, '③ yes 면 fetch 가 나가고 시트는 안 뜬다', `fetch ${fetch수}`)
}
// ④ 묻는 중에 또 부르면 한 번만
{
  서랍.clear(); 뜬횟수 = 0; 다음답 = 'yes'
  const [a, b] = await Promise.all([A.AI동의받기(), A.AI동의받기()])
  잰다(a === true && b === true && 뜬횟수 === 1, '④ 동시에 둘이 물어도 시트는 «한 번»', `뜸 ${뜬횟수}`)
}
// ⑤ 답 없음(뒤로가기)
{
  서랍.clear(); 뜬횟수 = 0; 다음답 = null; fetch수 = 0
  const r = await T.tidyRecipe(글, '')
  잰다(r === null && fetch수 === 0 && A.AI동의상태() === null, '⑤ 닫아 버리면 저장 안 함 · 이번엔 안 보냄(다음에 다시 묻는다)')
}
// ⑥ 글자
{
  const s = 읽기('src/components/AIConsentSheet.jsx')
  잰다(/무엇을/.test(s) && /어디로/.test(s) && /왜/.test(s) && /보관/.test(s) && /Cloudflare Workers AI/.test(s) && /사용할게요/.test(s) && /사용 안 함/.test(s), '⑥ 시트 = 무엇을·어디로·왜·보관 ＋ 공급자 이름 ＋ 단추 둘')
  잰다(!/llama|glm|gemma/i.test(s), '  ⑥-b 시트에 모델 이름을 박지 않았다(바뀐다)')
  const p = 읽기('public/privacy.html')
  잰다(/id="ai"/.test(p) && /4-1\. AI 다듬기/.test(p) && /라\. AI 다듬기/.test(p)   /* 8-라 — 8-다 는 이용 통계(배포 갈래 2026-09-08)가 먼저 차지했다 · 2026-09-10 합치며 옮김 */ && /Cloudflare Workers AI/.test(p) && /최대 1시간/.test(p) && /설정 → AI 다듬기 사용/.test(p), '  ⑥-c 방침 4-1(설명)·8-다(위탁·국외) ＋ 보관 1시간 ＋ 바꾸는 곳')
  잰다(/2026년 9월 8일/.test(p), '  ⑥-d 방침 시행일 갱신')
  const prof = 읽기('src/screens/ProfileScreen.jsx'); const g = 읽기('src/settingsGroups.js')
  잰다(/label: 'AI 다듬기 사용'/.test(prof) && /'AI 다듬기 사용'/.test(g), '  ⑥-e 설정 줄 「AI 다듬기 사용」 ＋ 갈래 등록')
  const 셋 = ['src/screens/InboxScreen.jsx', 'src/screens/RecipeDetailScreen.jsx', 'src/screens/EditorScreen.jsx'].map((f) => {
    const t = 읽기(f); const i = t.indexOf("AI동의받기({ 다시묻기: true })"); const j = t.indexOf('tidyRecipe(', i)
    return i > -1 && j > i
  })
  잰다(셋.every(Boolean), '  ⑥-f 수동 단추 셋 = 대기창·호출 «앞»에서 다시묻기', 셋.join(','))
  잰다(/<AIConsentSheet \/>/.test(읽기('src/App.jsx')), '  ⑥-g App 에 시트가 붙어 있다')
  잰다(/if \(!\(await AI동의받기\(\)\)\)/.test(읽기('src/tidy.js')), '  ⑥-h tidy.js 가 보내기 «전»에 묻는다(자동 길 포함)')
  // 🙅 [2026-09-13 배포 검수] 「사용 안 함」은 실패가 아니다 — 자동 길(App)·상세 만회가 tidyFail 로 안 적고, 안내말도 «선택»으로 말한다
  잰다(/동의안함으로끝났나\(\)\) \{ store\.updateRecipe\(rec\.id, \{ tidyFail: 0/.test(읽기('src/App.jsx')), '  ⑥-i App 자동 길 = 동의 안 함이면 tidyFail 지우고 「AI 없이 정리했어요」')
  잰다(/tidyFail: 동의안함으로끝났나\(\) \? 0 : 2/.test(읽기('src/screens/RecipeDetailScreen.jsx')), '  ⑥-j 상세 만회 = 동의 안 함이면 실패(2)로 안 굳힌다')
  잰다(/why === '동의안함'/.test(읽기('src/tidy.js')) && /AI 없이 정리했어요/.test(읽기('src/안내말.js')), '  ⑥-k 까닭 읽기(tidy.js) ＋ 안내말(안내말.js) 이 있다')
}

console.log(나쁨 ? `\n⛔ ${나쁨}칸 실패\n` : '\n✅ 허락 전엔 한 바이트도 안 나간다 · 한 번 묻고 · 설정에서 바꾼다\n')
process.exit(나쁨 ? 1 : 0)
