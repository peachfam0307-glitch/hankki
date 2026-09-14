#!/usr/bin/env bash
# 🎬 소소 기능 ① 장보기·냉장고 — 캐러셀 8장 → 릴스 9:16 (2026-09-06)
#   1080×1350 장을 장마다 «자기 바탕색»으로 1080×1920 에 앉히고(A 크림·B 연녹·C 베이지) · 2.4초씩 · 살짝 확대 · 왼쪽으로 넘김
#   쓰는 법: S=<scratchpad> FF=<ffmpeg-static> bash 조립-소소1릴스.sh
set -euo pipefail
S=${S:-/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad}
FF=${FF:-$S/ff/node_modules/ffmpeg-static/ffmpeg}
cd $S/소소1/캐러셀
DUR=2.4; TR=0.35; FR=$(python3 -c "print(int(round($DUR*60))-1)")
# 장별 바탕색 = 짜임(A 풀블리드 크림 · B 콜라주 연녹 · C 대화 베이지)
BG=(fbf7ef f6f1e8 eef1ea fbf7ef f6f1e8 eef1ea fbf7ef fbf7ef)
IN=(); i=0; for f in $(ls 소소1-0*.png | sort); do IN+=(-loop 1 -t $DUR -i "$f"); i=$((i+1)); done
G=""; for i in 0 1 2 3 4 5 6 7; do G="$G[$i:v]fps=60,scale=1080:1350:flags=lanczos,pad=1080:1920:0:285:color=0x${BG[$i]},scale=2160:3840:flags=lanczos,zoompan=z='1+0.02*in/$FR':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=60,format=yuv420p,setsar=1[c$i];"; done
PREV="[c0]"; for i in 1 2 3 4 5 6 7; do OFF=$(python3 -c "print(round(($DUR-$TR)*$i,3))"); if [ $i -eq 7 ]; then NEXT="[v]"; else NEXT="[x$i]"; fi; G="$G$PREV[c$i]xfade=transition=slideleft:duration=$TR:offset=$OFF$NEXT;"; PREV=$NEXT; done
G="${G%;}"
"$FF" -hide_banner -loglevel warning "${IN[@]}" -filter_complex "$G" -map "[v]" -r 60 -c:v libx264 -preset medium -b:v 6500k -maxrate 7500k -bufsize 13000k -pix_fmt yuv420p -movflags +faststart -an -y 소소기능1-장보기냉장고-릴스.mp4
"$FF" -hide_banner -i 소소기능1-장보기냉장고-릴스.mp4 2>&1 | grep -E "Duration|Stream" || true
