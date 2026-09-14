#!/usr/bin/env python3
"""
🗜 판에 실을 컷을 줄인다 ＋ 「지금 뜨는 것 ↔ 바꾸면 이것」 대조표를 만든다 (2026-08-27)

⛔ 왜 필요한가 — 원본 그대로 data URI 로 실으면 40편에 **26.7MB** 다.
   판(아티팩트)은 **16MB 상한**이라 그대로는 못 올린다.

⭐ 두 가지를 한 번에 —
   ① `mini/<키>.jpg` — 판에 실을 작은 판(흰 바탕에 눕혀서 · 긴변 300px)
   ② `대조-N.png`    — **내가 눈으로 볼 대조표**(규칙 21 — 보내기 «전»에 열어본다)

쓰기: python3 scripts/_줄이기-판용컷-0827.py <박힌컷갈이.json> <낼폴더>
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

사진 = Path(__file__).resolve().parent.parent / 'src/assets/stickers/photo'
작게 = 300
칸 = 210
글 = 34
열쌍 = 3   # 한 줄에 «쌍» 셋 = 컷 여섯


def 눕히기(k: str, 크기: int):
    p = 사진 / f'{k}.png'
    if not p.exists():
        return None
    im = Image.open(p).convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    out = bg.convert('RGB')
    out.thumbnail((크기, 크기), Image.LANCZOS)
    return out


def main():
    목록 = json.loads(Path(sys.argv[1]).read_text())
    낼곳 = Path(sys.argv[2])
    (낼곳 / 'mini').mkdir(parents=True, exist_ok=True)

    # ① 작은 판
    키들 = sorted({p['박힌'] for p in 목록} | {p['규칙'] for p in 목록 if p['규칙'] != 'default'})
    for k in 키들:
        im = 눕히기(k, 작게)
        if im:
            im.save(낼곳 / 'mini' / f'{k}.jpg', quality=78, optimize=True)
    print(f'🗜 mini {len(키들)}컷')

    # ② 내 눈으로 볼 대조표 — 왼쪽 「지금」 · 오른쪽 「바꾸면」
    행쌍 = 5
    쪽수 = (len(목록) + 열쌍 * 행쌍 - 1) // (열쌍 * 행쌍)
    for 쪽 in range(쪽수):
        묶음 = 목록[쪽 * 열쌍 * 행쌍:(쪽 + 1) * 열쌍 * 행쌍]
        판 = Image.new('RGB', (칸 * 2 * 열쌍, (칸 + 글) * 행쌍), (255, 255, 255))
        d = ImageDraw.Draw(판)
        for i, p in enumerate(묶음):
            x = (i % 열쌍) * 칸 * 2
            y = (i // 열쌍) * (칸 + 글)
            d.rectangle([x, y, x + 칸 * 2 - 2, y + 칸 + 글 - 2], outline=(190, 190, 190))
            d.text((x + 6, y + 4), f'{p["제목"][:16]}', fill=(0, 0, 0))
            d.text((x + 6, y + 18), f'{p["박힌"]} → {p["규칙"]} ({p["규칙이름"]})', fill=(150, 60, 20))
            for j, k in enumerate([p['박힌'], p['규칙']]):
                if k == 'default':
                    d.text((x + 칸 * j + 60, y + 글 + 90), '(도형)', fill=(180, 60, 40))
                    continue
                im = 눕히기(k, 칸 - 12)
                if im:
                    판.paste(im, (x + 칸 * j + (칸 - im.width) // 2, y + 글 + (칸 - 12 - im.height) // 2))
            d.line([(x + 칸, y + 글), (x + 칸, y + 칸 + 글 - 2)], fill=(220, 220, 220))
        f = 낼곳 / f'대조-{쪽 + 1}.png'
        판.save(f)
        print(f'📄 {f}  ({len(묶음)}쌍)')


if __name__ == '__main__':
    main()
