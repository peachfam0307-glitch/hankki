import sys
from PIL import Image
import numpy as np
from scipy import ndimage

src, dst = sys.argv[1], sys.argv[2]
img = Image.open(src).convert('RGBA')
arr = np.array(img)
rgb = arr[:, :, :3].astype(int)
# near-white background
white = (rgb[:, :, 0] > 236) & (rgb[:, :, 1] > 236) & (rgb[:, :, 2] > 236)
lbl, n = ndimage.label(white)
border = set(lbl[0, :]) | set(lbl[-1, :]) | set(lbl[:, 0]) | set(lbl[:, -1])
border.discard(0)
bg = np.isin(lbl, list(border))
# feather: soften 1px halo by also clearing near-white pixels adjacent to bg
arr[bg, 3] = 0
# crop to content
ys, xs = np.where(arr[:, :, 3] > 0)
out = arr[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
Image.fromarray(out).save(dst)
print('saved', dst, 'size', out.shape[1], 'x', out.shape[0])
