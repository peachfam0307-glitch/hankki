# 🍽 「그릇」 시트 108컷을 «가위로 자른 것처럼» 다시 자른다 (2026-08-26 · 2판)
#
# 📮 창업자 = *"가위로 자른 것 같지않고 표면이 찢은것 같아보이는거는 고칠수 없는거야?"*
#            · *"바닥면쪽이 대부분 손으로 찢은거같아"* · *"원본으로 다시잘라 이렇게 땜빵하지말구."*
#            · *"다 네가 하란대로 추가해서 넣었는데 왜 매끈하지가 않은거야? 이름표를 뺄까?"*
#
# ⭐⭐ **창업자 프롬프트는 잘못이 없다. 이름표도 문제가 아니다. 자르는 쪽 문제였다.**
#
# ⛔⛔ 뿌리(실측 · 계란찜 칸 가운데 세로 단면)
#     … 194 203 138 **54** ← 진갈색 외곽선(＝접시 끝)
#     그 아래 → **244 · 248 · 246 · 250** · 253 · 254 …
#     ⭐ `cut.py` 의 배경 문턱이 **246** 이라 접시 바로 밑 네댓 줄이 **문턱을 걸친다.**
#     → 실루엣이 줄마다 1~2px 흔들리고, **흰 테는 그걸 «부풀려» 만들기 때문에 계단**이 된다.
#
# ✅ 그래서 자르기 «전»에 **둘레의 흐린 얼룩을 순백으로 지운다** → 경계가 또렷해져 칼이 매끈하게 지난다.
#    🔢 계란찜 실측 = 아래띠 «꺾임» 0.96 → **0.62** (−35%) · 눈으로도 계단이 사라졌다.
#
# ⛔ 지난 판(1판)에서 지운 것 = 「자른 뒤 알파를 다듬기」. 창업자 = *"땜빵하지말구"*. 맞는 말이라 뺐다.
# ⛔ `tools/cut.py` 는 손대지 않는다(창업자 절대원칙 2026-08-18).
# ⛔ 시트를 «칸으로 쪼개» 자르지 않는다 — 접시가 칸 경계를 넘어 오른쪽 위가 계단으로 잘린다.
import os, sys, glob, shutil, subprocess

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
뿌리 = f'{APP}/docs/stickers/음식-창업자-2026-08-26'
시트들 = sorted(glob.glob(f'{뿌리}/라벨지움/*.png'))
낼곳 = f'{뿌리}/낱개'
행, 열 = 2, 3
작업 = '/tmp/그릇-둘레지움-0826'
shutil.rmtree(작업, ignore_errors=True); os.makedirs(작업, exist_ok=True)

# ⚠️ 시트마다 따로 손봐야 하는 것 — «한 값을 전부에 밀어붙이지 않는다»(2026-08-24 교훈)
굽누르기 = {'c503251f', 'cfc1c5dd'}   # 접시테가 점점이로 흩어져 「떨어진 조각」에 걸린다
붙이기 = {'91108890': '9'}            # 돌솥 손잡이가 본체와 끊긴다 → --join 으로 잇는다

def 칸으로(시트, 낼폴더, 접두어, 조인):
    """시트 통째로 못 자를 때 «칸마다» 자른다. ⛔그림이 칸 가장자리에 닿으면 안 한다(잘린다)."""
    import numpy as np
    from PIL import Image
    from scipy import ndimage
    im = Image.open(시트).convert('RGB'); W, H = im.size
    임시 = f'/tmp/칸-{접두어}'
    shutil.rmtree(임시, ignore_errors=True); os.makedirs(임시, exist_ok=True)
    난것 = 0
    for r in range(행):
        for c in range(열):
            i = r * 열 + c + 1
            칸 = im.crop((c * W // 열, r * H // 행, (c + 1) * W // 열, (r + 1) * H // 행))
            k = np.asarray(칸).min(axis=2); h, w = k.shape
            f = ndimage.binary_fill_holes(ndimage.binary_closing(k < 250, np.ones((7, 7))))
            lab, n = ndimage.label(f)
            if not n:
                continue
            m = lab == int(np.argmax(ndimage.sum(f, lab, range(1, n + 1)))) + 1
            ys, xs = np.where(m)
            if xs.min() <= 1 or xs.max() >= w - 2 or ys.min() <= 1 or ys.max() >= h - 2:
                print(f'   ⛔ {접두어} {i}칸 — 그림이 칸 가장자리에 닿는다. 칸으로 자르면 잘린다')
                return -1
            칸길 = f'{임시}/{i:02d}.png'; 칸.save(칸길)
            낼 = f'{임시}/out{i:02d}'
            명 = ['python3', f'{APP}/tools/cut.py', 칸길, 낼, f'{접두어}{i:02d}',
                  '--diecut', 'auto', '--drop', '0'] + (['--join', 조인] if 조인 else [])
            subprocess.run(명, capture_output=True, text=True)
            난 = sorted(glob.glob(f'{낼}/*.png'))
            if not 난:
                continue
            shutil.copy(난[0], f'{낼폴더}/{접두어}{i:02d}.png'); 난것 += 1
    return 난것


죽음 = 0
for 시트 in 시트들:
    이름 = os.path.splitext(os.path.basename(시트))[0]
    깨끗 = f'{작업}/{이름}.png'
    p = subprocess.run(['python3', f'{APP}/tools/시트-둘레-지우기.py', 시트, 깨끗, str(행), str(열)],
                       capture_output=True, text=True)
    if p.returncode:
        print(f'⛔ {이름} 둘레 지우기 실패\n{p.stderr[-400:]}'); 죽음 += 1; continue
    if 이름 in 굽누르기:
        q = subprocess.run(['python3', f'{APP}/tools/시트-접시굽-눌러주기.py', 깨끗, 깨끗,
                            str(행), str(열), '0.30'], capture_output=True, text=True)
        if q.returncode:
            print(f'⛔ {이름} 굽 누르기 실패'); 죽음 += 1; continue

    낼폴더 = f'{낼곳}/{이름}'
    shutil.rmtree(낼폴더, ignore_errors=True)
    명 = ['python3', f'{APP}/tools/cut.py', 깨끗, 낼폴더, 이름, '--diecut', 'auto', '--drop', '0']
    if 이름 in 붙이기:
        명 += ['--join', 붙이기[이름]]
    q = subprocess.run(명, capture_output=True, text=True)
    난것 = len(glob.glob(f'{낼폴더}/*.png'))
    if q.returncode or 난것 != 행 * 열:
        # ⭐ 시트 통째로 안 되면 «칸으로» 자른다 — 단 그 칸의 그림이 «칸 가장자리에 안 닿을 때만».
        #   ⛔ 닿는데 칸으로 자르면 오른쪽 위가 계단으로 잘린다(2026-08-26 실측).
        난것 = 칸으로(깨끗, 낼폴더, 이름, 붙이기.get(이름))
        if 난것 != 행 * 열:
            꼬리 = [ln for ln in (q.stdout + q.stderr).splitlines() if '🚫' in ln][:1]
            print(f'⛔ {이름} — {난것}/{행 * 열}컷 {" ".join(꼬리)}')
            죽음 += 1; continue
        print(f'✅ {이름} — {난것}컷 (칸으로 잘랐다)')
        continue
    print(f'✅ {이름} — {난것}컷')

print(f'\n{"✅ 18시트 전부 통과" if 죽음 == 0 else f"⛔ 실패 {죽음}건"}')
sys.exit(1 if 죽음 else 0)
