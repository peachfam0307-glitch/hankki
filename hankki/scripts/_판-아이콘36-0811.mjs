// 🍱 창업자 판정판 — 36편에 «어떤 그림»이 붙나 (다시 뽑을 것 고르기)
//
// 📮 창업자 2026-08-11 *"음식사진 없는거 다 알려줘 다시뽑게."* → *"b부터 한번에 뽑게."*
//    ⭐ 「사진이 없는 것」만이 아니라 **「사진은 있는데 안 맞는 것」**까지 한 번에 본다.
//
// ⛔ 판정은 창업자가 한다(규칙 11) — 나는 «의심스러운 자리»만 표시한다.
//    · ⛔ 사진 없음        = 재료·도형 그림이 붙었다
//    · 🔁 같은 그림 겹침    = 여러 편이 한 그림을 쓴다(덮밥 3편이 같은 그림 등)
//    · 🕸 넓은 낱말로 걸림  = 「조림」·「밥」·「참치」처럼 요리 이름이 아닌 말에 걸렸다
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const 뿌리 = new URL('../', import.meta.url)
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const 편 = JSON.parse(readFileSync(new URL('docs/_대기/레시피-정리-초안-2026-08-10.json', 뿌리), 'utf8'))
const src = readFileSync(new URL('src/components/FoodIcon.jsx', 뿌리), 'utf8')

const 본문 = src.slice(src.indexOf('const ICON_RULES = ['))
const 규칙 = [...본문.matchAll(/\[\s*\[([^\]]*)\]\s*,\s*'([^']+)'\s*\]/g)]
  .map((m) => ({ keys: [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]).filter(Boolean), key: m[2] }))
  .filter((r) => r.keys.length)
if (규칙.length < 100) { console.error(`⛔ ICON_RULES 를 ${규칙.length}개밖에 못 읽었다`); process.exit(1) }

// 🕸 「요리 이름이 아닌」 넓은 낱말 — 이걸로 걸리면 그 요리 전용 그림이 아니다
const 넓은말 = ['조림', '밥', '덮밥', '참치', '소스', '파스타', '샐러드', '치킨', '볶음', '무침', '구이', '전', '찌개', '국', '탕', '면']

const 잰것 = 편.map((r) => {
  const hit = 규칙.find((x) => x.keys.some((k) => r.title.includes(k)))
  const key = hit?.key || 'default'
  const 걸린말 = hit?.keys.find((k) => r.title.includes(k)) || '-'
  const png = new URL(`src/assets/stickers/photo/${key}.png`, 뿌리)
  return { 제목: r.title, key, 걸린말, 사진: existsSync(png), png, cat: r.cat }
})
const 셈 = {}
잰것.forEach((r) => { if (r.사진) 셈[r.key] = (셈[r.key] || 0) + 1 })
잰것.forEach((r) => {
  r.겹침 = r.사진 && 셈[r.key] > 1 ? 셈[r.key] : 0
  r.넓음 = r.사진 && 넓은말.includes(r.걸린말)
})

// 🖼 그림을 작게 줄여 판에 넣는다 — 판정엔 220px 이면 넉넉하고, 원본 5.9MB 를 폰에 지울 이유가 없다
const 작게 = (p) => {
  try {
    const py = `import base64,io,sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGBA')
im.thumbnail((220,220))
b = io.BytesIO(); im.save(b, 'PNG', optimize=True)
print(base64.b64encode(b.getvalue()).decode())`
    return execFileSync('python3', ['-c', py, p], { maxBuffer: 1 << 26 }).toString().trim()
  } catch { return '' }
}
for (const r of 잰것) r.b64 = r.사진 ? 작게(r.png.pathname) : ''
const 빈그림 = 잰것.filter((r) => r.사진 && !r.b64)
if (빈그림.length) { console.error(`⛔ 그림을 못 줄인 편 ${빈그림.length} — 판이 빈 칸으로 나간다`); process.exit(1) }

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const 없음 = 잰것.filter((r) => !r.사진).length
const 겹침수 = 잰것.filter((r) => r.겹침).length
const 넓음수 = 잰것.filter((r) => r.넓음 && !r.겹침).length

