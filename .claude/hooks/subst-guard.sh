#!/usr/bin/env bash
# 🔒 조용한 실패 훅 — 「못 찾아도 아무 말 없는」 문자열 치환을 막는다.
#
# 왜 (2026-08-02 사고): 창업자가 두부 양을 고치라 했고 나는 파이썬 `s.replace(옛것, 새것)` 을 돌렸다.
#   찾을 문자열이 화면과 «한 글자» 달랐다(`\n\n` 이 글자로 새어 있었다).
#   → `str.replace` 는 못 찾아도 원문을 그대로 돌려준다. 파일은 저장됐고, 나는 "고쳤어"라고 말했고,
#     실제로는 안 고쳐졌다. 창업자가 화면에서 볼 때까지 아무도 몰랐다.
#   ⭐ 뿌리 = **실패가 성공처럼 보인다.**
#
# ⭐ 왜 규칙이 아니라 훅인가 (창업자 2026-07-31: *"규칙만 만들면 뭐해 안지키는데"*)
#   "다음엔 확인하자"는 결국 기억이다. 훅은 잊어도 막는다.
#
# 막는 것 = **파일에 되쓰는 치환 중 실패를 안 알려주는 것**
#   · `sed -i`            (패턴이 안 맞아도 exit 0)
#   · 파이썬 `.replace(` + 쓰기(`'w'`)  (못 찾아도 exit 0)
# 안 막는 것(일부러) = 화면에만 뿌리는 sed/`.replace()` · Edit 툴(스스로 에러를 낸다) · 표준 도구
#   📌 시끄러운 게이트는 죽은 게이트다. **되쓰는 것만** 잡는다.
set -u
IN=$(cat)
CMD=$(printf '%s' "$IN" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("tool_input",{}).get("command",""))' 2>/dev/null || true)
[ -z "$CMD" ] && exit 0

# 우리 안전한 도구를 쓰는 중이면 통과
case "$CMD" in *tools/subst.py*) exit 0 ;; esac

HIT=""
# ① sed -i  (자리바꿈 -i.bak 도 포함)
case "$CMD" in
  *"sed -i"*|*"sed --in-place"*|*"sed -e -i"*) HIT="sed -i" ;;
esac
# ② 파이썬: .replace( 와 쓰기 모드가 «같은 명령 안에» 있으면 = 파일에 되쓰는 치환
if [ -z "$HIT" ]; then
  case "$CMD" in
    *".replace("*)
      case "$CMD" in
        *"'w'"*|*'"w"'*|*"write_text"*|*".write("*) HIT="python .replace() → 파일 쓰기" ;;
      esac ;;
  esac
fi
[ -z "$HIT" ] && exit 0

cat >&2 <<MSG
⛔ 조용히 실패하는 치환이다 — $HIT

  못 찾아도 «아무 말 없이» 원문 그대로 저장된다.
  그러면 「고쳤다」고 말하게 되고, 창업자가 화면에서 볼 때까지 아무도 모른다.
  (2026-08-02 두부 사고가 정확히 이거였다 — \\n 이 글자로 새어 문자열이 한 글자 달랐다)

  👉 대신 이걸 쓴다 — 못 찾으면 «죽고», 비슷한 줄까지 찾아준다:

     python3 tools/subst.py <파일> --old '옛 문자열' --new '새 문자열'
     python3 tools/subst.py <파일> --old '…' --new '…' --dry     # 미리보기
     python3 tools/subst.py <파일> --old-file a.txt --new-file b.txt   # 여러 줄

  👉 한두 군데면 그냥 **Edit 툴**을 써도 된다 — 못 찾으면 스스로 에러를 낸다.

  ⚠️ 파일을 «먼저 읽어» 실제 글자를 확인할 것. 화면에 보이는 것과 파일 속 글자가 다를 수 있다.
MSG
exit 2
