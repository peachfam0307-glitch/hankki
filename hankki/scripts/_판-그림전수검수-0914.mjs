// 🖼☑️ **레시피 201편에 붙는 그림 — 전수 검수판** (2026-09-14)
//
// 📮 창업자 = *"음식아이콘 이상하게 바뀌는거랑 반영안되는 것도 뿌리째 고쳐줘 검수까지 다했는데 이러면 안되잖아"*
//    ＋ *"전수로 내가 보고 결정하라는거야? 아님 홈화면에있는거만 보라는거야"*
//
// ⭐⭐ **답 = 창업자는 아무것도 «훑지» 않는다 — 한 장으로 뽑아 주고 «누르기»만 하게 한다**(규칙 8).
//    ⛔ 「어느 편이 이상한지 찾아서 알려줘」는 창업자에게 노가다를 시키는 것이다.
//    ⛔ 아이콘 판정은 **창업자가 한다**(규칙 11) — 내가 「같다/다르다」를 정하지 않는다.
//
// ⛔ 앞선 판(`_판-그림짝검수-0914`)은 **판정대기 11건만** 실었다. 그건 「글자로 재서 어긋난 것」이고,
//    창업자가 폰에서 보는 건 **전부**다. 그래서 이 판은 **201편을 다 싣는다.**
//
// ☑️☑️ **[절대원칙 · 창업자 2026-08-19] 검수판은 «무조건» 체크 ＋ 복사가 된다**
//    ⑴ 칸마다 고르기(✅좋다 / ⛔바꿔야 해) — localStorage 에 저장(새로고침해도 안 날아간다)
//    ⑵ 맨 아래 「복사하기」 — 고른 결과가 글자로 나온다
//    ⑶ clipboard 가 조용히 실패하는 폰이 있다 → 실패하면 글자를 골라 준다(길게 눌러 복사)
//
// ⛔ PIL 로 안 만든다 — 이 환경엔 한글 폰트가 없어 글자가 네모로 깨진다.
//    ✅ 브라우저로 그린다. 앱이 쓰는 그림 파일을 그대로 불러 «앱과 같은 컷»을 본다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-그림전수검수-0914.mjs
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'

const ROOT = new URL('..', import.meta.url).pathname

