#!/usr/bin/env bash
# ⛔⛔⛔ [절대원칙] 제보를 받으면 «어디의 무엇인지» 먼저 «물어보고» 시작한다. 추측 금지.
#   창업자 2026-08-14: *"다음부터는 나한테 정확히 물어보고 시작해. 네가 추측하지말고. 이것도 절대원칙이야."*
#
# ⛔ 그날 사고 — 창업자 *"스크롤하면 덜덜거리자나 회색막대기가"* 를 받고
#    나는 «어느 막대인지» 안 묻고 **세로 막대**라고 추측해서 고치기 시작했다.
#    진짜는 **가로 막대**였다. → v10.68 · 69 · 70 · 71 **네 판을 헛으로 냈다.**
#    ⭐ 창업자는 첫 마디에 이미 답을 줬다 — *"걔는 고정이어야하는데 스크롤하면 움직이니까"*.
#       가로 막대는 «자기 줄»에 붙어 있어야 한다는 뜻이었는데 내가 다르게 읽었다.
#    📌 **한 마디만 물었으면 하루가 안 날아갔다.**
#
# ⚠️ 「알려주기」로는 부족하다(오늘 알려주는 훅이 여럿 떴는데도 그냥 갔다) → **막는다.**
#
# 하는 일 두 갈래
#   ⑴ UserPromptSubmit : 창업자 말이 «제보»처럼 읽히면 표식을 남긴다
#   ⑵ PreToolUse(Edit|Write) : 표식이 있는데 **앱 소스**를 고치려 하면 «막는다»
#      ⭐ 재현·측정·문서는 «안» 막는다 — 물어보기 «전»에도 재보는 건 좋은 일이다.
#
# 🚪 푸는 길 = **창업자의 다음 말**이 표식을 지운다(＝내가 물었고 답을 받았다).
#    ⛔ 내가 스스로 못 푼다. 그게 이 장치의 전부다.
set -uo pipefail
# ⛔⛔ bash 변수명은 **ASCII 만** — 한글로 쓰면 대입이 «명령»으로 해석돼 훅이 통째로 죽는다.
#    (CLAUDE.md 규칙 24 에 박혀 있는 함정인데 이 훅을 만들며 또 밟았다. 주석·메시지의 한글은 괜찮다.)
MARK=/tmp/hankki-제보-확인대기
MODE="${1:-prompt}"

if [ "$MODE" = "prompt" ]; then
  MSG=$(cat 2>/dev/null | tr -d '\000' | head -c 4000)
  # 표식이 이미 있으면 = 이건 «내 물음에 대한 답»이다 → 지우고 통과
  if [ -f "$MARK" ]; then rm -f "$MARK"; exit 0; fi
  # 제보처럼 읽히는 말 (증상어)
  if printf '%s' "$MSG" | grep -qE '덜덜|떨린|떨려|이상해|이상함|안돼|안 돼|안된|먹통|깨져|깨진|잘려|잘림|버그|오류|틀렸|안보여|안 보여|사라졌|겹쳐|밀려|느려|버벅'; then
    printf '%s' "$MSG" > "$MARK"
    cat <<'EOM'
🛑🛑 **제보다 — 고치기 «전»에 창업자에게 «정확히» 물어라.** (절대원칙 · 창업자 2026-08-14)

   ⛔ 2026-08-14 사고: *"스크롤하면 덜덜거리자나 회색막대기가"* 를 받고 «어느 막대인지» 안 묻고
      **세로 막대**로 추측해 고쳤다. 진짜는 **가로 막대**였고 **네 판(v10.68~71)을 헛으로 냈다.**

   👉 **이 셋을 먼저 묻는다 (짧게, 한 번에):**
      ① **어디** — 어느 화면·어느 자리인가 (홈? 레시피? 그 안 어디?)
      ② **무엇** — 무엇이 그러는가 (그 「막대」가 가로인가 세로인가처럼, 물건을 콕 집어)
      ③ **어떻게** — 어떻게 보이는가 (늦게 온다 / 튄다 / 깜빡한다 / 아예 안 움직인다)

   ✅ 물어보기 «전»에 해도 되는 것 = 재현·측정·코드 읽기 (오히려 하는 게 좋다)
   ⛔ 물어보기 «전»에 하면 안 되는 것 = **앱 소스 고치기**(hankki/src) — 훅이 막는다
   🚪 창업자가 답하면 표식이 저절로 풀린다.
EOM
  fi
  exit 0
fi

