// 👀 창업자가 «보고 확인한 것» 기록 — 다시 묻지 않게 (창업자 2026-11-23 「보고 확인한 것은 다시 보는 일 없도록 도구 만들어」)
//
// 뿌리 (2026-11-23 아침 · 한 번에 셋):
//   · 크리스마스 서랍·홈·레꾸자랑 = 11/10 검수판·시안에 「좋아 이대로 가자」 → 장부에 안 적어서 11/23 굽기 때 또 물음
//   · 또요 요거트 = 11/22 「그림 그대로 둬」 → 안 적어서 또 물음 (창업자 「백번 말했어」)
//   · 테마 8편 = 11/22 검수판 「수정할거 없어」 → 굽기 검사가 「원본대조」를 몰라 또 물음
// ⭐ 해법 = OK 를 받은 «그 자리에서» 여기 적는다(훅 okledger-guard 가 적으라고 띄운다).
//    굽기 검사(release-calendar 빈칸들)는 여기 적힌 열쇠가 든 칸을 «안 묻는다».
// ⛔ 대화기록(jsonl)은 컨테이너가 바뀌면 사라진다 → 영구 기록은 이 저장소 파일(docs/창업자-본것.jsonl) 하나.
//
// 쓰는 법
//   node scripts/본것.mjs --적기 "<열쇠 = 빈칸 글자 안에 드는 낱말>" "<창업자 원문>" ["<무엇을 봤나/언제>"]
//   node scripts/본것.mjs --찾기 "<낱말>"
//   node scripts/본것.mjs --목록
import { readFileSync, appendFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = join(dirname(fileURLToPath(import.meta.url)), '..')
export const 본것경로 = join(APP, 'docs/창업자-본것.jsonl')

export function 본것들() {
  if (!existsSync(본것경로)) return []
  return readFileSync(본것경로, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean)
}
// 빈칸 글자 하나에 «이미 본» 기록이 있나 — 있으면 그 기록을 돌려준다
export function 본기록(칸글자) { return 본것들().find((x) => x.열쇠 && 칸글자.includes(x.열쇠)) || null }

// 🔎 [3겹] 묻기 «전»에 흔적을 찾는다 — 창업자 말(대화기록)과 커밋에서. ⛔ 흔적이 나오면 묻기 전에 그걸 먼저 읽는다.
//    대화기록 = /root/.claude/projects/*/*.jsonl (376MB · 컨테이너 따라 사라짐) → 창업자 말만 뽑아 /tmp 에 한 번 모아 둔다
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
const 모음 = '/tmp/hankki-창업자말.tsv'
function 창업자말() {
  const 뿌리 = '/root/.claude/projects'; let 파일 = []
  try { for (const d of readdirSync(뿌리)) for (const f of readdirSync(join(뿌리, d))) if (f.endsWith('.jsonl')) 파일.push(join(뿌리, d, f)) } catch { return [] }
  const 최신 = Math.max(0, ...파일.map((f) => statSync(f).mtimeMs))
  if (!existsSync(모음) || statSync(모음).mtimeMs < 최신) {
    const 줄 = []
    for (const f of 파일) for (const l of readFileSync(f, 'utf8').split('\n')) {
      if (!l.includes('"type":"user"')) continue
      let d; try { d = JSON.parse(l) } catch { continue }
      const c = d.message?.content; const t = typeof c === 'string' ? c : Array.isArray(c) ? c.filter((x) => x?.type === 'text').map((x) => x.text).join(' ') : ''
      if (!t || t.length > 3000 || /task-notification|system-reminder|hook feedback/i.test(t.slice(0, 200))) continue
      줄.push((d.timestamp || '').slice(0, 16) + '\t' + t.replace(/\s+/g, ' '))
    }
    writeFileSync(모음, 줄.join('\n'))
  }
  return readFileSync(모음, 'utf8').split('\n')
}
const 흔한말 = new Set(['장바구니', '그림', '없음', '검수', '레시피', '열림', '물려받음', '캡처', '원재료', '링크', '사러가기', '꾸미기', '서랍', '모두에게', '열쇠', '풀림'])
export function 흔적(칸글자) {
  const 몸 = 칸글자.replace(/^.*?\d{4}-\d{2}-\d{2}\s*/, '').replace(/\[열쇠:.*$/, '')
  const 낱말 = [...new Set(몸.split(/[\s·—|()（）「」]+/).filter((w) => w.length >= 2 && !흔한말.has(w) && !/^\d/.test(w)))].slice(0, 4)
  if (!낱말.length) return []
  const 말 = 창업자말().filter((l) => 낱말.some((w) => l.includes(w))).slice(-3).map((l) => '💬 ' + l.slice(0, 160))
  let 커밋 = []
  try { 커밋 = execFileSync('git', ['log', '--since=120 days ago', '--oneline', '-i', ...낱말.flatMap((w) => ['--grep', w])], { cwd: APP, encoding: 'utf8' }).split('\n').filter(Boolean).slice(0, 2).map((l) => '🧾 ' + l.slice(0, 120)) } catch {}
  return [...말, ...커밋]
}

const kst = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [mode, a, b, c] = process.argv.slice(2)
  if (mode === '--적기') {
    if (!a || !b) { console.error('⛔ --적기 "<열쇠>" "<창업자 원문>" — 원문 없이는 못 적는다'); process.exit(1) }
    if (a.length < 2) { console.error('⛔ 열쇠가 너무 짧다(다른 칸까지 지워진다)'); process.exit(1) }
    appendFileSync(본것경로, JSON.stringify({ 열쇠: a, 원문: b, 무엇: c || '', 적은날: kst() }) + '\n')
    console.log(`✅ 적었다 — 「${a}」 (다음 굽기·검수에서 안 묻는다)`)
  } else if (mode === '--찾기') {
    const hit = 본것들().filter((x) => [x.열쇠, x.원문, x.무엇].join(' ').includes(a || ''))
    if (!hit.length) console.log(`🔎 「${a}」 — 기록 없음 (⚠️ 그래도 대화기록·커밋을 먼저 찾아본 뒤에 묻는다)`)
    for (const x of hit) console.log(`👀 ${x.적은날} 「${x.열쇠}」 — ${x.원문}${x.무엇 ? ' · ' + x.무엇 : ''}`)
  } else if (mode === '--목록') {
    for (const x of 본것들()) console.log(`👀 ${x.적은날} 「${x.열쇠}」 — ${x.원문}`)
  } else {
    console.error('쓰는 법: --적기 "<열쇠>" "<원문>" ["<무엇>"] · --찾기 "<낱말>" · --목록'); process.exit(1)
  }
}
