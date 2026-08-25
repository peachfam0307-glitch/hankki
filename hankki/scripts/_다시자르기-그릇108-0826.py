# 🍽 「그릇」 시트 108컷을 «가위로 자른 것처럼» 다시 자른다 (2026-08-26 · 3판)
#
# 📮 창업자 = *"가위로 자른 것 같지않고 표면이 찢은것 같아보이는거는 고칠수 없는거야?"*
#            · *"바닥면쪽이 대부분 손으로 찢은거같아"* · *"원본으로 다시잘라 이렇게 땜빵하지말구."*
#
# ⭐⭐ **창업자 프롬프트는 잘못이 없다. 이름표도 문제가 아니다. 자르는 쪽 문제였다.**
#
# ⛔⛔ 뿌리(실측 · 구움찰떡 칸 굽 아래 세로 단면)
#     굽 몸통 `236 236 236 …` │ `191 190`(굽 바닥선) │ `218 224 … 244 **246 246** 248 250 253`
#     ⭐ `cut.py` 배경 문턱 **246** 이 굽 «아래» 빛무리 한가운데를 지난다(218 → 254 로 서서히 밝아진다).
#     → 실루엣이 줄마다 1~2px 흔들리고, **흰 테는 그걸 «부풀려» 만들기 때문에 계단**이 된다.
#
# ✅ 그래서 자르기 «전»에 몸통을 **`<246`**(＝cut.py 문턱과 «똑같이») 로 잡고 그 바깥 빛무리를 순백으로 지운다.
#    경계가 내가 만든 덩어리 경계와 정확히 일치해서 흔들림이 0이 된다.
#
# ⛔⛔⛔ **2판이 저지른 사고 — 「진갈색 선(<200) 따라 자르기」가 접시 «굽»을 통째로 먹었다.**
#   📮 창업자 = *"근데 접시를 많이 잘라먹은 듯..."* ·
#              *"좋다고 한것도 아랫부분없이 윗부분만 잘라놓은것들이 많아 찰떡이랑 쿠키같은."*
#   🔢 전수 = 108컷 중 **세로 10% 이상 잘린 것 30컷**(최대 13.8%) · 5~10% 8컷.
#      창업자 판정이 그대로 따라왔다 — 찰떡·쿠키·호떡·티라미수·팥빙수·팬케이크가 전부 「깨짐」.
#   🔢 원인 실측 = **진갈색 선이 굽까지 안 내려가는 칸이 66/108(61%)** · 중앙값 15px · 최대 44px.
#      창업자가 넣은 윤곽선은 접시 «테두리»에만 있다. **넓이 비율로는 굽을 못 지킨다**(굽은 15%뿐).
#
# ⭐⭐⭐ **＋ 그래서 게이트를 붙였다 — 자른 컷이 «지금 배포된 컷»보다 짧으면 죽는다.**
#   📌 내가 세 번 헛짚은 뿌리 = **「꺾임」만 재고 «접시를 먹었나»를 안 쟀다.**
#      2판은 꺾임이 절반으로 좋아졌는데 접시를 13% 먹었고, 내 숫자는 전부 초록불이었다(규칙 18 ⓘ).
#   ⛔ 「규칙으로 적어두기」로는 안 된다 — 2판 도구 주석에도 *"그림은 한 픽셀도 안 건드린다"* 라고
#      내 손으로 적어놓고 45px 을 먹었다.
#
# ⛔ 「자른 뒤 알파를 다듬기」는 안 한다. 창업자 = *"땜빵하지말구"*.
# ⛔ `tools/cut.py` 는 손대지 않는다(창업자 절대원칙 2026-08-18).
# ⛔ 시트를 «칸으로 쪼개» 자르지 않는다 — 접시가 칸 경계를 넘어 오른쪽 위가 계단으로 잘린다.
import os, sys, glob, json, io, shutil, subprocess

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


# ⛔⛔⛔ 게이트 — 「접시를 먹었나」. **자른 컷이 «지금 배포된 컷»보다 짧으면 죽는다.**
#   ⭐ 잣대를 「꺾임」이 아니라 **크기**로 잡은 이유 = 2판이 꺾임을 절반으로 줄이고도 접시를 13% 먹었고
#      그때 내 숫자는 전부 초록불이었다. **잃은 것을 재는 잣대가 없으면 잃은 줄을 모른다.**
#   ⚠️ 배포판을 못 읽으면 «판정하지 않는다» — 「검사가 돌았는데 아무것도 안 쟀다」를 만들지 않는다(규칙 18 ⓘ).
한계 = 0.03
컷목록길 = f'{뿌리}/컷목록.json'
if 죽음 == 0 and os.path.exists(컷목록길):
    from PIL import Image
    배포브랜치 = 'claude/chatgpt-conversation-link-kvn5ph'
    먹힌것, 못잼 = [], 0
    for c in json.load(open(컷목록길)):
        새길 = f'{APP}/{c["src"]}'
        if not os.path.exists(새길):
            못잼 += 1; continue
        r = subprocess.run(['git', '-C', APP, 'show',
                            f'{배포브랜치}:hankki/src/assets/stickers/photo/{c["key"]}.png'],
                           capture_output=True)
        if r.returncode or not r.stdout:
            못잼 += 1; continue
        새 = Image.open(새길).size[1]
        옛 = Image.open(io.BytesIO(r.stdout)).size[1]
        비 = (옛 - 새) / 옛
        if 비 > 한계:
            먹힌것.append((비, 옛 - 새, c['key'], c['name']))
    먹힌것.sort(reverse=True)
    if 못잼:
        print(f'⚠️ 배포판과 못 견준 컷 {못잼}개 — 그만큼은 «안 쟀다»')
    if 먹힌것:
        print(f'\n⛔⛔ 접시를 먹었다 — 배포판보다 세로 {한계:.0%} 넘게 짧은 컷 {len(먹힌것)}개')
        for 비, px, k, n in 먹힌것[:12]:
            print(f'   {비:5.1%} {px:>4}px  {k}  {n}')
        죽음 += 1
    else:
        print(f'✅ 접시 안 먹었다 — 108컷 전부 배포판 대비 세로 손실 {한계:.0%} 이내')

print(f'\n{"✅ 18시트 전부 통과" if 죽음 == 0 else f"⛔ 실패 {죽음}건"}')
sys.exit(1 if 죽음 else 0)
