// 📸 창업자 새 컷 15개가 «앱의 어느 편»에 붙었나 — 판을 그려서 PNG 로 찍는다
//
// 왜 만들었나 (창업자 2026-08-18) = *"갈비살조림 넘겨주면 잘라서 스샷줘. 바로 배포하게."*
//   ⭐ 창업자는 폰에서 본다. 저장소 파일도 HTML 도 못 열고 **그림 한 장**이라야 판정이 된다.
//
// ⛔ 흉내가 아니라 앱과 «같은 모듈»(`recipe.mjs` → `allBasicRecipes`)에서 읽는다 — 절대원칙 30.
//    그래서 「붙었다」 표시는 «내가 그렇게 적은 것»이 아니라 **레시피에 박힌 `icon:` 실제 값**이다.
// ⛔ chromium 경로를 박지 않는다 — 이 컨테이너에만 있는 길이라 CI 가 죽는다(v10.90 사고).
//    쓰기:  SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_shot-새컷15-0818.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { 레시피들 } from './recipe.mjs'

const APP = join(dirname(fileURLToPath(import.meta.url)), '..')
const 낼곳 = process.argv[2] || '/tmp/새컷15-스샷.png'

// [컷 키, 붙을 레시피 id, 창업자가 시트에 적은 이름, 왜 갈아끼웠나]
const 짝 = [
  ['fe_314', 'basic-daepa-bulgogi-jeongol', '대파듬뿍 소불고기전골', '⭐다시 뽑아 준 «채 썬» 판'],
  ['fe_315', 'basic-beoseot-butter-bap', '버섯볶음밥', '전엔 fe_04 (소고기 솥밥과 겹침)'],
  ['fe_316', 'basic-naengi-doenjang-jjigae', '냉이듬뿍된장찌개', '전엔 fe_213'],
  ['fe_317', null, '팽이버섯 베이컨전', '⏳레시피는 아직 — 그림만 넣어 뒀다'],
  ['fe_318', 'basic-deulgireum-dubu-jeongol', '들기름 두부전골', '전엔 범용 「전골」'],
  ['fe_319', 'basic-soonsal-galbijjim', '뼈없는순살갈비조림', '감자·당근 «한입 크기»'],
  ['fe_328', 'basic-bibim-galbijjim', '갈비살조림', '⭐다시 뽑아 줌 · 무·당근 «작게 깍둑»'],
  ['fe_320', 'basic-eolkeun-syabeu-kalguksu', '얼큰 샤브 칼국수', '전엔 범용 「칼국수」'],
  ['fe_321', 'basic-onepan-cream-pasta', '원팬 크림 파스타', '전엔 fe_53 (베이컨 크림과 겹침)'],
  ['fe_322', 'basic-yangji-suyuk', '양지수육', '수육 셋이 fe_125 하나를 나눠 썼다'],
  ['fe_323', 'basic-hangjeong-suyuk', '항정수육', '〃'],
  ['fe_324', 'basic-hangjeong-samhap', '항정삼합', '〃'],
  ['fe_325', 'basic-mugeunji-bokkeum', '묵은지 볶음', '전엔 범용 「볶음」'],
  ['fe_326', 'basic-godeungeo-mugeunji-jorim', '고등어 묵은지조림', '전엔 목살조림 컷'],
  ['fe_327', 'basic-ttukbaegi-pasta', '뚝배기 파스타', '전엔 범용 파스타'],
]

const 편 = new Map(레시피들().map((r) => [r.id, r]))
const b64 = (k) => readFileSync(join(APP, 'src/assets/stickers/photo', `${k}.png`)).toString('base64')

let 붙은수 = 0
let 칸 = ''
for (const [키, id, 이름, 메모] of 짝) {
  const r = id ? 편.get(id) : null
  const 맞나 = r && r.icon === 키
  if (맞나) 붙은수 += 1
  칸 += `<div class="c">
    <img src="data:image/png;base64,${b64(키)}" alt="">
    <div class="n">${이름}</div>
    <div class="t">${r ? (맞나 ? '✅ ' : '⛔ ') + r.title : '⏳ 레시피 없음'}</div>
    <div class="d">${r && r.from ? r.from + ' 열림' : r ? '처음부터' : '－'} · ${키}</div>
    <div class="m">${메모}</div>
  </div>`
}

writeFileSync(
  join(APP, 'docs/_검수판/새컷15.html'),
  `<meta charset="utf-8"><style>
  body{margin:0;background:#faf7f2;font-family:'Noto Sans KR','Apple SD Gothic Neo',sans-serif;padding:22px}
  h1{font-size:22px;margin:0 0 5px;color:#5d3410}
  .sub{font-size:13px;color:#8a7a68;margin:0 0 18px;line-height:1.5}
  .g{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}
  .c{background:#fff;border-radius:14px;padding:12px 10px 11px;text-align:center;box-shadow:0 1px 4px rgba(93,52,16,.09)}
  .c img{width:152px;height:152px;object-fit:contain}
  .n{font-size:14.5px;font-weight:700;color:#3d2a18;margin-top:6px}
  .t{font-size:12.5px;color:#5d3410;margin-top:4px}
  .d{font-size:11px;color:#a89684;margin-top:2px}
  .m{font-size:11px;color:#8a7a68;margin-top:6px;line-height:1.4}
</style>
<h1>🖼 새로 받은 컷 15개 — 앱에 붙은 자리</h1>
<p class="sub">✅ = 그 레시피에 «박힌» 그림이 이 컷이다 (규칙이 아니라 실제 값을 읽었다 · ${붙은수}/14)<br>
⛔ 어슷썰기 대파 판은 버렸다 · 갈비는 컷 둘로 갈라서 두 편이 각자 전용 그림을 갖게 됐다</p>
<div class="g">${칸}</div>`,
)

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const p = await b.newPage({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 2 })
const 오류 = []
p.on('pageerror', (e) => 오류.push(String(e)))
await p.goto('file://' + join(APP, 'docs/_검수판/새컷15.html'))
await p.waitForTimeout(400)
const 깨짐 = await p.evaluate(() => [...document.querySelectorAll('img')].filter((i) => !i.naturalWidth).length)
await p.screenshot({ path: 낼곳, fullPage: true })
await b.close()

console.log(`📸 ${낼곳}`)
console.log(`   붙은 것 ${붙은수}/14 · 깨진 그림 ${깨짐} · pageerror ${오류.length}`)
if (붙은수 !== 14 || 깨짐 || 오류.length) process.exit(1)
