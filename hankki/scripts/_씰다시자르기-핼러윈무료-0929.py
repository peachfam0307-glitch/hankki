# 🎃 [2026-09-29] 핼러윈 무료 씰 6컷을 원본 시트에서 «다시» 자른다 — 창업자 「호박은 왜 별모양이 잘렸어?」
#    뿌리 = 8/3 컷이 그림(진한 곳)만 좁게 잡아 «필름 안의 별»이 잘렸다. 시트엔 별이 다 있다.
#    방법 = 시트에 그려진 «필름 외곽선»(배경 253~254 보다 살짝 어두운 선 · mn<249)을 따라 닫고 속을 채운다 →
#          필름 모양 그대로 · 안의 별도 다 들어온다. (1차로 closing＋dilation 을 했더니 필름이 부풀고 칸 끝에서 잘렸다 — 버렸다)
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
D = 'docs/stickers/신규-2607-핼러윈유료팩/원본시트/'
# ⚠️ 호박(hs_02)은 외곽선이 군데군데 끊겨 속이 덜 찼다(필름에 구멍) → 그 컷만 이음 폭을 키운다(CLOSE)
CLOSE = {'hs_02': 15}
JOBS = [('hs_02', '핼러윈-2-띠부씰', (0, 1)), ('hs_06', '핼러윈-2-띠부씰', (1, 0)),
        ('hs_10', '핼러윈-6-띠부씰', (0, 0)), ('hs_09', '핼러윈-6-띠부씰', (0, 1)),
        ('hs_11', '핼러윈-6-띠부씰', (1, 0)), ('hs_08', '핼러윈-6-띠부씰', (1, 2))]
PAD = 12
for key, sheet, (r, c) in JOBS:
    im = np.array(Image.open(D + sheet + '.png').convert('RGB'))
    H, W = im.shape[:2]
    cell = im[r * H // 2:(r + 1) * H // 2, c * W // 3:(c + 1) * W // 3]
    m = ndimage.binary_fill_holes(ndimage.binary_closing(cell.min(axis=2) < 249, np.ones((CLOSE.get(key, 5),) * 2)))
    lab, n = ndimage.label(m)
    body = lab == (np.argmax(ndimage.sum(m, lab, range(1, n + 1))) + 1)
    body = ndimage.binary_opening(body, np.ones((3, 3)))
    ys, xs = np.where(body)
    edge = (xs.min(), ys.min(), cell.shape[1] - 1 - xs.max(), cell.shape[0] - 1 - ys.max())
    a = Image.fromarray((body * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.9))
    out = Image.fromarray(cell).convert('RGBA'); out.putalpha(a)
    out = out.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    c2 = Image.new('RGBA', (out.width + PAD * 2, out.height + PAD * 2), (0, 0, 0, 0)); c2.paste(out, (PAD, PAD))
    c2.save(f'src/assets/stickers/photo/{key}.png', optimize=True)
    print(key, c2.size, '칸 끝까지 여유(좌·상·우·하)', edge)
