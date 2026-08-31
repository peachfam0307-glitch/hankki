/**
 * 🍂 가을 배분판 «재료 모으기» (2026-08-27)
 *    안(JSON)의 키 목록을 읽어 `src/assets/stickers/` 에서 실물을 찾아 132px jpg 로 줄인다.
 *    ⛔ 판이 16MB 상한을 넘지 않게 — 156컷 원본 그대로면 수십 MB 다.
 *    ⛔ 못 찾은 키는 «조용히 빠지지 않고» 끝에 찍는다(빠진 걸 모르면 개수가 틀어진다).
 */

// 🍂 가을 배분판 재료 — 실제 컷을 작게 줄여 data URI 로 (판이 16MB 상한을 안 넘게)
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
const A = '/home/user/hankki/hankki/src/assets/stickers'
const 찾기 = (k) => {
  for (const d of ['photo','deco','frame','tape','buddies','bg','ui','kitchen','candy','candy2','ing','fx']) {
    for (const ext of ['png','jpg','webp']) {
      const p = `${A}/${d}/${k}.${ext}`
      if (existsSync(p)) return p
    }
  }
  return null
}
const 안 = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const out = {}
let 못찾음 = []
for (const [달, 묶음들] of Object.entries(안)) {
  out[달] = []
  for (const g of 묶음들) {
    const items = []
    for (const k of g.items) {
      const p = 찾기(k)
      if (!p) { 못찾음.push(k); continue }
      const tmp = `/tmp/_t.jpg`
      execSync(`python3 -c "
from PIL import Image
im = Image.open('${p}').convert('RGBA')
bg = Image.new('RGB', im.size, (248,246,241)); bg.paste(im, mask=im.split()[3])
w,h = bg.size; s = 132/max(w,h)
bg.resize((max(1,int(w*s)), max(1,int(h*s))), Image.LANCZOS).save('${tmp}', quality=72)
"`)
      items.push({ k, d: 'data:image/jpeg;base64,' + readFileSync(tmp).toString('base64') })
    }
    out[달].push({ ...g, items })
  }
}
writeFileSync(process.argv[3], JSON.stringify(out))
console.log('✅ 모았다 ·', Object.entries(out).map(([d,gs])=>`${d}=${gs.reduce((a,b)=>a+b.items.length,0)}컷`).join(' · '))
if (못찾음.length) console.log('⛔ 못 찾은 키', 못찾음.length, 못찾음.slice(0,10).join(' '))
