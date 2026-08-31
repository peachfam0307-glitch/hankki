# 🍲 시트26(창업자 2026-08-27) 6컷을 «다시» 자른다 — 냄비 손잡이가 뜯겼다
#
# 📮 창업자 = *"냄비손잡이 부분잘렸어. 냄비들 테두리 매끈하게잘라줘"*
#
# ⛔⛔ **어제 내가 «낡은 핀»을 보고 잘랐다.**
#    CLAUDE.md 「자를 때」 핀 = *"흰 그릇 사진 시트는 `--drop 0.001` 을 «반드시» 준다"*(2026-08-24)
#    그런데 **2026-08-26 에 그 `--drop` 자체가 뿌리로 밝혀졌다**
#    (`docs/그릇프레임-만드는법-2026-08-23.md` 7️⃣ ⭐현행):
#
#      cut.py:196   piece = reg & (sub.min(axis=2) < WHITE - 10)    ← 236
#      `--drop` 이 조각을 «하나라도» 버리면 그 아래에서 실루엣을 이 236 문턱으로 «다시 짠다».
#      흰 냄비의 바깥테·손잡이가 237~249 라 그 문턱을 넘어 → 점점이로 흩어지고 → 통째로 깎인다.
#
#    📌 핀이 낡아서 사고가 났다. **핀도 같이 고친다**(규칙 12 ⓑ).
#
# ✅ 현행 차림표 = ①둘레 빛무리 지우기 ②`--diecut auto --drop 0` ③손잡이가 끊기면 `--join`
#    ⛔ `tools/칸-접시테두리-그리기.py`(길잡이 선)는 «안 쓴다» — 흰 테가 레이스처럼 물결친다
#       (창업자 2026-08-26 *"더망했ㄴㆍㅋ"*)
#    ⛔ `tools/cut.py` 는 손대지 않는다(창업자 절대원칙 2026-08-18)
#
# ⛔⛔ **게이트 = 「손잡이를 먹었나」를 «원본»과 견준다.**
#    2026-08-26 교훈 그대로 — 「꺾임」만 재면 접시를 13% 먹고도 초록불이 나온다(규칙 18 ⓘ).
#    여기선 배포판이 없으니(아직 앱에 안 넣었다) **원본 시트의 몸통 덩어리**를 잣대로 쓴다.
#
# 쓰기: cd /home/user/hankki/hankki && python3 scripts/_다시자르기-시트26-0827.py
import glob
import os
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
뿌리 = f'{APP}/docs/stickers/음식-창업자-2026-08-27'
라벨지움 = f'{뿌리}/시트26-라벨지움.png'
낼곳 = f'{뿌리}/낱개'
옛곳 = f'{뿌리}/_옛컷-0826판'
행, 열 = 2, 3
작업 = '/tmp/시트26-0827'


def 몸통(칸):
    """cut.py 와 «같은 눈»(<246 덩어리)으로 몸통을 잡는다 — 잣대가 다르면 견줄 수가 없다."""
    k = np.asarray(칸.convert('RGB')).min(axis=2)
    f = ndimage.binary_fill_holes(ndimage.binary_closing(k < 246, np.ones((5, 5))))
    lab, n = ndimage.label(f)
    if not n:
        return None
    m = lab == int(np.argmax(ndimage.sum(f, lab, range(1, n + 1)))) + 1
    return m


def 자(마스크):
    ys, xs = np.where(마스크)
    return xs.max() - xs.min() + 1, ys.max() - ys.min() + 1, int(마스크.sum())


