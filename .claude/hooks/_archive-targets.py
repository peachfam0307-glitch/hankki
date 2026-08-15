#!/usr/bin/env python3
# 🗄 보관소 판정용 — 도구 입력(JSON)에서 «열려는 자리»를 뽑아 한 줄씩 찍는다.
#
# ⭐⭐ **왜 파일로 뺐나** (2026-08-15 · 창업자 *"왜 자꾸 백틱을 밟아? 이것도 해결해"*)
#    전엔 이 코드가 `archive-guard.sh` 안에 `python3 -c "…"` 로 들어 있었다.
#    bash 큰따옴표 «안»이라 —
#      · 백틱(`)      → 명령으로 «실행»된다
#      · 큰따옴표(")  → 그 자리에서 블록이 «닫힌다»
#      · $(…) · $변수 → 치환된다
#    ⛔ 그래서 **주석 한 줄에 큰따옴표를 쓴 것만으로 python 이 통째로 깨졌고,
#       훅은 조용히 통과했다.** 「가뒀다」고 말해 놓고 안 가둬진 것이다.
#    ⭐ 파일로 빼면 bash 가 이 안을 «아예 안 본다». 지뢰가 사라진다.
#
# 나가는 값 = 판정할 경로들(줄바꿈으로). 없으면 아무것도 안 찍는다.
import sys, json, re

읽는낱말 = r'\b(?:sed|head|tail|grep|awk|cat|less|more|python3?|node|jq|rg|bat|xxd|od)\b'
보관소패턴 = r'(?:_archive|_아껴둠|_구판|_구버전)'
보관소경로 = r'([\w./가-힣_-]*' + 보관소패턴 + r'[\w./가-힣_-]*)'
# ⛔ 이 낱말만으로 이루어진 줄은 통과 — 보관소를 «만들고 정리하고 담는» 정상 작업이다.
#    막으면 막다른 길이 된다(2026-08-13 에 실제로 커밋이 통째로 멈췄다).
옮기는명령 = r'[^a-zA-Z]*(?:(?:git|mv|cp|mkdir|ls|rm|rmdir|touch|echo|printf|find|du|wc|stat)\b[^|;&]*[;&|]*\s*)+'

def 뽑기(d):
    ti = d.get('tool_input') or {}
    tool = d.get('tool_name') or ''
    if tool == 'Read':
        yield ti.get('file_path') or ''
        return
    if tool in ('Grep', 'Glob'):
        # ⚠️ path 는 «폴더»일 수 있다 — 폴더째 검색이 새면 Read 와 다를 게 없다.
        yield ti.get('path') or ''
        return
    if tool != 'Bash':
        return
    cmd = ti.get('command') or ''
    # ⓐ 읽는 명령 «바로 뒤»의 .md — 「🗄 보관소」 표시는 보관소 폴더 밖 문서에도 붙는다
    for m in re.finditer(읽는낱말 + r'[^|;&]*?([\w./가-힣_-]+\.md)', cmd):
        yield m.group(1)
    # ⓑ 읽는 명령 «바로 뒤»의 보관소 경로 — 확장자를 안 본다(.json·.txt·.patch 가 새던 자리)
    for m in re.finditer(읽는낱말 + r'[^|;&]*?' + 보관소경로, cmd):
        yield m.group(1)
    # ⓒ 「읽는 낱말이 어딘가 ＋ 보관소 경로가 어딘가」 — ⓑ 는 따옴표 안의 세미콜론을 못 넘는다.
    #    (python3 -c 'import json;json.load(open(…))' 같은 원라이너가 그 구멍으로 샜다)
    if re.search(보관소패턴, cmd) and re.search(읽는낱말, cmd):
        if not re.fullmatch(옮기는명령, cmd):
            for m in re.finditer(보관소경로, cmd):
                yield m.group(1)

try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit(0)

본것 = set()
for p in 뽑기(d):
    if p and p not in 본것:
        본것.add(p)
        print(p)
