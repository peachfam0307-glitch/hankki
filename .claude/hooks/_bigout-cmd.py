#!/usr/bin/env python3
# 📤 「답이 «얼마나 나올지 모르는» 명령인데 상한이 없다」를 뽑는다.
#
# ⛔⛔ 2026-09-03 사고 — 이 훅이 없어서 하루가 날아갔다.
#    `/clear` 직후 6%(58.8k) 였던 창이 «한 턴» 만에 45%(445.7k) 가 됐다.
#    그 턴에 돈 명령 이름 = `measure doc sizes and tool output sizes`.
#    문서 크기와 도구 답 크기를 «재려던» 명령이, 재려던 것을 그대로 대화에 쏟았다.
#    그날 아침 문서를 763KB → 172KB 로 줄여놨는데 명령 한 줄이 그 두 배를 한 번에 넣었다.
#
# ⭐⭐ **왜 `bigread-guard` 가 못 잡았나** — 그건 «파일을 통째로 여는 것»만 본다(cat·Read).
#    오늘 범인은 «도구를 돌려서 나온 답»이었다. 파일을 연 적이 없다. 그래서 그냥 지나갔다.
#    📌 「막는 게이트가 있다」가 아니라 «무엇을 보고 막는가»다 (2026-09-03 아침에도 같은 교훈).
#
# ⭐⭐ **왜 파일로 뺐나** — 훅 안에 `python3 -c "…"` 로 넣으면 bash 큰따옴표 «안»이라
#    백틱이 «실행»되고 큰따옴표가 블록을 «닫는다». archive-guard 가 그렇게 하루에 두 번 깨졌고,
#    **깨질 때마다 훅이 조용히 통과**했다(2026-08-15). 🔒 게이트 = `check-hookinline.mjs`
#
# ⭐ **막다른 길이 아니다** — 상한을 한 마디 붙이면 «언제나» 통과한다.
#    `| head -c 60000` · `| head -40` · `| wc -l` · `> 파일` · `grep -c`
#    ⛔ 「모든 명령」을 막지 않는다. «답 길이를 모르는» 모양만 잡는다.
import sys, json, re

# ── ① 답이 얼마나 나올지 «모르는» 모양 (오늘 터진 것들이 전부 여기 있다)
#    · 저장소 스크립트·npm  = 판·검수판이 수천 줄을 뱉는다 (latest-map 은 --for 없으면 17KB)
#    · git log / diff / show = 히스토리는 끝이 없다
#    · find / grep -r / ls -R = 저장소 전체를 훑는다
#    · for 반복문            = 파일마다 뱉으면 곱하기가 된다
모를모양 = [
    re.compile(r'(?:^|[;&|]\s*)\s*node\s+\S*scripts/\S+'),
    re.compile(r'(?:^|[;&|]\s*)\s*npm\s+(?:run|exec)\s+\S+'),
    re.compile(r'(?:^|[;&|]\s*)\s*git\s+(?:log|diff|show|blame)\b'),
    re.compile(r'(?:^|[;&|]\s*)\s*(?:find|fd)\s+'),
    re.compile(r'\bgrep\b[^|;&]*\s-[a-zA-Z]*[rR]'),
    re.compile(r'(?:^|[;&|]\s*)\s*ls\s+-\S*R'),
    re.compile(r'(?:^|;\s*)\s*for\s+\w+\s+in\b'),
]

# ── ② 「상한을 붙였다」로 인정하는 것 (하나만 있어도 통과)
#    ⭐ 넉넉히 인정한다 — 게이트가 뻑뻑하면 사람이 끄고, 꺼진 게이트는 없는 것과 같다.
상한있음 = [
    re.compile(r'\|\s*(?:head|tail)\b'),          # | head -40 · | tail -20
    re.compile(r'\|\s*wc\b'),                     # | wc -l  (숫자만 나온다)
    re.compile(r'\|\s*(?:cut|awk|sed)\b[^|]*\|\s*(?:head|tail)\b'),
    re.compile(r'\bhead\s+-c\b'),                 # head -c 60000
    re.compile(r'\bgrep\b[^|;&]*\s-[a-zA-Z]*[cql]\b'),   # grep -c · -q · -l
    re.compile(r'>\s*\S+'),                       # 파일로 흘려보냈다 (대화에 안 들어온다)
    re.compile(r'--\s*\S*(?:limit|max|for)\b'),   # latest-map --for 처럼 «좁혀서» 부른 것
    re.compile(r'\|\s*\S*(?:head|tail)\b'),
]


def 걸리나(cmd):
    if not cmd.strip():
        return None
    맞은모양 = None
    for r in 모를모양:
        m = r.search(cmd)
        if m:
            맞은모양 = m.group(0).strip()
            break
    if not 맞은모양:
        return None
    for r in 상한있음:
        if r.search(cmd):
            return None          # 상한을 붙였다 — 통과
    return 맞은모양


def main():
    try:
        d = json.load(sys.stdin)
    except Exception:
        return
    if (d.get('tool_name') or '') != 'Bash':
        return
    cmd = (d.get('tool_input') or {}).get('command') or ''
    맞은 = 걸리나(cmd)
    if 맞은:
        print(맞은)


if __name__ == '__main__':
    main()
