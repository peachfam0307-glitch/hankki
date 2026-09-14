// 🔓🔓 「백업 파일에서 잠긴 일기가 «새나»」를 실제로 잰다 (2026-08-19)
//
// 📮 창업자 = *"백업할때 일기 잠금 풀리는건 어떻게 해결해? 하고있어?"* → 갈래 셋 중 *"일기는 b로 가자"*
//
// ⭐⭐ **이 검사의 심장 = 「문구가 정직한가」가 아니라 «백업 글자 안에 본문이 있나»**.
//    ⛔ 화면이 잘 뜨는지는 안 본다 — 새는 건 «파일»이지 «화면»이 아니었다.
//       (앱 화면으로는 원래 못 열었다 — `checkPin` 이 비번 없이는 무조건 false 를 준다)
//
// 🧪 재는 것 넷
//   ① 잠근 일기의 본문이 백업 «글자»에 남아 있나          → 있으면 ⛔ 샌다
//   ② 안 잠근 일기는 그대로 담기나                        → 안 담기면 ⛔ 잃는다
//   ③ 맞는 비번으로 «다시 풀리나»                         → 안 풀리면 ⛔ 영영 못 본다
//   ④ 틀린 비번이면 «잠긴 채로 남나»(지워지지 않나)        → 지워지면 ⛔ 잃는다
//
// ⚠️ `diaryLock.js` 는 브라우저 것(localStorage·crypto.subtle)이라 **Node 로 못 부른다.**
//    → 크로미움 «안»에서 진짜 모듈을 불러 잰다. 흉내가 아니다(절대원칙 30과 같은 생각).
//
// 쓰기: SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_repro-백업일기샘-0819.mjs
// ⛔ chromium 경로를 코드에 박지 않는다 — 이 컨테이너에만 있는 길이라 CI 가 죽는다(v10.90 사고).
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'

const 소스 = readFileSync(new URL('../src/diaryLock.js', import.meta.url), 'utf8')

// ⭐ https·localhost 라야 crypto.subtle 이 산다 → 작은 서버로 띄운다(file:// 은 안 된다).
const srv = createServer((req, res) => {
  if (req.url.startsWith('/diaryLock.js')) {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' })
    res.end(소스)
    return
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end('<!doctype html><meta charset=utf-8><body>')
})
await new Promise((r) => srv.listen(0, '127.0.0.1', r))
const 주소 = `http://127.0.0.1:${srv.address().port}/`

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const p = await b.newPage()
const 오류 = []
p.on('pageerror', (e) => 오류.push(String(e)))
await p.goto(주소)

const 잰값 = await p.evaluate(async (주소) => {
  const L = await import(주소 + 'diaryLock.js')
  const 칸 = ['title', 'note', 'line', 'weather', 'note2', 'note3', 'note4']

  // 비번을 심는다(앱이 하는 그대로)
  await L.setPin('1234', '')

  const 비밀 = '아무한테도 못 할 말을 여기 적었다'
  const 공개 = '오늘 김치찌개 성공'
  const 일기 = [
    { id: 'a', kind: 'diary', at: 1, locked: true, note: 비밀, line: '잠긴 한 줄', font: 'x' },
    { id: 'b', kind: 'diary', at: 2, note: 공개 },
  ]

  const 잠근것 = await L.백업용잠그기(일기, 칸)
  const 글자 = JSON.stringify({ diary: 잠근것 }) // ← 실제 백업 파일이 되는 그 글자

  const 결과 = {
    crypto있나: !!globalThis.crypto?.subtle,
    // ① 본문이 백업 글자에 남았나
    샘_본문: 글자.includes(비밀),
    샘_한줄: 글자.includes('잠긴 한 줄'),
    // ② 안 잠근 일기는 그대로 있나
    공개유지: 글자.includes(공개),
    잠긴표식: 글자.includes('_hankkiLocked'),
    센장수: L.잠긴장수(잠근것),
    // ⭐ 글씨체 같은 «글 아닌 것»은 그대로 둔다
    글씨체유지: 잠근것[0].font === 'x',
  }

  // ③ 맞는 비번으로 풀리나
  const 맞게 = await L.백업풀기(잠근것, '1234')
  결과.풀린수 = 맞게.푼수
  결과.풀린본문맞나 = 맞게.일기목록[0].note === 비밀
  결과.풀린한줄맞나 = 맞게.일기목록[0].line === '잠긴 한 줄'
  결과.푼뒤표식지움 = !맞게.일기목록[0]._hankkiLocked

  // ④ 틀린 비번이면 «잠긴 채로» 남나 (지워지면 안 된다)
  const 틀리게 = await L.백업풀기(잠근것, '9999')
  결과.틀린비번_푼수 = 틀리게.푼수
  결과.틀린비번_못푼수 = 틀리게.못푼수
  결과.틀린비번_안지워짐 = !!틀리게.일기목록[0]._hankkiLocked
  결과.틀린비번_본문없음 = 틀리게.일기목록[0].note == null

  return 결과
}, 주소)

await b.close()
srv.close()

const 칸들 = [
  ['crypto.subtle 이 산다', 잰값.crypto있나 === true],
  ['① 잠근 본문이 백업 글자에 «없다»', 잰값.샘_본문 === false],
  ['① 잠근 한 줄도 «없다»', 잰값.샘_한줄 === false],
  ['② 안 잠근 일기는 그대로 담긴다', 잰값.공개유지 === true],
  ['② 잠금 표식이 붙는다', 잰값.잠긴표식 === true],
  ['② 잠긴 장수를 센다 (1장)', 잰값.센장수 === 1],
  ['② 글씨체 같은 «글 아닌 것»은 안 건드린다', 잰값.글씨체유지 === true],
  ['③ 맞는 비번으로 1장 풀린다', 잰값.풀린수 === 1],
  ['③ 푼 본문이 원래와 같다', 잰값.풀린본문맞나 === true],
  ['③ 푼 한 줄도 같다', 잰값.풀린한줄맞나 === true],
  ['③ 풀면 표식이 지워진다', 잰값.푼뒤표식지움 === true],
  ['④ 틀린 비번이면 안 풀린다', 잰값.틀린비번_푼수 === 0],
  ['④ 틀린 비번이면 «잠긴 채로» 남는다 (안 지운다)', 잰값.틀린비번_안지워짐 === true],
  ['④ 틀린 비번이면 본문이 안 보인다', 잰값.틀린비번_본문없음 === true],
  ['pageerror 0건', 오류.length === 0],
]

console.log('\n🔓 백업 안 잠긴 일기 — 새나 안 새나')
for (const [이름, ok] of 칸들) console.log(`   ${ok ? '✅' : '⛔'} ${이름}`)
const 통과 = 칸들.filter(([, ok]) => ok).length
console.log(`\n   ${통과}/${칸들.length} 통과`)
if (오류.length) console.log('   ⛔ pageerror:', 오류)
if (통과 !== 칸들.length) {
  console.log('\n📌 ①이 깨지면 «백업 파일을 메모장으로 열면 일기가 보인다» — 창업자가 고치라던 바로 그것이다.')
  process.exit(1)
}
console.log('   📌 이 검사의 심장 = «백업 글자 안에 본문이 있나». 화면은 안 본다.')
