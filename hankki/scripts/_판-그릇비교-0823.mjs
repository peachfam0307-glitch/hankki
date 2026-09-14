// 🍲 그릇 프레임 비교 — 「높이 있는 것」 ↔ 「위에서 본 것」 (창업자 2026-08-23)
//
// 📮 창업자 = *"높이가 있는버전. 위에서 내려다본버전이야 어떤게 음식올렸을때 더 예쁜지
//    음식넣어서 비교해줘. 제육볶음. 파스타넣어서 비교."*
//
// ⛔⛔ **정직하게 — 우리한텐 «진짜 음식 사진»이 없다.**
//    창업자 백업 240편에도 `image` 가 한 장도 없고(실측), 저장소 음식 그림은 전부 «일러스트»다.
//    그래서 우리 음식 아이콘(제육볶음 fh_k13 · 크림파스타 fe_24)을 **동그랗게 잘라** 끼운다.
//    ⚠️ 그 일러스트엔 «자기 접시»가 이미 그려져 있어 접시 안에 접시가 든다 —
//       그러니 이 판으로 판정할 것은 **「음식이 그릇에 담긴 것처럼 보이나」**뿐이고,
//       「예쁜가」는 창업자가 진짜 사진 두 장을 주면 그때 다시 뽑는다.
//
// ⭐⭐ 심장 = **오버스캔**. 사진을 창보다 3% 크게 깔아 안쪽 테 «밑»으로 밀어 넣는다.
//    창업자가 짚은 그것 — *"그릇 안쪽 테두리가 살짝 위에 겹쳐져야… 스티커처럼 안 보여"*
//    ⛔ 딱 맞게 깔면 안티에일리어싱으로 «머리카락 같은 흰 틈»이 생긴다.
//    ⭐ 그래서 이 판은 «오버스캔 있음 ↔ 없음»도 나란히 보여준다(그 차이가 이 일의 전부다).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-그릇비교-0823.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const OUT = join(ROOT, 'docs/시안/그릇비교-0823')
mkdirSync(OUT, { recursive: true })

const 그릇 = join(ROOT, 'docs/stickers/그릇-창업자-2026-08-23')
const 음식폴더 = join(ROOT, 'src/assets/stickers/photo')

