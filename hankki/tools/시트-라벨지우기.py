# 🏷 시트에서 «라벨 글자 띠»만 찾아 흰색으로 덮는다 (자르기 전처리)
#
# 쓰는 법:  python3 tools/시트-라벨지우기.py <시트> <낼파일> [행수] [열수]
#           행수·열수를 주면 **칸(cell)마다 따로** 본다 ← 이게 정답이다(아래 사고 ③)
#
# ⛔⛔⛔ 2026-08-15 하루에 «세 번» 틀렸다. 세 번 다 «어디를 지울지»를 잘못 잡은 것이다.
#   ⑴ 딱 맞게 지웠더니 글자 가장자리가 남아 「소고기솥밥」의 **「솥」 한 글자**가 컷에 붙었다.
#   ⑵ 그래서 위아래로 34px 씩 넓혔더니 — 📮 창업자 *"소스 바닥잘렸어"*
#      **라벨은 그림 «아래»에 있으므로 «위»로 넓히면 그릇 바닥을 먹는다.** 20컷 중 10컷이 잘렸다.
#      🔢 실측 = 소스 컷 맨 아랫줄이 최대폭의 **54~58%**(둥근 그릇이면 10% 아래여야 한다)
#   ⑶ 위를 8px 로 줄여 바닥은 살렸는데 **「솥」 조각이 다시 붙었다.**
#      📮 창업자 *"수정할 거 다 끝난거야?"* 로 다시 재다가 찾았다.
#      🔢 격자 주기가 찍은 자리 **964~1008** ↔ 진짜 글자 **924~977** = 위쪽 40px 이 안 지워졌다.
#      ⭐⭐ **옛 34px 이 «두 일»을 하고 있었다** — 글자 가장자리 덮기 ＋ 이 40px 어긋남 메우기.
#         그래서 하나(바닥)를 고치면 다른 하나(조각)가 터진다. **값 하나로 두 문제를 덮지 말 것.**
#
# ⛔ 「가로 뻗침이 넓으면 글자 줄」도 시도했다가 틀렸다 —
#    한 줄에 그림이 셋 나란히 있으면 **그림 줄도 시트 폭을 가로지른다**(시트01 y874 가 그랬다).
#
# ✅✅ 그래서 지금 규칙 = **칸마다 따로 본다.**
#    한 칸 안에서는 접시와 글자 사이에 «흰 틈»이 반드시 있다(그 칸엔 딴 그림이 없으니까).
#    → 이미 검증된 원래 규칙(빈 줄로 끊어 얇은 띠를 찾기)을 **칸 단위로** 그대로 쓴다.
#    📌 새 잣대를 발명하지 않았다. **보는 «범위»만 좁혔다.**
#
# 🔎 얇은 띠 판정 — 글자 띠는 «얇다». 행마다 어두운 픽셀 수를 세면
#    그림 영역은 두껍고(수백 px) 글자 띠는 40~60px 높이의 낮은 봉우리다.
import sys
import numpy as np
from PIL import Image

UP, DOWN = 8, 40
# ⭐ 위 8 · 아래 40 — **위로 넓히면 그릇 바닥이 잘린다**(사고 ⑵).
#    이제 «자리»를 칸마다 정확히 찾으므로 여유로 메울 일이 없다 → 위는 작게 유지한다.

