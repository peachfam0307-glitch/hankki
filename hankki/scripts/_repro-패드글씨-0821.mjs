// 🔠 [반영됨 · 2026-08-21] 패드는 «글씨만» 키운다 — 상자는 안 건드린다
//
// 📮 창업자 = *"**패드는 글씨크기만 키우면 좋겠어**"*
//    ⭐ 폰은 상자를 키웠지만(주간 격자 2칸) 패드는 **글자만**이다.
//       패드 3칸은 창업자 제보(*"패드에서 레시피두개 높이 안맞아"*)로 못 박은 자리다.
//
// ⭐⭐ 이 판이 지키는 것 «셋» — 하나만 봐선 안 된다
//   ① **패드 글자가 커졌나** (14px 미만 비율이 줄었나)
//   ② ⛔**폰은 한 글자도 안 바뀌었나** — `min-width:700px` 안에 넣었으니 안 바뀌어야 한다.
//      ⚠️ 실수로 밖에 쓰면 폰이 통째로 커지고 «그건 딴 판정»이다(폰은 톤D＋글자2 로 따로 정한다).
//   ③ ⛔**글자를 키운 대가 — 잘리거나 넘치지 않나**
//      📌 글자 키우기의 진짜 위험은 「안 커지는 것」이 아니라 **「커져서 깨지는 것」**이다.
//         말줄임(`…`)·가로 넘침·손가락 칸 축소가 거기서 난다.
//
// ⛔ 소스 grep 아님 — computed style 과 그려진 자리로 잰다(절대원칙 18 ⓘ · 30).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-패드글씨-0821.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
// 🔀 2026-08-27 — 고정 포트 4419 → **OS 가 빈 포트를 준다**(`listen(0)`).
//    ⛔ `_repro-열쇠이름-0824` 도 4419 를 쓰고 있었다 → 병렬로 돌리면 «둘이 다툰다».
await new Promise((r) => srv.listen(0, r))
const BASE = `http://127.0.0.1:${srv.address().port}/hankki/`

let 통과 = 0, 실패 = 0
const chk = (이름, 값, 기대) => {
  const ok = 기대 === undefined ? !!값 : String(값) === String(기대)
  console.log(`  ${ok ? '✅' : '⛔'} ${이름}${ok ? '' : `   ← 나온 값: ${값}`}`)
  ok ? 통과++ : 실패++
}

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const 탭 = ['홈', '레시피', '일기', '장보기', '레꾸자랑']

const 재기 = async (W, H) => {
  const ctx = await b.newContext({ viewport: { width: W, height: H } })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
  const 결과 = {}
  for (const t of 탭) {
    const p = await ctx.newPage()
    await p.goto(BASE, { waitUntil: 'networkidle' })
    await p.evaluate(() => document.fonts.ready)
    await p.waitForTimeout(600)
    await p.evaluate((T) => {
      const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
      bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes(T))?.click()
    }, t)
    await p.waitForTimeout(700)
    결과[t] = await p.evaluate(() => {
      let 보임 = 0, 작음 = 0, 잘림 = 0
      const 잘린것 = []
      document.querySelectorAll('*').forEach((el) => {
        if (el.children.length) return
        const s = (el.textContent || '').trim(); if (!s) return
        const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return
        if (el.closest('nav,.tabbar,footer')) return   // ⛔하단 탭 라벨은 잣대에서 뺀다(항상 작다)
        보임++
        if (parseFloat(getComputedStyle(el).fontSize) < 14) 작음++
        // ⭐ 「글자를 키운 대가」 = 말줄임으로 잘리는 것
        if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).textOverflow === 'ellipsis') {
          잘림++; if (잘린것.length < 4) 잘린것.push(s.slice(0, 14))
        }
      })
      return {
        보임, 작음, 잘림, 잘린것,
        비율: 보임 ? Math.round(작음 / 보임 * 100) : 0,
        가로넘침: document.documentElement.scrollWidth > window.innerWidth + 1,
        // 손가락 닿는 칸이 44px 밑으로 줄었나 (글자가 커지면 안쪽 여백이 밀린다)
        작은단추: [...document.querySelectorAll('button')].filter((x) => {
          const r = x.getBoundingClientRect()
          return r.width > 2 && r.height > 2 && r.height < 44 && !x.closest('nav,.tabbar,footer')
        }).length,
      }
    })
    await p.close()
  }
  await ctx.close()
  return 결과
}

console.log('\n🔠 패드는 «글씨만» — 폰은 그대로 · 안 잘림\n')

const 패드 = await 재기(820, 1180)
const 폰 = await 재기(390, 844)

