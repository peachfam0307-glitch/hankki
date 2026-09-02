#!/usr/bin/env python3
# 🗄 서랍 «여백» 전 ↔ 후를 나란히 붙인다 — 창업자가 폰에서 한눈에 보게.
#
# 📮 창업자 = 「아직도 여백이 너무 많아보여.」
#    ⛔ 숫자로 「42px 이 됐다」라고만 말하면 창업자는 그게 얼마나인지 모른다(2026-09-01 교훈).
#       그래서 «같은 화면 두 장»을 붙여서 보여준다.
#
# ⚠️ 두 장은 deviceScaleFactor 2 로 찍혀서 **그림 픽셀 = CSS 픽셀 × 2** 다.
#    빨간 선 자리를 잴 때 이걸 잊으면 두 배로 틀린다(2026-09-01 에 한 번 틀렸다).
#
# 쓰는 법 = python3 scripts/_판-여백전후-0901.py <전 폴더> <후 폴더> <낼 파일>
import sys
from PIL import Image, ImageDraw

전, 후, 낼 = sys.argv[1], sys.argv[2], sys.argv[3]
파일 = '390-데코-가-지금.png'

왼 = Image.open(f'{전}/{파일}').convert('RGB')
오 = Image.open(f'{후}/{파일}').convert('RGB')

띠 = 64          # 이름표 띠 높이(그림 픽셀)
틈 = 24
폭 = 왼.width + 틈 + 오.width
높 = 띠 + max(왼.height, 오.height)

판 = Image.new('RGB', (폭, 높), (246, 244, 240))
판.paste(왼, (0, 띠))
판.paste(오, (왼.width + 틈, 띠))

d = ImageDraw.Draw(판)
d.text((14, 20), 'BEFORE  head 58px', fill=(150, 60, 60))
d.text((왼.width + 틈 + 14, 20), 'AFTER  head 42px', fill=(50, 110, 70))

# 머리(손잡이＋모드 줄)가 끝나는 자리에 선 — CSS px × 2
for 이미지x, 머리 in ((0, 58), (왼.width + 틈, 42)):
    y = 띠 + 머리 * 2
    d.line([(이미지x, y), (이미지x + 왼.width, y)], fill=(215, 70, 70), width=3)

판.save(낼)
print(f'✅ {낼}  ({판.width}×{판.height})')
