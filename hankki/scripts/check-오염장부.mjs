// 🧪🧪 «흐름을 고친 배포인데 오염 장부가 그대로인가» — 배포 게이트 (2026-09-16)
//
// 📮 창업자 = *"이럼 우리가 재는게 계속 오염되자나"* — 규칙(「고치면 장부에 적어라」)만 적으면 안 지켜진다. 장치로.
//
// 무엇을 보나 = 장부(docs/계측-오염장부.md)가 «마지막으로 바뀐 커밋» 뒤의 커밋들 중,
//   ⓐ src/ (data/ 빼고) · ocr-proxy/ 를 건드렸고  ⓑ 메시지에 «고침 낱말»이 있으면  → 장부가 그대로니 빨간불.
//   ⭐ 장부를 «한 줄이라도» 고치면 그 뒤로 다시 센다 — 장부를 만지는 것 자체가 「봤다」는 표식이다.
//   ⭐ 「(장부 해당 없음)」 을 메시지에 적으면 통과 — 단 그 말도 git 에 «남는다».
// ＋ 장부 표 꼴도 잰다 — 칸 다섯 · 시각 형식. 꼴이 깨지면 잣대 도구가 잘못 읽으니 그것도 빨간불.
//
// ⛔ 못 막는 것(정직하게) = 낱말 없는 고침 · 서버(워커) 직접 수정. 설계 문서 §5.
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const 앱뿌리 = new URL('../', import.meta.url)
const git뿌리 = new URL('../../', import.meta.url).pathname
const 장부길 = 'hankki/docs/계측-오염장부.md'
const sh = (c) => execSync(c, { cwd: git뿌리, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
const 죽는다 = (why) => { console.error(`\n⛔⛔ 오염 장부 게이트 — ${why}\n`); process.exit(1) }

// ── ① 표 꼴
const 장부 = readFileSync(new URL('docs/계측-오염장부.md', 앱뿌리), 'utf8')
const 줄들 = 장부.split('\n')
const 시작 = 줄들.findIndex((l) => /^## 장부/.test(l))
if (시작 < 0) 죽는다('「## 장부」 절이 없다')
const 행 = 줄들.slice(시작 + 1).filter((l) => /^\|/.test(l) && !/^\|\s*흐름\s*\|/.test(l) && !/^\|\s*-/.test(l))
if (행.length === 0) 죽는다('장부에 줄이 하나도 없다')
const 시각꼴 = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}|모름)$/
for (const l of 행) {
  const 칸 = l.split('|').slice(1, -1).map((s) => s.trim())
  if (칸.length !== 5) 죽는다(`칸이 5개가 아니다(${칸.length}) → ${l}`)
  if (!시각꼴.test(칸[1]) || !시각꼴.test(칸[2])) 죽는다(`시각이 「YYYY-MM-DD HH:MM」 또는 「모름」 이 아니다 → ${l}`)
  if (!칸[0] || !칸[4]) 죽는다(`흐름·무엇이 비었다 → ${l}`)
}

// ── ② 장부가 마지막으로 바뀐 커밋 «뒤»의 고침 커밋
let 기준
try { 기준 = sh(`git log -1 --format=%H -- "${장부길}"`) } catch { 기준 = '' }
if (!기준) { console.log('🧪 오염 장부 게이트 — 장부가 아직 커밋 전이다(첫 판). 표 꼴만 봤다 ✅'); process.exit(0) }

const 목록 = sh(`git log --format=%H ${기준}..HEAD`).split('\n').filter(Boolean)
const 낱말 = /고침|고쳤|버그|구멍|안 뜨|안 떴|안 나가|안 열|깨짐|깨졌|되살|빈손|안 잡히|안 보내/
const 걸린 = []
for (const h of 목록) {
  const 몸 = sh(`git show -s --format=%B ${h}`)
  if (/\(장부 해당 없음\)/.test(몸)) continue
  if (!낱말.test(몸)) continue
  const 파일 = sh(`git show --name-only --format= ${h}`).split('\n')
  const 흐름파일 = 파일.some((f) => (/^hankki\/src\//.test(f) && !/^hankki\/src\/data\//.test(f)) || /^hankki\/ocr-proxy\//.test(f))
  if (!흐름파일) continue
  걸린.push({ h: h.slice(0, 9), 제목: 몸.split('\n')[0] })
}

if (걸린.length === 0) {
  console.log(`🧪 오염 장부 게이트 — 표 꼴 ✅ · 장부 뒤 고침 커밋 없음 (${목록.length}개 봤다) ✅`)
  process.exit(0)
}
console.error(`
⛔⛔ 오염 장부 게이트 — «흐름을 고친» 커밋이 있는데 docs/계측-오염장부.md 가 그대로다.

${걸린.map((c) => `   ${c.h}  ${c.제목}`).join('\n')}

   👉 둘 중 하나:
      ⓐ 그 고침이 «유저 흐름»을 깨뜨렸다 고쳤다면 → 장부에 한 줄 (흐름 | 깨진 시각 | 고친 시각 | 커밋 | 무엇이)
         시각 = TZ=Asia/Seoul git show -s --date=format-local:'%Y-%m-%d %H:%M' <커밋>
      ⓑ 흐름과 무관한 고침이면 → 커밋 메시지에 「(장부 해당 없음)」 (그 말도 남는다)
   📄 왜 = 2026-09-16 「가져오기 16%」가 버그 기간(9/13 22:13~9/15 18:56)을 정상으로 센 값이었다.
`)
process.exit(1)
