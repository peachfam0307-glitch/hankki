// ✍️ 홍보 카드 슬로건 «글씨체 고르기» 판 (2026-08-20)
//
// 📮 창업자 = *"글씨체 저거시렁.."* (첫 판은 Black Han Sans 였다)
//
// ⭐ 규칙 8·11 — **시행착오는 내가, 판정은 창업자.** 하나씩 물어보면 여러 번 오간다.
//    그래서 **앱이 이미 가진 글씨체 전부**를 «실제 카드 크기»로 한 판에 뽑는다.
// ⛔ 새 글씨체를 웹에서 받아오지 않는다 — 이 환경은 웹이 막혀 있고, 앱에 없는 글씨체를
//    카드에 쓰면 «앱과 카드가 다른 옷»을 입는다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-슬로건글씨체-0820.mjs
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홍보'
mkdirSync(OUT, { recursive: true })
const 폰트칸 = join(ROOT, 'src/assets/fonts')
const b64 = (p) => readFileSync(p).toString('base64')

// 📚 앱에 실린 한글 글씨체를 «파일에서» 읽는다 — 손으로 적으면 낡는다
const 있는것 = readdirSync(폰트칸).filter((f) => f.endsWith('-korean-400.woff2')).map((f) => f.replace('-korean-400.woff2', ''))
const 이름표 = {
  blackhansans: 'Black Han Sans · 굵은 고딕', jua: '주아 · 둥글고 친근',
  dohyeon: '도현 · 단단한 둥근고딕', cutefont: '귀염체', gaegu: '개구 · 메모지에 쓰는 손글씨',
  'gowun-dodum': '고운돋움 · 앱 본문 글씨', dongle: '동글 · 아주 둥글',
  gamjaflower: '감자꽃 · 손글씨', himelody: '하이멜로디 · 손글씨',
  nanumpen: '나눔펜 · 펜글씨', poorstory: '푸어스토리 · 손글씨', singleday: '싱글데이 · 손글씨',
}
const 순서 = ['jua', 'dohyeon', 'cutefont', 'dongle', 'blackhansans', 'gowun-dodum', 'gaegu', 'gamjaflower', 'himelody', 'poorstory', 'singleday', 'nanumpen']
const 고를것 = 순서.filter((n) => 있는것.includes(n)).concat(있는것.filter((n) => !순서.includes(n)))

const 색 = { 바탕: '#f7f1e6', 잉크: '#4a3520', 연잉크: '#8a7355', 강조: '#c2762e' }

const 얼굴 = 고를것.map((n) => {
  const ko = join(폰트칸, `${n}-korean-400.woff2`)
  const la = join(폰트칸, `${n}-latin-400.woff2`)
  let css = `@font-face{font-family:'${n}';src:url('data:font/woff2;base64,${b64(ko)}') format('woff2')}`
  try { css += `@font-face{font-family:'${n}';src:url('data:font/woff2;base64,${b64(la)}') format('woff2')}` } catch {}
  return css
}).join('\n')

const 칸 = 고를것.map((n, i) => `
  <div class="줄">
    <div class="번호">${String(i + 1).padStart(2, '0')}</div>
    <div>
      <div class="슬로건" style="font-family:'${n}',sans-serif">한 끼를 해낸다면, <span class="레꾸">레꾸</span>하세요.</div>
      <div class="이름">${이름표[n] || n}</div>
    </div>
  </div>`).join('')

const html = `<!doctype html><meta charset="utf-8">
<style>
  ${얼굴}
  @font-face{font-family:'GD';src:url('data:font/woff2;base64,${b64(join(폰트칸, 'gowun-dodum-korean-400.woff2'))}') format('woff2')}
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:${색.바탕};font-family:'GD',sans-serif;padding:56px 64px}
  h1{font-size:38px;color:${색.잉크};margin-bottom:8px}
  .안내{font-size:23px;color:${색.연잉크};margin-bottom:44px;line-height:1.6}
  .줄{display:flex;gap:30px;align-items:center;padding:30px 34px;background:#fffdf8;
      border-radius:26px;margin-bottom:20px;box-shadow:0 3px 14px #5d341012}
  .번호{font-family:'GD';font-size:30px;color:${색.연잉크};flex:0 0 60px;font-variant-numeric:tabular-nums}
  .슬로건{font-size:56px;color:${색.잉크};line-height:1.3;letter-spacing:-.02em}
  .레꾸{color:${색.강조}}
  .이름{font-family:'GD';font-size:22px;color:${색.연잉크};margin-top:10px}
</style>
<h1>슬로건 글씨체 고르기</h1>
<div class="안내">앱에 이미 실려 있는 글씨체 ${고를것.length}가지 · 실제 카드에 쓰이는 크기로 뽑았어요.<br>번호만 말해 주면 그걸로 카드를 다시 만들어요.</div>
${칸}`

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 1180, height: 1400 }, deviceScaleFactor: 1 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(320)
await page.screenshot({ path: join(OUT, '글씨체-고르기.png'), fullPage: true })
await b.close()
console.log(`✅ 글씨체 ${고를것.length}가지 → ${join(OUT, '글씨체-고르기.png')}`)
console.log('   ' + 고를것.join(' · '))
