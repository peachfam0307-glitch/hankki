// 📤📤 제출물 관문 — 「밖으로 나가는 글」은 콘솔 실물을 «먼저 받고» 쓴다.
//
// 왜 있나 (2026-08-03 · 창업자 *"만들어 진짜 이건 절대원칙이야"*):
//   창업자: *"너는 이걸 왜 이제야 파악해? 미리 이런 걸 나한테 캡처하라고 해서
//            **신청서 쓸 때 알려줘야 하는 거 아냐?**"* — **맞는 말이다.**
//
//   7/31 프로덕션 신청서를 쓸 때 나는 저장소에 있는 것만으로 답을 만들었다.
//   콘솔은 「내가 못 보는 곳」이라 **아예 안 물었다.** 그래서
//     · 릴리즈가 «일곱 판»인 걸 몰랐고 (문서엔 「하나뿐」이라 적혀 있었다 — 짐작이었다)
//     · 활성 기기가 「몰아서 며칠」 모양인 걸 몰랐고
//     · 답할 수 있었던 칸을 **「모른다」로 비워서 냈다**
//   → 2026-08-02 반려. **2주를 잃었다.**
//
// ⭐⭐ 근거 관문(`evidence.mjs`)과 무엇이 다른가 — **작동 시점이 다르다.**
//   · `evidence.mjs` = 내가 **말하려 할 때** 막는다 (틀린 말을 막는다)
//   · 이 관문      = 내가 **글을 쓰기 전에** 막는다 (**물어봤어야 하는데 안 물은 것**을 막는다)
//   8/02 사고는 «틀린 말»이 아니라 «안 물어본 것»이라 근거 관문으로는 못 잡는다.
//
// 📌 규칙 = **목록의 칸마다 「그 화면에서 읽은 값」을 적어야 한다.**
//    「받았다」·「확인함」 같은 말은 안 통한다 — 값이 없으면 안 본 것이다.
//
// 쓰는 법
//   node hankki/scripts/submission-gate.mjs --종류 재신청            # 뭘 받아야 하나 (목록)
//   node hankki/scripts/submission-gate.mjs --종류 재신청 \
//     --값 "활성기기30일=7/22 16 · 7/24 18 · 7/25 15 · 이후 0~2" \
//     --값 "출시내역=1,2,3,5,7,9,10 (일곱 판)" …
// ⭐⭐ 2026-08-18 추가 = `--종류 지원팀문의` (창업자 *"구글메일에 뭘 물어볼까 하는데 안읽고 지어내잖아"*)
//   그날 사고 «둘» — ⑴한 세션이 「사업장 주소로 바꿀 수 있나」를 물으라 했다. 그건 8/17 에 이미 접은 갈래다.
//                    ⑵다른 세션(나)은 「결제 프로필이 이미 연결돼 있습니다」라는 «틀린 전제»로 초안을 썼다.
//   ⛔ 그날 이 훅이 «여러 번 떴는데» 종류가 넷(재신청·스토어등록·설문·데이터보안)뿐이라 **우리 칸이 없어서 그냥 지나갔다.**
//   📌 훅이 울려도 «가리키는 칸»이 없으면 아무도 안 걸린다. 그래서 칸을 만든다.
import { argv } from 'node:process'
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
// ⏰ 「오늘」은 여기서 «만들지» 않는다 — 날짜는 src/today.js 한 곳에서만(게이트 check-kst · 절대원칙 27)
import { todayKST } from '../src/today.js'

