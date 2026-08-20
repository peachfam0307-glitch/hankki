#!/usr/bin/env python3
"""🏠 홈 카드 4판 «고르는 판» — 「오늘 뭐 해먹지」와 한 벌로 맞춘 넷.

📮 창업자 3판 판정 = *"라는 색이 한끼소식이랑 반대라서 지저분해보이고, 나는 너무 안읽히려나"*
   ＋ *"1줄이라 오늘뭐해먹지랑 같은 색 구성인데 반대로 보여"* ← 이 한 줄이 답을 줬다
☑️ [절대원칙] 검수판은 «무조건» 체크 ＋ 복사 (창업자 2026-08-19)

쓰기: cd /home/user/hankki/hankki && python3 scripts/_판만들기-홈카드4-0820.py
"""
import base64
import json
import os

H = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홈카드4'
OLD = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홈카드3'
OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홈카드-고르기2.html'

안들 = [
    (OLD, '0-지금', '지금', '손대기 전', '102px', '8.4', '3.6',
     '진한 파랑에 카드 3장. 「오늘 뭐 해먹지」와 결이 완전히 달라서 따로 논다.', True),
    (H, '나-왼쪽막대', '나 — 왼쪽 막대 ⭐', '같은 베이지 ＋ 왼쪽 파란 막대 4px', '48px', '8.41', '3.57',
     '바탕은 「오늘 뭐 해먹지」와 한 벌인데, 막대 하나로 「이건 다른 줄」이 바로 읽힌다. 글자를 안 건드려서 조용하다.', False),
    (H, '가-똑같이', '가 — 똑같이', '「오늘 뭐 해먹지」와 완전히 같은 베이지 · 경계 없음', '48px', '8.41', '3.57',
     '제일 조용하다. 둘이 완전한 한 벌. 다만 카드 경계가 없어서 「한 덩어리」로 보일 수 있다.', False),
    (H, '다-한톤진하게', '다 — 한 톤 진하게', '같은 계열인데 살짝 진한 베이지', '48px', '7.65', '3.25',
     '막대 없이 색만으로 갈린다. 형제인데 살짝 앞에 나와 있는 느낌.', False),
    (H, '라-라벨강조', '라 — 라벨 알약', '같은 베이지 ＋ 라벨을 알약으로', '48px', '8.41', '4.12',
     '라벨이 알약이 되어 시선이 먼저 붙는다. 「새로」 뱃지와 같은 문법이라 앱 안에서 안 낯설다. 대비도 제일 높다.', False),
]

머리 = """<title>홈 카드 마지막 넷</title>
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
table{width:100%;border-collapse:collapse;margin:11px 0 0;font-size:13.5px}
th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line)}
th{color:var(--brown);font-weight:800}
td.n{font-variant-numeric:tabular-nums}
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
<p class="eyebrow">홈 · 아직 안 해봤어요 · 마지막 넷</p>
<h1>「오늘 뭐 해먹지」랑<br>한 벌로 맞췄어</h1>
<p class="lead">네가 짚은 <b>“1줄이라 오늘뭐해먹지랑 같은 색 구성인데 반대로 보여”</b> — 그게 답이었어. 넷 다 그 카드와 <b>같은 베이지</b>로 맞추고, 갈리는 건 <b>경계를 어떻게 주나</b>뿐이야.</p>
</header>
<div class="box">
<b>재보니 네 말이 맞았어</b> — 색을 실제로 뽑아 견줬어.
<table>
<tr><th>카드</th><th>바탕</th><th>라벨</th></tr>
<tr><td>오늘 뭐 해먹지</td><td>베이지 #efe9dc</td><td>파랑 #5878a0</td></tr>
<tr><td>3판 「라」</td><td><b>파랑</b> #e6eef0</td><td>파랑 #5878a0</td></tr>
</table>
<p style="margin:9px 0 0">구성은 똑같은데 <b>바탕만 뒤집혀</b> 있었어. 그래서 「반대로 보여」가 나온 거야.</p>
<p style="margin:9px 0 0"><b>“너무 안 읽히려나”</b>도 재봤어 — <b>제목 대비 8.4</b>야. 기준(4.5)의 거의 두 배라 잘 읽혀. 라벨은 3.6인데, <b>「오늘 뭐 해먹지」도 똑같은 3.6</b>이라 지금 앱과 같은 수준이야.</p>
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
const KEY='hankki:홈카드4:0820'
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
document.querySelectorAll('.shot').forEach(function(im){im.onclick=function(){im.classList.toggle('zoom')}})
document.getElementById('copy').onclick=async function(){
  const 줄=['[홈 「아직 안 해봤어요」 마지막 판정]']
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
for 폴더, 키, 제목, 설명, 높이, 제목대비, 라벨대비, 왜, 지금인가 in 안들:
    # 📮 창업자 *"조금 더 전체샷으로 찍어줄래"* → 카드 언저리(zoom)가 아니라 «화면 전체»를 박는다
    p = os.path.join(폴더, 키 + '.png')
    b64 = base64.b64encode(open(p, 'rb').read()).decode()
    이름표.append({'k': 키, 'n': 제목})
    태그 = ('<span>카드 ' + 높이 + '</span><span>제목 대비 ' + 제목대비 + '</span><span>라벨 대비 ' + 라벨대비 + '</span>')
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

앞, 뒤 = 꼬리.split('__NAMES__')
open(OUT, 'w').write(머리 + ''.join(몸) + 앞 + json.dumps(이름표, ensure_ascii=False) + 뒤)
print('✅', OUT, str(round(os.path.getsize(OUT) / 1024)) + 'KB')
