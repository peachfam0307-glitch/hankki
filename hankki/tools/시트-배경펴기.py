#!/usr/bin/env python3
"""🧻 시트 배경을 «순백»으로 편다 — 자르기 «전» 단계

⛔⛔ **`tools/cut.py` 를 건드리지 않는다** (창업자 2026-08-18 *"자르기도구는 건드리지마"*).
   그래서 «자르기 앞»에 붙는 별도 단계로 만들었다.

📌 왜 필요한가 (2026-08-23 실측)
   창업자 새 시트(냄비·팬 6컷 / 접시 6컷)의 배경이 **베이지 #F0ECE7 (240,236,231)** 이었다.
   표준 도구는 «흰 배경»을 전제로 알파를 «계산»한다(보이는색 = 원래색×α + 255×(1−α)).
   배경이 흰색이 아니면 그 식이 안 맞아 배경이 안 지워지고,
   **6컷짜리 시트가 통째로 「1컷」으로 잡혔다**(투명 비율 7% = 바깥 여백뿐).

⭐ 심장 = **네 모서리에서 «번지게» 한다.** 바깥과 «이어진» 배경만 흰색으로 민다.
   ⛔ 「베이지색 픽셀을 전부 흰색으로」 하면 안 된다 —
      크림색 접시·아이보리 냄비가 배경과 같은 색대라 **그릇 몸통이 통째로 날아간다.**
   ⭐ 번짐은 그릇의 «윤곽선»에서 멎는다. 그게 안과 밖을 가르는 유일한 벽이다.

⛔ 그릇 «안»의 회색 창은 안 건드린다 — 바깥과 안 이어져 있어 번짐이 못 들어간다.
   창 뚫기는 자른 «뒤» 별도 단계가 한다(tools 안 그릇-창뚫기).

쓰기: python3 tools/시트-배경펴기.py <시트.png> <낼파일.png> [--tol 12]
"""
import argparse
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, gaussian_filter, label


def main():
    p = argparse.ArgumentParser()
    p.add_argument('시트')
    p.add_argument('낼파일')
    # 배경 240 ↔ 흰 그릇 250+ = 차이 10 → 12면 배경만 잡고 그릇은 안 먹는다
    p.add_argument('--tol', type=int, default=12)
    # 그릇 밑 그림자는 배경보다 «어둡다» — 여기까지 펴야 컷이 서로 안 붙는다
    p.add_argument('--shadow', type=int, default=45)
    p.add_argument('--feather', type=float, default=0.8)
    args = p.parse_args()

    im = Image.open(args.시트).convert('RGB')
    a = np.array(im).astype(int)
    h, w, _ = a.shape
    밝기 = a.mean(2)

    # 네 모서리 색의 «가운데값» = 배경색. 한 점만 보면 얼룩에 걸린다.
    모서리 = np.array([밝기[3, 3], 밝기[3, w - 4], 밝기[h - 4, 3], 밝기[h - 4, w - 4]])
    배경밝기 = float(np.median(모서리))
    if 배경밝기 >= 250:
        print(f'✅ 이미 흰 배경이다 (밝기 {배경밝기:.0f}) — 그대로 복사한다')
        im.save(args.낼파일)
        return

    # ⛔⛔ **위아래를 «다르게» 준다** (2026-08-23 · 창업자 냄비·접시 시트).
    #    tol 을 좌우 같게 주면 둘 중 하나가 반드시 터진다 —
    #    좁으면 그릇 밑 «그림자»가 안 펴져 여섯 컷이 그림자로 «이어지고»(실측: 6컷이 1컷으로),
    #    넓히면 배경(237)보다 밝은 «크림색 접시»(250)가 같이 걸려 그릇이 통째로 날아간다.
    # ✅ 그래서 아래(그림자)로는 넓게, 위(밝은 그릇)로는 좁게.
    후보 = (밝기 <= 배경밝기 + args.tol) & (밝기 >= 배경밝기 - args.shadow)

    # 네 모서리에서 번지게 — 바깥과 «이어진» 것만
    덩어리, n = label(후보)
    if n == 0:
        print('⛔ 배경 후보가 없다 — 시트를 눈으로 열어볼 것(절대원칙 21)')
        sys.exit(1)
    씨들 = {덩어리[3, 3], 덩어리[3, w - 4], 덩어리[h - 4, 3], 덩어리[h - 4, w - 4]} - {0}
    if not 씨들:
        print('⛔ 모서리가 배경이 아니다 — 시트에 여백이 없나 확인할 것')
        sys.exit(1)
    배경 = np.isin(덩어리, list(씨들))

    # 그릇 가장자리의 «반쯤 섞인» 픽셀까지 건드리면 윤곽이 갉인다 → 한 겹 물러선다
    배경 = 배경 & ~binary_dilation(~배경, iterations=1)

    부드럽게 = np.clip(gaussian_filter(배경.astype(np.float32), args.feather), 0, 1)[..., None]
    out = a * (1 - 부드럽게) + 255 * 부드럽게
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(args.낼파일)

    print(f'✅ {args.낼파일}')
    print(f'   배경 밝기 {배경밝기:.0f} → 255 · 편 넓이 {배경.mean():.0%}')
    if 배경.mean() < 0.15:
        print('   ⚠️ 편 넓이가 작다 — 배경이 안 이어져 있거나 tol 이 좁다. 눈으로 열어볼 것')


if __name__ == '__main__':
    main()
