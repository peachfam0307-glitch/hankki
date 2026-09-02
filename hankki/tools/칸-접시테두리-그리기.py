# 🖊🖊 접시 «바깥»에 길잡이 선을 그린다 — 자르기 «전» 단계 (2026-08-23)
#
# 📮 창업자 = *"너무 어려우면 접시를 화이트에 테두리를 넣을까 너 자르기쉽게"*
#    ⭐ 방향은 맞다. 그런데 **다시 뽑을 필요가 없다** — 선은 코드로 그려 넣을 수 있다(규칙 8).
#
# ⛔⛔ 원인 (실측) = **흰 그릇 ＋ 흰 배경**이라 경계가 사라진다.
#    `cut.py` 는 「밝으면 배경」으로 보는데 흰 접시의 제일 밝은 테두리가 250~253 이라 함께 지워진다.
#    📌 `docs/그릇프레임-만드는법-2026-08-23.md` = *"진갈색 선은 «남길 무늬»가 아니라 «자를 때 쓰는 길잡이»다"*
#       → 지금 앱에 든 391컷이 다 외곽선이 있어서 잘 잘렸던 것이고, `cut.py` 의 절대원칙 ⓪ 자체가
#         **「외곽선이 있다」를 전제**로 만들어져 있다. 우리 시트만 그 전제를 안 갖췄다.
#
# ⭐⭐ 하는 일 = 그림을 **한 픽셀도 안 건드리고**, 그림 «바로 바깥»에만 선을 얹는다.
#    · 그림 = 배경이 아닌 것(바깥과 이어진 순백 ≥254 만 배경)
#    · 그 그림을 바깥쪽으로 N px 부풀린 «차이»에만 칠한다 → **접시 손실이 구조적으로 0px**
#    ⛔ 배경을 «안쪽으로» 미는 방식은 쓰지 않는다 — 그건 접시를 먹는다(오늘 그걸로 두 번 죽었다).
#
# ⛔ `cut.py` 는 건드리지 않는다 (창업자 절대원칙 2026-08-18). 이건 그 «앞»에 서는 별개 도구다.
#
# 쓰기:  python3 tools/칸-접시테두리-그리기.py <칸폴더> [선색=210] [두께=3]
import glob
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage


def 둥근도장(지름):
    """⭐ 네모 커널로 부풀리면 모서리가 튀어 «톱니»가 진다. 접시는 둥그니까 도장도 둥글게."""
    r = (지름 - 1) / 2.0
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return (x * x + y * y) <= r * r + 0.5


폴더 = sys.argv[1]
선색 = int(sys.argv[2]) if len(sys.argv) > 2 else 210   # <250 이라야 cut.py 가 «그림»으로 본다
두께 = int(sys.argv[3]) if len(sys.argv) > 3 else 3
순백 = 254   # ⭐ 이 위만 «배경 후보». 접시 테두리(250~253)는 절대 안 건드린다

바뀜 = 0
for f in sorted(glob.glob(os.path.join(폴더, '*.png'))):
    im = Image.open(f).convert('RGB')
    a = np.asarray(im).copy()
    mn = a.min(axis=2)
    흰 = (mn >= 순백)
    lab, n = ndimage.label(흰)
    if n == 0:
        continue
    H, W = 흰.shape
    바깥 = set()
    for x in range(0, W, max(1, W // 60)):
        if lab[0, x]: 바깥.add(lab[0, x])
        if lab[H - 1, x]: 바깥.add(lab[H - 1, x])
    for y in range(0, H, max(1, H // 60)):
        if lab[y, 0]: 바깥.add(lab[y, 0])
        if lab[y, W - 1]: 바깥.add(lab[y, W - 1])
    if not 바깥:
        continue
    배경 = np.isin(lab, list(바깥))
    # ⛔⛔ 「그림 = ~배경」으로 씨앗을 잡으면 «안 된다» (2026-08-23 실측으로 죽었다)
    #    250~253 인 옅은 그림자 얼룩이 배경 전체에 수만 점 흩뿌려져 있어서
    #    그 하나하나가 씨앗이 되어 부푼다 → 그림 77,420 → 194,394px (2.5배).
    #    ✅ 씨앗은 «덩어리»로 좁힌다 — 접시는 큰 덩어리 하나다.
    lab2, n2 = ndimage.label(~배경)
    if n2 == 0:
        continue
    크기 = ndimage.sum(np.ones_like(lab2), lab2, range(1, n2 + 1))
    가장큰 = float(크기.max())
    몸통번호 = [i + 1 for i, s in enumerate(크기) if s >= 가장큰 * 0.02]   # 접시 ＋ 떨어진 고명
    몸통 = np.isin(lab2, 몸통번호)
    # ⭐ 매끈하게 — 네모 커널로 부풀리면 «톱니»가 진다 (창업자 2026-08-23 *"선이 심하게 삐뚤한거 아냐?"*)
    #    접시는 타원인데 옅은 그림자 얼룩 때문에 경계가 지저분하다 → 구멍 메우고 둥근 도장으로 다듬는다
    몸통 = ndimage.binary_fill_holes(몸통)
    # ⭐ 도장이 작으면 물결이 그대로 남는다 (5px 로는 «조개껍데기»가 됐다 · 2026-08-23 눈으로 확인)
    #    접시 긴변의 6% 쯤 되는 큰 도장으로 한 번에 메운다
    큰도장 = 둥근도장(max(9, (int(max(H, W) * 0.06)) | 1))
    몸통 = ndimage.binary_closing(몸통, 큰도장)
    몸통 = ndimage.binary_fill_holes(몸통)
    # 🖊 몸통을 바깥으로 부풀린 «차이» 중 «배경이던 자리»에만 칠한다 → 그림 손실이 구조적으로 0px
    부푼 = ndimage.binary_dilation(몸통, 둥근도장(두께 * 2 + 1))
    테 = 부푼 & 배경
    if not 테.any():
        continue
    # 🔒 안전장치 — 배경이 아니던 픽셀을 한 개라도 덮으면 죽는다
    겹침 = int((테 & ~배경).sum())
    if 겹침 > 0:
        print(f'⛔ {os.path.basename(f)} — 테가 그림 {겹침}px 를 덮는다. 저장 안 함')
        continue
    a[테] = 선색
    Image.fromarray(a).save(f)
    바뀜 += 1
print(f'✅ {바뀜}칸에 길잡이 선 (색 {선색} · 두께 {두께}px · 접시 손실 0px)')
