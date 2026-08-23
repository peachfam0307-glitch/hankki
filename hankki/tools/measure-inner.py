#!/usr/bin/env python3
"""📐 글 상자 «안쪽 빈 자리»를 잰다 — 손으로 값 주지 말 것 (2026-08-07)

글 상자(라벨지·메모지) 위에 글을 얹으려면 **그림마다 안쪽 여백이 다르다.**
스캘럽 테두리는 넓고, 민무늬 사각은 좁고, 리본 배너는 양끝이 뾰족하다.
17~40컷에 손으로 값을 주는 건 노가다다(규칙 8) — **픽셀을 재서 뽑는다.**

⛔⛔ 첫 판이 틀렸다 (2026-08-07 · 코드에 남긴다)
   「불투명한 픽셀 중 **밝은** 쪽 = 바탕」으로 잡았다. 그랬더니 —
     · 왼쪽 여백 **97.4%** 같은 말이 안 되는 값이 나왔고
     · 눈으로 보면 다 비어 있는 라벨 **9컷**이 「글 못 얹는다」로 찍혔다.
   원인 = **크라프트·주황·파랑 라벨은 바탕 «자체»가 어둡다.** 바탕이 장식으로 걸러졌다.
   📌 규칙 18 — 「없다」가 아니라 «내 재는 방식»이 틀린 것이었다.

✅ 고친 방법 = 밝기가 아니라 **「주변과 색이 얼마나 급변하나」**(기울기)로 본다.
   · 테두리·글씨·꽃 장식 = 옆 픽셀과 색이 확 달라진다(기울기 큼)
   · 바탕(종이) = 밝든 어둡든 **고르다**(기울기 작음)
   → **색에 안 휘둘린다.** 크라프트든 흰 종이든 같은 잣대.
   그 「고른 자리」 마스크에서 **최대 내접 사각형**을 찾아 퍼센트 여백으로 낸다.

⚠️ 그래도 100%는 아니다 — 뽑은 값은 «시작점»이고, 실물 판으로 눈이 판정한다(규칙 13).

쓰기:
    python3 tools/measure-inner.py <파일…>              # 표로 출력
    python3 tools/measure-inner.py <파일…> --js         # Stickers.jsx 에 붙일 꼴로
    python3 tools/measure-inner.py <파일…> --panel p.png # 잰 자리를 그려서 눈으로 확인
"""
import argparse, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage


def largest_rect(mask):
    """1 로 채워진 최대 사각형 (top, left, bottom, right) — 히스토그램 기법 O(h*w)"""
    h, w = mask.shape
    height = np.zeros(w, dtype=np.int32)
    best = (0, 0, 0, 0, 0)  # area, t, l, b, r
    for y in range(h):
        height = np.where(mask[y], height + 1, 0)
        stack = []  # (시작 x, 높이)
        for x in range(w + 1):
            cur = height[x] if x < w else 0
            start = x
            while stack and stack[-1][1] >= cur:
                sx, sh = stack.pop()
                area = sh * (x - sx)
                if area > best[0]:
                    best = (area, y - sh + 1, sx, y, x - 1)
                start = sx
            stack.append((start, cur))
    return best[1:]


