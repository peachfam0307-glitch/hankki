// ⏱⏱ 사진 2장 AI 스캔 — **실제 앱에서 시간이 어디로 가나**를 잰다 (창업자 제보 2026-08-16)
//   📮 *"어제 레시피 2장 안내시 로딩 오래걸리는거"* (＝가져오기 → 사진 2장 → AI 스캔)
//   돌리기 = node hankki/scripts/_measure-스캔시간-0816.mjs
//
// ⭐⭐ 두 길을 «따로» 잰다 — 창업자가 겪은 게 어느 길인지 알아야 고칠 데가 정해진다.
//   ⒜ AI 스캔(프록시)이 될 때  = 서버가 1.5초 걸린다고 «흉내»내서 잰다
//   ⒝ AI 스캔이 안 될 때(무료 소진·오프라인) = 프록시를 막아 **폰에서 도는 기본 인식**으로 간다
//
// ⛔ 진짜 서버를 부르지 않는다 — 창업자 무료 장수를 깎으면 안 된다.
// ⛔⛔ **단추 이름을 짐작하지 않는다** — 첫 판에서 「이대로/확인」으로 짐작했다가 하나도 안 맞아
//    180초 타임아웃만 쌓고 5분을 버렸다(규칙 18). 실제 이름 = **「이 부분만 읽기」**.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = '/home/user/hankki/hankki/dist'
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.traineddata': 'application/octet-stream', '.gz': 'application/gzip' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = M[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4436, r))
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')

const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms))

// 레시피 캡처 흉내 두 장 — 브라우저 안에서 만들어 파일 고르기에 그대로 얹는다
const 사진만들기 = `(() => {
  const 뽑기 = (제목, 줄들) => {
    const c = document.createElement('canvas'); c.width = 1080; c.height = 2400
    const x = c.getContext('2d')
    x.fillStyle = '#fff'; x.fillRect(0, 0, 1080, 2400)
    const g = x.createLinearGradient(0, 0, 1080, 700)
    g.addColorStop(0, '#c8a27a'); g.addColorStop(1, '#6d8f6a')
    x.fillStyle = g; x.fillRect(0, 0, 1080, 700)
    x.fillStyle = '#1a1a1a'; x.font = 'bold 54px sans-serif'; x.fillText(제목, 40, 800)
    x.font = '38px sans-serif'
    let y = 900
    for (const l of 줄들) { x.fillText(l, 40, y); y += 62 }
    return c.toDataURL('image/jpeg', 0.92)
  }
  return [
    뽑기('황태장아찌', ['재료', '황태채 360g', '고추장 2컵', '고춧가루 1/2컵', '양조간장 1/2컵', '설탕 1/2컵', '매실청 1컵', '올리고당 1컵', '다진마늘 3스푼']),
    뽑기('만드는 법', ['1 황태채에 맛술을 부어 섞어두고', '2 웍에 양념을 모두 넣고 끓여주세요', '3 양념이 뜨거울때 황태채를 넣어', '4 깨소금 3스푼으로 마무리해주면 완성']),
  ]
})()`

