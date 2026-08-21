// ✂️ [판정대기 · 2026-08-21] 긴 걸음 «문장 끊기» — 60자 이상 12개
//
// 📮 창업자 = *"**문장이 끊어지질않네**"* · *"**12개하자**"* · *"**간단히.. 만들어줘봐.**"*
// 📮 규칙(창업자 확정) = *"**문장이 2개까지는 봐줄만한데 3문장은 너무 길게 느껴져**"*
//    → **한 걸음 = 최대 2문장.** 그게 잣대다.
//
// ⛔⛔ **걸음을 «쪼개지» 않는다 — 문장만 끊는다.**
//    걸음을 둘로 나누면 STEP 1/10 → 1/11 로 «요리 흐름»이 바뀌고, 타이머·진행 막대가 다 밀린다.
//    창업자가 짚은 건 「걸음이 많다」가 아니라 **「한 문장이 안 끝난다」**였다.
//
// ⭐ 왜 이게 글씨 크기로는 안 풀리나 — 26px 로 내려도 전복솥밥 3번은 **6줄**이다(실측).
//    글씨는 «읽기 편함»을 정하고, 문장 길이는 «따라갈 수 있음»을 정한다. 다른 문제다.
//
// ⛔ 레시피 내용이라 **창업자 전수검수 전엔 앱에 안 넣는다**(절대원칙 13).
//    이 판은 «제안»이고 판정은 창업자 몫이다(규칙 11).
// ☑️ 검수판은 무조건 체크 ＋ 복사 (절대원칙 2026-08-19)
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-문장끊기-0821.mjs
import { writeFileSync } from 'node:fs'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/문장끊기판.html'

// ⭐ 원문은 «앱과 같은 모듈»에서 뽑는다 — 내가 옮겨 적지 않는다(절대원칙 30)
const B = await import('../src/data/basics.js')
const 전체 = Array.isArray(B.allBasicRecipes) ? B.allBasicRecipes : (B.default || [])
const 걸음 = []
전체.forEach((r) => (r.steps || []).forEach((s, i) => {
  const t = (typeof s === 'string' ? s : (s.text || s.t || '')).trim()
  if (t) 걸음.push({ 편: r.title, id: r.id, 번: i + 1, 전체: (r.steps || []).length, 글: t })
}))
const 대상 = 걸음.filter((x) => x.글.length >= 60).sort((a, b) => b.글.length - a.글.length)

// ✂️ 끊는 안 — «내가 손으로 쓴 것»이다(기계로 자르면 말이 어색해진다).
//    ⭐ 원칙 = ⑴최대 2문장 ⑵낱말·양은 한 글자도 안 바꾼다 ⑶해요체 유지 ⑷순서 안 바꾼다
const 안 = {
  '전복솥밥|3': '팬에 버터와 다진 마늘을 넣어 볶다가 전복을 넣어요. 맛술·소금·올리고당·후추를 넣고 물기가 거의 없어질 때까지 볶은 뒤 뚜껑을 덮어 둬요.',
  '브로콜리 구이|2': '반으로 자른 다음 줄기와 꽃봉오리가 이어지도록 세로로 잘라요. 넓적하게 잘라야 노릇하게 구워져요(너무 두껍지 않게).',
  '부대찌개|3': '다진 소고기에 맛술 1큰술, 진간장 1/2큰술, 다진 마늘 1/2큰술, 후추를 넣어 양념해요. 익은 김치도 잘게 썰어 준비해요.',
  '잡채|5': '불린 당면을 끓는 물에 5~6분 삶아 건져요. 간장 3큰술 + 설탕 1.5큰술 + 참기름과 팬에서 살짝 볶아 간을 입혀요.',
  '닭곰탕|3': '초피액젓 3큰술, 해물가루육수 2봉, 치킨스톡 1/2포를 넣어요. 대파 큼직하게, 통마늘 한 주먹을 더 넣고 중불에 30분간 끓여요.',
  '순살찜닭|3': '썰어 둔 야채와 물 100ml, 소스를 모두 넣고 잘 섞어요. 뚜껑을 닫고 끓어오르는 시점부터 10분 끓여요.',
  '부대찌개|5': '사골육수 800g과 물 200ml를 붓고 소금·후추를 살짝 뿌려요. 해물가루육수 1봉을 넣고 뚜껑을 덮어 10분 끓여요.',
  '부대찌개|4': '전골냄비에 채 썬 양파를 깔아요. 그 위에 햄·두부·소세지·떡·김치·베이크드빈·양념한 소고기·양념장·대파를 올려요.',
  '매운 소갈비찜|4': '진간장, 고춧가루, 고추장, 설탕, 올리고당을 볼에 넣어요. 맛술, 다진 마늘, 다진 생강, 후추를 더 넣고 섞어 양념장을 만들어요.',
  '충무김밥 오징어무침|4': '볼에 고춧가루와 진간장, 초피액젓, 다진 마늘을 넣어요. 올리고당, 설탕, 다진 파, 들기름, 후춧가루를 더 넣고 섞어요.',
  '스키야키|1': '물 500ml에 간장 6큰술, 아우노슈가 5와1/2큰술을 넣어요. 맛술 2큰술, 쯔유가루 1봉을 더 넣고 섞어 소스를 만들어요.',
  '항정수육|2': '간장 4큰술·원당 3큰술·미림 3큰술을 섞어요. 다진 마늘 2큰술·와사비 1작은술·물 500ml를 더 넣고 섞어 소스를 만들어요.',
}

