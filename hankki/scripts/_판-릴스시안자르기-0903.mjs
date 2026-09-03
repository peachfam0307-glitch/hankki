// 🎬✂️ **뾰미 문방구 시안을 릴스 규격(1080×1920)으로 자른다** (2026-09-03)
//
// 📮 창업자 = *"이걸로 하고"*(뾰미 문방구 시안) · *"좋아"*(내가 시안 자르기를 맡기로)
//
// 🔢 원본 = 1003×1568 (비율 1.563) · 릴스 = 1080×1920 (1.778) → **그냥 늘리면 찌그러진다**
//    · 같은 폭으로 9:16 = 높이 1783 필요 → 215px 모자라
//    · 같은 높이로 9:16 = 폭 882 → 양옆 60px씩 잘라내야 한다
//
// 📐 **인스타가 덮는 자리 = 위 230px · 아래 384px** (2026-09-01 릴스에서 실측한 값)
//    → 안전지대 = y 230~1536 (높이 1306). 여기 «통째로» 앉히면 아무것도 안 잘린다.
//    ⛔ 양옆을 자르면 뾰미 바구니·폰 목업 가장자리가 날아갈 수 있다 → 자르지 않는다.
//
// 만드는 것 둘
//   ① 훅판(첫 1초) = 뾰미 얼굴 ＋ 「꾸며버림」 만 꽉 채운 타이트 크롭
//      ⭐ 9/1 릴스 실측이 「첫 1~2초에 절벽」이라 했다 → 첫 프레임은 «앱 UI가 아니라 캐릭터»,
//         글자는 0.5초에 읽히는 만큼만.
//   ② 전체판 = 시안을 안전지대에 통째로 (훅에서 줌아웃할 목적지)
//
// ⛔ 판 생성기는 저장소에 둔다(규칙 30) · 결과물만 /tmp 에
// 쓰는 법 = node scripts/_판-릴스시안자르기-0903.mjs
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = new URL('..', import.meta.url).pathname
const 시안 = join(ROOT, 'design/promo/병맛시리즈-창업자-2026-08-28/단편/한끼-문방구-표지까지-꾸며버림.png')
const OUT = process.env.OUT || '/tmp/hankki-릴스시안'
mkdirSync(OUT, { recursive: true })

const 릴스W = 1080
const 릴스H = 1920
const 위덮임 = 230
const 아래덮임 = 384

const 파이썬 = `
from PIL import Image
im = Image.open(${JSON.stringify(시안)}).convert('RGB')
W, H = im.size

# 바탕색 = 시안 «네 귀퉁이»의 평균 (⛔흰색이라고 짐작하지 않는다 — 크림색이다)
귀 = [im.getpixel((2,2)), im.getpixel((W-3,2)), im.getpixel((2,H-3)), im.getpixel((W-3,H-3))]
바탕 = tuple(sum(c[i] for c in 귀)//4 for i in range(3))
print('바탕색', 바탕)

# ── ② 전체판 — 안전지대(y ${위덮임}~${릴스H - 아래덮임})에 통째로 앉힌다
안전H = ${릴스H} - ${위덮임} - ${아래덮임}
배 = min(${릴스W} / W, 안전H / H)
nw, nh = int(W * 배), int(H * 배)
큰 = Image.new('RGB', (${릴스W}, ${릴스H}), 바탕)
큰.paste(im.resize((nw, nh), Image.LANCZOS), ((${릴스W} - nw)//2, ${위덮임} + (안전H - nh)//2))
큰.save(${JSON.stringify(join(OUT, '전체판.png'))})
print('전체판', nw, 'x', nh, '(배율', round(배,3), ')')

# ── ① 훅판 — 「꾸며버림」 ＋ 뾰미 얼굴만. 9:16 으로 «잘라서» 채운다(여백 없이)
# 🔢 자리는 눈으로 재서 넣는다 — 원본 1003×1568 기준
#    「저장만 하려다가 / 표지까지 꾸며버림」 = 대략 x 55~545 · y 185~470
#    뾰미 얼굴·귀 = 대략 x 20~500 · y 430~800
x0, y0 = 0, 150
크롭W = 600
크롭H = int(크롭W * ${릴스H} / ${릴스W})     # 9:16
if y0 + 크롭H > H:
    y0 = max(0, H - 크롭H)
훅 = im.crop((x0, y0, x0 + 크롭W, y0 + 크롭H)).resize((${릴스W}, ${릴스H}), Image.LANCZOS)
훅.save(${JSON.stringify(join(OUT, '훅판.png'))})
print('훅판 크롭', x0, y0, 크롭W, 크롭H)
`

const 결과 = execFileSync('python3', ['-c', 파이썬], { encoding: 'utf8' })
console.log('\n🎬 릴스 시안 자르기\n')
console.log(결과.split('\n').map((l) => (l ? '   ' + l : l)).join('\n'))
console.log(`   📁 ${OUT}\n`)
console.log('   ⛔ 보내기 «전»에 두 장을 다 «열어서» 볼 것 (절대원칙 21)')
