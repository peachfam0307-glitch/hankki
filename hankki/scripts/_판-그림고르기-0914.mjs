// 🖼🔀 **창업자가 「바꿔」 한 편의 새 그림 고르기 — 판** (2026-09-14)
//
// 📮 창업자 전수 검수(201편) 결과 = **8편이 「바꿔」**
//    8. 김치볶음밥 · 22. 간단 우삼겹 갈비탕 · 43. 오징어숙회 · 44. 충무김밥 오징어무침
//    110. 간편갈비조림 · 124. 갈비탕 · 136. 비빔밥 소스 · 140. 삼겹살 꽈리고추
//
// ⛔⛔ **아이콘은 창업자가 고른다**(규칙 11) — 내가 「이게 낫다」를 정하지 않는다.
//    ⭐ 내가 할 일 = **후보를 눈에 보이게 늘어놓는 것**뿐이다.
//
// 🔎 후보를 어디서 뽑나 = `FoodIcon.jsx` 의 이름표(EXTRA_NAMES ＋ ICON_RULES).
//    ⛔ 읽는 방법은 `check-iconmatch.mjs` 와 «같은 방법»이다 — 두 벌이 되면 반드시 갈린다.
//
// ☑️ 검수판 절대원칙(2026-08-19) = 고르기 ＋ 복사. 여기선 «후보를 누르면 그게 고른 것».
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-그림고르기-0914.mjs
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'

const ROOT = new URL('..', import.meta.url).pathname
const src = readFileSync(join(ROOT, 'src/components/FoodIcon.jsx'), 'utf8')
const store = readFileSync(join(ROOT, 'src/store.jsx'), 'utf8')

