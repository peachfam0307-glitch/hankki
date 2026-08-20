#!/usr/bin/env python3
"""🏠 홈 카드 3판 «고르는 판» 만들기 — 캡처를 통째로 박아 폰에서 «크게» 본다.

📮 창업자 = *"해상도가 떨어져서 잘모녀.."* → ⛔나란히 붙여 절반으로 줄인 내 잘못.
   ✅ 낱장을 **원본 해상도 그대로** 박고, 폰에서 눌러 키울 수 있게 한다.
☑️ [절대원칙] 검수판은 «무조건» 체크 ＋ 복사 (창업자 2026-08-19).

⛔ 바깥 파일을 부르지 않는다 — 아티팩트는 외부 요청이 막힌다. 그림은 base64 로 박는다.

쓰기: cd /home/user/hankki/hankki && python3 scripts/_판만들기-홈카드3-0820.py
"""
import base64
import os

H = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홈카드3'
OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홈카드-고르기.html'

안들 = [
    ('0-지금', '지금', '손대기 전', 102, 326, '카드 3장이 가로로 밀려 있고, 두 번째가 오른쪽에 반쯤 잘려 보인다. 진한 파랑이라 무겁다.', True),
    ('라-소식과한벌', '라 — 소식과 한 벌', '「한끼 소식」과 같은 색·같은 모양', 48, 202,
     '소식과 «형제»로 보인다. 창업자가 짚은 「결이 다 달라서 정신없다」를 정면으로 푼다. 새로 그릴 것 0.', False),
    ('가-한줄-흰카드', '가 — 흰 카드', '흰 바탕 ＋ 옅은 파랑 테두리', 48, 202,
     '홈에 흰 카드가 없어서 조용히 눈에 띈다. 위아래 어느 색과도 안 겹친다.', False),
    ('나-한줄-크림', '나 — 크림', '크림 채움 · 테두리 없음', 48, 202,
     '제일 조용하다. 다만 「오늘 뭐 해먹지」 베이지와 비슷해서 묻힐 수 있다.', False),
    ('다-두줄-낮은카드', '다 — 두 줄', '라벨/제목을 두 줄로 ＋ 옅은 파랑 ＋ 왼쪽 막대', 68, 222,
     '한 줄보다 20px 높지만 제목이 길어도 안 잘린다.', False),
]

