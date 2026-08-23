#!/usr/bin/env python3
"""🛒 큐레이션 아이콘 «배경 빼기» — 「주부의 장바구니」 제품 그림 전용.

⛔⛔ **왜 `tools/cut.py`(표준 스티커 도구)를 안 쓰나 — 도구가 스스로 거부한다.**
   `cut.py` 는 **굵은 진갈색 외곽선이 있는 스티커**용이고, 자른 뒤
   「외곽선을 파먹지 않았나」를 검사해 92% 만 남았다며 **exit 1** 로 막았다(2026-08-17 실측).
   큐레이션 아이콘은 **외곽선이 아예 없는 수채톤**이라 그 검사에 원리적으로 안 맞는다.
   📌 같은 「자르기」라는 낱말을 쓰지만 **다른 일**이다. 그래서 도구를 따로 둔다.

⛔⛔⛔ **여기서 내가 실제로 낸 사고 (2026-08-17)**
   📮 창업자 = *"컷이 다 잘렸는데.. 깔끔하게 잘라"* → *"**왼쪽은 하얀부분이 잘려나갔잖아.**"*
   내가 「밝으면 배경」으로 판정해 흰 배경을 지웠는데, **하바티 포장의 «투명 비닐»이 흰색**이라
   비닐 주름이 통째로 날아갔다. CLAUDE.md 자르기 표준에 이미 적힌 함정이다 —
   *"흰색 되돌리기는 바깥 테두리에서만. 전체에 하면 **돛·밀짚모자의 흰 부분이 통째로 비친다**(흰 그림도 흰색이다)"*

🔢 **실측이 결정적이었다** — 밝기로는 «절대» 못 가른다:
   · 배경 = **254.0** (모서리 10×10 평균)
   · 비닐 = **252 ~ 254** (하위 1% 가 252.2, 중앙값 254.0)
   → 문턱을 어디에 두든 비닐 절반이 배경으로 잡힌다.

✅ **그래서 「밝기」가 아니라 «제품 실루엣»으로 자른다:**
   ① 조금이라도 어두운 픽셀(< 253)을 모아 **제품 윤곽**을 얻는다(글자·치즈·병·주름 선)
   ② `binary_fill_holes` 로 **안쪽을 통째로 메운다** → 비닐·라벨의 흰 부분이 «안»에 들어와 살아남는다
   ③ 살짝 팽창(dilate)해 반투명 가장자리를 품고, 가장자리만 부드럽게 흐린다
   ④ bbox 로 여백을 자르고 **긴변 200px** 로 맞춘다(기존 27개가 전부 200px 안팎)

쓰기:
  python3 tools/큐레이션-배경빼기.py <원본.png> <낼파일.png> [--좌] [--우] [--아래컷 0.72]
     --좌/--우   원본에 컷이 둘 나란히 있을 때 한쪽만
     --아래컷    아래 라벨 글자 띠를 잘라낼 비율(기본 0.72)
"""
import sys
from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage

args = [a for a in sys.argv[1:] if not a.startswith('--')]
opts = [a for a in sys.argv[1:] if a.startswith('--')]
if len(args) < 2:
    print(__doc__)
    sys.exit(1)
원본, 낼것 = args[0], args[1]
아래컷 = 0.72
for o in opts:
    if o.startswith('--아래컷'):
        아래컷 = float(o.split('=')[1]) if '=' in o else 0.72

