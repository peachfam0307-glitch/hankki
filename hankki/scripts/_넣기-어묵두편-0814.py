# 🍢 창업자가 «아껴둔» 레시피 둘을 11/23 주로 — 2026-08-14
#
#   📮 창업자 *"23주?에는 아껴둔 레시피들 있잖아 그거 섞어서 나가자. 2개"* → *"어묵탕 어묵볶음 좋다."*
#
# ⭐ 어느 주에도 안 들어간 레시피가 셋 있었다(어묵탕·어묵볶음·꼬들단무지 무침). 셋 다 **창업자 본인 레시피**다.
#    창업자가 그중 둘을 골랐다. 셋째는 `hold/주간레시피-11월-0813` 에 그대로 둔다.
#
# ⛔ hold 브랜치를 통째로 합치면 **충돌 61곳**이다(그 브랜치엔 11주 33편이 같이 들어 있고 아직 검수 전이다).
#    → 두 편만 «블록으로» 뽑아 온다.
import re
import subprocess
from pathlib import Path

뿌리 = Path(__file__).resolve().parent.parent
B = 'origin/hold/주간레시피-11월-0813'
hb = subprocess.run(['git', 'show', f'{B}:hankki/src/data/basics.js'],
                    capture_output=True, text=True, cwd=str(뿌리.parent)).stdout
if 'basic-eomuk-tang' not in hb:
    raise SystemExit('⛔ hold 브랜치에서 어묵탕을 못 읽었다 — 브랜치 이름이 바뀌었나?')

p = 뿌리 / 'src/data/basics.js'
s = p.read_text()
if 'basic-eomuk-tang' in s:
    raise SystemExit('⛔ 이미 들어가 있다 — 두 번 넣지 않는다')

블록들 = []
for key, 아이콘 in [('basic-eomuk-tang', 'fb_b02'), ('basic-eomuk-bokkeum', 'fh_k34')]:
    i = hb.find(f"id: '{key}'")
    j = hb.find('\n  },', i)
    b = hb[hb.rfind('{', 0, i):j + 5]
    # ⭐ from 을 11/23 으로 — 창업자가 그 주로 확정했다. 미래 날짜라 검수 관문도 통과한다.
    if 'from:' in b:
        b = re.sub(r"from: '[\d-]+'", "from: '2026-11-23'", b, count=1)
    else:
        b = re.sub(r"(title: '[^']+')", r"\1, from: '2026-11-23'", b, count=1)
    if 'icon:' not in b:
        b = re.sub(r"(from: '2026-11-23',)", rf"\1\n    icon: '{아이콘}',", b, count=1)
    블록들.append(b.rstrip().rstrip(','))

마커 = '  // ⬆⬆ [자동] 우리집레시피 34편 끝 ⬆⬆'
if 마커 not in s:
    raise SystemExit('⛔ 넣을 자리(마커)를 못 찾았다 — basics.js 모양이 바뀌었다')
새 = ('\n\n  // 🍢🍢 2026-08-14 — 창업자가 «아껴둔» 자기 레시피 둘을 11/23 주로 확정했다.\n'
      '  //   📮 창업자 *"23주?에는 아껴둔 레시피들 있잖아 그거 섞어서 나가자. 2개"* → *"어묵탕 어묵볶음 좋다."*\n'
      '  //   ⭐ 둘은 «한 짝»이다 — 어묵탕 재료가 「전처리한 어묵(어묵볶음 편 참고)」을 부른다. 따로 내면 유저가 헤맨다.\n'
      '  //   ⛔ 셋째 「꼬들단무지 무침」은 이번에 안 넣는다(창업자가 둘만 골랐다). hold 브랜치에 그대로 있다.\n'
      + ',\n'.join(블록들) + ',\n')
p.write_text(s.replace(마커, 새 + 마커, 1))
print('✅ 두 편 삽입 —', ' · '.join(re.search(r"title: '([^']+)'", b).group(1) for b in 블록들))