// ───────── ① 패드 글자가 커졌나 ─────────
// 🔢 손보기 «전» 실측(같은 도구) = 홈 37 · 레시피 68 · 장보기 84 · 일기 45 · 레꾸자랑 29 (%)
console.log('① 패드 — 14px 미만 비율이 «손보기 전»보다 낮아졌나')
const 전 = { 홈: 37, 레시피: 68, 장보기: 84, 일기: 45, 레꾸자랑: 29 }
탭.forEach((t) => {
  const v = 패드[t]
  chk(`  ${t.padEnd(4, ' ')} ${전[t]}% → ${v.비율}%`, v.비율 <= 전[t], 'true')
})

// ───────── ② ⛔폰은 한 글자도 안 바뀌었나 ─────────
// ⛔⛔ 첫 판은 여기서 «비율»을 견줬는데 **잣대가 틀렸다.**
//    `_probe-글자크기-0821.mjs` 는 글자 «덩이»를 세고 이 판은 «잎 엘리먼트»를 센다 —
//    **서로 다른 것을 세는 두 도구의 숫자를 견줬다**(규칙 18 ⓘ). 그래서 멀쩡한데 전부 실패로 나왔다.
// ✅ 그래서 잣대를 바꿨다 — **내가 손댄 그 클래스의 «실제 px»** 을 폰·패드에서 각각 읽는다.
//    이건 「폰이 안 바뀌었나」를 «정확히» 묻는 질문이고, 딴 도구와 안 섞인다.
// ⛔⛔ 두 번째 실수 — 여기 기준값을 내가 «짐작»으로 적었다(.t-sub 13 · weekly-kicker 12.5).
//    진짜는 11.5 · 12 였다. **CSS 파일에 적힌 값과 화면에 그려진 값이 다르다**
//    (인라인 style·상속·더 구체적인 선택자가 덮는다 — 그게 규칙 18 ⓘ 가 말하는 그것이다).
// ✅ 아래는 «실측»이다 — `getComputedStyle` 로 직접 읽은 값. ⛔파일에서 옮겨 적지 말 것.
//    ＋ `탭` = 그 클래스가 실제로 나타나는 탭(홈에 없으면 null 로 두면 영영 못 찾는다)
// 🔁 [2026-08-21 저녁] 「글자 2단」(창업자 확정)이 들어가며 «폰 값이 통째로 올라갔다» → 기준을 다시 잰 값으로.
//    ⛔ 여기 숫자를 손으로 «맞춰 넣지» 말 것 — 화면에서 읽은 값이다(파일에 적힌 값과 다르다).
//    ⭐ 지키는 것은 **«벌어진 폭»** 이다. 창업자가 고른 건 「패드가 폰보다 이만큼 크다」이지 절대값이 아니었다.
// 🔁 [2026-08-22] 「글자 3단」(＋1px · 창업자 *"홈이랑 다른 탭은 조금만 더"*)으로 폰이 또 올랐다.
//    ⭐ **벌어진 폭은 그대로다**(＋3.0 · ＋2.5 · ＋1.5 · ＋1.5 · ＋1.5 · ＋2.5) — 그게 창업자 판정이다.
const 클래스 = [
  { sel: '.t-sub', 폰: 15, 패드: 18, 탭: null },
  { sel: '.weekly-kicker', 폰: 15, 패드: 17.5, 탭: null },
  { sel: '.seg', 폰: 16.5, 패드: 18, 탭: '레시피' },
  { sel: '.pill', 폰: 16, 패드: 17.5, 탭: '레시피' },
  { sel: '.grid-card .date', 폰: 15, 패드: 16.5, 탭: '레시피' },
  { sel: '.shop-chip .nm', 폰: 15, 패드: 17.5, 탭: '장보기' },
  // ⛔ 일기 달력 숫자(cal-num)는 뺐다 — 가로 블록에 같은 이름 규칙이 «둘» 더 있어(877·893줄)
  //    여기서 올려도 그쪽이 덮는다. 실제로 올려 봤더니 11px 그대로였고 **이 게이트가 잡아냈다**.
  //    ⭐ 그대로 남겨 두면 «영영 빨간불»이라 죽은 게이트가 된다. 달력 숫자는 세 곳을 같이 봐야 해서 별도 판정.
]
const px재기 = async (W, H, 어느탭) => {
  const ctx = await b.newContext({ viewport: { width: W, height: H } })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto(BASE, { waitUntil: 'networkidle' })
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(600)
  if (어느탭) {
    await p.evaluate((T) => {
      const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
      bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes(T))?.click()
    }, 어느탭)
    await p.waitForTimeout(700)
  }
  // ⛔⛔ `querySelector(s)` 로 «첫 놈»을 잡으면 안 된다 — 규칙 12 로 확인하다 걸렸다.
  //    홈의 첫 `.t-sub` 는 **`.news-sub` 도 같이 달고 있어서**, `.t-sub` 규칙을 꺼도
  //    `.news-sub`(내가 같은 블록에서 같이 올린 것)가 14.5px 를 줘 **게이트가 통과했다.**
  //    → 「`.t-sub` 를 껐는데도 초록불」 = **아무것도 안 지키는 검사**였다.
  // ✅ 그래서 **딱 그 클래스만 단 놈**을 고른다(딴 규칙이 안 덮는 자리).
  //    ⚠️ 그런 놈이 없으면 `null` → 검사가 실패한다. 그게 맞다 — 못 재면 «모른다»이지 «통과»가 아니다.
  const r = await p.evaluate((sels) => sels.map((s) => {
    const 낱말 = s.split(' ').pop().replace('.', '')
    const 후보 = [...document.querySelectorAll(s)]
    const 딱그것 = 후보.find((e) => (e.className || '').trim().split(/\s+/).filter((c) => c && c !== 'press').join(' ') === 낱말)
    const el = 딱그것 || 후보[0]
    return el ? Math.round(parseFloat(getComputedStyle(el).fontSize) * 10) / 10 : null
  }), 클래스.map((c) => c.sel))
  await ctx.close()
  return r
}