const uri = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`

// 창 실측값 — tools/그릇-창뚫기.py 가 뚫으면서 잰 값(짐작이 아니다)
const 높이있는 = [
  { 키: 'pb_h01', 이름: '주름 볼', w: 0.563, h: 0.502, cx: 0.522, cy: 0.557 },
  { 키: 'pb_h02', 이름: '얕은 파이접시', w: 0.634, h: 0.473, cx: 0.498, cy: 0.551 },
  { 키: 'pb_h03', 이름: '손잡이 그라탕', w: 0.630, h: 0.497, cx: 0.512, cy: 0.537 },
  { 키: 'pb_h04', 이름: '세로줄 볼', w: 0.450, h: 0.439, cx: 0.519, cy: 0.564 },
]
const 위에서본 = [
  { 키: 'pb_t01', 이름: '주름 접시', w: 0.612, h: 0.612, cx: 0.502, cy: 0.502 },
  { 키: 'pb_t02', 이름: '스캘럽 접시 ⛔깨짐', w: 0.746, h: 0.705, cx: 0.579, cy: 0.546, 깨짐: true },
  { 키: 'pb_t03', 이름: '오벌 플래터', w: 0.497, h: 0.725, cx: 0.502, cy: 0.505 },
  { 키: 'pb_t04', 이름: '꽃 접시', w: 0.583, h: 0.566, cx: 0.495, cy: 0.506 },
]
const 음식들 = [
  { 키: 'fh_k13', 이름: '제육볶음', zoom: 1.75 },
  { 키: 'fe_24', 이름: '크림 파스타', zoom: 1.75 },
]

const 없는것 = []
for (const f of 음식들) {
  if (!existsSync(join(음식폴더, `${f.키}.png`))) 없는것.push(f.키)
}
if (없는것.length) {
  console.error(`⛔ 음식 그림이 없다 — ${없는것.join(', ')}`)
  process.exit(1)
}

const 판 = 626 // 프레임 표시 크기(검수 절대원칙 ③)

// 한 칸 = 프레임 ＋ 그 뒤에 깔린 음식
//   over = 오버스캔 비율(1.0 = 창과 딱 맞음 · 1.03 = 3% 크게)
// zoom = 사진을 창보다 얼마나 더 «당겨» 보나.
//   ⛔ 창업자 = *"프레임안에 음식이 꽉 차야지;; 저게 뭐야ㅠ"* — 맞다.
//   🔢 원인 = 우리 일러스트는 «자기 접시»가 그림의 절반이라(패딩은 3~8%뿐)
//      창에 «맞추면» 접시가 자리를 다 먹고 음식이 가운데 작게 남는다.
//   ✅ 그래서 창 안으로 더 당겨 그 접시를 잘라낸다. 진짜 사진은 음식이 화면을 꽉 채우니 1.0 이면 된다.
const 칸 = (프, 음식, over, 크기 = 300, zoom = 1.0) => {
  const s = 크기 / 판
  // 창은 «프레임 폭» 기준이라 세로는 프레임 세로비를 타야 한다 — 간단히 폭·높이 각각 쓴다
  // ⛔⛔ **창 크기와 «당김»을 갈라야 한다** (2026-08-23 · 첫 판이 여기서 깨졌다).
  //    사진을 통째로 키우니 꽉 차긴 했는데 **그릇 «밖»으로 삐져나왔다** —
  //    프레임은 그릇 모양이고 바깥은 투명이라, 창을 넘은 사진이 그대로 드러난다.
  // ✅ 그래서 «창 크기의 구멍»을 만들어 가두고(overflow), 사진은 그 «안»에서 당긴다.
  const pw = 크기 * 프.w * over
  const ph = 크기 * 프.h * over
  const left = 크기 * 프.cx - pw / 2
  const top = 크기 * 프.cy - ph / 2
  return `
  <div class="cell" style="width:${크기}px;height:${크기}px">
    <div class="hole" style="left:${left}px;top:${top}px;width:${pw}px;height:${ph}px">
      <img class="food" src="${uri(join(음식폴더, `${음식.키}.png`))}" alt="" style="transform:scale(${zoom})">
    </div>
    <img class="frame" src="${uri(join(그릇, 프.깊이 || (프.키.startsWith('pb_h') ? '낱개-높이' : '낱개-위에서'), `${프.키}.png`))}" alt="${프.이름}">
  </div>`
}

const 줄 = (목록, 음식, over) => 목록.map((프) => `
  <figure>
    ${칸(프, 음식, over, 300, 음식.zoom || 1)}
    <figcaption>${프.이름}</figcaption>
  </figure>`).join('')

const html = `<title>그릇 프레임 비교</title>
<style>
  :root{
    --ink:#2b2724; --sub:#6f6862; --line:#ddd5c8; --paper:#faf7f1;
    --card:#fff; --cream:#f2ede3; --brown:#5878a0; --bad:#b3453a;
  }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
    --ink:#ece7e0; --sub:#a49c93; --line:#3a3730; --paper:#1c1b19;
    --card:#252320; --cream:#2f2c27; --brown:#7093c0; --bad:#e08277;
  }}
  :root[data-theme="dark"]{
    --ink:#ece7e0; --sub:#a49c93; --line:#3a3730; --paper:#1c1b19;
    --card:#252320; --cream:#2f2c27; --brown:#7093c0; --bad:#e08277;
  }
  body{
    background:var(--paper); color:var(--ink); margin:0; padding:22px 16px 90px;
    font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard","Noto Sans KR",system-ui,sans-serif;
    line-height:1.65; word-break:keep-all;
  }
  .wrap{max-width:760px; margin:0 auto; display:flex; flex-direction:column; gap:26px}
  h1{font-size:23px; margin:0; letter-spacing:-.02em}
  h2{font-size:18px; margin:0 0 4px}
  h3{font-size:15px; margin:18px 0 10px; color:var(--sub); font-weight:700}
  .lead{color:var(--sub); font-size:14.5px; margin:6px 0 0}
  .quote{border-left:3px solid var(--brown); padding:8px 0 8px 13px; color:var(--sub); font-size:14px; margin:0}
  section{background:var(--card); border:1px solid var(--line); border-radius:14px; padding:18px 16px}
  .badge{display:inline-block; font-size:12px; font-weight:700; padding:3px 9px;
    border-radius:999px; background:var(--cream); color:var(--brown); margin-bottom:10px}
  .strip{display:flex; gap:14px; overflow-x:auto; padding-bottom:8px}
  figure{margin:0; flex:0 0 auto; text-align:center}
  figcaption{font-size:12.5px; color:var(--sub); margin-top:6px}
  .cell{position:relative; overflow:hidden}
  .cell > img{position:absolute; display:block}
  .hole{position:absolute; overflow:hidden; border-radius:50%}
  .food{width:100%; height:100%; object-fit:cover; display:block}
  .frame{left:0; top:0; width:100%; height:100%}
  .note{background:var(--cream); border-radius:11px; padding:12px 14px; font-size:13.5px; color:var(--sub)}
  .warn{border-left:3px solid var(--bad); padding-left:12px; color:var(--bad); font-size:13.5px}
  table{border-collapse:collapse; width:100%; font-size:13.5px; margin-top:10px}
  th,td{border-bottom:1px solid var(--line); padding:7px 6px; text-align:left; vertical-align:top}
  th{color:var(--sub); font-weight:700}
  .pick{display:flex; align-items:center; gap:9px; padding:9px 2px; cursor:pointer; font-size:15px}
  .pick input{position:absolute; opacity:0; width:0; height:0}
  .dot{width:19px; height:19px; border-radius:50%; border:2px solid var(--line); flex:0 0 auto}
  .pick input:checked + .dot{border-color:var(--brown); background:var(--brown); box-shadow:inset 0 0 0 3.5px var(--card)}
  textarea{width:100%; box-sizing:border-box; min-height:110px; font:inherit; font-size:13.5px;
    background:var(--paper); color:var(--ink); border:1px solid var(--line); border-radius:11px; padding:11px}
  button{font:inherit; font-size:15px; font-weight:700; padding:13px 20px; border:none;
    border-radius:11px; background:var(--brown); color:#fff; width:100%; cursor:pointer; margin-top:10px}
  .said{font-size:13px; color:var(--brown); min-height:19px; margin-top:8px; text-align:center}
</style>

<div class="wrap">
  <header>
    <h1>그릇 프레임 — 높이 있는 것 ↔ 위에서 본 것</h1>
    <p class="lead">네가 준 8컷을 표준 도구로 자르고 창을 뚫어서, 뒤에 음식을 깔아 봤어.</p>
  </header>

  <section class="warn">
    ⚠️ <b>진짜 음식 사진이 없어서 우리 일러스트를 끼웠다.</b>
    네 백업 240편에 사진이 한 장도 없고(실측), 저장소 음식 그림은 전부 그림이야.
    그 그림엔 <b>자기 접시가 이미 그려져 있어</b> 접시 안에 접시가 든다.<br><br>
    👉 그러니 이 판으로 볼 것은 <b>「음식이 그릇에 «담긴» 것처럼 보이나」</b> 하나야.
    <b>진짜 사진 두 장(제육볶음·파스타)만 주면 그대로 다시 뽑을게</b> — 3분.
  </section>

  ${음식들.map((음식) => `
  <section>
    <span class="badge">🍽 ${음식.이름}</span>
    <h3>높이 있는 것 (4컷)</h3>
    <div class="strip">${줄(높이있는, 음식, 1.03)}</div>
    <h3>위에서 본 것 (4컷)</h3>
    <div class="strip">${줄(위에서본, 음식, 1.03)}</div>
  </section>`).join('')}

  <section>
    <span class="badge">🔬 오버스캔</span>
    <h2>안쪽 테가 사진 위로 물리나</h2>
    <p class="quote">📮 “원형 음식 사진의 가장자리보다 그릇 안쪽 테두리가 살짝 위에 겹쳐져야 해.”</p>
    <div class="strip" style="margin-top:12px">
      <figure>${칸(높이있는[0], 음식들[0], 1.0, 260, 음식들[0].zoom)}<figcaption>⛔ 딱 맞게 (틈이 생긴다)</figcaption></figure>
      <figure>${칸(높이있는[0], 음식들[0], 1.03, 260, 음식들[0].zoom)}<figcaption>✅ 3% 크게 (테 밑으로 물린다)</figcaption></figure>
    </div>
    <p class="note" style="margin-top:12px">
      코드 한 줄이야 — <code>DecorEditor.jsx</code> 의 <code>win.w</code> → <code>win.w * 1.03</code>.
      네가 어느 쪽이 나은지 골라주면 그 값으로 박을게.
    </p>
  </section>

  <section>
    <span class="badge">📐 실측</span>
    <h2>왜 높이 있는 쪽이 잘 잘리나</h2>
    <table>
      <tr><th></th><th>높이 있는 것</th><th>위에서 본 것</th></tr>
      <tr><td>깨끗하게 잘린 컷</td><td><b>4 / 4</b></td><td>3 / 4 (스캘럽 접시 깨짐)</td></tr>
      <tr><td>창 ↔ 그릇 사이</td><td><b>진갈색 선이 있다</b></td><td>선이 없다 (그늘로 이어진다)</td></tr>
      <tr><td>창 밝기 ↔ 테 밝기</td><td>선이 갈라준다</td><td>213 ↔ 224 = <b>차이 11뿐</b></td></tr>
      <tr><td>창이 차지하는 폭</td><td>0.45 ~ 0.63</td><td>0.50 ~ 0.75</td></tr>
    </table>
    <p class="note" style="margin-top:12px">
      ⭐ <b>그 진갈색 선이 두 가지 일을 한다</b> —
      ①네가 말한 「안쪽 테가 사진 위로 물리는」 그 선이고
      ②자르는 도구가 창을 찾을 때 <b>번짐을 멈춰 세우는 벽</b>이야.<br>
      위에서 본 접시엔 그 선이 없어서 창이 테로 새고, 스캘럽 접시는 그래서 반쪽이 날아갔어.
    </p>
  </section>

  <section>
    <h2>골라줘</h2>
    <label class="pick"><input type="radio" name="갈래" value="높이"><span class="dot"></span><span>높이 있는 것으로 간다</span></label>
    <label class="pick"><input type="radio" name="갈래" value="위에서"><span class="dot"></span><span>위에서 본 것으로 간다</span></label>
    <label class="pick"><input type="radio" name="갈래" value="둘다"><span class="dot"></span><span>둘 다 넣는다 (골라 쓰게)</span></label>
    <label class="pick"><input type="radio" name="갈래" value="사진보고"><span class="dot"></span><span>진짜 사진 넣어서 다시 보고 정할게</span></label>

    <h3>오버스캔</h3>
    <label class="pick"><input type="radio" name="오버스캔" value="3%"><span class="dot"></span><span>3% 크게 (테가 물린다)</span></label>
    <label class="pick"><input type="radio" name="오버스캔" value="딱"><span class="dot"></span><span>딱 맞게</span></label>
    <label class="pick"><input type="radio" name="오버스캔" value="더"><span class="dot"></span><span>더 크게 (5%)</span></label>

    <textarea id="out" readonly placeholder="고르면 여기에 정리돼요"></textarea>
    <button id="cp" type="button">복사하기</button>
    <div class="said" id="said"></div>
  </section>
</div>

<script>
  var KEY='hankki:그릇비교0823'
  var box=document.getElementById('out'), said=document.getElementById('said')
  function 값(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}') }catch(e){ return {} } }
  function 그린다(){
    var v=값(), 줄=[]
    document.querySelectorAll('input[type=radio]').forEach(function(el){ if(v[el.name]===el.value) el.checked=true })
    Object.keys(v).forEach(function(k){
      var el=document.querySelector('input[name="'+CSS.escape(k)+'"][value="'+CSS.escape(v[k])+'"]')
      var 글=el?el.parentNode.querySelector('span:last-child').textContent.trim():v[k]
      줄.push('· '+k+' → '+글)
    })
    box.value=줄.length?('[그릇 프레임 판정 · 2026-08-23]\\n'+줄.join('\\n')):''
  }
  document.addEventListener('change',function(e){
    if(e.target.type!=='radio') return
    var v=값(); v[e.target.name]=e.target.value
    try{ localStorage.setItem(KEY,JSON.stringify(v)) }catch(err){}
    그린다()
  })
  document.getElementById('cp').addEventListener('click',function(){
    if(!box.value){ said.textContent='아직 고른 게 없어요'; return }
    // clipboard 는 성공으로 resolve 되고도 실제 복사가 안 되는 폰이 있다(v10.97)
    var 골라주기=function(){
      box.removeAttribute('readonly'); box.focus(); box.select()
      box.setSelectionRange(0,box.value.length)
      said.textContent='글자를 골라뒀어요 — 길게 눌러 복사해주세요'
    }
    try{ navigator.clipboard.writeText(box.value).then(function(){ said.textContent='복사했어요' },골라주기) }
    catch(e){ 골라주기() }
  })
  그린다()
</script>
`

const 낼곳 = join(OUT, '비교.html')
writeFileSync(낼곳, html)
console.log(`\n🍲 그릇 비교 판 → ${낼곳}  (${(html.length / 1024 / 1024).toFixed(1)}MB)\n`)
