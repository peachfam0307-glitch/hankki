#!/usr/bin/env node
/**
 * 📤📤 「도구 답이 대화 창을 한 번에 먹는 것」 재현판 — 2026-09-03
 *
 * 📮 창업자 = "하루종일 이거 잡는중이었어. 컨텍스트 오류."
 *
 * ⛔⛔ 그날 실측 (창업자 캡처 두 장)
 *      /clear 직후  6%  (58.8k / 1M)  →  «한 턴» 뒤  45%  (445.7k / 1M)
 *      그 턴 명령 = `measure doc sizes and tool output sizes`
 *      문서·도구 답 «크기를 재려던» 명령이 재려던 것을 그대로 대화에 쏟았다.
 *
 * ⭐ 이 판이 재는 것 = `bigout-guard.sh` 가
 *      ⑴ 답 길이를 «모르는» 명령을 «상한 없이» 부르면 → 막는가 (exit 2)
 *      ⑵ 상한을 한 마디 붙이면 → 통과시키는가 (exit 0)   ← ⛔막다른 길이면 사람이 게이트를 끈다
 *      ⑶ 이미 뱉은 «큰 답»을 재서 → 그 턴에서 멈추게 하는가
 *
 * ⛔ 「막는다」만 재면 안 된다. 2026-09-03 아침에도 게이트가 «죽은 글자»를 세느라
 *    3주간 초록불을 찍었다. 「통과했나」가 아니라 «무엇을 보고 통과했나».
 */
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = dirname(fileURLToPath(import.meta.url))
const 뿌리 = join(여기, '..', '..')            // /home/user/hankki
const 훅 = join(뿌리, '.claude', 'hooks', 'bigout-guard.sh')

function 눌러보기 (입력, 모드 = 'tool') {
  const r = spawnSync('bash', [훅, 모드], {
    input: JSON.stringify(입력),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: 뿌리 },
  })
  return { 종료값: r.status, 말: (r.stderr || '') }
}

const 명령 = (c) => ({ tool_name: 'Bash', tool_input: { command: c } })

// ── ⑴ 막아야 하는 것 = 답 길이를 모르는데 상한이 없다
const 막혀야 = [
  ['저장소 판 스크립트', 'node hankki/scripts/latest-map.mjs'],
  ['npm run', 'npm run assets'],
  ['git log', 'git log --oneline'],
  ['find', 'find hankki/docs -name "*.md"'],
  ['grep -r', 'grep -r "큰술" hankki/src'],
  ['for 반복문', 'for f in hankki/docs/*.md; do node hankki/scripts/tools.mjs "$f"; done'],
  // ⭐ 그날 실제로 터진 모양 — 「문서 크기와 도구 답 크기를 잰다」
  ['그날 그 명령', 'for f in hankki/docs/*.md; do wc -c "$f"; done; node hankki/scripts/tools.mjs 영상'],
]

// ── ⑵ 통과해야 하는 것 = 상한을 붙였거나, 애초에 답이 짧다
const 통과해야 = [
  ['| head 로 잘랐다', 'node hankki/scripts/latest-map.mjs | head -40'],
  ['| head -c 로 잘랐다', 'npm run assets | head -c 60000'],
  ['| wc -l 은 숫자만', 'git log --oneline | wc -l'],
  ['파일로 흘렸다', 'find hankki/docs -name "*.md" > /tmp/목록.txt'],
  ['--for 로 좁혀 불렀다', 'node hankki/scripts/latest-map.mjs --for "인스타"'],
  ['grep -c 는 숫자만', 'grep -rc "큰술" hankki/src'],
  ['애초에 짧은 명령', 'git status --short'],
  ['파일 하나 크기', 'wc -c hankki/CLAUDE.md'],
]

let 틀림 = 0
const 적기 = (ok, 이름, 덧말 = '') => {
  if (!ok) 틀림++
  console.log(`   ${ok ? '✅' : '❌'} ${이름}${덧말 ? ' — ' + 덧말 : ''}`)
}

console.log('\n📤 도구 답 크기 게이트 — 재현판\n')

console.log('  ⑴ 막아야 하는 것 (상한 없음)')
for (const [이름, cmd] of 막혀야) {
  const r = 눌러보기(명령(cmd))
  적기(r.종료값 === 2, 이름, r.종료값 === 2 ? '' : `종료값 ${r.종료값} (2 여야 한다)`)
}

console.log('\n  ⑵ 통과해야 하는 것 (⛔막다른 길이면 게이트가 꺼진다)')
for (const [이름, cmd] of 통과해야) {
  const r = 눌러보기(명령(cmd))
  적기(r.종료값 === 0, 이름, r.종료값 === 0 ? '' : `종료값 ${r.종료값} (0 이어야 한다)`)
}

