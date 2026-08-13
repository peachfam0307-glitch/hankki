#!/usr/bin/env bash
# 🗄🗄 **보관소 접근 금지 — 창업자가 지시할 때만 연다.** (창업자 절대원칙 2026-08-13)
#
#   📮 창업자 원문 = *"내가 지시하지 않으면 **옛날 보관소에는 접근금지.**"*
#      그 앞에 = *"이거 저장소로 옮기면 **또 여기가서 읽고 오는거 아냐?**"*
#
# ⛔⛔ **왜 「읽기 목록에서 빼기」로는 모자란가**
#   같은 날 CLAUDE.md 의 옛 버전 기록 623줄을 `docs/버전기록-전체.md` 로 옮기고
#   `hello-read.mjs` 가 그 문서를 「읽어라」 목록에서 빼게 했다. **그건 «권하지 않는 것»일 뿐이다.**
#   뭘 찾다가 `grep` 으로 걸리거나 그냥 `Read` 로 열면 **그대로 옛 판을 읽는다.**
#   📌 CLAUDE.md 에 있을 때와 «똑같은 사고»가 난다 — 자리만 옮기고 위험은 그대로.
#
# ⭐ **판정은 두 가지** — 경로(`_archive`·`_아껴둠`·`_구판`) 또는 문서가 스스로 붙인 「🗄 **보관소」 표시.
#   경로만 보면 새 보관소가 생길 때마다 여기를 고쳐야 하고 **반드시 낡는다**(오늘 실제로 그랬다).
#   **붙이는 쪽이 아는 게 맞다** → 문서 앞 40줄에 표시를 둔다.
#
# ⚠️ **푸는 길이 이 게이트를 통과하는지 확인했다** (2026-08-13 하루에 두 번 밟은 실수)
#   허가 표식을 만드는 `echo`·`printf` 는 .md 를 읽지 않으므로 «안 막힌다». 막다른 길이 아니다.
#
# ⛔⛔ **첫 판이 «모든 .md 읽기»를 막았다 — bash 변수명에 한글을 썼기 때문이다.**
#   `읽는것=…` 이 변수 대입이 아니라 «명령»으로 해석돼서, 판정이 한 줄도 안 돌고 늘 차단됐다.
#   📌 **bash 변수명은 ASCII 로.** 주석·메시지는 한글이어도 된다.
#
# ⭐ 탈출구에 **창업자 지시 원문을 적게** 한 이유 = 스스로 열려면 «없는 말을 지어내야» 한다.
#   evidence-guard 와 같은 생각이다. 완벽히는 못 막지만 **무심코 여는 것**을 막는 게 목적이다.

INPUT=$(cat)

TARGETS=$(printf '%s' "$INPUT" | python3 -c "
import sys, json, re
try: d = json.load(sys.stdin)
except Exception: sys.exit(0)
ti = d.get('tool_input') or {}
tool = d.get('tool_name') or ''
if tool == 'Read':
    print(ti.get('file_path') or '')
elif tool == 'Bash':
    cmd = ti.get('command') or ''
    # .md 를 «읽는» 명령만 본다 — 쓰기(>)·git 은 대상이 아니다
    if not re.search(r'\b(sed|head|tail|grep|awk|cut|cat|less|more)\b', cmd): sys.exit(0)
    for m in re.finditer(r'[\w./가-힣_-]+\.md', cmd):
        print(m.group(0))
")

[ -n "$TARGETS" ] || exit 0

ALLOW=/tmp/hankki-보관소-허가
BLOCKED=""
while IFS= read -r f; do
  [ -n "$f" ] || continue
  for p in "$f" "/home/user/hankki/$f" "/home/user/hankki/hankki/$f"; do
    [ -f "$p" ] || continue
    kind=""
    case "$p" in *_archive*|*_아껴둠*|*_구판*) kind="경로" ;; esac
    if [ -z "$kind" ] && head -40 "$p" 2>/dev/null | grep -q '🗄 \*\*보관소'; then kind="표시"; fi
    [ -n "$kind" ] && BLOCKED="${BLOCKED}   ⛔ ${p}  (${kind})
"
    break
  done
done <<< "$TARGETS"

[ -n "$BLOCKED" ] || exit 0

if [ -f "$ALLOW" ]; then
  echo "🗄 보관소를 연다 — 창업자 지시: $(head -1 "$ALLOW")" >&2
  exit 0
fi

{
  echo "🗄🗄 **보관소다 — 창업자가 지시할 때만 연다.** (절대원칙 2026-08-13)"
  echo ""
  printf '%s' "$BLOCKED"
  echo ""
  echo "   📮 창업자 *\"내가 지시하지 않으면 옛날 보관소에는 접근금지.\"*"
  echo ""
  echo "   ⛔ 여기 있는 건 **옛 판**이다. 읽고 그대로 쓰면 «옛날꺼 읽어서 실수하는» 그 사고가 그대로 난다."
  echo "      CLAUDE.md 에서 덜어낸 이유가 정확히 그거였다."
  echo ""
  echo "   ✅ **지금 규칙·핀은 CLAUDE.md 에 있다.**  최신 문서 = node hankki/scripts/hello-read.mjs"
  echo "   ✅ 「이미 정한 것」을 찾는 거면 → node hankki/scripts/decided.mjs \"<핵심어>\""
  echo ""
  echo "   👉 **창업자가 열라고 했다면** — 그 지시 원문을 적어 표식을 만든다(이 세션에만):"
  echo "      echo '<창업자 지시 원문>' > $ALLOW"
} >&2
exit 2
