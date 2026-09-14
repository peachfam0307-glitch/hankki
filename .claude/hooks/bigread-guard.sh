#!/usr/bin/env bash
# 📏📏 **큰 .md 를 «통째로» 여는 것을 막는다 — 그게 대화 창을 한 번에 먹는다.**
#
# 📮 창업자 2026-09-03 = *"토큰도 너무 빨리 닳고, 대화 진행도 안되고 스트레스받더라고..."*
#    ＋ *"원천적으로 뿌리를 뽑아야해."*
#
# ⛔⛔ **오늘 문서를 763KB → 188KB 로 줄였는데, 여기가 뚫려 있으면 한 번에 되돌아간다.**
#    `docs/` 에는 아직 이런 것들이 있다 —
#      고정메모-핀.md 270KB · 출시행정-학습 196KB · 기능-아카이브 170KB · 로드맵-우선순위 101KB
#    하나만 통째로 열어도 오늘 줄인 것보다 크다.
#    ⭐ **`고정메모-핀.md` 는 «오늘 내가 만든» 파일이다** — CLAUDE.md 에서 갈라낸 것이라
#       자동으로는 안 들어오지만, `/메모` 가 통째로 읽으면 전보다 나빠진다. 그래서 여기서 막는다.
#
# ⚠️ **`mdread-guard` 는 「옛 세대」만 본다 — «크기»는 아무도 안 봤다.** 이 훅이 그 자리다.
#
# ⭐ **막다른 길이 아니다** — 범위를 짚으면 언제나 통과한다.
#    `sed -n '120,220p'` · `head -80` · `grep -n "찾는 말"` · Read 툴의 offset/limit
#    ⛔ 「통째로」만 막는다. 부분 읽기는 오히려 «권하는» 쪽이다.
set -u
INPUT=$(cat)
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT="${CLAUDE_PROJECT_DIR:-.}"

# 상한 = 60,000 B. 한글 .md 기준 어림 2~3만 토큰 — 한 파일이 창의 십몇 %를 먹는 지점.
LIMIT=60000

# ⛔⛔ **면제 둘 — 안 빼면 막다른 길이 된다** (첫 판이 실제로 그랬다)
#    `HANDOVER.md` = `/안녕` 이 «통째로» 읽어야 하는 파일이다. 여기서 막으면 세션이 시작을 못 한다.
#    `CLAUDE.md`   = 규칙·핀 색인. 고치려면 열어야 한다.
#    ⭐ **둘 다 «자기 게이트»가 따로 있다** — `check-docsize.mjs`(HANDOVER 80/110KB · CLAUDE 150/200KB)
#       ＋ SessionStart 훅이 잰다. 그래서 여기서 또 막을 필요가 없다. 나머지 문서엔 그 게이트가 없다.
면제() { case "$1" in */HANDOVER.md|HANDOVER.md|*/CLAUDE.md|CLAUDE.md) return 0 ;; *) return 1 ;; esac; }

PATHS=$(printf '%s' "$INPUT" | python3 "$HERE/_bigread-paths.py" 2>/dev/null)
[ -n "$PATHS" ] || exit 0

HIT=''
while IFS= read -r p; do
  [ -n "$p" ] || continue
  면제 "$p" && continue
  f="$p"; [ -e "$f" ] || f="$ROOT/$p"
  [ -e "$f" ] || continue
  sz=$(wc -c < "$f" 2>/dev/null || echo 0)
  [ "$sz" -gt "$LIMIT" ] && HIT="$HIT$p|$sz
"
done <<EOF
$PATHS
EOF

[ -n "$HIT" ] || exit 0

{
  echo "📏📏 **이 문서는 «통째로» 열기엔 너무 크다 — 대화 창을 한 번에 먹는다.**"
  echo ""
  printf '%s' "$HIT" | while IFS='|' read -r p sz; do
    [ -n "$p" ] || continue
    echo "   ⛔ $p — $(printf "%'d" "$sz" 2>/dev/null || echo "$sz") B (상한 $(printf "%'d" $LIMIT 2>/dev/null || echo $LIMIT) B)"
  done
  cat <<'MSG'

   👉 **자리를 «찾아서» 그 대목만 읽는다** (이게 더 빠르기도 하다)
      grep -n "<찾는 말>" <파일>          ← 몇 행에 있나
      sed -n '120,220p' <파일>            ← 그 대목만
      Read 툴이면 offset·limit 을 준다

   📌 2026-09-03 에 문서를 763KB → 188KB 로 줄였다. 큰 것 하나를 통째로 열면 그게 한 번에 되돌아간다.
   ⛔ 상한을 올려서 통과시키지 말 것 — 그건 게이트를 끄는 것이다.
MSG
} >&2
exit 2