MINH = 14          # 이보다 얇은 띠는 «글자가 아니다» — 그림 아래 티끌이다
MAXH = 90          # 이보다 두꺼운 띠는 그림
MAXINK = 0.42      # 이보다 꽉 찬 띠는 그림
# ⛔⛔ [2026-08-24] 0.30 이었는데 **긴 이름이 그 문턱을 넘었다.**
#    🔢 실측(갈비·찜닭 시트 1254×1254 · 2행3열) — 3열만 안 지워졌다:
#       라벨 띠 잉크 = 0.115 · 0.189 · **0.330** / 0.089 · 0.161 · **0.313**
#       그림 띠 잉크 = 0.571 ~ 0.588  (＋두께 343~346px 라 MAXH 90 에서 이미 걸린다)
#    ⭐ 「뼈없는 순살갈비조림」·「훈제오리 깻잎볶음」처럼 **글자가 길수록 띠가 빽빽해진다.**
#       짧은 이름으로만 시험해서 못 봤다 — 이름 길이가 잣대를 흔든다.
#    ✅ 0.42 = 라벨 최대 0.330 과 그림 최소 0.571 «사이»에 넉넉히 선다(위아래 여유 0.09 / 0.15).
#    ⛔ 더 올리지 말 것 — 그림 쪽 0.571 까지 0.15 밖에 안 남는다.
# ⛔ MINH 가 없으면 시트03 의 **2×2px 티끌**을 라벨로 보고 위 8px 을 지워
#    국수 그림 바닥을 7px 문다(실측: 그림이 y737 에서 끝나는데 y731 부터 지운다).
#    🔢 진짜 라벨 높이는 37~61px 이었다 — 14 는 그 아래로 한참 여유가 있다.

# ⭐⭐⭐ [절대원칙] 「배경이다」의 문턱은 «자르는 칼과 같아야» 한다.
#    지우개가 배경이라 여긴 것을 칼이 그림으로 여기면, **그 차이만큼 잘린다.**
#    📮 창업자 *"솥 아래 흰색 부분 잘렸어"* · *"미나리 볶음밥도 조금 잘렸어"* · *"바닥이 잘린거야 약간"*
#    🔢 시트01 칸(2,2) 실측 — 그릇이 «끝나는 줄»이 문턱마다 다르다:
#         <235 → y914   ｜   <250 → y920   ｜   <253 → y924
#       그릇의 **흰 테와 옅은 그림자**가 y915~920 에 있는데 <235 로 보면 «배경»이다.
#       그래서 「틈이 10px」이라 착각하고 위 8px 을 지워 **흰 테 4줄을 먹었다.**
#    ✅ 그래서 문턱을 «둘»로 가른다 — 하는 일이 다르기 때문이다:
BG_MAX = 250       # 여기까지가 «그림»이다 — 띠의 «경계»를 잡을 때(칼과 같은 눈)
INK_MAX = 235      # 여기까지가 «잉크»다 — 「글자냐 그림이냐」 진하기를 잴 때
# ⛔ 하나로 합치지 말 것. 250 으로 진하기를 재면 옅은 그림자까지 세어 글자가 그림으로 보인다.


def bands_of(mask):
    """빈 줄로 끊어 «띠»(y0, y1) 목록을 만든다."""
    h, w = mask.shape
    empty = mask.sum(axis=1) < max(1, w * 0.002)
    out, s = [], None
    for y in range(h):
        if not empty[y] and s is None:
            s = y
        elif empty[y] and s is not None:
            out.append((s, y - 1)); s = None
    if s is not None:
        out.append((s, h - 1))
    return out


src, dst = sys.argv[1], sys.argv[2]
rowsN = int(sys.argv[3]) if len(sys.argv) > 3 else 1
colsN = int(sys.argv[4]) if len(sys.argv) > 4 else 1

im = Image.open(src).convert('RGB')
a = np.asarray(im).astype(np.int16)
H, W = a.shape[:2]
art = (a.max(axis=2) < BG_MAX)          # «그림»이다 — 흰 테·옅은 그림자까지 (칼과 같은 눈)
ink = (a.max(axis=2) < INK_MAX)         # «잉크»다 — 진하기를 잴 때만 쓴다

