set -e
FF=/home/user/hankki/hankki/node_modules/ffmpeg-static/ffmpeg
V=/root/.claude/uploads/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/d9c151b6-Screen_Recording_20260901_084036_Chrome.mp4
S=/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad
OUT=$S/영상2
mkdir -p "$OUT"

# 🎬 v13 — 카톡 «실화면» → 우리 목업 대화방 (2026-09-01)
#
# 📮 창업자 = "카톡화면은 네가 만들수있지않아? 목업으로" ·
#            "내꺼는 위에도 뭐가 올라가있으니까 지저분해보이니까" ·
#            "이거 맛있는데 레시피 보내주는 상황은?" · "우리 레꾸커버랑 레시피가 같이 가니까"
#
# ⛔⛔ v12 는 조각 셋을 «-c copy» 로 이어 붙였다가 이음매에서 «한 프레임이 깨졌다».
#     → v13 은 «한 번에» 굽는다. 목업 PNG 를 두 번째 입력으로 넣고 concat 필터로 잇는다.
#     ⚠️ concat 필터는 크기·SAR·픽셀형식이 «전부 같아야» 한다 → 조각마다 format·setsar 를 박는다.
#
# 🔒 개인정보 — 이 판에서 «원본에 있던» 개인정보는 셋이고 전부 프레임 밖이다
#    ① 공유 시트 친구 줄 (junesoo·소이 실명 ＋ 프로필 사진) → 애초에 안 잡는다(share 함수)
#    ② 카톡 대화방 공지 띠 (학사일정) → 실화면을 아예 안 쓴다(목업)
#    ③ 카톡 방 이름·프로필 → 목업이라 없다

N=",format=yuv420p,setsar=1"
seg   () { echo "[0:v]trim=start=$1:end=$2,setpts=(PTS-STARTPTS)*$4,crop=1074:1909:0:$5,scale=1080:1920$N[$3];"; }
zc    () { echo "color=c=$7:s=1080x1920:d=99[${3}b];[0:v]trim=start=$1:end=$2,setpts=(PTS-STARTPTS)*$4,crop=1074:$6:0:$5,scale=1080:-2[${3}f];[${3}b][${3}f]overlay=(W-w)/2:(H-h)/2:shortest=1$N[$3];"; }
# 📤 공유 시트 = 「친구 줄만 빼고 시트를 그대로」
#    ⭐ 두 조각(① 이미지 1개 ＋ 미리보기  ② 앱 아이콘 줄)을 시트 바탕색(#dedbd7 실측) 위에 얹는다
#    📐 y 560~1362 = 인스타가 덮는 위 230 · 아래 1536 을 둘 다 피한다
#    ⚠️ 위아래를 조금씩 물린 이유 = 시트 «둥근 모서리»가 어두운 배경을 물고 들어온다
share () { echo "color=c=0xdedbd7:s=1080x1920:d=99[Sb];[0:v]trim=start=$1:end=$2,setpts=(PTS-STARTPTS)*$4,split[Sa][Sc];[Sa]crop=1012:370:36:960,scale=1080:-2[S1];[Sc]crop=1012:330:36:1768,scale=1080:-2[S2];[Sb][S1]overlay=0:560:shortest=1[Sx];[Sx][S2]overlay=0:1010$N[$3];"; }

{
  seg   0.00  0.95  L 1.4   0                 # 🏷 레꾸자랑 «제목» — 확대 안 함(안 잘린다) · 느리게
  seg   0.95  2.55  P 1.0   0                 # 🖼 꾸민 표지가 줄줄이 (창업자 = "레꾸자랑 그게 예뻐서 눈에 확 들어오거든")
  zc    2.60  3.95  M 1.0 1330 850 0xB9ACA4   # 🔍 「랜덤 카드로 뽑기」 — 화면 아래 10% 라 확대해야 안 잘린다
  seg   14.35 16.17 A 1.0   0                 # 🎴 6번
  seg   16.17 18.11 B 1.0   0                 # 🎴 7번
  seg   4.11  5.49  C 1.0   0                 # 🎴 1번
  seg   18.11 22.31 D 1.0   0                 # 🎴 8·9번 (창업자 = "9는 제일 마지막에")
  seg   22.31 23.65 E 1.0   0                 # 📄 레시피 카드 → 공유하기
  # 📤 카카오톡 아이콘이 «보인다» = 진짜 된다는 증거
  # ⛔ 끝을 24.80 «넘기지 말 것» — 24.82초부터 시트가 옆으로 밀려나며 화면이 찢어진다(원본 20fps 로 확인).
  #    24.92 로 잡았던 판에서 이음매 직전 몇 프레임이 실제로 깨졌다.
  share 24.10 24.80 F 1.9
  echo "[1:v]fps=30,scale=1080:1920$N[G];"     # 💬 목업 대화방 7.9초
  seg   0.95  2.20  Z 1.1   0                 # 🔁 다시 격자 — 릴스가 처음으로 이어져 돈다
  echo "[L][P][M][A][B][C][D][E][F][G][Z]concat=n=11:v=1:a=0[v]"
} | tr -d '\n' > /tmp/fc13.txt

$FF -hide_banner -loglevel error -i "$V" -framerate 30 -i "$S/목업/프레임/%04d.png" \
  -filter_complex_script /tmp/fc13.txt -map "[v]" -an \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 30 -movflags +faststart \
  "$OUT/한끼-레꾸자랑-릴스-0901.mp4" -y

$FF -hide_banner -i "$OUT/한끼-레꾸자랑-릴스-0901.mp4" 2>&1 | grep -E "Duration|Video:"
