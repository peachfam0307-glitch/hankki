// 🔍 판을 «열자마자» 배경이 들어오나 — 탭을 누르기 «전»을 본다.
// ⛔ 2026-09-09 사고 = 첫 배경 넣는 줄을 빼먹어 무대가 32px 로 찌그러졌다(창업자 = "탭화면이 깨짐").
//    내가 확인할 땐 탭을 눌러본 뒤라 멀쩡해 보였다 → **누르기 전을 본다.**
import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
for (const w of [360, 390, 900]) {
  const p = await b.newPage({ viewport: { width: w, height: 800 } })
  p.on('pageerror', (e) => console.log('❌', w, e.message))
  await p.goto('file:///tmp/탭장식판.html')
  await p.waitForTimeout(1500)
  const r = await p.evaluate(() => {
    const im = document.getElementById('bg'); const b = im.getBoundingClientRect()
    return { 사진: im.naturalWidth + 'x' + im.naturalHeight, 보임: Math.round(b.width) + 'x' + Math.round(b.height),
      가로넘침: document.documentElement.scrollWidth > document.documentElement.clientWidth }
  })
  console.log(w, JSON.stringify(r))
  if (r.사진 === '0x0' || parseInt(r.보임.split('x')[1]) < 200) console.log('❌❌ 배경이 안 들어왔다')
  await p.screenshot({ path: `/tmp/탭첫${w}.png` })
  await p.close()
}
await b.close()
