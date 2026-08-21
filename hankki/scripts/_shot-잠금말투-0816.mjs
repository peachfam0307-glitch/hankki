// 📸 일기 잠금 시트 «말투» 실물 확인 (창업자 제보 2026-08-16 *"일기 잠금 안내 반말임"*)
//   돌리기 = node hankki/scripts/_shot-잠금말투-0816.mjs <내보낼폴더>
//   ⭐ 화면에 나가는 글자를 **DOM 에서 긁어** 반말이 남았나 기계로도 재고, 그림도 남긴다.
//   ⛔ 눈으로만 보면 시트 아래쪽(잊었을 때)처럼 «접혀 있는 글자»를 놓친다.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { SEED_COACH_SEEN } from '../src/coach.js'

const PORT = 4185
const URL = `http://127.0.0.1:${PORT}/`
const 비번 = '1234'
const OUT = process.argv[2] || '/tmp/잠금말투'
fs.mkdirSync(OUT, { recursive: true })

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 서버 = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
  { cwd: ROOT, stdio: 'ignore' })
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms))
const 서버뜰때까지 = async () => {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(URL); if (r.ok) return true } catch { /* 아직 */ }
    await 잠깐(500)
  }
  return false
}

// ⛔ 반말 꼬리 — «화면에 나가는 글자»에만 쓴다. 마침표·물결·따옴표가 붙어도 잡히게.
const 반말꼬리 = /(줘|줄래|을래|ㄹ래|잊었어|남아|뿐이야|안 돼|해라|하자|이야|거야)[.!~…]*$/
let bad = 0
const 칸 = (이름, ok, 덧말 = '') => { if (!ok) bad++; console.log(`  ${ok ? '✅' : '⛔'} ${이름}${덧말 ? ' — ' + 덧말 : ''}`) }

// 시트 안의 «보이는 글자»를 문장 단위로 긁는다
const 시트글자 = async (page) => {
  const 글 = await page.locator('.sheet').innerText()
  return 글.split('\n').map((s) => s.trim()).filter(Boolean)
}
const 말투검사 = async (page, 자리) => {
  const 줄들 = await 시트글자(page)
  const 반말 = 줄들.filter((l) => 반말꼬리.test(l))
  칸(`${자리} — 반말 0`, 반말.length === 0, 반말.join(' / '))
  return 줄들
}

try {
  if (!(await 서버뜰때까지())) { console.log('  ⛔ preview 서버가 안 떴다'); process.exit(1) }
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(`${SEED_COACH_SEEN}\ntry { localStorage.setItem('hankki:onboarded','1') } catch(e){}`)
  const page = await ctx.newPage()
  page.setDefaultTimeout(15000)
  await page.goto(URL, { waitUntil: 'networkidle' })
  await 잠깐(500)
  await page.getByRole('button', { name: '일기', exact: true }).first().click()
  await 잠깐(600)
  await page.getByRole('button', { name: /^오늘 일기 (보기|쓰기)$/ }).click()
  await 잠깐(800)
  await page.getByPlaceholder('여기에 써요').fill('말투 확인용')
  await 잠깐(700)

  const 눌러 = async (pin) => {
    const 시트 = page.locator('.sheet')
    for (const c of pin) { await 시트.getByRole('button', { name: c, exact: true }).click(); await 잠깐(70) }
    await 잠깐(300)
  }

  // ① 비번 정하기 (first)
  await page.getByRole('button', { name: '일기 잠그기' }).click()
  await 잠깐(500)
  await 말투검사(page, '① 비번 정하기')
  await page.locator('.sheet').screenshot({ path: path.join(OUT, '1-비번정하기.png') })

  // ② 한 번 더 (again)
  await 눌러(비번)
  await 잠깐(400)
  await 말투검사(page, '② 한 번 더')
  await page.locator('.sheet').screenshot({ path: path.join(OUT, '2-한번더.png') })

  // ③ 힌트 (hint)
  await 눌러(비번)
  await 잠깐(400)
  await 말투검사(page, '③ 힌트')
  await page.locator('.sheet').screenshot({ path: path.join(OUT, '3-힌트.png') })
  await page.locator('.sheet').getByRole('button', { name: '잠그기', exact: true }).click()
  await 잠깐(700)
  await page.close()

  // ④ 잠긴 걸 여는 화면 (check) ＋ ⑤ 「비번을 잊었어요」 펼친 상태
  const p2 = await ctx.newPage()
  await p2.goto(URL, { waitUntil: 'networkidle' })
  await 잠깐(500)
  await p2.getByRole('button', { name: '일기', exact: true }).first().click()
  await 잠깐(600)
  await p2.getByRole('button', { name: /^오늘 일기 (보기|쓰기)$/ }).click()
  await 잠깐(800)
  await p2.getByRole('button', { name: '열기' }).click()
  await 잠깐(500)
  await 말투검사(p2, '④ 비번 넣기')
  await p2.locator('.sheet').screenshot({ path: path.join(OUT, '4-비번넣기.png') })

  await p2.getByRole('button', { name: '비번을 잊었어요' }).click()
  await 잠깐(400)
  await 말투검사(p2, '⑤ 비번 잊었을 때')
  await p2.locator('.sheet').screenshot({ path: path.join(OUT, '5-비번잊었을때.png') })

  // ⑥ 「지우고 풀기」를 한 번 눌렀을 때 — 마지막 확인 (창업자 판정 ⒜ · 2026-08-16)
  await p2.locator('.sheet').getByRole('button', { name: /지우고 풀기/ }).first().click()
  await 잠깐(400)
  await 말투검사(p2, '⑥ 지우기 마지막 확인')
  await p2.locator('.sheet').screenshot({ path: path.join(OUT, '6-지우기-마지막확인.png') })

  await browser.close()
} finally {
  서버.kill()
}

console.log(bad ? `\n⛔ ${bad}칸 실패` : `\n✅ 잠금 시트 다섯 자리 전부 존댓말 · 그림 = ${OUT}`)
process.exit(bad ? 1 : 0)
