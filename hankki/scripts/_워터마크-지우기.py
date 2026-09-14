#!/usr/bin/env python3
# 🧽 영상 오른쪽 아래 워터마크 지우기 — 배경이 «단색에 가까울 때»만
#
# ⛔⛔ 쓰기 «전»에 반드시 확인할 것 = 지울 칸에 «그림»이 안 걸리나.
#    이 도구는 그 칸을 둘레 색으로 통째로 덮는다 — 그림이 걸리면 그림이 지워진다.
#    그래서 «진한 픽셀이 있으면 죽는다»(--force 로만 넘긴다).
#
# 쓰는 법
#   python3 scripts/_워터마크-지우기.py <입력.mp4> <출력.mp4> [--box x0,y0,x1,y1]
#   (--box 를 안 주면 오른쪽 아래 기본칸을 쓴다)
#
# 📌 2026-08-26 = 창업자가 Kling 으로 만든 꼬르곰 3초 컷의 「KlingAI 3.0」 을 지웠다.
# 🏷 이름표 = 살아있는 도구
import subprocess, sys, os, shutil, tempfile
import numpy as np
from PIL import Image

FF = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'node_modules/ffmpeg-static/ffmpeg')

def main():
    a = sys.argv[1:]
    if len(a) < 2:
        print('쓰는 법: _워터마크-지우기.py <입력> <출력> [--box x0,y0,x1,y1] [--force]'); sys.exit(1)
    src, dst = a[0], a[1]
    상자 = None; 강제 = '--force' in a
    if '--box' in a:
        상자 = tuple(int(v) for v in a[a.index('--box')+1].split(','))

    tmp = tempfile.mkdtemp(prefix='wm-')
    try:
        # ⑴ 프레임으로 푼다 (fps 는 원본 그대로)
        fps = subprocess.run([FF,'-hide_banner','-i',src], capture_output=True, text=True).stderr
        fps = [t for t in fps.split() if t == 'fps']  # 값은 아래에서 -r 로 넘기지 않고 원본을 따른다
        subprocess.run([FF,'-y','-hide_banner','-loglevel','error','-i',src,
                        os.path.join(tmp,'f%05d.png')], check=True)
        가지 = sorted(f for f in os.listdir(tmp) if f.endswith('.png'))
        if not 가지: print('⛔ 프레임을 못 풀었다'); sys.exit(1)

        w,h = Image.open(os.path.join(tmp,가지[0])).size
        if 상자 is None:                       # 기본칸 = 오른쪽 아래
            상자 = (int(w*0.78), int(h*0.93), w, h)
        x0,y0,x1,y1 = 상자
        print(f'{w}×{h} · {len(가지)}장 · 지울 칸 = {상자}')

        # ⑵ ⛔ 그 칸에 «그림»이 걸리나 — 걸리면 죽는다
        최악 = 0
        for f in 가지:
            b = np.asarray(Image.open(os.path.join(tmp,f)).convert('RGB')).astype(int)[y0:y1, x0:x1]
            최악 = max(최악, int((b.min(axis=2) < 170).sum()))
        if 최악 and not 강제:
            print(f'⛔ 지울 칸에 «진한 픽셀» {최악}개 — 그림이 걸린다. 칸을 좁히거나 --force')
            sys.exit(1)
        print(f'✅ 진한 픽셀 {최악}개 — 그림이 안 걸린다')

        # ⑶ 프레임마다 «둘레 색»으로 덮는다 (프레임마다 다시 잰다 — 배경이 조금씩 변한다)
        for f in 가지:
            p = os.path.join(tmp,f)
            arr = np.asarray(Image.open(p).convert('RGB')).astype(int)
            위 = arr[max(0,y0-6):y0, x0:x1].reshape(-1,3)
            아래 = arr[y1:min(h,y1+6), x0:x1].reshape(-1,3)
            왼 = arr[y0:y1, max(0,x0-6):x0].reshape(-1,3)
            둘레 = np.concatenate([v for v in (위,아래,왼) if len(v)])
            arr[y0:y1, x0:x1] = 둘레.mean(axis=0).round().astype(int)
            Image.fromarray(arr.astype('uint8')).save(p)

        # ⑷ 다시 잇는다 — 소리가 있으면 그대로 가져온다
        소리 = subprocess.run([FF,'-hide_banner','-i',src], capture_output=True, text=True).stderr
        있다 = 'Audio:' in 소리
        cmd = [FF,'-y','-hide_banner','-loglevel','error','-framerate','24',
               '-i',os.path.join(tmp,'f%05d.png')]
        if 있다: cmd += ['-i',src,'-map','0:v','-map','1:a','-c:a','copy','-shortest']
        cmd += ['-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p',dst]
        subprocess.run(cmd, check=True)
        print(f'✅ {dst}')
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

main()
