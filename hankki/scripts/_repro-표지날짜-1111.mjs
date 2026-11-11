// 🎄 [2026-11-11] 스키야키 표지가 «12/1 부터» 보이나 — 이미 깔린 폰(표지 없이 저장됨) · 새로 깐 폰 · 날짜 전/후
//    창업자 「12월 1일부터 보이게 하자」 · 장치 = basics.js 꾸밈거르기 ＋ store.jsx 꾸밈열기
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const { allBasicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { COACH } = await import('../src/coach.js')
const PORT = 4339
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
process.on('exit', () => { try { srv.kill() } catch {} })
await new Promise((r) => setTimeout(r, 900))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
let 죽음 = 0
const 재다 = (n, ok) => { console.log(`${ok ? '✅' : '⛔'} ${n}`); if (!ok) 죽음++ }
// 이미 깐 폰 = 11/11 에 저장된 상태(오늘 node 기준 → 스키야키 표지 없음)
const 옛폰 = allBasicRecipes.filter((r) => !r.from || r.from <= '2026-11-11').map((r, i) => ({ ...r, status: 'sorted', savedAt: Date.now() - i * 60000 }))
재다('11/11 저장본엔 스키야키 표지가 없다(씨앗이 빼고 내준다)', !옛폰.find((r) => r.id === 'basic-sukiyaki')?.decor)
async function 열어보기(날, 상태) {
  const now = Date.parse(날 + 'T12:00:00+09:00')
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.clock.setFixedTime(new Date(now))
  const p = await ctx.newPage(); const url = `http://127.0.0.1:${PORT}/`
  await p.goto(url)
  await p.evaluate(({ s, keys }) => {
    if (s) localStorage.setItem('hankki:v1', JSON.stringify(s))
    localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); localStorage.setItem('hankki:cloudgate', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
    keys.forEach((k) => localStorage.setItem(k, '1'))
  }, { s: 상태, keys: Object.values(COACH) })
  await p.goto(url); await p.waitForTimeout(2500)
  const 저장 = await p.evaluate(() => { const r = JSON.parse(localStorage.getItem('hankki:v1') || '{}').recipes?.find((x) => x.id === 'basic-sukiyaki'); return r ? { 조각: r.decor?.length || 0, 샘플: !!r.sample, 배경: r.decorBg || '' } : null })
  await ctx.close(); return 저장
}
const 옛상태 = { recipes: 옛폰, seedV: BASICS_VERSION }
const a = await 열어보기('2026-11-30', 옛상태); 재다('이미 깐 폰 11/30 = 표지 없음 ' + JSON.stringify(a), a && a.조각 === 0 && !a.샘플)
const c = await 열어보기('2026-12-01', 옛상태); 재다('이미 깐 폰 12/1 = 표지 6조각·샘플 ' + JSON.stringify(c), c && c.조각 === 6 && c.샘플 && c.배경 === 'xmaseuca')
const d = await 열어보기('2026-11-30', null); 재다('새로 깐 폰 11/30 = 표지 없음 ' + JSON.stringify(d), d && d.조각 === 0)
const e = await 열어보기('2026-12-02', null); 재다('새로 깐 폰 12/2 = 표지 6조각 ' + JSON.stringify(e), e && e.조각 === 6)
// 유저가 11월에 직접 꾸민 편은 12/1 에도 안 덮는다
const 꾸민폰 = { recipes: 옛폰.map((r) => r.id === 'basic-sukiyaki' ? { ...r, decor: [{ id: 'u1', type: 'sticker', key: 'xd14', x: 0.5, y: 0.5, s: 0.2, r: 0 }], decorBg: 'cream' } : r), seedV: BASICS_VERSION }
const f = await 열어보기('2026-12-01', 꾸민폰); 재다('유저가 꾸민 편은 12/1 에도 그대로(1조각) ' + JSON.stringify(f), f && f.조각 === 1 && f.배경 === 'cream')
await b.close(); srv.kill()
console.log(죽음 ? `\n⛔ ${죽음}칸` : '\n✅ 표지 날짜 — 전부 통과'); process.exit(죽음 ? 1 : 0)
