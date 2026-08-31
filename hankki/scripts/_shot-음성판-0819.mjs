// 🎤 «말로 되나» 시험 페이지(public/voicetest.html)를 실제로 열어서 찍는다 — 2026-08-19
//
// ⭐ 왜 이게 있나 = 절대원칙 21 「창업자에게 보여주기 «전»에 내가 실물을 «열어서» 본다」.
//    숫자(빌드 통과·smoke 통과)는 «가려진 것»을 모른다. 열어봐야 안다.
//
// ⚠️ 이 판이 «못» 재는 것 — 정직하게 적어 둔다:
//    · 마이크·목소리는 헤드리스 크로미움에 «없다» → ①읽어주기 ②듣기는 여기서 판정 불가
//    · 그래서 진짜 판정은 «창업자 폰»에서만 난다. 여기서 보는 건 글자·자리·테마뿐이다.
//
// 쓰는 법:  cd hankki && node scripts/_shot-음성판-0819.mjs [주소]
//   ⛔ vite preview 는 «루트»로 서브한다 — /hankki/ 가 아니다(v11.15 때 30분 헤맸다)
import { chromium } from 'playwright'

const 주소 = process.argv[2] || 'http://127.0.0.1:4399/voicetest.html'
const b = await chromium.launch()
let 나쁨 = 0

for (const [이름, scheme] of [['밝은', 'light'], ['어두운', 'dark']]) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme })
  const 오류 = []
  p.on('pageerror', (e) => 오류.push(String(e)))
  await p.goto(주소, { waitUntil: 'networkidle' })
  await p.waitForTimeout(400)
  const 낼곳 = `/tmp/voicetest-${scheme}.png`
  await p.screenshot({ path: 낼곳, fullPage: true })

  const 잰것 = await p.evaluate(() => {
    const 색 = (el) => getComputedStyle(el).color
    const 바탕 = getComputedStyle(document.body).backgroundColor
    return {
      높이: document.body.scrollHeight,
      가로넘침: document.documentElement.scrollWidth > window.innerWidth,
      바탕,
      글자색: 색(document.body),
      // ⛔ 바탕이 투명하면 보는 사람 테마를 빌려 쓴다(글자가 안 보이는 그 사고)
      바탕투명: /rgba\(0, 0, 0, 0\)|transparent/.test(바탕),
      단추수: document.querySelectorAll('button').length,
      요약: (document.getElementById('sum') || {}).textContent || '',
    }
  })
  const 탈 = []
  if (잰것.가로넘침) 탈.push('가로로 넘친다')
  if (잰것.바탕투명) 탈.push('body 바탕이 투명하다')
  if (오류.length) 탈.push(`pageerror ${오류.length}건`)
  if (잰것.단추수 !== 4) 탈.push(`단추가 ${잰것.단추수}개(4개여야 한다)`)
  나쁨 += 탈.length

  console.log(`\n[${이름}판] ${낼곳}`)
  console.log(`  높이 ${잰것.높이}px · 단추 ${잰것.단추수}개 · 바탕 ${잰것.바탕} · 글자 ${잰것.글자색}`)
  console.log(`  ${탈.length ? '⛔ ' + 탈.join(' · ') : '✅ 가로넘침·투명바탕·pageerror 없음'}`)
  if (scheme === 'light') console.log('  요약칸:', 잰것.요약.split('\n').slice(0, 3).join(' | '))
  await p.close()
}

await b.close()
console.log(나쁨 ? `\n⛔ ${나쁨}건 — 고치고 다시` : '\n✅ 둘 다 통과 — 이제 «눈으로» 열어본다(그게 절대원칙 21)')
process.exit(나쁨 ? 1 : 0)
