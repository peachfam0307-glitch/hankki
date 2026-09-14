#!/usr/bin/env python3
"""
🎨 레시피에 «박힌» 컷을 「옛 카와이 일러스트 ↔ 새 실사」로 가른다 (2026-08-27)

📮 창업자 = *"아직 레시피 김치찌개 아래있는 음식아이콘 안바뀌었어.."*

⛔⛔ **접두어로는 못 가른다** — v11.32 가 「키는 그대로 두고 PNG 만 갈아끼웠다」.
   `fh_k02`(김치찌개)는 **옛 키인데 새 실사**고, `fh_k13`(제육볶음)은 **옛 키에 옛 카와이**다.
   📌 이름·접두어·폴더를 보지 않는다.

⛔⛔ **「색 수」로도 못 가른다 — 내가 여기서 한 번 틀렸다(2026-08-27).**
   「카와이는 벡터라 평평한 색이 적다」고 가정하고 `top20`(많이 쓰인 색 20개가 덮는 비율)과
   `uniq`(만 픽셀당 색 수)를 쟀는데 **거꾸로 나왔다** —
      옛 카와이 `fh_k13` = top20 0.035 · uniq **6572**
      새 실사   `gr_387` = top20 0.078 · uniq  5914
   ⭐ **옛 컷도 AI 가 그린 그림이라 음영·질감이 잔뜩 들어 있다.** 「벡터처럼 평평하다」는 내 가정이 틀렸다.
   📌 규칙 18 ⓘ 그대로 — **잣대가 아는 답을 못 가르면 판정하지 않는다.** 그래서 눈으로 간다.

✅ **그래서 이 도구가 하는 일 = 「재기」가 아니라 「눈으로 보게 늘어놓기」**
   박힌 컷을 이름표와 함께 판에 깔아 준다. 판정은 눈이 한다(규칙 21).

쓰기:
  cd /home/user/hankki/hankki
  node scripts/_probe-박힌아이콘-0827.mjs --json /tmp/박힌.json
  python3 scripts/_재기-그림세대-0827.py /tmp/박힌.json <낼폴더>
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

칸 = 200      # 한 컷이 차지하는 폭
열 = 6
행 = 6
글높이 = 22


def 깔기(im: Image.Image, 크기: int) -> Image.Image:
    """투명 배경을 흰색으로 눕히고 크기에 맞춘다 — 판에서 무엇이 보이는지 헷갈리지 않게."""
    im = im.convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    out = bg.convert('RGB')
    out.thumbnail((크기, 크기), Image.LANCZOS)
    return out


def main():
    자료 = json.loads(Path(sys.argv[1]).read_text())
    낼곳 = Path(sys.argv[2] if len(sys.argv) > 2 else '.')
    낼곳.mkdir(parents=True, exist_ok=True)
    사진 = Path(자료['사진폴더'])

    # 키 하나에 편이 여럿 붙을 수 있다 — 이름표에 첫 편 제목을 같이 적는다
    이름 = {}
    for p in 자료['편']:
        이름.setdefault(p['박힌'], p['제목'])
    키들 = sorted(이름)

    없음 = [k for k in 키들 if not (사진 / f'{k}.png').exists()]
    키들 = [k for k in 키들 if (사진 / f'{k}.png').exists()]
    if 없음:
        print(f'⛔ 그림이 «없는» 키 {len(없음)}개 — {", ".join(없음)}')

    쪽수 = (len(키들) + 열 * 행 - 1) // (열 * 행)
    for 쪽 in range(쪽수):
        묶음 = 키들[쪽 * 열 * 행:(쪽 + 1) * 열 * 행]
        판 = Image.new('RGB', (칸 * 열, (칸 + 글높이) * 행), (255, 255, 255))
        d = ImageDraw.Draw(판)
        for i, k in enumerate(묶음):
            x = (i % 열) * 칸
            y = (i // 열) * (칸 + 글높이)
            im = 깔기(Image.open(사진 / f'{k}.png'), 칸 - 8)
            판.paste(im, (x + (칸 - im.width) // 2, y + 글높이 + (칸 - 8 - im.height) // 2))
            d.text((x + 5, y + 4), f'{k}  {이름[k][:11]}', fill=(0, 0, 0))
            d.line([(x, y), (x, y + 칸 + 글높이)], fill=(225, 225, 225))
            d.line([(x, y), (x + 칸, y)], fill=(225, 225, 225))
        p = 낼곳 / f'박힌컷-{쪽 + 1}.png'
        판.save(p)
        print(f'📄 {p}  ({len(묶음)}컷)')

    print(f'\n🍳 박힌 키 {len(키들)}개 · {쪽수}장')
    print('⛔ 이 판은 «고르지 않는다» — 늘어놓기만 한다. 옛 카와이인지는 눈이 판정한다(규칙 21)')


if __name__ == '__main__':
    main()
