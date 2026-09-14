#!/usr/bin/env bash
# 🪤 커밋 메시지 안의 백틱을 막는다 (PreToolUse · Bash)
#
# ⛔⛔ 왜 «규칙»이 아니라 «장치»인가 — CLAUDE.md 규칙 24 에 적혀 있는데도 **이틀 연속 밟았다.**
#    2026-08-14 : doc-guard·check-current 자리가 빈칸이 됐다
#    2026-08-15 : 「네 판」 정정 커밋에서 백틱 넷이 통째로 사라졌다 (7 · 2·3·5 · 1·2·3·5 · 7)
#    📌 규칙 19 그대로 — **「알려주는 것」과 「지켜주는 것」은 다르다.**
#
# 🔎 무슨 일이 나나 — bash 는 «큰따옴표 안»의 백틱을 **명령으로 실행**한다.
#    git commit -m "… `7` 은 8/1 …"  →  bash 가 `7` 을 실행 → command not found → **그 자리가 빈칸**
#    ⚠️ 커밋은 «성공»하고 푸시도 된다. 그래서 아무도 못 잡는다. 나중에 로그를 볼 때야 구멍이 보인다.
#
# ✅ 푸는 길 = CLAUDE.md 가 이미 정한 방식 — **메시지를 파일로 쓰고 `-F`**
#    (heredoc 은 <<'EOF' 처럼 «따옴표로 묶으면» 백틱이 안 돈다)
#
# ⭐ 조건을 좁게 잡았다 — `git commit` ＋ `-m` 일 때만. 시끄러운 게이트는 죽은 게이트다.
set -uo pipefail

CMD="$(cat 2>/dev/null | python3 -c 'import sys,json;print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null || true)"
[ -n "$CMD" ] || exit 0

# git commit 이 아니면 조용히 통과
case "$CMD" in *"git commit"*) ;; *) exit 0 ;; esac

# ⭐⭐ **-F 가 있으면 즉시 통과** — 이미 「파일로 쓰기」를 하고 있다는 뜻이다.
#    ⛔⛔ 이 줄이 없던 첫 판이 «내가 안내한 푸는 길»을 그대로 막았다(2026-08-15, 만들자마자).
#       heredoc 으로 메시지 파일을 쓰면 그 «본문»에 `git commit -m` 과 백틱이 글자로 들어가는데,
#       훅은 명령 전체를 한 덩어리 문자열로 보므로 그걸 «진짜 -m» 으로 읽었다.
#    📌 CLAUDE.md 규칙 19 — **게이트를 만들면 「막히는 경우」뿐 아니라 «푸는 경우»도 규칙 12로 돌려본다.**
#       오늘 그 줄을 문서에 적어놓고 그대로 밟았다.
case "$CMD" in *" -F"*) exit 0 ;; esac

# -m 이 없으면 통과
case "$CMD" in *" -m"*) ;; *) exit 0 ;; esac

# 백틱이 없으면 통과
case "$CMD" in *'`'*) ;; *) exit 0 ;; esac

cat >&2 <<'GUARD'
⛔⛔ 커밋 메시지에 백틱(`)이 있다 — bash 가 그걸 «명령으로 실행»한다.

   git commit -m "… `7` 은 8/1 …"   →   bash 가 7 을 실행 → command not found
   ⚠️ **커밋은 성공하고 푸시도 된다.** 그 자리만 «빈칸»이 되어 나중에야 드러난다.

   📌 CLAUDE.md 규칙 24 에 적혀 있는데 2026-08-14·15 이틀 연속 밟았다. 그래서 장치로 막는다.

   👉 우리가 이미 정한 방식대로 — **메시지를 파일로 쓰고 `-F`**:

      cat > /tmp/cm.txt <<'EOF'
      제목 줄

      본문에 `백틱`을 마음껏 쓴다 — 따옴표로 묶은 heredoc 이라 안 돈다
      EOF
      git commit -F /tmp/cm.txt

   ⭐ 백틱이 «진짜로» 필요하면(명령치환) 그건 커밋 메시지에 쓸 일이 아니다.
GUARD
exit 2