머리 = """<title>홈 카드 고르기</title>
<style>
:root{--paper:#FBF8F2;--card:#fff;--ink:#33261B;--sub:#7A6A5C;--line:#E7DFD2;--brown:#5D3410;--blue:#5878A0;--sand:#EFE7D9;--good:#3F7D58;--bad:#B4553F;--maybe:#9A8C7A;--sh:0 1px 2px rgba(51,38,27,.05),0 8px 22px rgba(51,38,27,.07)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--paper:#211B16;--card:#2B241E;--ink:#F2EBE1;--sub:#A99B8B;--line:#3D342B;--brown:#D9A87A;--blue:#9BB6D6;--sand:#3A322A;--good:#7FBF9A;--bad:#E29279;--maybe:#A99B8B;--sh:0 1px 2px rgba(0,0,0,.3),0 8px 22px rgba(0,0,0,.35)}}
:root[data-theme="dark"]{--paper:#211B16;--card:#2B241E;--ink:#F2EBE1;--sub:#A99B8B;--line:#3D342B;--brown:#D9A87A;--blue:#9BB6D6;--sand:#3A322A;--good:#7FBF9A;--bad:#E29279;--maybe:#A99B8B;--sh:0 1px 2px rgba(0,0,0,.3),0 8px 22px rgba(0,0,0,.35)}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif;line-height:1.65;padding:0 0 96px;-webkit-text-size-adjust:100%}
.wrap{max-width:620px;margin:0 auto;padding:0 16px}
header{padding:30px 0 8px}
.eyebrow{font-size:12px;letter-spacing:.15em;color:var(--brown);font-weight:800;margin:0 0 9px}
h1{font-size:clamp(24px,6vw,32px);line-height:1.28;margin:0 0 11px;text-wrap:balance}
.lead{margin:0;color:var(--sub);font-size:15px}
.lead b{color:var(--ink);font-weight:600}
.box{margin:20px 0 8px;padding:14px 15px;border-radius:14px;background:var(--card);border:1px solid var(--line);box-shadow:var(--sh);font-size:14.5px;color:var(--sub)}
.box b{color:var(--ink)}
.num{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 0}
.num span{background:var(--sand);color:var(--brown);border-radius:999px;padding:4px 11px;font-size:13px;font-weight:800;font-variant-numeric:tabular-nums}
.card{background:var(--card);border:1px solid var(--line);border-radius:18px;box-shadow:var(--sh);margin:0 0 18px;overflow:hidden}
.card.g{border-color:var(--good);box-shadow:0 0 0 2px color-mix(in srgb,var(--good) 22%,transparent),var(--sh)}
.card.b{opacity:.45}
.hd{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;padding:15px 16px 0}
.hd h2{margin:0;font-size:17.5px;letter-spacing:-.01em}
.hd .d{font-size:13.5px;color:var(--sub)}
.shot{display:block;width:100%;height:auto;margin:12px 0 0;background:var(--sand);cursor:zoom-in}
.shot.zoom{cursor:zoom-out;width:200%;max-width:none}
.scroller{overflow-x:auto;overflow-y:hidden}
.why{margin:0;padding:12px 16px 0;font-size:14px;color:var(--sub)}
.tags{display:flex;gap:7px;flex-wrap:wrap;padding:11px 16px 0}
.tags span{font-size:12px;border-radius:999px;padding:3px 10px;background:var(--sand);color:var(--brown);font-weight:700;font-variant-numeric:tabular-nums}
.pick{display:flex;gap:8px;padding:13px 16px 15px}
.pick button{flex:1;padding:12px 8px;border-radius:11px;cursor:pointer;border:1px solid var(--line);background:transparent;color:var(--sub);font-family:inherit;font-size:14.5px;font-weight:800}
.pick button:hover{background:var(--sand)}
.pick button:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.pick button[aria-pressed="true"][data-v="good"]{background:var(--good);border-color:var(--good);color:#fff}
.pick button[aria-pressed="true"][data-v="bad"]{background:var(--bad);border-color:var(--bad);color:#fff}
.pick button[aria-pressed="true"][data-v="maybe"]{background:var(--maybe);border-color:var(--maybe);color:#fff}
.bar{position:fixed;left:0;right:0;bottom:0;z-index:20;background:color-mix(in srgb,var(--paper) 93%,transparent);backdrop-filter:blur(10px);border-top:1px solid var(--line);padding:11px 16px calc(11px + env(safe-area-inset-bottom))}
.bar-in{max-width:620px;margin:0 auto;display:flex;align-items:center;gap:11px}
.count{font-size:14px;color:var(--sub);flex:1;min-width:0}
.count b{color:var(--ink)}
.bar button{padding:12px 19px;border-radius:12px;border:0;cursor:pointer;background:var(--brown);color:#fff;font-family:inherit;font-size:15px;font-weight:800}
.bar button.ghost{background:transparent;color:var(--sub);border:1px solid var(--line);padding:12px 13px}
#out{max-width:620px;margin:16px auto 0;padding:15px;border-radius:14px;background:var(--card);border:1px solid var(--line);white-space:pre-wrap;font-size:14px;line-height:1.7;display:none;user-select:all;-webkit-user-select:all}
#out.on{display:block}
</style>
<div class="wrap">
<header>
<p class="eyebrow">홈 · 아직 안 해봤어요</p>
<h1>색이 아니라<br>덩치를 줄였어</h1>
<p class="lead">1·2판은 색만 바꿨는데 <b>넷 다 별로</b>였잖아. 그래서 이번엔 <b>줄 수를 줄이고 1장만</b> 뒀어. 그림 눌러서 키워 볼 수 있어.</p>
</header>
<div class="box">
<b>바뀐 것 셋</b> · ① 순서 — 한끼 소식이 맨 위, 그 아래 아직 안 해봤어요 ② 가로 3장 → <b>1장만</b> ③ 「저장해두고 아직 한 번도…」 안내 줄을 접어서 <b>한 줄</b>로
<div class="num"><span>카드 102 → 48px</span><span>위쪽 덩어리 326 → 202px</span><span>카드 속 꼬르곰 3 → 0</span></div>
</div>
"""

