// 🖼 「우리 레시피 표지에 만화체 컷이 또 있나」 — 창업자가 눈으로 고르는 판 (2026-09-09 신설)
//
// 📮 왜 = 2026-09-09 에 「명란 바지락 파스타」 표지가 만화체 옛 컷(fe_188)이었다.
//    창업자 = *"카와이 왜또나와 … 다 지웠는데 왜 또나오는거야?"*
// 🔎 뿌리 = 2026-08-31 판정판은 «옛 컷 650장»만 보여줬고 그중 431장을 9/5 에 지웠다.
//    fe_188 은 그 431 에 «없다» → 거르개가 「그때 본 650장」에 갇혀 있었다.
//    ⛔ 그래서 남은 컷은 아무도 다시 안 봤다. 이 판이 그 구멍을 메운다.
// ⭐ 범위 = 씨드 레시피가 «실제로 쓰는» 표지. 유저 앞에 나가는 건 이것이다.
// ⛔ basics.js 를 글자로 파싱하지 않는다 — 앱과 «같은 모듈»(recipe.mjs)에서 읽는다 (규칙 30).
// ☑️ 체크 ＋ 복사를 넣는다 (절대원칙 2026-08-19 — 검수판은 무조건 둘 다).
//
// 쓰는 법  node scripts/_판-표지그림체-0909.mjs [나올자리]
import { writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { 레시피들 } from './recipe.mjs'

const APP = resolve(new URL('..', import.meta.url).pathname)
const OUT = process.argv[2] || join(APP, '..', '_판-표지그림체')
mkdirSync(OUT, { recursive: true })

const 있는파일 = new Set(readdirSync(join(APP, 'src/assets/stickers/photo')).map((f) => f.replace('.png', '')))

// 같은 컷을 여러 편이 쓰면 한 칸으로 모은다 — 창업자가 같은 그림을 두 번 볼 이유가 없다.
const 칸 = new Map()
for (const r of 레시피들()) {
  if (!r.icon) continue
  if (!칸.has(r.icon)) 칸.set(r.icon, [])
  칸.get(r.icon).push(r.title)
}
const 목록 = [...칸].sort((a, b) => a[0].localeCompare(b[0]))
const 없는것 = 목록.filter(([id]) => !있는파일.has(id)).map(([id]) => id)

// 🖼 그림을 «판 안에» 굽는다 — 판은 폰에서 열리므로 저장소 경로를 못 읽는다.
//    ⛔ 원본 그대로면 153장 × 380KB ≈ 58MB 라 아티팩트 상한(16MB)을 넘는다 → 320px JPEG 로 줄인다.
//    ⭐ 320px 면 «만화체 외곽선»은 그대로 보인다 — 이 판이 묻는 건 그림체 하나다.
const 굽기 = async (ids) => {
  const 빈판 = join(OUT, '_빈판.html')
  writeFileSync(빈판, '<body>')
  const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] })
  const page = await b.newPage()
  await page.goto('file://' + 빈판)   // ⛔ about:blank 에서는 file:// 그림을 못 읽는다
  const 나온것 = await page.evaluate(async ({ ids, 폴더 }) => {
    const 답 = {}
    for (const id of ids) {
      const img = new Image()
      img.src = 'file://' + 폴더 + '/' + id + '.png'
      try { await img.decode() } catch { continue }
      const c = document.createElement('canvas')
      c.width = c.height = 320
      const g = c.getContext('2d')
      g.fillStyle = '#f6f2ea'; g.fillRect(0, 0, 320, 320)   // 투명 png 라 바탕을 깔아야 JPEG 가 까매진다
      const s = Math.min(320 / img.naturalWidth, 320 / img.naturalHeight)
      const w = img.naturalWidth * s, h = img.naturalHeight * s
      g.drawImage(img, (320 - w) / 2, (320 - h) / 2, w, h)
      답[id] = c.toDataURL('image/jpeg', 0.82)
    }
    return 답
  }, { ids, 폴더: join(APP, 'src/assets/stickers/photo') })
  await b.close()
  return 나온것
}
const 그림 = await 굽기(목록.map(([id]) => id))
const 못구운것 = 목록.filter(([id]) => !그림[id]).map(([id]) => id)

