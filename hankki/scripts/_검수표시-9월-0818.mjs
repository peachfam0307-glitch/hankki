#!/usr/bin/env node
/**
 * 🍳 9월 검수판 24편에 «검수 표시»(review: '창업자')를 단다 — 2026-08-18
 *
 * 📮 창업자 = *"9월꺼 다봤어"* → 채팅으로 판정을 다 줬다.
 *    고칠 것 12편 ＋ 「그대로 ok」 11편 ＋ 꽃게찜(어머니 레시피로 통째 교체 대기) 1편 = 24편.
 *
 * ⭐⭐ 왜 도구로 하나 = 23곳을 손으로 고치면 «반드시» 하나를 빠뜨린다(규칙 8).
 *    그리고 표시가 없으면 `check-review` 게이트가 **그 편이 열리기 전날 배포를 막는다** —
 *    창업자가 이미 본 것을 또 보라고 하게 된다(v66 에서 실제로 그랬다).
 *
 * 🔒 스스로 검증한다 — 바꾸기 «전»·«후» 앱 값을 자식 프로세스로 떠서 대조해
 *    **review 말고 한 글자라도 달라지면 저장하지 않고 죽는다.**
 *    (`_문체통일-0817.mjs` 와 같은 방식)
 *
 * 돌리는 법: node scripts/_검수표시-9월-0818.mjs [--쓰기]
 *   --쓰기 없으면 «무엇이 바뀌나»만 찍고 파일은 안 건드린다.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 앱뿌리 = path.join(여기, '..')
const 파일 = path.join(앱뿌리, 'src/data/basics.js')

// 9월 검수판이 뽑은 창 — `_판-검수.mjs` 에 넣은 날짜 그대로
const 첫날 = '2026-08-31'
const 끝날 = '2026-09-28'

// ⛔ 꽃게찜은 «어머니 레시피(꽃게조림)로 통째 교체» 대기라 표시하지 않는다.
//    창업자 = *"꽃게찜? 이건 우리엄마 레시피가 있는데 맛있거든. 그걸로 바꿀까"*
const 건너뛸제목 = ['꽃게찜']

/** 앱이 실제로 쓰는 값을 통째로 뽑는다 (⛔글자 파싱이 아니라 «같은 모듈» — 규칙 30)
 *  ⚠️ `allBasicRecipes` 는 **함수가 아니라 배열**이다 — 처음에 `()` 를 붙여 죽었다(규칙 18). */
function 앱값() {
  const 코드 = `
    import { allBasicRecipes } from ${JSON.stringify(path.join(앱뿌리, 'src/data/basics.js'))}
    const 것들 = allBasicRecipes.map(r => ({
      id: r.id, title: r.title, from: r.from, review: r.review ?? null,
      ingredients: r.ingredients, steps: r.steps, memo: r.memo,
      time: r.time, servings: r.servings, difficulty: r.difficulty, icon: r.icon,
    }))
    process.stdout.write(JSON.stringify(것들))
  `
  try {
    const 뱉음 = execFileSync(process.execPath, ['--input-type=module', '-e', 코드], {
      cwd: 앱뿌리, maxBuffer: 64 * 1024 * 1024,
    })
    return JSON.parse(뱉음.toString())
  } catch (e) {
    // ⛔ 자식이 죽으면 stderr 를 «글자로» 보여준다 — 안 그러면 바이트 덤프만 나와 원인을 못 본다
    throw new Error(String(e.stderr || e.message))
  }
}

const 쓰기 = process.argv.includes('--쓰기')
const 전 = 앱값()

// ── 대상 고르기 ──────────────────────────────────────────────
const 대상 = 전.filter(r =>
  r.from && r.from >= 첫날 && r.from <= 끝날 &&
  !건너뛸제목.includes(r.title) &&
  !r.review,
)
const 이미 = 전.filter(r => r.from && r.from >= 첫날 && r.from <= 끝날 && r.review)
const 건너뜀 = 전.filter(r => r.from && r.from >= 첫날 && r.from <= 끝날 && 건너뛸제목.includes(r.title))

