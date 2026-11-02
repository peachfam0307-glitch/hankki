import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const D='/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad/yj'
const 폰트=readFileSync('/home/user/hankki/hankki/design/promo/fonts-embed.css','utf8')
const 장=[
 ['01','핏물 빼기','양지 600g을 찬물에 30분'],
 ['02','향채 넣기','물 1~1.5L · 대파 · 통마늘 · 다시마\n통후추 · 소금 2작은술 · 양파 1개'],
 ['03','삶기','중약불에서 1시간 30분'],
 ['04','소스 만들기','간장 · 참깨 · 땅콩버터\n좋아하는 걸로 하나만 골라도 돼요'],
 ['05','썰기','한 김 식혀 결 반대로 얇게'],
 ['','양지수육','2인분 · 120분 · 쉬움'],
]
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1080,height:1920}})
for(const [i,[n,t,s]] of 장.entries()){
 const 끝=!n
 await p.setContent(`<style>${폰트}*{margin:0}html,body{background:transparent}
 .w{position:absolute;left:0;right:0;${끝?'top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;align-items:center;background:rgba(30,18,10,.28)':'bottom:0;height:640px;padding:0 84px 150px;display:flex;flex-direction:column;justify-content:flex-end;background:linear-gradient(transparent,rgba(30,18,10,.72))'};color:#FFF6EA;font-family:'Gowun Dodum',sans-serif}
 .n{font-family:'Gowun Dodum';font-size:40px;letter-spacing:.2em;opacity:.8}
 .t{font-family:'Jua';font-size:${끝?150:96}px;line-height:1.05;margin:10px 0 18px;letter-spacing:-.01em}
 .s{font-size:${끝?44:46}px;line-height:1.45;white-space:pre-line;opacity:.95;${끝?'text-align:center':''}}
 .l{width:72px;height:3px;background:#E8B67A;margin:0 0 22px}</style>
 <div class="w">${n?`<div class="n">STEP ${n}</div>`:''}<div class="t">${t}</div>${끝?'':'<div class="l"></div>'}<div class="s">${s}</div>${끝?'<div class="s" style="margin-top:60px;font-size:36px;opacity:.8">한끼 레시피북</div>':''}</div>`)
 await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:`${D}/cap${i+1}.png`,omitBackground:true})
}
await b.close()
