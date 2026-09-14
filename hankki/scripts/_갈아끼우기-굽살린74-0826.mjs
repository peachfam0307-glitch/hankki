// 🍽 굽 살린 새 판에서 «창업자가 깨졌다고 한 34컷을 뺀 나머지»만 앱에 갈아끼운다 (2026-08-26)
//
// 📮 창업자 판정 = 「74컷만 갈아끼우고 34컷은 그대로」
//    · 새 판은 접시 «굽(발)»을 살렸다 — 앞 판이 굽을 통째로 지워 30컷이 세로 10%+ 잘렸다
//    · 창업자가 「깨짐」이라 한 34컷은 아직 완벽하지 않아 **다시 뽑을 때까지 지금 배포판 그대로** 둔다
//
// ⛔ 「땜질」이 아니다 — 라벨 지운 «원본 시트»에서 다시 잘랐다(창업자 *"원본을 가져와서 잘라"*).
//    자른 뒤 알파를 손대는 후처리는 하지 않는다.
//
// ⚠️ PNG 를 갈아끼우면 «비율»도 반드시 다시 잰다(검수 절대원칙 ④ · v8.90 에 59개가 어긋난 적이 있다).
//
// 씀:  node scripts/_갈아끼우기-굽살린74-0826.mjs <판정json>
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const 뿌리 = `${APP}/docs/stickers/음식-창업자-2026-08-26`
const 판정 = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const 그대로 = new Set(판정.깨짐)          // ⛔ 이 컷은 안 건드린다
const 컷 = JSON.parse(fs.readFileSync(`${뿌리}/컷목록.json`, 'utf8'))
const 낼곳 = `${APP}/src/assets/stickers/photo`

const 재기 = (p) => {
  const out = execFileSync('python3', ['-c',
    `from PIL import Image;im=Image.open(${JSON.stringify(p)});print(im.width,im.height)`],
    { encoding: 'utf8' })
  const [w, h] = out.trim().split(' ').map(Number)
  return Number((w / h).toFixed(4))
}

const 바뀐비율 = {}
let 갈아낌 = 0, 건너뜀 = 0, 없음 = 0
for (const c of 컷) {
  if (그대로.has(c.key)) { 건너뜀++; continue }
  const 새길 = `${APP}/${c.src}`
  if (!fs.existsSync(새길)) { 없음++; continue }
  fs.copyFileSync(새길, `${낼곳}/${c.key}.png`)
  바뀐비율[c.key] = 재기(새길)
  갈아낌++
}
console.log(`🖼 갈아낀 컷 ${갈아낌} · 그대로 둔 컷 ${건너뜀}${없음 ? ` · 원본 못 찾음 ${없음}` : ''}`)

// ── PHOTO_RATIO 갱신 — 갈아낀 것만 «그 줄에서» 값을 바꾼다(줄을 새로 만들지 않는다)
const ST = `${APP}/src/components/Stickers.jsx`
let s = fs.readFileSync(ST, 'utf8')
let 고침 = 0, 못찾음 = []
for (const [k, r] of Object.entries(바뀐비율)) {
  const re = new RegExp(`(${k}\\s*:\\s*)[0-9.]+`)
  if (!re.test(s)) { 못찾음.push(k); continue }
  s = s.replace(re, `$1${r}`)
  고침++
}
fs.writeFileSync(ST, s)
console.log(`📐 비율 다시 재서 고친 것 ${고침}개`)
// ⛔ 조용히 넘기지 않는다 — 비율이 안 붙으면 앱에서 그림이 찌그러진다
if (못찾음.length) {
  console.error(`⛔ PHOTO_RATIO 에서 못 찾은 키 ${못찾음.length}개: ${못찾음.join(', ')}`)
  process.exit(1)
}
