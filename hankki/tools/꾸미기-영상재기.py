#!/usr/bin/env python3
"""🎯 창업자 꾸미기 영상(마지막 프레임)에서 조각 자리·크기·각도를 «재서» 푼다 (2026-11-11)
쓰는 법: python3 tools/꾸미기-영상재기.py <프레임.png> <key> [<key> …]
· 프레임 = 꾸미기 판 «전체»(앱 공유 영상 = 판만 찍힌다) → x=중심/폭, y=중심/높이, s=그림폭/판폭(DecorLayer width=s*100%)
· 알파 마스크 템플릿 맞추기(cv2) — 크기·각도를 거칠게→곱게 두 번 훑는다. 점수(0~1)가 낮으면 «못 찾음»이다.
"""
import sys, glob, cv2, numpy as np
fr = cv2.imread(sys.argv[1]); H, W = fr.shape[:2]
def 판(key):
    p = glob.glob(f'src/assets/stickers/**/{key}.png', recursive=True)[0]
    return cv2.imread(p, cv2.IMREAD_UNCHANGED)
def 돌림(img, deg):
    h, w = img.shape[:2]; M = cv2.getRotationMatrix2D((w/2, h/2), -deg, 1)
    c, s_ = abs(M[0,0]), abs(M[0,1]); nw, nh = int(h*s_+w*c), int(h*c+w*s_)
    M[0,2] += nw/2-w/2; M[1,2] += nh/2-h/2
    return cv2.warpAffine(img, M, (nw, nh), flags=cv2.INTER_AREA, borderValue=(0,0,0,0))
def 찾기(key, ss, rs, k=0.5):
    t0 = 판(key); f = cv2.resize(fr, None, fx=k, fy=k, interpolation=cv2.INTER_AREA); best = None
    for s in ss:
        tw = s*W*k; sc = tw/t0.shape[1]
        if tw < 8: continue
        t1 = cv2.resize(t0, None, fx=sc, fy=sc, interpolation=cv2.INTER_AREA)
        for r in rs:
            t = 돌림(t1, r); a = t[:,:,3]
            if t.shape[0] >= f.shape[0] or t.shape[1] >= f.shape[1]: continue
            m = (a > 200).astype(np.uint8)*255
            res = cv2.matchTemplate(f, t[:,:,:3], cv2.TM_CCOEFF_NORMED, mask=m)
            res = np.nan_to_num(res, nan=0, posinf=0, neginf=0)
            _, v, _, loc = cv2.minMaxLoc(res)
            if best is None or v > best[0]:
                best = (v, s, r, (loc[0]+t.shape[1]/2)/k/W, (loc[1]+t.shape[0]/2)/k/H)
    return best
for arg in sys.argv[2:]:   # key 또는 key:최소s:최대s (눈대중 범위 — 가려진 조각이 엉뚱한 작은 자리에 붙는 걸 막는다)
    key, *범위 = arg.split(':'); lo, hi = (float(범위[0]), float(범위[1])) if 범위 else (0.08, 0.70)
    v, s, r, x, y = 찾기(key, np.arange(lo, hi + 1e-9, 0.02), range(-24, 25, 4), 0.35)
    v, s, r, x, y = 찾기(key, np.arange(max(lo, s-0.025), min(hi, s+0.025) + 1e-9, 0.004), np.arange(r-4, r+4.1, 1), 0.6)
    print(f"{key}\tx {x:.4f}\ty {y:.4f}\ts {s:.3f}\tr {r:+.0f}\t점수 {v:.3f}")
