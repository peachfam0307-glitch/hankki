#!/usr/bin/env bash
# 🎬📚 **인스타 릴스 — 「깔자마자 레시피 87편」** 2026-09-12
#
# 📮 창업자 = *"처음 유저가 열었을때 레시피가 있는걸 보여주고 싶거든.
#    저장앱이라고 하니까 아무것도 없는 것처럼보일까봐"* ＋ *"그냥 ui로 하자"*
#
# ⛔⛔ **두 곳에서 가져와 붙인다 — 이유가 있다.**
#    ① 레시피 목록 = **클로드가 찍은 것**(깨끗한 새 설치라 「전체 87」이 뜬다)
#    ②~⑤        = **창업자 폰 녹화** 네 개(상세·장보기·레꾸자랑·홈)
#    🔢 창업자 폰은 **「전체 288」**이다 — 그동안 저장한 것이 201편 더 있어서다.
#       ⛔ 그대로 쓰면 「깔면 288편 있다」로 읽혀 **거짓 광고**가 된다(새로 깐 사람은 87편).
#       ✅ 그래서 창업자 녹화에서 **288 이 보이는 구간을 잘라 버린다.**
#    ⛔ 클로드는 상세·홈 화면을 «못 민다»(scrollTop·휠 다 실패 · 문서에 적어 뒀다).
#
# 📐 1080×1920 · 30fps · 무음
#    ⛔ 확대해 꽉 채우면 좌우가 잘린다 — 창업자가 *"잘림없이"* 라고 했다.
#    ✅ 폭 900 ＋ 좌우 90px 크림 여백. 창업자 녹화는 **위 상태바 70px 을 먼저 잘라낸다**
#       (KT·시각·빨간 녹화점이 릴스에 남으면 안 된다).
#
# 쓰는 법: bash design/promo/인스타-2509/조립-87편릴스.sh
set -e
# ⛔ bash 변수명은 ASCII 로 — 한글 변수명은 «대입이 명령으로» 해석돼 죽는다
#    (CLAUDE.md 규칙 24 에 박혀 있는 함정인데 2026-09-12 에 또 밟았다)
FF="/home/user/hankki/hankki/node_modules/ffmpeg-static/ffmpeg"
D="${D:-/root/.claude/uploads/2414fcda-d05a-5b79-84dc-8c748bfda84b}"
IN="${IN:-/tmp/릴스h}"          # 클로드가 찍은 87 목록 낱장
GL="${GL:-/tmp/릴스글자}"
OUT="/home/user/hankki/_shots/릴스-87편-초안.mp4"
CREAM="0xF2EFE7"

V_DETAIL="$D/d3fc62a2-Screen_Recording_20260912_143158_Chrome.mp4"
V_SHOP="$D/d479e17f-Screen_Recording_20260912_143346_Chrome.mp4"
V_DECO="$D/947b9b06-Screen_Recording_20260912_143403_Chrome.mp4"
V_HOME="$D/3c57ca22-Screen_Recording_20260912_143416_Chrome.mp4"

