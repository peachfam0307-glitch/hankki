import { chromium } from 'playwright'
const F='file:///tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/내레시피판.html'
const b=await chromium.launch(); const p=await b.newPage()
const errs=[]; p.on('pageerror',e=>errs.push(String(e)))
await p.goto(F)
console.log('  제목 =', await p.title())
console.log('  줄 =', await p.locator('article').count(), '· 요약칸 =', (await p.locator('.sum b').allTextContents()).join(' / '))
console.log('  묶음 =', (await p.locator('h2').allTextContents()).map(s=>s.trim().replace(/\s+/g,' ')).join(' | '))
// 반영된 편엔 체크칸이 없어야
const done=p.locator('article.done').first()
console.log('  반영된 편 체크칸 =', await done.locator('.judge').count(), '(0이어야 함) · 표시 =', (await done.locator('.tag').textContent()).trim())
// 고르고 새로고침
const first=p.locator('article:not(.done)').first()
const nm=await first.getAttribute('data-key')
await first.locator('.judge input.ck').nth(0).check()
await first.locator('.judge input.note').fill('11월에 넣자')
await p.reload()
console.log('  새로고침 뒤 남나 =', await p.locator(`article[data-key="${nm}"] .judge input.ck`).nth(0).isChecked(), '·', await p.locator(`article[data-key="${nm}"] .judge input.note`).inputValue())
await p.locator('#copy').click()
console.log('  복사 글 =', (await p.locator('#out').inputValue()).replace(/\n/g,' / '))
console.log('  pageerror =', errs.length?errs:'없음')
await b.close()
