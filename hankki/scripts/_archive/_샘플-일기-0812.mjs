// 📔 「한끼 일기」 샘플 한 장 — 만들어서 «실물로» 찍는다 (2026-08-12 · #88)
//
// 📮 창업자 *"ㄱㄱ 우리 프레임있잖아. 틀 여러개 그중에 하나로 (심플한걸로 그래야 꾸미는게 드러나니까)"*
//    → 속지 일곱 장을 다 펼쳐 보고 **「도트 · 파랑」**(`dp_frame_blue`)을 골랐다.
//      가는 테두리 ＋ 귀퉁이 잎사귀뿐이고 **가운데가 통째로 빈다** = 꾸민 게 제일 잘 드러난다.
//      (`card`·`photo`·`snap`·`list3`·`today`·`scrap` 은 안에 칸·사진자리가 이미 그려져 있다)
//
// ⛔⛔ **시드 키를 틀렸었다** — `hankki:diary` 에 넣었는데 앱이 쓰는 건 **`hankki:v1` 한 덩어리**다
//    (`store.jsx` 8줄 `const KEY = 'hankki:v1'`). 그래서 일기 5개를 넣었는데 화면이 「아직 기록이 없어요」였다.
//    📌 규칙 18 — 「안 뜬다」가 아니라 **내 시드가 안 먹은 것**이었다.
//
// ⛔ `page.reload()` 를 쓰지 않는다 — `addInitScript` 가 저장값을 시드로 덮어써
//    «앱은 멀쩡한데 실패로 나온다»(옛 함정 사전 · check-mistakes ⑧). **새 탭**으로 연다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4382, r))