def 잉크잃음(칸, 컷길):
    """⭐⭐ 잣대는 «잉크»다 — bbox 도 넓이도 이걸 못 잡는다(2026-08-27 에 세 번 헛돌았다).

    ⛔ bbox = 손잡이가 파여도 «끝점»만 남으면 안 변한다
    ⛔ 넓이(fill_holes) = 흰 테가 손잡이 구멍까지 메워 «늘 100%»가 나온다
    ⛔ 「어두운 픽셀(<200) 보존율」 = 버섯·새우 그림자가 9만 px 이라 얇은 선 300px 이 묻힌다
    ✅ 「원본 잉크 중 컷에 없는 것」 = 손잡이 «바깥 진갈색 선»이 그대로 드러난다
       (n2604 어제 판 272px · 새 판 4px — **그 272px 이 창업자가 본 「잘린 손잡이」다**)
    """
    om = 몸통(칸)
    oi = (np.asarray(칸.convert('RGB')).min(axis=2) < 246) & om
    cu = np.asarray(Image.open(컷길).convert('RGBA'))
    ci = (cu[:, :, 3] > 0) & (cu[:, :, :3].min(axis=2) < 246)
    if not ci.any():
        return 10 ** 9, 10 ** 9, int(oi.sum())
    oy, ox = np.where(oi)
    cy, cx = np.where(ci)
    dy, dx = int(round(oy.mean() - cy.mean())), int(round(ox.mean() - cx.mean()))
    옮김 = np.zeros_like(oi)
    ys, xs = cy + dy, cx + dx
    ok = (ys >= 0) & (ys < oi.shape[0]) & (xs >= 0) & (xs < oi.shape[1])
    옮김[ys[ok], xs[ok]] = True
    잃 = oi & ~ndimage.binary_dilation(옮김, np.ones((3, 3)))
    lab, n = ndimage.label(잃)
    큰 = int(ndimage.sum(잃, lab, range(1, n + 1)).max()) if n else 0
    return int(잃.sum()), 큰, int(oi.sum())