def inner_box(path, fill=0.86, min_alpha=200, inset=0.11):
    '''그림 안에서 «글을 놓아도 되는» 사각형을 찾아 (top,right,bottom,left) % 로.

    ⛔⛔ 이 함수를 «세 번» 고쳤다. 앞의 둘이 왜 틀렸는지 남긴다 —
      ⑴ 「밝은 곳 = 바탕」  → 크라프트·주황·파랑 라벨은 **바탕이 어둡다**. 9컷이 «없다»로 찍혔다.
      ⑵ 「색이 고른 곳 = 바탕」(기울기) → **종이 질감**(크라프트·찢은 종이 결)이 기울기를 만든다.
         최대 내접 사각형이 질감을 피해 잘게 쪼개져 **초록 네모가 터무니없이 작게** 나왔고 11컷이 «없다».
      📌 규칙 18 — 둘 다 「없다」가 아니라 «내 재는 방식»이 틀린 것이었다. 판을 눈으로 봐서 알았다.

    ✅ 셋째 판 = **알파만 본다.** 색도 질감도 안 본다.
       · 각 «행/열»이 얼마나 채워졌나(alpha>=200) 를 세서 fill 이상인 구간 = 「몸통」
       · 몸통을 안쪽으로 inset 만큼 줄인다 = 테두리 선을 피한 글 자리
    ⚠️ 이 주석의 두 낱말이 한 번 «통째로 사라졌다» — subst.py --new 안의 달러기호를
       bash 가 변수로 읽어 치환했다. 백틱만 위험한 게 아니다.
       ⭐ 리본 배너처럼 양끝이 뾰족한 것은 그 끝이 저절로 빠진다(그 열은 덜 채워졌으니까).
       ⚠️ 구석 장식(달력 아이콘·잎사귀)은 이 방법으로 «못» 피한다 → 그건 눈으로 잡아 예외로 준다.
    '''
    im = Image.open(path).convert('RGBA')
    # 크기를 줄여서 잰다 — 정밀도는 충분하고 최대사각형이 훨씬 빠르다
    if max(im.size) > 260:
        im = im.resize((max(1, im.width * 260 // max(im.size)), max(1, im.height * 260 // max(im.size))), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)
    solid = a[..., 3] >= min_alpha
    if solid.sum() < 50:
        return None
    h, w = solid.shape
    rows = solid.sum(1) / w      # 이 «행»이 얼마나 채워졌나
    cols = solid.sum(0) / h      # 이 «열»이 얼마나 채워졌나
    # ⛔⛔ 셋째 판이 여기서 틀렸다 — 두 축에 **같은 고정 문턱**(0.86)을 썼다.
    #    가로로 긴 라벨은 위아래에 투명 여백이 있어 **어떤 열도 세로로 86% 를 못 채운다**
    #    (실측: dlb01 행 최대 0.91 / 열 최대 0.82 → 열이 하나도 안 걸려 15컷이 «없다»로 찍혔다).
    # ✅ 그 축의 «최대 채움»에 대한 상대 문턱으로 본다 — v9.16 의 「회갈색은 상대 밝기로」와 같은 결.
    ry = np.where(rows >= rows.max() * fill)[0]
    rx = np.where(cols >= cols.max() * fill)[0]
    if len(ry) < 4 or len(rx) < 4:
        return None
    t, b, l, r = ry[0], ry[-1], rx[0], rx[-1]
    # 몸통 안쪽으로 — 테두리 선을 피한다. 짧은 변 기준이라 가로로 긴 라벨도 위아래가 안 뭉개진다
    ins = min(b - t, r - l) * inset
    t, b, l, r = t + ins, b - ins, l + ins, r - ins
    if b <= t or r <= l:
        return None
    return (round(t / h * 100, 1), round((w - 1 - r) / w * 100, 1),
            round((h - 1 - b) / h * 100, 1), round(l / w * 100, 1))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('paths', nargs='+')
    ap.add_argument('--js', action='store_true')
    ap.add_argument('--panel')
    a = ap.parse_args()

    out, panels = {}, []
    for p in a.paths:
        k = os.path.splitext(os.path.basename(p))[0]
        box = inner_box(p)
        out[k] = box
        panels.append((k, p, box))

    bad = [k for k, v in out.items() if v is None]
    if a.js:
        print('// 📐 글 상자 안쪽 여백 — `tools/measure-inner.py` 로 «재서» 뽑았다(손으로 준 값이 아니다)')
        print('//    [위, 오른쪽, 아래, 왼쪽] %. 그림마다 테두리·장식 자리가 달라 하나로 못 준다.')
        print('export const BOX_PAD = {')
        for k, v in out.items():
            if v:
                print(f'  {k}: [{v[0]}, {v[1]}, {v[2]}, {v[3]}],')
        print('}')
    else:
        print(f'📐 {len(out)}컷 — 안쪽 빈 자리 (위/오른쪽/아래/왼쪽 %)')
        for k, v in out.items():
            print(f'   {k:8s} {v}' if v else f'   {k:8s} ⛔ 넓은 바탕이 없다 — 글 얹기에 안 맞는다')
    if bad:
        print(f'\n⛔ 글을 못 얹는 컷 {len(bad)}개: {" ".join(bad)}', file=sys.stderr)

    if a.panel:
        # 👁 잰 자리를 그려서 «눈으로» 확인 — 숫자만 믿지 않는다(v9.16 교훈)
        cols, cell = 6, 240
        rows = (len(panels) + cols - 1) // cols
        sheet = Image.new('RGB', (cols * cell, rows * (cell + 26)), (34, 38, 58))
        d = ImageDraw.Draw(sheet)
        for i, (k, p, box) in enumerate(panels):
            im = Image.open(p).convert('RGBA')
            im.thumbnail((cell - 16, cell - 16))
            x = (i % cols) * cell + (cell - im.width) // 2
            y = (i // cols) * (cell + 26) + 22 + (cell - 16 - im.height) // 2
            sheet.paste(im, (x, y), im)
            d.text(((i % cols) * cell + 6, (i // cols) * (cell + 26) + 5), k, fill=(220, 214, 200))
            if box:
                t, r, bo, l = box
                x0, y0 = x + im.width * l / 100, y + im.height * t / 100
                x1, y1 = x + im.width * (1 - r / 100), y + im.height * (1 - bo / 100)
                if x1 > x0 and y1 > y0:                      # ⛔ 첫 판은 이 검사가 없어 «판 그리다 죽었다»
                    d.rectangle([x0, y0, x1, y1], outline=(120, 230, 160), width=2)
            else:
                d.line([x, y, x + im.width, y + im.height], fill=(220, 90, 70), width=3)
        sheet.save(a.panel)
        print(f'\n👁 {a.panel} — 초록 네모가 「글이 들어갈 자리」다. ⛔숫자만 믿지 말고 이걸 볼 것')


if __name__ == '__main__':
    main()