const 카드 = 잰것.map((r) => {
  const 뱃지 = !r.사진 ? '<span class="b bad">⛔ 사진 없음</span>'
    : r.겹침 ? `<span class="b dup">🔁 ${r.겹침}편이 같은 그림</span>`
    : r.넓음 ? '<span class="b wide">🕸 넓은 낱말</span>' : '<span class="b ok">✅</span>'
  const 갈래 = !r.사진 ? 'bad' : r.겹침 ? 'dup' : r.넓음 ? 'wide' : 'ok'
  const 그림 = r.b64
    ? `<img src="data:image/png;base64,${r.b64}" alt="">`
    : `<div class="none">그림 없음<br><small>${esc(r.key)}</small></div>`
  return `<article class="rc" data-it data-g="${갈래}" data-q="${esc(r.제목)} ${esc(r.key)}">
  <div class="pic">${그림}</div>
  <div class="txt"><h3>${esc(r.제목)}</h3>
    <p class="meta">붙은 그림 <code>${esc(r.key)}</code> · 걸린 낱말 「${esc(r.걸린말)}」</p>
    ${뱃지}</div></article>`
}).join('')

const html = `<title>레시피 36편 — 붙는 그림 확인</title>
<style>
:root{--bg:#F7F4EC;--surface:#FFFDF8;--ink:#3A2A1C;--muted:#8A7660;--line:#E5DCCB;
 --ok:#5F7A5A;--ok-bg:#E9F0E6;--bad:#A05A5A;--bad-bg:#F4E6E3;--dup:#8A5A18;--dup-bg:#F6E7C9;
 --wide:#5878A0;--wide-bg:#EAF0F7;--shadow:0 1px 2px rgba(58,42,28,.06),0 8px 24px rgba(58,42,28,.05);}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#191510;--surface:#231E17;--ink:#EFE6D8;
 --muted:#A5927A;--line:#392F23;--ok:#93B58B;--ok-bg:#22301F;--bad:#D28E8E;--bad-bg:#331E1E;
 --dup:#E7BF7A;--dup-bg:#3A2C13;--wide:#8CAFD6;--wide-bg:#1C2530;--shadow:0 1px 2px rgba(0,0,0,.4),0 8px 24px rgba(0,0,0,.35);}}
:root[data-theme="dark"]{--bg:#191510;--surface:#231E17;--ink:#EFE6D8;--muted:#A5927A;--line:#392F23;
 --ok:#93B58B;--ok-bg:#22301F;--bad:#D28E8E;--bad-bg:#331E1E;--dup:#E7BF7A;--dup-bg:#3A2C13;
 --wide:#8CAFD6;--wide-bg:#1C2530;--shadow:0 1px 2px rgba(0,0,0,.4),0 8px 24px rgba(0,0,0,.35);}
/* ⛔ 한국어는 «낱말 중간»에서 넘어간다 — 기본값이면 「다시」가 「다 / 시」로 쪼개진다(2026-08-11 실물에서 잡음).
   keep-all = 낱말 단위로만 넘김 · overflow-wrap:anywhere = 그래도 안 들어가는 긴 영문(id 등)만 쪼갠다. 둘은 «짝»이다. */
*{box-sizing:border-box;word-break:keep-all;overflow-wrap:anywhere} body{margin:0;background:var(--bg);color:var(--ink);line-height:1.6;
 font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;-webkit-text-size-adjust:100%}
.wrap{max-width:720px;margin:0 auto;padding:0 13px 56px}
.hero{padding:24px 0 4px}
.kicker{font-size:12px;letter-spacing:.14em;color:var(--muted);font-weight:700;margin:0 0 6px}
h1{margin:0 0 8px;font-size:24px;line-height:1.3;text-wrap:balance}
.lead{margin:0;color:var(--muted);font-size:14.5px}
.sum{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:15px 0 0}
.card{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px;box-shadow:var(--shadow)}
.card b{display:block;font-size:20px;font-variant-numeric:tabular-nums;line-height:1.15}
.card span{font-size:11.5px;color:var(--muted)}
.card.a b{color:var(--bad)} .card.b2 b{color:var(--dup)} .card.c b{color:var(--wide)} .card.d b{color:var(--ok)}
.find{position:sticky;top:0;z-index:5;margin:15px -13px 0;padding:10px 13px;background:var(--bg)}
.findbox{display:flex;align-items:center;gap:9px;background:var(--surface);border:1px solid var(--line);
 border-radius:12px;padding:9px 12px;box-shadow:var(--shadow)}
#q{flex:1;min-width:0;border:0;background:transparent;color:var(--ink);font:inherit;font-size:15px;outline:none}
.chips{display:flex;gap:6px;margin:8px 0 0;flex-wrap:wrap}
.chip{font-size:12.5px;font-weight:700;padding:5px 11px;border-radius:999px;border:1px solid var(--line);
 background:var(--surface);color:var(--muted);cursor:pointer}
.chip[aria-pressed="true"]{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.rc{display:flex;gap:13px;align-items:center;margin:11px 0 0;background:var(--surface);border:1px solid var(--line);
 border-radius:15px;padding:12px 14px;box-shadow:var(--shadow)}
.rc[data-g="bad"]{border-left:3px solid var(--bad)}
.rc[data-g="dup"]{border-left:3px solid var(--dup)}
.rc[data-g="wide"]{border-left:3px solid var(--wide)}
.pic{flex:0 0 92px;height:92px;display:flex;align-items:center;justify-content:center;
 background:var(--bg);border-radius:13px;overflow:hidden}
.pic img{width:100%;height:100%;object-fit:contain}
.none{font-size:11px;color:var(--bad);text-align:center;line-height:1.4}
.txt{min-width:0;flex:1}
.rc h3{margin:0 0 3px;font-size:17px;letter-spacing:-.01em}
.meta{margin:0 0 6px;font-size:12.5px;color:var(--muted)}
code{background:var(--bg);border-radius:5px;padding:1px 5px;font-size:12px}
.b{display:inline-block;font-size:11.5px;font-weight:800;padding:3px 9px;border-radius:7px}
.b.ok{background:var(--ok-bg);color:var(--ok)} .b.bad{background:var(--bad-bg);color:var(--bad)}
.b.dup{background:var(--dup-bg);color:var(--dup)} .b.wide{background:var(--wide-bg);color:var(--wide)}
.rc.hide{display:none}
#cnt{margin:7px 2px 0;font-size:12.5px;color:var(--muted);min-height:19px}
#cnt b{color:var(--ink)}
.foot{margin:28px 0 0;padding:15px;background:var(--surface);border:1px solid var(--line);border-radius:14px;
 font-size:13.5px;color:var(--muted);line-height:1.7}
.foot b{color:var(--ink)}
</style>
<div class="wrap">
 <div class="hero">
  <p class="kicker">한끼 · 레시피 36편</p>
  <h1>이 그림이 맞아? 다시 뽑을 것 골라줘</h1>
  <p class="lead">36편에 <b>지금 붙는 그림</b>을 다 띄웠어. 이상한 것만 짚어주면 그것만 다시 뽑으면 돼.</p>
  <div class="sum">
   <div class="card a"><b>${없음}</b><span>⛔ 사진 없음</span></div>
   <div class="card b2"><b>${겹침수}</b><span>🔁 겹침</span></div>
   <div class="card c"><b>${넓음수}</b><span>🕸 넓은 낱말</span></div>
   <div class="card d"><b>${잰것.length - 없음 - 겹침수 - 넓음수}</b><span>✅ 괜찮아 보임</span></div>
  </div>
 </div>
 <div class="find">
  <div class="findbox">
   <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="var(--muted)" stroke-width="1.9" stroke-linecap="round"><circle cx="8.5" cy="8.5" r="5.5"/><path d="M12.8 12.8 17 17"/></svg>
   <input id="q" type="search" placeholder="레시피 이름 찾기 (ㅁㅍㄷㅂ 도 돼)" autocomplete="off">
  </div>
  <div class="chips">
   <button class="chip" data-f="all" aria-pressed="true">전체 ${잰것.length}</button>
   <button class="chip" data-f="bad" aria-pressed="false">⛔ 사진 없음 ${없음}</button>
   <button class="chip" data-f="dup" aria-pressed="false">🔁 겹침 ${겹침수}</button>
   <button class="chip" data-f="wide" aria-pressed="false">🕸 넓은 낱말 ${넓음수}</button>
  </div>
  <p id="cnt"></p>
 </div>
 ${카드}
 <div class="foot">
  ⭐ <b>표시 뜻</b><br>
  ⛔ <b>사진 없음</b> — 요리 사진이 아니라 «재료 그림»이 붙었어(새우·브로콜리).<br>
  🔁 <b>겹침</b> — 여러 편이 «한 그림»을 나눠 쓰고 있어. 덮밥 셋이 다 같은 그림인 식.<br>
  🕸 <b>넓은 낱말</b> — 「조림」·「밥」·「참치」처럼 요리 이름이 아닌 말에 걸렸어.
     그림이 그럴듯해도 <b>그 요리 전용은 아니야.</b><br><br>
  ⛔ <b>「괜찮아 보임」도 내가 판정한 게 아니야</b> — 규칙에 잘 걸렸다는 뜻이지 그림이 맞는지는 네 눈이 정해.
 </div>
</div>
<script>
(function(){
 var CHO='\\u3131\\u3132\\u3134\\u3137\\u3138\\u3139\\u3141\\u3142\\u3143\\u3145\\u3146\\u3147\\u3148\\u3149\\u314A\\u314B\\u314C\\u314D\\u314E'
 function chos(s){var o='';for(var i=0;i<s.length;i++){var c=s.charCodeAt(i)
  o+=(c>=0xAC00&&c<=0xD7A3)?CHO.charAt(Math.floor((c-0xAC00)/588)):s.charAt(i)}return o}
 var q=document.getElementById('q'),cnt=document.getElementById('cnt')
 var its=[].slice.call(document.querySelectorAll('[data-it]'))
 its.forEach(function(el){var t=(el.getAttribute('data-q')||'').toLowerCase().replace(/\\s/g,'');el._t=t;el._c=chos(t)})
 var mode='all'
 function run(){
  var v=q.value.toLowerCase().replace(/\\s/g,''), onlyCho=/^[\\u3131-\\u314E]+$/.test(v), n=0
  its.forEach(function(el){
   var okF = mode==='all' || el.getAttribute('data-g')===mode
   var okQ = !v || (onlyCho?el._c.indexOf(v)>=0:el._t.indexOf(v)>=0)
   var show = okF && okQ
   el.classList.toggle('hide',!show); if(show)n++
  })
  cnt.innerHTML = (v||mode!=='all') ? ('<b>'+n+'</b>편 보임') : ''
 }
 q.addEventListener('input',run)
 document.querySelectorAll('.chip').forEach(function(c){
  c.addEventListener('click',function(){
   mode=c.getAttribute('data-f')
   document.querySelectorAll('.chip').forEach(function(x){x.setAttribute('aria-pressed', String(x===c))})
   run()
  })
 })
})()
</script>`
writeFileSync(`${OUT}/아이콘36.html`, html)
console.log(`OK ${Math.round(html.length / 1024)}KB · ${잰것.length}편 · ⛔${없음} 🔁${겹침수} 🕸${넓음수}`)
console.log('\n🔁 같은 그림을 나눠 쓰는 것:')
Object.entries(셈).filter(([, n]) => n > 1).forEach(([k, n]) =>
  console.log(`   ${k} (${n}편) — ${잰것.filter((r) => r.key === k).map((r) => r.제목).join(' · ')}`))
