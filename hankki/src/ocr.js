// 사진에서 글자 읽기 (OCR)
// 1순위: 폰 내장 OCR(TextDetector, 안드로이드 크롬) — 한국어 인식이 훨씬 정확
// 2순위: tesseract.js (어디서나 동작). LSTM 엔진 + 전처리로 정확도를 최대한 끌어올린다.
import Tesseract, { createWorker } from 'tesseract.js'

function loadImg(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

// 결과가 의미있는 글자(한글·영문·숫자) 위주인지 — 아니면 다른 방법으로 넘어간다.
function looksGibberish(s) {
  const compact = String(s).replace(/\s/g, '')
  if (compact.length < 6) return true
  const good = (compact.match(/[가-힣a-zA-Z0-9]/g) || []).length
  return good / compact.length < 0.5
}

// 폰 내장 OCR (Shape Detection API). 있으면 이걸 먼저 쓴다 — 한국어에 강하다.
async function detectWithPlatform(dataUrl) {
  try {
    if (!('TextDetector' in window)) return null
    const img = await loadImg(dataUrl)
    if (!img) return null
    const det = new window.TextDetector()
    const results = await det.detect(img)
    if (!results || !results.length) return null
    // 위→아래, 왼→오른쪽 순으로 정렬해 줄을 재구성
    results.sort((a, b) => {
      const dy = (a.boundingBox?.top || 0) - (b.boundingBox?.top || 0)
      if (Math.abs(dy) > 12) return dy
      return (a.boundingBox?.left || 0) - (b.boundingBox?.left || 0)
    })
    return results.map((r) => r.rawValue).filter(Boolean).join('\n')
  } catch {
    return null
  }
}

// tesseract용 전처리 — 정확도의 핵심.
//  · 작은 캡처는 키우고(글자 해상도↑), 큰 사진은 적당히 줄여 메모리 부담↓
//  · 흑백 + 대비 강화
//  · 어두운 배경(흰 글씨: 인스타·유튜브 다크모드)은 자동 반전 → 검은 글씨/흰 배경
//    판단은 평균이 아닌 '중앙값' — 캡처 안에 밝은 음식 사진이 섞여 있어도 속지 않는다.
function preprocess(dataUrl, forceInvert) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const longSide = Math.max(img.width, img.height)
        let scale = 1
        if (longSide < 1500) scale = Math.min(3, 1500 / longSide)
        else if (longSide > 2400) scale = 2400 / longSide
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        const ctx = c.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        const im = ctx.getImageData(0, 0, w, h)
        const d = im.data
        // 1) 그레이스케일 + 밝기 히스토그램
        const hist = new Uint32Array(256)
        for (let i = 0; i < d.length; i += 4) {
          const g = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) | 0
          d[i] = d[i + 1] = d[i + 2] = g
          hist[g]++
        }
        const total = d.length / 4
        let acc = 0
        let median = 127
        for (let v = 0; v < 256; v++) {
          acc += hist[v]
          if (acc >= total / 2) { median = v; break }
        }
        const invert = forceInvert !== undefined ? forceInvert : median < 110
        // 2) (필요시) 반전 + 대비 강화
        const contrast = 1.5
        for (let i = 0; i < d.length; i += 4) {
          let g = invert ? 255 - d[i] : d[i]
          g = (g - 128) * contrast + 128
          g = g < 0 ? 0 : g > 255 ? 255 : g
          d[i] = d[i + 1] = d[i + 2] = g
        }
        ctx.putImageData(im, 0, 0)
        resolve({ url: c.toDataURL('image/png'), inverted: invert })
      } catch {
        resolve({ url: dataUrl, inverted: false })
      }
    }
    img.onerror = () => resolve({ url: dataUrl, inverted: false })
    img.src = dataUrl
  })
}

// tesseract 워커는 한 번만 만들어 재사용(여러 장 연속 인식이 빠르다).
let _workerPromise = null
let _progressCb = null

function getWorker() {
  if (!_workerPromise) {
    _workerPromise = createWorker('kor+eng', 1, {
      logger: (m) => {
        if (m && m.status === 'recognizing text' && _progressCb) {
          _progressCb(Math.round((m.progress || 0) * 100))
        }
      },
    })
      .then(async (w) => {
        try {
          await w.setParameters({
            tessedit_pageseg_mode: '6', // 단일 텍스트 블록(캡처 레시피에 적합)
            preserve_interword_spaces: '1',
            user_defined_dpi: '300',
          })
        } catch {
          /* noop */
        }
        return w
      })
      .catch((e) => {
        _workerPromise = null
        throw e
      })
  }
  return _workerPromise
}

// 뜻있는 글자 수 — 두 인식 결과 중 나은 쪽 고르는 기준
function goodChars(s) {
  return (String(s).match(/[가-힣a-zA-Z0-9]/g) || []).length
}

export async function ocrImage(image, onProgress) {
  // 1) 폰 내장 OCR 먼저 (있으면 훨씬 정확, 언어데이터 다운로드도 없음)
  if (typeof image === 'string') {
    if (onProgress) onProgress(15)
    const platform = await detectWithPlatform(image)
    if (platform && !looksGibberish(platform)) {
      if (onProgress) onProgress(100)
      return platform
    }
  }
  // 2) tesseract (전처리 + LSTM 엔진)
  try {
    const worker = await getWorker()
    const recognize = async (src) => {
      _progressCb = onProgress || null
      const { data } = await worker.recognize(src)
      _progressCb = null
      return (data && data.text) || ''
    }
    if (typeof image !== 'string') return await recognize(image)

    const p1 = await preprocess(image)
    let text = await recognize(p1.url)
    // 결과가 외계어면 반전을 뒤집어 한 번 더 — 다크모드/혼합 배경 캡처 대비
    if (looksGibberish(text)) {
      const p2 = await preprocess(image, !p1.inverted)
      const t2 = await recognize(p2.url)
      if (goodChars(t2) > goodChars(text)) text = t2
    }
    return text
  } catch {
    _progressCb = null
    // 워커 생성 실패 등 — 편의 함수로 한 번 더 시도
    try {
      const processed = typeof image === 'string' ? (await preprocess(image)).url : image
      const res = await Tesseract.recognize(processed, 'kor+eng')
      return (res && res.data && res.data.text) || ''
    } catch {
      return ''
    }
  }
}
