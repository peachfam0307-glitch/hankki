set -e
cd /tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad/yj
# 장면마다: 1080x1920 · 따뜻한 색(살짝) · 자막 페이드 인 · 앞뒤 0.4초 페이드
for i in 1 2 3 4 5 6; do
 ffmpeg -loglevel error -y -i c$i.mp4 -loop 1 -i cap$i.png -filter_complex "[0:v]scale=1080:1920:flags=lanczos,eq=saturation=1.05:gamma=1.02,colorbalance=rs=.04:gs=.01:bs=-.04,fps=30,trim=0:5,setpts=PTS-STARTPTS[v];[1:v]format=rgba,fade=in:st=0.5:d=0.6:alpha=1,trim=0:5,setpts=PTS-STARTPTS[t];[v][t]overlay=0:0:shortest=1,fade=in:st=0:d=0.4,fade=out:st=4.6:d=0.4,format=yuv420p[o]" -map "[o]" -t 5 -c:v libx264 -crf 18 -preset medium s$i.mp4
done
printf "file s%d.mp4\n" 1 2 3 4 5 6 > list.txt
ffmpeg -loglevel error -y -f concat -safe 0 -i list.txt -c copy 양지수육-영상.mp4
ffprobe -v error -show_entries format=duration -of csv 양지수육-영상.mp4
