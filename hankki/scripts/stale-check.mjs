// 🕳🕳 낡음 재기 — 「이 디스크가 원격보다 뒤처졌나」를 «한 곳»에서 잰다.
//
// 📮 창업자 2026-08-11 아침: *"시작브리핑 낡은거 반영안되도록 시스템만들자"* ·
//    *"왜이러는 일이 생기는지 분석해봐 (어제 분명 저장(문서)아티팩트까지 다 했잖아)"*
//
// ⛔⛔⛔ **2026-08-11 에 새로 알아낸 것 — 되감김은 «세션이 재개될 때마다» 난다.**
//    그날 아침 한 시간 안에 **두 번** 되감겼고, 두 번 다 **똑같은 자리(`b7ec7d0` · 어제 낮 11:11)** 였다.
//    ⭐ **결정적 증거 = `git reflog`.** 오늘 아침에 한 checkout·commit·push 가 reflog 에 **한 줄도 없었다**
//       → 워킹트리만 되돌아간 게 아니라 **`.git` 이 통째로** 그 시점으로 돌아간다.
//    ⚠️ 그래서 **「이 컨테이너 안에 무엇을 설치해 두는」 방식은 전부 헛수고다** — 다음 재개 때 같이 사라진다.
//       (2026-08-10 에 `~/.claude/hooks/` 에 둔 base-guard 도 그렇게 사라졌다. 홈 폴더도 되감긴다.)
//    ✅ **원격(GitHub)만이 안전하다.** 그래서 규칙이 하나로 좁혀진다 — **만들면 즉시 커밋·푸시.**
//
// ⭐⭐ **제일 나쁜 것은 「낡은 것」이 아니라 「낡은 것을 최신인 척 주는 것」이다.**
//    낡은 줄 알면 다시 받으면 되는데, 최신인 줄 알면 그 위에서 판단하고 문서를 고치고 창업자에게 보고한다.
//    2026-08-10 에 실제로 그렇게 «멀쩡한 CLAUDE.md 를 틀리게 고쳐» 푸시했다.
//
// 🔎 **잣대 = «로컬 배포 브랜치 ref» vs «원격 배포 브랜치 ref»** (지금 HEAD 가 아니다)
//    ⭐ 그래야 `hold/*` 에서 검수 대기 중일 때 거짓 경보가 안 난다 — 그건 낡은 게 아니라 «작업 중»이다.
//    (`base-guard.sh` 와 같은 잣대다. 두 장치가 같은 것을 봐야 말이 안 엇갈린다.)
//
// ⏱ **빨라야 한다** — 창업자가 말할 때마다 도는 자리다.
//    · ref 두 개 비교 = 몇 ms
//    · fetch 는 «필요할 때만» — SessionStart 이거나, 마지막 fetch 가 FETCH_MIN 분 넘었을 때
//    ⚠️ 세션 «중»에도 되감기므로 주기 fetch 를 뺄 수 없다.
import { execFileSync } from 'node:child_process'
import { writeFileSync, statSync } from 'node:fs'

export const DEPLOY = 'claude/chatgpt-conversation-link-kvn5ph'
const LOG = '/tmp/hankki-낡음.json'
const FETCH_MIN = 10 // 분 — 이보다 오래됐으면 다시 받아본다

const git = (args, ms = 4000) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8', timeout: ms, stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch { return '' }
}

const 분전 = (p) => {
  try { return (Date.now() - statSync(p).mtimeMs) / 60000 } catch { return Infinity }
}