for f in "$V_DETAIL" "$V_SHOP" "$V_DECO" "$V_HOME"; do [ -f "$f" ] || { echo "⛔ 없다: $f"; exit 1; }; done
[ -d "$GL" ] || { echo "⛔ 글자판이 없다 — node scripts/_판-릴스글자-0912.mjs 먼저"; exit 1; }
N=$(ls "$IN"/*.jpg 2>/dev/null | wc -l); [ "$N" -gt 30 ] || { echo "⛔ 내 낱장이 $N 장"; exit 1; }
echo "🖼 내 낱장 $N 장 ＋ 창업자 녹화 4개"

T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
# 📐 창업자 녹화 공통 — 상태바 잘라내고 폭 900 으로
CROP="crop=1080:2270:0:70,scale=900:-2:flags=lanczos"
PAD="pad=1080:1920:(ow-iw)/2:(oh-ih)/2:${CREAM}"
# ⛔⛔ ① 은 **폭이 아니라 높이**로 맞춘다 — 클로드 낱장은 897×1941 이라 폭 900 으로 맞추면
#    높이가 1947 이 돼 **1920 을 넘고 pad 가 실패한다**(Failed to configure input pad · 실제로 겪었다).
#    창업자 녹화는 위 70px 을 잘라 2270 이라 폭 900 → 1891 로 1920 안에 든다.

# ① 내가 찍은 레시피 목록 (87) — 3.5초
"$FF" -y -framerate 30 -pattern_type glob -i "$IN/*.jpg" \
  -vf "scale=-2:1920:flags=lanczos,pad=1080:1920:(ow-iw)/2:0:${CREAM}" -c:v libx264 -pix_fmt yuv420p -crf 18 -r 30 "$T/1.mp4" 2>&1 | tail -2
# ② 상세 — 재료·만드는 법·장바구니 연동 (1.3배로 당긴다 · 릴스는 빠른 게 낫다)
"$FF" -y -ss 1.4 -to 11.4 -i "$V_DETAIL" -vf "${CROP},setpts=PTS/1.3,${PAD}" \
  -an -c:v libx264 -pix_fmt yuv420p -crf 18 -r 30 "$T/2.mp4" 2>&1 | tail -2
# ③ 장보기 — 주부의 장바구니
"$FF" -y -ss 1.5 -to 8.0 -i "$V_SHOP" -vf "${CROP},setpts=PTS/1.3,${PAD}" \
  -an -c:v libx264 -pix_fmt yuv420p -crf 18 -r 30 "$T/3.mp4" 2>&1 | tail -1
ls -la "$T/3.mp4" | awk '{print "   3.mp4", $5, "바이트"}'
# ④ 레꾸자랑
"$FF" -y -ss 0.3 -to 3.4 -i "$V_DECO" -vf "${CROP},${PAD}" \
  -an -c:v libx264 -pix_fmt yuv420p -crf 18 -r 30 "$T/4.mp4" 2>&1 | tail -1
ls -la "$T/4.mp4" | awk '{print "   4.mp4", $5, "바이트"}'
# ⑤ 홈 «이번 주 제철» — 거의 멈춘 화면이라 살짝 줌인으로 살린다
#    ⛔ 정지 화면을 세워두면 죽은 화면이 된다(지난 릴스에서 배운 것)
"$FF" -y -ss 0.3 -to 3.2 -i "$V_HOME" \
  -vf "crop=1080:2270:0:70,scale=990:-2:flags=lanczos,crop=900:1890:'(iw-900)*(t/3)':0,${PAD}" \
  -an -c:v libx264 -pix_fmt yuv420p -crf 18 -r 30 "$T/5.mp4" 2>&1 | tail -1
ls -la "$T/5.mp4" | awk '{print "   5.mp4", $5, "바이트"}'

# ⛔ concat «디먹서»는 파일 목록을 타다가 자꾸 깨졌다 → **filter_complex concat** 으로 붙인다(더 튼튼하다)
# ⛔⛔ 크기가 같아도 **SAR(픽셀 종횡비)이 다르면 concat 이 거부한다**(Error reinitializing filters).
#    클로드 낱장 쪽 SAR 이 9017:9014 로 떨어져서 그랬다 → **setsar=1 로 맞춰 넣는다.**
"$FF" -y -i "$T/1.mp4" -i "$T/2.mp4" -i "$T/3.mp4" -i "$T/4.mp4" -i "$T/5.mp4" \
  -filter_complex "[0:v]setsar=1,fps=30[a];[1:v]setsar=1,fps=30[b];[2:v]setsar=1,fps=30[c];[3:v]setsar=1,fps=30[d];[4:v]setsar=1,fps=30[e];[a][b][c][d][e]concat=n=5:v=1:a=0[v]" -map "[v]" \
  -c:v libx264 -pix_fmt yuv420p -crf 18 -r 30 "$T/붙임.mp4" 2>&1 | tail -1
LEN=$("$FF" -i "$T/붙임.mp4" 2>&1 | grep Duration | sed 's/.*Duration: //;s/,.*//')
echo "⏱ 붙인 길이 $LEN"

# 🎨 색감 ＋ ✍️ 글자
#    ⛔ 채도를 세게 올리면 크림 톤이 누렇게 뜬다 → 1.14 만 (1.3 은 음식 사진이 타 보였다)
#    ⛔⛔ PNG 를 그냥 -i 로 넣으면 «한 장»이라 시간축이 없어 fade·enable 이 안 먹는다 → **-loop 1** 이 필요하다
"$FF" -y -i "$T/붙임.mp4" \
  -loop 1 -i "$GL/01-훅.png" -loop 1 -i "$GL/02-빈앱.png" -loop 1 -i "$GL/03-고름.png" \
  -loop 1 -i "$GL/04-제철.png" -loop 1 -i "$GL/05-주기.png" -loop 1 -i "$GL/06-끝.png" \
  -filter_complex "\
[0:v]eq=saturation=1.14:contrast=1.06:brightness=0.01,unsharp=5:5:0.7:5:5:0.0[bg];\
[1:v]format=rgba,fade=t=in:st=0:d=0.3:alpha=1,fade=t=out:st=1.9:d=0.3:alpha=1[t1];\
[2:v]format=rgba,fade=t=in:st=0:d=0.3:alpha=1,fade=t=out:st=1.2:d=0.3:alpha=1[t2];\
[3:v]format=rgba,fade=t=in:st=0:d=0.3:alpha=1,fade=t=out:st=3.0:d=0.3:alpha=1[t3];\
[4:v]format=rgba,fade=t=in:st=0:d=0.3:alpha=1,fade=t=out:st=2.8:d=0.3:alpha=1[t4];\
[5:v]format=rgba,fade=t=in:st=0:d=0.3:alpha=1,fade=t=out:st=2.5:d=0.3:alpha=1[t5];\
[6:v]format=rgba,fade=t=in:st=0:d=0.4:alpha=1[t6];\
[bg][t1]overlay=0:0:enable='between(t,0.2,2.4)'[v1];\
[v1][t2]overlay=0:0:enable='between(t,2.5,4.0)'[v2];\
[v2][t3]overlay=0:0:enable='between(t,4.3,7.6)'[v3];\
[v3][t4]overlay=0:0:enable='between(t,11.5,14.6)'[v4];\
[v4][t5]overlay=0:0:enable='between(t,15.0,17.8)'[v5];\
[v5][t6]overlay=0:0:enable='gte(t,18.2)'[v]" \
  -map "[v]" -c:v libx264 -pix_fmt yuv420p -profile:v high -crf 18 -r 30 \
  -movflags +faststart "$OUT" 2>&1 | tail -1

echo "✅ $OUT"
"$FF" -i "$OUT" 2>&1 | grep -E "Duration|Stream #0:0" | sed 's/^/   /'
