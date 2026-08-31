// 🧹🧹 「카와이 전수 판정판」 — 옛 세대 음식 컷 650장을 창업자가 한 화면에서 가른다
//
// 📮 창업자 2026-08-31 = *"카와이 아직도 들어있는게 있었어. 이거 다 빼야해. 빼고 완전 삭제."* ·
//    *"카와이는 영구삭제해줘"* · *"카와이 아닌 것도 있엉.."* · *"**다 보여줘도 돼 뿌리를 뽑자**"*
//
// ⭐⭐ **왜 전수인가** — 지금까지 세 번 «목록»으로 잡으려다 매번 몇 개씩 샜다
//    (v88 표 · 0827 표 · v96 목록). 뿌리는 「어느 컷이 카와이인지 아무도 «전부» 안 본 것」이다.
//
// ⛔ **판정은 창업자가 한다**(규칙 11) — 나는 «후보를 좁히고 정렬»만 한다.
//    🔬 잣대 = **볼터치** = 그릇 아래쪽의 연분홍 픽셀 비율.
//       실측으로 갈린다 — 카와이 표본 11장 전부 **5.8% 이상**, 사진 표본은 대개 1% 미만.
//       ⚠️ 다만 «분홍 음식»(회·크림파스타)이 섞여 들어온다 → 그래서 «판정»이 아니라 «정렬»에만 쓴다.
//
// ⛔ 창업자가 650번 누르게 하지 않는다(규칙 8) — **기본값을 「카와이」로 켜두고 «아닌 것만» 끄게** 한다.
//    ⭐ 볼터치가 높은 순으로 세워서, 위쪽은 그냥 두고 아래로 갈수록 끄면 된다.
// ☑️ 절대원칙 = **체크 ＋ 복사**(창업자 2026-08-19 *"무조건 검수판은 체크+복사되게"*)
//
// 실행: node /home/user/hankki/hankki/scripts/_판-카와이전수-0831.mjs
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const PHOTO = join(ROOT, 'src/assets/stickers/photo')
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/카와이전수'
mkdirSync(OUT, { recursive: true })

const 옛 = /^(fe_|fh_|fy_|fj_|fi_|fb_)/
let keys = readdirSync(PHOTO).filter((f) => f.endsWith('.png') && 옛.test(f)).map((f) => f.slice(0, -4)).sort()

// 🔁🔁 **2차 전수 — 「안 켠 것」만 다시 본다** (창업자 2026-08-31 *"전수할게 보여줘"*)
//
//   ⭐⭐ 왜 또 보나 — 창업자가 `fy_y05`(샐러드)를 **카와이라고 했다**. 그 컷은 «얼굴이 없다».
//      그릇에 **분홍 하트**가 있을 뿐이다. 📌 **창업자 잣대는 「얼굴」보다 넓다 — 옛 파스텔 일러스트 세대 전체다.**
//      그러면 1차에서 「얼굴 없음」이라 안 켠 219장에도 같은 게 남아 있다.
//   ⛔ 기계로는 못 가른다 — 볼터치·평평함 둘 다 재봤는데 사진과 «완전히 겹친다»(9~27 vs 9~27).
//      그래서 이번엔 **기본값을 전부 꺼두고** 창업자가 켜는 쪽으로 뒤집는다.
//   ⛔ 저장 열쇠도 갈라 둔다 — 1차 결과 위에 덮어쓰면 431장이 날아간다.
const 둘째판 = process.argv.includes('--안켠것')
let 켤것 = (p) => p >= 4
let 열쇠 = 'hankki:kawaii:0831'
let 제목 = '카와이 전수 판정'
let 안내 = '얼굴(눈·볼터치)이 있으면 <b>카와이</b>. 볼터치가 진한 순으로 세웠어요.<br>'
  + '⓵ 스크롤하다 <b>「카와이가 끝나는 자리」</b>에서 <b>↥ 여기까지</b>를 한 번 누르면 앞은 전부 켜지고 뒤는 꺼져요.<br>'
  + '⓶ 그다음 <b>어긋난 것만</b> 눌러서 고쳐요 — <b>아래쪽에도 카와이가 섞여 있어요</b>(볼이 옅으면 기계가 못 잡아요).'
