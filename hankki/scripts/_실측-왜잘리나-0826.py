# 🔬 「왜 그렇게 잘리나」 — 창업자가 시킨 분석 (2026-08-26)
#
# 📮 창업자 = *"프롬프트 추가할 것도 맨 아래 정확히 적어(네가 «우선 왜 그렇게 잘리는지 분석»하고 나서)"*
#
# ⭐⭐ 먼저 드러난 것 = **시트 «단위»로 갈린다** (전부좋음 18장 · 전멸 8장 · 섞임 6장).
#    자르기는 32장에 똑같이 돌았다 → **원인은 자르는 쪽이 아니라 «그 시트 그림»이다.**
#
# 🔬 재는 것 = 잘린 뒤가 아니라 **원본 시트**에서, 그림 «바깥 경계»가 어떻게 생겼나.
#   ⛔ 앞서 두 번은 «잘린 컷»을 쟀다가 실패했다 — 흰 테(diecut)가 경계를 덮어 240/255 두 값만 나왔다.
#      📌 잘린 컷은 «자르기가 끝난 결과»라 원인이 이미 지워져 있다. 원인은 원본에 있다.
#
# 세 가지를 잰다
#   ① **경계 진하기** = 그림 덩어리 테두리 «안쪽» 띠의 밝기 10퍼센타일 — 진갈색 선이 있으면 낮다
#   ② **경계 흐림 폭** = 그림에서 배경(254+)까지 «몇 px 만에» 도달하나 — 흐릿하면 칼이 헤맨다
#   ③ **접지 그림자** = 그림 아래 빛무리 두께
import glob, json, os, sys

import numpy as np
from PIL import Image
from scipy import ndimage

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
판정 = json.load(open(f'{APP}/docs/stickers/판정-이름표전수-2026-08-26.json'))
좋 = {k for k in 판정['좋아'] if not k.startswith('gr_')}
깨 = {k for k in 판정['접시깨짐'] if not k.startswith('gr_')}
시트별 = {}
for k in 좋 | 깨:
    s = k.split('_')[0]
    g, b = 시트별.get(s, (0, 0))
    시트별[s] = (g + (k in 좋), b + (k in 깨))

행, 열 = 2, 3
결과 = []
for 길 in sorted(glob.glob(f'{APP}/docs/stickers/음식-창업자-2026-08-24/원본시트/*')):
    s = os.path.basename(길)[:2]
    if s not in 시트별:
        continue
    g, b = 시트별[s]
    a = np.asarray(Image.open(길).convert('RGB')).astype(np.int16)
    mn = a.min(axis=2)
    H, W = mn.shape
    진, 흐림, 무리 = [], [], []
    for r in range(행):
        for c in range(열):
            k = mn[r * H // 행:(r + 1) * H // 행, c * W // 열:(c + 1) * W // 열]
            # ⛔ 라벨 글자가 아래에 있다 — 아래 18% 는 잘라내고 본다(글자는 늘 새까맣다)
            k = k[:int(k.shape[0] * 0.82)]
            몸 = ndimage.binary_fill_holes(ndimage.binary_closing(k < 250, np.ones((7, 7))))
            lab, n = ndimage.label(몸)
            if not n:
                continue
            몸 = lab == int(np.argmax(ndimage.sum(몸, lab, range(1, n + 1)))) + 1
            띠 = 몸 ^ ndimage.binary_erosion(몸, np.ones((5, 5)))
            if 띠.sum() < 300:
                continue
            진.append(float(np.percentile(k[띠], 10)))
            # ② 아래 가운데에서 «그림 끝 → 배경(254)» 까지 몇 줄인가
            줄 = np.where(몸.any(axis=1))[0]
            아래 = int(줄[-1])
            xs = np.where(몸[아래 - 6])[0]
            cx = (int(xs[0]) + int(xs[-1])) // 2 if len(xs) else k.shape[1] // 2
            세로 = k[아래:min(k.shape[0], 아래 + 40), cx]
            닿 = np.where(세로 >= 254)[0]
            흐림.append(int(닿[0]) if len(닿) else 40)
            무리.append(int(np.sum((세로 > 246) & (세로 < 254))))
    if not 진:
        continue
    갈래 = '✅전부좋음' if b == 0 else ('⛔전멸' if g == 0 else '🟡섞임')
    결과.append((갈래, s, float(np.median(진)), float(np.median(흐림)), float(np.median(무리))))

print('🔬 8/24 원본 시트 — 그림 «바깥 경계»가 어떻게 생겼나')
print()
print('   갈래        시트   ①경계진하기  ②흐림폭   ③접지그림자')
for 갈래, s, p, f, m in sorted(결과, key = lambda r: (r[0], r[1])):
    print(f'   {갈래:<10} {s}    {p:8.0f}  {f:7.0f}px {m:9.0f}px')
print()
for 이름 in ('✅전부좋음', '⛔전멸', '🟡섞임'):
    묶 = [r for r in 결과 if r[0] == 이름]
    if not 묶:
        continue
    print(f'   {이름} {len(묶):>2}장 — 경계진하기 중앙값 {np.median([r[2] for r in 묶]):5.0f}'
          f' · 흐림폭 {np.median([r[3] for r in 묶]):4.0f}px'
          f' · 접지그림자 {np.median([r[4] for r in 묶]):4.0f}px')
