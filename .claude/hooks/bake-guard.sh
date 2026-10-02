#!/usr/bin/env bash
# 🍎🍎 **아이폰 굽기(`[testflight]`) «전»에 빈칸을 창업자에게 청했나 — 안 했으면 막는다.** (창업자 2026-10-02 「ㅇㅇ 관문 만들어」)
#
# 뿌리 = *"아니 아까 달라고 하지 올리기전에."* — 62판을 굽고 제출까지 한 «뒤»에 10/10 원재료 캡처·재료 링크를 청했다.
#   아이폰은 구운 판이 심사·승인까지 며칠 산다 → 그 사이 열리는 것이 빈 채로 나간다(웹처럼 바로 못 고친다).
#   브리핑에 「원재료 캡처 받아라」가 떠 있었는데도 지나쳤다 → 알리기로는 안 됐다. 막는다.
#
# ⭐ 막는 자리 = `[testflight]` 가 든 git commit·push 명령 «하나»뿐. 나머지 bash 는 안 건드린다.
# ⭐ 판정 = `release-calendar.mjs --bake` (14일 안 빈칸 · ⛔여기서 다시 세지 않는다)
# 🚪 푸는 길 = 빈칸을 채우거나, 창업자가 목록을 보고 「그대로 구워」 → `--bake-ok "<창업자 말>"` (오늘 하루)
# ⛔ 내가 스스로 `--bake-ok` 를 부르지 않는다 — 창업자 말이 있을 때만.
set -u
IN=$(cat)
CMD=$(printf '%s' "$IN" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null || true)
# ⚠️ [2026-10-02] 처음엔 「[testflight] 글자가 든 커밋」을 다 막았다 → 이 관문을 «설명하는» 커밋까지 막혔다.
#    그래서 «진짜 굽기» 둘만 본다 = ① 커밋 제목이 [testflight] 로 «시작» ② 아이폰 갈래(annyeong)로 푸시
BAKE=0
case "$CMD" in
  *"git commit"*'-m "[testflight]'*|*"git commit"*"-m '[testflight]"*) BAKE=1 ;;
  *"git push"*"annyeong-yoi12y"*) BAKE=1 ;;
esac
[ "$BAKE" = 1 ] || exit 0
OUT=$(node "$CLAUDE_PROJECT_DIR/hankki/scripts/release-calendar.mjs" --bake 2>&1)
RC=$?
if [ "$RC" -ne 0 ]; then
  TODAY=$(TZ=Asia/Seoul date +%F)
  if grep -q "^${TODAY}	" /tmp/hankki-bake-ack 2>/dev/null; then exit 0; fi
  printf '%s\n' "$OUT" >&2
  printf '\n🍎 ⛔ 아이폰 굽기 막음 — 위 목록을 창업자에게 «한 번에» 보여주고 받은 뒤 굽는다. (창업자 2026-10-02 「올리기전에」)\n' >&2
  exit 2
fi
exit 0