im = Image.open(원본).convert('RGBA')
W, H = im.size
if '--좌' in opts:
    im = im.crop((0, 0, W // 2, int(H * 아래컷)))
elif '--우' in opts:
    im = im.crop((W // 2, 0, W, int(H * 아래컷)))
elif 아래컷 < 1:
    im = im.crop((0, 0, W, int(H * 아래컷)))

a = np.array(im).astype(float)
lum = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]

# ① 조금이라도 어두운 것 = 제품의 «선»(윤곽·글자·주름·그림자)
# 🔢 문턱 = **254 미만**. 실측(2026-08-17) = 배경 254.0(최소 253.0) · 비닐 252~254.
#    ⛔ 253 으로 잡으면 **배경의 253 픽셀까지 잉크로 잡혀** 이미지 전체가 「제품」이 된다
#       (올리고당에서 실제로 그랬다 — 잉크 범위가 0~1023 전체로 나왔다).
#    ⭐ 254 면 비닐 절반이 빠지지만 **윤곽만 잡히면 아래 fill holes 가 안쪽을 메운다.**
잉크 = lum < 253
if 잉크.sum() < 500:
    print('⛔ 제품 선을 못 찾았다 — 원본이 너무 밝거나 비어 있다')
    sys.exit(1)

# ② 안쪽을 통째로 메운다 → 흰 비닐·흰 라벨이 «제품 안»으로 들어와 살아남는다
#    ⚠️ 먼저 살짝 닫아(closing) 톱니 사이 틈을 이어야 fill 이 샌다
# ⛔ 먼저 **가는 연결을 끊는다**(opening) — 안 그러면 배경 노이즈가 «실오라기»로 제품에 붙어
#    한 덩어리가 되고, 아래 「제일 큰 덩어리만」이 그걸 같이 데려온다.
#    (2026-08-17 올리고당 병 양옆에 흰 부스러기가 붙어 나왔다)
잉크 = ndimage.binary_opening(잉크, np.ones((3, 3)))
채움 = ndimage.binary_fill_holes(ndimage.binary_closing(잉크, np.ones((7, 7))))
# 제일 큰 덩어리만 (라벨 글자 띠·먼지 제거)
표, n = ndimage.label(채움)
if n > 1:
    크기 = ndimage.sum(채움, 표, range(1, n + 1))
    채움 = (표 == (np.argmax(크기) + 1))

# ③ 살짝 넓혀 반투명 가장자리를 품는다
마스크 = ndimage.binary_dilation(채움, np.ones((5, 5)))
알파 = Image.fromarray((마스크 * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))

out = im.copy()
out.putalpha(알파)
# ⑤ **여백을 남긴다** — 가장자리에 딱 붙으면 「잘린 것」처럼 보이고 검사에도 걸린다.
#    ⛔ 첫 판에서 이걸 빼먹어 올리고당 병이 위아래로 90px 닿았다(2026-08-17).
#    🔢 근거 = 기존 큐레이션 27개는 **전부** 가장자리에 안 닿는다(실측 0/27).
#    ⚠️ 200px 로 줄인 «뒤»가 아니라 «전»에 준다 — 줄이면 여백도 같이 줄어 비율이 유지된다.
out = out.crop(out.getbbox())
# ⛔ 원본 안에서 «잘라내» 여백을 만들면 제품이 이미 끝에 붙어 있을 때 소용이 없다
#    (올리고당 병이 그랬다 — 두 번 시도해도 90/83px 닿았다).
# ✅ 그래서 **투명 여백을 «붙인다»** — 반드시 생긴다.
여백 = max(8, round(max(out.size) * 0.03))
판 = Image.new('RGBA', (out.width + 여백 * 2, out.height + 여백 * 2), (0, 0, 0, 0))
판.alpha_composite(out, (여백, 여백))
out = 판

# ④ 긴변 200px — 기존 27개와 같은 규격
s = 200 / max(out.size)
out = out.resize((max(1, round(out.width * s)), max(1, round(out.height * s))), Image.LANCZOS)
out.save(낼것)

# 🔒 스스로 검사 — 「제품을 파먹지 않았나」
before = 잉크.sum()
after = (np.array(out)[..., 3] > 40).sum() / (s * s)
print(f'✅ {낼것}  {out.size}')
print(f'   제품 선 {before}px → 마스크 안 {after:.0f}px  (선이 다 들어왔으면 100% 이상)')
if after < before:
    print(f'   ⛔⛔ 마스크가 제품 선보다 작다 — 파먹혔다. 문턱·팽창을 다시 볼 것')
    sys.exit(1)
