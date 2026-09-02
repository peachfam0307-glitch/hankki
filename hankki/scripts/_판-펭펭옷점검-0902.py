# 🐧🧥 **펭펭 카드 컷의 «옷»을 한 판에** — 창업자 판정 잣대 그대로 (2026-09-02)
#
# 📮 창업자 = *"연한베이지트렌치랑 트렌치에 벨트없는거."* · *"그건 얼굴도 펭펭이 조금 이상해 다 빼야해"*
#           · *"부족한거 다시뽑아줄게 그펭펭은 다 빼자"*
#
# ⭐ 잣대가 «취향»이 아니라 «체크리스트»가 됐다 → 기계가 색을 재고, 벨트·얼굴은 눈이 본다(절대원칙 21).
# ⛔ 색만으로 판정하지 않는다 — 벨트 유무는 색으로 안 잡힌다. 판은 «어디를 볼지»만 정한다.
#
# 쓰는 법:  python3 scripts/_판-펭펭옷점검-0902.py
import os
import numpy as np
from PIL import Image, ImageDraw

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'

# 🎴 카드 뽑기에 «실제로» 나오는 펭펭 = 사철(COOK 거름망 통과) ＋ 가을 세트
#    ⛔ 손으로 적은 목록이라 낡을 수 있다 — 바뀌면 `_probe-자랑카드-0901풀-0830.mjs` 로 다시 뽑을 것.
사철 = ['peng_nyam1', 'peng_nyam2', 'peng_nyam3', 'peng_nyam4', 'peng_shop',
        'pn_cake', 'pn_drink', 'pn_fruit', 'pn_icecream']
가을 = ['au_b07', 'au_b08', 'pj_01', 'pj_02', 'pj_03', 'pj_04']


def 경로(k):
    a = os.path.join(APP, 'src/assets/sharepool', k + '.png')
    b = os.path.join(APP, 'src/assets/stickers/photo', k + '.png')
    return a if os.path.exists(a) else b


def 코트색(p):
    """몸통 아래쪽의 «밝고 채도 낮은 큰 면» = 코트. R−B 가 클수록 베이지, 작을수록 흰색."""
    im = Image.open(p).convert('RGBA')
    a = np.array(im)
    rgb = a[..., :3].astype(int)
    al = a[..., 3]
    h, w, _ = rgb.shape
    ys = np.arange(h)[:, None] * np.ones((1, w), dtype=int)
    mx, mn = rgb.max(2), rgb.min(2)
    m = (al > 200) & (ys > h * 0.55) & (mx > 180) & ((mx - mn) < 70) & (mn > 140)
    if m.sum() < 50:
        return None
    r, g, b = rgb[..., 0][m].mean(), rgb[..., 1][m].mean(), rgb[..., 2][m].mean()
    return int(r), int(g), int(b), int(r - b), int(m.sum())


칸, 여백, 머리 = 300, 16, 46
줄 = [('사철 (카드에 늘 나온다)', 사철), ('가을 세트', 가을)]
열 = max(len(x[1]) for x in 줄)
W = 여백 + 열 * (칸 + 여백)
H = sum(머리 + 칸 + 56 + 여백 for _ in 줄) + 여백

판 = Image.new('RGB', (W, H), (250, 247, 240))
d = ImageDraw.Draw(판)
y = 여백
표 = []
for 제목, 키들 in 줄:
    d.text((여백, y + 12), 제목, fill=(60, 44, 32))
    y += 머리
    for i, k in enumerate(키들):
        x = 여백 + i * (칸 + 여백)
        p = 경로(k)
        im = Image.open(p).convert('RGBA')
        im.thumbnail((칸, 칸), Image.LANCZOS)
        바탕 = Image.new('RGBA', (칸, 칸), (255, 255, 255, 255))
        바탕.alpha_composite(im, ((칸 - im.width) // 2, (칸 - im.height) // 2))
        판.paste(바탕.convert('RGB'), (x, y))
        d.rectangle([x, y, x + 칸, y + 칸], outline=(210, 200, 188))
        c = 코트색(p)
        줄글 = f'{k}   R-B {c[3]}' if c else f'{k}   (코트 못 잼)'
        d.text((x + 4, y + 칸 + 8), 줄글, fill=(60, 44, 32))
        d.text((x + 4, y + 칸 + 26), f'RGB {c[0]},{c[1]},{c[2]}' if c else '', fill=(140, 125, 110))
        표.append((제목, k, c[3] if c else None))
    y += 칸 + 56 + 여백

os.makedirs(OUT, exist_ok=True)
길 = os.path.join(OUT, '펭펭옷점검-0902.png')
판.save(길)
print('📸', 길, 판.size)
print()
print('  R−B 가 «클수록» 진한 베이지 · «작을수록» 흰색에 가깝다')
for 제목, k, v in sorted(표, key=lambda t: (t[2] is None, t[2])):
    print(f'  {v if v is not None else "?":>4}  {k:<14} ({제목})')
