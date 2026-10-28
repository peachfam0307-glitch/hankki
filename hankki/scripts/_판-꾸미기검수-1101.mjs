// 🎨 11/1 «저절로» 열리는 꾸미기 4갈래 27컷 검수판 (2026-10-19 · 창업자 「그것도 바로 할게」)
//   ⛔ 컷 목록을 손으로 적지 않는다 — Stickers.jsx 의 STICKER_GROUPS 에서 from 이 그날인 갈래를 읽는다(release-calendar 와 같은 자리).
//   ⭐ 원본 PNG 를 «줄이지 않고» 진한 판 · 밝은 판 두 바탕에 깐다(절대원칙 13) · 체크 ＋ 복사(절대원칙 2026-08-19)
//   실행: node scripts/_판-꾸미기검수-1101.mjs [날짜]  → $CLAUDE_SCRATCHPAD_DIR/꾸미기검수판-<날짜>.html
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
const 날 = process.argv[2] || '2026-11-01'
const APP = new URL('..', import.meta.url).pathname
const 글 = readFileSync(join(APP, 'src/components/Stickers.jsx'), 'utf8')
const 갈래들 = []
for (const m of 글.matchAll(/\{\s*key:\s*'([^']+)'[^\n]*?from:\s*'([^']+)'[^\n]*?label:\s*'([^']+)'[^\n]*?items:\s*\[([^\]]*)\]/g)) {
  if (m[2] !== 날) continue
  갈래들.push({ key: m[1], label: m[3], tab: (m[0].match(/tab:\s*'([^']+)'/) || [])[1] || '', items: [...m[4].matchAll(/'([^']+)'/g)].map((x) => x[1]) })
}
if (!갈래들.length) { console.error('⛔ 그날 열리는 갈래를 못 찾았다:', 날); process.exit(1) }
const 그림 = (k) => `data:image/png;base64,${readFileSync(join(APP, 'src/assets/stickers/photo', `${k}.png`)).toString('base64')}`
let 칸 = '', 수 = 0
for (const g of 갈래들) {
  칸 += `<h2>${g.label} <small>${g.tab} 탭 · ${g.items.length}컷</small></h2>`
  for (const k of g.items) {
    수++
    const src = 그림(k)
    칸 += `<div class="c" data-k="${g.label}|${k}"><div class="n">${k}</div><div class="two"><div class="dk"><img src="${src}"></div><div class="lt"><img src="${src}"></div></div>
<div class="b"><button data-v="좋다">좋다</button><button data-v="다시">다시</button><button data-v="모르겠다">모르겠다</button></div></div>`
  }
}
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>꾸미기 검수판 ${날}</title>
<style>:root{--bg:#faf7f2;--tx:#3a2f2a;--ac:#6e5a8f}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#1f1b19;--tx:#eee}}:root[data-theme="dark"]{--bg:#1f1b19;--tx:#eee}
body{margin:0;padding:16px;background:var(--bg);color:var(--tx);font-family:system-ui,sans-serif}h1{font-size:20px}h2{font-size:17px;margin:26px 0 8px}small{opacity:.6;font-weight:400}
.c{border:1px solid #8884;border-radius:12px;padding:10px;margin:10px 0}.n{font-size:13px;opacity:.7}.two{display:flex;gap:6px;flex-wrap:wrap}.two>div{flex:1 1 140px;border-radius:8px;padding:8px;display:flex;align-items:center;justify-content:center}
.dk{background:#2b2420}.lt{background:#fff}img{max-width:100%;height:auto}.b{display:flex;gap:6px;margin-top:8px}.b button{flex:1;padding:10px;border-radius:8px;border:1px solid #8886;background:transparent;color:inherit;font-size:15px}
.b button.on{background:var(--ac);color:#fff}#cp{position:sticky;bottom:8px;width:100%;padding:14px;border:0;border-radius:12px;background:var(--ac);color:#fff;font-size:16px;margin-top:20px}#out{white-space:pre-wrap;font-size:13px}</style></head><body>
<h1>🎨 ${날} 저절로 열리는 꾸미기 — ${갈래들.length}갈래 ${수}컷</h1><p>원본 크기 그대로 · 왼쪽 진한 바탕 / 오른쪽 흰 바탕. 칸마다 고르고 맨 아래 「복사하기」.</p>
${칸}<button id="cp">복사하기</button><div id="out"></div>
<script>const K='hankki-꾸미기검수-${날}';let s={};try{s=JSON.parse(localStorage.getItem(K)||'{}')}catch(e){}
document.querySelectorAll('.c').forEach(c=>{const k=c.dataset.k;c.querySelectorAll('button').forEach(b=>{if(s[k]===b.dataset.v)b.classList.add('on');b.onclick=()=>{s[k]=b.dataset.v;try{localStorage.setItem(K,JSON.stringify(s))}catch(e){}c.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))}})});
document.getElementById('cp').onclick=async()=>{const t='[꾸미기 검수 ${날}]\\n'+[...document.querySelectorAll('.c')].map(c=>'· '+c.dataset.k+' — '+(s[c.dataset.k]||'안 봄')).join('\\n');const o=document.getElementById('out');o.textContent=t;let ok=false;try{await navigator.clipboard.writeText(t);ok=true}catch(e){}const r=document.createRange();r.selectNodeContents(o);const sel=getSelection();sel.removeAllRanges();sel.addRange(r);document.getElementById('cp').textContent=ok?'복사했어요 (안 되면 아래 글을 길게 눌러 복사)':'아래 글을 길게 눌러 복사해 주세요'}</script></body></html>`
const 곳 = join(process.env.CLAUDE_SCRATCHPAD_DIR || '/tmp', `꾸미기검수판-${날}.html`)
writeFileSync(곳, html)
console.log(`✅ ${갈래들.map((g) => `${g.label}(${g.items.length})`).join(' · ')} = ${수}컷 → ${곳} (${Math.round(html.length / 1024)}KB)`)
