import sys
from PIL import Image
import numpy as np
from scipy import ndimage

src, dst, half = sys.argv[1], sys.argv[2], sys.argv[3]  # half = left/right
img = Image.open(src).convert('RGBA')
W, Hh = img.size
if half == 'left':
    img = img.crop((0, 0, W // 2 + 25, Hh))
else:
    img = img.crop((W // 2 - 25, 0, W, Hh))
arr = np.array(img)
rgb = arr[:, :, :3].astype(int)
white = (rgb[:, :, 0] > 236) & (rgb[:, :, 1] > 236) & (rgb[:, :, 2] > 236)
lbl, n = ndimage.label(white)
border = set(lbl[0, :]) | set(lbl[-1, :]) | set(lbl[:, 0]) | set(lbl[:, -1])
border.discard(0)
arr[np.isin(lbl, list(border)), 3] = 0
ys, xs = np.where(arr[:, :, 3] > 0)
out = arr[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
Image.fromarray(out).save(dst)
print('saved', dst, out.shape[1], 'x', out.shape[0])
