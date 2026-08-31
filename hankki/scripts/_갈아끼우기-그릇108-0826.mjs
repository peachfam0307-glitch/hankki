// 🍽 「그릇」 108컷을 «접시 바닥이 안 깨진 판»으로 갈아끼운다 (2026-08-26)
//
// 📮 창업자 = *"무화과 김치 오이소박이 만두등등 깨졌어아래가"* → *"접시바닥면만 어떻게 잘 해봐ㅠ"*
//
// ⭐ 앞 단계 = `scripts/_다시자르기-그릇108-0826.py` 가 `낱개/` 를 새로 채운다. 이 판은 그걸 앱으로 옮긴다.
//
// ⛔⛔ 다시 자르면 **비율도 바뀐다** — `PHOTO_RATIO` 를 «재서» 같이 고치지 않으면 앱에서 찌그러진다
//    (검수 절대원칙 ④ · v8.90 에 59개가 어긋난 적이 있다). 실측 = 108컷 중 **55컷**의 비율이 달라졌다.
//
// ⛔ 키(`gr_001`~`gr_108`)는 한 글자도 안 바꾼다 — 이미 저장된 레시피가 그 키를 들고 있다.
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const APP = new URL('..', import.meta.url).pathname
const 뿌리 = `${APP}docs/stickers/음식-창업자-2026-08-26`
const 목록 = JSON.parse(readFileSync(`${뿌리}/컷목록.json`, 'utf8'))

// ── ① 낱개 → 앱 자산 ＋ 비율 재기
//    ⛔ 크기는 짐작하지 않는다 — 파일을 열어서 «잰다»
const 재기 = (p) => {
  const out = execFileSync('python3', ['-c',
    `from PIL import Image;im=Image.open(${JSON.stringify(p)});print(im.width,im.height)`], { encoding: 'utf8' })
  const [w, h] = out.trim().split(' ').map(Number)
  return Number((w / h).toFixed(4))
}
let 바뀐비율 = 0
for (const r of 목록) {
  const 낱 = `${APP}${r.src}`
  if (!existsSync(낱)) { console.error(`⛔ ${r.key} — ${r.src} 가 없다`); process.exit(1) }
  copyFileSync(낱, `${APP}src/assets/stickers/photo/${r.key}.png`)
  const 새 = 재기(낱)
  if (Math.abs(새 - r.ratio) > 0.0005) 바뀐비율++
  r.ratio = 새
}
writeFileSync(`${뿌리}/컷목록.json`, JSON.stringify(목록, null, 1))
console.log(`✅ 자산 ${목록.length}개 갈아끼움 · 비율 바뀐 컷 ${바뀐비율}개`)

// ── ② PHOTO_RATIO 의 gr_ 블록을 통째로 다시 적는다
const S = `${APP}src/components/Stickers.jsx`
let s = readFileSync(S, 'utf8')
const 줄들 = []
for (let i = 0; i < 목록.length; i += 6) {
  줄들.push('  ' + 목록.slice(i, i + 6).map((r) => `${r.key}: ${r.ratio.toFixed(4)}`).join(', ') + ',')
}
const 첫 = s.indexOf('  gr_001: ')
const 끝 = s.indexOf('\n', s.indexOf('  gr_103: '))
if (첫 < 0 || 끝 < 0) { console.error('⛔ PHOTO_RATIO 의 gr_ 블록을 못 찾았다'); process.exit(1) }
s = s.slice(0, 첫) + 줄들.join('\n') + s.slice(끝)
writeFileSync(S, s)
console.log(`✅ PHOTO_RATIO — gr_ ${목록.length}개 줄 다시 적음`)
