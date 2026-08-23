#!/usr/bin/env python3
"""🍲 그릇 프레임 «창» 뚫기 — 회색 사진칸을 투명하게

📮 창업자 2026-08-23 = *"원형 음식 사진의 가장자리보다 그릇 안쪽 테두리가 살짝 위에 겹쳐져야 해.
   그래야 음식 사진이 위에 붙인 동그란 스티커처럼 안 보이고, 정말 그릇 안에 담긴 것처럼 보여."*

⛔⛔ **`tools/cut.py` 를 건드리지 않는다** (창업자 2026-08-18 *"자르기도구는 건드리지마"*).
   그래서 «자른 뒤» 도는 별도 단계로 만들었다.

⛔ `cut.py --frame` 은 가운데 «순백»을 번지게 한다. 우리 그릇의 창은 **연회색**(≈#E9EBED)이라
   그 길로는 안 뚫린다. 그래서 여기서 «회색»을 기준으로 번지게 한다.

⭐⭐ 심장 = **창을 안쪽 테보다 «작게» 남기지 않는다.**
   창이 테와 «딱 맞으면» 사진 가장자리와 테 안쪽이 만나기만 하고 안 겹쳐서
   안티에일리어싱 때문에 **머리카락 같은 흰 틈**이 생긴다 — 창업자가 말한 「스티커처럼 뜨는」 그것.
   ⭐ 앱 쪽에서 사진을 창보다 2~3% 크게 깔아(오버스캔) 테 «밑»으로 밀어 넣는다.
      여기서는 창을 «있는 그대로» 뚫기만 한다. 두 곳에서 같은 보정을 하면 두 번 겹친다.

⛔ 바깥에서 번지게 하지 않는다 — 선의 틈으로 새어 그릇 몸통까지 지운다(cut.py 표준 ④와 같은 이유).
   반드시 **창 한가운데**에서 시작한다.

쓰기: python3 tools/그릇-창뚫기.py <낱개폴더> [--tol 26] [--feather 1.2]
"""
import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, binary_erosion, gaussian_filter, label


def 창찾기(rgb, alpha, tol, open_iter, grow):
    """그릇 «안»의 연회색 덩어리를 찾아 마스크로 돌려준다."""
    h, w = alpha.shape
    보임 = alpha > 128
    if not 보임.any():
        return None

    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    밝기 = (r + g + b) / 3.0
    채도 = np.max(rgb, axis=2).astype(int) - np.min(rgb, axis=2).astype(int)

    # ⭐ 시작점 = 컷의 «무게중심». 창은 늘 가운데에 있다.
    ys, xs = np.nonzero(보임)
    cy, cx = int(ys.mean()), int(xs.mean())

    # ⛔⛔ **고정 밝기 범위로 자르면 «위에서 본» 접시에서 통째로 샌다** (2026-08-23 실측).
    #    높이 있는 그릇은 창과 벽 사이에 «진갈색 선»이 있어 번짐이 거기서 멎는데,
    #    위에서 본 접시는 그 선이 없고 창 213 ↔ 테 224~230 으로 **차이가 11뿐**이다.
    #    처음엔 200~246 을 창으로 봐서 **테까지 먹고 그릇이 사라졌다**(창폭비 0.96).
    # ✅ 그래서 «한가운데 색»을 기준으로 ±tol 만 받는다 — 시트마다 창 색이 달라도 따라간다.
    씨밝기 = float(np.median(밝기[max(0, cy - 4):cy + 5, max(0, cx - 4):cx + 5]))
    후보 = 보임 & (채도 <= 14) & (np.abs(밝기 - 씨밝기) <= tol)
    if not 후보.any():
        return None

    # ⛔⛔ **테의 «그늘»이 창과 같은 밝기가 되는 자리가 있다** (2026-08-23 · 스캘럽 접시·꽃 접시).
    #    거기서 창과 테가 «가는 목»으로 이어져 번짐이 테로 새고 접시 반쪽이 사라졌다.
    # ✅ 그래서 «열기(opening)» — 깎았다가 도로 부풀린다.
    #    깎으면 가는 목이 «끊어지고», 창 같은 넓은 덩어리는 살아남는다.
    #    찾은 뒤 같은 만큼 부풀려 원래 창 크기를 되찾는다(안 그러면 창이 작아져 테가 사진을 덮는다).
    깎은것 = binary_erosion(후보, iterations=open_iter)
    if not 깎은것.any():
        깎은것 = 후보

    덩어리, n = label(깎은것)
    if n == 0:
        return None
    씨 = 덩어리[cy, cx]
    if 씨 == 0:
        # 무게중심이 선 위에 얹혔다 → 가운데에서 가장 가까운 후보 픽셀로 옮긴다
        cys, cxs = np.nonzero(깎은것)
        if len(cys) == 0:
            return None
        i = int(np.argmin((cys - cy) ** 2 + (cxs - cx) ** 2))
        씨 = 덩어리[cys[i], cxs[i]]
    창 = binary_dilation(덩어리 == 씨, iterations=open_iter) & 후보

    # ⛔⛔⛔ **창만 뚫으면 «진갈색 선»이 사진 둘레에 링으로 남는다** (2026-08-23 창업자 지적
    #    *"내부 선도 다보이고 합성한티가 너무 나"*).
    #    🔢 실측(주름 접시) = 창 반지름 158px · 진갈색 선 164px → 선을 덮으려면 3.8% 필요한데
    #       오버스캔이 3%(163px)라 **1px 차이로 못 덮었다.**
    #    ⭐ 지피티가 직접 합성한 판을 나란히 놓고 보니 거기엔 **선이 아예 안 보인다** — 음식이 선을 덮는다.
    # ✅ 그래서 창을 «선 바깥까지» 넓혀 뚫는다. 선은 자를 때 쓰는 «길잡이»지 남길 무늬가 아니다.
    #    ⛔ 앱에서 오버스캔으로 덮으려 하면 프레임마다 필요한 양이 달라 반드시 하나는 어긋난다.
    if grow > 0:
        창 = binary_dilation(창, iterations=grow)

    # ⛔ 창이 컷의 «거의 전부»면 테까지 먹은 것이다 — 뚫으면 그릇이 사라진다
    if 창.sum() > 보임.sum() * 0.88:
        return None

    # ⛔ 너무 작으면 창이 아니라 «유약 반사»다 — 뚫으면 그릇에 구멍이 난다
    if 창.sum() < 보임.sum() * 0.05:
        return None
    return 창


