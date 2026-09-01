// 📸 「AI로 다시 다듬기」 단추가 «화면에 어떻게 보이나» — 절대원칙 21(보여주기 전에 눈으로 본다)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.json':'application/json', '.woff2':'font/woff2' }
const srv = createServer((q,s)=>{ let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,''); if(p==='/'||p==='')p='/index.html'
  let body,type=MIME[extname(p)]||'application/octet-stream'
  try{body=readFileSync(join(DIST,p))}catch{body=readFileSync(join(DIST,'index.html'));type='text/html'}
  s.writeHead(200,{'content-type':type});s.end(body)})
await new Promise(r=>srv.listen(4702,r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || undefined })
const page = await b.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:2 })
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded','1'); localStorage.setItem('hankki:news:off','1') } catch {} })
await page.goto('http://127.0.0.1:4702/hankki/',{waitUntil:'networkidle'})
await page.waitForTimeout(900)
// 붙여넣기로 담아 «편집 화면»까지 간다 — 그러면 rawText 가 진짜로 채워진다(흉내가 아니다)
await page.getByRole('button', { name: '가져오기' }).first().click()
await page.waitForTimeout(700)
await page.getByText('SNS 보다가 캡처해서 바로 한끼로', { exact: true }).first().click()
await page.waitForTimeout(600)
await page.getByText('Instagram 에서 담는 다른 방법', { exact: false }).first().click()
await page.waitForTimeout(600)
await page.getByText('글을 복사했다면 붙여넣기', { exact: false }).first().click()
await page.waitForTimeout(700)
await page.locator('textarea').first().fill('우엉조림이 생각보다 맛내기 힘들잖아요\n\n—재료\n우엉 1kg\n\n—양념재료\n간장 7T\n노추 1T\n설탕 1T\n\n1.우엉은 껍질을 벗겨 주세요\n2.물엿에 최소 1시간 절여 주세요')
await page.waitForTimeout(200)
await page.getByText('자동 정리하기', { exact: false }).first().click()
await page.waitForTimeout(1200)

const 원문 = page.getByText('사진에서 읽은 원문').first()
if (await 원문.count()) { await 원문.click(); await page.waitForTimeout(500) }
const 단추 = page.getByText('AI로 다시 다듬기').first()
if (await 단추.count()) await 단추.scrollIntoViewIfNeeded()
await page.waitForTimeout(400)
await page.screenshot({ path:'/tmp/again.png' })
console.log('찍음 · 단추 있나 =', await page.getByText('AI로 다시 다듬기').count())
await b.close(); srv.close()
