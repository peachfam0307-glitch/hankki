// 🔍 [2026-08-22] 「지금 ↔ 바꾼 뒤」를 «글자 라벨»과 함께. 창업자 = "왼쪽은 큐레이션 오른쪽 레시피광고" (내 색 띠가 안 읽혔다)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
const OUT='/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const b64=(p)=>readFileSync(OUT+'/'+p).toString('base64')
const 짝=[
  { 파일:'맞대-큐레이션.png', 제목:'🛒 장보기 — 주부의 장바구니 (큐레이션)', 옛:'ab0_0.png', 새:'키움-장보기.png' },
  { 파일:'맞대-레시피광고.png', 제목:'🍳 레시피 상세 — 광고 (고른 재료)', 옛:'ab1_0.png', 새:'키움-광고.png' },
]
const b=await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
for (const s of 짝){
  const ctx=await b.newContext({viewport:{width:1000,height:600},deviceScaleFactor:2})
  const p=await ctx.newPage()
  await p.setContent('<meta charset="utf8"><style>'
   +'body{margin:0;padding:18px;background:#f6f3ec;font-family:sans-serif;color:#2f2a24}'
   +'h1{font-size:22px;margin:0 0 14px}'
   +'.two{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}'
   +'figcaption{font-size:18px;font-weight:800;text-align:center;padding:9px 0;border-radius:9px;margin:0 0 9px}'
   +'.now{background:#e1dbce;color:#6e6458}.rec{background:#3f7d5a;color:#fff}'
   +'figure{margin:0}img{width:100%;display:block;border-radius:10px;border:1px solid #e6ddcd}'
   +'</style><h1>'+s.제목+'</h1><div class="two">'
   +'<figure><figcaption class="now">지금</figcaption><img src="data:image/png;base64,'+b64(s.옛)+'"></figure>'
   +'<figure><figcaption class="rec">바꾼 뒤</figcaption><img src="data:image/png;base64,'+b64(s.새)+'"></figure>'
   +'</div>')
  await p.waitForTimeout(600)
  writeFileSync(OUT+'/'+s.파일, await p.screenshot({fullPage:true}))
  console.log('✅', s.파일); await ctx.close()
}
await b.close()
