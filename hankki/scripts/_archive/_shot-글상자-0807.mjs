import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/글상자실물'
mkdirSync(OUT, { recursive: true })
const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let body,type=MIME[extname(p)]||'application/octet-stream';try{body=readFileSync(join(DIST,p))}catch{body=readFileSync(join(DIST,'index.html'));type='text/html'}s.writeHead(200,{'content-type':type});s.end(body)})
await new Promise(r=>srv.listen(4420,r))
const { BASICS_VERSION } = await import('/home/user/hankki/hankki/src/data/basics.js')
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await (await b.newContext({ viewport:{width:360,height:800}, deviceScaleFactor:3 })).newPage()
await page.addInitScript((s)=>{localStorage.clear();localStorage.setItem('hankki:v1',JSON.stringify(s));localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');for(const k of ['home','home2','detail','brag','shop','myrecipes','profile','decor'])localStorage.setItem(`hankki:coach:${k}`,'1')},{recipes:[],seedV:BASICS_VERSION,diary:[{id:'dd',kind:'diary',at:Date.now(),paper:{rule:'plain',skin:'ivory',art:'none'},note:'',decor:[]}]})
await page.goto('http://127.0.0.1:4420/hankki/',{waitUntil:'networkidle'});await page.waitForTimeout(1300)
await page.getByText('레시피',{exact:true}).last().click();await page.waitForTimeout(500)
await page.locator('.segment .seg').nth(1).click();await page.waitForTimeout(500)
await page.getByRole('button',{name:/일기 (쓰기|보기)/}).first().click();await page.waitForTimeout(900)
await page.getByRole('button',{name:'꾸미기 열기'}).first().click();await page.waitForTimeout(1200)
await page.getByRole('button',{name:'일꾸',exact:true}).last().click();await page.waitForTimeout(600)
await page.getByRole('button',{name:'글자',exact:true}).last().click();await page.waitForTimeout(700)
const cells = page.locator('.decor-drawer button[aria-label^="글 상자"]')
// 네 종류를 붙여 본다 — 라벨지·찢은종이·메모지·프레임
const picks = [[0,'오늘 김치찌개'],[12,'국물이 진해'],[17,'8월 7일 금요일\n오늘도 해냈다'],[36,'우리집 최고']]
// ⚠️ 2026-08-07 부터 시트가 «안» 열린다 — 붙이면 그 상자에서 바로 쳐진다.
//    ⛔ 첫 판이 여기서 죽었다: 앞 상자의 치는 칸이 아직 떠 있어 다음 서랍 칸을 못 눌렀다.
//       → 매번 «종이 밖»을 눌러 치기를 끝낸 뒤 다음 것을 붙인다.
for (const [i,t] of picks) {
  await page.mouse.click(8,300); await page.waitForTimeout(300)
  await cells.nth(i).click(); await page.waitForTimeout(800)
  const ta = page.locator('.decor-stage textarea[data-boxtext]').first()
  if (await ta.count()) { await ta.fill(t); await page.waitForTimeout(350) }
  await page.mouse.click(8,300); await page.waitForTimeout(400)
  await page.evaluate(([k])=>{const el=[...document.querySelectorAll('.decor-stage [style*="rotate"]')].pop();if(el){el.style.top=`${18+k*22}%`;el.style.left='50%'}},[picks.findIndex(p=>p[0]===i)])
  await page.waitForTimeout(200)
}
await page.mouse.click(8,300); await page.waitForTimeout(600)
const box = await page.locator('.decor-stage').boundingBox()
writeFileSync(join(OUT,'글상자-실물.png'), await page.screenshot({clip:{x:Math.round(box.x),y:Math.round(box.y),width:Math.round(box.width),height:Math.round(box.height)}}))
console.log('📸 글상자-실물')
await b.close(); srv.close()
