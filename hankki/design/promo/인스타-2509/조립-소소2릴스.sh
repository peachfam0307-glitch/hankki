#!/usr/bin/env bash
# 🎬 소소 기능 ② 릴스 «쌓이기＋타자» (2026-09-07 · 창업자 "짜임 독특하게 효과도 넣을거 생각해서 해줘")
#   장마다 생산기(TYPE=1)가 뽑은 프레임 목록(list.txt · ffmpeg concat · 머무는 시간 포함)을 그대로 이어 붙인다:
#   빈 판 → 조각·말풍선·카드가 «하나씩 툭» 내려앉아 쌓임 → 제목이 커서 달고 한 자씩 → 커서 두 번 깜빡 → 1.2초 머묾
#   장 넘김은 장마다 다르게 · 바탕 살짝 확대
#   쓰는 법: S=<scratchpad> FF=<ffmpeg-static> bash 조립-소소2릴스.sh
set -euo pipefail
S=${S:-/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad}
FF=${FF:-$S/ff/node_modules/ffmpeg-static/ffmpeg}
cd $S/소소2
TR=0.4
BG=(1f2a3c 1f2a3c 243044 1f2a3c 1f2a3c 243044 1f2a3c 1f2a3c)   # A·C = 남색 · B = 점무늬 남색 (생산기 팔레트와 같다)
TRS=(slideleft circleopen wipeup fade smoothleft circlecrop slideup)
mkdir -p 중간; i=0; IN=(); DURS=()
for d in $(ls -d 캐러셀-타자/소소2-0*/ | sort); do
  d=${d%/}
  DUR=$(python3 -c "import re,sys;print(round(sum(float(m) for m in re.findall(r'duration ([\d.]+)', open('$d/list.txt').read())),3))")
  FR=$(python3 -c "print(int(round($DUR*60))-1)")
  "$FF" -hide_banner -loglevel error -f concat -safe 0 -i $d/list.txt -vf "fps=60,scale=1080:1350:flags=lanczos,pad=1080:1920:0:285:color=0x${BG[$i]},scale=2160:3840:flags=lanczos,zoompan=z='1+0.02*in/$FR':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=60,format=yuv420p,setsar=1" -t $DUR -r 60 -c:v libx264 -preset fast -crf 12 -y 중간/$i.mp4
  IN+=(-i 중간/$i.mp4); DURS+=($DUR); echo "  🎬 $(basename $d) ${DUR}s"; i=$((i+1))
done
G=""; PREV="[0:v]"; OFF=0
for i in 1 2 3 4 5 6 7; do OFF=$(python3 -c "print(round($OFF+${DURS[$((i-1))]}-$TR,3))"); if [ $i -eq 7 ]; then NEXT="[v]"; else NEXT="[x$i]"; fi; G="$G$PREV[$i:v]xfade=transition=${TRS[$((i-1))]}:duration=$TR:offset=$OFF$NEXT;"; PREV=$NEXT; done
G="${G%;}"
mkdir -p 캐러셀
"$FF" -hide_banner -loglevel warning "${IN[@]}" -filter_complex "$G" -map "[v]" -r 60 -c:v libx264 -preset medium -b:v 6500k -maxrate 7500k -bufsize 13000k -pix_fmt yuv420p -movflags +faststart -an -y "캐러셀/소소한기능②-홈이알아서-릴스.mp4"
"$FF" -hide_banner -i "캐러셀/소소한기능②-홈이알아서-릴스.mp4" 2>&1 | grep -E "Duration" || true
