#!/usr/bin/env python3
"""🪟 프레임 «창» 뚫기 — 가운데 흰 바탕을 투명하게 (2026-08-26)

📮 창업자 = *"이거 가운데 내가 잘라줘야하는거 아냐? 확인해봐"* → 재보니 **12컷 중 11컷이 막혀 있었다.**
   ⭐ 창업자가 자를 일이 아니다(규칙 8) — 도구가 한다.

⛔⛔ **`tools/cut.py` 를 건드리지 않는다** (창업자 절대원칙 2026-08-18).
   `cut.py --frame` 이 같은 일을 하지만 그건 «시트를 자를 때» 도는 단계라
   **이미 낱개로 잘린 컷**에는 못 쓴다. 그래서 «자른 뒤» 서는 별도 도구다.

⛔ `tools/그릇-창뚫기.py` 와도 다르다 — 그건 창이 **연회색(≈#E9EBED)** 인 그릇용이고,
   여기는 **순백(≈#FEFEFE)** 인 종이 프레임용이다. 문턱이 달라 한 도구로 못 합친다.

⭐⭐ 심장 = **가운데 한 점에서만 번지게 한다**(flood fill).
   프레임 선에 막혀서 창 밖으로 못 나가고, 그림 속 흰색(리본·양초·눈)은 창과 안 이어져 있어 안 지워진다.
   ⛔ 「흰색을 전부 지우기」로 하면 **돛·갈매기·데이지 꽃잎이 통째로 사라진다**(v9.00 실제 사고).

🛡 안전장치 넷 — 하나라도 어긋나면 **그 컷은 건드리지 않는다**
   ① 가운데가 «흰색이고 불투명»할 때만 시작한다
   ② 번진 넓이가 전체의 **6~92%** 일 때만 적용 (작으면 창이 아니고, 크면 프레임을 통째로 지우는 것)
   ③ 가장자리 1px 에 «닿으면» 안 된다 — 닿았다면 선 틈으로 «새어 나간» 것이다
   ④ 흰 테(다이컷)를 지킨다 — 바깥에서 안쪽으로 `--여백` px 는 손대지 않는다

쓰기:
  python3 tools/프레임-창뚫기.py 'src/assets/stickers/photo/naf*.png'          # 재보기만(안 고침)
  python3 tools/프레임-창뚫기.py 'src/assets/stickers/photo/naf*.png' --적용    # 실제로 뚫는다
"""
import sys, glob
import numpy as np
from PIL import Image
from collections import deque

문턱 = 232      # 이보다 밝으면 「흰 바탕」 후보
채도문턱 = 18   # 색이 이보다 옅어야 (색깔 있는 그림은 제외)
여백 = 6        # 흰 테 보호 — 바깥 이만큼은 안 건드린다


def 번지기(흰, 시작):
    """시작점에서 이어진 흰 덩어리를 찾는다 — 4방향"""
    h, w = 흰.shape
    본것 = np.zeros((h, w), bool)
    q = deque([시작])
    본것[시작] = True
    닿음 = False
    n = 0
    while q:
        y, x = q.popleft()
        n += 1
        if y <= 0 or x <= 0 or y >= h - 1 or x >= w - 1:
            닿음 = True          # ③ 가장자리에 닿았다 = 밖으로 샜다
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not 본것[ny, nx] and 흰[ny, nx]:
                본것[ny, nx] = True
                q.append((ny, nx))
    return 본것, n, 닿음


def 뚫기(길, 적용):
    im = Image.open(길).convert('RGBA')
    a = np.asarray(im).astype(int)
    h, w = a.shape[:2]
    rgb, 알파 = a[:, :, :3], a[:, :, 3]
    채도 = rgb.max(axis=2) - rgb.min(axis=2)
    흰 = (rgb.min(axis=2) >= 문턱) & (채도 <= 채도문턱) & (알파 > 200)

    # ④ 흰 테 보호 — 바깥 띠는 후보에서 뺀다
    흰[:여백, :] = False; 흰[-여백:, :] = False
    흰[:, :여백] = False; 흰[:, -여백:] = False

    이름 = 길.split('/')[-1]
    cy, cx = h // 2, w // 2
    if not 흰[cy, cx]:                                   # ①
        print(f'  ⏭ {이름:12s} 가운데가 흰 바탕이 아니다 — 그대로 둔다')
        return False
    영역, n, 닿음 = 번지기(흰, (cy, cx))
    비율 = n / (h * w)
    if 닿음:                                             # ③
        print(f'  ⛔ {이름:12s} 가장자리까지 샜다 — 그대로 둔다')
        return False
    if not (0.06 <= 비율 <= 0.92):                       # ②
        print(f'  ⛔ {이름:12s} 번진 넓이 {비율*100:.1f}% — 6~92% 밖이라 그대로 둔다')
        return False
    if 적용:
        b = np.asarray(im).copy().astype(int)
        b[:, :, 3][영역] = 0

        # ⭐⭐ 여기부터가 «지지직」을 없애는 자리 — 창업자 2026-08-26 *"지지직거리지않고 매끈한지"*
        #    ⛔ 알파를 0/255 로 «판정»만 하면 선과 창 사이의 «반쯤 흰» 픽셀이 그대로 남아
        #       밝은 테두리 ＋ 톱니가 된다(8배로 보면 뚜렷하다).
        #    ✅ 자르기 표준(`docs/스티커-자르기-표준-2026-07-30.md`) 그대로 **알파를 «계산»한다** —
        #       α = (255 − 보이는색) / (255 − 속살색). 흰색에 가까울수록 투명해진다.
        #    ⭐ 창 둘레 «띠»에서만 한다 — 전체에 하면 그림 속 흰색(양초·크림)이 비친다.
        띠 = 영역.copy()
        for _ in range(2):                       # 창을 2px 넓힌 «띠»
            띠 = (띠 | np.roll(띠, 1, 0) | np.roll(띠, -1, 0)
                    | np.roll(띠, 1, 1) | np.roll(띠, -1, 1))
        띠 = 띠 & ~영역 & (b[:, :, 3] > 0)        # 이미 뚫은 창은 빼고, 보이는 픽셀만
        if 띠.any():
            밝기 = b[:, :, :3].max(axis=2)
            속살 = 150.0                          # 선 색이 이보다 어두우면 완전 불투명으로 본다
            a2 = np.clip((255.0 - 밝기) / (255.0 - 속살), 0, 1)
            새알파 = np.minimum(b[:, :, 3], (a2 * 255).round().astype(int))
            b[:, :, 3] = np.where(띠, 새알파, b[:, :, 3])
        Image.fromarray(b.astype('uint8')).save(길)
    print(f'  ✅ {이름:12s} 창 {비율*100:5.1f}% {"뚫음" if 적용 else "뚫린다(재보기)"}')
    return True


길들 = sorted(glob.glob(sys.argv[1])) if len(sys.argv) > 1 else []
적용 = '--적용' in sys.argv
if not 길들:
    print('쓰기: python3 tools/프레임-창뚫기.py <글로브> [--적용]'); sys.exit(1)
print(f'🪟 {len(길들)}컷 · {"실제로 뚫는다" if 적용 else "재보기만 (고치려면 --적용)"}\n')
됨 = sum(뚫기(p, 적용) for p in 길들)
print(f'\n{"✅" if 됨 else "⛔"} {됨}/{len(길들)}컷')
