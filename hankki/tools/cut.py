#!/usr/bin/env python3
"""✂️ 스티커 자르기 — **표준 도구.** 앞으로 시트는 전부 이걸로 자른다.

왜 하나로 합쳤나 (창업자 2026-07-30):
  *"우리 이거 구조적으로 잡자. 반복적으로 프레임 고친거 원인 찾고 거기에 맞는 코드 만들어서
    이제 한번에 가자."*
  하루에 프레임을 **네 번** 고쳤다(잘림 → 잡조각 → 계단 → 흰 테). 매번 다른 도구로 땜질했다.
  도구가 12개로 난립했고 각자 다른 방식이라 사고가 반복됐다.

════════ 왜 지저분하게 잘렸나 — 진짜 원인 ════════
옛 도구(`cutout-stickers.py`)는 알파를 **판정**했다:
    배경 후보 = (채도 낮음) & (밝기 >= 234)      ← 둘 중 하나로 자름
그래서 **중간이 없다.** 흰 배경에 그린 그림의 가장자리는 원래 **흰색과 반쯤 섞여** 있는데,
이걸 "배경(0)이냐 그림(255)이냐"로 나누니 두 가지가 동시에 터진다:
  ① **계단** — 알파가 0/255뿐이라 곡선이 픽셀 계단으로 보인다(626px로 키우면 확 보인다)
  ② **흰 테** — 반쯤 흰 픽셀이 '그림'으로 굳어, 색은 흰 기운을 띤 채 불투명으로 남는다
     (그걸 나중에 흐려서 부드럽게 만들면 **흰 테가 더 넓어진다** — 실제로 그랬다)

════════ 그래서 어떻게 자르나 — 표준 5단계 ════════
① **덩어리(blob)로 자른다. 격자 금지.**
   격자로 자르면 선 위에 칼이 지나가 **본체가 잘리거나 옆 그림이 딸려 온다.**
   (실제 사고: 레몬 컷에 옆 요트의 돛이 붙어 왔고, 요트는 왼쪽 선이 잘렸다)
② **알파를 판정하지 않고 계산한다.**
       보이는색 = 원래색 × α + 255 × (1−α)   →   α = (255 − 보이는색) / (255 − 원래색)
   '원래색'은 **속살**(안쪽으로 몇 px 들어간 진짜 그림 색)에서 가져온다.
   → 반투명 가장자리가 **원본 그대로** 살아난다. 계단도 흰 테도 안 생긴다.
③ **색을 속살 색으로 되돌린다** — 가장자리에 남은 흰 기운을 빼낸다.
④ **프레임이면 가운데 창을 뚫는다** — 한가운데에서 흰색만 번지게 한다(선이 막아준다).
   ⚠️ 바깥에서 번지게 하면 선의 틈으로 새어 그림까지 지운다. **반드시 가운데에서.**
⑤ **여백 12px** — 가장자리에 딱 붙으면 잘린 것처럼 보이고 게이트에 걸린다.

════════ 자른 뒤 검수 ════════
`node scripts/check-cutouts.mjs` 가 **잘림·잡조각·계단** 을 자동으로 본다.
`npm run smoke` 에 물려 있어 **걸리면 배포가 막힌다.** 사람 눈을 믿지 않는다.

쓰기:
  python3 tools/cut.py <시트.png> <내보낼폴더> <접두어> [--frame] [--min 8000]
     --frame  프레임이면 켠다(가운데 창 뚫기)
     --min    이 픽셀 수보다 작은 덩어리는 먼지로 보고 버린다
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

PAD = 12
WHITE = 246          # 이보다 밝고 채도 낮으면 '배경 후보'
CORE_ERODE = 7       # 속살 = 안쪽 이만큼 들어간 곳


def cut(sheet, outdir, prefix, is_frame=False, min_px=8000):
    rgb = np.array(Image.open(sheet).convert('RGB')).astype(float)
    mn = rgb.min(axis=2)
    art = mn < WHITE

    # ① 덩어리로 나눈다 (격자 금지)
    filled = ndimage.binary_fill_holes(ndimage.binary_closing(art, np.ones((5, 5))))
    lab, n = ndimage.label(filled)
    sizes = ndimage.sum(filled, lab, range(1, n + 1))
    keep = [i for i in range(1, n + 1) if sizes[i - 1] >= min_px]
    # 사람이 보는 순서(위→아래, 왼→오른)로 번호를 매긴다
    cents = ndimage.center_of_mass(filled, lab, keep)
    rowh = rgb.shape[0] / 4
    order = sorted(zip(keep, cents), key=lambda t: (round(t[1][0] / rowh), t[1][1]))

    os.makedirs(outdir, exist_ok=True)
    made = []
    for idx, (blob, _) in enumerate(order, 1):
        m = lab == blob
        ys, xs = np.where(m)
        y0, y1 = max(ys.min() - PAD, 0), min(ys.max() + PAD + 1, m.shape[0])
        x0, x1 = max(xs.min() - PAD, 0), min(xs.max() + PAD + 1, m.shape[1])
        reg = m[y0:y1, x0:x1]
        sub = rgb[y0:y1, x0:x1]
        h, w = reg.shape

        # ② 알파 = 흰 배경에 섞인 만큼 되돌리기 · ③ 색 = 속살 색
        core = ndimage.binary_erosion(reg & (sub.min(axis=2) < WHITE - 12), np.ones((CORE_ERODE, CORE_ERODE)))
        if core.sum() < 20:
            core = reg & (sub.min(axis=2) < WHITE - 12)
        if core.sum() < 5:
            continue
        _, ci = ndimage.distance_transform_edt(~core, return_indices=True)
        base = sub[ci[0], ci[1]]                       # 각 픽셀의 '원래색'
        gap = 255.0 - base
        ch = np.argmax(gap, axis=2)
        ii, jj = np.indices(ch.shape)
        mix = np.clip((255.0 - sub[ii, jj, ch]) / np.maximum(gap[ii, jj, ch], 1), 0, 1)

        # ⚠️⚠️ **흰색 되돌리기는 바깥 실루엣에서만 한다.**
        #   처음엔 그림 전체에 적용했다가 **돛·갈매기·밀짚모자의 흰 부분이 통째로 비쳤다.**
        #   당연하다 — 이 식은 "흰색에 가까우면 배경"으로 보는데, **흰 그림도 흰색**이다.
        #   → 안쪽은 그냥 불투명(255). 바깥 테두리 띠에서만 흰색에 섞인 만큼을 되돌린다.
        band = reg & ~ndimage.binary_erosion(reg, np.ones((7, 7)))
        alpha = np.where(reg, 1.0, 0.0)
        alpha[band] = np.minimum(alpha[band], mix[band])
        alpha[~reg] = 0                                # 이 덩어리 밖(옆 그림)은 무조건 잘라낸다

        # ④ 프레임이면 가운데에서 흰색만 번지게 해 창을 뚫는다
        if is_frame:
            white = sub.min(axis=2) >= WHITE - 2
            seed = np.zeros_like(white)
            seed[h // 2, w // 2] = True
            if white[h // 2, w // 2]:
                win = ndimage.binary_propagation(seed, mask=white & reg)
                frac = win.sum() / (h * w)
                # 안전장치 — 너무 작거나 크거나 테두리에 닿으면 안 뚫는다(선 틈으로 샌 것)
                if 0.06 < frac < 0.92 and not (win[0].any() or win[-1].any() or win[:, 0].any() or win[:, -1].any()):
                    alpha[win] = 0

        # ⚠️ **색도 테두리 띠에서만 바꾼다.** 처음엔 전부 '속살 색'으로 덮었다가
        #   **돛·레몬 속살·갈매기 배가 딴 색으로 칠해졌다.** 안쪽은 원래 색 그대로 둔다.
        out_rgb = sub.copy()
        out_rgb[band] = base[band]                     # 띠에 남은 흰 기운만 속살 색으로
        out = np.dstack([out_rgb.astype(np.uint8), (alpha * 255).astype(np.uint8)])
        name = f'{prefix}{idx:02d}.png'
        Image.fromarray(out).save(os.path.join(outdir, name))
        made.append((name, w, h))

    print(f'{os.path.basename(sheet)} → {len(made)}컷')
    for nm, w, h in made:
        print(f'   {nm}  {w}x{h}')
    return made


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) < 3:
        print(__doc__)
        sys.exit(1)
    mn_i = sys.argv.index('--min') + 1 if '--min' in sys.argv else None
    cut(args[0], args[1], args[2],
        is_frame='--frame' in sys.argv,
        min_px=int(sys.argv[mn_i]) if mn_i else 8000)
