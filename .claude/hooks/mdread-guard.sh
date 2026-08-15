#!/usr/bin/env bash
# ⛔⛔ `sed`·`grep`·`head`·`tail` 로 .md 를 읽는 것도 «세대 가드»에 걸리게 한다. (2026-08-03)
#
#   창업자: *"그리고 가을팩 2개 합쳐서 만들기로 했잖아. 다 얘기끝난건데 **왜 저장이 안되어있고**.. 넌 딴소리 하고"*
#   → **저장은 되어 있었다.** `docs/꾸미기팩-출시계획-한눈에-2026-07-30.md` **252줄**에
#     「2026-08-01 확정 — 팩 상한 70컷 · 가을 두 팩 통합」이 있었다.
#     클로드가 **같은 문서 위쪽(옛 세대)만 읽고** 답했다.
#
# ⛔⛔ **세대 가드(`latest-guard.sh`)는 있었는데 안 떴다** — 그건 `Read` 툴에만 붙어 있고
#   `sed -n '34,66p'` · `grep -n` · `head` 로 읽으면 **그냥 통과한다.**
#   📌 즉 «장치를 만들어 놓고 내가 옆문으로 드나들었다». 이 훅이 그 옆문을 막는다.
#
# ⭐ 막지 않고 «알린다» — 부분 읽기 자체가 나쁜 게 아니라 «맨 아래를 안 보는 것»이 나쁘다.

INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | python3 -c "
import sys,json
try: d=json.load(sys.stdin)
except Exception: sys.exit(0)
print((d.get('tool_input') or {}).get('command',''))
" 2>/dev/null)

printf '%s' "$CMD" | grep -qE '(sed|head|tail|grep|awk|cut)\b[^|]*\.md' || exit 0

# ⭐⭐ [2026-08-13 업그레이드] **시키지 말고 «대신 해준다».**
#   📮 창업자 *"로드맵 우선순위 현행부터 읽기 규칙만들어. 낡게하지말고"*
#   ⛔ 옛 판은 *"먼저 `doc-guard --gen` 을 돌려라"* 라고 «시키기만» 했다.
#      그러면 한 단계가 더 생기고, **그 한 단계를 내가 건너뛴다**(2026-08-13 로드맵을 그렇게 읽었다).
#   ✅ 그래서 훅이 **파일 이름을 뽑아 그 자리에서 돌려** «현행 줄번호»를 바로 찍는다.
#   📌 오늘 `base-guard` 를 「알리기 → 고치기」로 바꾼 것과 «같은 생각»이다.
MD=$(printf '%s' "$CMD" | grep -oE '[^ "'"'"']*\.md' | head -1)

cat <<'EOF'
⚠️⚠️ **`.md` 를 «부분»으로 읽고 있다 — 문서엔 세대가 쌓여 있다.**

  ⛔ 위쪽은 «지나간 판단»이다. **맨 아래 세대가 현행이다.**
EOF

if [ -n "$MD" ]; then
  # 앱 폴더 기준·저장소 기준 둘 다 시도한다(뿌리가 둘이라 — cwd-guard 와 같은 이유)
  for base in "$CLAUDE_PROJECT_DIR/hankki" "$CLAUDE_PROJECT_DIR" .; do
    [ -f "$base/$MD" ] || continue
    OUT=$(cd "$base" 2>/dev/null && node scripts/doc-guard.mjs --gen "$MD" 2>/dev/null) || true
    [ -n "$OUT" ] && { echo; echo "$OUT" | sed 's/^/  /'; }
    break
  done
fi

cat <<'EOF'

  👉 못 찾았으면: tail -n 120 <그 문서>   ← 맨 아래부터 본다

  📌 2026-08-03 사고 — 「가을 두 팩 통합(8/1 확정)」이 252줄에 있었는데
     위쪽만 읽고 «팩 4개»라고 답했다. 같은 날 이런 실수를 세 번 했다.
EOF
exit 0