// ── 이름표 읽기 (check-iconmatch 와 같은 방법) ──
const names = {}
{
  const eStart = src.indexOf('EXTRA_NAMES = {')
  if (eStart > 0) for (const m of src.slice(eStart, src.indexOf('\n}', eStart)).matchAll(/([\w]+)\s*:\s*'([^']+)'/g)) names[m[1]] = m[2]
  const rBlock = src.slice(src.indexOf('const ICON_RULES = ['))
  const 본것 = new Set()
  for (const m of rBlock.matchAll(/\[\[\s*'([^']+)'[^\]]*\],\s*'([^']+)'\]/g)) {
    if (본것.has(m[2])) continue
    본것.add(m[2]); names[m[2]] = m[1]
  }
}
if (Object.keys(names).length < 100) { console.error('⛔ 이름표를 ' + Object.keys(names).length + '개밖에 못 읽었다 — 읽는 규칙이 깨졌다.'); process.exit(1) }

// ── 지금 붙는 그림 (표 다섯을 거친 뒤) ──
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
const 지금그림 = (제목, 시작) => {
  let g = 시작
  if (F38[제목]) g = F38[제목]
  if (FV88[제목]) g = FV88[제목]; else if (SV88[g]) g = SV88[g]
  if (SGR[g]) g = SGR[g]
  if (S0827[g]) g = S0827[g]
  return g
}

const { allBasicRecipes } = await import('../src/data/basics.js')

// 📮 창업자가 「바꿔」 한 여덟 ＋ 무엇으로 후보를 찾을지
const 바꿀것 = [
  { 제목: '김치볶음밥', 말: ['김치볶음밥', '볶음밥'] },
  { 제목: '간단 우삼겹 갈비탕', 말: ['갈비탕', '국밥', '당면', '곰탕'] },
  { 제목: '오징어숙회', 말: ['숙회', '오징어'] },
  { 제목: '충무김밥 오징어무침', 말: ['오징어무침', '무침', '김밥'] },
  { 제목: '간편갈비조림', 말: ['갈비조림', '갈비', '조림'] },
  { 제목: '갈비탕', 말: ['갈비탕', '곰탕', '설렁', '국'] },
  { 제목: '비빔밥 소스', 말: ['소스', '양념장', '고추장'] },
  { 제목: '삼겹살 꽈리고추', 말: ['꽈리고추', '삼겹', '고추'] },
]

const 이름들 = Object.entries(names)
const 임시 = mkdtempSync(join(tmpdir(), 'hankki-고르기-'))
const 폴더들 = ['src/assets/stickers/photo', 'src/assets/stickers/food', 'src/assets/stickers']
const 그림심기 = (키, 크기) => {
  let f = null
  for (const d of 폴더들) for (const ext of ['.png', '.webp', '.jpg']) {
    const p = join(ROOT, d, 키 + ext)
    if (existsSync(p)) { f = p; break }
    if (f) break
  }
  if (!f) return ''
  const 낼것 = join(임시, 키 + '_' + 크기 + '.png')
  execFileSync('python3', ['-c', `
from PIL import Image
im = Image.open(r'${f}').convert('RGBA')
im.thumbnail((${크기}, ${크기}), Image.LANCZOS)
im = im.quantize(colors=256, method=Image.FASTOCTREE).convert('RGBA')
im.save(r'${낼것}', optimize=True)
`])
  return 'data:image/png;base64,' + readFileSync(낼것).toString('base64')
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
let 줄들 = []
for (const { 제목, 말 } of 바꿀것) {
  const r = allBasicRecipes.find((x) => String(x.title).trim() === 제목)
  if (!r) { console.error('⛔ 못 찾음: ' + 제목); process.exit(1) }
  const 지금 = 지금그림(제목, r.icon)
  // 후보 모으기 — 지금 붙은 것은 뺀다(그건 왼쪽에 따로 보여준다)
  const 본것 = new Set([지금])
  const 후보 = []
  for (const w of 말) for (const [k, n] of 이름들) {
    if (본것.has(k) || !String(n).includes(w)) continue
    본것.add(k); 후보.push({ 키: k, 이름: n })
  }
  const 재료 = (r.ingredients || []).filter((x) => !String(x).startsWith('[')).slice(0, 3).map((x) => String(x).replace(/\s*\(.*?\)/g, '').trim())
  줄들.push({ 제목, 지금, 지금이름: names[지금] || '(이름표 없음)', 후보: 후보.slice(0, 16), 재료 })
}

// 그림 심기 — 지금 것은 크게(220), 후보는 작게(150)
for (const 줄 of 줄들) {
  줄.지금그림 = 그림심기(줄.지금, 220)
  for (const c of 줄.후보) c.그림 = 그림심기(c.키, 150)
  줄.후보 = 줄.후보.filter((c) => c.그림)
  console.log('· ' + 줄.제목 + ' — 후보 ' + 줄.후보.length + '개')
}

const 블록 = 줄들.map((줄, i) => `
<section class="편" data-t="${esc(줄.제목)}">
  <h2><span class="n">${i + 1}</span> ${esc(줄.제목)}</h2>
  <div class="재료">${esc(줄.재료.join(' · '))}</div>
  <div class="줄">
    <div class="지금">
      <div class="딱지">지금 이거</div>
      <div class="칸그림">${줄.지금그림 ? `<img src="${줄.지금그림}">` : '(없음)'}</div>
      <div class="키">${esc(줄.지금)} · ${esc(줄.지금이름)}</div>
    </div>
    <div class="후보들">
      ${줄.후보.map((c) => `<button class="후보" data-k="${esc(c.키)}" data-n="${esc(c.이름)}">
        <img src="${c.그림}"><span>${esc(c.이름)}</span><small>${esc(c.키)}</small>
      </button>`).join('')}
      ${줄.후보.length ? '' : '<div class="없음">비슷한 이름표가 붙은 컷이 없어 — 새로 뽑아야 해</div>'}
    </div>
  </div>
  <div class="고른것" data-for="${esc(줄.제목)}">아직 안 골랐어</div>
</section>`).join('\n')

const html = `<!doctype html><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>그림 다시 고르기 8편</title>
<style>
  :root { color-scheme: light }
  body { margin:0; background:#FAF7F2; font-family:system-ui,-apple-system,'Malgun Gothic',sans-serif; color:#3A2A20; padding-bottom:130px }
  h1 { font-size:25px; margin:20px 16px 6px }
  .안내 { margin:0 16px 16px; font-size:15.5px; line-height:1.6; color:#6B5646 }
  .안내 b { color:#8A4A28 }
  .편 { background:#fff; border:2px solid #E6DCD2; border-radius:18px; margin:0 16px 16px; padding:14px }
  .편 h2 { font-size:20px; margin:0 0 4px; display:flex; align-items:center; gap:8px }
  .n { background:#5C4535; color:#fff; border-radius:999px; padding:1px 10px; font-size:15px }
  .재료 { font-size:13.5px; color:#7A6555; margin-bottom:10px }
  .줄 { display:flex; gap:12px; align-items:flex-start }
  .지금 { flex:0 0 120px; text-align:center }
  .딱지 { font-size:12.5px; font-weight:800; color:#B4482A; background:#FBE3D8; border-radius:999px; padding:2px 0; margin-bottom:5px }
  .칸그림 { height:110px; display:flex; align-items:center; justify-content:center }
  .칸그림 img { max-width:100%; max-height:100% }
  .키 { font-size:11.5px; color:#9C8878; margin-top:3px; line-height:1.3 }
  .후보들 { flex:1; display:grid; grid-template-columns:repeat(auto-fill,minmax(86px,1fr)); gap:8px }
  .후보 { background:#FBF8F4; border:2px solid #E6DCD2; border-radius:12px; padding:6px 4px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:2px }
  .후보 img { width:100%; height:66px; object-fit:contain }
  .후보 span { font-size:12px; font-weight:700; line-height:1.25; text-align:center; color:#4A3728 }
  .후보 small { font-size:10.5px; color:#A4907E }
  .후보.on { border-color:#6E9C5E; background:#F1F8EE; box-shadow:0 0 0 2px #6E9C5E inset }
  .없음 { font-size:14px; color:#B4482A; padding:14px }
  .고른것 { margin-top:10px; font-size:14.5px; font-weight:700; color:#9C8878 }
  .고른것.차있음 { color:#3E7A2E }
  .바 { position:fixed; left:0; right:0; bottom:0; background:#fff; border-top:2px solid #E6DCD2; padding:12px 16px; display:flex; gap:10px; align-items:center }
  .셈 { font-size:15px; font-weight:700; flex:1 }
  .바 button { padding:11px 16px; border-radius:12px; border:0; background:#5C4535; color:#fff; font-size:15.5px; font-weight:800; cursor:pointer }
  #답 { margin:0 16px; width:calc(100% - 32px); min-height:110px; font-size:14px; display:none; border:2px solid #DCCFC2; border-radius:12px; padding:10px }
</style>
<h1>그림 다시 고르기 — 8편</h1>
<div class="안내">
  왼쪽 <b>「지금 이거」</b>가 지금 붙어 있는 그림이야.<br>
  오른쪽에서 <b>맞는 걸 눌러</b>줘. 마음에 드는 게 없으면 안 눌러도 돼 — 그럼 <b>새로 뽑아야 한다</b>고 적을게.<br>
  다 되면 맨 아래 <b>복사하기</b>.
</div>
${블록}
<textarea id="답" readonly></textarea>
<div class="바"><span class="셈" id="셈">고른 것 0 / 8</span><button id="복사">복사하기</button></div>
<script>
  var KEY = 'hankki:그림고르기:0914'
  var 고름 = {}
  try { 고름 = JSON.parse(localStorage.getItem(KEY) || '{}') } catch (e) { 고름 = {} }
  var 편들 = [].slice.call(document.querySelectorAll('.편'))
  function 칠하기() {
    편들.forEach(function (s) {
      var t = s.dataset.t, 골랐나 = 고름[t]
      s.querySelectorAll('.후보').forEach(function (b) { b.classList.toggle('on', !!골랐나 && b.dataset.k === 골랐나.k) })
      var 칸 = s.querySelector('.고른것')
      칸.textContent = 골랐나 ? ('고름 → ' + 골랐나.n + ' (' + 골랐나.k + ')') : '아직 안 골랐어'
      칸.classList.toggle('차있음', !!골랐나)
    })
    document.getElementById('셈').textContent = '고른 것 ' + Object.keys(고름).length + ' / ' + 편들.length
  }
  편들.forEach(function (s) {
    s.querySelectorAll('.후보').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = s.dataset.t
        if (고름[t] && 고름[t].k === b.dataset.k) delete 고름[t]
        else 고름[t] = { k: b.dataset.k, n: b.dataset.n }
        try { localStorage.setItem(KEY, JSON.stringify(고름)) } catch (e) {}
        칠하기()
      })
    })
  })
  칠하기()
  document.getElementById('복사').addEventListener('click', function () {
    var 줄 = []
    편들.forEach(function (s) {
      var t = s.dataset.t, g = 고름[t]
      줄.push(t + ' -> ' + (g ? g.k + ' (' + g.n + ')' : '새로 뽑아야 함'))
    })
    var 글 = '그림 다시 고르기 (8편)\\n\\n' + 줄.join('\\n')
    var ta = document.getElementById('답')
    ta.value = 글; ta.style.display = 'block'
    try { if (navigator.clipboard) navigator.clipboard.writeText(글) } catch (e) {}
    ta.focus(); ta.setSelectionRange(0, 글.length)
    ta.scrollIntoView({ block: 'center' })
  })
</script>`

const 낼곳 = process.env.CLAUDE_SCRATCHPAD_DIR || '/tmp'
const 파일 = join(낼곳, '그림고르기-0914.html')
writeFileSync(파일, html)
console.log('✅ ' + 파일 + '  (' + Math.round(html.length / 1024) + 'KB)')