const 문장수 = (t) => (t.match(/[.!?](\s|$)/g) || []).length || 1
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const 칸 = 대상.map((x, n) => {
  const 새글 = 안[`${x.편}|${x.번}`]
  const 전문 = 문장수(x.글), 후문 = 새글 ? 문장수(새글) : 0
  return `
  <article class="c" data-k="${esc(x.편)}|${x.번}">
    <header>
      <span class="no">${n + 1}</span>
      <div>
        <h3>${esc(x.편)}</h3>
        <p class="meta">${x.번}/${x.전체}번 · ${x.글.length}자</p>
      </div>
    </header>
    <div class="pair">
      <div class="side old">
        <span class="tag">지금 · <b>${전문}문장</b></span>
        <p>${esc(x.글)}</p>
      </div>
      <div class="side new">
        <span class="tag ok">이렇게 · <b>${후문}문장</b></span>
        <p>${새글 ? esc(새글) : '<i>안 없음</i>'}</p>
      </div>
    </div>
    <div class="pick">
      <button type="button" data-v="좋아">좋아</button>
      <button type="button" data-v="고쳐">고쳐줘</button>
      <button type="button" data-v="그대로">그대로 둬</button>
    </div>
    <textarea rows="1" placeholder="어떻게 고칠까 (안 써도 돼)"></textarea>
  </article>`
}).join('')