// 🎨 샘플 한 장 — ⚠️「예쁜가」는 창업자가 정한다(규칙 11). 나는 «우리 것만으로 채워서» 보여줄 뿐이다.
//    ⭐ 새로 그린 그림 0장 — 전부 이미 서랍에 있는 컷이다.
//    ⭐ 모션·효과는 **무료인 것만**(`base: true`) — 팩 잠금 컷을 샘플에 쓰면 «되는 줄 알고» 찾다 못 찾는다.
//       무료 모션 = 가만히·통통·갸웃 ＋ 찰랑(출시기념) / 무료 효과 = 반짝이·하트·뽀글
const 샘플 = {
  id: 'seed-diary-sample', kind: 'diary', sample: true,
  paper: { rule: 'plain', skin: 'ivory', art: 'dotblue' },   // 심플한 틀 하나 (창업자 지시)
  title: '콩국수 한 그릇',
  font: 'gaegu',
  note: '더워서 아무것도 하기 싫었는데\n콩만 갈면 되니까 그냥 했어요.\n\n딸이 국물까지 다 마셨어요.\n그거 보려고 또 만들 것 같아요.',
  // 📐📐 **글 «아래»에만 붙인다** — 첫 판은 마테를 맨 위(y 0.115)에 뒀다가
  //    **제목과 본문 두 줄을 통째로 덮었다.** 넘침 검사는 «0» 이었다(종이 «안»이니까).
  //    ⭐ 규칙 21 그대로 — 숫자는 「밖으로 나갔나」만 보고 **「덮었나」는 안 본다. 열어봐서 잡혔다.**
  //    ✅ 그래서 아래 검사에 「글자를 덮은 것」을 넣었다.
  decor: [
    // 🎗 마테 — 음식 컷 «위에 붙인 테이프»처럼 (사진을 붙여둔 느낌)
    //   ⛔⛔ **`type: 'tape'` 로 넣었더니 «민무늬 갈색 네모»가 떴다.**
    //      `DecorLayer` 275줄이 `tape` 를 **CSS(`tapeStyle`)** 로 그린다 — `wt_*` 는 그 목록에 없어
    //      바탕색만 남는다. 서랍의 마테 탭도 이 컷들을 **`addSticker`** 로 붙인다.
    //      📌 **탭 이름이 「마테」라고 `type` 이 `tape` 인 게 아니다.** 그림이 있는 마테는 «스티커»다.
    { id: 'd1', type: 'sticker', key: 'wt_td01', x: 0.665, y: 0.478, s: 0.30, r: -6 },
    // 🍜 오늘 해먹은 것 — 본문 다섯 줄이 끝나는 자리 아래 · 마테가 위 모서리에 걸친다
    { id: 'd2', type: 'sticker', key: 'fe_38', x: 0.685, y: 0.575, s: 0.32, r: 3 },
    // 💗 하트 — 왼쪽 빈자리. 효과 「하트」가 위로 뜬다
    { id: 'd3', type: 'sticker', key: 'dc_td11', x: 0.255, y: 0.625, s: 0.12, r: -6, fx: 'heart' },
    // 🐻 꼬르곰 — 붙이면 저절로 통통 뛴다(FRIEND_IDS 기본값 그대로)
    { id: 'd4', type: 'sticker', key: 'gp_gomhi', x: 0.735, y: 0.800, s: 0.25, r: 3, motion: 'tongtong', fx: 'none' },
    // ✍️ 글자 — 색·모션·효과가 «글자에도» 걸린다(#88 그대로)
    { id: 'd5', type: 'text', color: 't_teal', font: 'gaegu', text: '오늘도 한 끼 해냄', x: 0.37, y: 0.880, s: 0.50, r: -2, motion: 'tilt', fx: 'spark' },
    // 📐📐 **속지 모서리 꾸미기** — 창업자 *"속지모서리도 꾸며달라했는데"* (첫 판에서 내가 빠뜨렸다)
    //   ⭐ 코너 6컷(`dgc01~06`)은 **왼쪽 위 방향으로만** 그려져 있다 → 네 귀퉁이는 `flip`·`flipY` 로 만든다
    //      (2026-08-06 좌우반전이 들어가며 6컷 → 24컷이 된 바로 그 자리다)
    //   🎨 `dgc05`(하늘색 레이스＋별)를 골랐다 — 이 속지 테두리가 «파랑»이라 톤이 맞는다.
    //      ⛔ dgc04(분홍 꽃)·dgc06(보라 리본)은 파란 테두리와 색이 부딪친다.
    //   ⚠️ 대각선 둘만 — 넷을 다 두르면 «액자»가 되어 가운데 꾸민 게 오히려 죽는다.
    //   ⚠️ 왼쪽 위는 «본문 첫 줄»이 바로 아래라 검사가 5% 덮음으로 잡았다 → 더 귀퉁이로 밀었다
    { id: 'd6', type: 'sticker', key: 'dgc05', x: 0.112, y: 0.058, s: 0.17, r: 0 },
    { id: 'd7', type: 'sticker', key: 'dgc05', x: 0.888, y: 0.942, s: 0.17, r: 0, flip: true, flipY: true },
  ],
}

const br = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await br.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 3, timezoneId: 'Asia/Seoul' })
await ctx.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:giftSheetSeen', '1')
  for (const k of ['home3', 'detail', 'shop', 'profile', 'myrecipes', 'brag', 'diary'])
    localStorage.setItem(`hankki:coach:${k}`, '1')
})
const pg0 = await ctx.newPage()
await pg0.goto('http://127.0.0.1:4382/', { waitUntil: 'networkidle' })

// ⭐ 앱이 «자기 손으로» 만든 저장본에 일기 한 장만 얹는다 — 통째로 새로 쓰면 레시피가 사라진다
await pg0.evaluate((entry) => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const 오늘 = new Date(); 오늘.setHours(12, 0, 0, 0)
  s.diary = [{ ...entry, at: 오늘.getTime() }, ...(s.diary || []).filter((d) => d.id !== entry.id)]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
}, 샘플)
await pg0.close()

const pg = await ctx.newPage()
pg.on('pageerror', (e) => console.log('  ⛔ pageerror:', String(e).slice(0, 120)))
await pg.goto('http://127.0.0.1:4382/', { waitUntil: 'networkidle' })

