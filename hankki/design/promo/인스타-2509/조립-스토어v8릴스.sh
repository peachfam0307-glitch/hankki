#!/usr/bin/env bash
set -euo pipefail
S=/tmp/claude-0/-home-user-hankki/0848ab85-00e3-56db-9a26-e87075950c12/scratchpad
FF=$S/ff/node_modules/ffmpeg-static/ffmpeg
cd $S/v8
DUR=2.2; TR=0.35; FR=$(python3 -c "print(int(round($DUR*60))-1)")
IN=(); for f in $(ls v8-0*.png | sort); do IN+=(-loop 1 -t $DUR -i "$f"); done
G=""; for i in 0 1 2 3 4 5 6 7; do G="$G[$i:v]fps=60,scale=2160:3840:flags=lanczos,zoompan=z='1+0.022*in/$FR':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=60,format=yuv420p,setsar=1[c$i];"; done
PREV="[c0]"; for i in 1 2 3 4 5 6 7; do OFF=$(python3 -c "print(round(($DUR-$TR)*$i,3))"); if [ $i -eq 7 ]; then NEXT="[v]"; else NEXT="[x$i]"; fi; G="$G$PREV[c$i]xfade=transition=slideleft:duration=$TR:offset=$OFF$NEXT;"; PREV=$NEXT; done
G="${G%;}"
"$FF" -hide_banner -loglevel error "${IN[@]}" -filter_complex "$G" -map "[v]" -r 60 -c:v libx264 -preset medium -b:v 6500k -maxrate 7500k -bufsize 13000k -pix_fmt yuv420p -movflags +faststart -an -y $S/v8/v8-스토어스샷-릴스.mp4
"$FF" -hide_banner -i $S/v8/v8-스토어스샷-릴스.mp4 2>&1 | grep -E "Duration" || true
