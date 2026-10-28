// 🍢🍢 「어묵에 쿠팡을 추가하면 뭐가 달라지나」 — 창업자에게 보여줄 시안 (2026-09-15)
//
// 📮 창업자 = *"내가 궁금한건 그럼 큐레이션에서 뭐가 바뀌거나 바꿀 건 없는거야?
//             (어묵을 한살림만 넣었는데 쿠팡을 추가해야한다거나)"* → *"시안을 보여줄수있어??"* → *"1번 2번"*
//
// ⭐ 두 자리를 «나란히» 보여준다 —
//    ① 주부의 장바구니 화면 = 한살림 옆에 쿠팡이 «더해지는» 모양
//    ② 재료 담기 → 사러가기 = 어디로 가나 (고치기 «전» vs «후»)
//
// ⛔ 앱 소스를 한 글자도 안 고친다 — 값을 «읽어서» 그림으로 그릴 뿐이다.
// ⛔ 숫자·이름은 전부 curation.js 와 ingLink() 에서 «읽는다». 손으로 적지 않는다(규칙 30).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const 뿌리 = join(dirname(fileURLToPath(import.meta.url)), '..')
const 담을곳 = join(뿌리, 'node_modules/.cache')
mkdirSync(담을곳, { recursive: true })
const 들머리 = join(담을곳, '어묵시안.entry.jsx')
writeFileSync(들머리, "export { ingLink } from '" + join(뿌리, 'src/data/ingLinks.js') + "'\n"
  + "export { picksForIngredients, productLink, isHansalim } from '" + join(뿌리, 'src/data/curation.js') + "'\n")
const 담은곳 = join(담을곳, '어묵시안.mjs')
execFileSync('npx', ['esbuild', 들머리, '--bundle', '--format=esm', '--platform=node',
  '--loader:.png=empty', '--loader:.svg=empty', '--loader:.jpg=empty', '--loader:.webp=empty', '--loader:.gif=empty',
  '--banner:js=import.meta.glob = () => ({}); var React = { createElement: () => null, Fragment: null };',
  '--outfile=' + 담은곳], { cwd: 뿌리, stdio: 'pipe' })
const { picksForIngredients, productLink } = await import(담은곳)

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const 후보 = picksForIngredients(['어묵'], '')
const 몰이름 = { coupang: '쿠팡', hansalim: '한살림', kurly: '컬리', icoop: '자연드림', oasis: '오아시스' }

const 칸 = (p, 뽑힘) => {
  const u = productLink(p)
  const m = 몰이름[p.mall] || '네이버'
  return `<div class="row ${뽑힘 ? 'on' : ''}">
    <div class="nm">${esc((p.brand ? p.brand + ' ' : '') + p.name)}</div>
    <div class="mall ${u ? 'ok' : 'no'}">${m}${u ? '' : ' · 조합원 전용'}</div>
    <div class="lk ${u ? 'ok' : 'no'}">${u ? '🔗 링크 있음' : '⛔ 링크 없음'}</div>
    ${뽑힘 ? '<div class="pick">👉 사러가기가 여기로</div>' : ''}
  </div>`
}

// 고치기 «전» = 맨 앞 하나 · 고친 «뒤» = 링크 있는 첫 놈
const 전 = 후보[0]
const 후 = 후보.find((p) => productLink(p))