// ── 제출물마다 «반드시 실물로 봐야 하는» 칸 ──
//    ⚠️ 칸을 늘릴 땐 «그 화면이 없으면 답을 못 쓰는가»로 판단한다. 있으면 좋은 건 넣지 않는다.
const NEED = {
  재신청: {
    what: '프로덕션 액세스 재신청 9문항',
    fields: {
      활성기기30일: '통계 → 활성 기기 30일 그래프 — 날짜별 숫자',
      출시내역: '비공개 테스트 → 출시 내역 — 버전 코드와 날짜 전부',
      참여테스터수: '프로덕션 액세스 화면 — 「참여를 선택한 테스터 N명」',
      재사용자비율: '통계 → 재사용자 수',
      사전출시보고서: '사전 출시 보고서 — 있으면 결과, 없으면 「없음」',
      의견응답수: '구글 폼 응답 탭 — 건수',
    },
  },
  스토어등록: {
    what: '스토어 등록정보(이름·설명·스크린샷)',
    fields: {
      현재등록정보: '스토어 등록정보 화면 — 지금 올라가 있는 이름·짧은 설명',
      현재스크린샷: '스크린샷 칸 — 지금 올라가 있는 장수와 내용',
      게시상태: '게시 개요 — 대기 중인 변경이 있나',
    },
  },
  설문: {
    what: '구글 폼(설문·의견·오류)',
    fields: {
      현재문항: '폼 편집 화면 — 지금 들어 있는 문항',
      응답수: '응답 탭 — 건수',
    },
  },
  데이터보안: {
    what: 'Play 데이터 보안 신고',
    fields: {
      현재신고: '데이터 보안 화면 — 지금 신고돼 있는 내용',
    },
  },
  // ⭐ 이 칸만 «질문마다» 검사한다(아래 ask 분기) — 콘솔 값이 아니라 «물음 자체»가 제출물이라서다
  지원팀문의: { what: '구글 지원팀에 보낼 질문', ask: true },
}

const args = argv.slice(2)
const get = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null }
const all = (k) => args.map((a, i) => (a === k ? args[i + 1] : null)).filter(Boolean)

const kind = get('--종류')
const spec = NEED[kind]

if (!spec) {
  console.error(`\n⛔ --종류 를 골라라: ${Object.keys(NEED).join(' | ')}\n`)
  process.exit(1)
}

