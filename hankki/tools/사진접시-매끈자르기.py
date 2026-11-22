# 접시 사진 → 매끈한 외곽 + 고른 흰 테 (뜯긴 듯한 테두리 고침 · 2026-11-22)
#   ① 바깥과 이어진 «밝고 무채색»인 칸 = 배경(그림자 포함) → 나머지 = 접시
#   ② 구멍 메우기 · 가는 털 떼기 · 흐림+문턱으로 외곽을 매끈하게
#   ③ 둥근 도장으로 일정 두께 흰 테 → 살짝 흐려 계단 없애기
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

def 원(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return x * x + y * y <= r * r

def 자르기(src, dst, 폭=620, 테=0.007, 밝기=246, 채도=10, 열기=7, 흐림=7):
    im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(np.int16)
    mx, mn = a.max(2), a.min(2)
    배경후보 = (mn >= 밝기) & ((mx - mn) <= 채도)
    lab, n = ndimage.label(배경후보)
    테두리 = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    배경 = np.isin(lab, list(테두리))
    몸 = ~배경
    몸 = ndimage.binary_fill_holes(몸)
    몸 = ndimage.binary_opening(몸, structure=원(열기))          # 그림자 털·가는 조각 떼기
    lab2, n2 = ndimage.label(몸)
    if n2 == 0: raise SystemExit('⛔ 몸통 없음')
    크기 = ndimage.sum(몸, lab2, range(1, n2 + 1)); 몸 = lab2 == (int(np.argmax(크기)) + 1)
    몸 = ndimage.gaussian_filter(몸.astype(float), 흐림) > 0.5   # 외곽 매끈하게
    몸 = ndimage.binary_fill_holes(몸)
    ys, xs = np.where(몸); h, w = ys.max() - ys.min() + 1, xs.max() - xs.min() + 1
    r = max(3, round(max(h, w) * 테))
    밖 = ndimage.binary_dilation(몸, structure=원(r))
    알파 = np.clip(ndimage.gaussian_filter(밖.astype(float), 1.0) * 255, 0, 255).astype(np.uint8)
    rgb = a.astype(np.uint8).copy(); rgb[밖 & ~몸] = 255                 # 흰 테
    out = np.dstack([rgb, 알파])
    y0, y1, x0, x1 = max(0, ys.min() - r - 3), min(a.shape[0], ys.max() + r + 4), max(0, xs.min() - r - 3), min(a.shape[1], xs.max() + r + 4)
    o = Image.fromarray(out[y0:y1, x0:x1], 'RGBA')
    if o.width > 폭: o = o.resize((폭, round(o.height * 폭 / o.width)), Image.LANCZOS)
    o.save(dst); print('✅', dst, o.size, '테', r)

if __name__ == '__main__':
    자르기(sys.argv[1], sys.argv[2])
