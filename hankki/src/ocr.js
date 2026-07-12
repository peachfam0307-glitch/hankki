// 사진에서 글자 읽기 (OCR)
// 1순위: 폰 내장 OCR(TextDetector, 안드로이드 크롬) — 한국어 인식이 훨씬 정확
// 2순위: tesseract.js (어디서나 동작, 첫 사용 시 언어데이터 내려받고 SW가 캐시)
import Tesseract from 'tesseract.js'

function loadImg(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

// 폰 내장 OCR (Shape Detection API). 있으면 이걸 먼저 쓴다.
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

// tesseract용 전처리: 작은 캡처는 키우고, 흑백 + 대비 강화.
function preprocess(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const targetW = 1500
        const scale = Math.min(3, Math.max(1, targetW / img.width))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        const ctx = c.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        const im = ctx.getImageData(0, 0, w, h)
        const d = im.data
        for (let i = 0; i < d.length; i += 4) {
          let g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
          g = (g - 128) * 1.45 + 128
          g = g < 0 ? 0 : g > 255 ? 255 : g
          d[i] = d[i + 1] = d[i + 2] = g
        }
        ctx.putImageData(im, 0, 0)
        resolve(c.toDataURL('image/png'))
      } catch {
        resolve(dataUrl)
      }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

export async function ocrImage(image, onProgress) {
  // 1) 폰 내장 OCR 먼저 (있으면 훨씬 정확, 언어데이터 다운로드도 없음)
  if (typeof image === 'string') {
    if (onProgress) onProgress(30)
    const platform = await detectWithPlatform(image)
    if (platform && platform.replace(/\s/g, '').length > 4) {
      if (onProgress) onProgress(100)
      return platform
    }
  }
  // 2) tesseract 폴백
  try {
    const processed = typeof image === 'string' ? await preprocess(image) : image
    const res = await Tesseract.recognize(processed, 'kor+eng', {
      logger: (m) => {
        if (onProgress && m && m.status === 'recognizing text') {
          onProgress(Math.round((m.progress || 0) * 100))
        }
      },
    })
    return (res && res.data && res.data.text) || ''
  } catch (e) {
    return ''
  }
}