꼬리 = """<div id="out" aria-live="polite"></div>
</div>
<div class="bar"><div class="bar-in">
<div class="count" id="count">아직 안 골랐어</div>
<button class="ghost" id="reset" type="button">지우기</button>
<button id="copy" type="button">복사하기</button>
</div></div>
<script>
const 안들=__NAMES__
const KEY='hankki:홈카드3:0820'
let 고른것={};try{고른것=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){고른것={}}
const 라벨={good:'좋다',bad:'버린다',maybe:'모르겠다'}
function 칠하기(){
  document.querySelectorAll('.card').forEach(function(el){
    const k=el.dataset.k
    el.classList.toggle('g',고른것[k]==='good')
    el.classList.toggle('b',고른것[k]==='bad')
    el.querySelectorAll('.pick button').forEach(function(b){b.setAttribute('aria-pressed',고른것[k]===b.dataset.v?'true':'false')})
  })
  const v=Object.values(고른것)
  document.getElementById('count').innerHTML = v.length
    ? '좋다 <b>'+v.filter(x=>x==='good').length+'</b> · 모르겠다 <b>'+v.filter(x=>x==='maybe').length+'</b> · 버린다 <b>'+v.filter(x=>x==='bad').length+'</b>'
    : '아직 안 골랐어'
}
document.querySelectorAll('.pick button').forEach(function(b){
  b.onclick=function(){
    const k=b.closest('.card').dataset.k
    if(고른것[k]===b.dataset.v){delete 고른것[k]}else{고른것[k]=b.dataset.v}
    try{localStorage.setItem(KEY,JSON.stringify(고른것))}catch(e){}
    칠하기()
  }
})
document.querySelectorAll('.shot').forEach(function(im){
  im.onclick=function(){im.classList.toggle('zoom')}
})
document.getElementById('copy').onclick=async function(){
  const 줄=['[홈 「아직 안 해봤어요」 카드 판정]']
  for(const k of ['good','maybe','bad']){
    const 목록=안들.filter(a=>고른것[a.k]===k)
    if(!목록.length)continue
    줄.push('');줄.push('■ '+라벨[k])
    목록.forEach(a=>줄.push('· '+a.n))
  }
  if(줄.length===1)줄.push('(아직 아무것도 안 골랐어요)')
  const 글=줄.join('\\n')
  const out=document.getElementById('out');out.textContent=글;out.classList.add('on')
  try{
    await navigator.clipboard.writeText(글)
    const b=document.getElementById('copy');b.textContent='복사됐어';setTimeout(()=>{b.textContent='복사하기'},1600)
  }catch(e){
    const r=document.createRange();r.selectNodeContents(out)
    const s=getSelection();s.removeAllRanges();s.addRange(r)
  }
  out.scrollIntoView({behavior:'smooth',block:'center'})
}
document.getElementById('reset').onclick=function(){
  고른것={};try{localStorage.removeItem(KEY)}catch(e){}
  document.getElementById('out').classList.remove('on');칠하기()
}
칠하기()
</script>
"""

몸 = []
이름표 = []
for 키, 제목, 설명, 높이, 위쪽, 왜, 지금인가 in 안들:
    p = os.path.join(H, 'zoom-' + 키 + '.png')
    b64 = base64.b64encode(open(p, 'rb').read()).decode()
    이름표.append({'k': 키, 'n': 제목})
    태그 = '<span>카드 ' + str(높이) + 'px</span><span>위쪽 덩어리 ' + str(위쪽) + 'px</span>'
    고르기 = '' if 지금인가 else (
        '<div class="pick">'
        '<button type="button" data-v="good">좋다</button>'
        '<button type="button" data-v="maybe">모르겠다</button>'
        '<button type="button" data-v="bad">버린다</button>'
        '</div>')
    몸.append(
        '<div class="card" data-k="' + 키 + '">'
        '<div class="hd"><h2>' + 제목 + '</h2><span class="d">' + 설명 + '</span></div>'
        '<div class="scroller"><img class="shot" alt="' + 제목 + '" src="data:image/png;base64,' + b64 + '"></div>'
        '<p class="why">' + 왜 + '</p>'
        '<div class="tags">' + 태그 + '</div>'
        + 고르기 + '</div>')

import json
꼬리완성 = 꼬리.split('__NAMES__')
html = 머리 + ''.join(몸) + 꼬리완성[0] + json.dumps(이름표, ensure_ascii=False) + 꼬리완성[1]
open(OUT, 'w').write(html)
print('✅', OUT, str(round(len(html) / 1024)) + 'KB')
