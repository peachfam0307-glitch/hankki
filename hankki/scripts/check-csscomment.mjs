#!/usr/bin/env node
// 🧨🧨 **깨진 CSS 주석 = 그 «다음 규칙»이 통째로 사라진다** (2026-09-01 신설 · 배포 게이트)
//
// 📮 창업자 = *"패드에서 요리모드 제일 마지막에 사진 넣는 부분 좀 이상하고. 폰도 다시 봐야 할듯"*
//
// ⛔⛔ **오늘 하루에 «두 개»가 있었고 둘 다 규칙을 죽이고 있었다.**
//    ⑴ `.cook-steptext .step-tip` 앞 — 곁말 획 규칙
//    ⑵ `.cook-shot` 앞 — **완성 사진 줄 전체**(display:flex · padding). 창업자가 눈으로 잡은 그것.
//
// 🔎 왜 이렇게 무서운가 = **아무도 안 죽는다.**
//    · 빌드 exit 0 · 스모크 통과 · 그 CSS 파일은 «멀쩡히» dist 에 들어간다
//    · 브라우저 파서는 미아 `*/` 를 만나면 «다음 { … }» 까지 통째로 버리고 회복한다
//      → **바로 아래 규칙 하나가 조용히 사라진다.** 화면을 열어봐야만 안다.
//    📌 그래서 실측이 이상했다 — computed 로는 `flex-direction: column` 이 보이는데
//       (그건 «더 구체적인» 다른 규칙이 준 값) 정작 `display: flex` 가 없어 세로로 안 섰다.
//
// ✅ 잣대 = 파일을 처음부터 훑어 `/*` 와 `*/` 의 짝을 맞춘다.
//    ⛔ 「개수가 같나」로 세면 «안 잡힌다** — 오늘 것도 개수는 맞았다(짝이 어긋났을 뿐).
//    ⭐ CSS 주석은 «중첩이 안 된다** — `/*` 안의 `/*` 는 그냥 글자다. 그 규칙 그대로 스캔한다.
//
// 실행: node hankki/scripts/check-csscomment.mjs
import { readFileSync } from 'node:fs'
// ⚠️ globSync 는 Node 22+ 전용이라 «안 쓴다» — CI 는 Node 20 이다(CLAUDE.md). 손으로 훑는다.
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('../src', import.meta.url).pathname
const 파일들 = []
const 훑기 = (d) => {
  for (const n of readdirSync(d)) {
    const p = join(d, n)
    if (statSync(p).isDirectory()) { if (n !== 'assets') 훑기(p); continue }
    if (n.endsWith('.css')) 파일들.push(p)
  }
}
훑기(ROOT)

let 나쁨 = 0
for (const f of 파일들) {
  const s = readFileSync(f, 'utf8')
  const 줄 = (i) => s.slice(0, i).split('\n').length
  let pos = 0, 안에 = false, 연자리 = 0
  const 문제 = []
  while (pos < s.length) {
    if (!안에) {
      const n = s.indexOf('/*', pos)
      const 끝 = n < 0 ? s.length : n
      // 주석 «밖»에 있는 `*/` = 미아. 여기서 파서가 미끄러진다.
      for (let k = s.indexOf('*/', pos); k >= 0 && k < 끝; k = s.indexOf('*/', k + 2)) 문제.push(['미아 */', 줄(k)])
      if (n < 0) break
      연자리 = n; pos = n + 2; 안에 = true
    } else {
      const n = s.indexOf('*/', pos)
      if (n < 0) { 문제.push(['안 닫힌 /*', 줄(연자리)]); break }
      pos = n + 2; 안에 = false
    }
  }
  if (문제.length) {
    나쁨 += 문제.length
    console.error(`⛔ ${f.replace(ROOT, 'src')}`)
    for (const [무엇, l] of 문제) {
      console.error(`   ${무엇} — ${l}줄`)
      console.error(`      ${s.split('\n')[l - 1]?.trim().slice(0, 90)}`)
    }
  }
}

if (나쁨) {
  console.error(`\n🧨 깨진 CSS 주석 ${나쁨}건 — **바로 아래 규칙이 조용히 죽는다.**`)
  console.error('   ⭐ 고치는 법 = 군더더기 «*/» 를 빼거나, 안 닫힌 «/*» 를 닫는다.')
  console.error('   ⛔ 「빌드가 되니까 괜찮다」로 넘기지 말 것 — 빌드도 스모크도 이걸 못 잡는다.')
  process.exit(1)
}
console.log(`✅ CSS 주석 짝 — ${파일들.length}개 파일 전부 멀쩡`)