const html = `<!doctype html><meta charset="utf-8">
<style>
  body { margin:0; background:#fdfbf7; font-family:-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif; color:#3d2f24; }
  .wrap { width:1180px; margin:0 auto; padding:34px 30px 46px; }
  h1 { font-size:30px; margin:0 0 6px; letter-spacing:-1px; }
  .sub { color:#8b7866; font-size:16px; margin:0 0 26px; }
  .two { display:grid; grid-template-columns:1fr 1fr; gap:22px; }
  .card { background:#fff; border:1px solid #ece4d8; border-radius:18px; padding:20px 22px 24px; }
  .card h2 { font-size:19px; margin:0 0 4px; }
  .card .cap { color:#8b7866; font-size:14px; margin:0 0 16px; }
  .row { border:1px solid #ece4d8; border-radius:12px; padding:11px 14px; margin-bottom:9px; background:#fdfbf7; position:relative; }
  .row.on { border-color:#5b7aa8; background:#f2f6fb; box-shadow:0 0 0 2px #dbe6f3; }
  .nm { font-weight:800; font-size:16px; }
  .mall { font-size:13.5px; margin-top:3px; color:#8b7866; }
  .lk { font-size:13px; margin-top:2px; }
  .lk.ok { color:#2f7a4f; font-weight:700; } .lk.no { color:#b4451f; font-weight:700; }
  .pick { position:absolute; right:12px; top:50%; transform:translateY(-50%); font-size:13.5px; font-weight:800; color:#5b7aa8; }
  .note { margin-top:14px; font-size:14.5px; line-height:1.65; color:#5a4a3c; background:#faf5ec; border-left:3px solid #c9a227; padding:11px 14px; border-radius:0 10px 10px 0; }
  .big { margin-top:26px; background:#fff; border:1px solid #ece4d8; border-radius:18px; padding:20px 22px 22px; }
  .big h2 { font-size:19px; margin:0 0 14px; }
  table { width:100%; border-collapse:collapse; font-size:15px; }
  th,td { text-align:left; padding:9px 10px; border-bottom:1px solid #f0e8dc; }
  th { color:#8b7866; font-size:13.5px; font-weight:700; }
  .yes { color:#2f7a4f; font-weight:800; } .nope { color:#b4451f; font-weight:800; }
</style>
<div class="wrap">
  <h1>🍢 어묵 — 큐레이션에서 뭘 바꿔야 하나</h1>
  <p class="sub">창업자 물음 = “한살림만 넣었는데 쿠팡을 추가해야 하나?” · 값은 전부 <b>curation.js</b> 에서 읽었다</p>

  <div class="two">
    <div class="card">
      <h2>① 주부의 장바구니 — <b>지금 이미 이렇다</b></h2>
      <p class="cap">어묵 칸에 든 제품 ${후보.length}개. 화면엔 이 차례 그대로 보인다.</p>
      ${후보.map((p) => 칸(p, false)).join('')}
      <div class="note">⭐ <b>어묵은 이미 쿠팡이 들어 있다</b> — 새로 넣을 게 없다.<br>
        한살림은 <b>그대로 둔다</b>(창업자가 즐겨 쓰는 곳 · 화면에 계속 보인다).</div>
    </div>

    <div class="card">
      <h2>② 「사러가기」가 어디로 가나</h2>
      <p class="cap">바뀐 건 <b>이 한 가지뿐</b>이다. 화면 차례는 안 바뀐다.</p>
      <div style="font-size:14px;font-weight:800;color:#b4451f;margin:2px 0 7px">고치기 전 — 맨 앞만 봤다</div>
      ${칸(전, true)}
      <div style="font-size:14px;font-weight:800;color:#2f7a4f;margin:14px 0 7px">고친 뒤 — 링크가 «있는» 첫 놈</div>
      ${칸(후, true)}
      <div class="note">🔢 옛 판은 한살림에서 멈춰 <b>수수료 0원</b>이었다.<br>
        이제 뒤에 있던 쿠팡 어묵으로 이어진다.</div>
    </div>
  </div>

  <div class="big">
    <h2>🥬 그럼 「쿠팡을 추가해야 하는」 재료는 어디인가 — <b>여섯 줄뿐</b></h2>
    <table>
      <tr><th>지금 들어 있는 것</th><th>몰</th><th>추가하면 살아나는 말</th><th>지금</th></tr>
      <tr><td>납작당면</td><td>한살림</td><td>납작당면 · <b>당면</b></td><td class="nope">링크 없음</td></tr>
      <tr><td>한살림 마른두부</td><td>한살림</td><td>마른두부 · <b>포두부</b></td><td class="nope">링크 없음</td></tr>
      <tr><td>한살림 몽글이 순두부</td><td>한살림</td><td><b>순두부</b></td><td class="nope">링크 없음</td></tr>
      <tr><td>황태채무침</td><td>한살림</td><td>황태채</td><td class="nope">링크 없음</td></tr>
      <tr><td>곤드레나물밥</td><td>한살림</td><td>곤드레</td><td class="nope">링크 없음</td></tr>
      <tr><td>섬진강재첩국</td><td>한살림</td><td>재첩</td><td class="nope">링크 없음</td></tr>
      <tr><td>물만두</td><td>한살림</td><td>물만두 · <b>만두</b></td><td class="nope">링크 없음</td></tr>
      <tr><td><b>어묵 (한살림·새로미 둘)</b></td><td>한살림＋쿠팡</td><td>어묵 · 사각어묵</td><td class="yes">✅ 이미 된다</td></tr>
    </table>
    <div class="note">⛔ <b>한살림을 빼지 않는다.</b> 옆에 쿠팡을 «한 줄 더» 넣을 뿐이다.<br>
      ⭐ 급하지 않다 — 지금도 앱은 멀쩡히 돈다. 그 재료만 수수료가 0원일 뿐.</div>
  </div>
</div>`

const 낼곳 = process.env.CLAUDE_SCRATCHPAD_DIR || '/tmp/claude-0'
mkdirSync(낼곳, { recursive: true })
const 길 = join(낼곳, '어묵시안.html')
writeFileSync(길, html)
console.log('📄', 길)
console.log('   어묵 후보', 후보.length, '개 · 고치기 전 =', 전.name, '· 고친 뒤 =', 후.name)
