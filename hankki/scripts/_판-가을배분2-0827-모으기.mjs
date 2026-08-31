/**
 * 🍂 가을 배분판 «2판» 재료 모으기 (2026-08-27)
 *    ⭐ 1판과 다른 점 = **컷마다 번호를 박는다.** 창업자가 「3,4,8,10,12 빼」라고 세어서 말하는데
 *       1판엔 번호가 없어 «어느 것인지» 내가 못 읽었다. 그게 이 판을 다시 만든 이유다.
 *    ⭐ 어제(8/26) 창업자가 준 가을 소품 8컷도 함께 싣는다(scratchpad 임시 복사본에서 읽는다).
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
const A = '/home/user/hankki/hankki/src/assets/stickers'
const NEW = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/가을판2/새컷'
const 찾기 = (k) => {
  if (existsSync(`${NEW}/${k}.png`)) return `${NEW}/${k}.png`
  for (const d of ['photo','deco','frame','tape','buddies','bg','ui','kitchen','candy','candy2','ing','fx','line'])
    for (const ext of ['png','jpg','webp']) {
      const p = `${A}/${d}/${k}.${ext}`
      if (existsSync(p)) return p
    }
  return null
}
const 안 = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const out = {}
const 못찾음 = []
for (const [달, 묶음들] of Object.entries(안)) {
  out[달] = []
  for (const g of 묶음들) {
    const items = []
    for (const it of g.items) {
      const k = typeof it === 'string' ? it : it.k
      const p = 찾기(k)
      if (!p) { 못찾음.push(k); continue }
      execSync(`python3 -c "
from PIL import Image
im = Image.open('${p}').convert('RGBA')
bg = Image.new('RGB', im.size, (250,247,240)); bg.paste(im, mask=im.split()[3])
w,h = bg.size; s = 150/max(w,h)
bg.resize((max(1,int(w*s)), max(1,int(h*s))), Image.LANCZOS).save('/tmp/_t.jpg', quality=76)
"`)
      items.push({ k, 뺌: typeof it === 'object' ? !!it.뺌 : false, 새: typeof it === 'object' ? !!it.새 : false,
                   d: 'data:image/jpeg;base64,' + readFileSync('/tmp/_t.jpg').toString('base64') })
    }
    out[달].push({ ...g, items })
  }
}
writeFileSync(process.argv[3], JSON.stringify(out))
console.log('✅', Object.entries(out).map(([d,gs])=>`${d}=${gs.reduce((a,b)=>a+b.items.length,0)}`).join(' · '))
if (못찾음.length) console.log('⛔ 못 찾음', 못찾음.join(' '))
