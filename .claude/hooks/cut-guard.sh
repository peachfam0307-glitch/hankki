#!/usr/bin/env bash
# ✂️👁 **자르고 나서 «검수판을 안 열어보고» 커밋·푸시하는 것을 막는다.**
#
# 왜 (2026-08-12 · 창업자 *"지금 지저분하게 잘렸어"* → *"까만판에 올려봐. 테두리가 이상해"*):
#   `tools/cut.py` 는 자를 때마다 검수판 넉 장을 «이미 만든다» — 진한 판·빨간 판·의심 판·실제 크기.
#   그리고 출력에 「이 두 장을 열어서 본다」고 «적어» 준다.
#   그런데 나는 **밝은 판 하나만 보고 「깨끗하다」고 창업자에게 보고했다.**
#   창업자가 까만 판을 요구해서야 접시·냄비 아래 흰 얼룩이 드러났다.
#
#   ⛔ 이건 「도구가 모자란 것」이 아니다 — **도구는 다 했고 내가 안 봤다.**
#      창업자: *"좋아 원천적으로 재발하지 않도록 만들어"*
#
# ⭐ 그래서 막는 자리 = **「안 보고 넘어가는」 순간.**
#    자르면 표식을 남기고, **검수판을 Read 로 열 때까지 커밋·푸시를 막는다.**
#
# ⚠️⚠️ **막는 범위를 좁게 둔다** — 같은 날 `base-guard` 가 «모든 bash»를 막아
#    자기가 안내한 복구 명령까지 가둔 적이 있다. 여기서는 **커밋·푸시만** 막는다.
#    조사·측정·빌드·재컷은 다 통과한다(그게 문제를 푸는 길이니까).
set -u
IN=$(cat)
TOOL=$(printf '%s' "$IN" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("tool_name",""))' 2>/dev/null || true)
MARK=/tmp/hankki-cut-unseen

# ① Read 로 «까만 판(진한판)» 을 열었으면 표식을 지운다 — 「봤다」는 증거다.
#    ⭐ 왜 진한 판인가 = 흰 잔재·그림자가 «거기서만» 드러난다(밝은 판에선 안 보인다).
if [ "$TOOL" = "Read" ]; then
  P=$(printf '%s' "$IN" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' 2>/dev/null || true)
  case "$P" in
    *진한판*|*까만판*|*dark*) rm -f "$MARK" ;;
  esac
  exit 0
fi
[ "$TOOL" != "Bash" ] && exit 0

CMD=$(printf '%s' "$IN" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null || true)
[ -z "$CMD" ] && exit 0

# ② 자르는 명령이면 표식을 남긴다(이 훅은 PreToolUse 라 «자르기 직전»에 찍힌다 — 그래도 맞다.
#    자르고 나면 반드시 봐야 하니까).
# ⚠️⚠️ **heredoc 본문은 «명령»이 아니다** (2026-08-13 거짓 표식)
#   CLAUDE.md 에 「자르기 표준 = `python3 tools/cut.py …`」라는 «설명 줄»을 쓰는 python heredoc 을
#   실행했더니, 훅이 그 «글자»를 자르는 명령으로 오인해 표식을 찍었다. 자른 건 하나도 없었다.
#   📌 cwd-guard 가 커밋 메시지 «안»의 경로를 잡은 것과 같은 종류다 — **명령과 「명령을 적은 글」은 다르다.**
#   ✅ heredoc(`<<`) 이 있으면 그 시작 줄부터 잘라내고 본다.
CMD_RUN=$(printf '%s' "$CMD" | sed '/<<[[:space:]]*.\?[A-Za-z_]/,$d')
if echo "$CMD_RUN" | grep -qE 'tools/cut\.py|tools/recut\.py'; then
  echo "자름: $(date '+%H:%M:%S')" > "$MARK"
  exit 0
fi

# ③ 커밋·푸시인데 아직 «까만 판»을 안 열었으면 막는다.
[ ! -f "$MARK" ] && exit 0
echo "$CMD" | grep -qE 'git +([a-z-]+ +)*(commit|push)' || exit 0

cat >&2 <<'EOF'
✂️👁 **자르고 나서 «까만 판»을 아직 안 열어봤다.**

   ⛔ 밝은 판만 보고 「깨끗하다」고 하지 말 것 — **흰 잔재·바닥 그림자는 진한 판에서만 드러난다.**
      2026-08-12 에 정확히 그렇게 해서 창업자가 *"지금 지저분하게 잘렸어"* 로 잡았다.
      접시·냄비 아래에 흰 얼룩이 넓게 퍼져 있었는데 밝은 판에선 하나도 안 보였다.

👉 자른 폴더의 `_검수/` 를 **Read 로 열어서 눈으로** 볼 것:

     _검수/낱개-전체-진한판.png      ← ⭐이걸 열면 이 표식이 풀린다
     _검수/낱개-전체-빨간판.png      (그림 «안»에 갇힌 흰 판)
     _검수/낱개-의심-밝은판.png      (테두리 삐죽삐죽)
     _검수/낱개-실제크기.png         (앱에 보일 크기)

   ⭐ 작은 잔재는 «키워야» 보인다 — 판을 3배로 다시 그려서 보는 것이 확실하다.
   ⚠️ 막는 것은 커밋·푸시뿐이다. 조사·측정·빌드·재컷은 그대로 된다.
EOF
exit 2
