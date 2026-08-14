// 🗂 서랍 그룹 접기 — 접히나 · 기억하나 · 스티커가 «몇 칸 더» 보이나
//    📮 창업자 2026-08-12 *"접기기능이라도 있으면 잘보이겠구만.. 스티커가너무 안보여"*
//    ⭐ 판정 기준 = 「접었다」가 아니라 **「온전히 보이는 칸이 늘었나」**. 그게 창업자가 겪는 것이다.
//    ⛔ `page.reload()` 금지(옛 함정 사전) — 다시 켜기는 «새 탭»으로.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const M = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=M[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4406,r))
let bad=0; const ok=(m)=>console.log('   ✅',m); const no=(m)=>{bad++;console.log('   ⛔',m)}
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport:{width:411,height:891}, deviceScaleFactor:3 })
await ctx.addInitScript(()=>{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');localStorage.setItem('hankki:giftSheetSeen','1')})
await ctx.addInitScript({content:SEED_COACH_SEEN})
const 열기 = async (pg) => {
  const 닫기=async()=>{for(const t of ['나중에','닫기']){const x=pg.getByRole('button',{name:t}).first();if(await x.count()&&await x.isVisible().catch(()=>false)){await x.click().catch(()=>{});await pg.waitForTimeout(200)}}}
  await pg.goto('http://127.0.0.1:4406/hankki/',{waitUntil:'networkidle'}); await pg.waitForTimeout(1000)
  await pg.getByRole('button',{name:/일기/}).last().click();await pg.waitForTimeout(600);await 닫기()
  await pg.getByRole('button',{name:/오늘 일기/}).first().click();await pg.waitForTimeout(700);await 닫기()
  await pg.getByRole('button',{name:/꾸미기/}).first().click();await pg.waitForTimeout(900);await 닫기()
  for (const t of ['일꾸','기록']) { const x=pg.getByRole('button',{name:t,exact:true}).first(); if(await x.count()){await x.click();await pg.waitForTimeout(450)} }
}
// 📏 온전히 보이는 칸 = 굴칸 «안»에 위아래가 다 들어온 칸
const 잰다 = (pg) => pg.evaluate(() => {
  const sc = document.querySelector('.decor-scroll'); const p = sc.getBoundingClientRect()
  const 칸 = [...sc.querySelectorAll('.decor-cell')]
  return { 담긴것: sc.scrollHeight, 굴칸: sc.clientHeight,
    보임: 칸.filter((c)=>{const r=c.getBoundingClientRect();return r.top>=p.top-1&&r.bottom<=p.bottom+1}).length,
    이름표: [...sc.querySelectorAll('.decor-sec-label')].map((e)=>({t:(e.textContent||'').trim(), h:Math.round(e.getBoundingClientRect().height)})) }
})
const pg = await ctx.newPage()
await 열기(pg)
console.log('\n① 접기 전')
const 전 = await 잰다(pg)
console.log('   담긴 것', 전.담긴것, 'px · 굴칸', 전.굴칸, `(${(전.담긴것/전.굴칸).toFixed(1)}화면) · 온전히 보이는 칸 ${전.보임}개`)
전.이름표.length ? ok(`그룹 이름표 ${전.이름표.length}개 · 높이 ${전.이름표[0].h}px`) : no('이름표가 단추가 아니다 — 접을 데가 없다')
await pg.screenshot({ path: join(OUT,'서랍접기-전.png'), clip: await pg.locator('.decor-drawer').first().boundingBox() })

console.log('\n② 그룹 이름을 눌러 접는다')
const 라벨 = pg.locator('.decor-sec-label')
const 개수 = await 라벨.count()
// ⭐ 현실은 「안 쓰는 몇 개를 접는다」다 — 셋을 접는다. ＋아래에서 «전부 접기»도 따로 잰다.
for (let i = 0; i < Math.min(개수, 3); i++) { await 라벨.nth(i).click(); await pg.waitForTimeout(120) }
// ⚠️ 접으면 굴림 자리가 그대로 남아 «엉뚱한 데»를 재게 된다 — 맨 위로 올리고 잰다(유저도 그렇게 본다)
await pg.evaluate(() => { document.querySelector('.decor-scroll').scrollTop = 0 })
await pg.waitForTimeout(400)
const 후 = await 잰다(pg)
console.log('   담긴 것', 후.담긴것, 'px · 온전히 보이는 칸', 후.보임, '개')
후.담긴것 < 전.담긴것 ? ok(`담긴 양 ${전.담긴것} → ${후.담긴것}px (${Math.round((1-후.담긴것/전.담긴것)*100)}% 줄었다)`) : no('접어도 안 줄었다')
후.보임 >= 전.보임 ? ok(`온전히 보이는 칸 ${전.보임} → ${후.보임}개`) : no(`오히려 줄었다: ${전.보임} → ${후.보임}`)
await pg.screenshot({ path: join(OUT,'서랍접기-후.png'), clip: await pg.locator('.decor-drawer').first().boundingBox() })

console.log('\n②-2 «전부» 접어도 스티커 자리가 남나 (재현판이 잡았던 것 — 이름표가 굴칸을 다 먹었다)')
for (let i = 3; i < 개수; i++) { await 라벨.nth(i).click(); await pg.waitForTimeout(100) }
await pg.waitForTimeout(400)
const 전부 = await 잰다(pg)
const 표합 = 전부.이름표.reduce((s,x)=>s+x.h,0)
console.log('   이름표', 전부.이름표.length, '줄 합', 표합, 'px · 굴칸', 전부.굴칸)
표합 < 전부.굴칸 ? ok('다 접어도 이름표가 굴칸을 안 먹는다') : no(`이름표 ${표합}px 가 굴칸 ${전부.굴칸}px 을 덮는다 — 한 칸도 안 보인다`)
for (let i = 3; i < 개수; i++) { await 라벨.nth(i).click(); await pg.waitForTimeout(100) }
await pg.waitForTimeout(300)

console.log('\n③ 접은 걸 «기억»하나 (앱 껐다 켜기 = 새 탭)')
const 저장 = await pg.evaluate(()=>localStorage.getItem('hankki:decor:folded'))
저장 && JSON.parse(저장).length ? ok(`저장됨 — ${JSON.parse(저장).length}개`) : no('접은 게 저장 안 됨')
const pg2 = await ctx.newPage(); await 열기(pg2)
const 다시 = await 잰다(pg2)
Math.abs(다시.담긴것 - 후.담긴것) < 40 ? ok(`다시 켜도 접힌 채 — ${다시.담긴것}px`) : no(`다시 켜니 펼쳐짐: ${다시.담긴것}px (접었을 땐 ${후.담긴것})`)

console.log('\n④ 다시 누르면 펼쳐지나 (되돌릴 수 있나)')
await pg2.locator('.decor-sec-label').first().click(); await pg2.waitForTimeout(400)
const 펼침 = await 잰다(pg2)
펼침.담긴것 > 다시.담긴것 ? ok(`펼쳐진다 — ${다시.담긴것} → ${펼침.담긴것}px`) : no('다시 눌러도 안 펼쳐진다')

console.log(`\n📊 ${bad ? `⛔ ${bad}건 어긋남` : '✅ 서랍 접기 통과'}`)
await b.close(); srv.close(); process.exit(bad?1:0)
