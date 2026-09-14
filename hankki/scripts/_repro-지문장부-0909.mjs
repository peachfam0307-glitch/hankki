#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// 🔖 지문 장부 — 「못 얻으면 안 깎는다」와 「안내 = 실제 차감」을 잰다 (2026-09-09)
//
// 📮 창업자 = *"열쇠는 그대로에요 안내했는데 차감되는게 최악이야"*
//    ＋ *"유저는 당연히 열쇠를 하나태웠는데 결과값이 좋게 나와야 하고 우리는 최대한 손해를 안봐야해"*
//
// ⭐ 이 판도 워커를 «직접 import 해서 진짜로 부른다»(절대원칙 30) — 옮겨 적지 않는다.
// ⛔ 다만 «겹쳐 들어올 때»는 여기서 못 잰다 — 가짜 D1 은 진짜 SQL 이 아니다.
//    그건 wrangler 로 진짜 런타임에 올려 쟀다(2026-09-09 · 동시 2·5·20장 30판 전부 1장).
// ═══════════════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
let 통과 = 0, 실패 = 0
const ok = (m, v) => { console.log('  ✅ ' + m + (v !== undefined ? '   ' + v : '')); 통과++ }
const no = (m, v) => { console.log('  ⛔ ' + m + (v !== undefined ? '   ' + v : '')); 실패++ }
const 잰다 = (c, m, v) => (c ? ok(m, v) : no(m, v))
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 읽어 = (p) => fs.readFileSync(path.join(여기, '..', p), 'utf8')

console.log('\n🔖 지문 장부 — 못 얻으면 안 깎는다\n')

