# 🍽 「그릇」 시트 108컷을 «접시 바닥이 안 깨지게» 다시 자른다 (2026-08-26)
#
# 📮 창업자 = *"아랫부분이 깨진거많은데"* · *"브라우니 수박화채확대해봐"*
#            · *"무화과 김치 오이소박이 만두등등 깨졌어아래가"* → *"접시바닥면만 어떻게 잘 해봐ㅠ"*
#
# ⛔⛔⛔ **뿌리를 실측으로 찾았다 — 「접시가 밝아서」가 아니라 `--drop` 때문이었다.**
#   `cut.py:196` = `piece = reg & (sub.min(axis=2) < WHITE - 10)`  ← **236**
#   `--drop` 이 조각을 «하나라도» 버리면 그 아래에서 **실루엣을 이 236 문턱으로 다시 짠다.**
#   그런데 흰 접시의 **바깥테·굽이 237~249** 라 그 문턱을 넘는다 →
#   ⑴ 236 아래로 내려온 픽셀만 **2~9px 짜리 점점이 30여 개**로 흩어지고
#   ⑵ `--drop` 이 그 점들을 「조각」으로 보고 버린 뒤 **실루엣을 다시 짜서 접시테가 통째로 깎였다**
#   → 창업자가 본 **「한 입 베어 문 자국」**. 브라우니 1,707px · 수박화채 1,289px 실측.
#
# ⭐⭐ 같은 뿌리가 «딸기라떼 유리잔 구멍»도 만들고 있었다 — 잔 벽이 같은 밝기라 같은 자리에서 뜯겼다.
#   **하나를 고치니 둘이 같이 나았다.**
#
# ✅ 그래서 두 가지를 «같이» 한다 — 하나만으론 안 된다
#   ① `tools/시트-접시굽-눌러주기.py` = **바닥 띠에서만** 몸통의 237~249 를 235 로 눌러
#      점점이가 «한 덩어리»가 되게 한다 (⛔전체를 누르면 잔 안 흰 부분까지 건드린다)
#   ② `--drop 0` = 버릴 조각이 없으니 **실루엣을 다시 짤 일이 없다** → 접시테가 그대로 산다
#      ⛔ ①없이 `--drop 0` 만 주면 그 점점이가 «떨어진 조각»으로 남아 절대원칙에 걸려 죽는다(실측 4/6)
#
# ⛔ `tools/cut.py` 는 손대지 않는다(창업자 절대원칙 2026-08-18). 자르기 «전»에 원본만 만진다.
# ⛔ **시트를 칸으로 쪼개 자르지 않는다** — 접시가 칸 경계를 넘어서 **오른쪽 위가 계단으로 잘린다**(실측).
#    누를 때만 칸으로 나눠 보고, **자르는 건 시트 통째로**.
# ⛔ 옛 판이 쓰던 `tools/칸-접시테두리-그리기.py`(길잡이 선)는 **안 쓴다** — 바닥은 살았지만
#    흰 테가 레이스처럼 물결쳤다(창업자 *"더망했ㄴㆍㅋ"*).
#
# 🔢 cfc1c5dd 시트 실측 = 아래띠 잃음 **1,586·2,084·79·3,064·1,396·228px → 전부 0px** · 큰 구멍 2 → 0
import os, sys, glob, shutil, subprocess

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
뿌리 = f'{APP}/docs/stickers/음식-창업자-2026-08-26'
시트들 = sorted(glob.glob(f'{뿌리}/라벨지움/*.png'))
낼곳 = f'{뿌리}/낱개'
행, 열, 띠 = 2, 3, 0.30
누른시트 = '/tmp/그릇-굽눌림-0826'
shutil.rmtree(누른시트, ignore_errors=True)
os.makedirs(누른시트, exist_ok=True)

죽음 = 0
for 시트 in 시트들:
    이름 = os.path.splitext(os.path.basename(시트))[0]
    눌린 = f'{누른시트}/{이름}.png'
    p = subprocess.run(['python3', f'{APP}/tools/시트-접시굽-눌러주기.py', 시트, 눌린,
                        str(행), str(열), str(띠)], capture_output=True, text=True)
    if p.returncode:
        print(f'⛔ {이름} 누르기 실패\n{p.stderr[-400:]}'); 죽음 += 1; continue

    낼폴더 = f'{낼곳}/{이름}'
    shutil.rmtree(낼폴더, ignore_errors=True)
    q = subprocess.run(['python3', f'{APP}/tools/cut.py', 눌린, 낼폴더, 이름,
                        '--diecut', 'auto', '--drop', '0'], capture_output=True, text=True)
    난것 = len(glob.glob(f'{낼폴더}/*.png'))
    if q.returncode or 난것 != 행 * 열:
        # ⛔ 조용히 넘기지 않는다 — 「고쳤다」고 말하게 된다
        꼬리 = [ln for ln in (q.stdout + q.stderr).splitlines() if '🚫' in ln or '⛔' in ln][:2]
        print(f'⛔ {이름} — {난것}/{행 * 열}컷 (rc={q.returncode}) {" ".join(꼬리)}')
        죽음 += 1; continue
    print(f'✅ {이름} — {난것}컷')

print(f'\n{"✅ 18시트 전부 통과" if 죽음 == 0 else f"⛔ 실패 {죽음}건"}')
sys.exit(1 if 죽음 else 0)
