// 📏 시안 넷을 «숫자»로 견준다 (창업자 2026-08-07
//    *"어떤게 제일 우리 자산이랑 잘 맞고 쓰기 편해? 직관적이어야해. 최소한의 터치로 구동할 수 있게"*)
//   ⛔ 느낌으로 고르면 또 갈아엎는다. 두 가지를 «잰다»:
//      ⑴ 도구가 먹는 높이 → 서랍(스티커 404컷 보는 곳)에 얼마가 남나
//      ⑵ 자주 하는 일 다섯을 하는 데 «몇 번 누르나»
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'

const HTML = readFileSync('/home/user/hankki/hankki/docs/demo/꾸미기-재설계-시안-2026-08-07.html', 'utf8')
const srv = createServer((q, s) => { s.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); s.end(HTML) })
await new Promise((r) => srv.listen(4443, r))

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await (await b.newContext({ viewport: { width: 380, height: 900 } })).newPage()
await page.goto('http://127.0.0.1:4443/', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)

// ⑴ 판마다 «도구가 먹는 높이» — 종이 아래에서 스티커 격자 위까지
const m = await page.evaluate(() => {
  const 이름 = ['지금', '안 A 겹치기', '안 B 층 가르기', '안 C 아이콘 바', '안 D 뒤집기']
  return [...document.querySelectorAll('.phone')].map((p, i) => {
    const R = (e) => (e ? e.getBoundingClientRect() : null)
    const paper = R(p.querySelector('.paper'))
    const grid = R(p.querySelector('.grid'))
    const 전체 = R(p)
    // 「누르는 칸」 높이 목록
    const 칸 = [...p.querySelectorAll('button')].map((x) => Math.round(x.getBoundingClientRect().height)).filter((h) => h > 10)
    const 미달 = 칸.filter((h) => h < 44).length
    // 알약(둥근 칸) 높이 종류
    const 알약 = new Set()
    p.querySelectorAll('button').forEach((x) => {
      const cs = getComputedStyle(x); const r = x.getBoundingClientRect()
      if (r.height < 16) return
      const rad = parseFloat(cs.borderRadius)
      if (rad > 900 || rad > r.height / 2 - 2) 알약.add(Math.round(r.height))
    })
    return {
      이름: 이름[i] || `판${i}`,
      도구가먹는높이: paper && grid ? Math.round(grid.top - paper.bottom) : null,
      스티커격자위치: paper && grid ? '있음' : '없음(도구만)',
      판전체: Math.round(전체.height),
      누르는칸: 칸.length, 손가락미달: 미달,
      알약종류: [...알약].sort((a, b) => a - b),
    }
  })
})
console.log('\n📏 ⑴ 도구가 먹는 높이 · 손가락 · 알약 종류\n')
console.log('   판                 도구먹는높이   누르는칸  44px미달   알약 높이 종류')
m.forEach((x) => {
  console.log(`   ${x.이름.padEnd(16)} ${String(x.도구가먹는높이 ?? '—').padStart(8)}px ${String(x.누르는칸).padStart(9)} ${String(x.손가락미달).padStart(8)} ${x.알약종류.length ? '   ' + x.알약종류.join(' · ') + 'px' : '   (알약 없음)'}`)
})

await b.close(); srv.close()

// ⑵ 자주 하는 일 = 몇 번 누르나 (판마다 «화면 구조»에서 나오는 값 — 손으로 세지 않고 규칙으로 센다)
//    ⭐ 갈리는 건 딱 하나다: 「도구가 서랍을 덮나」
const 덮나 = { '지금': false, '안 A 겹치기': true, '안 B 층 가르기': false, '안 C 아이콘 바': true, '안 D 뒤집기': false }
const 일 = [
  { k: '① 스티커 하나 붙이기', 기본: 3, 덮으면추가: 0 },          // [일꾸]→[데코]→[스티커]
  { k: '② 방금 붙인 것 색 바꾸기', 기본: 2, 덮으면추가: 0 },        // [색]→[색칩]
  { k: '③ 이어서 «또» 붙이기', 기본: 1, 덮으면추가: 1 },           // ⭐덮으면 닫기 한 번이 더 든다
  { k: '④ 스티커 다섯 개 연달아 붙이기', 기본: 5, 덮으면추가: 4 },   // ③이 네 번 더
  { k: '⑤ 속지 바꾸기', 기본: 2, 덮으면추가: 1 },                  // [속지]→[틀] · 덮여 있으면 닫기부터
]
console.log('\n👆 ⑵ 자주 하는 일 = 몇 번 누르나\n')
const 판 = Object.keys(덮나)
console.log('   ' + '하는 일'.padEnd(26) + 판.map((p) => p.replace('안 ', '').padStart(9)).join(''))
const 합 = Object.fromEntries(판.map((p) => [p, 0]))
일.forEach((j) => {
  const 줄 = 판.map((p) => {
    const n = j.기본 + (덮나[p] ? j.덮으면추가 : 0)
    합[p] += n
    return String(n).padStart(9)
  }).join('')
  console.log('   ' + j.k.padEnd(24) + 줄)
})
console.log('   ' + '─'.repeat(70))
console.log('   ' + '합계'.padEnd(26) + 판.map((p) => String(합[p]).padStart(9)).join(''))
console.log('\n   ⭐ 갈리는 건 「도구가 서랍을 덮나」 하나다 — 덮으면 «이어서 붙이기»마다 한 번씩 더 든다.')
console.log('   📌 다꾸는 스티커를 «연달아» 붙이는 일이라 ③④가 제일 자주 일어난다.')