/** 낡았나 재기. opts.fetch = 'always' | 'auto'(기본) | 'never' */
export function checkStale({ fetch = 'auto' } = {}) {
  const root = git(['rev-parse', '--show-toplevel'])
  if (!root) return { ok: false, why: 'git 저장소가 아니다' }

  // 🔻 fetch 는 «필요할 때만» — 안 그러면 창업자가 한 마디 할 때마다 네트워크를 친다
  let fetched = false
  const 마지막 = 분전(`${root}/.git/FETCH_HEAD`)
  if (fetch === 'always' || (fetch === 'auto' && 마지막 > FETCH_MIN)) {
    // ⚠️ timeout 을 짧게 — 막히면 포기한다. 「못 쟀다」가 「안 낡았다」로 새면 안 되니 아래서 갈라 쓴다.
    git(['fetch', '-q', 'origin', DEPLOY], 12000)
    fetched = 분전(`${root}/.git/FETCH_HEAD`) < 1
  }

  const local = git(['rev-parse', '--verify', '-q', `refs/heads/${DEPLOY}`])
  const remote = git(['rev-parse', '--verify', '-q', `refs/remotes/origin/${DEPLOY}`])
  // ⛔ 둘 중 하나라도 못 봤으면 «판단 근거가 없다» — 짐작으로 「안 낡았다」고 하지 않는다
  if (!local || !remote) return { ok: false, why: '배포 브랜치 ref 를 못 봤다', fetched }

  const behind = Number(git(['rev-list', '--count', `${local}..${remote}`]) || 0)
  const ahead = Number(git(['rev-list', '--count', `${remote}..${local}`]) || 0)
  const stale = behind > 0

  const out = {
    stale, behind, ahead, fetched,
    잰때: new Date().toISOString(),
    로컬: local.slice(0, 7), 원격: remote.slice(0, 7),
    가지: git(['branch', '--show-current']) || '(없음)',
    // 「몇 시간 낡았나」 = 로컬 배포 브랜치의 마지막 커밋 시각 (창업자에게 보여줄 사실 한 줄)
    나이: git(['log', '-1', '--format=%cr', local]) || '?',
    ok: true,
  }
  try { writeFileSync(LOG, JSON.stringify(out, null, 1)) } catch { /* 훅은 세션을 안 깬다 */ }
  return out
}

/** 창업자에게 보여줄 경고문 — ⛔낡았을 때만 부른다 */
export function staleBanner(s) {
  return [
    '',
    '⛔⛔ **지금 이 디스크가 «낡았다» — 아래 값·문서·코드를 그대로 믿지 말 것.**',
    `   원격이 **${s.behind}커밋** 앞서 있다 (여기 = \`${s.로컬}\` · 마지막 커밋 ${s.나이} · 원격 = \`${s.원격}\`)`,
    '',
    '   🧠 **왜 위험한가** — 낡은 줄 모르면 그 위에서 판단하고, 문서를 「고치고」, 창업자에게 보고한다.',
    '      2026-08-10 에 실제로 멀쩡한 CLAUDE.md 를 틀리게 고쳐 푸시했다.',
    '',
    '   👉 **먼저 이걸 한다 (순서대로)**',
    '      1) `git status --short` — 안 커밋된 게 있으면 **먼저 `hold/*` 에 담고 푸시**한다(⛔버리지 말 것)',
    `      2) \`git log --oneline origin/${DEPLOY}..HEAD\` — 원격에 없는 커밋이 있나`,
    `      3) 둘 다 안전하면 → \`git checkout -f -B ${DEPLOY} origin/${DEPLOY}\``,
    '',
    '   ⛔ **맞추기 «전»에는 「없다」·「안 나갔다」·「빠졌다」를 말하지 않는다.** 그건 디스크가 낡은 것이지 사실이 아니다.',
    '',
  ].join('\n')
}

// 직접 실행 = 지금 상태를 사람이 읽게 찍는다 (`node hankki/scripts/stale-check.mjs [--fetch]`)
if (process.argv[1] && process.argv[1].endsWith('stale-check.mjs')) {
  const s = checkStale({ fetch: process.argv.includes('--fetch') ? 'always' : 'auto' })
  if (!s.ok) { console.log(`⚠️ 못 쟀다 — ${s.why}`); process.exit(0) }
  if (s.stale) { console.log(staleBanner(s)); process.exit(1) }
  console.log(`✅ 안 낡았다 — 배포 브랜치 \`${s.로컬}\` = 원격 (지금 가지 \`${s.가지}\`${s.ahead ? ` · 로컬이 ${s.ahead}커밋 앞섬` : ''})`)
}
