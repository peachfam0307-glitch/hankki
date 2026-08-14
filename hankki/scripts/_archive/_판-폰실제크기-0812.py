# -*- coding: utf-8 -*-
"""📱 「폰에서 이만큼 보인다」 판 — 글자있음 ↔ 글자없음 (2026-08-12)

⭐ 왜 이 판인가 = 창업자가 정할 것은 *"글자는 넣어 빼?"* 인데,
   진한 판·밝은 판은 컷을 «키워서» 보여준다. **키운 판으로는 「읽히나」를 못 정한다.**
   그래서 **앱과 똑같은 계산으로** 종이 위에 얹어 그린다.

🔢 계산 근거 (짐작 아님 · 전부 코드·실측에서 가져왔다)
   · 캔버스 1080 = `DecorLayer` 기준
   · 스티커 기본 크기 `s = 0.22` = `DecorEditor.jsx` 630줄 (PHOTO_IDS 이고 dc_/ch_ 아님)
   · 레꾸 종이 폰 실측 **344px** (CLAUDE.md v10.07)
   · 손잡이 상한 = 소스 긴변 × 1.7 (`DecorLayer` 해상도 보호)
"""
import os, sys, json
from PIL import Image, ImageDraw, ImageFont

D = 'docs/stickers/레꾸캐릭터-창업자-2026-08-12/낱개-최종'
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/폰실제크기.png'
FONT = '/root/.local/lib/python3.11/site-packages/koreanize_matplotlib/fonts/NanumGothic.ttf'
종이W, 캔버스, S = 344, 1080.0, 0.22
배 = 3                                  # ⚠️판 자체는 3배로 그린다(폰 화면을 확대해 보는 것과 같다)
고를것 = [('반응별점', 'rv04'), ('반응별점', 'rv06'), ('반응별점', 'rv12'),
          ('조리법기록', 'ck09'), ('조리법기록', 'ck15'), ('조리법기록', 'ck04')]
이름표 = json.load(open('docs/stickers/레꾸캐릭터-창업자-2026-08-12/이름표.json', encoding='utf-8'))


def 앉히기(f, 배율=1.0):
    """앱이 하는 그대로 — 긴변을 1080×0.22 에 맞추고, 종이(344)로 다시 줄인다."""
    im = Image.open(f).convert('RGBA')
    캔버스크기 = 캔버스 * S * 배율
    k = (캔버스크기 / max(im.size)) * (종이W / 캔버스)
    return im.resize((max(1, round(im.width * k * 배)), max(1, round(im.height * k * 배))), Image.LANCZOS)


칸W, 칸H = 종이W * 배 // 2, 430          # ⚠️실측으로 맞춘 값 — 1.7배 컷이 386px 이라 그 위
판 = Image.new('RGB', (칸W * 2 + 60, 칸H * len(고를것) + 190), (253, 251, 245))
d = ImageDraw.Draw(판)
큰 = ImageFont.truetype(FONT, 30)
작 = ImageFont.truetype(FONT, 23)
d.text((30, 22), '폰에서 실제로 이만큼 보인다', font=큰, fill=(60, 45, 35))
d.text((30, 62), '종이 344px · 기본 크기 s=0.22 · 칸마다 「기본 / 최대로 키운 것(1.7배)」',
       font=작, fill=(150, 135, 125))
d.text((30, 92), '[!] 판은 3배로 그렸다 — 폰에서 보이는 진짜 크기는 이것의 1/3.',
       font=작, fill=(196, 110, 80))
d.text((30 + 0 * 칸W, 134), '① 글자없음', font=큰, fill=(88, 120, 160))
d.text((30 + 1 * 칸W, 134), '② 글자있음', font=큰, fill=(88, 120, 160))
d.line([(칸W + 15, 128), (칸W + 15, 칸H * len(고를것) + 180)], fill=(224, 214, 200), width=2)

y = 180
for 폴더, 키 in 고를것:
    라벨 = 이름표[폴더][키]
    for i, 판종류 in enumerate(('글자없음', '글자있음')):
        f = f'{D}/{폴더}/{판종류}/{키}.png'
        기본, 최대 = 앉히기(f), 앉히기(f, 1.7)
        x = 30 + i * 칸W
        판.paste(기본, (x, y + (칸H - 60 - 기본.height) // 2), 기본)
        판.paste(최대, (x + 200, y + (칸H - 60 - 최대.height) // 2), 최대)
        if i == 0:
            d.text((x, y + 칸H - 52), f'{키} · 「{라벨}」', font=작, fill=(120, 105, 95))
    d.line([(30, y + 칸H - 12), (칸W * 2 + 30, y + 칸H - 12)], fill=(228, 220, 208), width=2)
    y += 칸H

판.save(OUT)
print(f'📱 {OUT}  {판.size}')
