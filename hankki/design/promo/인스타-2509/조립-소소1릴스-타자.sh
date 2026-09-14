#!/usr/bin/env bash
# 🎬⌨️ 소소 기능 ① 릴스 «타자판» (2026-09-06 · 창업자 "둥실은 좀 별로야.. 제목 글자들을 타자로 치는 걸 할까")
#   장마다 제목이 커서를 달고 한 자씩 찍힌다(0.085초/자) → 다 찍히면 커서 두 번 깜빡 → 사라짐. 곰펭은 가만히(둥실 뺌).
#   바탕 살짝 확대는 그대로 · 장 넘김은 장마다 다르게 · 3초씩
#   재료 = TYPE=1 node scripts/_판-소소장보기캐러셀-0906.mjs  (캐러셀-타자/<장>/f00…fNN.png · done.png)
#   쓰는 법: S=<scratchpad> FF=<ffmpeg-static> bash 조립-소소1릴스-타자.sh
set -euo pipefail
S=${S:-/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad}
FF=${FF:-$S/ff/node_modules/ffmpeg-static/ffmpeg}
cd $S/소소1
DUR=3.0; TR=0.4; TICK=0.085; FR=$(python3 -c "print(int(round($DUR*60))-1)")
BG=(fbf7ef f6f1e8 eef1ea fbf7ef f6f1e8 eef1ea fbf7ef fbf7ef)
TRS=(slideleft circleopen wipeup fade smoothleft circlecrop slideup)
mkdir -p 타자-중간
i=0; IN=()
for d in $(ls -d 캐러셀-타자/소소1-0*/ | sort); do
  d=$PWD/${d%/}; N=$(ls $d/f*.png | wc -l)   # f00…f(N-1) → 글자 수 = N-1
  L=타자-중간/$i.txt; : > $L
  python3 - "$d" "$N" "$TICK" "$DUR" >> $L <<'PY'
import sys; d,N,T,D=sys.argv[1],int(sys.argv[2]),float(sys.argv[3]),float(sys.argv[4])
out=[]; t=0
def add(f,dur): global t; out.append(f"file '{f}'\nduration {dur:.3f}"); t+=dur
add(f"{d}/f00.png",0.35)                       # 빈 칸에 커서만 — 「찍기 시작한다」는 예고
for k in range(1,N): add(f"{d}/f{k:02d}.png",T) # 한 자씩
last=f"{d}/f{N-1:02d}.png"
for f in (f"{d}/done.png",last,f"{d}/done.png",last): add(f,0.3)   # 커서 두 번 깜빡
add(f"{d}/done.png",max(0.3,D-t)); out.append(f"file '{d}/done.png'")
print("\n".join(out))
PY
  "$FF" -hide_banner -loglevel error -f concat -safe 0 -i $L -vf "fps=60,scale=1080:1350:flags=lanczos,pad=1080:1920:0:285:color=0x${BG[$i]},scale=2160:3840:flags=lanczos,zoompan=z='1+0.02*in/$FR':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=60,format=yuv420p,setsar=1" -t $DUR -r 60 -c:v libx264 -preset fast -crf 12 -y 타자-중간/$i.mp4
  IN+=(-i 타자-중간/$i.mp4); echo "  ⌨️ $d ($((N-1))자)"; i=$((i+1))
done
G=""; PREV="[0:v]"
for i in 1 2 3 4 5 6 7; do OFF=$(python3 -c "print(round(($DUR-$TR)*$i,3))"); if [ $i -eq 7 ]; then NEXT="[v]"; else NEXT="[x$i]"; fi; G="$G$PREV[$i:v]xfade=transition=${TRS[$((i-1))]}:duration=$TR:offset=$OFF$NEXT;"; PREV=$NEXT; done
G="${G%;}"
"$FF" -hide_banner -loglevel warning "${IN[@]}" -filter_complex "$G" -map "[v]" -r 60 -c:v libx264 -preset medium -b:v 6500k -maxrate 7500k -bufsize 13000k -pix_fmt yuv420p -movflags +faststart -an -y 캐러셀/소소기능1-장보기냉장고-릴스-타자.mp4
"$FF" -hide_banner -i 캐러셀/소소기능1-장보기냉장고-릴스-타자.mp4 2>&1 | grep -E "Duration" || true