const 재기 = async ({ 이름, 프록시 }) => {
  const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
  const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul' })
  await ctx.addInitScript(() => {
    localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
    localStorage.setItem('hankki:giftSheetSeen', '1')
  })
  await ctx.addInitScript({ content: SEED_COACH_SEEN })
  const pg = await ctx.newPage()
  pg.setDefaultTimeout(45000) // ⛔ 180초로 두면 «못 찾았을 때» 스크립트가 멈춘 것처럼 보인다
  // ⛔ 화면이 조용히 터지면 「글자가 사라졌다」로만 보인다 — 오류를 반드시 받아 둔다(규칙 18)
  const 오류 = []
  pg.on('pageerror', (e) => 오류.push(String(e)))
  pg.on('console', (m) => { if (m.type() === 'error') 오류.push('console: ' + m.text()) })

  // 프록시 흉내 — 'ok' 면 1.5초 뒤 글자를 준다 / 'off' 면 아예 막는다(＝무료 소진·오프라인)
  //   ⭐⭐ **장마다 다른 글자**를 준다. 그래야 「고른 순서대로 붙었나」를 잴 수 있다 —
  //      자르기와 읽기를 떼어놓으면 **끝나는 순서가 뒤바뀔 수 있는** 게 이번 고침의 유일한 위험이다.
  //   ⚠️ 1장째를 «더 느리게» 준다 — 뒤바뀔 수 있으면 여기서 뒤바뀐다(제일 불리한 조건).
  let 몇번째 = 0
  // ⛔⛔ 주소를 «짐작»하지 말 것 — 첫 판은 `**/ocr**` 로 걸었는데 진짜 주소는
  //    `https://hankki-ocr.annyeong-hankki.workers.dev` 라 **경로에 /ocr 이 없다** → 한 번도 안 걸렸다.
  //    그래서 ⒜(AI 스캔)도 사실은 «기본 인식»을 재고 있었다. ⒜와 ⒝가 똑같이 나온 게 그 증거였다.
  await pg.route('**hankki-ocr**', async (r) => {
    if (프록시 === 'off') return r.abort()
    const n = 몇번째++
    await 잠깐(n === 0 ? 2200 : 900)
    await r.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({
        text: n === 0 ? '재료\n첫째장재료 360g\n고추장 2컵' : '만드는 법\n1 둘째장순서를 넣고 볶아주세요',
        left: { welcome: 9, month: 5 },
      }) })
  })

  const 닫기 = async () => {
    for (const n of ['나중에']) {
      const x = pg.getByRole('button', { name: n }).first()
      if (await x.count() && await x.isVisible().catch(() => false)) { await x.click().catch(() => {}); await 잠깐(180) }
    }
    const s = pg.locator('.sheet').getByRole('button', { name: '닫기' }).first()
    if (await s.count() && await s.isVisible().catch(() => false)) { await s.click().catch(() => {}); await 잠깐(180) }
  }

  await pg.goto('http://127.0.0.1:4436/hankki/', { waitUntil: 'networkidle' })
  await 잠깐(800); await 닫기()
  await pg.locator('nav.bottom-nav .nav-item-import').click()
  await 잠깐(700); await 닫기()
  await pg.getByRole('button', { name: /사진 · 직접 작성하기|직접 작성/ }).first().click()
  await 잠깐(700); await 닫기()

  const urls = await pg.evaluate(사진만들기)
  const 파일 = urls.map((u, i) => ({ name: `recipe-${i + 1}.jpg`, mimeType: 'image/jpeg', buffer: Buffer.from(u.split(',')[1], 'base64') }))

  const 마디 = []
  let 시작 = 0
  let 칸안내 = false // 자르는 동안 「읽는 중」 안내가 보였나
  const 찍기 = (무엇) => 마디.push([무엇, ((Date.now() - 시작) / 1000).toFixed(1) + 's'])

  const [chooser] = await Promise.all([
    pg.waitForEvent('filechooser'),
    pg.getByRole('button', { name: /캡처 사진으로 재료·만드는 법 채우기/ }).first().click(),
  ])
  시작 = Date.now()
  await chooser.setFiles(파일)
  const 자르기 = pg.getByRole('button', { name: '이 부분만 읽기' }).first()
  const 읽는중 = pg.getByText('사진에서 글자 읽는 중', { exact: false }).first()

  await 자르기.waitFor({ state: 'visible' }); 찍기('1장째 자르기 화면이 뜸')
  await 자르기.click(); 찍기('1장째 「이 부분만 읽기」 누름')
  await 읽는중.waitFor({ state: 'visible' }).catch(() => {}); 찍기('1장째 읽기 시작')
  // ⭐⭐ 여기가 핵심 — 2장째 «자르기»가 언제 뜨나.
  //    옛 판 = 1장째 읽기가 **다 끝나야** 떴다(줄서기) · 새 판 = **바로** 뜬다(자르기와 읽기를 뗐다)
  await 자르기.waitFor({ state: 'visible' }); 찍기('⭐ 2장째 자르기가 뜸')
  // 📸 창업자 *"사진2장스캔은 기다리다 끌 수 있으니 스캔중이다라는 안내가 필요해."*
  //    ⭐ 자르는 «동안» 앞 장이 읽히니 그게 이 화면 «위»에 보여야 한다. 안 보이면 없는 것과 같다.
  await 잠깐(500)
  const 읽는중안내 = await pg.locator('text=읽는 중이에요').first().isVisible().catch(() => false)
  칸안내 = 읽는중안내
  await pg.screenshot({ path: `/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/자르는중-읽는중-${프록시}.png` })
  // 🧍 사람이 자르는 시간 — 실제로는 3~10초다. 여기선 4초로 잡는다.
  //    ⭐ 새 판에선 **이 4초 동안 1장째가 읽힌다** = 기다림이 사라지는 자리.
  await 잠깐(4000); 찍기('   (사람이 4초 동안 잘랐다고 치고)')
  await 자르기.click(); 찍기('2장째 「이 부분만 읽기」 누름')
  // ⛔⛔ 첫 판은 여기서 바로 `hidden` 을 기다렸다 → **로딩이 «뜨기 전»이라 그 자리에서 통과**해서
  //    「2장이 1.6초 만에 끝났다」는 **가짜 숫자**가 나왔다. 반드시 «떴다»를 먼저 본다(규칙 18).
  await 읽는중.waitFor({ state: 'visible' }); 찍기('2장째 읽기 시작')
  await 읽는중.waitFor({ state: 'hidden' }); 찍기('⭐⭐ 다 끝남')
  const 총 = (Date.now() - 시작) / 1000
  await 잠깐(600)

  console.log(`\n━━ ${이름} ━━`)
  for (const [무엇, 때] of 마디) console.log(`   ${때.padStart(7)}  ${무엇}`)

  console.log(`   ${칸안내 ? '✅' : '⛔'} 자르는 동안 「읽는 중이에요」 안내가 보인다`)
  if (!칸안내) 실패 += 1

  // 🔎 회귀 감시 — 자르기와 읽기를 떼어놓았으니 «순서가 뒤바뀌지 않았나»를 본다
  let 탈 = ''
  if (프록시 === 'ok') {
    // ⚠️ 칸 번호를 짐작하지 않는다 — 화면의 «모든» 글상자를 위에서부터 이어 붙여 본다
    const 다 = (await pg.locator('textarea').allTextContents().catch(() => []))
      .concat(await pg.locator('textarea').evaluateAll((els) => els.map((e) => e.value)).catch(() => []))
      .join('\n')
    if (!다.includes('첫째장재료')) 탈 = '⛔ 1장째 글자가 사라졌다'
    else if (!다.includes('둘째장순서')) 탈 = '⛔ 2장째 글자가 사라졌다'
    else if (다.indexOf('첫째장재료') > 다.indexOf('둘째장순서')) 탈 = '⛔ 순서가 뒤바뀌었다(2장째가 먼저 붙음)'
    console.log(`   ${탈 || '✅ 고른 순서대로 붙었다 (1장째 → 2장째)'}`)
    // ⛔ 실패했으면 «왜»를 같이 낸다 — 「글자가 사라졌다」만 보면 원인을 또 찾아 헤맨다
    if (탈) {
      실패 += 1
      console.log('   [칸 속 글자] ' + JSON.stringify(다).slice(0, 300))
      if (오류.length) console.log('   [화면 오류] ' + 오류.slice(0, 3).join(' | ').slice(0, 400))
    }
  }
  await b.close()
  return 총
}

