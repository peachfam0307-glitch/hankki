#!/usr/bin/env python3
# 📸 9:16 스샷 → 인스타 «사진 게시물»용 3:4 로 (2026-08-26)
#
# ⛔⛔ 왜 필요한가 = **9:16 사진은 인스타 피드에 못 올린다.** 최대 세로가 3:4 다.
#    그냥 올리면 인스타가 «제 마음대로» 잘라서 제목이 날아간다(실측 = 가운데 크롭하니
#    「다섯 친구가」가 통째로 사라졌다).
#
# ⭐⭐ 그래서 «자르지 않고» 좌우에 여백을 붙여 3:4 를 만든다 — 아무것도 안 잘린다.
#    2160×3840 → 좌우 360px 씩 → **2880×3840 = 3:4 정확**
#
# ⭐ 여백은 «가장자리 열을 늘려서» 채운다 — 우리 스샷은 배경에 도트 무늬가 있어서
#    단색으로 채우면 좌우가 밋밋해 티가 난다(실물로 견줘 골랐다).
#
# 쓰는 법: python3 scripts/_판-인스타사진-0826.py <넣을폴더> <낼폴더> [--px 1440]
# 🏷 이름표 = 살아있는 도구
import sys, os, glob
from PIL import Image

a = sys.argv[1:]
if len(a) < 2:
    print('쓰는 법: _판-인스타사진-0826.py <넣을폴더> <낼폴더> [--px 1440]'); sys.exit(1)
넣을, 낼 = a[0], a[1]
높이 = int(a[a.index('--px')+1]) if '--px' in a else 1440
os.makedirs(낼, exist_ok=True)

for f in sorted(glob.glob(os.path.join(넣을, '*.png'))):
    im = Image.open(f).convert('RGB'); w, h = im.size
    새폭 = int(round(h * 3 / 4))
    if 새폭 < w:
        print(f'⛔ {os.path.basename(f)} — 이미 3:4 보다 넓다({w}×{h}). 건너뛴다'); continue
    여 = (새폭 - w) // 2
    판 = Image.new('RGB', (새폭, h))
    판.paste(im.crop((0, 0, 1, h)).resize((여, h)), (0, 0))            # 왼끝 열을 늘린다
    판.paste(im.crop((w - 1, 0, w, h)).resize((새폭 - 여 - w, h)), (여 + w, 0))
    판.paste(im, (여, 0))
    낼폭 = int(round(높이 * 3 / 4))
    판 = 판.resize((낼폭, 높이), Image.LANCZOS)
    out = os.path.join(낼, os.path.basename(f))
    판.save(out, optimize=True)
    print(f'  ✅ {os.path.basename(f):24s} {w}×{h} → {낼폭}×{높이}')
print(f'\n✅ → {낼}')