const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>표지 그림체 검수 — ${목록.length}컷</title>
<style>
 body{margin:0;background:#faf7f2;font:15px/1.5 -apple-system,system-ui,sans-serif;color:#3b2b1a}
 header{position:sticky;top:0;background:#5d3410;color:#fff;padding:12px 14px;z-index:9}
 header b{font-size:17px} header p{margin:6px 0 0;font-size:13px;opacity:.9}
 .wrap{padding:12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
 .card{background:#fff;border-radius:12px;padding:8px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
 .card img{width:100%;aspect-ratio:1;object-fit:contain;background:#f6f2ea;border-radius:8px;display:block}
 .id{font-size:12px;color:#8a7a68;margin:4px 0 2px}
 .ttl{font-size:13px;font-weight:600;line-height:1.3;min-height:2.6em}
 .btns{display:flex;gap:4px;margin-top:6px}
 .btns button{flex:1;border:1px solid #ddd2c2;background:#fff;border-radius:8px;padding:7px 0;font-size:13px;cursor:pointer}
 .card[data-v="만화"] {outline:3px solid #d8452f} .card[data-v="만화"] .b1{background:#d8452f;color:#fff;border-color:#d8452f}
 .card[data-v="괜찮"] {outline:3px solid #3f8f4e} .card[data-v="괜찮"] .b2{background:#3f8f4e;color:#fff;border-color:#3f8f4e}
 .card[data-v="글쎄"] {outline:3px solid #c79a2b} .card[data-v="글쎄"] .b3{background:#c79a2b;color:#fff;border-color:#c79a2b}
 footer{padding:16px;display:flex;flex-direction:column;gap:8px}
 footer button{padding:14px;border:0;border-radius:12px;background:#5d3410;color:#fff;font-size:16px;font-weight:600}
 #out{white-space:pre-wrap;font-size:13px;background:#fff;border-radius:10px;padding:10px;display:none}
 .miss{margin:10px 12px;padding:10px;background:#fff3f1;border-radius:10px;font-size:13px;color:#a3311f}
</style>
<header>
 <b>🖼 표지 그림체 검수 — ${목록.length}컷</b>
 <p>만화체(굵은 검은 외곽선)만 골라줘. 나머지는 안 눌러도 돼. <b id="cnt">0</b>개 골랐음</p>
</header>
${없는것.length ? `<div class="miss">⛔ 파일이 없는 표지 ${없는것.length}개 — ${없는것.join(' · ')}</div>` : ''}
<div class="wrap">
${목록
  .map(
    ([id, 제목들]) => `<div class="card" data-id="${id}">
 <img src="${그림[id] || ''}" alt="${id}" loading="lazy">
 <div class="id">${id}${제목들.length > 1 ? ` · ${제목들.length}편` : ''}</div>
 <div class="ttl">${제목들.join('<br>')}</div>
 <div class="btns"><button class="b1" data-v="만화">만화</button><button class="b2" data-v="괜찮">괜찮</button><button class="b3" data-v="글쎄">글쎄</button></div>
</div>`,
  )
  .join('\n')}
</div>
<footer>
 <button id="copy">📋 고른 것 복사하기</button>
 <div id="out"></div>
</footer>
<script>
 var KEY='hankki:표지그림체:0909'
 var 답={}
 try{ 답=JSON.parse(localStorage.getItem(KEY)||'{}') }catch(e){}
 function 칠하기(){
   var n=0
   document.querySelectorAll('.card').forEach(function(c){
     var v=답[c.dataset.id]
     if(v){ c.dataset.v=v; n++ } else { c.removeAttribute('data-v') }
   })
   document.getElementById('cnt').textContent=n
 }
 document.addEventListener('click',function(e){
   var b=e.target.closest('.btns button'); if(!b) return
   var c=b.closest('.card'), id=c.dataset.id
   if(답[id]===b.dataset.v) delete 답[id]; else 답[id]=b.dataset.v
   try{ localStorage.setItem(KEY,JSON.stringify(답)) }catch(e){}
   칠하기()
 })
 칠하기()
 document.getElementById('copy').addEventListener('click',function(){
   var 줄=[]
   ;['만화','글쎄','괜찮'].forEach(function(v){
     var ids=Object.keys(답).filter(function(k){return 답[k]===v})
     if(ids.length) 줄.push('['+v+' '+ids.length+'] '+ids.join(' '))
   })
   var t=줄.length?줄.join('\\n'):'(아직 고른 게 없어)'
   var out=document.getElementById('out'); out.style.display='block'; out.textContent=t
   // ⛔ writeText 는 «성공했다고 하고도» 실제로 복사가 안 되는 폰이 있다(v10.97 교훈).
   //    그래서 실패하든 성공하든 글자를 골라 준다 — 길게 눌러 복사하면 된다.
   try{ navigator.clipboard.writeText(t) }catch(e){}
   var r=document.createRange(); r.selectNodeContents(out)
   var s=getSelection(); s.removeAllRanges(); s.addRange(r)
 })
</script>`

const p = join(OUT, '표지그림체-0909.html')
writeFileSync(p, html)
console.log(`✅ ${목록.length}컷 · 파일 없는 것 ${없는것.length}개 · 못 구운 것 ${못구운것.length}개\n📄 ${p}`)