let 실패 = 0

try {
  const a = await 재기({ 이름: '⒜ AI 스캔 됨 (서버가 1.5초/장 걸린다고 가정)', 프록시: 'ok' })
  const c = await 재기({ 이름: '⒝ AI 스캔 안 됨 → 폰에서 도는 기본 인식', 프록시: 'off' })
  console.log(`\n📊 사진 2장 총 시간(사람이 자르는 4초 포함) — AI 스캔 ${a.toFixed(1)}초 · 기본 인식 ${c.toFixed(1)}초`)
  console.log('   ⭐ 봐야 할 줄 = **「2장째 자르기가 뜸」이 몇 초인가**.')
  console.log('      옛 판은 1장째를 «다 읽어야» 떴고(＝막대만 보는 시간), 새 판은 0.3초 만에 뜬다.')
  console.log('   ⚠️ 이 컨테이너에선 기본 인식(tesseract)이 글씨 파일을 못 받아 «빨리 실패»한다 —')
  console.log('      ⒝ 의 초는 «기본 인식이 실제로 도는 시간»이 아니다. 폰에서는 훨씬 길다.\n')
  console.log(실패 ? `⛔ ${실패}칸 실패` : '✅ 회귀 없음')
} finally {
  srv.close()
}
process.exit(실패 ? 1 : 0)
