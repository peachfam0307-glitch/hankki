// 📸 스토어 스샷 v6 → **인스타 사진 게시물(3:4 · 1080×1440)** (2026-08-28)
//
// 📮 창업자 = *"인스타 아까 스토어 스샷 완성한거 줄래? 인스타에 올리게"*
//
// ⛔⛔ **스토어 스샷을 그대로 올리면 안 된다** — v6 는 **2160×3840(9:16)** 인데
//    **인스타 피드가 받는 가장 세로긴 비율이 3:4** 다. 9:16 을 올리면 인스타가 «제멋대로» 자른다.
//    (같은 함정을 2026-08-26 에 이미 적어뒀다 — `_판-인스타카드-0826.mjs` 머리주석)
//
// ⭐ **아래를 자른다(위 정렬)** — 헤드라인이 맨 위에 있고 그게 이 그림의 심장이다.
//    9:16 → 3:4 = 세로의 **25% 를 버린다.** 앱 화면은 원래 아래로 흘러나가는 디자인이라
//    조금 더 잘려도 「잘린 것」으로 안 보인다.
//
// ⛔ 여백을 넣어 «통째로» 담지 않는다 — 그러면 폰 화면이 손톱만 해져서 글자가 안 읽힌다.
//
// ⚠️ **파일이 3:4 인 것만으로는 부족하다** — 인스타는 여러 장을 고르면 첫 화면에서 1:1 로 맞춘다.
//    올릴 때 **「세로 비율」로 바꿔야** 안 잘린다(2026-08-26 창업자가 올리기 직전에 잡았다).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-인스타-스토어샷-0828.mjs
// 🏷 이름표 = 살아있는 도구
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const 원본 = join(ROOT, 'design/promo/스토어스샷-2508')          // ⭐현행 = v6
const OUT = join(ROOT, 'design/promo/인스타-2508/스토어샷-3대4')
mkdirSync(OUT, { recursive: true })

const W = 1080, H = 1440   // 3:4 — 인스타 피드가 받는 가장 세로긴 비율

const 파일들 = readdirSync(원본).filter((f) => f.startsWith('v6-') && f.endsWith('.png')).sort()
if (!파일들.length) { console.error('⛔ v6 원본을 못 찾았다 —', 원본); process.exit(1) }

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })

console.log(`\n📸 스토어 스샷 v6 → 인스타 3:4 (${W}×${H})\n`)
// ⛔⛔ **자르는 법이 장마다 다르다 — 한 가지로 밀면 글이 끊긴다.**
//    🔢 첫 판을 뽑아 눈으로 보고서야 잡았다(절대원칙 21) — 08번 마지막 줄
//       「기억해줬으면 좋겠어요」가 «반쯤» 잘려 나갔다.
//    ⭐ 갈리는 잣대 = **아래쪽에 «읽어야 하는 글»이 있나.**
//       · 앱 화면 장(01~07) → 폰 화면이 원래 아래로 흘러나가는 디자인이라 더 잘려도 티가 안 난다 → `cover`
//       · 글 장(08) → 문장이 끝까지 있어야 뜻이 산다 → `contain`(통째로 담고 양옆에 바탕)
const 글장 = new Set(['v6-08-왜만들었나.png'])

for (const f of 파일들) {
  const src = `data:image/png;base64,${readFileSync(join(원본, f)).toString('base64')}`
  const 통째로 = 글장.has(f)
  // ⭐ cover ＋ top — 폭을 꽉 채우고 «아래»를 버린다. 헤드라인은 반드시 산다.
  //   contain — 글이 한 글자도 안 잘리게 통째로. 양옆 바탕은 원본 바탕색과 같은 값이다.
  await page.setContent(`<style>
      html,body{margin:0;padding:0;width:${W}px;height:${H}px;overflow:hidden;background:#f6efe3}
      img{width:${W}px;height:${H}px;object-fit:${통째로 ? 'contain' : 'cover'};object-position:${통째로 ? 'center' : 'top center'};display:block}
    </style><img src="${src}">`)
  await page.waitForFunction(() => { const i = document.querySelector('img'); return i && i.complete && i.naturalWidth > 0 })
  const 낼이름 = f.replace(/^v6-/, '')
  await page.screenshot({ path: join(OUT, 낼이름) })
  console.log(`  ✅ ${낼이름}${통째로 ? '   (통째로 — 글이 잘리면 안 되는 장)' : ''}`)
}

await b.close()
console.log(`\n📂 ${OUT}`)
console.log('⚠️ 인스타에 올릴 때 «세로 비율»로 바꿀 것 — 안 그러면 첫 화면에서 1:1 로 잘린다.\n')