def 뚫기(경로, tol, feather, open_iter, grow):
    im = Image.open(경로).convert('RGBA')
    a = np.array(im)
    rgb, alpha = a[..., :3], a[..., 3]

    창 = 창찾기(rgb, alpha, tol, open_iter, grow)
    if 창 is None:
        return None

    # 부드럽게 — 0/255 로 자르면 창 둘레에 계단이 진다(cut.py 표준 ②와 같은 이유)
    부드럽게 = gaussian_filter(창.astype(np.float32), feather)
    새알파 = alpha.astype(np.float32) * (1.0 - np.clip(부드럽게, 0, 1))

    out = a.copy()
    out[..., 3] = np.clip(새알파, 0, 255).astype(np.uint8)
    Image.fromarray(out).save(경로)

    # 창을 «잰다» — 이 값이 FRAME_WINDOW 후보가 된다(scripts/frame-windows.mjs 가 다시 실측한다)
    ys, xs = np.nonzero(창)
    보임 = alpha > 128
    by, bx = np.nonzero(보임)
    W = bx.max() - bx.min() + 1
    H = by.max() - by.min() + 1
    return {
        '컷': f'{W}×{H}',
        '창폭비': round((xs.max() - xs.min() + 1) / W, 3),
        '창높이비': round((ys.max() - ys.min() + 1) / H, 3),
        'cx': round((xs.mean() - bx.min()) / W, 3),
        'cy': round((ys.mean() - by.min()) / H, 3),
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument('폴더')
    # 창 213 ↔ 테 224~230 = 차이 11 (2026-08-23 실측) → 7이면 안 샌다
    p.add_argument('--tol', type=int, default=7)
    p.add_argument('--feather', type=float, default=1.2)
    # 테 그늘이 창과 이어지는 «가는 목»을 끊는다 (2026-08-23 · 스캘럽 접시·꽃 접시)
    p.add_argument('--open', type=int, default=4)
    # 창을 «진갈색 선 바깥»까지 넓힌다 — 안 넓히면 선이 사진 둘레 링으로 남는다
    p.add_argument('--grow', type=int, default=7)
    args = p.parse_args()

    파일들 = sorted(Path(args.폴더).glob('*.png'))
    if not 파일들:
        print(f'⛔ {args.폴더} 에 png 가 없다')
        sys.exit(1)

    못뚫음 = []
    print(f'\n🍲 창 뚫기 — {len(파일들)}컷\n')
    for f in 파일들:
        r = 뚫기(f, args.tol, args.feather, args.open, args.grow)
        if r is None:
            못뚫음.append(f.name)
            print(f'  ⛔ {f.stem}  창을 못 찾았다')
        else:
            print(f"  ✅ {f.stem}  {r['컷']}  창 = 폭 {r['창폭비']} · 높이 {r['창높이비']}  중심 {r['cx']}/{r['cy']}")

    if 못뚫음:
        print(f'\n⛔ {len(못뚫음)}컷을 못 뚫었다 — {", ".join(못뚫음)}')
        print('   👉 창 색이 다르거나(순백/진한 회색) 창이 너무 작다. 눈으로 열어볼 것(절대원칙 21).')
        sys.exit(1)
    print('\n✅ 전부 뚫렸다\n')


if __name__ == '__main__':
    main()
