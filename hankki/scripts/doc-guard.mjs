// 🧭 문서 함정 두 개를 잡는다 — **「문서를 믿고 실물을 안 본」 사고.**
//
// 왜 (창업자 2026-08-01):
//   *"우리가 정한거는 그때그때 반영 좀 해."* · *"원인찾고 다시이런일 없게 시스템만들어"*
//
// 하루에 같은 뿌리로 두 번 틀렸다:
//   ⒜ **한 문서 «안»의 세대** — 배경 README 위쪽(7/31 밤)만 읽고 「추석＝조각보·달밤억새」라고 썼다.
//      확정은 **같은 문서 맨 아래**(8/1)에 「추석＝클레이 가을밤 1개」로 있었다.
//      ⚠️ `latest-hook` 은 «파일 사이» 세대만 막는다. **한 파일 안은 못 막는다.**
//   ⒝ **문서의 「대기」를 그대로 믿음** — 「클레이 가을밤 재생성 대기」라고 적어둔 채 하루를 갔는데
//      **재생성본은 이미 저장돼 있었고, 그날 내가 한복 곰을 얹어 판정할 때 쓴 배경이 바로 그것**이었다.
//      **파일을 손에 쥐고 쓰면서도 문서만 보고 상태를 적었다.**
//
// 📌 그래서 이 도구는 **문서가 아니라 파일을 본다.**
//
// 쓰기:
//   node scripts/doc-guard.mjs --gen <문서>   이 문서의 세대 목록 + 맨 아래(최신)
//   node scripts/doc-guard.mjs --stale        「대기·예정」인데 **파일은 이미 있는** 줄
//   node scripts/doc-guard.mjs                둘 다
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = (() => {
  try { return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim() } catch { return process.cwd() }
})()
const APP = existsSync(join(ROOT, 'hankki/docs')) ? join(ROOT, 'hankki') : ROOT

const walk = (d, out = []) => {
  for (const f of readdirSync(d)) {
    if (f.startsWith('.') || f === 'node_modules') continue
    const p = join(d, f)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (f.endsWith('.md')) out.push(p)
  }
  return out
}

