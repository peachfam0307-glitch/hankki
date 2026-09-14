#!/usr/bin/env bash
# 📔🎬 소소 ③ 「기록은 내 것」 릴스 — «쌓이기 ＋ 타자» (2026-09-07 · 창업자 "쌓이기로 가고 타자 효과까지 얹어줘")
#   프레임은 생산기가 낸다: cd hankki && TYPE=1 SMOKE_CHROMIUM=... node scripts/_판-소소기록캐러셀-0907.mjs
#   장과 장 사이는 slideup — 앞 장이 위로 밀려나며 다음 장이 아래에서 올라온다(카드가 «쌓이는» 느낌).
set -euo pipefail
S=${S:-/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad}
# ffmpeg 은 세션마다 자리가 다르다 — 없으면 $S/ff 에 깔아 쓴다 (npm i ffmpeg-static)
FF=${FF:-$S/ff/node_modules/ffmpeg-static/ffmpeg}
T=${T:-$S/소소3/캐러셀-타자}; W=${W:-$S/소소3/묶음/타자조각}; OUT=${OUT:-$S/소소3/묶음/소소3-릴스-타자.mp4}; mkdir -p $W
BG=0xe7ebe0; TR=0.4
NAMES=($(ls $T | sort))
for n in "${NAMES[@]}"; do
  "$FF" -hide_banner -loglevel error -f concat -safe 0 -i $T/$n/list.txt \
    -vf "fps=60,scale=1080:1350:flags=lanczos,pad=1080:1920:0:285:color=$BG,format=yuv420p,setsar=1" \
    -c:v libx264 -preset veryfast -crf 18 -y $W/$n.mp4
done
IN=(); for n in "${NAMES[@]}"; do IN+=(-i $W/$n.mp4); done
G=""; PREV="[0:v]"; ACC=0
for i in 1 2 3 4 5 6 7; do
  D=$({ "$FF" -i $W/${NAMES[$((i-1))]}.mp4 2>&1 || true; } | sed -n 's/.*Duration: \([0-9:.]*\).*/\1/p' | python3 -c "import sys;h,m,s=sys.stdin.read().strip().split(':');print(int(h)*3600+int(m)*60+float(s))")
  ACC=$(python3 -c "print(round($ACC+$D-$TR,3))")
  if [ $i -eq 7 ]; then NEXT="[v]"; else NEXT="[x$i]"; fi
  G="$G$PREV[$i:v]xfade=transition=slideup:duration=$TR:offset=$ACC$NEXT;"
  PREV=$NEXT
done
G="${G%;}"
"$FF" -hide_banner -loglevel error "${IN[@]}" -filter_complex "$G" -map "[v]" -r 60 \
  -c:v libx264 -preset medium -b:v 6500k -maxrate 7500k -bufsize 13000k -pix_fmt yuv420p -movflags +faststart -an \
  -y $OUT
ls -la $OUT
