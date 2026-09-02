# 🔎 「굽 있는 접시는 어디를 잘라야 할지 모른다」 — 창업자 진단을 실측으로 확인한다 (2026-08-26)
#
# 📮 창업자 = *"왼쪽아래깨진것도 문제지만 매끈하게 안잘리는 것도 문제가
#            내 생각엔 네가 «굽있는 접시들 어디를 잘라야할지» 모르는 것 같아"*
#
# ⭐ 가설 = **접시 «바깥 실루엣»에 진갈색 선이 있으면 매끈하게 잘리고, 없으면 깨진다.**
#   창업자 프롬프트는 「가장 바깥 실루엣에만 진갈색 윤곽선」인데,
#   굽 있는 접시는 AI 가 **접시 «윗면 테두리»에만** 선을 그리고 옆면·굽엔 안 그린다.
#   그러면 자를 때 흰 접시 옆면이 흰 배경으로 서서히 사라져 **칼이 어디가 끝인지 모른다.**
#
# 🔬 재는 법 = 잘라낸 컷의 **알파 경계 안쪽 3px 띠**의 밝기.
#   선이 있으면 어둡고(<160), 없으면 밝다(>225). 컷 «전체»가 아니라 **아래 절반**만 본다
#   (굽은 아래에 있고, 위쪽은 음식이라 늘 어둡다 — 섞으면 판정이 흐려진다).
#
# ⛔ 이 판으로 «고치지» 않는다 — 창업자 진단이 맞는지 «확인»만 한다.
import json, os, sys

import numpy as np
from PIL import Image
from scipy import ndimage

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
뿌리 = f'{APP}/docs/stickers/음식-창업자-2026-08-26'
컷 = {c['key']: c for c in json.load(open(f'{뿌리}/컷목록.json'))}
판정 = json.load(open(sys.argv[1]))
깨 = set(판정['깨짐'])
애 = set(판정['애매'])


def 둘레밝기(길):
    """컷 «아래 절반»의 바깥 테두리 안쪽 3px 띠 밝기 — 진갈색 선이 있으면 낮다."""
    im = Image.open(길).convert('RGBA')
    a = np.array(im)
    알파 = a[..., 3] > 40
    if not 알파.any():
        return None
    속 = ndimage.binary_erosion(알파, np.ones((7, 7)))
    띠 = 알파 & ~속
    줄 = np.where(알파.any(axis=1))[0]
    반 = 줄[0] + (줄[-1] - 줄[0]) // 2
    아래띠 = np.zeros_like(띠)
    아래띠[반:] = 띠[반:]
    if 아래띠.sum() < 200:
        return None
    k = a[..., :3].min(axis=2)[아래띠]
    # ⭐ 중앙값이 아니라 «10퍼센타일» — 선은 띠의 «일부»만 차지한다.
    #   중앙값으로 보면 흰 접시가 대부분이라 선이 있어도 밝게 나온다(첫 판이 그래서 안 갈렸다).
    return float(np.percentile(k, 10))


값 = []
for k, c in 컷.items():
    길 = f'{APP}/{c["src"]}'
    if not os.path.exists(길):
        continue
    v = 둘레밝기(길)
    if v is None:
        continue
    표 = '깨짐' if k in 깨 else ('애매' if k in 애 else ('좋아' if (k in 판정.get('_본것', []) or True) else '?'))
    값.append((v, k, c['name'], '깨짐' if k in 깨 else ('애매' if k in 애 else '·')))

깨값 = [v for v, k, n, t in 값 if t == '깨짐']
좋값 = [v for v, k, n, t in 값 if t == '·']
print('📏 컷 «아래 절반» 바깥 테두리 안쪽 밝기 (10퍼센타일 · 낮을수록 진갈색 선이 뚜렷)')
print(f'   ⛔ 창업자 「깨짐」 {len(깨값):>3}컷 — 중앙값 {np.median(깨값):6.1f}')
print(f'   ✅ 그 밖의 컷    {len(좋값):>3}컷 — 중앙값 {np.median(좋값):6.1f}')
print()
값.sort()
print('   ── 선이 제일 뚜렷한 8컷 ──')
for v, k, n, t in 값[:8]:
    print(f'   {v:6.1f}  {k}  {n:<16} {t}')
print('   ── 선이 제일 흐린 8컷 ──')
for v, k, n, t in 값[-8:]:
    print(f'   {v:6.1f}  {k}  {n:<16} {t}')