const 시트닫기 = async () => {
  for (const t of ['나중에', '닫기']) {
    const b = pg.getByRole('button', { name: t }).first()
    if (await b.count() && await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); await pg.waitForTimeout(250) }
  }
}
await pg.getByRole('button', { name: /일기/ }).last().click()
await pg.waitForTimeout(700); await 시트닫기()
await pg.screenshot({ path: `${OUT}/sample-1-tab.png` })

// 「오늘 일기 보기」 — 이미 한 장 있으니 «보기»로 뜬다
const 쓰기 = pg.getByRole('button', { name: /오늘 일기/ }).first()
console.log('버튼 :', await 쓰기.innerText().catch(() => '(못 찾음)'))
await 쓰기.click(); await pg.waitForTimeout(900); await 시트닫기()
await pg.screenshot({ path: `${OUT}/sample-2-page.png` })

// 📐 규칙 21 — 보여주기 «전»에 내가 잰다: 종이 밖으로 나간 게 없나 · 덮은 게 없나
const 잰것 = await pg.evaluate(() => {
  const box = document.querySelector('.paper-box') || document.querySelector('.paper')
  if (!box) return { 종이: null }
  const b = box.getBoundingClientRect()

  // ⛔⛔ **`.decor-layer` 라는 클래스는 «없다»** — `DecorLayer` 루트는 인라인 스타일뿐인 맨 div 다.
  //   그래서 `querySelectorAll('.decor-layer > *')` 이 **0개**를 돌려주고 아래 검사가 «전부 통과»했다.
  //   (마테로 제목을 덮은 판을 다시 돌려도 「덮음 0」이 나왔다 — 규칙 12 가 잡아낸 「실패할 줄 모르는 칸」)
  //   ✅ 이름 대신 **모양으로** 찾는다: 종이 안에서 `inset:0 · pointer-events:none · z-index:2` 인 층.
  const 꾸민것들 = () => {
    for (const el of box.querySelectorAll('div')) {
      const s = getComputedStyle(el)
      if (s.position === 'absolute' && s.pointerEvents === 'none' && s.zIndex === '2' && s.overflow === 'hidden')
        return [...el.children]
    }
    return []
  }
  const 넘침 = []
  꾸민것들().forEach((el, i) => {
    const r = el.getBoundingClientRect()
    if (r.left < b.left - 1 || r.right > b.right + 1 || r.top < b.top - 1 || r.bottom > b.bottom + 1)
      넘침.push(`${i}:${Math.round(r.left - b.left)},${Math.round(r.top - b.top)}`)
  })
  const 깨짐 = [...document.querySelectorAll('.decor-layer img')].filter((im) => im.naturalWidth === 0).length

  // ⛔⛔ 「덮었나」 — 첫 판이 마테로 제목·본문을 통째로 덮었는데 «넘침 0» 이라 통과했다.
  //   글자는 텍스트 노드라 `getBoundingClientRect` 가 없다 → **Range 로 줄마다 잰다.**
  //   ⛔⛔ **종이 글은 «텍스트 노드»가 아니다 — 투명 `<textarea>` 의 «값»이다**(v9.96 구조).
  //      그래서 처음엔 텍스트 노드를 훑었고 **글줄 1개**, 문서 전체로 넓히니 이번엔
  //      **뒤에 깔린 달력 숫자**(12·13·14·20…)를 잡아 「덮음 12」라는 **거짓 경보**를 냈다.
  //      ✅ 종이 «안»의 `textarea` 중 **값이 있는 것**만 본다. 글이 없는 빈 칸은 덮여도 상관없다.
  const 안쪽 = (r) => r.left >= b.left - 2 && r.right <= b.right + 2 && r.top >= b.top - 2 && r.bottom <= b.bottom + 2
  const 줄 = []
  for (const ta of document.querySelectorAll('textarea')) {
    if (!String(ta.value || '').trim()) continue
    const r0 = ta.getBoundingClientRect()
    // ⚠️⚠️ 글칸은 종이 «거의 전체»다(도트·파랑은 위 8.7%~아래 8%). 칸 넓이로 나누면
    //   두 줄을 통째로 덮어도 8% 라 안 걸린다.
    //   ⛔ `scrollHeight` 로 좁히려 했지만 **칸 높이가 100% 라 scrollHeight 도 칸 전체**였다(같은 값).
    //   ✅ **줄 수 × 줄 높이**로 「글이 실제로 앉은 띠」를 만든다. 그게 덮이면 진짜 덮인 것이다.
    const 줄수 = String(ta.value).split('\n').length
    const lh = parseFloat(getComputedStyle(ta).lineHeight) || 0
    const 찬높이 = Math.min(lh ? 줄수 * lh : (ta.scrollHeight || r0.height), r0.height)
    const r = { left: r0.left, right: r0.right, top: r0.top, bottom: r0.top + 찬높이, width: r0.width, height: 찬높이 }
    if (r.width > 4 && r.height > 4 && 안쪽(r0)) 줄.push({ t: String(ta.value).trim().slice(0, 12), r })
  }
  const 덮음 = []
  꾸민것들().forEach((el) => {
    const a = el.getBoundingClientRect()
    for (const { t, r } of 줄) {
      const ov = Math.max(0, Math.min(a.right, r.right) - Math.max(a.left, r.left)) *
                 Math.max(0, Math.min(a.bottom, r.bottom) - Math.max(a.top, r.top))
      if (ov / (r.width * r.height) > 0.05) 덮음.push(`「${t}」 ${Math.round(ov / (r.width * r.height) * 100)}%`)
    }
  })
  return { 종이: `${Math.round(b.width)}×${Math.round(b.height)}`, 넘침, 깨짐, 덮음, 줄수: 줄.length, 꾸민것: 꾸민것들().length }
})
console.log('종이 :', 잰것.종이, '· 꾸민 것', 잰것.꾸민것, '· 넘침', (잰것.넘침 || []).length, '· 깨진 그림', 잰것.깨짐)
// ⛔ 「꾸민 것 0」이면 아래 검사가 «전부 통과»한다 — 실패할 줄 모르는 칸이다(규칙 12).
if (!잰것.꾸민것) { console.log('⛔⛔ 꾸민 것을 하나도 못 찾았다 — 셀렉터가 틀렸다. 검사가 죽어 있다.'); }
console.log('글줄 :', 잰것.줄수, '· ⛔덮음', (잰것.덮음 || []).length, (잰것.덮음 || []).join(' / '))

