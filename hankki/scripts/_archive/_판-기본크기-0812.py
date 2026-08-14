# -*- coding: utf-8 -*-
"""📐 「기본 크기를 얼마로 줄까」 판 — s 0.22 ↔ 0.34 (2026-08-12)

📮 창업자 *"근데 글자가 너무 작아?"*

🔢 실측 (32컷 · 종이 344px)
   | s | 종이 위 | 폰 글자 | 소스 대비 | 게이트(1.7배) |
   |---|---|---|---|---|
   | 0.22 (지금 기본) |  76px |  7.6px | 1.03배 | OK — 근데 **못 읽는다** |
   | 0.32             | 110px | 11.0px | 1.50배 | OK — 기존 99컷(11.1px)과 «똑같아진다» |
   | **0.34**         | 117px | **11.7px** | 1.60배 | OK — ⭐콤비 기본값 `gp_duo` 와 같은 값 |
   | 0.38             | 131px | 13.1px | 1.78배 | ⛔ **해상도 게이트가 막는다** |

⭐ 0.34 가 상한이자 최선인 이유 셋 —
   ① 이미 있는 규칙이다(`DecorEditor.jsx` 630줄 `gp_duo` = 0.34 · 이 32컷도 곰＋펭 콤비다)
   ② 기존 99컷 읽힘(11.1px)을 넘어선다
   ③ 게이트 1.60배로 통과 — 그 위(0.38)는 «확대는 화질을 못 살린다»로 막힌다
⛔ 그러니 **0.34 위로는 못 간다.** 더 키우려면 시트를 뽑을 때 글자를 크게 하는 수밖에 없다.
"""
import os, sys, json
from PIL import Image, ImageDraw, ImageFont

D = 'docs/stickers/레꾸캐릭터-창업자-2026-08-12/낱개-최종'
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/기본크기.png'
FONT = '/root/.local/lib/python3.11/site-packages/koreanize_matplotlib/fonts/NanumGothic.ttf'
종이W, 캔버스, 배 = 344, 1080.0, 3
고를것 = [('반응별점', 'rv04'), ('반응별점', 'rv12'), ('조리법기록', 'ck09'), ('조리법기록', 'ck15')]
이름표 = json.load(open('docs/stickers/레꾸캐릭터-창업자-2026-08-12/이름표.json', encoding='utf-8'))


def 앉히기(f, s):
    im = Image.open(f).convert('RGBA')
    k = (캔버스 * s / max(im.size)) * (종이W / 캔버스)
    return im.resize((round(im.width * k * 배), round(im.height * k * 배)), Image.LANCZOS)


칸W, 칸H = 종이W * 배 // 2, 420
판 = Image.new('RGB', (칸W * 2 + 60, 칸H * len(고를것) + 200), (253, 251, 245))
d = ImageDraw.Draw(판)
큰 = ImageFont.truetype(FONT, 30)
작 = ImageFont.truetype(FONT, 23)
d.text((30, 22), '종이에 붙는 기본 크기 — 지금 값 ↔ 키운 값', font=큰, fill=(60, 45, 35))
d.text((30, 62), '종이 344px · 판은 3배로 그렸다(폰에서 보이는 진짜 크기는 이것의 1/3)',
       font=작, fill=(150, 135, 125))
d.text((30, 92), '[!] 0.38 위로는 못 간다 — 해상도 게이트(1.7배)가 막는다.',
       font=작, fill=(196, 110, 80))
d.text((30 + 0 * 칸W, 136), 'A. 지금 기본 0.22', font=큰, fill=(150, 135, 125))
d.text((30 + 0 * 칸W, 172), '폰에서 글자 7.6px — 못 읽는다', font=작, fill=(150, 135, 125))
d.text((30 + 1 * 칸W, 136), 'B. 0.34 (콤비 기본값)', font=큰, fill=(88, 120, 160))
d.text((30 + 1 * 칸W, 172), '폰에서 글자 11.7px — 기존 99컷보다 크다', font=작, fill=(88, 120, 160))
d.line([(칸W + 15, 130), (칸W + 15, 칸H * len(고를것) + 195)], fill=(224, 214, 200), width=2)

y = 210
for 폴더, 키 in 고를것:
    for i, s in enumerate((0.22, 0.34)):
        im = 앉히기(f'{D}/{폴더}/글자있음/{키}.png', s)
        판.paste(im, (30 + i * 칸W + 40, y + (칸H - 60 - im.height) // 2), im)
    d.text((30, y + 칸H - 50), f'{키} · 「{이름표[폴더][키]}」', font=작, fill=(120, 105, 95))
    d.line([(30, y + 칸H - 12), (칸W * 2 + 30, y + 칸H - 12)], fill=(228, 220, 208), width=2)
    y += 칸H

판.save(OUT)
print(f'📐 {OUT}  {판.size}')
