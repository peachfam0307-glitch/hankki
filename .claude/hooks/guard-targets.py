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
#
# ⛔⛔ **[2026-08-16] 이 파일 이름이 `_archive-targets.py` 였다 — 훅이 «자기 부품»을 막았다.**
#    경로에 `_archive` 가 들어가서 Read 로 열 수 없었다.
#    → **훅을 고치려면 부품을 읽어야 하는데 못 읽는 막다른 길**(규칙 19 그 자리, 이번이 두 번째).
#    ✅ 이름을 `guard-targets.py` 로 바꿨다. **「하지 마라」보다 «할 수 없게»가 낫다.**
#    ✅ ＋ 안전망으로 `.claude/hooks/` 아래는 판정 대상에서 아예 뺀다(다음에 또 그런 이름이 생겨도 안전).
import sys, json, re

# ⭐ 「읽는 명령」 = 내용을 눈에 들여오는 것. 옮기고 담는 것(git add·mv·commit)은 여기 없다.
#   ⛔⛔ [2026-08-16 구멍 하나 메움] `git show HEAD:docs/_archive/…` 로 **내용을 그대로 읽을 수 있었다.**
#      재현으로 잡았다 — cat 은 막히는데 git show 는 통과했다. 같은 일을 하는데 한쪽만 막혀 있었다.
읽는낱말 = (r'(?:\b(?:sed|head|tail|grep|awk|cat|less|more|python3?|node|jq|rg|bat|xxd|od)\b'
            r'|\bgit\s+(?:show|cat-file|diff|log|blame)\b)')
보관소패턴 = r'(?:_archive|_아껴둠|_구판|_구버전)'
보관소경로 = r'([\w./가-힣_-]*' + 보관소패턴 + r'[\w./가-힣_-]*)'
# ⛔ 이 낱말만으로 이루어진 줄은 통과 — 보관소를 «만들고 정리하고 담는» 정상 작업이다.
#    막으면 막다른 길이 된다(2026-08-13 에 실제로 커밋이 통째로 멈췄다).
옮기는명령 = r'[^a-zA-Z]*(?:(?:git|mv|cp|mkdir|ls|rm|rmdir|touch|echo|printf|find|du|wc|stat)\b[^|;&]*[;&|]*\s*)+'

# 🔓 훅 자기 코드는 «옛 판 문서»가 아니다 — 이름이 어떻든 막지 않는다.
#    (2026-08-16: `_archive-targets.py` 라는 이름 하나 때문에 훅이 자기 부품을 막아 막다른 길이 됐다)
def 훅코드인가(p):
    return '.claude/hooks/' in (p or '')

def 뽑기(d):
    ti = d.get('tool_input') or {}
    tool = d.get('tool_name') or ''
    if tool == 'Read':
        p = ti.get('file_path') or ''
        if not 훅코드인가(p):
            yield p
        return
    if tool in ('Grep', 'Glob'):
        # ⚠️ path 는 «폴더»일 수 있다 — 폴더째 검색이 새면 Read 와 다를 게 없다.
        p = ti.get('path') or ''
        if not 훅코드인가(p):
            yield p
        return
    if tool != 'Bash':
        return
    cmd = ti.get('command') or ''

    # ⛔⛔⛔ [2026-08-16 · 진짜 원인] **heredoc 본문은 «명령»이 아니라 «데이터»다.**
    #    `cat > /tmp/cm.txt <<'EOF' … EOF` 로 커밋 메시지를 «쓰는» 것이 막혔다 —
    #    본문에 `docs/_archive/…` 가 적혀 있고 명령에 `cat` 이 있어서 「보관소를 읽는다」로 잡혔다.
    #    📌 낮에 `git add -A hankki/docs` 가 막힌 것도 같은 뿌리였다(그 앞에 `cat >> 문서 <<EOF` 로
    #       복기를 붙였고, 그 본문에 보관소 경로가 있었다). **한참 못 찾다가 재현으로 잡았다.**
    #    ✅ 본문을 지우고 판정한다 — 문서에 「보관소로 옮겼다」고 «적는» 일까지 막으면 막다른 길이다.
    cmd = re.sub(r"<<-?\s*'?\"?(\w+)'?\"?[\s\S]*?^\1\s*$", ' ', cmd, flags=re.M)

    # ⛔ `cat > 파일` · `cat >> 파일` · `tee` 는 **쓰는** 것이지 읽는 게 아니다.
    #    읽는낱말 목록에 `cat` 이 있어서 쓰기까지 싸잡혔다. 쓰는 자리는 지운다.
    cmd = re.sub(r'\b(?:cat|tee)\s*>>?\s*[^\s|;&]+', ' ', cmd)

    # ⛔⛔⛔ [2026-08-18 · 세 번째로 같은 자리를 밟았다] **`printf '…' > 파일` 이 빠져 있었다.**
    #    창업자 *"청소해"* → 보관소로 옮기려고 허가 표식을 만드는데 **그 명령이 막혔다**:
    #      printf '%s\n' '… 보관소로 git mv …' > /tmp/hankki-보관소-허가 && cat /tmp/hankki-보관소-허가
    #    표식 «글»에 보관소 낱말이 들어 있고 뒤에 `cat` 이 있어서 ⓒ 규칙이 「보관소를 읽는다」로 잡았다.
    #    ⛔ 그런데 이 파일 머리말엔 *"허가 표식을 만드는 echo·printf 는 «안 막힌다». 막다른 길이 아니다"*
    #       라고 적혀 있었다 — **적어만 두고 돌려보지 않은 것이다**(규칙 12).
    #    📌 **쓰는 글은 «데이터»지 «경로»가 아니다.** 63줄(heredoc)·67줄(cat>)과 똑같은 뿌리, 세 번째.
    #    ✅ echo·printf 의 리다이렉트도 같이 지운다.
    cmd = re.sub(r'\b(?:echo|printf)\b[^|;&]*?>>?\s*[^\s|;&]+', ' ', cmd)
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
    # ⛔ 훅 자기 코드는 어느 갈래로 걸렸든 뺀다 (Bash 로 훅을 고칠 때도 막히면 안 된다)
    if p and p not in 본것 and not 훅코드인가(p):
        본것.add(p)
        print(p)
