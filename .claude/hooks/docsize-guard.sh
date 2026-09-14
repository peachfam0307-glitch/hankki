#!/usr/bin/env bash
# 📏 세션이 «시작할 때» 문서 크기를 재서, 넘어 있으면 이 세션에 넘긴다.
#
# 📮 창업자 2026-09-03 = *"한 세션이 계속 정리안하면 **다른세션이 정리한다거나 브레이크를 건다거나**"*
#    ⭐ 이 훅이 그 「다른 세션이 정리한다」다. `check-docsize.mjs` 가 「브레이크」다.
#
# ⛔ 무슨 일이 있었나 — HANDOVER.md 가 11일 만에 9KB → 301KB(32배), CLAUDE.md 는 461KB.
#    합쳐 763KB 라 **대화를 열자마자 창이 찼다.** 늘리는 사람만 있고 줄이는 사람이 없었다.
#    앞 세션이 컨텍스트가 차서·창업자가 멈춰서·그냥 잊어서 안 치우고 나가면 아무도 안 치웠다.
#    👉 그래서 **다음 세션이 시작할 때 자동으로 잰다.** 넘어 있으면 그 세션이 치우고 시작한다.
#
# ⚠️ **넘었을 때만 말한다.** 멀쩡하면 한 글자도 안 찍는다 —
#    세션 시작 안내가 길어지면 그것 자체가 대화 창을 먹는다(고치려는 병을 훅이 앓으면 안 된다).
set -u
# ⛔⛔ **[2026-09-03 · 재현판이 잡음] `CLAUDE_PROJECT_DIR` «만» 믿으면 안 된다.**
#    첫 판이 `cd "${CLAUDE_PROJECT_DIR:-.}"` 였다. 그 변수가 없거나 cwd 가 다르면
#    `hankki/scripts/check-docsize.mjs` 를 «못 찾고 조용히 exit 0» 한다.
#    📌 이 저장소가 두 번 당한 그 꼴이다 — **「훅이 조용히 통과」가 제일 나쁘다**(규칙 18 ⓘ).
#       게이트가 없는 것보다, 있다고 «믿는데» 안 도는 게 나쁘다.
#    ✅ 그래서 **자기 파일 위치**에서 뿌리를 찾는다(.claude/hooks → 두 칸 위). 변수는 «참고»만.
HERE=$(cd "$(dirname "$0")" && pwd)
for R in "${CLAUDE_PROJECT_DIR:-}" "$HERE/../.." "$PWD" "$PWD/.."; do
  [ -n "$R" ] || continue
  if [ -f "$R/hankki/scripts/check-docsize.mjs" ]; then cd "$R" && break; fi
done
[ -f hankki/scripts/check-docsize.mjs ] || exit 0

OUT=$(node hankki/scripts/check-docsize.mjs 2>/dev/null)
# 초록불(⚠️·⛔ 가 한 줄도 없음)이면 조용히 나간다
printf '%s' "$OUT" | grep -qE '⚠️|⛔' || exit 0

cat <<'MSG'
📏📏 **문서가 대화 창을 먹고 있다 — 앞 세션이 안 치우고 나갔다. 이 세션이 치운다.**
MSG
printf '%s\n' "$OUT" | grep -E '✅|⚠️|⛔|👉' | sed 's/^/   /'
cat <<'MSG'

   👉 **일 시작 «전»에 이것부터** (읽고 판단할 필요 없다 — 도구가 가른다)
      node hankki/scripts/doc-trim.mjs            # 👀 뭘 옮길지 보여준다
      node hankki/scripts/doc-trim.mjs --옮김      # ✂️ 옮긴다 (⛔지우지 않는다 · 줄 수를 스스로 검산)

   ⛔ **문턱 숫자를 올려서 통과시키지 말 것** — 그건 게이트를 끄는 것이다.
      📌 2026-09-03 사고 = 막으라고 만든 게이트가 «죽은 글자»를 세느라 3주간 초록불을 찍었고,
         그동안 CLAUDE.md 가 461KB 까지 자랐다. 「통과했나」가 아니라 «무엇을 보고 통과했나».
MSG
exit 0
