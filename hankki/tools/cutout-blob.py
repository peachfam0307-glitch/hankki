"""
깨끗한 blob 컷 — 그리드 무관, 각 스티커의 진짜 경계+여백으로 잘라 '바닥 잘림' 원천 차단.
1) 테두리에서 흰 배경만 플러드필로 제거(안쪽 흰색=모자·접시는 외곽선이 막아 보존)
2) 남은 불투명 영역을 dilation으로 (아이템+반짝이·하트) 묶어 라벨링
3) 큰 덩어리만 bbox+여백으로 크롭 → 투명 PNG
"""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage

def cut(sheet, outdir, prefix, dilation=14, pad=10, min_area_frac=0.004, white=236):
    os.makedirs(outdir, exist_ok=True)
    im = Image.open(sheet).convert('RGBA')
    a = np.array(im)
    H, W = a.shape[:2]
    rgb = a[:, :, :3].astype(np.int16)
    # near-white 마스크
    near_white = (rgb[:, :, 0] > white) & (rgb[:, :, 1] > white) & (rgb[:, :, 2] > white)
    # 흰색 영역 라벨 → 테두리에 닿는 라벨만 '배경'
    wl, wn = ndimage.label(near_white)
    border = set(wl[0, :]) | set(wl[-1, :]) | set(wl[:, 0]) | set(wl[:, -1])
    border.discard(0)
    bg = np.isin(wl, list(border))
    fg = ~bg  # 전경(아이템). 안쪽 흰색은 fg로 보존됨
    # 반짝이·하트까지 아이템에 묶기 — dilation 후 라벨
    struct = np.ones((3, 3), bool)
    grown = ndimage.binary_dilation(fg, struct, iterations=dilation)
    lab, n = ndimage.label(grown)
    min_area = int(H * W * min_area_frac)
    saved = []
    boxes = []
    idx = 0
    for i in range(1, n + 1):
        comp = lab == i
        # 이 그룹에 실제로 속한 전경 픽셀
        real = comp & fg
        area = int(real.sum())
        if area < min_area:
            continue
        ys, xs = np.where(real)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        # 여백 추가(캔버스 안에서)
        y0 = max(0, y0 - pad); x0 = max(0, x0 - pad)
        y1 = min(H, y1 + pad); x1 = min(W, x1 + pad)
        # 크롭 + 이 영역 배경 투명화
        crop = a[y0:y1, x0:x1].copy()
        # 크롭 내 배경(원래 bg였던 곳) 알파 0
        cbg = bg[y0:y1, x0:x1]
        crop[cbg, 3] = 0
        idx += 1
        key = f'{prefix}{idx:02d}'
        Image.fromarray(crop, 'RGBA').save(f'{outdir}/{key}.png')
        saved.append(key)
        boxes.append((x0, y0, x1, y1, key))
    return im.convert('RGB'), boxes, saved

if __name__ == '__main__':
    sheet, outdir, prefix = sys.argv[1], sys.argv[2], sys.argv[3]
    dil = int(sys.argv[4]) if len(sys.argv) > 4 else 14
    base, boxes, saved = cut(sheet, outdir, prefix, dilation=dil)
    print(f'{os.path.basename(sheet)} → {len(saved)}컷')
    # 검증 오버레이(어디를 어떻게 잘랐는지)
    from PIL import ImageDraw
    ov = base.copy(); d = ImageDraw.Draw(ov)
    for x0, y0, x1, y1, key in boxes:
        d.rectangle([x0, y0, x1, y1], outline=(220, 70, 70), width=3)
        d.text((x0 + 4, y0 + 2), key, fill=(200, 40, 40))
    ov.save(f'{outdir}/_overlay.png')
