// 🔎🔎 **패드 가로 전수** — 창업자 2026-08-09 밤 *"하나하나 눌러서 재현하고, 완벽하게 수정해서 알려줘(절대원칙이야)"*
//
// ⭐ 앞선 `_repro-패드가로-0809` 는 창업자가 «말한 네 곳»만 봤다. 이건 **화면을 하나하나 눌러** 전부 본다.
//    가로에선 앱이 화면 폭을 다 쓰기 때문에(창업자 확정 「안 D」) 어느 화면에서든 같은 병이 날 수 있다.
// ⛔ v10.16 교훈 — 「부분 재현 → 배포」를 다섯 번 되풀이해서 창업자가 *"계속 똑같은거 고치고 있잖아"* 라고 했다.
//    **한 번에 다 재고 나서 올린다.**
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise(r => srv.listen(4423, r))
const { BASICS_VERSION } = await import(R + 'src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
let 나쁨 = 0
const 봄 = (좋나, 줄) => { if (!좋나) 나쁨++; console.log(`      ${좋나 ? '✅' : '⛔'} ${줄}`) }

// 📏 화면마다 «같은 잣대»로 잰다 — 걸음마다 다른 걸 보면 어디가 새는지 못 찾는다.
const 재기 = () => {
  const de = document.documentElement
  // ⛔⛔ **첫 판이 `document.body.innerText` 를 봤다가 어느 걸음이든 «홈 글자»가 나왔다.**
  //    화면이 스택으로 겹쳐 있어 body 전체를 읽으면 «맨 아래» 것이 먼저 나온다.
  //    📌 규칙 18 — 「무엇을 보는지」. **맨 위 화면**만 읽어야 어디 있는지 알 수 있다.
  const 판 = document.querySelector('.decor-editor')
  const 층 = [...document.querySelectorAll('.app-frame .stack-layer')].pop()
  const 맨위 = 판 || 층 || document.querySelector('.app-frame')
  // ⭐ 꾸미기 판이 열렸으면 굴러가는 칸은 «서랍»이다 — 뒤 화면은 판이 덮고 있어 안 굴러간다.
  //    첫 판이 뒤 화면 넘침을 보고 「막대가 없다」고 잘못 잡았다.
  const sc = 판 ? 판.querySelector('.decor-scroll') : [...document.querySelectorAll('.app-frame .screen')].pop()
  const g = (판 || document).querySelector('.grid2, .grid3, .decor-grid')
  // ⭐ 「가로로 미는 줄」인지 거슬러 올라가 확인한다.
  const 미는줄안 = (x) => {
    let p = x.parentElement
    while (p && p !== document.body) {
      if (p.scrollWidth > p.clientWidth + 8 && /auto|scroll/.test(getComputedStyle(p).overflowX)) return true
      p = p.parentElement
    }
    return false
  }
  // 화면 «옆»으로 삐져나간 누를 것 — 가로에서 제일 흔한 병이다.
  // ⛔⛔ **첫 판이 「가로로 미는 줄」의 칩까지 잡았다**(레시피 카테고리·장보기 칩).
  //    거긴 밖에 있는 게 «정상»이다 — 옆으로 밀면 나온다. 진짜 문제는 «밀 수 있다는 표시»가 없던 것이고
  //    그건 아래 「가로 막대」로 따로 본다. 📌 규칙 18 — 잘못 재고 ⛔ 를 찍는 칸은 없느니만 못하다.
  const 이름 = (x) => (x.getAttribute('aria-label') || x.textContent || '').trim().slice(0, 14)
  const 밖전부 = [...document.querySelectorAll('button, a')].filter((x) => {
    const r = x.getBoundingClientRect()
    return r.width > 2 && r.height > 2 && (r.right > innerWidth + 1 || r.left < -1)
  })
  const 밖 = 밖전부.filter((x) => !미는줄안(x)).map(이름).filter(Boolean)
  // ➡️ 가로로 넘치는 줄이 몇 개고, 막대가 몇 개 그려졌나
  const 넘치는가로 = [...(판 || document.querySelector('.app-frame') || document.body).querySelectorAll('div, ul, nav')]
    .filter((el) => el.scrollWidth > el.clientWidth + 8 && /auto|scroll/.test(getComputedStyle(el).overflowX))
    .filter((el) => { const r = el.getBoundingClientRect(); return r.width >= 60 && r.bottom >= 4 && r.top <= innerHeight - 4 }).length
  return {
    가로넘침: Math.max(0, de.scrollWidth - de.clientWidth),
    세로넘침: sc ? Math.round(sc.scrollHeight - sc.clientHeight) : 0,
    막대: document.querySelectorAll('[data-vhint]').length,
    열: g ? getComputedStyle(g).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
    옆으로나감: 밖,
    넘치는가로,
    // ⭐⭐ **이게 진짜 잣대다** — 「미는 줄인지」를 두 곳에서 따로 판단하면 그 사이에 구멍이 생긴다
    //    (`미는줄안` 은 조상을 «전부» 보고, 막대는 `div·ul·nav` 만 본다 → 조상이 딴 태그면 표시 없이 통과).
    //    → **밖에 나간 게 있으면 «무조건» 막대가 있어야 한다.** 무엇이 미는 줄인지 안 물어본다.
    밖에나간것: 밖전부.length,
    가로막대: document.querySelectorAll('[data-hhint], [data-hthumb]').length,
    글자: (맨위 ? 맨위.innerText : '').slice(0, 34).replace(/\n/g, ' | '),
  }
}

for (const [판, w, h, 큰판] of [
  ['📱 패드 가로 1600×900', 1600, 900, true],
  ['📖 폴드 펼침 765×689', 765, 689, true],
  ['📱 폰 눕힘 891×411', 891, 411, true],
  ['📱 폰 세로 411×891 (회귀)', 411, 891, false],
]) {
  console.log(`\n━━━━━━ ${판} ━━━━━━`)
  const page = await b.newPage({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
  page.on('pageerror', e => { 나쁨++; console.log('   ⛔ pageerror', e.message) })
  await page.addInitScript((s) => {
    const d = new Date(); d.setHours(12, 0, 0, 0)
    s.diary.forEach((x, i) => { x.at = d.getTime() - i * 86400000 })
    localStorage.setItem('hankki:v1', JSON.stringify(s))
    localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
    const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
  }, {
    recipes: [],
    diary: [
      { id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '오늘' },
      { id: 'c1', kind: 'cook', at: 0, title: '김치찌개', icon: '' },
    ],
    seedV: BASICS_VERSION,
  })
  await page.goto('http://127.0.0.1:4423/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1200)

  const 걸음 = async (이름, 하기) => {
    try { await 하기() } catch (e) { 나쁨++; console.log(`   ⛔ ${이름} — 못 갔다: ${String(e.message).slice(0, 70)}`); return }
    await page.waitForTimeout(900)
    const r = await page.evaluate(재기)
    console.log(`   ▸ ${이름} ${JSON.stringify(r)}`)
    봄(r.가로넘침 === 0, `${이름} — 화면이 옆으로 안 밀린다 (${r.가로넘침}px)`)
    봄(r.옆으로나감.length === 0, `${이름} — 화면 밖으로 나간 단추 없음 ${r.옆으로나감.length ? JSON.stringify(r.옆으로나감) : ''}`)
    if (r.세로넘침 > 8) 봄(r.막대 > 0, `${이름} — 세로로 굴러가는데(${r.세로넘침}px) 막대가 보인다`)
    if (r.밖에나간것 > 0) 봄(r.가로막대 > 0, `${이름} — 화면 밖에 ${r.밖에나간것}개가 있는데 막대가 보인다 (${r.가로막대}개)`)
    if (큰판 && r.열 > 0) 봄(r.열 >= 3, `${이름} — 격자가 한 줄에 ${r.열}칸 (3 이상이라야)`)
  }

  await 걸음('① 홈', async () => {})
  await 걸음('② 레시피 탭', async () => { await page.getByText('레시피', { exact: true }).last().click() })
  await 걸음('③ 장보기 탭', async () => { await page.getByText('장보기', { exact: true }).last().click() })
  await 걸음('④ 레꾸자랑 탭', async () => { await page.getByText('레꾸자랑', { exact: true }).last().click() })
  await 걸음('⑤ 일기 탭(달력)', async () => { await page.getByText('일기', { exact: true }).last().click() })
  await 걸음('⑥ 일기 · 모아보기', async () => { await page.getByText('모아보기', { exact: true }).first().click() })
  await 걸음('⑦ 홈으로', async () => { await page.getByText('홈', { exact: true }).last().click() })
  await 걸음('⑧ 레시피 상세', async () => { await page.locator('.grid-card').first().click() })
  await 걸음('⑨ 요리 시작', async () => { await page.getByRole('button', { name: /요리 시작/ }).first().click() })
  await 걸음('⑩ 요리에서 나오기', async () => { await page.goBack() })
  await 걸음('⑪ 상세에서 나오기', async () => { await page.goBack() })
  await 걸음('⑫ 일기 → 오늘 일기', async () => {
    await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(700)
    await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click()
  })
  await 걸음('⑬ 꾸미기 열기', async () => { await page.getByRole('button', { name: '꾸미기 열기' }).first().click() })
  // ⛔ 첫 판이 `.decor-cats button` 을 30초 기다리다 죽었다 — 그 줄은 «꾸미기» 쪽에만 있고
  //    판을 열면 처음엔 다른 탭이다. 먼저 「꾸미기」 칸을 누른다.
  await 걸음('⑭ 꾸미기 칸으로', async () => { await page.locator('.seg', { hasText: /^(일꾸|레꾸|꾸미기)$/ }).first().click() })
  await 걸음('⑮ 스티커 갈래 옮기기', async () => { await page.locator('.decor-cats button').nth(1).click() })
  await 걸음('⑯ 꾸미기 닫기', async () => { await page.getByRole('button', { name: '취소' }).first().click() })
  // ⛔ 첫 판이 설정을 못 갔다 — **스택이 떠 있으면 하단바가 아예 없다**(`{!top && <BottomNav/>}`).
  //    「홈」 글자를 아무리 눌러도 없는 것을 누른 것이다. 먼저 스택을 비운다.
  await 걸음('⑰ 스택 비우고 홈', async () => {
    for (let i = 0; i < 3; i++) { await page.goBack().catch(() => {}); await page.waitForTimeout(350) }
    await page.getByText('홈', { exact: true }).last().click()
  })
  await 걸음('⑱ 설정', async () => { await page.getByRole('button', { name: '설정' }).first().click() })
  await page.close()
}
await b.close(); srv.close()
console.log(나쁨 === 0 ? '\n✅✅ 패드 가로 전수 통과' : `\n⛔ ${나쁨}칸 어긋남`)
process.exit(나쁨 === 0 ? 0 : 1)