// 🔎 제목 → 실제로 붙는 그림 키 (`check-iconmatch` 와 «같은 순서»로 구한다)
//   ⛔ 순서를 베껴 쓰면 두 벌이 되어 반드시 갈린다(규칙 28) — 여기는 «보여주기»만 하고
//      판정은 하지 않으므로, 순서가 갈리면 창업자가 «앱과 다른 그림»을 보게 된다. 그래서 주석으로 못 박는다.
const store = readFileSync(join(ROOT, 'src/store.jsx'), 'utf8')
const 표읽기 = (이름) => {
  const i = store.indexOf(`const ${이름} = {`)
  if (i < 0) return {}
  const body = store.slice(i, store.indexOf('\n  }', i))
  const 표 = {}
  for (const m of body.matchAll(/(?:'([^']+)'|([A-Za-z][\w]*))\s*:\s*'([^']+)'/g)) 표[m[1] || m[2]] = m[3]
  return 표
}
const F38 = 표읽기('ICON_FORCE_V38'), SV88 = 표읽기('ICON_SWAP_V88'), FV88 = 표읽기('ICON_FORCE_V88')
const SGR = 표읽기('ICON_SWAP_GR'), S0827 = 표읽기('ICON_SWAP_0827')
for (const [이름, 표] of [['ICON_FORCE_V38', F38], ['ICON_SWAP_V88', SV88], ['ICON_FORCE_V88', FV88], ['ICON_SWAP_GR', SGR], ['ICON_SWAP_0827', S0827]]) {
  // ⛔ 표가 «0줄»로 읽히면 판이 통째로 헛것이 된다 — 실제로 오늘 정규식 때문에 두 번 그랬다.
  if (!Object.keys(표).length) { console.error('⛔ ' + 이름 + ' 을 0줄로 읽었다 — 표 읽는 규칙이 깨졌다. 판을 만들지 않는다.'); process.exit(1) }
}

const { allBasicRecipes } = await import('../src/data/basics.js')
const { 나라들, 종류고르기 } = await import('../src/data/종류.js')

const 어디 = (제목, 시작) => {
  let g = 시작, 자리 = '레시피에 박힌 그림'
  if (F38[제목]) { g = F38[제목]; 자리 = 'FORCE_V38' }
  if (FV88[제목]) { g = FV88[제목]; 자리 = 'FORCE_V88' } else if (SV88[g]) { g = SV88[g]; 자리 = 'SWAP_V88' }
  if (SGR[g]) { g = SGR[g]; 자리 = 'SWAP_GR' }
  if (S0827[g]) { g = S0827[g]; 자리 = 'SWAP_0827' }
  return { 키: g, 자리 }
}

// 같은 그림을 나눠 쓰는 자리 — 여기서 한 편을 바꾸면 다른 편이 딸려 온다
const 그림쓰는편 = new Map()
const 칸들 = []
for (const r of allBasicRecipes) {
  const { 키, 자리 } = 어디(String(r.title).trim(), r.icon)
  if (!키) continue
  if (!그림쓰는편.has(키)) 그림쓰는편.set(키, [])
  그림쓰는편.get(키).push(r.title)
  칸들.push({ 제목: r.title, 키, 자리, 갈래: r.category || '', 종류: 종류고르기(r), from: r.from || '' })
}

// 그림 파일을 찾아 data: 로 심는다 — 판 하나만 열면 되게(폰에서 본다)
const 폴더들 = ['src/assets/stickers/photo', 'src/assets/stickers/food', 'src/assets/stickers']
const 찾기 = (키) => {
  for (const d of 폴더들) for (const ext of ['.png', '.webp', '.jpg']) {
    const p = join(ROOT, d, 키 + ext)
    if (existsSync(p)) return { p, ext }
  }
  return null
}
const 임시 = mkdtempSync(join(tmpdir(), 'hankki-판-'))
let 못찾음 = 0
for (const c of 칸들) {
  const f = 찾기(c.키)
  if (!f) { c.그림 = ''; 못찾음++; continue }
  // 🗜 화면에 뜨는 크기(가로 380px)로 줄여 심는다 — 원본 그대로면 판이 84MB 가 되어 폰에서 못 연다(실측).
  //   ⛔ 규칙 13 「줄인 판으로 판정하지 말 것」은 «잔재·잘림»을 볼 때 이야기다.
  //      이 판이 묻는 건 «이 그림이 이 요리가 맞나»라 앱에 뜨는 크기(150px)면 충분하고, 380px 은 그보다 크다.
  const 작은것 = join(임시, c.키 + '.png')
  execFileSync('python3', ['-c', `
from PIL import Image
im = Image.open(r'${f.p}').convert('RGBA')
im.thumbnail((240, 240), Image.LANCZOS)
# 🎨 색을 256 으로 줄인다 — 우리 컷은 원래 색이 많지 않아 눈으로는 차이가 안 난다.
#   ⛔ 이걸 안 하면 판이 49MB 가 되어 폰에서 못 연다(실측). 목표는 15MB 아래.
im = im.quantize(colors=256, method=Image.FASTOCTREE).convert('RGBA')
im.save(r'${작은것}', optimize=True)
`])
  c.그림 = 'data:image/png;base64,' + readFileSync(작은것).toString('base64')
}
console.log('📋 칸 ' + 칸들.length + '개 · 그림 파일 못 찾음 ' + 못찾음 + '개')
if (못찾음) console.log('   ⛔ 못 찾은 그림이 있으면 그 칸은 빈 칸으로 뜬다 — 그것도 제보 대상이다.')

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const 칸html = 칸들.map((c, i) => {
  const 나눠씀 = (그림쓰는편.get(c.키) || []).length
  return `<div class="칸" data-n="${i + 1}" data-t="${esc(c.제목)}">
  <div class="머리"><span class="번호">${i + 1}</span><span class="자리">${esc(c.자리)}</span></div>
  <div class="그림">${c.그림 ? `<img src="${c.그림}" alt="">` : '<span class="빈">그림 파일 없음</span>'}</div>
  <div class="제목">${esc(c.제목)}</div>
  <div class="밑줄">${esc(c.키)} · ${esc(c.갈래)}→${esc(c.종류)}${c.from ? ' · ' + esc(c.from) : ''}</div>
  ${나눠씀 >= 2 ? `<div class="같이">⚠️ 이 그림을 ${나눠씀}편이 나눠 쓴다 — 바꾸면 같이 바뀐다</div>` : ''}
  <div class="고르기">
    <button class="ok" data-v="ok">✅ 맞아</button>
    <button class="no" data-v="no">⛔ 바꿔</button>
  </div>
</div>`
}).join('\n')

const html = `<!doctype html><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>그림 전수 검수판 ${칸들.length}편</title>
<style>
  :root { color-scheme: light }
  body { margin:0; background:#FAF7F2; font-family:system-ui,-apple-system,'Malgun Gothic',sans-serif; color:#3A2A20; padding-bottom:120px }
  h1 { font-size:26px; margin:20px 16px 6px }
  .안내 { margin:0 16px 14px; font-size:16px; line-height:1.6; color:#6B5646 }
  .안내 b { color:#8A4A28 }
  .판 { display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:14px; padding:0 16px 28px }
  .칸 { background:#fff; border:2px solid #E6DCD2; border-radius:16px; padding:10px }
  .칸.v-ok { border-color:#9BBE8F; background:#F6FBF4 }
  .칸.v-no { border-color:#D98A6A; background:#FFF6F1 }
  .머리 { display:flex; align-items:center; justify-content:space-between; gap:6px }
  .번호 { background:#5C4535; color:#fff; border-radius:999px; padding:2px 10px; font-size:15px; font-weight:800 }
  .자리 { font-size:12px; color:#9C8878 }
  .그림 { height:150px; display:flex; align-items:center; justify-content:center; margin:6px 0 }
  .그림 img { max-width:100%; max-height:100% }
  .빈 { font-size:13px; color:#C06A46 }
  .제목 { font-size:16.5px; font-weight:800; line-height:1.3 }
  .밑줄 { font-size:12.5px; color:#9C8878; margin-top:3px }
  .같이 { font-size:12.5px; color:#A15A30; margin-top:5px; line-height:1.4 }
  .고르기 { display:flex; gap:6px; margin-top:8px }
  .고르기 button { flex:1; padding:8px 0; border-radius:10px; border:1.5px solid #DCCFC2; background:#fff; font-size:14.5px; font-weight:700; color:#6B5646; cursor:pointer }
  .칸.v-ok .ok { background:#6E9C5E; border-color:#6E9C5E; color:#fff }
  .칸.v-no .no { background:#C4653E; border-color:#C4653E; color:#fff }
  .바 { position:fixed; left:0; right:0; bottom:0; background:#fff; border-top:2px solid #E6DCD2; padding:12px 16px; display:flex; gap:10px; align-items:center }
  .셈 { font-size:15px; font-weight:700; flex:1 }
  .바 button { padding:11px 16px; border-radius:12px; border:0; background:#5C4535; color:#fff; font-size:15.5px; font-weight:800; cursor:pointer }
  #답 { margin:0 16px; width:calc(100% - 32px); min-height:90px; font-size:14px; display:none; border:2px solid #DCCFC2; border-radius:12px; padding:10px }
</style>
<h1>레시피에 붙는 그림 — 전수 ${칸들.length}편</h1>
<div class="안내">
  칸에 뜬 그림이 <b>지금 그 레시피에 실제로 붙는 그림</b>이야 (표 다섯을 다 거친 뒤 값).<br>
  <b>이상한 것만 「⛔ 바꿔」</b>를 눌러줘. 나머진 안 눌러도 돼.<br>
  ⚠️ 표시가 있는 칸은 <b>그 그림을 여러 편이 나눠 쓰는</b> 자리야 — 바꾸면 같이 바뀌어.<br>
  다 되면 맨 아래 <b>복사하기</b>를 눌러 나한테 붙여넣어줘.
</div>
<div class="판">
${칸html}
</div>
<textarea id="답" readonly></textarea>
<div class="바">
  <span class="셈" id="셈">고른 것 없음</span>
  <button id="복사">복사하기</button>
</div>
<script>
  var KEY = 'hankki:그림전수검수:0914'
  var 고름 = {}
  try { 고름 = JSON.parse(localStorage.getItem(KEY) || '{}') } catch (e) { 고름 = {} }
  var 칸들 = [].slice.call(document.querySelectorAll('.칸'))
  function 칠하기() {
    칸들.forEach(function (el) {
      var v = 고름[el.dataset.n]
      el.classList.toggle('v-ok', v === 'ok')
      el.classList.toggle('v-no', v === 'no')
    })
    var no = 0, ok = 0
    for (var k in 고름) { if (고름[k] === 'no') no++; if (고름[k] === 'ok') ok++ }
    document.getElementById('셈').textContent = '⛔ 바꿔 ' + no + '개 · ✅ 맞아 ' + ok + '개'
  }
  칸들.forEach(function (el) {
    el.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        var n = el.dataset.n
        고름[n] = (고름[n] === b.dataset.v) ? '' : b.dataset.v
        if (!고름[n]) delete 고름[n]
        try { localStorage.setItem(KEY, JSON.stringify(고름)) } catch (e) {}
        칠하기()
      })
    })
  })
  칠하기()
  document.getElementById('복사').addEventListener('click', function () {
    var 바꿀것 = [], 맞는것 = []
    칸들.forEach(function (el) {
      var v = 고름[el.dataset.n]
      if (v === 'no') 바꿀것.push(el.dataset.n + '. ' + el.dataset.t)
      if (v === 'ok') 맞는것.push(el.dataset.t)
    })
    var 글 = '그림 전수 검수 (' + 칸들.length + '편)\\n\\n[바꿔야 할 것 ' + 바꿀것.length + '개]\\n'
      + (바꿀것.join('\\n') || '없음') + '\\n\\n[맞다고 본 것 ' + 맞는것.length + '개]'
    var ta = document.getElementById('답')
    ta.value = 글
    ta.style.display = 'block'
    // ⛔ clipboard 는 성공으로 resolve 되고도 실제 복사가 안 되는 폰이 있다(v10.97 교훈)
    //    → 어느 쪽이든 글자를 골라 둔다. 길게 눌러 복사할 수 있게.
    try { if (navigator.clipboard) navigator.clipboard.writeText(글) } catch (e) {}
    ta.focus(); ta.setSelectionRange(0, 글.length)
    ta.scrollIntoView({ block: 'center' })
  })
</script>`

const 낼곳 = process.env.CLAUDE_SCRATCHPAD_DIR || '/tmp'
const 파일 = join(낼곳, '그림전수검수-0914.html')
writeFileSync(파일, html)
console.log('✅ ' + 파일 + '  (' + Math.round(html.length / 1024) + 'KB)')