console.log(`\n📋 창 ${첫날} ~ ${끝날}`)
console.log(`   대상 ${대상.length}편 · 이미 표시됨 ${이미.length}편 · 일부러 건너뜀 ${건너뜀.length}편(${건너뜀.map(r => r.title).join('·') || '없음'})`)
for (const r of 대상) console.log(`     · ${r.title}  (${r.from})`)

if (!대상.length) { console.log('\n✅ 붙일 것이 없다.'); process.exit(0) }

// ── 원문에 넣기 ──────────────────────────────────────────────
// `title: '…', from: '…',` 줄을 찾아 «바로 다음 줄»에 review 를 끼운다.
// ⛔ id 로 찾지 않는다 — id 줄과 title 줄 사이 형식이 편마다 조금씩 다르다.
let 원문 = fs.readFileSync(파일, 'utf8')
let 넣은수 = 0
for (const r of 대상) {
  const 제목따옴 = r.title.replace(/'/g, "\\'")
  const 찾기 = new RegExp(
    `(^([ \\t]*)title: '${제목따옴.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}', from: '${r.from}',[^\\n]*\\n)`,
    'm',
  )
  const 맞음 = 원문.match(찾기)
  if (!맞음) { console.error(`⛔ 못 찾음: ${r.title}`); process.exit(1) }
  const 들여 = 맞음[2]
  원문 = 원문.replace(찾기, `$1${들여}review: '창업자', // ✅ 2026-08-18 창업자 9월 검수 완료\n`)
  넣은수++
}
if (넣은수 !== 대상.length) { console.error('⛔ 넣은 수가 안 맞는다'); process.exit(1) }

// ── 검증: 임시로 써서 앱 값을 다시 뽑고, review 말고는 한 글자도 안 달라졌나 ──
const 원본백업 = fs.readFileSync(파일, 'utf8')
fs.writeFileSync(파일, 원문)
let 후
try {
  후 = 앱값()
} catch (e) {
  fs.writeFileSync(파일, 원본백업)
  console.error('\n⛔ 고친 파일이 아예 안 읽힌다 — 되돌렸다.\n', e.message)
  process.exit(1)
}

const 되돌리기 = () => fs.writeFileSync(파일, 원본백업)

if (후.length !== 전.length) {
  되돌리기(); console.error(`⛔ 레시피 수가 달라졌다 ${전.length} → ${후.length}`); process.exit(1)
}
const 표시대상 = new Set(대상.map(r => r.id))
for (let i = 0; i < 전.length; i++) {
  const a = 전[i], b = 후[i]
  if (a.id !== b.id) { 되돌리기(); console.error(`⛔ 순서가 달라졌다: ${a.id} → ${b.id}`); process.exit(1) }
  for (const 칸 of ['title', 'from', 'ingredients', 'steps', 'memo', 'time', 'servings', 'difficulty', 'icon']) {
    if (JSON.stringify(a[칸]) !== JSON.stringify(b[칸])) {
      되돌리기(); console.error(`⛔ ${a.title} 의 «${칸}» 이 달라졌다 — review 말고는 아무것도 안 바뀌어야 한다`); process.exit(1)
    }
  }
  const 바라는review = 표시대상.has(a.id) ? '창업자' : a.review
  if (b.review !== 바라는review) {
    되돌리기(); console.error(`⛔ ${a.title} review 가 «${b.review}» — «${바라는review}» 라야 한다`); process.exit(1)
  }
}

if (!쓰기) { 되돌리기(); console.log(`\n🧪 연습 실행 — ${넣은수}편이 깨끗하게 들어간다. 파일은 안 건드렸다. (진짜로 넣으려면 --쓰기)`) }
else console.log(`\n✅ ${넣은수}편에 검수 표시를 달았다. review 말고는 한 글자도 안 바뀌었다(전수 대조).`)