const html = `<title>긴 걸음 문장 끊기</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Gowun+Batang:wght@700&display=swap">
<style>
:root{--ink:#2a2622;--ink2:#6b6055;--line:#e3dccf;--ground:#f6f3ec;--card:#fffdf8;
  --accent:#3f6ea8;--soft:#e7eef7;--ok:#2f7a52;--old:#b4622c;
  --sh:0 1px 2px rgba(60,50,35,.05),0 8px 22px -12px rgba(60,50,35,.2)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --ink:#eae4da;--ink2:#a89e91;--line:#39332c;--ground:#1b1815;--card:#252017;
  --accent:#8fb6e0;--soft:#22303f;--ok:#7fc79f;--old:#e29a68;
  --sh:0 1px 2px rgba(0,0,0,.3),0 8px 22px -12px rgba(0,0,0,.6)}}
:root[data-theme="dark"]{--ink:#eae4da;--ink2:#a89e91;--line:#39332c;--ground:#1b1815;--card:#252017;
  --accent:#8fb6e0;--soft:#22303f;--ok:#7fc79f;--old:#e29a68;
  --sh:0 1px 2px rgba(0,0,0,.3),0 8px 22px -12px rgba(0,0,0,.6)}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);padding:26px 16px 96px;
  font-family:'Gowun Dodum',-apple-system,'Apple SD Gothic Neo',sans-serif;font-size:16px;line-height:1.75;word-break:keep-all}
.wrap{max-width:560px;margin:0 auto}
h1{font-family:'Gowun Batang',serif;font-size:26px;margin:0 0 5px;letter-spacing:-.02em;text-wrap:balance}
.sub{color:var(--ink2);font-size:14px;margin:0 0 20px}
.rule{background:var(--soft);border-radius:13px;padding:13px 15px;margin:0 0 24px;font-size:14.5px;line-height:1.7}
.rule b{font-weight:700}
.c{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:15px;margin:0 0 16px;box-shadow:var(--sh)}
.c.done{border-color:var(--accent)}
.c header{display:flex;gap:11px;align-items:flex-start;margin-bottom:11px}
.no{flex:0 0 auto;width:27px;height:27px;border-radius:9px;background:var(--accent);color:#fff;
  display:grid;place-items:center;font-weight:700;font-size:14px}
.c h3{margin:0;font-size:16.5px;letter-spacing:-.02em}
.meta{margin:1px 0 0;font-size:12.5px;color:var(--ink2)}
.pair{display:flex;flex-direction:column;gap:9px}
.side{border-radius:11px;padding:10px 12px;background:var(--ground)}
.side p{margin:4px 0 0;font-size:14.5px;line-height:1.72}
.side.new{background:var(--soft)}
.tag{font-size:11.5px;font-weight:700;letter-spacing:.03em;color:var(--old)}
.tag.ok{color:var(--ok)}
.pick{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:12px}
.pick button{font:inherit;font-size:14px;padding:11px 4px;border-radius:11px;min-height:44px;cursor:pointer;
  border:1px solid var(--line);background:var(--ground);color:var(--ink2)}
.pick button[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:700}
.pick button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
textarea{width:100%;margin-top:8px;font:inherit;font-size:14px;padding:9px 11px;border:1px solid var(--line);
  border-radius:10px;background:var(--ground);color:var(--ink);resize:vertical;min-height:40px}
.bar{position:sticky;bottom:0;margin:24px -16px -96px;padding:13px 16px calc(18px + env(safe-area-inset-bottom));
  background:color-mix(in srgb,var(--ground) 92%,transparent);backdrop-filter:blur(8px);border-top:1px solid var(--line)}
.bar button{width:100%;font:inherit;font-size:16px;font-weight:700;padding:15px;border-radius:13px;border:none;
  background:var(--accent);color:#fff;cursor:pointer;min-height:52px}
.cnt{text-align:center;font-size:12.5px;color:var(--ink2);margin-bottom:8px}
#out{width:100%;margin-top:10px;font:inherit;font-size:13.5px;padding:11px;border:1px solid var(--line);
  border-radius:11px;background:var(--card);color:var(--ink);white-space:pre-wrap;display:none;line-height:1.7}
#out.on{display:block}
</style>
<div class="wrap">
  <h1>긴 걸음, 문장 끊기</h1>
  <p class="sub">60자 이상 ${대상.length}개 · 2026-08-21</p>
  <div class="rule">
    📮 <b>“문장이 2개까지는 봐줄만한데 3문장은 너무 길게 느껴져”</b><br>
    → 잣대 = <b>한 걸음 최대 2문장</b>.<br><br>
    ⛔ <b>걸음은 안 쪼갰어</b> — 쪼개면 STEP 1/10 이 1/11 로 바뀌어 요리 흐름이 통째로 밀려.
    <b>문장만</b> 끊었어.<br>
    ⭐ 낱말·양은 <b>한 글자도 안 바꿨어.</b> 순서도 그대로.
  </div>
  ${칸}
  <div class="bar">
    <div class="cnt" id="cnt">아직 안 고름</div>
    <button type="button" id="copy">고른 것 복사하기</button>
    <div id="out"></div>
  </div>
</div>
<script>
const KEY='hankki:문장끊기-0821'
let 상태={}; try{상태=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{상태={}}
const 저장=()=>{try{localStorage.setItem(KEY,JSON.stringify(상태))}catch{}}
const 세기=()=>{const n=Object.values(상태).filter(x=>x&&x.v).length
  document.getElementById('cnt').textContent=n?\`\${n}/${대상.length}개 골랐어\`:'아직 안 고름'}
document.querySelectorAll('.c').forEach(el=>{
  const k=el.dataset.k, ta=el.querySelector('textarea')
  const 그리기=()=>{const s=상태[k]||{}
    el.querySelectorAll('.pick button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===s.v)))
    el.classList.toggle('done',!!s.v); if(ta.value!==(s.m||''))ta.value=s.m||''}
  el.querySelectorAll('.pick button').forEach(b=>b.addEventListener('click',()=>{
    const s=상태[k]||{}; 상태[k]={...s,v:s.v===b.dataset.v?'':b.dataset.v}; 저장(); 그리기(); 세기()}))
  ta.addEventListener('input',()=>{상태[k]={...(상태[k]||{}),m:ta.value};저장()})
  그리기()
})
세기()
document.getElementById('copy').addEventListener('click',async()=>{
  const 줄=['[긴 걸음 문장 끊기 · 2026-08-21]']
  document.querySelectorAll('.c').forEach(el=>{const k=el.dataset.k,s=상태[k]||{}
    if(!s.v&&!s.m)return
    줄.push(\`\${k.replace('|',' ')}번 — \${s.v||'(안 고름)'}\${s.m?' / '+s.m:''}\`)})
  if(줄.length===1)줄.push('(아직 아무것도 안 골랐어)')
  const 글=줄.join('\\n'), out=document.getElementById('out')
  out.textContent=글; out.classList.add('on')
  // ⛔ writeText 는 성공으로 resolve 되고도 실제 복사가 안 되는 폰이 있다(v10.97) → 글도 띄운다
  let 됨=false; try{await navigator.clipboard.writeText(글);됨=true}catch{}
  if(!됨){try{const r=document.createRange();r.selectNodeContents(out)
    const s=getSelection();s.removeAllRanges();s.addRange(r)}catch{}}
  document.getElementById('copy').textContent=됨?'복사했어 ✓':'아래 글자를 길게 눌러 복사해줘'
  setTimeout(()=>{document.getElementById('copy').textContent='고른 것 복사하기'},2600)
})
</script>`

writeFileSync(OUT, html)
const 안없음 = 대상.filter((x) => !안[`${x.편}|${x.번}`])
console.log(`\n✂️ 60자 이상 ${대상.length}개 · 끊는 안 ${대상.length - 안없음.length}개`)
안없음.forEach((x) => console.log(`  ⚠️ 안 없음 — ${x.편} ${x.번}번`))
대상.forEach((x) => {
  const 새 = 안[`${x.편}|${x.번}`]
  if (!새) return
  console.log(`  ${x.편} ${x.번}번  ${x.글.length}자 ${문장수(x.글)}문장 → ${새.length}자 ${문장수(새)}문장`)
})
console.log(`\n🖼 ${OUT}\n`)
