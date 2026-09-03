#!/usr/bin/env python3
# 📏 PostToolUse 입력에서 「도구가 실제로 뱉은 답」의 크기(바이트)를 잰다.
#
# ⭐ 답이 담기는 자리가 도구마다 다르다 — Bash 는 stdout/stderr, 다른 도구는 통째로 문자열이거나
#    dict 다. 그래서 «어느 한 자리»만 보면 조용히 0 을 돌려준다(＝게이트가 죽는다).
#    👉 그래서 tool_response 를 **통째로 직렬화해서** 잰다. 조금 넉넉하게 나오지만,
#       「크다/작다」를 가르는 데는 그게 안전하다. ⛔ 못 재면 0 → 통과(막다른 길 방지).
#
# ⭐⭐ **왜 파일로 뺐나** — 훅 안에 `python3 -c "…"` 로 넣으면 bash 큰따옴표 «안»이라
#    백틱이 «실행»되고 큰따옴표가 블록을 «닫는다». archive-guard 가 그렇게 하루에 두 번 깨졌고,
#    **깨질 때마다 훅이 조용히 통과**했다(2026-08-15). 🔒 게이트 = `check-hookinline.mjs`
#
# ⛔⛔ **면제 — 고칠 수 없는 것을 막으면 그건 잔소리다** (2026-09-03 · 만든 지 10분 만에 걸렸다)
#    `Edit`·`Write` 의 답에는 **고친 파일 내용이 통째로** 실려 온다. HANDOVER.md 를 한 줄 고쳤더니
#    64,659 B 로 걸렸다. 그런데 여기서 막아도 **되돌릴 수도, 좁혀 다시 부를 수도 없다** —
#    「파일을 안 고친다」는 선택지가 아니기 때문이다.
#    ⭐ 이 게이트가 값어치 있는 자리 = **«좁혀서 다시 부를 수 있는» 도구**(Bash·Read·MCP).
#    📌 시끄러운 게이트는 죽은 게이트다 — 사람이 끄면 없는 것과 같다.
#    ⛔ 그렇다고 상한을 올리지는 않는다. 올리면 진짜 사고도 같이 통과한다.
면제도구 = {'Edit', 'Write', 'MultiEdit', 'NotebookEdit'}

import sys, json


def main():
    try:
        d = json.load(sys.stdin)
    except Exception:
        print(0)
        return

    if (d.get('tool_name') or '') in 면제도구:
        print(0)
        return

    답 = d.get('tool_response')
    if 답 is None:
        답 = d.get('tool_result')
    if 답 is None:
        print(0)
        return

    if isinstance(답, str):
        본문 = 답
    else:
        try:
            본문 = json.dumps(답, ensure_ascii=False)
        except Exception:
            본문 = str(답)

    print(len(본문.encode('utf-8', 'ignore')))


if __name__ == '__main__':
    main()
