#!/usr/bin/env python3
"""🍽 그릇 시트 한 장 → 쓸 수 있는 컷까지 «한 줄»로 (2026-08-29)

📮 창업자 = *"그리고 손잡이 자르는거 꼭꼭꼭 저장해둬 코드로 만들어서!!"*

⭐⭐ **왜 도구로 만드나** — 옵션 하나를 안 줘서 두 번 헛돌았다.
   · 2026-08-27 = `--drop` 을 0 이 아닌 값으로 줘서 **냄비 손잡이 바깥선이 뜯겼다**
     (창업자 = *"냄비손잡이 부분잘렸어. 냄비들 테두리 매끈하게잘라줘"*)
   · 2026-08-29 = `--punch` 를 안 줘서 **손잡이 «고리 안»이 흰색으로 막혀 있었다**
     (창업자 = *"손잡이 구멍있는건 깔끔하게 못자르려나?"* → 줬더니 그 자리에서 뚫렸다)
   📌 **도구가 못 하는 게 아니라 내가 안 물어본 것이었다.** 그래서 순서와 옵션을 여기 박는다.

⛔⛔ `tools/cut.py` 는 손대지 않는다 (창업자 2026-08-18 *"자르기도구는 건드리지마"*).
   이 파일은 **그 도구를 «부르는 순서»**일 뿐이다.

═══ 하는 일 = 세 단계 ═══

  ① tools/시트-둘레-지우기.py   — 흰 그릇 둘레의 «빛무리»를 지운다
       ⛔ 안 하면 컷이 서로 붙거나 배경 얼룩이 딸려 온다

  ② tools/cut.py --diecut auto --drop 0 --punch 0.0008
       ⭐ `--drop 0`      = 조각을 «하나도» 안 버린다.
          ⛔ 0.001 만 줘도 도구가 그 아래에서 실루엣을 236 문턱으로 다시 짜는데,
             흰 그릇의 바깥테·손잡이가 237~249 라 **통째로 깎인다**(2026-08-27 실측 272px).
       ⭐ `--punch 0.0008` = 그림 «안»에 갇힌 순백 구멍을 뚫는다.
          ⭐ 손잡이 고리 안쪽이 딱 그 자리다. 값이 작아야 한다 —
             고리 구멍은 컷 넓이의 0.2~1% 밖에 안 된다(실측 611~2244px).
          ⛔ 0.02 처럼 크게 주면 손잡이는 안 뚫리고 창만 뚫린다.

  ③ tools/그릇-창뚫기.py         — 가운데 «회색 사진칸»을 투명하게
       ⛔ `cut.py --frame` 으론 안 된다 — 그건 «순백»을 번지게 하는데 우리 창은 연회색(≈#E9EBED)이다

═══ 쓰기 ═══

  python3 tools/그릇시트-통째로.py <시트.png> <낼폴더> <접두어> [행] [열]
  예) python3 tools/그릇시트-통째로.py docs/.../가을낙엽-접시.png /tmp/접시 au_d 2 2

⚠️ 손잡이가 «귀 모양»(고리가 아닌 것)이면 ②에서 구멍이 안 생기는 게 정상이다.
   뚫린 구멍 개수 = 창 1개 ＋ 고리 손잡이 개수. 결과에 그 수를 찍어 준다.
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import label

여기 = Path(__file__).resolve().parent
앱 = 여기.parent


def 구멍세기(f):
    """뚫린 «갇힌 구멍»이 몇 개인가 — 창 1개 ＋ 고리 손잡이"""
    a = np.array(Image.open(f).convert('RGBA'))
    al = a[..., 3]
    빈 = al <= 128
    L, n = label(빈)
    if n == 0:
        return 0, []
    바깥 = {L[0, 0], L[0, -1], L[-1, 0], L[-1, -1]} - {0}
    크기 = [int((L == i).sum()) for i in range(1, n + 1) if i not in 바깥]
    크기 = sorted([s for s in 크기 if s > 150], reverse=True)
    return len(크기), 크기


def 돌려(명령, 조용=True):
    r = subprocess.run(명령, cwd=앱, capture_output=True, text=True)
    if r.returncode != 0:
        print(f'\n⛔ 죽었다 — {" ".join(str(x) for x in 명령)}')
        print(r.stdout[-2500:])
        print(r.stderr[-1500:])
        sys.exit(1)
    if not 조용:
        print(r.stdout)
    return r.stdout


def main():
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(1)
    시트 = sys.argv[1]
    낼곳 = sys.argv[2]
    접두어 = sys.argv[3]
    행 = sys.argv[4] if len(sys.argv) > 4 else '2'
    열 = sys.argv[5] if len(sys.argv) > 5 else '2'

    깨끗 = f'/tmp/{Path(시트).stem}-깨끗.png'
    print(f'🍽 {Path(시트).name} → {접두어}*  ({행}×{열})\n')

    print('① 둘레 빛무리 지우기')
    돌려(['python3', 'tools/시트-둘레-지우기.py', 시트, 깨끗, 행, 열])

    print(f'② 자르기 — --drop 0 --punch 0.0008 (손잡이 고리를 뚫는 값)')
    out = 돌려(['python3', 'tools/cut.py', 깨끗, 낼곳, 접두어,
                '--grid', f'{행}x{열}', '--diecut', 'auto', '--drop', '0', '--punch', '0.0008'])
    if '절대원칙' in out:
        print('⛔ 자르기 절대원칙에 걸렸다 — 위 출력을 보고 고칠 것')
        print(out[out.index('절대원칙') - 40:][:1200])
        sys.exit(1)

    print('③ 가운데 창 뚫기')
    돌려(['python3', 'tools/그릇-창뚫기.py', 낼곳])

    print('\n🔎 뚫린 구멍 (창 1개 ＋ 고리 손잡이 수)')
    for f in sorted(Path(앱 / 낼곳 if not Path(낼곳).is_absolute() else 낼곳).glob('*.png')):
        n, 크기 = 구멍세기(f)
        꼬리 = '· 손잡이 고리 없음(귀 모양이면 정상)' if n <= 1 else f'· 손잡이 {n - 1}개 뚫림'
        print(f'   {f.name:14} 구멍 {n}개 {크기[:4]} {꼬리}')

    print(f'\n👁 눈으로 볼 것 = /tmp/_검수/{Path(낼곳).name}-진한판-크게.png  (절대원칙 21)')


if __name__ == '__main__':
    main()
