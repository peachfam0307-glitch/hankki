// 🎬 **9:16 로 «이미 뽑힌» 시안을 릴스 규격으로 앉힌다** (2026-09-03)
//
// 📮 창업자 = *"인스타릴스기준으로 뽑아달라면 돼?"* → 그렇게 다시 뽑아 왔다.
//    🔢 새 시안 = 941×1672 = 비율 **1.777** (릴스 1.778) → **자를 것도 남길 것도 없다.**
//
// ⛔⛔ 그 전 판(1003×1568 · 1.563)을 억지로 맞추다 두 번 망했다 —
//    ① 안전지대에 통째로 앉히니 위아래가 «빈칸»(창업자 = *"그림이 잘렸어 꽉차야하는데"*)
//    ② 꽉 채우고 띠만 오려 올리니 **짜임이 깨졌다**(「문방구에서…」가 Play스토어 «아래»로 갔다)
//    📌 **소재를 규격에 맞춰 «다시 받는 것»이 후처리보다 언제나 낫다.**
//
// 📐 남은 일은 하나 = **CTA 띠가 인스타 아래덮임(384px)에 걸린다**
//    🔢 실측 = 1번 y1712~1807 · 2번 y1744~1837 → 안전바닥(1536)보다 **271~301px 아래**
//    ✅ 그래서 릴스에 쓸 «마지막 컷»만 그만큼 위로 올린다(위 진열대가 조금 잘린다 — 거긴 배경이다).
//    ⭐ 훅용(첫 1초)은 **안 올린다** — 거긴 CTA 를 읽힐 자리가 아니라 «손가락을 멈추는» 자리다.
//
// 쓰는 법 = node scripts/_판-릴스9x16-0903.mjs <훅시안.png> <끝시안.png>
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const 훅원본 = process.argv[2]
const 끝원본 = process.argv[3]
if (!훅원본 || !끝원본) { console.log('⛔ 쓰는 법 = node scripts/_판-릴스9x16-0903.mjs <훅시안.png> <끝시안.png>'); process.exit(1) }
const OUT = process.env.OUT || '/tmp/hankki-릴스시안'
mkdirSync(OUT, { recursive: true })

const 파이썬 = `
from PIL import Image
import numpy as np
W, H = 1080, 1920
아래덮임 = 384
안전바닥 = H - 아래덮임

def 앉히기(경로, 낼곳, 올릴까):
    im = Image.open(경로).convert('RGB')
    큰 = im.resize((W, H), Image.LANCZOS)          # 9:16 이라 그냥 키우면 된다
    if not 올릴까:
        큰.save(낼곳); print('  ', 낼곳.split('/')[-1], '— 그대로 (훅용)')
        return
    # 🔵 CTA 띠(파란 알약)를 아래 27% 에서 찾는다 — ⛔뾰미 카디건·폰 화면의 파랑에 속지 않게
    a = np.asarray(큰).astype(int)[1400:, :, :]
    파랑 = (a[:, :, 2] > 120) & (a[:, :, 2] - a[:, :, 0] > 50)
    있 = np.where(파랑.sum(axis=1) > 400)[0]
    if not len(있):
        큰.save(낼곳); print('  ', 낼곳.split('/')[-1], '— ⚠️CTA 띠를 못 찾아 그대로 뒀다')
        return
    띠아래 = 있.max() + 1400
    올림 = max(0, 띠아래 - 안전바닥 + 24)          # 안전바닥에서 24px 여유
    바탕 = Image.new('RGB', (W, H), 큰.getpixel((4, H - 4)))
    바탕.paste(큰, (0, -올림))
    # 위로 올리면 아래가 빈다 → «그 그림의 맨 아랫줄»로 늘려 채운다(색이 이어져 티가 안 난다)
    if 올림 > 0:
        꼬리 = 큰.crop((0, H - 8, W, H)).resize((W, 올림 + 8), Image.LANCZOS)
        바탕.paste(꼬리, (0, H - 올림 - 8))
    바탕.save(낼곳)
    print('  ', 낼곳.split('/')[-1], f'— CTA 아래끝 {띠아래} → {띠아래 - 올림} (안전바닥 {안전바닥}) · {올림}px 올림')

앉히기(${JSON.stringify(훅원본)}, ${JSON.stringify(join(OUT, '훅판.png'))}, False)
앉히기(${JSON.stringify(끝원본)}, ${JSON.stringify(join(OUT, '전체판.png'))}, True)
`

console.log('\n🎬 9:16 시안 → 릴스 규격\n')
console.log(execFileSync('python3', ['-c', 파이썬], { encoding: 'utf8' }).trimEnd())
console.log(`\n   📁 ${OUT}`)
console.log('   ⛔ 보내기 «전»에 두 장을 다 «열어서» 볼 것 (절대원칙 21)\n')
