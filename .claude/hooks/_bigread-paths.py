#!/usr/bin/env python3
# 📏 「통째로 읽으려는 큰 .md」를 뽑는다 — 도구 입력(JSON)에서 «범위 없이» 여는 자리만.
#
# ⭐⭐ **왜 파일로 뺐나** — 훅 안에 `python3 -c "…"` 로 넣으면 bash 큰따옴표 «안»이라
#    백틱이 «실행»되고 큰따옴표가 블록을 «닫는다». archive-guard 가 그렇게 하루에 두 번 깨졌고,
#    **깨질 때마다 훅이 조용히 통과**했다(2026-08-15). 🔒 게이트 = `check-hookinline.mjs`
#
# ⭐ 「범위가 있으면」 통과시킨다 — 부분 읽기는 «권장»하는 쪽이다. 막는 건 통째로 여는 것뿐.
#    · Read 툴  : offset/limit 이 있으면 통과
#    · Bash     : sed -n 'A,Bp' · head -N · tail -N · grep 은 통과 (이미 범위다)
#                 cat <파일> 처럼 통째로 뱉는 것만 잡는다
import sys, json, re

# 「이 명령은 파일을 통째로 뱉는다」 — 범위 인자가 없는 것들
통째로 = re.compile(r'(?:^|[;&|]\s*)\s*(?:cat|bat|less|more)\s+([^\s;&|<>]+)')
MD = re.compile(r'\.md$')


def 뽑기(d):
    나온다 = []
    name = d.get('tool_name') or ''
    ti = d.get('tool_input') or {}

    if name == 'Read':
        p = ti.get('file_path') or ''
        # 범위를 짚었으면 통과 — 그게 우리가 바라는 읽기다
        if MD.search(p) and not ti.get('offset') and not ti.get('limit'):
            나온다.append(p)

    elif name == 'Bash':
        cmd = ti.get('command') or ''
        for m in 통째로.finditer(cmd):
            p = m.group(1).strip('"\'')
            if MD.search(p):
                나온다.append(p)

    return 나온다


def main():
    try:
        d = json.load(sys.stdin)
    except Exception:
        return
    for p in 뽑기(d):
        print(p)


main()
