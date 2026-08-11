#!/usr/bin/env python3
# 🏷🏷 « 그림 ↔ 이름표 » 대조 시트 — 음식 아이콘을 앱에 넣기 «전»에 눈으로 한 번 훑는 도구
#
#   ⛔⛔ 왜 만들었나 — 같은 실수를 «두 번» 했다:
#      · v9.31  「달걀·두부」에 넣은 `ni_25` 가 계란이 아니라 **식빵**이었다
#      · v9.38  `fe_124`(궁채나물) ↔ `fe_128`(소스) 가 **통째로 뒤바뀐 채** 나갔다
#               → 창업자 폰에서 「고마다래소스」에 나물 그림이 떴다
#      그때 내가 적어둔 문장: *"컷을 «번호만 보고» 골랐고, 넣은 뒤 이름표를 붙여 «다시 안 봤다».
#      → 「고른 것」이 아니라 「들어간 것」을 본다."*
#      ⛔ **규칙으로 적어뒀는데 안 지켜졌다.** 그래서 규칙 19 대로 «장치»로 만든다.
#
#   ⭐ 이 도구가 하는 일 = 그림과 «앱에 실제로 박힌 이름표»를 한 칸에 붙여 크게 그린다.
#      컨택트시트(`contact.py`)는 「무엇이 있나」를 훑는 도구고, 이건 「무엇인가」를 판정하는 판이다(규칙 18).
#      ⛔ 그래서 칸을 작게 잡지 않는다 — 2026-08-05 에 콩나물무침을 300px 로 보고 «면»이라 판정했다.
#
#   판정이 갈리면 ⑴ `--zoom` 으로 3배 ⑵ **같은 세트의 이웃과 나란히** 놓는다.
#      2026-08-08 에 `fe_113`(나박물김치)의 흰 네모를 「두부」로 읽었는데,
#      `fe_111`(열무물김치)에도 **같은 흰 네모**가 있어서 그게 「무」임이 드러났다.
#
#   쓰는 법
#     python3 hankki/tools/icon-labels.py --new              # 아직 판독 기록이 없는 컷만
#     python3 hankki/tools/icon-labels.py fe_97 fe_113 ...    # 골라서
#     python3 hankki/tools/icon-labels.py --zoom fe_97 fe_111 # 3배 · 나란히 (판정용)
#
#   판독을 마치면 `hankki/scripts/icon-checked.json` 에 키와 «본 날짜»를 적는다.
#     → `check-iconlabels.mjs` 가 그 기록 없는 컷이 픽커에 «새로» 들어오면 배포를 막는다.
import json
import os
import re
import sys

from PIL import Image, ImageDraw, ImageFont

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOTO = os.path.join(APP, 'src/assets/stickers/photo')
OUT = os.path.join(APP, 'docs/_검수판')
# ⛔ 이 컨테이너엔 한글 글꼴이 둘뿐이다. wqy 가 unifont 보다 읽기 좋다.
FONT = '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'


def read_names():
    """앱에 «실제로 박힌» 이름표를 읽는다 — 내가 기억하는 이름이 아니라."""
    src = open(os.path.join(APP, 'src/components/FoodIcon.jsx'), encoding='utf-8').read()
    names = {}
    rules = src[src.index('const ICON_RULES = ['):]
    for m in re.finditer(r"\[\[\s*'([^']+)'[^\]]*\],\s*'([^']+)'\]", rules):
        names.setdefault(m.group(2), m.group(1))
    e = src.index('EXTRA_NAMES = {')
    for m in re.finditer(r"(\w+)\s*:\s*'([^']+)'", src[e:src.index('\n}', e)]):
        names[m.group(1)] = m.group(2)
    return names


def registered():
    """픽커(FOOD_ICON_GROUPS)가 «부르는» 컷 — 폴더에 있는 게 아니라."""
    src = open(os.path.join(APP, 'src/components/FoodIcon.jsx'), encoding='utf-8').read()
    g = src.index('export const FOOD_ICON_GROUPS = [')
    body = src[g:src.index('\n]', g)]
    keys = []
    for m in re.finditer(r"items:\s*\[([^\]]*)\]", body):
        keys += [s.strip().strip("'") for s in m.group(1).split(',') if s.strip()]
    return [k for k in keys if re.match(r'^(fe|fh|fy|fj|fi|fb)_', k)]


