import sys
from PIL import Image
import numpy as np
from scipy import ndimage

src, dst, quad = sys.argv[1], sys.argv[2], sys.argv[3]  # tl,tr,bl,br
img = Image.open(src).convert('RGBA')
W, Hh = img.size
mx, my = W // 2, Hh // 2
boxes = {'tl': (0, 0, mx + 20, my + 20), 'tr': (mx - 20, 0, W, my + 20),
         'bl': (0, my - 20, mx + 20, Hh), 'br': (mx - 20, my - 20, W, Hh)}
img = img.crop(boxes[quad])
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
