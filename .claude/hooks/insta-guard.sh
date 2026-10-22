#!/usr/bin/env bash
# 📸 인스타 «새 글» — 창업자가 인스타에 올린다/올렸다고 하면 그 날짜를 적어 두고, 굽기 때 막는다.
#    (창업자 2026-10-22 = *"내가 인스타 올린다고 하면 너가 까먹지말고 구울때 새로 좀 넣어줘"*)
#    뿌리 = 10/21 ④편 릴스를 올렸는데 INSTA_NEW_AT 에 안 넣고 77판을 구웠다.
#    📌 말로 들은 건 대화가 요약되면 사라진다 → 파일(hankki/scripts/insta-posted.json)에 남긴다.
#    짝 = bake-guard.sh 가 그 파일의 날짜가 version.js INSTA_NEW_AT 에 없으면 굽기를 막는다.
# ⛔ bash 변수명은 ASCII 로 (CLAUDE.md 규칙 24)
set -u
IN=$(cat 2>/dev/null || true)
printf '%s' "$IN" | grep -qE '인스타|릴스|캐러셀' || exit 0
printf '%s' "$IN" | grep -qE '올렸|올릴|올린|게시|업로드' || exit 0
F="$CLAUDE_PROJECT_DIR/hankki/scripts/insta-posted.json"
D=$(TZ=Asia/Seoul date +%F)
python3 - "$F" "$D" <<'PY'
import json,sys,os
f,d=sys.argv[1],sys.argv[2]
j=json.load(open(f)) if os.path.exists(f) else {"_왜":"창업자가 인스타에 올린다고 말한 날(KST) — bake-guard 가 INSTA_NEW_AT 에 없으면 굽기를 막는다. 날짜가 틀리면(올린 날이 다르면) 손으로 고친다.","날":[]}
if d not in j["날"]: j["날"].append(d); json.dump(j,open(f,"w"),ensure_ascii=False,indent=2); open(f,"a").write("\n")
PY
cat <<MSG
📸 **인스타 새 글 — 창업자가 올린다/올렸다고 했다 ($D 적어 둠 → hankki/scripts/insta-posted.json)**
   👉 \`hankki/src/version.js\` 의 \`INSTA_NEW_AT\` 에 «올린 날»을 넣는다 (다른 날이면 json 도 고친다)
   🍎 안 넣으면 다음 아이폰 굽기가 막힌다(bake-guard).
MSG
exit 0
