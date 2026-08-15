#!/usr/bin/env python3
# 🖼 「그림 ＋ 내가 붙인 라벨」 판. 인자 = <나갈파일> <경로::라벨> ...
#   ⛔ 그림 파일 «이름»을 라벨로 쓰지 않는다 — 오늘 창업자 원본에서 라벨이 서로 뒤바뀐 걸 봤다.
#      부르는 쪽이 「이 자리에 무엇이 붙는가」를 알고 있으니 그쪽이 라벨을 준다.
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1])
칸, 글 = 210, 34
항목 = [a.split('::', 1) for a in sys.argv[2:]]
if not 항목:
    sys.exit('⛔ 볼 게 없다')

열 = 6
행 = (len(항목) + 열 - 1) // 열
img = Image.new('RGB', (열 * 칸, 행 * (칸 + 글)), 'white')
dr = ImageDraw.Draw(img)
# ⛔ 여기서 폰트를 못 찾으면 `load_default()` 가 한글을 **두부 네모로** 그린다 — 그런데 «에러는 안 난다».
#    판이 다 만들어졌는데 글자만 못 읽는 꼴이 된다. 그래서 못 찾으면 죽인다.
f = None
for 후보 in ('/root/.local/lib/python3.11/site-packages/koreanize_matplotlib/fonts/NanumGothic.ttf',
             '/usr/share/fonts/truetype/nanum/NanumGothic.ttf'):
    if Path(후보).exists():
        f = ImageFont.truetype(후보, 16)
        break
if f is None:
    sys.exit('⛔ 한글 폰트를 못 찾았다 — 라벨이 두부로 나온다. 판을 안 만든다.')

for i, (경로, 라벨) in enumerate(항목):
    x, y = (i % 열) * 칸, (i // 열) * (칸 + 글)
    dr.rectangle([x, y, x + 칸 - 1, y + 칸 + 글 - 1], outline=(205, 205, 205))
    p = ROOT / 경로
    if 경로 == 'MISSING' or not p.exists():
        dr.text((x + 12, y + 칸 // 2), '⛔ 그림 없음', fill=(200, 0, 0), font=f)
    else:
        im = Image.open(p).convert('RGBA')
        bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
        im = Image.alpha_composite(bg, im).convert('RGB')
        im.thumbnail((칸 - 18, 칸 - 18), Image.LANCZOS)
        img.paste(im, (x + (칸 - im.width) // 2, y + (칸 - im.height) // 2))
    빨강 = '🔁' in 라벨
    dr.text((x + 7, y + 칸 + 8), 라벨[:26], fill=(190, 0, 0) if 빨강 else (20, 20, 20), font=f)

OUT.parent.mkdir(parents=True, exist_ok=True)
img.save(OUT)
print(f'  ✅ {OUT.name}  ({len(항목)}칸)')