// ── ⒜ 한 문서 안의 «세대» ──────────────────────────────────────
//   날짜가 붙은 제목이 2개 이상이면 「세대 문서」다. 맨 아래가 현행이다.
export function generations(file) {
  const lines = readFileSync(file, 'utf8').split('\n')
  const gens = []
  lines.forEach((l, i) => {
    if (!/^#{1,3}\s/.test(l)) return
    const d = l.match(/(20\d\d-\d\d-\d\d)/)
    if (d) gens.push({ line: i + 1, date: d[1], title: l.replace(/^#+\s*/, '').trim() })
  })
  return gens
}

// ── ⒝ 「대기」인데 파일은 이미 있는 줄 ──────────────────────────
//   ⚠️⚠️ **처음엔 「백틱 안의 경로」만 봤는데 그러면 오늘 사고를 못 잡는다.**
//      실제 문장은 *"**클레이 가을밤** — 나무 작게"* 였다 — **경로도 확장자도 없다.**
//      ⭐ 그래서 **이름을 느슨하게 맞춘다** — 공백·하이픈·언더바를 지우고 비교한다.
//        「클레이 가을밤」 → `클레이가을밤` ↔ `원본/클레이-가을밤.png` → `클레이가을밤` **일치**
//   📌 이게 「검사를 만들면 옛 값으로 먼저 돌려본다」의 결과다. 안 돌려봤으면 못 잡는 검사를 두고 안심했다.
//   ⚠️⚠️ **두 번째 헛방** — 넓힌 뒤에도 못 잡았다. 실제 문서는 이렇게 생겼다:
//        `### ⏳ 창업자가 다시 뽑기로 한 것`      ← 「대기」 신호는 **제목에만** 있고
//        `- **클레이 가을밤** — 나무 작게`        ← **정작 대상이 있는 줄엔 없다**
//      → **줄 단위로 보면 안 된다.** 제목에 신호가 걸리면 **그 아래 문단 전체**를 대기 구간으로 본다.
const WAIT = /대기|예정|아직|미정|TODO|뽑기로|다시 뽑|재생성|만들 것|해야 함|할 것|필요/
const norm = (s) => s.replace(/\.[a-z0-9]+$/i, '').replace(/^.*\//, '').replace(/[\s\-_·]/g, '').toLowerCase()
const SKIP_DIR = /^_|제외|보관|백업|구판|아껴둠|archive/
const rel = (p) => resolve(p).replace(APP + '/', '')

// ── ⒞ 「판정 대기」인데 창업자가 «이미 확정한» 것 ────────────────────
//
// 📮 창업자 2026-08-18 = *"어차피 너 저장해도 보지도 않고 니멋대로 판단해서 딴소리하잖아"*
//    ＋ *"아니 얼마나 중요한건데 저장만 하고 안읽어? 또 출시 못하게 하려고?"*
//
// ⛔⛔ **그날 사고** — `CLAUDE.md` 에 「⏳창업자 판정 대기 — 「집 주소 공개」」가 하루 낡아 있었다.
//    확정은 **2026-08-17 에 이미 났다**(창업자 *"1 집주소 가능"* · 출시행정-학습 195·199·556줄).
//    그 낡은 줄을 읽은 **두 세션이 8/18 에 둘 다 그 얘길 다시 꺼냈고**, 나는 구글에 보낼 메일 초안에
//    *"주거지 주소 대신 사업장 주소를 등록할 수 있나"* 까지 적었다 — **둘이 같은 주소라 물어도 답이 같다.**
//
// ⭐⭐ **⒝(파일)·⒞(결정)는 다른 함정이다.**
//    ⒝ = 「대기」인데 **파일이** 이미 있다   ／   ⒞ = 「대기」인데 **창업자가 이미 판정했다**
//    ⒞ 가 더 나쁘다 — **창업자에게 «이미 답한 것»을 또 묻게 된다.**
//
// 📌 잣대 = 「대기」 줄에서 **「…」로 묶인 주제**를 뽑아, 그 주제가 **다른 곳에서 ✅확정**됐나 본다.
//    ⛔ 시끄러우면 죽은 게이트다 → **주제가 「」로 명시된 줄만** 본다(짐작으로 주제를 만들지 않는다).
// ⚠️⚠️ **첫 판이 21개를 뱉었다 — 죽은 게이트다.** 좁힌 데가 셋:
//   ⑴ 한 줄의 「」를 «전부» 주제로 삼았다 → *"앱이 세 이름으로 부른다(「스캔」·「자동 정리」…)"* 같은
//      **나열까지 주제**가 됐다. ✅**「대기」라는 낱말 «근처»에 있는 「」만** 본다(그게 그 문장의 주어다).
//   ⑵ 확정 잣대가 `✅` 하나면 통과였다 → **✅가 흔해서** 아무 줄이나 걸렸다.
//      ✅**「창업자 확정」·「[창업자 …]」·날짜 붙은 확정**만 «확정»으로 친다.
//   ⑶ 「대기」·「확정」 같은 **메타 낱말이 주제로** 잡혔다 → 뺀다.
const PENDING = /(판정|확정|결정)\s*(대기|필요)|판정을?\s*기다/
// ⛔⛔ **여기서 한 번 통째로 헛돌았다** — `창업자\s*(확정|판정)` 이 **「창업자 판정 «대기»」에도 걸려서**
//    같은 줄 확정 검사(`if (DECIDED.test(ln)) return`)가 **정작 잡아야 할 793줄을 스스로 걸러냈다.**
//    ✅ 뒤에 「대기·필요」가 붙으면 확정이 아니다 → 부정 예측(lookahead)으로 뺀다.
//    📌 규칙 12 그대로 — **옛 값으로 돌려보지 않았으면 「2개 잡았다」에 안심하고 넘어갔다.**
const DECIDED = /창업자\s*(가\s*)?(확정|판정)(?!\s*(대기|필요))|\[창업자[^\]]*확정|✅+\s*\*{0,2}확정|확정\s*\(?\s*20\d\d[-.]\d\d|확정본|= *\*{0,2}확정\*{0,2}/
const TOPIC = /「([^」\n]{2,24})」/g
const META = /^(대기|확정|예정|판정|미정|없음|있다|없다|그대로|안 한다)$|대기|확정 대기/

export function decidedStale(files) {
  const docs = files || [join(APP, 'CLAUDE.md'), ...walk(join(APP, 'docs'))]
  // ① 문서를 한 번만 읽어 둔다
  const body = []
  for (const f of docs) {
    if (!existsSync(f) || !f.endsWith('.md')) continue
    if (/_archive|_아껴둠|_구판/.test(f)) continue   // 🗄 보관소는 «안 본다»(절대원칙 24) — 끝난 기록이라 늘 「대기」로 남아 있다
    let t = ''
    try { t = readFileSync(f, 'utf8') } catch { continue }
    body.push({ f, lines: t.split('\n') })
  }
  // ② 「대기」 줄에서 주제를 뽑는다
  const pend = []
  for (const { f, lines } of body) {
    lines.forEach((ln, i) => {
      const pm = ln.match(PENDING)
      if (!pm) return
      if (DECIDED.test(ln)) return                 // 같은 줄에 확정 표시가 있으면 이미 닫힌 것
      // ⭐ 「대기」라는 낱말 «근처»의 「」만 주제로 본다 — 멀리 있는 건 그 문장의 주어가 아니다
      const at = pm.index ?? 0
      for (const m of ln.matchAll(TOPIC)) {
        const d = (m.index ?? 0) - at
        if (d < -34 || d > 44) continue
        const topic = m[1].trim()
        if (/^[⓪-⓿ⓐ-ⓩ\d\s·]+$/.test(topic)) continue   // 「ⓐ」 「①」 같은 갈래 기호는 주제가 아니다
        if (META.test(topic)) continue
        pend.push({ file: rel(f), line: i + 1, topic, text: ln.trim().slice(0, 110) })
      }
    })
  }
  // ③ 그 주제가 «다른 곳»에서 확정됐나
  const hits = []
  for (const p of pend) {
    for (const { f, lines } of body) {
      const rf = rel(f)
      let found = null
      lines.forEach((ln, i) => {
        if (found) return
        if (rf === p.file && i + 1 === p.line) return
        if (!ln.includes(p.topic)) return
        if (!DECIDED.test(ln)) return
        if (PENDING.test(ln)) return
        // ⛔ 키를 `text` 로 두면 아래 `{...p, ...found}` 에서 «대기 줄»의 글자를 덮어쓴다
        found = { at: `${rf}:${i + 1}`, foundText: ln.trim().slice(0, 110) }
      })
      if (found) { hits.push({ ...p, ...found }); break }
    }
  }
  return hits.filter((h, i) => hits.findIndex((x) => x.file === h.file && x.line === h.line && x.topic === h.topic) === i)
}

// 저장소의 «현행» 자산 이름표 — 격리 폴더는 뺀다(거기 있는 건 「있다」로 안 친다)
function assetIndex() {
  const idx = new Map()
  const roots = ['docs/stickers', 'design', 'src/assets', 'docs'].map((r) => join(APP, r)).filter(existsSync)
  const st = roots.map((r) => [r, 0])
  while (st.length) {
    const [d, k] = st.pop()
    if (k > 6) continue
    let fs = []
    try { fs = readdirSync(d) } catch { continue }
    for (const f of fs) {
      const p = join(d, f)
      let s
      try { s = statSync(p) } catch { continue }
      if (s.isDirectory()) { if (!SKIP_DIR.test(f)) st.push([p, k + 1]) }
      else if (/\.(png|jpg|jpeg|mjs|js|jsx|py|html|mp4|aab)$/i.test(f) && !idx.has(norm(f))) idx.set(norm(f), p)
    }
  }
  return idx
}

// ═══════════════════════════════════════════════════════════════════════
// 🔢 상수 색인 — **문서가 아니라 «코드에 박힌 값»을 본다** (#81 · 2026-08-13)
//
// 왜 (파일 검사와 «같은 사고, 다른 몸»):
//   위 `--stale` 은 「대기」라 적힌 것의 **파일**이 이미 있나를 본다.
//   그런데 우리가 실제로 낸 사고 중엔 **파일이 아니라 «상수»가 이미 채워져 있던 것**이 있다.
//   ⛔ 2026-08-04 — `LAB_SURVEY_URL`·`LAB_BUG_URL` 을 문서엔 *"폼 만든 뒤 주소를 넣는다"* 로
//      대기라 적어뒀는데 **주소는 이미 코드에 들어가 화면에 뜨고 있었다.**
//   ⛔ 2026-08-05 — 모션·효과 배분을 **「⏳창업자 최종 확정 대기」라고 적어놓고 코드엔 초안을 박았고**,
//      나중에 그 코드를 보고 *"이미 정해져 있었다"* 며 확정으로 굳혔다. 창업자가 잡았다
//      (*"추석에 아장아장은 처음들어"*). **문서와 코드가 서로 다른 말을 하는데 아무도 안 봤다.**
//   📌 뿌리는 하나 — **문서를 믿고 실물을 안 봤다.** 실물이 파일이냐 상수냐만 다르다.
//
// ⛔⛔ **못 미더운 값은 «모른다»로 둔다.** 함수 호출·계산식(`kfItems('kf_')`·`a ? b : c`)은
//    여기서 값을 알 수 없다. **짐작해서 「채워졌다」고 말하지 않는다**(규칙 15).
//    확실히 읽히는 것만 — 따옴표 문자열 · true/false · 숫자 · 대괄호/중괄호가 «그 줄에서 닫히는» 것.
const CONST_RE = /^\s*(?:export\s+)?const\s+([A-Za-z_$][\w$]{2,40})\s*=\s*(.*)$/

// ⚠️ 상수 검사는 «파일 검사보다 좁은 그물»을 쓴다.
//   위 `WAIT` 의 「필요·할 것」은 설명 문장에 흔해서(*"순수 도형이 필요하면 벡터 `FRAMES`"*)
//   상수 이름과 같이 놓이면 바로 헛방이 된다 — 실제로 그렇게 한 건 잡혔다.
//   📌 여기선 **「안 채웠다」를 «직접» 말하는 말**만 신호로 친다.
const WAIT_HARD = /대기|예정|아직|미정|TODO|꺼져 있|비어 ?있|안 넣|넣어야|채워야|만들 것|해야 함/

// ⛔⛔ **여기서 한 번 크게 틀렸다 (2026-08-13 · 규칙 12 로 잡았다)**
//   위 `walk()` 는 **`.md` 만 모은다.** 그걸 그대로 `src` 에 써서 **상수 색인이 통째로 비었고**,
//   검사는 «잡을 게 없어서»가 아니라 «볼 게 없어서» 「없음」을 뱉었다 — **실패할 줄 모르는 검사.**
//   📌 규칙 18 그대로 — 「없다」가 아니라 **내가 안 보고 있었다.** 그래서 코드 파일용 걷기를 따로 둔다.
const walkSrc = (d, out = []) => {
  if (!existsSync(d)) return out
  for (const f of readdirSync(d)) {
    if (f.startsWith('.') || f === 'node_modules') continue
    const p = join(d, f)
    if (statSync(p).isDirectory()) walkSrc(p, out)
    else if (/\.(js|jsx|mjs)$/.test(f)) out.push(p)
  }
  return out
}

// 값 하나를 «확실할 때만» 채워짐/빈 것으로 가른다. 못 읽으면 null(＝모른다).
function readValue(v) {
  // ⚠️ 꼬리 주석만 뗀다 — `\s*//` 로 쓰면 **`https://` 의 `//` 까지 잘라먹는다**(실제로 그랬다).
  //    URL 상수(`LAB_SURVEY_URL`)가 그대로 빈 값이 돼서 검사를 통과했다. **공백이 «반드시» 앞에 와야 한다.**
  const s = v.replace(/\s+\/\/.*$/, '').trim().replace(/;$/, '').trim()
  if (/^(''|""|``)$/.test(s)) return { filled: false, show: "''" }
  if (/^(false|null|undefined|0)$/.test(s)) return { filled: false, show: s }
  if (/^(\[\s*\]|\{\s*\})$/.test(s)) return { filled: false, show: s }
  if (/^true$/.test(s)) return { filled: true, show: 'true' }
  if (/^-?\d+(\.\d+)?$/.test(s)) return { filled: true, show: s }
  // 따옴표 문자열 — 그 줄에서 «닫혀야» 읽은 것으로 친다
  const q = s.match(/^(['"`])(.*)\1$/)
  if (q) return { filled: q[2].length > 0, show: q[2].length > 40 ? q[2].slice(0, 40) + '…' : `'${q[2]}'` }
  // 한 줄에서 닫히는 배열·객체 — 안에 뭐가 있으면 채워진 것
  const one = s.match(/^(\[.*\]|\{.*\})$/)
  if (one) return { filled: /[^[\]{}\s,]/.test(one[1]), show: one[1].length > 40 ? one[1].slice(0, 40) + '…' : one[1] }
  // 여러 줄로 여는 배열·객체는 여기서 판단 못 한다 → 부르는 쪽에서 다음 줄을 본다
  if (/^[[{]$/.test(s)) return { open: true }
  return null   // 🤷 함수 호출·계산식 — **모른다**
}

function constIndex() {
  const idx = new Map()
  const srcs = walkSrc(join(APP, 'src'))
  if (!srcs.length) { console.error('⛔ src 에서 코드 파일을 하나도 못 찾았다 — 검사가 헛돈다'); process.exit(1) }
  for (const f of srcs) {
    const lines = readFileSync(f, 'utf8').split('\n')
    lines.forEach((l, i) => {
      const m = l.match(CONST_RE)
      if (!m) return
      const [, name, rest] = m
      let v = readValue(rest)
      if (v && v.open) {
        // 다음 «내용 있는» 줄이 닫는 괄호면 빈 것, 아니면 채워진 것
        const nxt = lines.slice(i + 1).find((x) => x.trim() && !/^\s*\/\//.test(x))
        v = { filled: !/^\s*[\]}]/.test(nxt || ']'), show: /^\s*[\]}]/.test(nxt || ']') ? '(비어 있음)' : '(값 있음)' }
      }
      if (!v) return                                   // 모르는 값은 색인에 안 넣는다
      if (!idx.has(name)) idx.set(name, { ...v, file: rel(f), line: i + 1 })
    })
  }
  return idx
}

/**
 * 「대기」라 적힌 문단에서 «상수 이름»을 찾아, 그 상수가 코드엔 이미 채워져 있으면 알린다.
 * ⚠️ 구조·조이기는 `stale()` 과 «똑같이» 간다 — 긴 줄 제외 · 기록 문서 제외 · **굵게/백틱** 토큰만.
 *    (한쪽만 시끄러우면 결국 둘 다 안 보게 된다)
 */
export function constStale(files) {
  const idx = constIndex()
  const hits = []
  for (const f of (files || walk(join(APP, 'docs')))) {
    if (/CLAUDE\.md$|기능-아카이브|작업복기|전체복기|삽질/.test(f)) continue
    if (/\/_archive\/|\/_아껴둠\/|\/_구판\//.test(f)) continue   // 옛 판은 「할 일」이 아니라 기록이다
    const lines = readFileSync(f, 'utf8').split('\n')
    let zone = false
    lines.forEach((l, i) => {
      if (/^#{1,4}\s/.test(l)) zone = WAIT_HARD.test(l)
      if (l.length > 180) return
      if (!zone && !WAIT_HARD.test(l)) return
      const toks = [...l.matchAll(/\*\*([^*]{2,40})\*\*/g), ...l.matchAll(/`([^`]{2,60})`/g)].map((m) => m[1])
      for (const t of toks) {
        // 「`SAMPLE_READY = false`」처럼 뒤에 뭐가 붙어도 «앞머리 이름»만 뽑는다
        const id = (t.match(/^[A-Za-z_$][\w$]*/) || [])[0]
        if (!id || id.length < 4) continue
        const c = idx.get(id)
        if (c && c.filled) hits.push({ file: rel(f), line: i + 1, name: id, at: `${c.file}:${c.line}`, val: c.show, text: l.trim().slice(0, 110) })
      }
    })
  }
  return hits.filter((h, i) => hits.findIndex((x) => x.file === h.file && x.line === h.line && x.name === h.name) === i)
}

// ⭐ **요즘 손댄 문서만** — 46건을 매번 쏟으면 아무도 안 본다(시끄러운 게이트는 죽은 게이트).
//   오래된 문서의 낡은 「대기」는 사고를 안 낸다. **지금 만지는 문서**의 것만 봐야 값이 있다.
export function recentDocs(days = 3) {
  try {
    // ⛔⛔ **`-c core.quotepath=false` 가 없으면 «한글 이름 문서를 통째로 못 본다»** (2026-08-13 발견)
    //   git 은 ASCII 아닌 경로를 `"hankki/docs/\355\225\240..."` 로 이스케이프해서 내보낸다.
    //   그러면 `.md` 로 끝나지 않아(따옴표가 붙어) 걸러지고 → `existsSync` 도 실패한다.
    //   🔢 실측 = 요즘 문서 **28개 중 2개**(`CLAUDE.md`·`README.md`)만 보고 있었다.
    //   📌 **우리 문서는 거의 다 한글 이름이다** — 즉 `--recent` 는 그동안 «거의 아무것도 안 보고» 초록불이었다.
    //   ⚠️ 같은 함정이 CLAUDE.md 에 이미 적혀 있었다(2026-08-09 `hold/자동회수` 확인 때). **두 번째다.**
    const out = execFileSync('git', ['-c', 'core.quotepath=false', 'log', `--since=${days} days ago`, '--name-only', '--pretty=format:'],
      { cwd: ROOT, encoding: 'utf8' })
    const set = new Set(out.split('\n').map((s) => s.trim()).filter((s) => s.endsWith('.md')))
    return [...set].map((r) => join(ROOT, r)).filter(existsSync)
  } catch { return [] }
}

export function stale(files) {
  const idx = assetIndex()
  const hits = []
  for (const f of (files || walk(join(APP, 'docs')))) {
    if (/CLAUDE\.md$|기능-아카이브|작업복기|전체복기|삽질/.test(f)) continue   // 기록 문서는 「할 일」이 아니다
    // ⛔ 밑줄로 시작하는 «파일»은 재료 목록이다(`_원본-우선순위.md` = 「자를 원본이 여기 있다」).
    //   거긴 **파일이 있는 게 당연해서** 이 검사의 전제(「있으면 끝난 것」)가 안 맞는다.
    //   🔢 안 거르면 그 한 파일이 25줄을 쏟아 나머지를 덮는다(2026-08-13 quotepath 를 고치자 드러났다).
    //   ⚠️ «폴더» `_대기/` 는 안 거른다 — 거기 든 문서는 진짜 할 일 목록이고 실제로 진짜를 잡았다.
    if (/\/_[^/]*\.md$/.test(f)) continue
    const lines = readFileSync(f, 'utf8').split('\n')
    let zone = false                                   // 「대기 문단」 안인가
    lines.forEach((l, i) => {
      if (/^#{1,4}\s/.test(l)) zone = WAIT.test(l)     // 제목이 구간을 연다/닫는다
      // ⚠️⚠️ **조이지 않으면 죽은 검사가 된다.** 처음엔 9건 중 대부분이 헛방이었다 —
      //   `CLAUDE.md` 의 긴 «핀» 줄은 지나간 이야기라 「대기」 낱말이 우연히 섞인다.
      //   📌 시끄러운 게이트는 아무도 안 본다(우리 규칙). → **짧은 줄 · 핀 파일 제외**로 조인다.
      if (l.length > 180) return                       // 긴 줄 = 기록이지 할 일 목록이 아니다
      if (!zone && !WAIT.test(l)) return
      // 이 줄에서 「이름처럼 생긴 것」 = **굵게** 또는 `백틱` 으로 감싼 토큰
      const toks = [...l.matchAll(/\*\*([^*]{2,30})\*\*/g), ...l.matchAll(/`([^`]{2,60})`/g)].map((m) => m[1])
      for (const t of toks) {
        const key = norm(t)
        if (key.length < 4) continue
        const found = idx.get(key)
        if (found && !SKIP_DIR.test(rel(found).split('/').pop())) {
          hits.push({ file: rel(f), line: i + 1, name: t, found: rel(found), text: l.trim().slice(0, 110) })
        }
      }
    })
  }
  // 같은 줄 중복 제거
  return hits.filter((h, i) => hits.findIndex((x) => x.file === h.file && x.line === h.line) === i)
}

// ⚠️ 다른 스크립트가 `import` 할 때 아래 출력이 딸려 나오면 안 된다 — 직접 실행일 때만 돈다.
const isMain = (process.argv[1] || '').endsWith('doc-guard.mjs')
const mode = process.argv[2] || ''
const arg = process.argv[3] || ''
if (!isMain) { /* 라이브러리로 쓰임 */ } else {

if (mode === '--gen') {
  const f = resolve(arg.startsWith('/') ? arg : join(APP, arg))
  const g = generations(f)
  if (g.length < 2) { console.log('세대 1개 이하 — 그냥 읽으면 된다'); process.exit(0) }
  const top = g[g.length - 1]
  console.log(`📚 이 문서엔 «세대»가 ${g.length}개 쌓여 있다 — **맨 아래가 현행이다.**`)
  g.forEach((x) => console.log(`   ${x === top ? '⭐' : '  '} ${x.line}줄  ${x.date}  ${x.title}`))
  console.log(`\n👉 ${top.line}줄부터 먼저 읽어라. 위쪽은 «지나간 판단»이다.`)
  process.exit(0)
}

// ══════════════════════════════════════════════════════════════════
// 🪤 --myown : 「창업자 확정」이라 «적어놓고» 창업자 «원문 인용»이 없는 줄
//   ⭐ 왜 = 반복 실수 패턴 🅴 (`docs/실수-패턴-2026-08-07.md`) — **문서가 「제일 비싸다」고 적은 것.**
//      2026-08-18 실측에서 **패턴 여덟 중 유일하게 «맨몸»** 이었다.
//   ⛔ 그 문서의 구멍 = *"«쳐내는 것»은 아무 흔적을 안 남긴다. 게이트가 볼 게 없다."* — 맞다.
//      ✅ 그래서 **반대쪽**을 잡는다: «안 물어본 것»은 못 봐도, **「확정」이라고 적은 것**은 글자로 남는다.
//         창업자 확정엔 이 저장소 규율상 반드시 `📮 창업자 = *"원문"*` 이 붙는다. 그게 없으면 «내가 정한 것»이다.
if (mode === '--myown') {
  const docs = arg === '--recent' ? recentDocs() : [join(APP, 'CLAUDE.md'), ...walk(join(APP, 'docs'))]
  // ⛔ 「창업자 판정 «뒤에»」·「확정 «되면»」은 아직 «안 정해진» 것이다 — 확정으로 세면 오탐이 된다
  //    (2026-08-18 첫 판이 그랬다. 시끄러운 게이트는 아무도 안 본다)
  const SAYS = /창업자\s*(가\s*)?(확정|판정)(?!\s*(대기|필요|뒤|후|받|나면|되면|하면|전))|\[창업자[^\]]*확정/
  const QUOTE = /["“”『」]|\*"|창업자\s*[=:]|📮/     // 원문 인용의 흔적
  const hits = []
  for (const f of docs) {
    if (!existsSync(f) || !f.endsWith('.md')) continue
    if (/_archive|_아껴둠|_구판/.test(f)) continue      // 🗄 보관소는 안 본다(절대원칙 24)
    let lines; try { lines = readFileSync(f, 'utf8').split('\n') } catch { continue }
    lines.forEach((ln, i) => {
      if (!SAYS.test(ln)) return
      // 그 절(위아래 5줄) 어딘가에 «창업자 원문»이 있으면 통과 — 인용이 다음 줄에 오는 게 흔하다
      const near = lines.slice(Math.max(0, i - 5), i + 6).join('\n')
      if (QUOTE.test(near)) return
      hits.push({ at: `${rel(f)}:${i + 1}`, ln: ln.trim().slice(0, 108) })
    })
  }
  if (!hits.length) {
    console.log('✅ 「창업자 확정」이라 적었는데 원문 인용이 없는 줄 — 없음')
    process.exit(0)
  }
  console.log(`🪤 「창업자 확정」이라 «적어놓고» 원문 인용이 없는 줄 ${hits.length}개`)
  console.log('   ⛔ 창업자가 «정말» 그렇게 말했나? 아니면 **내가 대신 정하고 확정이라 적었나?**')
  console.log('   📌 반복 실수 패턴 🅴 — 문서가 「제일 비싸다」고 적은 자리다.\n')
  hits.slice(0, 20).forEach((h) => console.log(`   ${h.at}\n      ${h.ln}`))
  if (hits.length > 20) console.log(`\n   … ${hits.length - 20}개 더`)
  console.log(`
   ✅ 고치는 법 = ⓐ창업자 원문을 «찾아» 붙인다(📮 창업자 = *"…"*)
                  ⓑ 못 찾으면 「확정」이 아니라 **「⏳창업자 판정 대기」로 되돌린다**
   ⛔ 이 게이트는 «세는» 것이지 배포를 막지 않는다 — 옛 줄이 많아 막으면 시끄럽다(원칙 = 시끄러우면 죽는다).`)
  process.exit(0)
}

if (mode === '--decided') {
  const ds = decidedStale(arg === '--recent' ? recentDocs() : undefined)
  if (!ds.length) console.log('✅ 「판정 대기」인데 이미 확정된 주제 — 없음')
  else {
    console.log(`🚨 「⏳판정 대기」라고 적혀 있는데 **창업자가 이미 확정한** 주제 ${ds.length}개`)
    console.log('   ⛔ 이걸 읽은 새 세션이 «이미 답한 것»을 또 묻는다 — 2026-08-18 「집 주소 공개」 사고\n')
    ds.slice(0, 20).forEach((h) => {
      console.log(`   ${h.file}:${h.line}   주제 = 「${h.topic}」`)
      console.log(`      ⏳ ${h.text}`)
      console.log(`      ✅ 이미 확정 → ${h.at}`)
      console.log(`         ${h.text2 || h.at ? '' : ''}${h.textFound || ''}`)
    })
    console.log('\n👉 「대기」 줄을 «확정»으로 고쳐라. 고치기 전엔 그 주제를 창업자에게 다시 묻지 않는다.')
  }
  process.exit(ds.length ? 1 : 0)
}

if (mode !== '--stale' && mode !== '--const') {
  // 전체 훑기 — 세대 문서 목록
  const many = []
  for (const f of walk(join(APP, 'docs'))) {
    const g = generations(f)
    if (g.length >= 2) many.push({ f: rel(f), n: g.length, top: g[g.length - 1] })
  }
  console.log(`📚 «세대»가 쌓인 문서 ${many.length}개 — 이런 건 **맨 아래부터** 읽는다\n`)
  many.sort((a, b) => b.n - a.n).slice(0, 12)
    .forEach((m) => console.log(`   ${String(m.n).padStart(2)}세대  ${m.f}\n            ⭐ 현행 = ${m.top.line}줄  ${m.top.title}`))
  console.log('')
}

if (mode === '--const') {
  const cs = constStale(arg === '--recent' ? recentDocs() : undefined)
  if (!cs.length) console.log('✅ 「대기」인데 상수가 이미 채워진 줄 — 없음')
  else {
    console.log(`⚠️  「대기·예정」이라고 적혀 있는데 **상수는 이미 채워진** 줄 ${cs.length}개`)
    console.log('   (문서와 코드가 다른 말을 하면, 나중에 코드를 보고 «확정»으로 굳힌다 — 2026-08-05 모션 배분 사고)\n')
    cs.slice(0, 20).forEach((h) => {
      console.log(`   ${h.file}:${h.line}`)
      console.log(`      ${h.text}`)
      console.log(`      👉 코드엔 이미 값이 있다: ${h.name} = ${h.val}   (${h.at})`)
    })
  }
  process.exit(0)
}

const st = stale(mode === '--stale' && arg === '--recent' ? recentDocs() : undefined)
if (!st.length) console.log('✅ 「대기」인데 파일이 이미 있는 줄 — 없음')
else {
  console.log(`⚠️  「대기·예정」이라고 적혀 있는데 **파일은 이미 있는** 줄 ${st.length}개`)
  console.log('   (끝난 일을 「대기」로 남겨두면 다음 사람이 또 안 한다 — 2026-08-01 클레이 가을밤 사고)\n')
  st.slice(0, 20).forEach((h) => {
    console.log(`   ${h.file}:${h.line}`)
    console.log(`      ${h.text}`)
    console.log(`      👉 실제로 있다: ${h.found}`)
  })
}
}