// ══════════════════════════════════════════════════════════════════
// 📮 지원팀문의 — 「물음」이 제출물이다. 칸이 아니라 «질문마다» 검문한다.
// ══════════════════════════════════════════════════════════════════
if (spec.ask) {
  const HERE = dirname(fileURLToPath(import.meta.url))
  const LOG = join(HERE, 'ask-log.json')
  const qs = all('--질문'); const gs = all('--근거'); const cs = all('--바뀜')
  const knows = all('--알고있음')
  const die = (msg) => { console.error('\n' + msg + '\n'); process.exit(1) }

  if (!qs.length) {
    die(`⛔ 「구글 지원팀에 보낼 질문」 — 질문마다 셋을 짝지어 적는다.

   node hankki/scripts/submission-gate.mjs --종류 지원팀문의 \\
     --질문 "소유자 변경이 우리 계정에서 가능한가" \\
     --근거 "결제 프로필 미연결 = 창업자 콘솔 캡처 2026-08-18" \\
     --바뀜 "되면 남편 $25 안 냄 · 안 되면 앱 이전으로 간다"

   ⛔ 셋이 다 있어야 한다 —
      --질문  무엇을 묻나
      --근거  그 질문이 서 있는 «전제»와 그것을 확인한 실물 (캡처·콘솔·원문·파일:줄)
      --바뀜  답이 오면 «우리 행동»이 어떻게 갈리나 (규칙 31 — 안 갈리면 안 묻는다)`)
  }
  if (qs.length !== gs.length || qs.length !== cs.length) {
    die(`⛔ 개수가 안 맞는다 — 질문 ${qs.length} · 근거 ${gs.length} · 바뀜 ${cs.length}\n   질문 하나마다 근거와 바뀜을 «하나씩» 짝지어야 한다.`)
  }

  // ⓐ 근거가 «빈 말»인가 — 실물을 가리키는 낱말이 하나도 없으면 안 본 것이다
  const REAL = /캡처|콘솔|원문|실물|스크린샷|이메일|답장|:\d+|\.md|\.js|\.json|20\d\d-\d\d-\d\d/
  const thin = gs.map((g, i) => (REAL.test(g) ? null : i + 1)).filter(Boolean)
  if (thin.length) {
    die(`⛔ ${thin.join('·')}번 근거가 «빈 말»이다 — 무엇을 «보고» 그렇게 아는지 적어야 한다.
   ✅ 예: "결제 프로필 미연결 = 창업자 콘솔 캡처 2026-08-18" · "docs/출시행정-학습-2026-08-17.md:195"
   ⛔ 예: "확인함" · "알고 있음" · "그렇게 알고 있다"
   📌 2026-08-18 사고 = 「이미 연결돼 있습니다」라는 «틀린 전제»로 물을 뻔했다. 캡처 한 장이 뒤집었다.`)
  }

  // ⓑ 답이 와도 행동이 안 갈리면 묻지 않는다 (규칙 31)
  const NOCHANGE = /^(없|모름|모른|그냥|참고|궁금)/
  const idle = cs.map((c, i) => (NOCHANGE.test(c.trim()) || c.trim().length < 6 ? i + 1 : null)).filter(Boolean)
  if (idle.length) {
    die(`⛔ ${idle.join('·')}번 — 답이 와도 «행동이 안 갈린다». 그러면 묻지 않는다(규칙 31).
   📌 한 통에 질문이 많을수록 답이 얕아진다. 갈리는 것만 남긴다.`)
  }

  // ⓒ ⭐ 제일 중요 — 이미 «정한» 것을 또 묻는가 (2026-08-18 사고 ⑴)
  const APP = join(HERE, '..')
  const DOCS = [join(APP, 'CLAUDE.md')]
  // 🗄 보관소(_로 시작)는 «안 본다» — 끝난 기록이라 늘 옛 판정이 남아 있다(절대원칙 24)
  try { const { readdirSync } = await import('node:fs')
    const rec = (p) => { for (const e of readdirSync(p, { withFileTypes: true })) {
      if (/^_|node_modules|낱개|원본시트/.test(e.name)) continue
      const f = join(p, e.name)
      if (e.isDirectory()) rec(f); else if (e.name.endsWith('.md')) DOCS.push(f)
    } }
    rec(join(APP, 'docs'))
  } catch { /* docs 없으면 CLAUDE.md 만 본다 */ }
  const DECIDED = /창업자[^\n]{0,12}(확정|판정)(?!\s*(대기|필요))|✅+\s*\*{0,2}확정|⛔재론 금지|안 한다/
  // 질문에서 «찾을 말» 을 뽑는다 — 「」 안이 있으면 그것, 없으면 2글자 이상 낱말
  // ⛔⛔ 첫 판은 «시끄러워서» 못 썼다 — 「소유자」·「프로덕션」 하나만 걸려도 15줄이 쏟아졌다.
  //    📌 이 저장소 원칙 그대로 = **시끄러운 게이트는 아무도 안 본다.** 그래서 둘을 좁혔다:
  //    ⓐ 우리 문서에 «수백 번» 나오는 낱말은 열쇠로 안 쓴다  ⓑ 한 줄에 «둘 이상» 맞아야 겹침으로 친다
  const COMMON = /^(계정|프로덕션|구글|플레이|소유자|변경|이전|가능|우리|상태|경우|사용|확인|필요|문의|질문|답변|화면|설정|정보|주소|이름|표시|출시|테스트|앱|것|수|더|또|안|안된|되나|하나|해야|있나|없나|무엇|어떻게|언제)$/
  const keyOf = (q) => {
    const inQ = [...q.matchAll(/[「『]([^」』]{2,20})[」』]/g)].map((m) => m[1])
    if (inQ.length) return inQ
    return q.split(/[^가-힣A-Za-z0-9]+/).filter((w) => w.length >= 2 && !COMMON.test(w)).slice(0, 8)
  }
  const clash = []
  for (let i = 0; i < qs.length; i++) {
    const keys = keyOf(qs[i])
    const quoted = /[「『]/.test(qs[i])      // 「」로 콕 집었으면 하나만 맞아도 본다
    const need = quoted ? 1 : 2             // 아니면 «둘 이상» 맞아야 그 줄 얘기다
    for (const f of DOCS) {
      let t; try { t = readFileSync(f, 'utf8') } catch { continue }
      t.split('\n').forEach((ln, n) => {
        if (!DECIDED.test(ln)) return
        const hit = keys.filter((k) => ln.includes(k))
        if (hit.length < need) return
        clash.push({ q: i + 1, key: hit.slice(0, 3).join('·'), at: `${f.replace(APP + '/', '')}:${n + 1}`, ln: ln.trim().slice(0, 100), n: hit.length })
      })
    }
  }
  const seen = new Set()
  const uniq = clash
    .filter((c) => { const k = c.q + c.at; if (seen.has(k)) return false; seen.add(k); return true })
    .sort((a, b) => b.n - a.n)              // 많이 맞은 줄부터 — 그게 진짜 그 얘기다

  // ⛔⛔ [2026-08-18 재검수에서 잡음] `--알고있음 "ㅇ"` **한 글자로 게이트가 통째로 뚫렸다.**
  //    그날 사고 ⑴(사업장 주소)이 그대로 통과됐다. 문(門)을 만들어 놓고 «누구나 여는 손잡이»를 달았던 것.
  //    ✅ 그래서 «본 척»을 못 하게 한다 — 게이트가 보여준 **자리(파일:줄)를 인용해야** 통과한다.
  //       그 자리는 게이트를 «돌려야» 알 수 있으므로, 인용 자체가 「읽었다」는 증거가 된다.
  // ⛔⛔ 여기서 «한 번 통째로 헛돌았다» — 첫 판이 `넵?` 이었다. `?` 가 붙어 **빈 문자열도 매치**해서
  //    `^(넵?)` 가 «어떤 문장이든» 시작에서 빈 매치가 됐다 → **맞는 이유까지 전부 빈 말로 막혔다.**
  //    📌 게이트가 «틀린 것을 막는» 게 아니라 «길을 없애면» 더 나쁘다. 짧은 말은 «전체 일치»로 가른다.
  const HOLLOW = /^(ㅇ+|응|넵|네|ok|o|yes|암|됐)$|^(그냥|알아|알았|맞아|괜찮)/i
  const okWhy = (w) => {
    if (!w || w.trim().length < 20) return false          // 한두 마디로는 못 넘긴다
    if (HOLLOW.test(w.trim())) return false
    return true
  }
  if (uniq.length && knows.length) {
    const bad = knows.filter((w) => !okWhy(w))
    // 게이트가 보여준 자리 중 «하나라도» 인용했나 — 안 봤으면 못 적는다
    const spots = [...new Set(uniq.map((c) => c.at))]
    const cited = knows.some((w) => spots.some((s) => w.includes(s) || w.includes(s.split(':')[0])))
    if (bad.length || !cited) {
      console.error(`\n⛔ --알고있음 이 «본 척»이다. 게이트를 통째로 뚫는 손잡이가 되면 안 된다.\n`)
      if (bad.length) console.error(`   ⛔ 너무 짧거나 빈 말이다(20자 이상 · 「ㅇ」·「그냥」 안 됨): ${bad.join(' / ')}`)
      if (!cited) {
        console.error(`   ⛔ **겹친 자리를 «인용»해야 한다** — 아래 중 하나를 그대로 적는다:`)
        spots.slice(0, 5).forEach((s) => console.error(`        ${s}`))
      }
      console.error(`
   ✅ 예: "CLAUDE.md:798 은 «앱 이전» 전제로 접은 갈래다. 이번은 «소유자 변경»이라 다른 절차다"
   📌 2026-08-18 재검수에서 잡았다 — \`--알고있음 "ㅇ"\` 한 글자로 그날 사고가 그대로 통과됐다.\n`)
      process.exit(1)
    }
  }
  if (uniq.length && !knows.length) {
    console.error(`\n🚨 이미 «정한» 것과 겹친다 — ${uniq.length}줄. 보고 나서 다시 판단한다.\n`)
    uniq.slice(0, 12).forEach((c) => console.error(`   Q${c.q} 「${c.key}」 → ${c.at}\n      ${c.ln}`))
    if (uniq.length > 12) console.error(`   … ${uniq.length - 12}줄 더`)
    console.error(`
   📌 2026-08-18 사고 = 「사업장 주소로 바꿀 수 있나」를 물으려 했는데
      그건 8/17 에 창업자가 «안 한다»로 접은 갈래였다. 답이 와도 안 쓴다.

   ✅ 그래도 물어야 한다면 «왜» 인지 적는다 — 그러면 통과한다:
      --알고있음 "위 확정은 앱 이전 전제였다. 소유자 변경은 다른 절차라 다시 물어야 한다"\n`)
    process.exit(1)
  }

  // ⓓ 지난번에 이미 보낸 질문인가
  let log = []
  if (existsSync(LOG)) { try { log = JSON.parse(readFileSync(LOG, 'utf8')) } catch { log = [] } }
  const dup = []
  for (let i = 0; i < qs.length; i++) {
    const keys = keyOf(qs[i])
    for (const past of log) {
      const hit = keys.filter((k) => past.질문.includes(k)).length
      if (hit >= Math.max(2, Math.ceil(keys.length * 0.6))) dup.push({ q: i + 1, past })
    }
  }
  if (dup.length && !knows.length) {
    console.error(`\n🚨 지난번에 «이미 보낸» 질문과 겹친다\n`)
    dup.slice(0, 6).forEach((d) => console.error(`   Q${d.q} ↔ ${d.past.날짜} ${d.past.도장}\n      ${d.past.질문}`))
    console.error(`\n   ⛔ 같은 걸 또 물으면 담당자가 앞 답을 붙여넣고 케이스를 닫는다.
   ✅ 앞 답이 모자랐다면 «무엇이 모자랐는지» 적어 통과시킨다:
      --알고있음 "앞 답은 앱 이전 기준이었고 소유자 변경은 안 다뤘다"\n`)
    process.exit(1)
  }

  // ── 통과 ── 도장을 찍고 기록한다
  const day = (get('--날짜') || todayKST()).replace(/-/g, '').slice(4)
  // 🔢 도장은 «유일»해야 한다 — 같은 날 두 번이면 앞 도장과 겹쳐 창업자가 못 가른다(2026-08-18 재검수)
  const stamp = `ASK-${day}-${log.length + 1}~${log.length + qs.length}`
  console.log(`\n✅ 지원팀문의 관문 통과 — 도장 ${stamp}\n`)
  qs.forEach((q, i) => {
    console.log(`   Q${i + 1} ${q}`)
    console.log(`      📸 근거 ${gs[i]}`)
    console.log(`      🔀 바뀜 ${cs[i]}`)
  })
  if (knows.length) knows.forEach((k) => console.log(`   ⚠️ 알고도 묻는 이유 — ${k}`))
  console.log(`
   📮 창업자 규칙 = **도장 없는 질문은 구글에 안 보낸다.**
      이 도장(${stamp})을 창업자에게 그대로 보여주고 나서 보낸다.
`)
  const rec = qs.map((q, i) => ({ 날짜: get('--날짜') || todayKST(), 도장: stamp, 질문: q, 근거: gs[i], 바뀜: cs[i] }))
  try { writeFileSync(LOG, JSON.stringify([...log, ...rec], null, 2) + '\n') } catch { /* 못 써도 통과는 살린다 */ }
  process.exit(0)
}

