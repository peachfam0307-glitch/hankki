# 🔬 「왜 잘리나」 최종 — 흰 여백 비율 (2026-08-26)
#
# ⭐⭐ 이건 **새 발견이 아니다.** 2026-08-24 에 이미 확정한 잣대다 —
#    `docs/음식컷-전수검사-2026-08-26.md` = *"192컷 중 86컷이 파먹힌 원인을
#    「그릇 중 흰 여백 비율」로 확정했다(상관계수 **−0.796**)"*
#    📌 그때 세 줄을 프롬프트에 더했는데 **8/24 시트는 그 «전»에 뽑은 것**이라 안 들어갔다.
#
# 🔬 재는 것 = 칸마다 **「그릇 덩어리 중 «흰» 픽셀 비율」**
#    흰 접시가 넓게 드러날수록 배경(255)과 밝기가 가까워 칼이 어디가 끝인지 못 정한다.
#
# ⛔ 앞서 두 잣대(경계 진하기 · 흐림 폭)는 «평균»으론 갈렸지만 시트 06·21 같은 예외가 있었다.
#    이 잣대는 이미 상관계수로 검증된 것이라 그걸로 닫는다.
import glob, json, os

import numpy as np
from PIL import Image
from scipy import ndimage

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
판정 = json.load(open(f'{APP}/docs/stickers/판정-이름표전수-2026-08-26.json'))
좋 = {k for k in 판정['좋아'] if not k.startswith('gr_')}
깨 = {k for k in 판정['접시깨짐'] if not k.startswith('gr_')}
행, 열 = 2, 3

값 = []
for 길 in sorted(glob.glob(f'{APP}/docs/stickers/음식-창업자-2026-08-24/원본시트/*')):
    s = os.path.basename(길)[:2]
    a = np.asarray(Image.open(길).convert('RGB')).astype(np.int16)
    mn = a.min(axis=2)
    H, W = mn.shape
    for r in range(행):
        for c in range(열):
            키 = f'{s}_{r * 열 + c + 1:02d}'
            if 키 not in 좋 and 키 not in 깨:
                continue
            k = mn[r * H // 행:(r + 1) * H // 행, c * W // 열:(c + 1) * W // 열]
            k = k[:int(k.shape[0] * 0.82)]      # ⛔ 아래 라벨 글자는 뺀다
            몸 = ndimage.binary_fill_holes(ndimage.binary_closing(k < 250, np.ones((7, 7))))
            lab, n = ndimage.label(몸)
            if not n:
                continue
            몸 = lab == int(np.argmax(ndimage.sum(몸, lab, range(1, n + 1)))) + 1
            if 몸.sum() < 5000:
                continue
            # ⭐ 「흰 여백」 = 그릇 안인데 밝기 235 이상 (흰 도자기가 드러난 자리)
            흰 = float((k[몸] >= 235).mean())
            값.append((흰, 키, 키 in 깨))

깨값 = [v for v, k, b in 값 if b]
좋값 = [v for v, k, b in 값 if not b]
print('🔬 「그릇 중 흰 여백 비율」 — 창업자 판정과 대조')
print()
print(f'   ⛔ 접시깨짐 {len(깨값):>3}컷 — 중앙값 **{np.median(깨값):.1%}**  (범위 {min(깨값):.0%}~{max(깨값):.0%})')
print(f'   ✅ 좋아    {len(좋값):>3}컷 — 중앙값 **{np.median(좋값):.1%}**  (범위 {min(좋값):.0%}~{max(좋값):.0%})')

# 상관계수 — 잣대가 진짜 가르는지
x = np.array([v for v, k, b in 값])
y = np.array([1 if b else 0 for v, k, b in 값])
print(f'   📈 상관계수 = **{np.corrcoef(x, y)[0, 1]:+.3f}**  (흰 여백이 넓을수록 깨진다)')

문턱 = 0.5
맞 = sum((v >= 문턱) == b for v, k, b in 값)
print(f'   🎯 「흰 여백 {문턱:.0%} 이상이면 깨진다」로 보면 {맞}/{len(값)} = **{맞 / len(값):.0%}** 를 맞힌다')
print()
값.sort(reverse = True)
print('   ── 흰 여백이 제일 넓은 8컷 ──')
for v, k, b in 값[:8]:
    print(f'   {v:6.1%}  {k}  {"⛔깨짐" if b else "✅좋아"}')
print('   ── 제일 좁은 8컷 ──')
for v, k, b in 값[-8:]:
    print(f'   {v:6.1%}  {k}  {"⛔깨짐" if b else "✅좋아"}')
