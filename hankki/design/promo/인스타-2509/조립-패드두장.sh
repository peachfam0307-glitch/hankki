#!/usr/bin/env bash
# 🎬📱 **인스타 릴스 — 패드 «가로» 두 장 쌓기** 2026-09-04
#
# 📮 창업자 = *"패드버전으로 스토어스샷같은 소개만들고 그걸로 릴스1번.
#    장보기랑 냉장고, 주부큐레이션 쭉 스샷만들고 릴스. **우리ui를 바로 보여주는게 조회수가 낫더라고**"*
#    ＋ *"똑같이 만들면 재미없으니까 레이아웃을 다르게 하면 좋겠엉"*
#    ＋ *"아 세로가 아니라 «가로» 버전이지"* → *"아하!! 좋은 생각이야 예쁘게 만들어줘"*
#    ＋ **확정** *"거의 꽉차게 해야 잘보이고 좋긴해"* → `FULL=1` 벌로 간다
#
# 🧱 재료 = `node scripts/_판-패드두장-0904.mjs` (FULL=1) 가 만드는 `두장쌓기-꽉/` 다섯 장
#    · 패드 «가로» 1280×800 화면을 1080×675 로 두 장 쌓는다 (둘 = 1368)
#    · 🔢 16:10 을 둘 쌓으면 9:16 이 된다 — 그래서 채울 것도 자를 것도 없다
#    ⚠️ 안전지대(1306)를 위아래 31px 씩 벗어난다 = 인스타 글자가 «가장자리»만 스친다 (창업자 확정)
#
# ✨ 반짝임 = `SET=스샷 node scripts/_판-반짝임-0903.mjs` (⭐«도는» 벌 — 2초마다 안 꺼진다)
#    ⛔ 레꾸 릴스용 기본 벌은 첫·끝이 «비어» 있어 여기 쓰면 맥박처럼 뛴다.
#
# 🔀🔀 넘김 = **`slideup`** — 어제 스샷 릴스는 `slideleft`(가로)였다.
#    ⭐ 오늘은 «세로로» 넘긴다. 두 릴스가 인스타에 나란히 걸려도 서로 안 겹쳐 보인다.
#    ⭐ 그리고 판 자체가 «위/아래 두 장»이라 세로 넘김이 그 결을 따라간다.
#    ⛔ `xfade` 의 `offset` 은 «누적»이다 — (장길이 − 넘김) 씩 더해 간다. 하나만 어긋나면 뒤가 다 밀린다.
#
# ⛔ 하지 않는 것 (2026-09-03 에 값을 치르고 배운 것)
#    · 빈자리를 클레이·토프로 채우기 · 세로를 잘라 맞추기 · 가을 친구 스티커 얹기
#
# 쓰는 법 = bash design/promo/인스타-2509/조립-패드두장.sh
set -euo pipefail
# ⛔ bash 변수 이름은 반드시 ASCII (CLAUDE.md 규칙 24)
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$HERE/../../.." && pwd)"
FF="$APP/node_modules/ffmpeg-static/ffmpeg"
SHOT="/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/패드릴스"
CARDS="${CARD_DIR:-$SHOT/두장쌓기-꽉}"
SPARK="${SPARK_DIR:-/tmp/hankki-반짝임-스샷}"
OUTF="${OUT:-/tmp/hankki-릴스-패드두장.mp4}"
DUR="${DUR:-2.6}"      # 한 장 머무는 시간 — 두 화면을 한 칸에 담아서 어제(2.2)보다 길게 준다
TR="${TR:-0.4}"        # 넘김 시간

mapfile -t PICS < <(ls "$CARDS"/*.png | sort)
N="${#PICS[@]}"
[ "$N" -ge 3 ] || { echo "⛔ 카드가 ${N}장뿐이다 — FULL=1 node scripts/_판-패드두장-0904.mjs 먼저"; exit 1; }
[ -f "$SPARK/000.png" ] || { echo "⛔ 반짝임이 없다 — SET=스샷 node scripts/_판-반짝임-0903.mjs"; exit 1; }
echo "🎞 카드 ${N}장 · 한 장 ${DUR}초 · 넘김 ${TR}초"

INARGS=()
for p in "${PICS[@]}"; do INARGS+=(-loop 1 -t "$DUR" -i "$p"); done
INARGS+=(-stream_loop 40 -framerate 60 -start_number 0 -i "$SPARK/%03d.png")

# 장마다 아주 옅은 줌인 — 정지 그림을 그냥 세워 두면 죽은 화면이 된다
# ⛔ zoompan 의 d 는 「입력 한 장을 몇 장으로 늘릴까」 → d=1 이라야 한다 (9/3 에 2초가 1분 58초로 터졌다)
# ⛔ 필터의 fps=60 만으로는 60fps 가 안 나온다 — 출력에 -r 60 을 직접 박는다
FR=$(python3 -c "print(int(round($DUR*60))-1)")
G=""
i=0
while [ "$i" -lt "$N" ]; do
  G="$G[$i:v]fps=60,scale=2160:3840:flags=lanczos,zoompan=z='1+0.018*in/$FR':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=60,format=yuv420p,setsar=1[c$i];"
  i=$((i + 1))
done

PREV="[c0]"
i=1
while [ "$i" -lt "$N" ]; do
  OFF=$(python3 -c "print(round(($DUR-$TR)*$i, 3))")
  if [ "$i" -eq $((N - 1)) ]; then NEXT="[xf]"; else NEXT="[x$i]"; fi
  G="$G$PREV[c$i]xfade=transition=slideup:duration=$TR:offset=$OFF$NEXT;"
  PREV="$NEXT"
  i=$((i + 1))
done
G="$G[xf][$N:v]overlay=0:0:format=auto:eof_action=pass,format=yuv420p,setsar=1[v]"

"$FF" -hide_banner -loglevel error "${INARGS[@]}" -filter_complex "$G" \
  -map "[v]" -r 60 -c:v libx264 -preset slow -b:v 6500k -maxrate 7500k -bufsize 13000k \
  -pix_fmt yuv420p -movflags +faststart -an -y "$OUTF"

echo "✅ $OUTF"
# ⛔ ffmpeg -i 는 출력 파일이 없으면 항상 exit 1 — set -e ＋ pipefail 이라 여기서 통째로 죽는다
{ "$FF" -hide_banner -i "$OUTF" 2>&1 || true; } | grep -E "Duration|Stream #" | sed 's/^/   /'