const given = {}
for (const v of all('--값')) {
  const at = v.indexOf('=')
  if (at > 0) given[v.slice(0, at).trim()] = v.slice(at + 1).trim()
}

const keys = Object.keys(spec.fields)
const missing = keys.filter((k) => !given[k] || given[k].length < 2)
// 「확인함」·「받았음」 같은 빈 말은 값이 아니다 — 화면에서 읽은 «내용»이라야 한다
const EMPTY = /^(확인|확인함|받음|받았음|봤음|ok|o|예|네|있음|정상)$/i
const hollow = keys.filter((k) => given[k] && EMPTY.test(given[k].trim()))

if (missing.length || hollow.length) {
  console.error(`\n⛔ 「${spec.what}」 — 실물을 먼저 받아야 한다.\n`)
  if (missing.length) {
    console.error('   📸 창업자에게 이 화면들을 요청한다:\n')
    for (const k of missing) console.error(`      · ${k}\n          ${spec.fields[k]}`)
  }
  if (hollow.length) {
    console.error(`\n   ⚠️ 값이 «빈 말»이다 — 화면에서 «읽은 내용»을 적어야 한다: ${hollow.join(' · ')}`)
    console.error('      (「확인함」은 값이 아니다. 「7/22 16 · 7/24 18」처럼 숫자·글자를 적는다)')
  }
  console.error(`\n   ⛔ 이게 채워지기 전엔 초안을 «쓰지 않는다».`)
  console.error(`   📌 2026-08-02 반려가 정확히 이 칸이었다 — 콘솔을 안 물어보고 「모른다」로 냈다.\n`)
  process.exit(1)
}

console.log(`\n✅ 제출물 관문 통과 — 「${spec.what}」\n`)
for (const k of keys) console.log(`   📸 ${k} — ${given[k]}`)
console.log(`\n   이제 초안을 쓴다. ⚠️ 위 값이 «그대로» 답변에 들어가야 한다 — 다시 짐작하지 말 것.\n`)