# ⑵ 앱 소스를 고치려는 순간
[ -f "$MARK" ] || exit 0
IN=$(cat 2>/dev/null | tr -d '\000')
FPATH=$(printf '%s' "$IN" | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')

# 🚪🚪 **푸는 길이 막혀 있었다 — 2026-08-14 밤에 실제로 걸렸다(규칙 19 · 오늘 세 번째).**
#   ⛔ 창업자가 *"오늘 만들어보고 고칠 게 뭐야?"* 에 답을 줬는데 그 답 안의 「5분은 **안돼**」가
#      증상어에 걸려 표식이 «새로» 생겼고, 그 뒤 턴 «중간»에 보낸 말 넷은 `UserPromptSubmit` 을
#      안 타서 표식을 못 지웠다. → **묻고 답을 받았는데도 영영 안 풀린다 = 막다른 길.**
#   ✅ 그래서 «두 번째 해제 통로»를 둔다 — **표식이 생긴 뒤 창업자 말이 또 왔으면 푼다.**
#      transcript 에는 턴 중간 메시지도 남으므로 거기서 «표식 mtime 이후의 user 줄»을 센다.
#   ⛔ 여전히 내가 «스스로» 풀지는 못한다 — 창업자가 말을 해야만 열린다. 설계는 그대로다.
#   ⚠️⚠️ **그런데 transcript 만으론 모자랐다** — 턴 «중간»에 온 말은 턴이 끝나야 파일에 쓰인다.
#      그래서 「지금 답을 받았는데 아직 기록이 없는」 순간에는 여전히 막힌다(2026-08-14 밤에 실측).
#      ✅ 그래서 두 번째 통로를 하나 더 둔다 — **창업자 답변 «원문»을 적으면 열린다.**
#         archive-guard·evidence-guard 와 같은 생각이다: 스스로 열려면 **없는 말을 지어내야** 한다.
#           printf '%s' '<창업자가 방금 한 말 그대로>' > /tmp/hankki-제보-답변
#      ⛔ 「알겠다」·「확인함」 같은 빈 말은 안 된다 — 30자 넘는 «창업자 문장»이라야 한다.
ANS=/tmp/hankki-제보-답변
if [ -f "$ANS" ] && [ "$(wc -c < "$ANS" 2>/dev/null || echo 0)" -gt 30 ]; then
  echo "🚪 창업자 답변이 적혀 있다 — 물었고 답을 받았다고 보고 푼다: $(head -c 80 "$ANS")" >&2
  rm -f "$MARK" "$ANS"
  exit 0
fi

TP=$(printf '%s' "$IN" | grep -oE '"transcript_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
if [ -n "$TP" ] && [ -f "$TP" ]; then
  if [ "$TP" -nt "$MARK" ] && tail -c 200000 "$TP" 2>/dev/null | grep -q '"type"[[:space:]]*:[[:space:]]*"user"'; then
    NEWER=$(python3 - "$TP" "$MARK" <<'PY' 2>/dev/null
import json, os, sys
tp, mk = sys.argv[1], sys.argv[2]
t0 = os.path.getmtime(mk)
n = 0
try:
    with open(tp, encoding='utf-8', errors='ignore') as f:
        for line in f:
            try: d = json.loads(line)
            except Exception: continue
            if d.get('type') != 'user': continue
            c = d.get('message', {}).get('content')
            # 도구 결과가 아니라 «사람이 친 말»만 센다
            if isinstance(c, str) and c.strip(): pass
            elif isinstance(c, list) and any(x.get('type') == 'text' for x in c if isinstance(x, dict)): pass
            else: continue
            ts = d.get('timestamp')
            if not ts: continue
            import datetime
            try: e = datetime.datetime.fromisoformat(ts.replace('Z', '+00:00')).timestamp()
            except Exception: continue
            if e > t0 + 1: n += 1
except Exception: pass
print(n)
PY
)
    if [ -n "${NEWER:-}" ] && [ "$NEWER" -gt 0 ] 2>/dev/null; then
      echo "🚪 표식 뒤에 창업자 말이 ${NEWER}번 더 왔다 — 물었고 답을 받았다고 보고 푼다." >&2
      rm -f "$MARK"
      exit 0
    fi
  fi
fi
case "$FPATH" in
  *hankki/src/*) ;;
  *) exit 0 ;;
esac
cat >&2 <<EOM
🛑 **아직 «묻지» 않았다 — 앱 소스를 고칠 수 없다.** (절대원칙 · 창업자 2026-08-14)

   막힌 파일 : $FPATH
   방금 온 제보 : $(head -c 200 "$MARK")

   👉 **먼저 이 셋을 묻는다** — ①어디(화면·자리) ②무엇(가로냐 세로냐처럼 물건을 콕) ③어떻게(늦다/튄다/깜빡/안 움직인다)
   ✅ 재현·측정·코드 읽기·문서·검사 스크립트는 **안 막는다.** 물어보기 전에 재보는 건 좋은 일이다.
   🚪 창업자가 답하면 저절로 풀린다. ⛔내가 스스로 풀지 않는다 — 그게 이 장치의 전부다.

   ⛔ 2026-08-14: 안 묻고 추측해서 **v10.68·69·70·71 네 판을 헛으로 냈다.**
EOM
exit 2
