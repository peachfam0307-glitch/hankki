#!/usr/bin/env python3
# 📄 도구 입력(JSON)에서 «실행하려는 명령»만 뽑아 찍는다. (mdread-guard 용)
#
# ⭐⭐ **왜 파일로 뺐나** (2026-08-15 · 창업자 *"왜 자꾸 백틱을 밟아? 이것도 해결해"*)
#    전엔 이 코드가 mdread-guard.sh 안에 큰따옴표로 «싸여» 들어 있었다.
#    bash 큰따옴표 «안»이라 —
#      · 백틱          → 명령으로 «실행»된다
#      · 큰따옴표      → 그 자리에서 블록이 «닫힌다»
#      · $(…) · $변수  → 치환된다
#    ⛔ 같은 구조로 archive-guard 가 하루에 두 번 깨졌고, 그때마다 **훅이 조용히 통과**했다.
#       (막는 게 일인 훅이 «안 막고 통과»하는 것이 제일 나쁘다.)
#    ⭐ 파일로 빼면 bash 가 이 안을 «아예 안 본다». 지뢰가 사라진다.
#
# 🔒 게이트 = hankki/scripts/check-hookinline.mjs (npm run smoke) — 큰따옴표 블록이 되살아나면 배포가 막힌다.
#
# 나가는 값 = 명령 한 줄. 못 읽으면 아무것도 안 찍는다.
import sys, json

try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit(0)

print((d.get('tool_input') or {}).get('command', ''))
