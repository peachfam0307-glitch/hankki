# 🔁 8/24 시트에서 «접시 깨진 68컷»을 오늘 만든 방법으로 다시 자른다 (2026-08-26)
#
# 📮 창업자 = 253장 전수검수 → 접시깨짐 72개 · *"72개는 접시 자름이 넘어갈수가 없어."*
#
# ⭐⭐ **다시 뽑기 «전»에 다시 잘라 본다** — 원본 시트 32장이 그대로 있고,
#    오늘 8/26 그릇 컷에서 굽을 살린 방법(`tools/시트-둘레-지우기.py` 2판)을 아직 안 써 봤다.
#    살아나면 창업자가 66개를 다시 안 뽑아도 된다(규칙 8 — 노가다는 클로드가).
#
# ⚠️ **되리라고 장담하지 않는다** — 실측으로 뿌리가 이렇게 나왔다:
#    전멸 시트 8장은 **경계 흐림폭 13px**(좋은 시트 2px). 그림 끝에서 배경까지 서서히 밝아지는 폭이
#    넓으면 «어디가 끝인지»가 원본에 아예 안 적혀 있다. 자르기로 못 만들어 낸다.
#    ⭐ 그래도 **해보고 말한다** — 안 해보고 「안 된다」고 하면 그게 짐작이다(규칙 15).
#
# 🔢 결과는 «창업자 눈»으로 판정한다 — 내 숫자는 이 건에서 네 번 헛짚었다.
import os, subprocess, sys, glob, json, shutil

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
뿌리 = f'{APP}/docs/stickers/음식-창업자-2026-08-24'
판정 = json.load(open(f'{APP}/docs/stickers/판정-이름표전수-2026-08-26.json'))
깨 = {k for k in 판정['접시깨짐'] if not k.startswith('gr_')}
시트들 = sorted({k.split('_')[0] for k in 깨}, key = int)
행, 열 = 2, 3

작업 = '/tmp/8월24-다시-0826'
shutil.rmtree(작업, ignore_errors = True)
os.makedirs(f'{작업}/라벨지움', exist_ok = True)
os.makedirs(f'{작업}/깨끗', exist_ok = True)
낼곳 = f'{뿌리}/낱개-다시-0826'
os.makedirs(낼곳, exist_ok = True)

죽음 = []
난것 = 0
for s in 시트들:
    원 = glob.glob(f'{뿌리}/원본시트/{s}-*')
    if not 원:
        죽음.append(f'{s}(원본없음)'); continue
    라 = f'{작업}/라벨지움/{s}.png'
    p = subprocess.run(['python3', f'{APP}/tools/시트-라벨지우기.py', 원[0], 라, str(행), str(열)],
                       capture_output = True, text = True)
    if p.returncode:
        죽음.append(f'{s}(라벨)'); print(f'⛔ {s} 라벨 지우기 실패\n{p.stderr[-300:]}'); continue
    깨끗 = f'{작업}/깨끗/{s}.png'
    # ⭐⭐ 「접시 굽 눌러주기」 — 8/24 «사진» 시트는 이 도구가 맞다(문서 136줄 파이프라인).
    #    ⛔ 처음에 `시트-둘레-지우기.py` 를 썼다가 헛돌았다 — 그건 8/26 «그릇» 컷용이다.
    #      둘레지우기는 몸통을 <246 으로 잡고 그 바깥을 순백으로 지우는데,
    #      흰 접시의 굽·바깥테가 237~253 이라 «그게 통째로 지워져» 톱니가 그대로 남았다.
    #    ✅ 눌러주기는 반대로 «굽을 236 아래로 눌러» 칼이 그림으로 보게 만든다.
    q = subprocess.run(['python3', f'{APP}/tools/시트-접시굽-눌러주기.py', 라, 깨끗,
                        str(행), str(열), '0.30'],
                       capture_output = True, text = True)
    if q.returncode:
        # ⛔ 조용히 넘기지 않는다 — 「접시를 먹었다」로 도구가 스스로 막은 것이다
        꼬리 = q.stderr.strip().splitlines()[-1] if q.stderr.strip() else ''
        죽음.append(f'{s}(둘레)'); print(f'⛔ {s} — {꼬리}'); continue
    낼 = f'{낼곳}/{s}'
    shutil.rmtree(낼, ignore_errors = True)
    r = subprocess.run(['python3', f'{APP}/tools/cut.py', 깨끗, 낼, s,
                        '--diecut', 'auto', '--drop', '0'], capture_output = True, text = True)
    n = len(glob.glob(f'{낼}/*.png'))
    if r.returncode or n != 행 * 열:
        꼬리 = [ln for ln in (r.stdout + r.stderr).splitlines() if '🚫' in ln][:1]
        죽음.append(f'{s}({n}/6)'); print(f'⛔ {s} — {n}/6컷 {" ".join(꼬리)}'); continue
    난것 += n
    print(f'✅ {s} — {n}컷')

print(f'\n{"✅" if not 죽음 else "⚠️"} 시트 {len(시트들)}장 중 {len(시트들) - len(죽음)}장 성공 · {난것}컷')
if 죽음:
    print(f'   ⛔ 못 자른 시트 {len(죽음)}장: {" · ".join(죽음)}')
sys.exit(0)