console.log('\n  ⑶ 이미 뱉은 답을 재는 자리 (PostToolUse)')
{
  // ⛔⛔ [2026-09-10] 칸마다 «자기 세션 이름»을 준다.
  //    까닭 = 게이트는 「턴 합계」를 세션 이름별 파일(/tmp/hankki-bigout-turn-<세션>)에 쌓는다.
  //    이름을 안 주면 셋이 «nosid» 한 통을 같이 쓴다 → 앞 칸의 90,000 B 가 남아
  //    다음 칸의 «작은 답»이 턴 합계로 걸린다. 실제로 2026-09-10 스모크에서 그렇게 죽었다.
  //    ⭐ 「합계를 재는 것」은 ⑷ 가 따로 맡는다. 여기 셋은 «답 하나»만 재는 자리다.
  const 방 = (n) => `repro3-${process.pid}-${n}`
  const 큰답 = { session_id: 방(1), tool_name: 'Bash', tool_response: { stdout: 'ㄱ'.repeat(30000) } } // ≈90,000 B
  const r = 눌러보기(큰답, 'after')
  적기(r.종료값 === 2, '6만 B 넘는 답 → 멈춘다', r.종료값 === 2 ? '' : `종료값 ${r.종료값}`)

  const 작은답 = { session_id: 방(2), tool_name: 'Bash', tool_response: { stdout: '잘 됐다' } }
  const r2 = 눌러보기(작은답, 'after')
  적기(r2.종료값 === 0, '작은 답 → 조용히 통과', r2.종료값 === 0 ? '' : `종료값 ${r2.종료값}`)

  // ⛔ 못 재는 모양이 와도 «막다른 길»이 되면 안 된다 — 0 으로 보고 통과해야 한다
  const 모를답 = { session_id: 방(3), tool_name: 'Bash' }
  const r3 = 눌러보기(모를답, 'after')
  적기(r3.종료값 === 0, '답을 못 찾으면 통과(막다른 길 방지)', r3.종료값 === 0 ? '' : `종료값 ${r3.종료값}`)

  // ⛔⛔ 2026-09-03 = 만든 지 10분 만에 «내가» 걸렸다. HANDOVER.md 를 한 줄 고쳤는데
  //    Edit 의 답에 파일이 통째로 실려 와 64,659 B 로 막혔다.
  //    👉 여기서 막아도 되돌릴 수도, 좁혀 다시 부를 수도 없다 — 그건 잔소리다.
  //    ⭐ 이 게이트는 «좁혀서 다시 부를 수 있는» 도구에만 값어치가 있다.
  for (const 도구 of ['Edit', 'Write', 'MultiEdit', 'NotebookEdit']) {
    const r4 = 눌러보기({ session_id: 방(`e-${도구}`), tool_name: 도구, tool_response: { content: 'ㄱ'.repeat(30000) } }, 'after')
    적기(r4.종료값 === 0, `${도구} 큰 답 → 통과(고칠 수 없는 건 안 막는다)`, r4.종료값 === 0 ? '' : `종료값 ${r4.종료값}`)
  }
}

console.log('\n  ⑷ «턴 합계» (2026-09-07 창업자 캡처 = Messages 1.3M/1M · 답 하나는 작아도 합치면 넘는다)')
{
  const sid = 'repro-turn-' + process.pid
  const 답 = (n) => ({ session_id: sid, tool_name: 'Bash', tool_response: { stdout: 'ㄱ'.repeat(n) } })
  눌러보기({ session_id: sid }, 'reset')
  // 55,000 B 답 넷 = 하나하나는 상한(60,000) 아래 · 합계 220,000 > 200,000
  const 앞셋 = [1, 2, 3].map(() => 눌러보기(답(55000 / 3 | 0), 'after').종료값)   // ≈55,000 B 씩(3바이트 글자)
  적기(앞셋.every((v) => v === 0), '작은 답 셋 → 조용히 통과', 앞셋.join(','))
  const r4 = 눌러보기(답(55000 / 3 | 0), 'after')
  적기(r4.종료값 === 2 && /합쳐서/.test(r4.말), '넷째에서 합계가 넘으면 멈춘다', r4.종료값 === 2 ? '' : `종료값 ${r4.종료값}`)
  // 알린 뒤엔 계수기가 비워져 다음 답은 조용하다 · reset 뒤에도 조용하다
  const r5 = 눌러보기(답(1000), 'after')
  적기(r5.종료값 === 0, '알린 뒤 계수기 비움 → 다음 답 조용', r5.종료값 === 0 ? '' : `종료값 ${r5.종료값}`)
  눌러보기({ session_id: sid }, 'reset')
  const r6 = 눌러보기(답(55000 / 3 | 0), 'after')
  적기(r6.종료값 === 0, '창업자가 말하면(reset) 새 턴 → 조용', r6.종료값 === 0 ? '' : `종료값 ${r6.종료값}`)
}

console.log('\n  ⑸ «그림 오탐» (2026-09-07 · 615KB 비교 그림 한 장이 600KB 답으로 잡혀 턴을 멈췄다)')
{
  const sid = 'repro-img-' + process.pid
  눌러보기({ session_id: sid }, 'reset')
  const 그림 = { session_id: sid, tool_name: 'Read', tool_response: [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'A'.repeat(700000) } }] }
  const r1 = 눌러보기(그림, 'after')
  적기(r1.종료값 === 0, '700KB 그림 한 장 → 글자가 아니라 조용히 통과', r1.종료값 === 0 ? '' : `종료값 ${r1.종료값}`)
  const 여러장 = [...Array(4)].map(() => 눌러보기(그림, 'after').종료값)
  적기(여러장.every((v) => v === 0), '그림 다섯 장(3.5MB)도 합계로 안 잡힌다(장당 6,000 B 로 친다)', 여러장.join(','))
  눌러보기({ session_id: sid }, 'reset')
}

if (틀림) {
  console.log(`\n❌ ${틀림}개 틀렸다 — 게이트가 제 일을 못 한다.\n`)
  process.exit(1)
}
console.log('\n✅ 전부 통과 — 막을 건 막고, 좁혀 부르면 지나간다.\n')