# ── 원본 칸마다 「진짜 크기」를 먼저 잰다 ─────────────────────────────
S = Image.open(라벨지움).convert('RGB')
W, H = S.size
원본 = {}
for r in range(행):
    for c in range(열):
        i = r * 열 + c + 1
        칸 = S.crop((c * W // 열, r * H // 행, (c + 1) * W // 열, (r + 1) * H // 행))
        m = 몸통(칸)
        if m is None:
            continue
        원본[f'n26{i:02d}'] = 자(m)

print('📏 원본 몸통 (라벨 지운 시트 · <246 덩어리)')
for k in sorted(원본):
    w, h, a = 원본[k]
    print(f'   {k}  {w}×{h}  넓이 {a:,}px')


# ⛔⛔ 문턱을 「덩어리」로 잡으면 «또» 아무것도 안 잡힌다 — 실측으로 확인했다.
#    잃은 것이 **1~2px 굵기의 선**이라 3×3 관용에 잘게 부서져 최대 덩어리가 20px 밖에 안 된다.
#    🔢 어제 판 총 잃음 = n2604 **272px** · n2603 **102px** ／ 새 판 = 전부 **13px 이하**
#    ✅ 그래서 «총량»으로 본다. 50px = 「1px 선이 50px 길이만큼 사라졌다」 — 눈에 보이는 양이다.
잃음한계 = 50


def 견주기(제목, 폴더):
    print(f'\n🔍 {제목}')
    먹힘 = []
    for i in range(1, 행 * 열 + 1):
        k = f'n26{i:02d}'
        r, c = divmod(i - 1, 열)
        칸 = S.crop((c * W // 열, r * H // 행, (c + 1) * W // 열, (r + 1) * H // 행))
        p = f'{폴더}/{k}.png'
        if not os.path.exists(p):
            print(f'   ⛔ {k} — 컷이 없다')
            먹힘.append(k)
            continue
        잃, 큰, 원 = 잉크잃음(칸, p)
        나쁨 = 잃 >= 잃음한계
        print(f'   {"⛔" if 나쁨 else "✅"} {k}  원본잉크 {원:>7,}px   잃음 {잃:>5,}px ({잃 / 원:.2%})   최대덩어리 {큰:>4}px')
        if 나쁨:
            먹힘.append(k)
    return 먹힘


옛있음 = all(os.path.exists(f'{낼곳}/{k}.png') for k in 원본)

# 🧪 규칙 12 — 「이 잣대가 «어제 판»을 진짜로 잡나」를 언제든 다시 돌려 본다
if '--재보기' in sys.argv:
    if os.path.isdir(옛곳):
        나쁨 = 견주기('어제 판(--drop 0.001 · --diecut 5) — ⛔여기서 걸려야 잣대가 산 것이다', 옛곳)
        print(f'   → {"⛔ 잡았다: " + " ".join(나쁨) if 나쁨 else "⚠️ 하나도 안 잡혔다 — 잣대가 아무것도 안 재고 있다"}')
    if 옛있음:
        나쁨 = 견주기('지금 판(--drop 0 · --diecut auto) — ✅여기선 다 통과해야 한다', 낼곳)
        print(f'   → {"⛔ " + " ".join(나쁨) if 나쁨 else "✅ 여섯 컷 모두 통과"}')
    sys.exit(0)

if 옛있음:
    견주기('지금 낱개에 있는 컷', 낼곳)

# ── 다시 자른다 ────────────────────────────────────────────────────
shutil.rmtree(작업, ignore_errors=True)
os.makedirs(작업, exist_ok=True)
깨끗 = f'{작업}/시트26-깨끗.png'
p = subprocess.run(['python3', f'{APP}/tools/시트-둘레-지우기.py', 라벨지움, 깨끗, str(행), str(열)],
                   capture_output=True, text=True)
print(f'\n🧽 둘레 빛무리 지우기 — {"성공" if p.returncode == 0 else "실패"}')
print('   ' + '\n   '.join((p.stdout or p.stderr).strip().splitlines()[-6:]))
if p.returncode:
    sys.exit(1)

# ⭐ 손잡이가 몸통과 «가늘게» 이어져 끊기면 --join 으로 잇는다 (2026-08-26 돌솥과 같은 자리)
후보 = [[], ['--join', '5'], ['--join', '9']]
난것, 쓴것 = 0, None
for 옵션 in 후보:
    낼 = f'{작업}/컷{len(옵션)}'
    shutil.rmtree(낼, ignore_errors=True)
    명 = ['python3', f'{APP}/tools/cut.py', 깨끗, 낼, 'n26', '--diecut', 'auto', '--drop', '0'] + 옵션
    q = subprocess.run(명, capture_output=True, text=True)
    난 = sorted(glob.glob(f'{낼}/*.png'))
    print(f'\n✂️ cut.py --diecut auto --drop 0 {" ".join(옵션)}  →  {len(난)}컷 (rc={q.returncode})')
    if q.returncode or len(난) != 행 * 열:
        꼬리 = [ln for ln in (q.stdout + q.stderr).splitlines() if '🚫' in ln or '⛔' in ln][:3]
        for ln in 꼬리:
            print(f'   {ln}')
        continue
    난것, 쓴것 = len(난), (낼, 옵션)
    break

if not 쓴것:
    print('\n⛔ 여섯 컷을 못 냈다 — 원인을 보고 다음 수를 정한다')
    sys.exit(1)

낼, 옵션 = 쓴것
# cut.py 는 접두어＋번호로 낸다 → n2601~n2606 이름으로 맞춘다
난 = sorted(glob.glob(f'{낼}/*.png'))
for i, f in enumerate(난, 1):
    os.rename(f, f'{낼}/n26{i:02d}.png')

먹힘 = 견주기(f'새 판(--drop 0 --diecut auto {" ".join(옵션)})', 낼)
if 먹힘:
    print(f'\n⛔ 선이 통째로 사라진 컷 {len(먹힘)}개 — {" ".join(먹힘)}. 저장하지 않는다')
    sys.exit(1)

# ── 옛 컷을 «지우지 않고» 옮겨 두고, 새 컷을 앉힌다 ───────────────────
if 옛있음:
    os.makedirs(옛곳, exist_ok=True)
    for k in sorted(원본):
        shutil.move(f'{낼곳}/{k}.png', f'{옛곳}/{k}.png')
    print(f'\n🗄 어제 컷은 {os.path.relpath(옛곳, APP)} 로 옮겼다 (⛔지우지 않는다)')
for k in sorted(원본):
    shutil.copy(f'{낼}/{k}.png', f'{낼곳}/{k}.png')
print(f'✅ 새 컷 6장을 {os.path.relpath(낼곳, APP)} 에 앉혔다')
