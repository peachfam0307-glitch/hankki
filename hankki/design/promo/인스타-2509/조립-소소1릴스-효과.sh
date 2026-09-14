#!/usr/bin/env bash
# 🎬✨ 소소 기능 ① 릴스 «효과판» (2026-09-06 · 창업자 "이거 효과도 넣어줘")
#   두 겹 = 바탕(LAYER=base · 스티커 없음)에 살짝 확대 ＋ 스티커 겹(LAYER=sticker · 투명)이 «둥실» 위아래로 떠다님(1.3초 주기 · ±9px)
#   장 넘김 = 장마다 다르게(밀기·원 열림·닦기·페이드·확대…) · 2.6초씩
#   쓰는 법: S=<scratchpad> FF=<ffmpeg-static> bash 조립-소소1릴스-효과.sh
set -euo pipefail
S=${S:-/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad}
FF=${FF:-$S/ff/node_modules/ffmpeg-static/ffmpeg}
cd $S/소소1
DUR=2.6; TR=0.4; FR=$(python3 -c "print(int(round($DUR*60))-1)")
BG=(fbf7ef f6f1e8 eef1ea fbf7ef f6f1e8 eef1ea fbf7ef fbf7ef)
TRS=(slideleft circleopen wipeup fade smoothleft circlecrop slideup)
IN=(); for f in $(ls 캐러셀-base/소소1-0*.png | sort); do IN+=(-loop 1 -t $DUR -i "$f"); done
for f in $(ls 캐러셀-sticker/소소1-0*.png | sort); do IN+=(-loop 1 -t $DUR -i "$f"); done
G=""
for i in 0 1 2 3 4 5 6 7; do
  j=$((i+8))
  # 바탕: 1080×1350 → 1920 틀 → 2배로 키워 zoompan(살짝 확대) → 1080×1920
  G="$G[$i:v]fps=60,scale=1080:1350:flags=lanczos,pad=1080:1920:0:285:color=0x${BG[$i]},scale=2160:3840:flags=lanczos,zoompan=z='1+0.02*in/$FR':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=60,format=rgba[b$i];"
  # 스티커: 같은 자리(285px 아래) · 둥실 = y 가 sin 으로 오르내림 · 살짝 커졌다 작아졌다는 zoompan 과 어긋나서 안 넣는다
  G="$G[$j:v]fps=60,scale=1080:1350:flags=lanczos,format=rgba[s$i];"
  G="$G[b$i][s$i]overlay=x=0:y='285+9*sin(2*PI*t/1.3)':shortest=1:format=auto,format=yuv420p,setsar=1[c$i];"
done
PREV="[c0]"; for i in 1 2 3 4 5 6 7; do OFF=$(python3 -c "print(round(($DUR-$TR)*$i,3))"); if [ $i -eq 7 ]; then NEXT="[v]"; else NEXT="[x$i]"; fi; G="$G$PREV[c$i]xfade=transition=${TRS[$((i-1))]}:duration=$TR:offset=$OFF$NEXT;"; PREV=$NEXT; done
G="${G%;}"
"$FF" -hide_banner -loglevel warning "${IN[@]}" -filter_complex "$G" -map "[v]" -r 60 -c:v libx264 -preset medium -b:v 6500k -maxrate 7500k -bufsize 13000k -pix_fmt yuv420p -movflags +faststart -an -y 캐러셀/소소기능1-장보기냉장고-릴스-효과.mp4
"$FF" -hide_banner -i 캐러셀/소소기능1-장보기냉장고-릴스-효과.mp4 2>&1 | grep -E "Duration" || true