let 파일 = '카와이전수.html'
if (둘째판) {
  const 이미 = new Set(JSON.parse(readFileSync(join(ROOT, 'docs/stickers/카와이-전수판정-2026-08-31.json'), 'utf8')).카와이)
  keys = keys.filter((k) => !이미.has(k))
  켤것 = () => false            // ⛔ 전부 꺼둔 채로 — 1차에서 「아니다」로 본 것들이라 «켜는» 쪽이 손이 덜 간다
  열쇠 = 'hankki:kawaii:0831b'  // ⛔ 1차와 갈라 둔다
  제목 = '카와이 2차 — 안 켠 것만'
  안내 = '1차에서 <b>안 켠 것</b>만 모았어요. <b>카와이인 것만 눌러서 켜면</b> 돼요.<br>'
    + '⭐ <b>얼굴이 없어도</b> 옛 파스텔 일러스트면 카와이예요 — <b>fy_y05(샐러드)</b>가 그랬어요(그릇에 분홍 하트).<br>'
    + '<b>↥ 여기까지</b>를 누르면 앞이 한 번에 켜져요.'
  파일 = '카와이2차.html'
}

// 🔬 볼터치 재기 ＋ 썸네일 굽기 — ⛔원본을 그대로 심으면 130MB 라 판이 안 열린다(상한 16MB)
const py = `
import sys, json, base64, io
from PIL import Image
import numpy as np
D = ${JSON.stringify(PHOTO)} + '/'
out = {}
for k in json.load(sys.stdin):
    im = Image.open(D + k + '.png').convert('RGBA')
    a = np.array(im).astype(np.int16); h, w, _ = a.shape
    band = a[int(h*0.60):, :, :]
    r, g, b, al = band[...,0], band[...,1], band[...,2], band[...,3]
    m = (al>128)&(r>225)&(r-g>16)&(r-g<70)&(g>=b-12)&(g<=b+30)&(g>165)
    tot = max(1, (al>128).sum())
    # 썸네일 — 흰 바탕에 얹어 JPEG 로(투명 PNG 는 무겁다)
    im.thumbnail((150, 150), Image.LANCZOS)
    bg = Image.new('RGB', im.size, (255, 255, 255)); bg.paste(im, mask=im.split()[3])
    buf = io.BytesIO(); bg.save(buf, 'JPEG', quality=72, optimize=True)
    out[k] = [round(float(100*m.sum()/tot), 2), base64.b64encode(buf.getvalue()).decode()]
json.dump(out, sys.stdout)
`
const 잰것 = JSON.parse(execFileSync('python3', ['-c', py], { input: JSON.stringify(keys), maxBuffer: 1 << 30, encoding: 'utf8' }))

// 볼터치 높은 순 — 위쪽이 카와이일 가능성이 크다
const rows = keys.map((k) => ({ k, p: 잰것[k][0], img: 잰것[k][1] })).sort((a, b) => b.p - a.p)
const 큼 = rows.filter((r) => r.p >= 4).length

