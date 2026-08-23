import fs from 'fs'
import pw from '/home/user/hankki/hankki/node_modules/playwright-core/index.js'
const { chromium } = pw
const D = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const b = (p) => `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`
const items = [
  ['store2/1-hero.png','① 히어로'],
  ['2-decorate-v2.png','② 레꾸'],
  ['3-insta-v3.png','③ 인스타 공유'],
  ['4-icons-v2.png','④ 음식 아이콘'],
  ['5-shopping-combo.png','⑤ 장보기'],
  ['6-curation-v2.png','⑥ 큐레이션'],
  ['7-emotion-v2.png','⑦ 감정'],
  ['8-brand-v2.png','⑧ 브랜드'],
]
const cells = items.map(([f,l])=>`<div><img src="${b(`${D}/${f}`)}"/><div class="l">${l}</div></div>`).join('')
const html=`<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;box-sizing:border-box;font-family:sans-serif}body{background:#e8e6e2;padding:30px;width:2160px}h2{color:#5d3410;margin-bottom:20px;font-size:38px}.g{display:grid;grid-template-columns:repeat(4,1fr);gap:22px}img{width:100%;border-radius:14px;box-shadow:0 8px 20px rgba(0,0,0,.18)}.l{text-align:center;font-size:26px;color:#444;margin-top:10px;font-weight:700}</style></head><body><h2>🏆 한끼 스토어 스크린샷 최종 8장 (순서대로) — Play 폰</h2><div class="g">${cells}</div></body></html>`
const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'})
const p=await br.newPage({viewport:{width:2160,height:1200},deviceScaleFactor:1})
await p.setContent(html,{waitUntil:'networkidle'});await p.waitForTimeout(300)
await p.screenshot({path:`${D}/_final8_v2.png`,fullPage:true});await br.close()
console.log('done')