killed = 0
keep = []          # 「그림」이라고 판정한 띠 — 여기 픽셀은 «한 개도» 지우면 안 된다
rstep, cstep = H // rowsN, W // colsN
for r in range(rowsN):
    for c in range(colsN):
        y0c, y1c = r * rstep, (H if r == rowsN - 1 else (r + 1) * rstep)
        x0c, x1c = c * cstep, (W if c == colsN - 1 else (c + 1) * cstep)
        cink = ink[y0c:y1c, x0c:x1c]        # 라벨 «찾기»는 잉크 눈으로 (흰 테는 안 보인다 = 글자만 남는다)
        cart = art[y0c:y1c, x0c:x1c]        # 지울 «자리»는 그림 눈으로 (흰 테·그림자가 보인다)
        artrow = cart.sum(axis=1)           # 줄마다 «그림» 픽셀 수
        bs = bands_of(cink)
        labels = [i for i, (s, e) in enumerate(bs)
                  if MINH <= (e - s + 1) <= MAXH and cink[s:e + 1].mean() <= MAXINK]
        pic_max = max([artrow[s:e + 1].max() for i, (s, e) in enumerate(bs) if i not in labels] or [1])
        for i in labels:
            s, e = bs[i]
            # ⭐⭐⭐ [절대원칙] 여유(UP) «안»에서 «그림이 가장 옅어지는 줄»부터 지운다.
            #    ⛔ 고정 여유를 그대로 빼면 그림을 먹는다(2026-08-15 에 세 번).
            #    ⛔ 「틈」으로만 깎아도 모자란다 — 그릇의 «옅은 그림자»는 잉크로는 안 보여서
            #       틈이 넓어 «보이지만» 실제로는 그림이 이어져 있다(솥밥 = 그림자가 y932 까지).
            #    ✅ 그래서 그림 픽셀이 «가장 적은» 줄을 골라 거기서부터 지운다.
            lo = max(0, s - UP)
            if i > 0:
                lo = max(lo, bs[i - 1][1] + 1)
            win = artrow[lo:s + 1]
            top = lo + int(len(win) - 1 - np.argmin(win[::-1]))   # 같으면 «아래쪽»(안전한 쪽)
            gap_dn = (bs[i + 1][0] - e - 1) if i + 1 < len(bs) else (y1c - y0c - 1 - e)
            dn = min(DOWN, max(0, gap_dn))
            keep.append((y0c, y0c + top - 1, x0c, x1c))           # 여기 위는 «한 픽셀도» 못 지운다
            a[y0c + top:y0c + e + 1 + dn, x0c:x1c] = 255
            killed += 1
            note = ''
            if top < s:
                note += f' (글자 위 {s - top}px 부터 · 그 줄 그림 {int(artrow[top])}px)'
            if dn < DOWN:
                note += f' ⚠️아래 여유 {DOWN}→{dn}'
            if artrow[top] > pic_max * 0.40:
                note += f' ⛔그림이 진하다({int(artrow[top])}/{int(pic_max)})'
            print(f'   🏷 칸({r+1},{c+1}) 라벨 {y0c+s}~{y0c+e} → 지움 {y0c+top}~{y0c+e+dn}{note}')

# ── 🔒 스스로 검사 — 「그림은 한 픽셀도 안 지웠나」 ──
#    ⛔ 규칙을 주석에 적어두는 것으로는 «세 번» 못 막았다. 도구가 자기 결과를 재게 한다.
after = (a.max(axis=2) < BG_MAX)        # ⭐ 검사도 «그림» 눈으로 — 흰 테를 먹은 것도 잡히게
lost = 0
for (ys, ye, xs_, xe_) in keep:
    b = art[ys:ye + 1, xs_:xe_].sum()
    n = after[ys:ye + 1, xs_:xe_].sum()
    if n < b:
        lost += b - n
        print(f'   ⛔ 그림 띠 y {ys}~{ye} x {xs_}~{xe_} 에서 {b - n}px 을 지웠다')
if lost:
    sys.exit(f'⛔⛔ 그림을 {lost}px 먹었다 — 저장하지 않는다.\n'
             '   여유(UP/DOWN)가 틈보다 크다. 위 clamp 가 왜 안 먹었는지 볼 것.')

Image.fromarray(a.astype(np.uint8)).save(dst)
print(f'✅ {src.split("/")[-1]} — 라벨 {killed}개 지움  ({rowsN}행 × {colsN}열) · 그림 손실 0px')
