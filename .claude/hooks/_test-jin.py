#!/usr/bin/env python3
# 🧪 보관소 지킴이 시험용 — 도구 이름·입력을 훅이 받는 JSON 모양으로 찍는다.
#   ⛔ 이걸 `python3 -c "…"` 로 훅 스크립트 «안»에 두면 안 된다 —
#      bash 큰따옴표 안이라 백틱·달러·큰따옴표가 다 살아 움직인다(check-hookinline 이 잡는 그 지뢰).
#   ⭐ 파일로 빼면 bash 가 이 안을 아예 안 본다.
import sys, json
print(json.dumps({'tool_name': sys.argv[1], 'tool_input': json.loads(sys.argv[2])}))