// 어디에 쓰이나 — 창업자가 「이거 빼도 되나」를 판단할 재료
const F = readFileSync(join(ROOT, 'src/components/FoodIcon.jsx'), 'utf8')
const pi = F.indexOf('FOOD_ICON_GROUPS')
const 픽커 = new Set([...F.slice(pi).matchAll(/'([a-z]{2,3}_[A-Za-z0-9_]+)'/g)].map((m) => m[1]))
const 규칙 = new Set([...F.slice(F.indexOf('ICON_RULES'), pi).matchAll(/\],\s*'([a-z]{2,3}_[A-Za-z0-9_]+)'\s*\]/g)].map((m) => m[1]))
const B = readFileSync(join(ROOT, 'src/data/basics.js'), 'utf8')
const 씨앗 = new Set([...B.matchAll(/icon:\s*'([^']+)'/g)].map((m) => m[1]))

const 칸 = rows.map((r, i) => {
  const 태그 = [r.k in Object.fromEntries([...씨앗].map((x) => [x, 1])) ? '씨앗' : null,
    픽커.has(r.k) ? '서랍' : null, 규칙.has(r.k) ? '규칙' : null].filter(Boolean)
  return `<label class="c" data-k="${r.k}" data-p="${r.p}">
  <input type="checkbox" ${켤것(r.p) ? 'checked' : ''}>
  <img loading="lazy" src="data:image/jpeg;base64,${r.img}" alt="">
  <b>${r.k}</b><i>${r.p}%</i>${태그.length ? `<u>${태그.join(' · ')}</u>` : ''}
  <s>${i + 1}</s><button class="upto" type="button" data-i="${i}" title="여기까지 전부 카와이로">↥ 여기까지</button></label>`
}).join('\n')

const html = `<title>${제목}</title>
<style>
:root{--bg:#faf7f2;--ink:#2b2620;--sub:#8a7f70;--line:#e9e0d2;--hit:#c2410c;--no:#8a99a6;--card:#fff}
:root:not([data-theme="light"]){}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#191714;--ink:#efe7da;--sub:#9d9284;--line:#332e27;--card:#221f1a}}
:root[data-theme="dark"]{--bg:#191714;--ink:#efe7da;--sub:#9d9284;--line:#332e27;--card:#221f1a}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--ink);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;margin:0;padding:0 0 96px}
header{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--line);padding:14px 16px 10px}
h1{font-size:19px;margin:0 0 3px;letter-spacing:-.02em}
.lead{color:var(--sub);font-size:14px;margin:0 0 10px;word-break:keep-all}
.bar{display:flex;gap:7px;flex-wrap:wrap;align-items:center}
button{font:inherit;font-weight:700;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;padding:7px 13px;cursor:pointer}
button.on{background:var(--hit);border-color:var(--hit);color:#fff}
.count{margin-left:auto;font-weight:800;font-variant-numeric:tabular-nums}
.count em{color:var(--hit);font-style:normal;font-size:19px}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;padding:12px 14px}
.c{position:relative;background:var(--card);border:2px solid var(--line);border-radius:14px;padding:8px 6px 7px;text-align:center;cursor:pointer;display:block}
.c:has(input:checked){border-color:var(--hit);background:color-mix(in srgb,var(--hit) 7%,var(--card))}
.c input{position:absolute;inset:0;opacity:0;cursor:pointer;margin:0;width:100%;height:100%}
.c img{width:100%;aspect-ratio:1;object-fit:contain;display:block}
.c b{display:block;font-size:11.5px;margin-top:3px;font-weight:700;letter-spacing:-.01em}
.c i{display:block;font-size:11px;color:var(--sub);font-style:normal;font-variant-numeric:tabular-nums}
.c u{display:block;font-size:10.5px;color:var(--hit);text-decoration:none;margin-top:1px}
.c s{position:absolute;top:4px;left:6px;font-size:10px;color:var(--sub);text-decoration:none}
/* ↥ 「여기까지 전부 카와이」 — ⭐이 한 번의 탭이 650번 누르는 걸 없앤다(규칙 8).
   볼터치 정렬이 대체로 맞으니 «경계»만 옮기면 되고, 예외는 그다음에 하나씩 누른다.
   ⛔ 카드 전체가 라벨(체크박스)이라 그 위에 얹으면 클릭이 삼켜진다 → z-index 로 띄운다.
   ⛔ 그리고 카드 «위»에 얹으면 볼터치 % 글자를 가린다(실물로 보고 아래 줄로 뺐다 · 규칙 21). */
.c .upto{position:relative;z-index:2;display:block;width:100%;margin-top:5px;font-size:10.5px;font-weight:800;
  padding:4px 0;border-radius:8px;background:var(--bg);border:1px solid var(--line);color:var(--sub)}
.c:has(input:checked)::after{content:"카와이";position:absolute;top:4px;right:5px;font-size:10px;font-weight:800;color:#fff;background:var(--hit);border-radius:999px;padding:1px 6px}
footer{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);padding:11px 16px calc(11px + env(safe-area-inset-bottom));display:flex;gap:8px;align-items:center}
footer button{flex:1;padding:13px;border-radius:13px;background:var(--hit);border-color:var(--hit);color:#fff;font-size:16px}
#out{position:fixed;inset:auto 12px 76px;max-height:42vh;overflow:auto;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:11px;font:12px/1.5 ui-monospace,monospace;white-space:pre-wrap;word-break:break-all;display:none}
</style>
<header>
  <h1>${제목} · ${rows.length}장</h1>
  <p class="lead">${안내}</p>
  <div class="bar">
    <button id="f-all" class="on">전체</button>
    <button id="f-on">카와이만</button>
    <button id="f-off">아님만</button>
    <button id="none">전부 끄기</button>
    <span class="count"><em id="n">0</em> / ${rows.length}</span>
  </div>
</header>
<main id="g">
${칸}
</main>
<div id="out"></div>
<footer>
  <button id="copy">결과 복사하기</button>
</footer>
<script>
const g = document.getElementById('g'), n = document.getElementById('n');
const boxes = () => [...g.querySelectorAll('input')];
const KEY = '${열쇠}';
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(boxes().filter(b=>b.checked).map(b=>b.closest('.c').dataset.k))) }catch(e){} }
function load(){
  let v = null; try{ v = JSON.parse(localStorage.getItem(KEY)||'null') }catch(e){}
  if (!v) return;
  const s = new Set(v);
  boxes().forEach(b => { b.checked = s.has(b.closest('.c').dataset.k) });
}
function tick(){ n.textContent = boxes().filter(b=>b.checked).length; }
load(); tick();
g.addEventListener('change', () => { tick(); save(); });
const F = { 'f-all':()=>true, 'f-on':c=>c.querySelector('input').checked, 'f-off':c=>!c.querySelector('input').checked };
for (const id of Object.keys(F)) document.getElementById(id).addEventListener('click', e => {
  document.querySelectorAll('.bar button').forEach(b=>b.classList.remove('on')); e.target.classList.add('on');
  [...g.children].forEach(c => { c.hidden = !F[id](c) });
});
document.getElementById('none').addEventListener('click', () => { boxes().forEach(b=>b.checked=false); tick(); save(); });
// ↥ 「여기까지」 — 앞(자기 포함)은 전부 켜고 뒤는 전부 끈다
g.addEventListener('click', (e) => {
  const u = e.target.closest('.upto'); if (!u) return;
  e.preventDefault(); e.stopPropagation();
  const i = +u.dataset.i;
  boxes().forEach((b, j) => { b.checked = j <= i; });
  tick(); save();
});
document.getElementById('copy').addEventListener('click', async () => {
  const on = boxes().filter(b=>b.checked).map(b=>b.closest('.c').dataset.k);
  const t = '카와이 ' + on.length + '장\\n' + on.join(' ');
  const box = document.getElementById('out');
  // ⛔ clipboard 는 «성공으로 resolve 되고도» 실제 복사가 안 되는 폰이 있다(v10.97) → 글자를 골라 준다
  try { await navigator.clipboard.writeText(t); box.textContent = '복사했어요 (' + on.length + '장)\\n\\n' + t; }
  catch (e) { box.textContent = t; }
  box.style.display = 'block';
  const r = document.createRange(); r.selectNodeContents(box);
  const s = getSelection(); s.removeAllRanges(); s.addRange(r);
});
</script>`

const p = join(OUT, 파일)
writeFileSync(p, html)
console.log(`📇 ${p}  (${rows.length}장 · 볼터치 4%↑ 로 켜둔 것 ${큼}장 · ${(html.length / 1048576).toFixed(1)}MB)`)
