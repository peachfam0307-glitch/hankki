#!/usr/bin/env bash
# 🎬🍜 **인스타 릴스 — 「저장만 하려다가 표지까지 꾸며버림」 (차돌짬뽕 레꾸)** 2026-09-03
#
# 📮 창업자 = "이걸로 하고 가을프레임으로 꾸미기 하나 만들면 어떨까" · "레시피고, 프레임은 목도리 타원이야"
#    녹화 = 창업자 폰(49.22초 · 1080×2182 · 112fps · 4.4Mbps)
#
# ⛔⛔ **9/1 릴스 실측이 정한 것** (docs/릴스-레꾸자랑-스토리보드-2026-08-29.md 맨 아래 세대)
#    · 평균 조회 3초 / 25.5초 · **첫 1~2초가 절벽** · 조회 118 · 여성 100% · 25-44세 73%
#    · 진단 = 첫 화면이 「앱 UI」라 릴스·탐색 탭에서 **광고로 읽힌다** ＋ 읽을 글자가 많다
#    ✅ 그래서 이 판은 **첫 1초를 «캐릭터»로** 바꾼다 — 뾰미 문방구 시안 크롭.
#       ⛔ 그 밖은 «한 가지만 바꾼다» 원칙대로 그대로 둔다(25초 안팎 · 끝을 처음과 잇기).
#
# 📐 인스타가 덮는 자리 = 위 230px · 아래 384px
# 🖼 1080×2182 → 9:16(1920) 은 262px 모자란다 → 위 130 · 아래 132 로 «나눠» 자른다
#    (한쪽만 자르면 상단바나 하단 도구줄이 통째로 날아간다)
#
# ⌨️ **키보드 구간(20~29초)은 뺀다** — 한글 키보드가 화면 절반을 덮어 6초 동안 주인공이 키보드가 된다.
#    「제목을 친다」는 **결과(29초~)** 만 보여줘도 전달된다.
#
# 🎞 화질 = 60fps · lanczos ＋ unsharp · 5.5Mbps
#    ⛔⛔ **필터의 `fps=60` 만으로는 60fps 가 «안 나온다»** — 첫 판이 25fps 로 나왔다(실측).
#       그림 입력(`-loop 1 -i x.png`)이 25fps 로 들어오고 concat 이 그 박자를 물고 간다.
#       ✅ 출력에 **`-r 60`** 을 «직접» 박아야 한다. 📌 「걸었다」와 「먹었다」는 다른 말이다.
#    📮 9/1 판에서 창업자 = *"내 영상은 쨍한데 네가준거는 살짝 뿌얘"*
#       🔢 그때 실측 = 대비·채도는 «원본과 같았다». 범인은 비트레이트·fps·리사이즈 필터 셋이었다.
#
# 쓰는 법 = bash design/promo/인스타-2509/조립-레꾸차돌.sh <녹화.mp4>
set -euo pipefail
# ⛔⛔ **bash 변수 이름은 «반드시 ASCII»** — 한글 변수명은 대입이 «명령»으로 해석돼 죽는다.
#    CLAUDE.md 규칙 24 에 박혀 있는데 2026-09-03 하루에 «두 번» 밟았다(아침 bigout-guard · 이 파일).
#    📌 주석·메시지는 한글이어도 된다. 변수만 ASCII.
V="${1:?녹화 파일 경로를 줘야 한다}"
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$HERE/../../.." && pwd)"
FF="$APP/node_modules/ffmpeg-static/ffmpeg"
HOOK="${HOOK_PNG:-/tmp/hankki-릴스시안/훅판.png}"
FULL="${FULL_PNG:-/tmp/hankki-릴스시안/전체판.png}"
OUTF="${OUT:-/tmp/hankki-릴스-차돌짬뽕.mp4}"

for f in "$V" "$HOOK" "$FULL"; do [ -f "$f" ] || { echo "⛔ 없다: $f"; exit 1; }; done

# ⛔ `-ss` 를 `-i` «앞»에 두면 키프레임으로 어긋난다 → trim 필터로 «뒤»에서 자른다(9/1 함정 기록)
# ⛔ `setpts=PTS-STARTPTS` 를 안 주면 조각 첫 프레임이 «빈 화면»으로 나온다
# ⛔ concat 은 크기·SAR·픽셀형식이 «전부» 같아야 한다 → 조각마다 format=yuv420p,setsar=1
CUT="crop=1080:1920:0:130,scale=1080:1920:flags=lanczos,unsharp=5:5:0.5:5:5:0.0,format=yuv420p,setsar=1,fps=60"

"$FF" -hide_banner -loglevel error \
  -loop 1 -t 1.4 -i "$HOOK" \
  -i "$V" \
  -loop 1 -t 2.6 -i "$FULL" \
  -filter_complex "
    [0:v]scale=1080:1920:flags=lanczos,format=yuv420p,setsar=1,fps=60[hook];
    [1:v]$CUT[src];
    [src]split=5[a][b][c][d][e];
    [a]trim=2.0:8.0,setpts=(PTS-STARTPTS)/2.2[s1];
    [b]trim=8.0:12.5,setpts=(PTS-STARTPTS)/2.2[s2];
    [c]trim=12.5:20.0,setpts=(PTS-STARTPTS)/2.6[s3];
    [d]trim=29.0:46.0,setpts=(PTS-STARTPTS)/3.0[s4];
    [e]trim=46.0:49.2,setpts=(PTS-STARTPTS)/1.2[s5];
    [2:v]scale=1080:1920:flags=lanczos,format=yuv420p,setsar=1,fps=60[end];
    [hook][s1][s2][s3][s4][s5][end]concat=n=7:v=1:a=0[v]
  " \
  -map "[v]" -r 60 -c:v libx264 -preset slow -b:v 5500k -maxrate 6500k -bufsize 11000k \
  -pix_fmt yuv420p -movflags +faststart -an -y "$OUTF"

echo "✅ $OUTF"
"$FF" -hide_banner -i "$OUTF" 2>&1 | grep -E "Duration|Stream #" | sed 's/^/   /'
