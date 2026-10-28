#!/usr/bin/env bash
# 💳 힉스필드 크레딧 — [창업자 2026-10-28] *"11월 21일까지 200크레딧으로 다써야해 아껴써야해 실수는 최소화하고"*
#    *"힉스필드 규칙 저장하고 쓸때마다 반영하도록 도구에 넣어둬"*
# 규칙 전문 = hankki/docs/음식아이콘-프롬프트-2026-10-28.md 맨 아래 「200크레딧」 절
# 막는 것: ① 그림·영상 count 2 이상(한 편에 1장) ② FLUX 영상(10/28 30크레딧·엉뚱한 장면)
#          ③ 영상인데 get_cost 로 값을 안 잰 첫 호출(같은 세션 표식 /tmp/hankki-hf-cost-ok)
# ⛔ bash 변수명은 ASCII 로 (CLAUDE.md 규칙 24)
set -u
IN=$(cat)
R=$(printf '%s' "$IN" | python3 -c '
import sys,json
d=json.load(sys.stdin); n=d.get("tool_name",""); t=d.get("tool_input",{}) or {}
reqs=t.get("requests") or [{"params":t.get("params",t)}]
bad=[]
for r in reqs:
  p=r.get("params") or {}
  if isinstance(p,str): continue
  if int(p.get("count",1) or 1)>1: bad.append("count2")
  if "flux_3_video" in str(p.get("model","")): bad.append("flux")
  if "video" in n and not p.get("get_cost"): bad.append("video")
  if p.get("get_cost"): bad.append("costok")
print(" ".join(sorted(set(bad))))
' 2>/dev/null || true)
case " $R " in *" costok "*) touch /tmp/hankki-hf-cost-ok; exit 0;; esac
MSG=""
case " $R " in *" count2 "*) MSG="$MSG\n   ⛔ count 2 이상 — 한 편에 1장만(고를 일이면 창업자에게 먼저 묻는다)";; esac
case " $R " in *" flux "*) MSG="$MSG\n   ⛔ FLUX 영상 금지 — 10/28 30크레딧에 엉뚱한 장면 · 영상은 kling3_0_turbo";; esac
case " $R " in *" video "*) [ -f /tmp/hankki-hf-cost-ok ] || MSG="$MSG\n   ⛔ 영상은 먼저 get_cost:true 로 값을 잰다(이 세션 첫 영상)";; esac
[ -z "$MSG" ] && exit 0
printf '💳⛔ 힉스필드 크레딧 규칙(창업자 2026-10-28 · 11/21까지 200크레딧)%b\n   📄 hankki/docs/음식아이콘-프롬프트-2026-10-28.md 맨 아래\n   ✅ 다 쓰면 balance 로 남은 크레딧을 재서 창업자에게 한 줄로 말한다\n' "$MSG" >&2
exit 2