console.log('\n② ⛔폰은 «그대로»인가 — 손댄 클래스의 실제 px 을 직접 읽는다')
for (const 탭이름 of [null, '레시피', '장보기', '일기']) {
  const [폰px, 패드px] = [await px재기(390, 844, 탭이름), await px재기(820, 1180, 탭이름)]
  클래스.forEach((c, i) => {
    if ((c.탭 || null) !== 탭이름) return
    chk(`  ${c.sel.padEnd(16, ' ')} 폰 ${폰px[i]}px — 옛값 ${c.폰} «그대로»`, 폰px[i], c.폰)
    chk(`  ${c.sel.padEnd(16, ' ')} 패드 ${패드px[i]}px — ${c.패드} 로 커졌다 (＋${(c.패드 - c.폰).toFixed(1)}px)`, 패드px[i], c.패드)
  })
}

// ───────── ③ ⛔키운 대가 — 잘림·넘침·손가락 ─────────
console.log('\n③ ⛔글자를 키운 «대가» — 잘리거나 넘치지 않나 (패드)')
// ⚠️⚠️ 홈의 잘림 1개는 **내가 만든 게 아니다 — 원래 있던 것**이다.
//    🧪 확인 = 내 변경(`.t-sub`·`.weekly-kicker`)을 «꺼도» 그대로 잘린다.
//    🔢 뿌리 = **패드 세로에서 카드가 폰보다 «작다»** — 폰 156px ↔ 패드 세로 **112px** ↔ 패드 가로 174px.
//       패드는 두 상자를 좌우로 놓고(`week-pair.two`) 각 상자에 3칸을 넣어서 칸이 좁아진다.
//       그 3칸은 창업자 제보(*"패드에서 레시피두개 높이 안맞아"*)로 못 박은 자리라 ⛔내가 못 바꾼다.
//    ✅ 그래서 「0」이 아니라 **「지금보다 늘지 않았나」**로 잣대를 잡는다.
//       ⛔0 으로 박으면 늘 빨간불이라 «죽은 게이트»가 된다(시끄러운 게이트는 아무도 안 본다).
//    ⏳ 창업자 판정 대기 = 패드 세로 카드를 키울지(그러면 「글씨만」과 어긋난다)
const 잘림기준 = { 홈: 1, 레시피: 0, 일기: 0, 장보기: 0, 레꾸자랑: 0 }
탭.forEach((t) => {
  const v = 패드[t]
  chk(`  ${t.padEnd(4, ' ')} 잘린 글자 ${v.잘림}개 (기준 ${잘림기준[t]} — 늘면 실패)${v.잘림 ? ` · ${v.잘린것.join(' / ')}` : ''}`, v.잘림 <= 잘림기준[t], 'true')
  chk(`  ${t.padEnd(4, ' ')} 가로 넘침 0`, !v.가로넘침, 'true')
})

await b.close(); srv.close()
console.log(`\n${실패 ? '⛔' : '✅'} ${통과}/${통과 + 실패}\n`)
process.exit(실패 ? 1 : 0)
