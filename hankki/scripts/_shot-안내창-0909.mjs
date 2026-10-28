// 📸 「까닭마다 제 말이 나간다」 눈으로 보기 — 2026-09-09
//   ⭐ 절대원칙 21 — 창업자에게 보여주기 «전»에 내가 열어서 본다.
//   ⭐ 절대원칙 30 — 앱은 «진짜»(dist)를 쓰고 «바깥 세계»(OCR·AI 워커)만 가로챈다.
// 찍는 것 = ① 도는 중 ② 다 됐어요 ③ AI 못 함 ④ 글자가 안 보여요(열쇠 그대로)
// 실행: SMOKE_CHROMIUM=… node scripts/_shot-안내창-0909.mjs
// 🏷 이름표 = 눈으로 보는 판 · smoke 아님
import './_fresh.mjs'
import { COACH } from '../src/coach.js'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const OUT = process.env.SHOT_DIR || '/tmp/shot-안내창-0909'
mkdirSync(OUT, { recursive: true })
const PORT = 4487
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (!p || p === '/') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(PORT, r))
const URL0 = `http://127.0.0.1:${PORT}/hankki/`

const 읽은글 = ['무화과 부라타 잠봉 샐러드','[재료]','무화과 3개','부라타치즈 1개','잠봉 4장','[만드는 법]','1. 무화과를 4등분해요','2. 접시에 담아 올리브유를 둘러요'].join('\n')
const AI답 = { title:'무화과 부라타 잠봉 샐러드', ingredients:['무화과 3개','부라타치즈 1개','잠봉 4장'], steps:['무화과를 4등분해요','접시에 담아 올리브유를 둘러요'] }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const 공유심기 = async (ctx) => {
  const p0 = await ctx.newPage(); await p0.goto(URL0, { waitUntil: 'load' })
  await p0.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1350
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0,0,1080,1350)
    x.fillStyle = '#222'; x.font = '36px sans-serif'; x.fillText('(캡처 흉내)', 60, 200)
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.8))
    const cache = await caches.open('hankki-shared')
    await cache.put('shared-meta', new Response(JSON.stringify({ hasImage:true, imageCount:1, title:'', text:'', url:'' }), { headers:{'content-type':'application/json'} }))
    await cache.put('shared-image-0', new Response(blob, { headers:{'content-type':'image/jpeg'} }))
    localStorage.setItem('hankki:onboarded','1'); localStorage.setItem('hankki:news:off','1')
  })
  // ⛔ 코치 안내(손가락 카드)가 창을 «가린다» — 본 것으로 해 둔다 [2026-09-09 실물 확인]
  await ctx.addInitScript((ks) => ks.forEach((k) => localStorage.setItem(k, '1')), Object.values(COACH))
  await p0.close()
}
// 🌍 바깥 세계만 가로챈다 — OCR 이 무엇을 돌려줄지(글자·빈손)와 AI 성공 여부를 정한다
const 가로채기 = (page, { OCR = {}, AI = true, 지연 = 0 }) => {
  page.route('**/hankki-ocr.annyeong-hankki.workers.dev/**', (route) => {
    const body = route.request().postData() || ''
    if (/"기본"/.test(body)) return route.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({ 웰컴:10, 매월:5 }) })
    route.fulfill({ status:200, contentType:'application/json',
      // ⛔ 진짜 워커와 «같은 모양»으로 보낸다 — total 만 보내면 앱이 0 으로 읽어 「0개 남았어요」가 뜬다
      //    (2026-09-09 실물 확인 · ocr.js:180 은 welcome·month 를 읽는다). 가짜가 나를 속이면 안 된다.
      body: JSON.stringify({ text: 읽은글, 깎음: true, 왜: '정상',
        left: { 무제한:false, welcome:9, month:5, cap:10, bonus:0, earned:[], anon:3, acct:10, monthly:5, signed:true }, ...OCR }) })
  })
  page.route('**/hankki-tidy.annyeong-hankki.workers.dev/**', async (route) => {
    await new Promise((r) => setTimeout(r, 지연))
    if (!AI) return route.fulfill({ status:500, contentType:'application/json', body:'{"error":"shot_fail"}' })
    route.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(AI답) })
  })
}
const 찍기 = async (이름, opts, 기다림) => {
  const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2 })
  await 공유심기(ctx)
  const p = await ctx.newPage(); p.on('pageerror', (e) => console.log('  ⚠️', e.message.slice(0,120)))
  가로채기(p, opts)
  await p.goto(URL0, { waitUntil: 'load' })       // ⛔ networkidle 은 AI 답까지 기다려 «도는 중»을 못 찍는다
  await p.waitForTimeout(기다림)
  await p.screenshot({ path: join(OUT, 이름 + '.png') })
  console.log('📸', 이름, '=', (await p.evaluate(() => document.body.innerText)).replace(/\n/g,' | ').slice(0,150))
  await ctx.close()
}

await 찍기('1-도는중', { 지연: 30000 }, 4000)
await 찍기('2-다됐어요', { 지연: 1200 }, 7000)
await 찍기('3-AI못함', { AI: false, 지연: 800 }, 7000)
await 찍기('4-글자가안보여요', { OCR: { text:'', 깎음:false, 왜:'빈손' } }, 6000)

await b.close(); srv.close()
console.log('\n📂', OUT)
