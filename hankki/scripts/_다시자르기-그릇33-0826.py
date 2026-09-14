# 🍽 8/26 그릇 컷 중 «창업자가 깨졌다고 한 33컷»을 오늘 방법으로 다시 자른다 (2026-08-26)
#
# 📮 창업자 = *"72개는 접시 자름이 넘어갈수가 없어."*
#
# ⭐⭐ **8/24 컷 68개가 오늘 이 방법으로 살아났다** — 같은 방법을 그릇 컷에도 쓴다(규칙 8).
#   앞 판(`_다시자르기-그릇108-0826.py`)은 **`시트-둘레-지우기`** 만 썼다.
#   그건 굽 «아래» 빛무리를 지우는 도구라 **굽은 살렸지만 접시 «테두리»가 톱니로 남았다.**
#
# ✅ 이번에 더한 것 = **`시트-접시굽-눌러주기` 를 «띠 1.0»(그림 전체 높이)으로** 먼저 돌린다.
#   ⭐ 띠를 «아래 30%»가 아니라 «전체»로 주는 이유 = **손잡이는 옆구리에 있다.**
#      전복솥밥·돌솥비빔밥의 손잡이가 네모나게 파인 것이 정확히 그 자리였고, 띠 1.0 으로 살아났다.
#
# 🔢 어느 33컷인가 = **앱에 든 파일과 새 낱개의 해시가 «다른» 것**(＝74컷 갈아끼울 때 건너뛴 것).
#   ⛔ 손으로 적은 목록을 쓰지 않는다 — 반드시 낡는다.
#
# ⛔ `tools/cut.py` 는 손대지 않는다(창업자 절대원칙 2026-08-18).
# 🔢 결과 판정은 «창업자 눈»으로 — 내 숫자는 이 건에서 다섯 번 헛짚었다.
import glob, hashlib, json, os, shutil, subprocess, sys

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
뿌리 = f'{APP}/docs/stickers/음식-창업자-2026-08-26'
앱컷 = f'{APP}/src/assets/stickers/photo'
행, 열 = 2, 3


def 해시(p):
    return hashlib.sha1(open(p, 'rb').read()).hexdigest()


컷 = json.load(open(f'{뿌리}/컷목록.json'))
안갈아낀 = []
for c in 컷:
    새 = f'{APP}/{c["src"]}'
    앱길 = f'{앱컷}/{c["key"]}.png'
    if os.path.exists(새) and os.path.exists(앱길) and 해시(새) != 해시(앱길):
        안갈아낀.append(c)
시트들 = sorted({c['src'].split('/')[-2] for c in 안갈아낀})
print(f'🔎 안 갈아낀 컷 {len(안갈아낀)}개 · 시트 {len(시트들)}장')

작업 = '/tmp/그릇33-다시-0826'
shutil.rmtree(작업, ignore_errors = True)
os.makedirs(f'{작업}/라벨지움', exist_ok = True)
os.makedirs(f'{작업}/눌림', exist_ok = True)
os.makedirs(f'{작업}/깨끗', exist_ok = True)
낼곳 = f'{뿌리}/낱개-다시-0826'
os.makedirs(낼곳, exist_ok = True)

죽음, 난것 = [], 0
for s in 시트들:
    원 = glob.glob(f'{뿌리}/원본시트/{s}*')
    if not 원:
        죽음.append(f'{s}(원본없음)')
        continue
    라 = f'{작업}/라벨지움/{s}.png'
    p = subprocess.run(['python3', f'{APP}/tools/시트-라벨지우기.py', 원[0], 라, str(행), str(열)],
                       capture_output = True, text = True)
    if p.returncode:
        죽음.append(f'{s}(라벨)')
        print(f'⛔ {s} 라벨 지우기 실패\n{p.stderr[-300:]}')
        continue
    # ⭐ 띠 = 「어디를 누를까」 — 손잡이 달린 시트만 «전체»(1.0), 나머지는 «아래쪽»(0.30)
    #  ⛔⛔ 처음엔 여덟 장 전부 1.0 을 줬다가 4배로 확대해서 잡았다 —
    #     접시 «안»에 가로 계단이 생긴다(236~253 을 220~235 로 눌러 담느라 층이 진다).
    #  ⭐ 손잡이는 «옆구리»에 있어 1.0 이 필요하지만, 손잡이 없는 그릇엔 그 대가만 남는다.
    띠 = '1.0' if s in ('0226080b', '91108890') else '0.30'
    눌 = f'{작업}/눌림/{s}.png'
    q = subprocess.run(['python3', f'{APP}/tools/시트-접시굽-눌러주기.py', 라, 눌,
                        str(행), str(열), 띠], capture_output = True, text = True)
    if q.returncode:
        꼬리 = q.stderr.strip().splitlines()[-1] if q.stderr.strip() else ''
        죽음.append(f'{s}(눌러주기)')
        print(f'⛔ {s} — {꼬리}')
        continue
    # 굽 아래 흐린 빛무리는 여전히 지운다 — 실패하면 «눌린 판»으로 그냥 간다
    깨끗 = f'{작업}/깨끗/{s}.png'
    r = subprocess.run(['python3', f'{APP}/tools/시트-둘레-지우기.py', 눌, 깨끗, str(행), str(열)],
                       capture_output = True, text = True)
    쓸 = 깨끗 if r.returncode == 0 else 눌
    if r.returncode:
        꼬리 = r.stderr.strip().splitlines()[-1] if r.stderr.strip() else ''
        print(f'   ⚠️ {s} 둘레지우기 건너뜀 — {꼬리[:90]}')
    낼 = f'{낼곳}/{s}'
    shutil.rmtree(낼, ignore_errors = True)
    t = subprocess.run(['python3', f'{APP}/tools/cut.py', 쓸, 낼, s,
                        '--diecut', 'auto', '--drop', '0'], capture_output = True, text = True)
    n = len(glob.glob(f'{낼}/*.png'))
    if t.returncode or n != 행 * 열:
        꼬리 = [ln for ln in (t.stdout + t.stderr).splitlines() if '🚫' in ln][:1]
        죽음.append(f'{s}({n}/6)')
        print(f'⛔ {s} — {n}/6컷 {" ".join(꼬리)}')
        continue
    난것 += n
    print(f'✅ {s} — {n}컷')

print(f'\n{"✅" if not 죽음 else "⚠️"} 시트 {len(시트들)}장 중 {len(시트들) - len(죽음)}장 성공 · {난것}컷')
if 죽음:
    print(f'   ⛔ 못 자른 시트 {len(죽음)}장: {" · ".join(죽음)}')
sys.exit(0)
