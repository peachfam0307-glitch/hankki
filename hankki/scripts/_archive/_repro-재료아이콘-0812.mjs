// 🥕 재료 아이콘 171컷이 «냉장고에» 붙나 — 창업자 시트 11장(2026-08-12)
//
// ✅ 창업자 확정 *"냉장고(장보기)에 넣자. 주부장바구니는 그림체가 달라 따로 뽑아야해."*
// ⭐ 규칙 12 — 이 판을 고치기 «전» 코드로 돌리면 ②③이 ⛔ 난다(그땐 재료 SVG·장바구니 그림이었다).
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = 4194
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT)], { stdio: 'ignore' })
await new Promise(r => setTimeout(r, 3500))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, timezoneId: 'Asia/Seoul' })
const 결과 = []
const 재 = (이름, 통과, 말) => { 결과.push([통과, 이름, 말]); console.log(`${통과 ? '✅' : '⛔'} ${이름} — ${말}`) }

// 📦 시드 — ⛔ `s.recipes` 배열이 «반드시» 있어야 한다(store.jsx:78 이 없으면 저장값을 통째로 버린다)
const 담을것 = ['양파', '돼지고기', '두부', '애호박', '김치', '무']
const p = await ctx.newPage()
p.on('pageerror', e => console.log('⛔ pageerror', String(e).slice(0, 140)))
await p.addInitScript((names) => {
  localStorage.setItem('hankki:onboarded', '1')
  const o = Storage.prototype.getItem
  Storage.prototype.getItem = function (k) { return k.startsWith('hankki:coach:') ? '1' : o.call(this, k) }
  const raw = localStorage.getItem('hankki:v1')
  const s = raw ? JSON.parse(raw) : {}
  s.recipes = s.recipes || []
  s.pantry = names.map((n, i) => ({ id: `p${i}`, name: n, at: Date.now() }))
  localStorage.setItem('hankki:v1', JSON.stringify(s))
}, 담을것)
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(500)
await p.locator('.bottom-nav button', { hasText: '장보기' }).first().click()
await p.waitForTimeout(400)
// ⛔ 「냉장고」는 하단 탭이 아니라 «장보기 화면 안»의 토글이다(ShopScreen `button.seg`)
await p.locator('button.seg', { hasText: '냉장고' }).first().click()
await p.waitForTimeout(700)

// ⛔ 냉장고 줄은 '.wish-row' 다 — '.pantry-item' 은 «없는 이름»이라 0줄이 나왔다(규칙 18: 「없다」가 아니라 내가 딴 걸 찾았다)
const 줄 = await p.evaluate(() => [...document.querySelectorAll('.wish-row')]
  .filter(x => x.querySelector('img, svg'))
  .map(x => ({
    글: (x.innerText || '').split('\n')[0].trim(),
    그림: x.querySelector('img')?.getAttribute('src') || null,
    svg: !!x.querySelector('svg'),
  })).filter(x => x.글))

const 찾 = (n) => 줄.find(x => x.글.includes(n))
const 재료그림 = (n) => { const r = 찾(n); return r && r.그림 && /ig_/.test(r.그림) }

재('① 냉장고 줄이 떴나', 줄.length >= 6, `${줄.length}줄 · ${줄.slice(0, 6).map(x => x.글).join(', ')}`)
재('② 담은 재료에 «창업자 그림»이 붙나', 줄.length > 0 && ['양파', '돼지고기', '두부', '애호박'].every(재료그림),
  ['양파', '돼지고기', '두부', '애호박'].map(n => `${n}:${재료그림(n) ? 'ig' : (찾(n)?.svg ? 'svg' : '?')}`).join(' · '))
// ⛔⛔ 한 글자 함정 — 「김치」에 「김」 그림이 붙으면 안 된다(CLAUDE.md 핀)
const 김치 = 찾('김치')
재('③ 「김치」에 «김» 그림이 안 붙나', !!김치 && !/ig_s8_11/.test(김치.그림 || ''),
  김치 ? `김치 → ${(김치.그림 || 'svg').split('/').pop()}` : '김치 줄을 못 찾음')
// ⭐ 한 글자 이름 자체는 걸려야 한다
재('④ 한 글자 「무」는 제대로 걸리나', 재료그림('무'), 찾('무') ? `무 → ${(찾('무').그림 || 'svg').split('/').pop()}` : '못 찾음')
// ⛔ 회귀 — 요리 사진이 재료에 붙으면 안 된다(2026-08-12 아침 애호박 사고)
재('⑤ 재료에 «요리 사진»이 안 붙나', 줄.length > 0 && !줄.some(x => /\/(fe|fh|fy|fj|fi|fb)_/.test(x.그림 || '')),
  줄.filter(x => /\/(fe|fh|fy|fj|fi|fb)_/.test(x.그림 || '')).map(x => x.글).join(',') || '요리 사진 0')

console.log('\n' + '─'.repeat(50))
const 통과 = 결과.filter(r => r[0]).length
console.log(`통과 ${통과} / ${결과.length}`)
await b.close(); srv.kill(); process.exit(통과 === 결과.length ? 0 : 1)
