// 사진에서 글자 읽기 (OCR) — tesseract.js, 한국어+영어, 폰 안에서 처리.
// 첫 사용 시 언어 데이터를 내려받고, 이후엔 서비스워커가 캐시해 오프라인도 동작.
import Tesseract from 'tesseract.js'

// 인식률을 높이기 위한 전처리: 작은 캡처는 키우고, 흑백 + 대비를 강하게.
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
          g = (g - 128) * 1.45 + 128 // 대비 강화 (글자를 또렷하게)
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
