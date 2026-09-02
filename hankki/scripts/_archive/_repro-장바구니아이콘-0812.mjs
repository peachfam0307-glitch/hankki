// 🛒 창업자 폰 제보 재현 — *"장바구니 아이콘 바뀜"*
//   ⛔ 원인 = `PRODUCTS` 가 카테고리에서 `emoji` 만 얹고 **`icon` 을 안 얹었다**(curation.js:200).
//      그래서 「이번 주 픽」처럼 «제품 단위»로 그리는 자리는 `it.icon` 이 undefined →
//      **유니코드 이모지로 폴백**(🫗🍶🐟🍬). 카테고리 카드는 `c.icon` 을 직접 써서 멀쩡했다.
//   ⭐ 우리 규칙은 **UI 에 유니코드 이모지 금지**(CLAUDE.md)라 규칙 위반이기도 하다.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const PORT = 4197
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT)], { stdio: 'ignore' })
await new Promise(r => setTimeout(r, 3500))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, timezoneId: 'Asia/Seoul' })
const 결과 = []
const 재 = (이름, 통과, 말) => { 결과.push([통과, 이름, 말]); console.log(`${통과 ? '✅' : '⛔'} ${이름} — ${말}`) }
const p = await ctx.newPage()
p.on('pageerror', e => console.log('⛔ pageerror', String(e).slice(0, 120)))
await p.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1')
  const o = Storage.prototype.getItem
  Storage.prototype.getItem = function (k) { return k.startsWith('hankki:coach:') ? '1' : o.call(this, k) }
})
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(500)
await p.locator('.bottom-nav button', { hasText: '장보기' }).first().click()
await p.waitForTimeout(600)

// 「이번 주 픽」 칩이 기본으로 골라져 있다 — 제품 카드의 그림칸을 읽는다
const 픽 = await p.evaluate(() => {
  // ⛔ 「shop-row」 는 «장보기 리스트» 줄이다. 제품 카드는 「card」 안의 「emoji-tile」 이다
  //    (ShopScreen:355). 첫 판이 0줄이었던 건 「없다」가 아니라 **내가 딴 걸 찾은 것**이다(규칙 18).
  const 줄 = [...document.querySelectorAll('.card')].filter(c => c.querySelector('.emoji-tile'))
  return 줄.slice(0, 6).map(r => {
    const 이름 = r.querySelector('b, .name, strong')?.textContent?.trim()
      || (r.textContent || '').trim().slice(0, 20)
    // 그림칸 = 첫 img 또는 이모지 글자
    const 타일 = r.querySelector('.emoji-tile')
    const img = 타일?.querySelector('img')
    const 이모지 = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(타일?.textContent || '')
    return { 이름: 이름.slice(0, 18), 그림: !!img, 이모지 }
  })
})
console.log('  이번 주 픽:', 픽.map(r => `${r.이름}/${r.그림 ? 'img' : r.이모지 ? '이모지⛔' : '?'}`).join(' · '))
재('① 「이번 주 픽」 제품 줄이 떴나', 픽.length > 0, `${픽.length}줄`)
재('② 제품마다 «우리 그림»이 붙나', 픽.length > 0 && 픽.every(r => r.그림),
  픽.filter(r => !r.그림).map(r => r.이름).join(',') || '전부 그림')

// 「전체」 칩으로 옮겨 카테고리 카드도 확인 (여긴 원래 멀쩡했다 — 회귀 감시)
await p.locator('button', { hasText: '전체' }).first().click().catch(() => {})
await p.waitForTimeout(500)
const 전체 = await p.evaluate(() => {
  const 줄 = [...document.querySelectorAll('.card')].filter(c => c.querySelector('.emoji-tile'))
  return { 줄: 줄.length, 그림: 줄.filter(r => r.querySelector('.emoji-tile img')).length }
})
재('③ 「전체」도 그림 그대로인가(회귀)', 전체.줄 > 0 && 전체.그림 === 전체.줄, `${전체.그림}/${전체.줄}줄`)

// ⛔ 화면 어디에도 유니코드 이모지가 남으면 안 된다 (우리 규칙)
const 이모지수 = await p.evaluate(() => {
  const re = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
  let n = 0
  // ⛔ 빈 배열이면 «늘 0» 이라 통과한다 — 잰 칸이 몇인지도 같이 돌려준다(실패할 줄 모르는 칸 방지)
  const 타일 = [...document.querySelectorAll('.card .emoji-tile')]
  타일.forEach(t => { if (re.test(t.textContent || '')) n++ })
  return { n, 잰것: 타일.length }
})
재('④ 제품 그림칸에 유니코드 이모지 0', 이모지수.잰것 > 0 && 이모지수.n === 0,
  `${이모지수.n}개 (잰 칸 ${이모지수.잰것})`)

console.log('\n' + '─'.repeat(50))
const 통과 = 결과.filter(r => r[0]).length
console.log(`통과 ${통과} / ${결과.length}`)
await b.close(); srv.kill(); process.exit(통과 === 결과.length ? 0 : 1)
