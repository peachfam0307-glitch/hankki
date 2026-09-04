// 🎬🍂 **패드 «가로» 두 장을 릴스 한 칸에 쌓는다** — 인스타 릴스 시안 (2026-09-04)
//
// 📮 창업자 = *"아 세로가 아니라 «가로» 버전이지. 근데 인스타는 가로버전찍기가 애매해서."*
//    → 내 답 = *"두 장이면 딱 맞아떨어진다"* → 창업자 = *"아하!! 좋은 생각이야 예쁘게 만들어줘"*
//
// ⭐⭐ **왜 «두 장»인가 — 숫자가 그렇게 생겼다.**
//    🔢 패드 가로 **1280×800(16:10)** → 릴스 폭 1080 에 맞추면 **1080×675** = 릴스의 3분의 1뿐.
//    🔢 그런데 **두 장이면 1350** 이고, 릴스 «안전지대» = 1920 − 위 230 − 아래 384 = **1306**.
//       ⭐ 16:10 을 둘 쌓으면 9:16 이 된다 — 우연이 아니라 비율이 그렇다.
//    ✅ 그래서 **자를 것도 채울 것도 없다.** 2026-09-03 에 빈자리를 채우려다 세 판 헛돈 그 함정을 피한다.
//       📌 그날 배운 한 줄 = *"원본은 처음부터 9:16이었다. 답은 «아무것도 안 하는 것»이었다."*
//          여기선 그 «아무것도 안 하는 것»이 **두 장 쌓기**다.
//
// ⛔ 하지 않는 것 (전부 2026-09-03 에 값을 치르고 배운 것)
//    · 빈자리를 클레이·토프로 채우기 → 창업자 = *"너무 지저분해보여"*
//    · 세로를 잘라 억지로 맞추기   → 창업자 = *"스샷도 잘안보이고.. 너무 잘려서(아래위)"*
//    · 가을 친구 스티커 얹기       → 창업자 = *"스티커는 다 빼자"*
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-패드두장-0904.mjs
import { readdirSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const 찍은곳 = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/패드릴스'
// ⛔ 두 벌이 서로 덮어쓰지 않게 «칸을 나눈다» — 나란히 놓고 봐야 고를 수 있다
const 낼곳 = join(찍은곳, process.env.FULL === '1' ? '두장쌓기-꽉' : '두장쌓기-안전')
mkdirSync(낼곳, { recursive: true })

// 🎞 릴스에 넣을 차례 — «흐름»으로 짝짓는다(아무거나 둘씩 묶지 않는다)
//    ⭐ 위/아래가 «한 이야기»라야 한 칸으로 읽힌다.
const 짝 = [
  { 이름: 'R1-1', 위: '1-02-요리책', 아래: '1-03-상세', 말: '260편이 한눈에 → 눌러서 열면' },
  { 이름: 'R1-2', 위: '1-04-레꾸', 아래: '1-06-레꾸자랑', 말: '가을 스티커로 꾸미고 → 자랑하기' },
  { 이름: 'R1-3', 위: '1-05-일기', 아래: '1-01-홈', 말: '쌓인 일기 → 오늘 뭐 해먹지' },
  { 이름: 'R2-1', 위: '2-01-장보기', 아래: '2-02-장바구니', 말: '담고 → 주부가 골라준 것' },
  { 이름: 'R2-2', 위: '2-04-냉장고', 아래: '2-03-장바구니-더', 말: '냉장고에 있는 것 → 더 볼 것' },
]

const 있는것 = new Set(readdirSync(찍은곳).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)))
const 없는것 = 짝.flatMap((s) => [s.위, s.아래]).filter((n) => !있는것.has(n))
if (없는것.length) {
  // ⛔ 조용히 건너뛰지 않는다 — 빠진 채로 만들면 「됐다」고 말하게 된다
  console.log(`⛔ 찍힌 장이 없다: ${없는것.join(' · ')}`)
  console.log('   먼저 돌린다 = BACKUP=<백업.json> node scripts/_shot-패드릴스-0904.mjs')
  process.exit(1)
}

// 📐 릴스 판 — 1080×1920. 안전지대 = 위 230 · 아래 384 를 뺀 1306
const W = 1080, H = 1920
const 위덮임 = 230, 아래덮임 = 384

