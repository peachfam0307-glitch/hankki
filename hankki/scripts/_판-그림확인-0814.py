#!/usr/bin/env python3
# 🖼 「이 키가 무슨 그림인가」를 **눈으로** 보는 판. 인자로 키를 준다.
#   ⛔ icon-checked.json 의 판독 기록엔 «본날·해시»만 있고 «무슨 그림인지»가 없다 —
#      그래서 나중에 아무도 대조를 못 한다. 그 구멍을 이 판으로 메운다.
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1])
칸 = 190
글 = 30
찾을곳 = [ROOT / 'src/assets/stickers/photo', ROOT / 'src/assets/stickers/ing', ROOT / 'docs/stickers']

항목 = []
for a in sys.argv[2:]:
    p = None
    if '/' in a:
        p = Path(a) if Path(a).exists() else ROOT / a
    else:
        for d in 찾을곳[:2]:
            if (d / f'{a}.png').exists():
                p = d / f'{a}.png'
                break
    if p and p.exists():
        항목.append((a.split('/')[-1].replace('.png', ''), p))
    else:
        print(f'⛔ 못 찾음: {a}', file=sys.stderr)

if not 항목:
    sys.exit('⛔ 볼 게 없다')

열 = min(6, len(항목))
행 = (len(항목) + 열 - 1) // 열
img = Image.new('RGB', (열 * 칸, 행 * (칸 + 글)), 'white')
dr = ImageDraw.Draw(img)
try:
    f = ImageFont.truetype('/usr/share/fonts/truetype/nanum/NanumGothic.ttf', 17)
except Exception:
    f = ImageFont.load_default()

for i, (이름, p) in enumerate(항목):
    x, y = (i % 열) * 칸, (i // 열) * (칸 + 글)
    im = Image.open(p).convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    im = Image.alpha_composite(bg, im).convert('RGB')
    im.thumbnail((칸 - 16, 칸 - 16), Image.LANCZOS)
    img.paste(im, (x + (칸 - im.width) // 2, y + (칸 - im.height) // 2))
    dr.rectangle([x, y, x + 칸 - 1, y + 칸 + 글 - 1], outline=(210, 210, 210))
    dr.text((x + 8, y + 칸 + 5), 이름[:22], fill=(20, 20, 20), font=f)

OUT.parent.mkdir(parents=True, exist_ok=True)
img.save(OUT)
print(f'✅ {OUT}  ({len(항목)}칸)')
