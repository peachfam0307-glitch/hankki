#!/usr/bin/env bash
# 🔁 「이 세션에서 처음인가?」 — 훅이 «전문»을 한 번만 뿌리게 하는 부품.
#
# 📮 창업자 2026-09-03 = *"토큰을 덜 쓰게 할 수 있는 방법이 있어??"*
#    🔢 실측 = UserPromptSubmit 훅이 **매 메시지 3,037 B**. 100메시지면 **303KB** —
#       `CLAUDE.md`(121KB)의 **5배**다. 대화가 길어질수록 이게 제일 크다.
#
# ⛔⛔ **조건을 «좁히는» 게 아니다 — 길이만 줄인다.** (이 구분이 중요하다)
#    `ask-guard` 주석에 창업자 원문이 박혀 있다:
#      *"다다다다다 뜨게해 뭐든 내가 묻는건 다 읽고 찾아보고 대답하라고!!!"*
#      *"「말에 물음표가 있을 때만」처럼 좁히지 말 것 — 좁히는 순간 또 빠져나간다"*
#    ✅ **여전히 매 메시지 뜬다.** 다만 «사고 경위»(묵채/콩국수 얘기 같은 것)는 세션에 한 번이면 된다.
#       같은 이야기를 200번 되풀이한다고 더 지켜지지 않는다. 명령어 목록은 매번 그대로 나간다.
#
# 쓰는 법 —  FIRST=$(printf '%s' "$IN" | .claude/hooks/_first-time.sh <이름>)
#            [ "$FIRST" = 처음 ] && 전문 || 짧은판
#
# ⚠️ `session_id` 가 안 오면 «처음»으로 친다 — 못 줄이는 건 괜찮지만, 못 뜨는 건 안 된다.
set -u
NAME="${1:-훅}"
SID=$(python3 -c 'import sys,json
try: print(json.load(sys.stdin).get("session_id") or "")
except Exception: print("")' 2>/dev/null || true)

[ -n "$SID" ] || { echo 처음; exit 0; }          # 못 알아보면 전문을 낸다(안전한 쪽)

MARK="/tmp/hankki-훅-$NAME-$SID"
if [ -e "$MARK" ]; then echo 또; else : > "$MARK" 2>/dev/null; echo 처음; fi
exit 0