// 🎬🎬 **움직이는 판** — 창업자 *"내가 글자 효과나 모션도 넣고.."*
//   ⭐ 모션·효과는 «넣었는데» 정지 캡처엔 안 보인다. 그래서 **앱 화면을 여러 장 이어 붙인다**
//      (v10.03 상세 꾸미기 판정판과 같은 방식 — CSS 흉내가 아니라 진짜 앱이다).
//   ⛔ 그때 **찍는 데 걸린 시간을 안 재고 100ms 로 재생해 2배 빨랐다**(창업자가 잡았다).
//      → 여기선 **찍힌 «간격»을 같이 남겨서** 그대로 재생한다.
const 종이 = pg.locator('.paper-box').first()
mkdirSync(`${OUT}/frames`, { recursive: true })
const 프레임 = [], 시각 = []
const t0 = Date.now()
for (let i = 0; i < 30; i += 1) {
  await 종이.screenshot({ path: `${OUT}/frames/f${String(i).padStart(2, '0')}.png` })
  시각.push(Date.now() - t0)
  프레임.push(i)
}
const 간격 = Math.round((시각[시각.length - 1] - 시각[0]) / (시각.length - 1))
console.log(`🎬 ${프레임.length}장 · 찍힌 간격 평균 ${간격}ms (이 값 그대로 재생할 것)`)

await br.close(); srv.close(); console.log(`\n🖼 ${OUT}/sample-*.png · 🎬 ${OUT}/frames/`); process.exit(0)
