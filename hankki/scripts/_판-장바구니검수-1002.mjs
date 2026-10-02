// 🛒☑️ 다음 주 장바구니 검수판 — 창업자 2026-10-02 「토요일 장바구니 검수 다 끝났나? 다음주꺼 미리 다 검수할게. 보여줘」
//   ⭐ 값은 release-calendar 의 cartItems()(앱 화면이 쓰는 그 줄)에서 · 그림은 src/assets/curation 원본
//   ☑️ 검수판 절대원칙(2026-08-19) = 칸마다 고르기(localStorage) ＋ 맨 아래 복사
//   실행: SCRATCH=<scratchpad> node scripts/_판-장바구니검수-1002.mjs 2026-10-03 2026-10-10
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
const { cartItems } = await import('./release-calendar.mjs')
const APP = new URL('..', import.meta.url).pathname
const 날들 = process.argv.slice(2)
const S = process.env.SCRATCH || '/tmp/claude-0'
const items = cartItems().filter((it) => 날들.includes(it.from)).sort((a, b) => a.from.localeCompare(b.from))
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
const src = readFileSync(join(APP, 'src/data/curation.js'), 'utf8')
const 덩이 = (name) => { const i = src.indexOf(`name: '${name}'`); const j = src.indexOf('\n      {', i + 5); return src.slice(i, j > 0 ? j : i + 3000) }
const 값 = (blk, k) => (blk.match(new RegExp(`${k}:\\s*'([^']*)'`)) || [])[1] || ''
const 그림 = (k) => { const f = join(APP, 'src/assets/curation', k + '.png'); return existsSync(f) ? 'data:image/png;base64,' + readFileSync(f).toString('base64') : '' }
const 카드 = items.map((it, i) => {
  const b = 덩이(it.name)
  const 원재료 = 값(b, 'ingredients'), 알레르기 = 값(b, 'allergen'), 누가 = 값(b, 'who') || 값(b, 'ingWho')
  const 빠짐 = [!it.url && (it.mallRaw ? `상품 주소 없음(${it.mallRaw} 몰 검색으로 감)` : '링크 없음'), !원재료 && '원재료 없음(캡처 필요)', !it.ownIcon && '제 그림 없음'].filter(Boolean)
  const id = `c${i}`
  return `<div class="card"><div class="day">${it.from} · ${esc(it.cat)}</div>
  <div class="row"><img src="${그림(it.icon)}" class="ic"><img src="${그림(it.icon)}" class="ic42"><div><b>${esc(it.brand ? it.brand + ' ' : '')}${esc(it.name)}</b><div class="sub">${esc(it.mall || '')} · 그림 ${esc(it.icon)}</div></div></div>
  <div class="k">추천 글</div><div class="v">${esc(it.benefit)}</div>
  <div class="k">원재료</div><div class="v">${esc(원재료) || '—'}${알레르기 ? `<br><span class="sub">알레르기 ${esc(알레르기)}</span>` : ''}</div>
  <div class="k">사러가기</div><div class="v">${it.url ? `<a href="${esc(it.url)}" target="_blank">${esc(it.url.slice(0, 60))}…</a>` : '—'}</div>
  ${빠짐.length ? `<div class="warn">⚠️ ${빠짐.join(' · ')}</div>` : ''}
  <div class="pick" data-id="${id}" data-name="${esc(it.from + ' ' + it.name)}"><button data-v="좋아">좋아</button><button data-v="고칠것">고칠 것</button><button data-v="모르겠다">모르겠다</button></div>
  <textarea data-memo="${id}" placeholder="고칠 것 메모"></textarea></div>`
}).join('\n')
const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>장바구니 검수 ${날들.join('·')}</title>
<style>body{margin:0;padding:16px;background:#faf6ef;font-family:system-ui,sans-serif;color:#3a2a1a}.card{background:#fff;border-radius:16px;padding:14px;margin:0 0 14px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.day{font-size:13px;color:#b04a2e;font-weight:700}.row{display:flex;gap:12px;align-items:center;margin:8px 0}.ic{width:96px;height:96px;object-fit:contain}.ic42{width:42px;height:42px;object-fit:contain;border:1px dashed #ddd;border-radius:8px}
.sub{font-size:12px;color:#998}.k{font-size:12px;color:#998;margin-top:8px}.v{font-size:14px;line-height:1.5;word-break:break-all}.warn{margin-top:8px;color:#b04a2e;font-size:13px}
.pick{display:flex;gap:6px;margin-top:10px}.pick button{flex:1;padding:10px;border-radius:10px;border:1px solid #ddd;background:#fff;font-size:14px}.pick button.on{background:#6b2f24;color:#fff}
textarea{width:100%;box-sizing:border-box;margin-top:8px;border-radius:10px;border:1px solid #eee;padding:8px;font-size:14px;min-height:40px}#copy{width:100%;padding:14px;border-radius:12px;background:#d9a441;color:#fff;font-size:16px;border:0}#out{white-space:pre-wrap;font-size:13px;background:#fff;padding:10px;border-radius:10px;margin-top:8px}</style>
<h2>🛒 장바구니 검수 — ${날들.join(' · ')} (${items.length}개)</h2><p class="sub">42px = 앱 카드 크기 · 큰 그림 = 확대</p>
${카드}
<button id="copy">판정 복사하기</button><div id="out"></div>
<script>
const K='hankki:판:장바구니-1002';let st={};try{st=JSON.parse(localStorage.getItem(K)||'{}')}catch{}
const save=()=>{try{localStorage.setItem(K,JSON.stringify(st))}catch{}}
document.querySelectorAll('.pick').forEach(p=>{const id=p.dataset.id;p.querySelectorAll('button').forEach(b=>{if(st[id]?.v===b.dataset.v)b.classList.add('on');b.onclick=()=>{p.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');st[id]={...(st[id]||{}),v:b.dataset.v,n:p.dataset.name};save()}})})
document.querySelectorAll('textarea').forEach(t=>{const id=t.dataset.memo;t.value=st[id]?.m||'';t.oninput=()=>{st[id]={...(st[id]||{}),m:t.value,n:t.closest('.card').querySelector('.pick').dataset.name};save()}})
document.getElementById('copy').onclick=async()=>{const txt=document.querySelectorAll('.pick').length&&[...document.querySelectorAll('.pick')].map(p=>{const s=st[p.dataset.id]||{};return '· '+p.dataset.name+' = '+(s.v||'(안 고름)')+(s.m?' / '+s.m:'')}).join('\\n');const o=document.getElementById('out');o.textContent=txt;try{await navigator.clipboard.writeText(txt)}catch{}const r=document.createRange();r.selectNodeContents(o);const sel=getSelection();sel.removeAllRanges();sel.addRange(r)}
</script>`
mkdirSync(S, { recursive: true })
const out = join(S, `장바구니검수-${날들.join('_')}.html`)
writeFileSync(out, html)
console.log(`☑️ ${items.length}개 → ${out}`)
for (const it of items) console.log(`   ${it.from} ${it.name} · 링크 ${it.url ? '✅' : '⛔'} · 원재료 ${it.hasIng ? '✅' : '⛔'} · 그림 ${it.ownIcon || '물려받음'}`)
