// ☁️ 클라우드에 «올릴 것이 얼마나 무거운가» — 무료 저장공간으로 몇 명을 받을 수 있나 (2026-08-16)
//   📮 창업자 *"제일 중요한 클라우드 올리기준비도 하고 있지?"* · *"c로 파고들자. 가능해??"*
//   돌리기 = node hankki/scripts/_measure-클라우드용량-0816.mjs
//
// ⭐⭐ 이 숫자가 설계를 정한다 — 글자는 가볍고 **사진이 무겁다.**
//    무료 저장공간(파이어베이스 1GiB)은 «유저 한 명»이 아니라 **전체 합계**다.
//
// ⛔ 짐작하지 않는다 — 앱이 실제로 쓰는 그 함수(`cropSquare` 800px q0.85)로 만들어서 잰다.
import { chromium } from 'playwright'

const b = await chromium.launch()
const pg = await (await b.newContext()).newPage()
await pg.setContent('<body style="margin:0">')

// 음식 사진 흉내 — JPEG 는 «복잡한 그림»일수록 커진다. 단색 배경으로 재면 거짓말이 된다.
const 잰다 = await pg.evaluate(async () => {
  const 원본 = (w, h) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h
    const x = c.getContext('2d')
    // 잡음 섞인 그라데이션 = 사진에 가까운 복잡도
    const g = x.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, '#c8792a'); g.addColorStop(0.5, '#7d9b5a'); g.addColorStop(1, '#8c3b2e')
    x.fillStyle = g; x.fillRect(0, 0, w, h)
    const img = x.getImageData(0, 0, w, h)
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.sin(i * 12.9898) * 43758.5453) % 1
      const d = Math.round(n * 46) - 23
      img.data[i] += d; img.data[i + 1] += d; img.data[i + 2] += d
    }
    x.putImageData(img, 0, 0)
    return c
  }
  const src = 원본(1800, 2400)

  // 앱의 `cropSquare(dataUrl, out, quality)` 와 «같은 계산»
  const 정사각 = (out, q) => {
    const s = Math.min(src.width, src.height)
    const size = Math.min(out, s)
    const c = document.createElement('canvas'); c.width = size; c.height = size
    const x = c.getContext('2d')
    x.fillStyle = '#fff'; x.fillRect(0, 0, size, size)
    x.imageSmoothingQuality = 'high'
    x.drawImage(src, (src.width - s) / 2, (src.height - s) / 2, s, s, 0, 0, size, size)
    return { out, q, bytes: c.toDataURL('image/jpeg', q).length }
  }
  return [정사각(800, 0.85), 정사각(640, 0.8), 정사각(512, 0.75), 정사각(400, 0.7)]
})
await b.close()

const KB = (n) => (n / 1024).toFixed(0) + 'KB'
const 지금 = 잰다[0]

console.log('\n📸 레시피 «표지 사진» 한 장 (base64 로 올라가는 덩치)\n')
console.log('  크기        화질    덩치      1GiB 에 몇 장')
for (const r of 잰다) {
  const 표 = r.out === 800 ? '  ← 지금 앱이 쓰는 값' : ''
  console.log(`  ${String(r.out + '×' + r.out).padEnd(11)} q${r.q}   ${KB(r.bytes).padStart(6)}   ${String(Math.floor(1024 ** 3 / r.bytes)).padStart(7)}장${표}`)
}

// 📐 한 사람이 얼마나 쓰나 — 레시피 30편(사진 있는 게 절반)이라 잡는다
//    ⚠️ 이건 «가정»이다. 진짜 숫자는 테스터 폰에서 재야 안다.
const 글자 = 3 * 1024 // 레시피 한 편의 글자(제목·재료·순서·메모) 대충 3KB
const 편수 = 30
const 사진있는비율 = 0.5
console.log(`\n👤 한 사람이 레시피 ${편수}편(절반에 사진) 을 올리면`)
for (const r of 잰다) {
  const 한사람 = 편수 * 글자 + 편수 * 사진있는비율 * r.bytes
  console.log(`  ${String(r.out).padEnd(4)}q${r.q} → 한 사람 ${(한사람 / 1024 / 1024).toFixed(1)}MB · **1GiB 무료로 ${Math.floor(1024 ** 3 / 한사람)}명**`)
}

console.log(`\n⭐ 지금 값(800 q0.85)이면 사진 한 장 ${KB(지금.bytes)} —` +
  ` 사진을 ${잰다[2].out}px 로 줄이면 ${(지금.bytes / 잰다[2].bytes).toFixed(1)}배 가벼워진다.`)
console.log('⚠️ 이건 «올리는 사진»만 줄이는 것이다 — 폰 안의 원본 화질은 그대로 둘 수 있다.')
console.log('⚠️ 일기(꾸민 종이)·레꾸자랑 카드는 여기 안 들어 있다. 그건 따로 재야 한다.\n')