// 🎚 두 벌을 만든다 — 창업자가 «눈으로» 고르게(규칙 8·11)
//    ⓐ 안전 = 인스타 글자·단추가 덮는 자리를 지킨다. 안 가리지만 위아래가 휑해 보인다.
//    ⓑ 꽉   = 폭을 1080 꽉 채운다. UI 가 크게 보이지만 위아래 «가장자리»를 인스타가 조금 덮는다.
//    📮 창업자 = *"우리ui를 바로 보여주는게 조회수가 낫더라고"* → ⓑ 쪽 손을 들어줄 가능성이 크다.
//    ⛔ 내가 정하지 않는다(절대원칙 11 = 미감·판정은 창업자가 정한다).
const 꽉 = process.env.FULL === '1'
const 장폭 = 꽉 ? W : 1000                  // 꽉 = 좌우 여백 0 · 안전 = 40 씩 숨 쉬게
const 장높 = Math.round(장폭 * 800 / 1280)  // 16:10 그대로
const 사이 = 꽉 ? 18 : 26
const 덩어리 = 장높 * 2 + 사이
const 시작y = 꽉
  ? Math.round((H - 덩어리) / 2)            // 판 «한가운데»
  : 위덮임 + Math.round((H - 위덮임 - 아래덮임 - 덩어리) / 2)  // 안전지대 한가운데
const 안전지대 = H - 위덮임 - 아래덮임
const 벗어남 = Math.max(0, Math.round((덩어리 - 안전지대) / 2))

console.log(`📐 ${꽉 ? 'ⓑ 꽉' : 'ⓐ 안전'} — 한 칸 ${장폭}×${장높} · 둘 쌓으면 ${덩어리} · 안전지대 ${안전지대}`)
console.log(벗어남 ? `   ⚠️ 위아래로 ${벗어남}px 씩 안전지대를 벗어난다 — 인스타 글자가 «가장자리»를 조금 덮는다`
                   : `   ✅ 안전지대 안에 들어간다 — 아무것도 안 가린다`)

const py = String.raw`
import os, sys
from PIL import Image, ImageDraw, ImageFilter

찍은곳, 낼곳 = sys.argv[1], sys.argv[2]
W, H = ${W}, ${H}
장폭, 장높, 사이, 시작y = ${장폭}, ${장높}, ${사이}, ${시작y}
짝들 = [tuple(x.split('|')) for x in sys.argv[3:]]

# 🎨 바탕 = 앱 크림(#F3F0E9). 클레이·토프로 «채우지» 않는다 — 창업자가 물린 방향이다.
#    ⭐ 앱과 같은 색이라 화면이 바탕 위에 «떠 있는» 게 아니라 «이어져» 보인다.
바탕색 = (243, 240, 233)

def 둥근모서리(im, r):
    마스크 = Image.new('L', im.size, 0)
    ImageDraw.Draw(마스크).rounded_rectangle([0, 0, im.size[0]-1, im.size[1]-1], radius=r, fill=255)
    out = Image.new('RGBA', im.size, (0,0,0,0))
    out.paste(im, (0,0), 마스크)
    return out

def 그림자(크기, r, 번짐=18):
    s = Image.new('RGBA', (크기[0]+번짐*2, 크기[1]+번짐*2), (0,0,0,0))
    ImageDraw.Draw(s).rounded_rectangle([번짐, 번짐, 번짐+크기[0], 번짐+크기[1]], radius=r, fill=(90, 70, 45, 70))
    return s.filter(ImageFilter.GaussianBlur(번짐/2.2))

for 이름, 위, 아래 in 짝들:
    판 = Image.new('RGB', (W, H), 바탕색)
    for i, 파일 in enumerate((위, 아래)):
        im = Image.open(os.path.join(찍은곳, 파일 + '.png')).convert('RGB')
        im = im.resize((장폭, 장높), Image.LANCZOS)
        y = 시작y + i * (장높 + 사이)
        x = (W - 장폭) // 2
        # 그림자를 먼저 깔아 «판때기»가 아니라 «기기»로 보이게 한다
        sh = 그림자((장폭, 장높), 20)
        판.paste(바탕색, (0,0), None) if False else None
        판.paste(Image.alpha_composite(Image.new('RGBA', sh.size, 바탕색+(255,)), sh).convert('RGB'), (x-18, y-18+6))
        판.paste(둥근모서리(im.convert('RGBA'), 20).convert('RGB'), (x, y), 둥근모서리(im.convert('RGBA'), 20).split()[3])
    판.save(os.path.join(낼곳, 이름 + '.png'), quality=95)
    print('  ✅ ' + 이름 + '  (' + 위 + ' ＋ ' + 아래 + ')')
`

execFileSync('python3', ['-c', py, 찍은곳, 낼곳, ...짝.map((s) => `${s.이름}|${s.위}|${s.아래}`)], { stdio: 'inherit' })
console.log(`\n📁 ${낼곳}`)
console.log('⭐ 규칙 21 — 이제 «열어서» 보고 판정한다. 숫자로는 「예쁜가」를 못 잰다.')
