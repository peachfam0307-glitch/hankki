#!/usr/bin/env bash
# 🎬🏪 **인스타 릴스 — 스토어 스샷 8장 넘겨보기** 2026-09-03
#
# 📮 창업자 = *"이 스샷도 릴스로 만들어줄수있어?"* · *"샤랄라 추가해서."*
#             *"진한 색 클레이나 토프같은걸로 위 아래 채워도 되고"*
#             *"애들 가을 스티커 코믹한거 한장에 하나씩 붙이면 좋지 가을에"* · *"카롱도 추가하자"*
#
# 🧱 재료 = `node scripts/_판-스샷인스타-0903.mjs` 가 만드는 `릴스-9x16/` 여덟 장
#    · 클레이 매트(#c2a288) ＋ 둥근 카드 ＋ 가을 친구 하나씩(카롱 넷 · 곰펭 넷)
#    · 카드는 **안전지대(y 230~1536)** 안에 통째로 — 인스타가 위 230·아래 384 를 덮는다
#
# ✨ 반짝임 = `SET=스샷 node scripts/_판-반짝임-0903.mjs` (⭐«도는» 벌 — 2초마다 안 꺼진다)
#    ⛔ 레꾸 릴스용 기본 벌은 첫·끝이 «비어» 있어서 여기 쓰면 2초마다 맥박처럼 뛴다.
#
# 🔀 넘김 = `xfade=slideleft` 0.35초 — **캐러셀을 손으로 넘기는 것과 같은 몸짓**이라 뜻이 통한다
#    🔢 길이 = 8장 × 2.2초 − 7번 × 0.35초 = **15.15초**
#    ⛔ `xfade` 의 `offset` 은 «누적»이다 — (장길이 − 넘김) 씩 더해 간다. 하나만 어긋나도 뒤가 다 밀린다.
#
# 쓰는 법 = bash design/promo/인스타-2509/조립-스샷릴스.sh
set -euo pipefail
# ⛔ bash 변수 이름은 반드시 ASCII (CLAUDE.md 규칙 24)
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$HERE/../../.." && pwd)"
FF="$APP/node_modules/ffmpeg-static/ffmpeg"
CARDS="${CARD_DIR:-/tmp/hankki-스샷인스타/릴스-9x16}"
SPARK="${SPARK_DIR:-/tmp/hankki-반짝임-스샷}"
OUTF="${OUT:-/tmp/hankki-릴스-스토어스샷.mp4}"
DUR="${DUR:-2.2}"      # 한 장 머무는 시간
TR="${TR:-0.35}"       # 넘김 시간

mapfile -t PICS < <(ls "$CARDS"/*.png | sort)
[ "${#PICS[@]}" -eq 8 ] || { echo "⛔ 카드가 8장이 아니다 (${#PICS[@]}장) — node scripts/_판-스샷인스타-0903.mjs 먼저"; exit 1; }
[ -f "$SPARK/000.png" ] || { echo "⛔ 반짝임이 없다 — SET=스샷 node scripts/_판-반짝임-0903.mjs"; exit 1; }

INARGS=()
for p in "${PICS[@]}"; do INARGS+=(-loop 1 -t "$DUR" -i "$p"); done
INARGS+=(-stream_loop 7 -framerate 60 -start_number 0 -i "$SPARK/%03d.png")

# 장마다 아주 옅은 줌인 — 정지 그림 여덟 장을 그냥 세워 두면 죽은 화면이 된다
# ⛔ zoompan 의 d 는 「입력 한 장을 몇 장으로 늘릴까」 → d=1 이라야 한다 (9/3 에 2초가 1분 58초로 터졌다)
FR=$(python3 -c "print(int(round($DUR*60))-1)")
G=""
i=0
while [ "$i" -lt 8 ]; do
  G="$G[$i:v]fps=60,scale=2160:3840:flags=lanczos,zoompan=z='1+0.022*in/$FR':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=60,format=yuv420p,setsar=1[c$i];"
  i=$((i + 1))
done

PREV="[c0]"
i=1
while [ "$i" -lt 8 ]; do
  OFF=$(python3 -c "print(round(($DUR-$TR)*$i, 3))")
  if [ "$i" -eq 7 ]; then NEXT="[xf]"; else NEXT="[x$i]"; fi
  G="$G$PREV[c$i]xfade=transition=slideleft:duration=$TR:offset=$OFF$NEXT;"
  PREV="$NEXT"
  i=$((i + 1))
done
G="$G[xf][8:v]overlay=0:0:format=auto:eof_action=pass,format=yuv420p,setsar=1[v]"

"$FF" -hide_banner -loglevel error "${INARGS[@]}" -filter_complex "$G" \
  -map "[v]" -r 60 -c:v libx264 -preset slow -b:v 6500k -maxrate 7500k -bufsize 13000k \
  -pix_fmt yuv420p -movflags +faststart -an -y "$OUTF"

echo "✅ $OUTF"
# ⛔ ffmpeg -i 는 출력 파일이 없으면 항상 exit 1 — set -e ＋ pipefail 이라 여기서 통째로 죽는다
{ "$FF" -hide_banner -i "$OUTF" 2>&1 || true; } | grep -E "Duration|Stream #" | sed 's/^/   /'
