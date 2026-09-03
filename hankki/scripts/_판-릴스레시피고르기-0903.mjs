// 🍂🎬 **「릴스에 쓸 레시피 고르기」 판 — 가을 프레임을 얹어 «눈으로» 고른다** (2026-09-03)
//
// 📮 창업자 = *"다른레시피로 하자 내가 레시피 다시찾아올게"*
// ⭐ 창업자가 62편을 손으로 훑게 두지 않는다(규칙 8) — 후보를 골라 **그림으로** 보여준다.
// ⛔ 이름만 나열하지 않는다 — 「어느 게 예쁜가」는 글자로 못 고른다(규칙 11 · 21).
//
// 🔢 후보 잣대 = ⑴오늘 «열려 있는» 편(⛔안 열린 편은 못 쓴다) ⑵국물·솥밥 갈래
//    (짬뽕이 가을 프레임과 잘 맞았던 이유 = 국물의 붉은·갈색 ↔ 단풍의 주황이 같은 계열)
//
// ⛔ 레시피 «내용»은 안 그린다 — 제목과 완성 그림만(이 저장소는 공개다).
// 쓰는 법 = node scripts/_판-릴스레시피고르기-0903.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { 레시피들 } from './recipe.mjs'
import { todayKST } from '../src/today.js'

const ROOT = new URL('..', import.meta.url).pathname
const 낼곳 = process.env.OUT || '/tmp/hankki-릴스고르기'
mkdirSync(낼곳, { recursive: true })

// 🍂 가을 프레임 셋 — 열쇠는 코드에서 읽는다(⛔손으로 적지 않는다 · 낡는다)
const 스티커소스 = readFileSync(join(ROOT, 'src/components/Stickers.jsx'), 'utf8')
const 가을줄 = 스티커소스.match(/key:\s*'deco_autumn_frame'[^\n]*items:\s*\[([^\]]+)\]/)
const 가을프레임 = 가을줄 ? 가을줄[1].split(',').map((s) => s.trim().replace(/'/g, '')) : []
if (!가을프레임.length) { console.log('⛔ 가을 프레임 열쇠를 못 찾았다 — Stickers.jsx 를 볼 것'); process.exit(1) }

const 오늘 = todayKST()
const 국물 = /탕|찌개|국$|국\s|전골|짬뽕|칼국수|수제비|백숙|곰탕|솥밥|떡국/
const 후보 = 레시피들()
  .filter((r) => !r.from || r.from <= 오늘)
  .filter((r) => 국물.test((r.title || '').trim()))
  .filter((r) => r.icon)

const 그림찾기 = (열쇠) => {
  for (const d of ['food', 'photo', 'gr', 'stickers']) {
    for (const p of [`src/assets/stickers/${d}/${열쇠}.png`, `src/assets/stickers/${d}/${열쇠}.webp`]) {
      if (existsSync(join(ROOT, p))) return p
    }
  }
  // 폴더를 모르면 통째로 훑는다(한 번만)
  return null
}
const 데이터 = (p) => {
  const 확장 = p.endsWith('.webp') ? 'webp' : 'png'
  return `data:image/${확장};base64,${readFileSync(join(ROOT, p)).toString('base64')}`
}

const 프레임그림 = 가을프레임
  .map((k) => `src/assets/stickers/photo/${k}.png`)
  .filter((p) => existsSync(join(ROOT, p)))

const 칸 = []
for (const r of 후보) {
  const p = 그림찾기(r.icon)
  if (!p) continue
  칸.push({ 제목: (r.title || '').trim(), 열쇠: r.icon, 그림: 데이터(p) })
}

const 프레임들 = 프레임그림.map((p, i) => ({ 이름: 가을프레임[i], 그림: 데이터(p) }))

const html = `<meta charset="utf-8"><title>릴스 레시피 고르기</title>
<style>
  :root{--bg:#f7f3ec;--card:#fff;--line:#e6ddd0;--ink:#3d3228;--sub:#8b7d6b;--point:#c8622a}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 'Pretendard','Apple SD Gothic Neo',system-ui,sans-serif}
  header{padding:22px 18px 8px}
  h1{margin:0 0 4px;font-size:20px}
  .sub{color:var(--sub);font-size:13px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;padding:14px 18px 40px}
  .item{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:10px;text-align:center}
  .stage{position:relative;aspect-ratio:1/1;display:grid;place-items:center;background:#8a6f52;border-radius:12px;overflow:hidden}
  .stage .food{width:66%;height:66%;object-fit:contain;position:relative;z-index:1}
  .stage .fr{position:absolute;inset:2%;width:96%;height:96%;object-fit:contain;z-index:2;pointer-events:none}
  .name{margin-top:8px;font-weight:700;font-size:14px}
  .key{color:var(--sub);font-size:11px}
  .frames{display:flex;gap:10px;padding:0 18px 6px}
  .frames img{width:76px;height:76px;object-fit:contain;background:#fff;border:1px solid var(--line);border-radius:12px;padding:4px}
  .note{margin:0 18px 10px;padding:10px 12px;background:#fff;border:1px dashed var(--line);border-radius:12px;font-size:13px;color:var(--sub)}
</style>
<header>
  <h1>🍂 릴스에 쓸 레시피 고르기</h1>
  <div class="sub">오늘(${오늘}) 앱에 <b>열려 있는</b> 국물·솥밥 ${칸.length}편 · 가을 프레임을 얹어 봤다</div>
</header>
<div class="note">⛔ 이건 <b>대충 얹은 미리보기</b>다 — 실제 앱에선 프레임 크기·자리를 손으로 맞춘다.
「어느 음식이 가을 프레임과 어울리나」만 보면 된다.</div>
<div class="frames">${프레임들.map((f) => `<img src="${f.그림}" alt="${f.이름}">`).join('')}</div>
<div class="grid">
${칸.map((c) => `  <div class="item">
    <div class="stage"><img class="food" src="${c.그림}" alt=""><img class="fr" src="${프레임들[0]?.그림 || ''}" alt=""></div>
    <div class="name">${c.제목}</div><div class="key">${c.열쇠}</div>
  </div>`).join('\n')}
</div>`

const 낸것 = join(낼곳, '릴스레시피고르기.html')
writeFileSync(낸것, html)
console.log('\n🍂 릴스 레시피 고르기 판\n')
console.log(`   가을 프레임 = ${가을프레임.join(' · ')}  (그림 ${프레임들.length}장)`)
console.log(`   후보 = ${칸.length}편`)
console.log(`   ${칸.map((c) => c.제목).join(' · ')}`)
console.log(`\n   📄 ${낸것}\n`)