// 🧪 가짜 구글 — 모드로 「빈손·부스러기·죽음·오류·정상」을 만든다
let 비전 = { 모드: 'ok', 부른수: 0 }
const 진짜fetch = globalThis.fetch
globalThis.fetch = async (url, o) => {
  if (String(url).includes('vision.googleapis.com')) {
    비전.부른수++
    if (비전.모드 === '죽음') throw new Error('끊김')
    if (비전.모드 === '오류') return new Response('bad', { status: 500 })
    const t = 비전.모드 === '빈손' ? '' : 비전.모드 === '부스러기' ? 'ㅁ ㅇ 3' : '연근 400g\n간장 2큰술\n1. 굽는다'
    return new Response(JSON.stringify({ responses: [{ fullTextAnnotation: { text: t } }] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  return 진짜fetch(url, o)
}
const worker = (await import('../ocr-proxy/worker.js')).default

const 가짜KV = () => {
  const m = new Map()
  return { get: async (k) => (m.has(k) ? m.get(k) : null), put: async (k, v) => { m.set(k, v) }, _m: m }
}
// 🗄 가짜 D1 — 진짜 SQL 은 아니지만 「없으면 넣기」와 「찾기」의 «약속»은 같게 흉내낸다.
const 가짜D1 = () => {
  const 줄 = new Map()
  const run = async (sql, b) => {
    if (sql.startsWith('INSERT OR IGNORE')) {
      const k = b[0] + '|' + b[1]
      if (줄.has(k)) return { meta: { changes: 0 } }
      줄.set(k, { 글자: null, 때: b[2] }); return { meta: { changes: 1 } }
    }
    if (sql.startsWith('UPDATE')) { const k = b[2] + '|' + b[3]; if (줄.has(k)) 줄.set(k, { 글자: b[0], 때: b[1] }); return { meta: { changes: 1 } } }
    if (sql.startsWith('DELETE')) { let n = 0; for (const [k, v] of [...줄]) if (v.때 < b[0]) { 줄.delete(k); n++ }; return { meta: { changes: n } } }
    return { meta: { changes: 0 } }
  }
  return {
    _줄: 줄,
    exec: async () => {},
    prepare: (sql) => ({ bind: (...b) => ({ run: () => run(sql, b), first: async () => 줄.get(b[0] + '|' + b[1]) || null }) }),
  }
}
let ip = 0, 판 = 0
const ENV = (kv, db) => ({ VISION_KEY: 'k', APP_TOKEN: 'T', FOUNDER_SECRET: 'F', OCR_KV: kv, ...(db ? { DB: db } : {}) })
const 읽기 = async (kv, db, 사진, { uid = 'u1', founder = false } = {}) => {
  const h = { 'Content-Type': 'application/json', 'x-hankki-token': 'T',
    Origin: 'https://peachfam0307-glitch.github.io', 'CF-Connecting-IP': '7.0.0.' + (++ip % 250) }
  if (founder) h['x-hankki-founder'] = 'F'
  const req = new Request('https://x/', { method: 'POST', headers: h,
    body: JSON.stringify({ image: 'data:image/png;base64,' + 사진, uid }) })
  const r = await worker.fetch(req, ENV(kv, db))
  return { 응답: r.status, ...(await r.json()) }
}

for (const 창고 of ['D1', 'KV만']) {
  console.log(`── 창고 = ${창고} ${창고 === 'KV만' ? '(창업자가 아직 설정 «전» — 그래도 앱은 돌아야 한다)' : ''}`)
  const db = 창고 === 'D1' ? 가짜D1() : null
  const kv = 가짜KV()
  const p = () => 'p' + (++판)

  비전.모드 = '빈손'
  {
    const a = await 읽기(kv, db, p(), { uid: 'a' + 판 })
    잰다(a.깎음 === false && a.왜 === '빈손', '빈손 → 안 깎는다', `깎음=${a.깎음} 왜=${a.왜}`)
    잰다(a.text === '', '빈손 → 글자를 «아예» 안 준다(말과 결과가 같다)')
    잰다(a.left.welcome === 10, '빈손 → 장수 그대로 10', a.left.welcome)
  }
  비전.모드 = '부스러기'
  {
    const a = await 읽기(kv, db, p(), { uid: 'b' + 판 })
    잰다(a.깎음 === false && a.text === '', '12자 미만 부스러기도 빈손으로 친다')
  }
  비전.모드 = 'ok'
  {
    const uid = 'c' + 판, 사진 = p()
    const a = await 읽기(kv, db, 사진, { uid })
    잰다(a.깎음 === true && a.왜 === '정상', '글자를 얻으면 깎는다', `깎음=${a.깎음}`)
    잰다(a.left.welcome === 9, '장수 10 → 9', a.left.welcome)
    const 전 = 비전.부른수
    const b = await 읽기(kv, db, 사진, { uid })
    잰다(b.깎음 === false && b.왜 === '전에읽음', '같은 사진 다시 → 안 깎는다', `왜=${b.왜}`)
    잰다(b.text === a.text, '기억해둔 글자를 그대로 준다')
    잰다(비전.부른수 === 전, '구글을 다시 «안» 부른다(우리 통도 안 준다)')
    잰다(b.left.welcome === 9, '장수도 그대로 9', b.left.welcome)
  }
  for (const m of ['죽음', '오류']) {
    비전.모드 = m
    const a = await 읽기(kv, db, p(), { uid: 'd' + 판 })
    잰다(a.응답 === 502 && a.깎음 === false, `구글 ${m} → 502 · 안 깎는다`, `깎음=${a.깎음} 왜=${a.왜}`)
  }
  비전.모드 = 'ok'
  {
    const a = await 읽기(kv, db, p(), { uid: 'e' + 판, founder: true })
    잰다(a.깎음 === true, '운영자도 깎음=true — 실제로 깎이므로 «사실»만 말한다', `깎음=${a.깎음}`)
    잰다(a.left.무제한 === true, '운영자 표시는 left.무제한 이 맡는다')
  }
}

// ── 🔒 앱이 «추측»으로 열쇠 얘기를 하지 않나 (소스를 읽어 잰다)
console.log('── 🔒 앱이 서버 사실로만 말하나')
{
  const ocr = 읽어('src/ocr.js')
  const ed = 읽어('src/screens/EditorScreen.jsx')
  잰다(/data\.깎음/.test(ocr), 'ocr.js 가 서버의 깎음 을 «사실»로 센다')
  잰다(/열쇠셈리셋/.test(ed) && /열쇠셈\(\)/.test(ed), '화면이 그 셈을 읽는다')
  const 안썼다줄 = /const 안썼다 = 셈\.앎 && 셈\.깎인장수 === 0/.test(ed)
  잰다(안썼다줄, '「안 썼다」는 «앎 이고 깎인장수 0» 일 때만이다')
  // ⛔⛔ 이 판의 심장 — 「열쇠는 그대로예요」가 나가는 모든 길이 `안썼다` 를 지나야 한다
  // ⛔ 주석 줄은 뺀다 — 「//」로 시작하는 설명은 유저에게 안 나간다.
  //   ⭐ 그래도 «문구가 든 코드 줄»은 하나도 안 놓친다(그게 이 칸의 목적이다).
  const 그대로들 = [...ed.matchAll(/[^\n]*열쇠는 그대로예요[^\n]*/g)]
    .map((m) => m[0]).filter((줄) => !/^\s*(\/\/|\*)/.test(줄))
  잰다(그대로들.length > 0, '「열쇠는 그대로예요」 문구가 있다', 그대로들.length + '곳')
  잰다(그대로들.every((줄) => /안썼다/.test(줄)), '⭐그 문구가 나가는 모든 줄이 «안썼다» 를 본다',
    그대로들.filter((줄) => !/안썼다/.test(줄)).join(' / ') || '')
  잰다(/셈\.안부름/.test(ed) && !/const freeTail = ocrNoVision/.test(ed),
    '「열쇠 안 쓰고 읽었어요」도 짐작이 아니라 «안 불렀다» 사실로 판단한다')
  잰다(/판 === 0 && !_ocrNote/.test(ocr), '통신이 터지면 «자동으로» 한 번 더 보낸다')
  잰다(/_왜 === '처리중'/.test(ocr), '「처리중」이면 잠깐 뒤 말없이 다시 묻는다(창업자 A안)')
  잰다(/_셈\.앎 = false/.test(ocr), '답을 «못 받으면» 모른다고 남긴다(그때는 열쇠 얘기 안 함)')
  // 🏷 제목만 못 찾았을 때 — 사진에 없는 것은 AI 를 또 돌리지 말고 유저가 적게 데려간다
  잰다(/사진에 제목이 없어요 · 직접 적어주세요/.test(ed), '제목이 없으면 «직접 적어주세요»로 데려간다')
  const 제목줄 = (ed.match(/const 제목챙기기 = \(\) => \{[\s\S]*?\n    \}/) || [''])[0]
  잰다(/el\.value\.trim\(\)/.test(제목줄), '이미 제목이 있으면 조용히 넘어간다')
  잰다(!/열쇠/.test(제목줄), '⭐제목 안내에는 열쇠 얘기를 «안» 한다(글자는 얻었으니 정당하게 쓴 것이다)')
  잰다(/setTimeout\(제목챙기기/.test(ed), 'AI 다듬기가 «끝난 뒤»에 본다(AI 가 제목을 채울 수 있다)')
}

// ── 🔒 워커가 순서를 안 뒤집었나
console.log('── 🔒 워커 순서')
{
  const w = 읽어('ocr-proxy/worker.js')
  잰다(w.indexOf('await 자리찜(') < w.indexOf('VISION_URL}?key='),
    '⭐구글을 부르기 «전»에 자리를 찜한다(겹쳐도 한 장만)')
  잰다(w.indexOf('await 장부적기(env, kv, 통, 지문, text)') < w.indexOf('await 유저몫차감()'),
    '⭐장부를 «차감보다 먼저» 적는다(뒤집으면 잃는 쪽이 유저다)')
  잰다(/const 짧은글자 = 12/.test(w) && /goodChars\(text\) < 12/.test(읽어('src/ocr.js')),
    '앱과 서버가 «같은 12자» 잣대를 쓴다')
  잰다(/찜지우기\(env, 통, 지문\)/.test(w), '구글이 실패하면 찜을 지운다(그 사진이 40일 막히지 않게)')
}

console.log(`\n${실패 ? '⛔ ' + 실패 + '칸 실패' : '✅ ' + 통과 + '/' + 통과 + ' 통과'}\n`)
process.exit(실패 ? 1 : 0)
