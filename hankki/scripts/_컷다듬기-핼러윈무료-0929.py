# 🎃 [2026-09-29] 핼러윈 무료로 푼 16컷 — 그림은 그대로 두고 «여백 12px ＋ 가장자리 1px 부드럽게»만 한다.
#    왜 = 유료팩에 잠겨 있을 땐 check-cutouts 가 안 봤다. 무료 서랍에 오르자 「가장자리 닿음·계단 테두리」로 걸렸다.
#    원본은 docs/stickers/신규-2607-핼러윈유료팩/낱개-* 에 그대로 있다(여기서 읽어 app 폴더에 쓴다 — 두 번 돌려도 같다).
import glob
from PIL import Image, ImageFilter
KEYS = 'hp_04 hp_07 hp_12 hp_14 hp_15 hp_18 hs_02 hs_06 hs_08 hs_09 hs_10 hs_11 ht_01 ht_02 ht_05 ht_06'.split()
PAD = 12
for k in KEYS:
    src = glob.glob(f'docs/stickers/신규-2607-핼러윈유료팩/낱개-*/{k}.png')[0]
    im = Image.open(src).convert('RGBA')
    c = Image.new('RGBA', (im.width + PAD * 2, im.height + PAD * 2), (0, 0, 0, 0))
    c.paste(im, (PAD, PAD))
    r, g, b, a = c.split()
    a = a.filter(ImageFilter.GaussianBlur(0.8))
    Image.merge('RGBA', (r, g, b, a)).save(f'src/assets/stickers/photo/{k}.png', optimize=True)
    print(k, im.size, '→', c.size)