def checked():
    p = os.path.join(APP, 'scripts/icon-checked.json')
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else {}


def sheet(keys, names, zoom=False):
    ims = [(k, Image.open(os.path.join(PHOTO, f'{k}.png')).convert('RGBA')) for k in keys]
    f_lbl = ImageFont.truetype(FONT, 30 if zoom else 27)
    f_key = ImageFont.truetype(FONT, 19)
    f_top = ImageFont.truetype(FONT, 26)

    if zoom:  # 판정판 — 3배 원본 픽셀, 한 줄로
        Z, PAD, LBL = 3, 24, 46
        W = sum(i.width for _, i in ims) * Z + PAD * (len(ims) + 1)
        H = max(i.height for _, i in ims) * Z + PAD * 2 + LBL + 40
    else:     # 훑는 판 — 격자
        COLS, CELL, PAD, LBL = 5, 300, 14, 46
        rows = (len(keys) + COLS - 1) // COLS
        W = COLS * (CELL + PAD) + PAD
        H = rows * (CELL + LBL + PAD) + PAD + 40

    c = Image.new('RGB', (W, H), (255, 255, 255))
    d = ImageDraw.Draw(c)
    d.text((14, 8), f'그림 ↔ 이름표 대조 · {len(keys)}컷 — 「고른 것」이 아니라 「들어간 것」을 본다',
           font=f_top, fill=(180, 30, 30))

    x = PAD
    for i, (k, im) in enumerate(ims):
        nm = names.get(k, '⛔이름표 없음')
        col = (20, 20, 20) if k in names else (200, 0, 0)
        if zoom:
            r = im.resize((im.width * Z, im.height * Z), Image.LANCZOS)
            c.paste(r, (x, 40 + PAD), r)
            tw = d.textlength(nm, font=f_lbl)
            d.text((x + (r.width - tw) / 2, 40 + PAD + r.height + 6), nm, font=f_lbl, fill=col)
            d.text((x + 4, 40 + PAD - 22), k, font=f_key, fill=(150, 150, 150))
            x += r.width + PAD
        else:
            cx = PAD + (i % COLS) * (CELL + PAD)
            cy = 40 + PAD + (i // COLS) * (CELL + LBL + PAD)
            d.rectangle([cx, cy, cx + CELL, cy + CELL + LBL], outline=(220, 220, 220))
            s = min((CELL - 16) / im.width, (CELL - 16) / im.height)
            r = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
            c.paste(r, (cx + (CELL - r.width) // 2, cy + (CELL - r.height) // 2), r)
            tw = d.textlength(nm, font=f_lbl)
            d.text((cx + (CELL - tw) / 2, cy + CELL + 4), nm, font=f_lbl, fill=col)
            d.text((cx + 6, cy + 4), k, font=f_key, fill=(150, 150, 150))

    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, f'아이콘대조-{"확대-" if zoom else ""}{keys[0]}-{keys[-1]}.png')
    c.save(p)
    return p


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    zoom = '--zoom' in sys.argv
    names, done = read_names(), checked()

    if '--new' in sys.argv or not args:
        args = [k for k in dict.fromkeys(registered()) if k not in done]
        if not args:
            print('✅ 픽커에 등록된 컷 전부 판독 기록이 있다 — 새로 볼 것 없음')
            return
        print(f'🔎 판독 기록 없는 컷 {len(args)}개')

    missing = [k for k in args if not os.path.exists(os.path.join(PHOTO, f'{k}.png'))]
    if missing:
        print(f'⛔ 그림이 없다: {", ".join(missing)}')
        args = [k for k in args if k not in missing]
    if not args:
        sys.exit(1)

    for i in range(0, len(args), 200 if zoom else 20):
        print(sheet(args[i:i + (200 if zoom else 20)], names, zoom))
    print('\n👀 한 칸씩 «그림과 이름표가 같은 음식인가»를 본다.')
    print('   갈리면 → --zoom 으로 3배 + 같은 세트 이웃과 나란히')
    print('   다 봤으면 → hankki/scripts/icon-checked.json 에 키와 본 날짜를 적는다')


if __name__ == '__main__':
    main()
