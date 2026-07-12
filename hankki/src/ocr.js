// 사진에서 글자 읽기 (OCR) — tesseract.js, 한국어+영어, 폰 안에서 처리.
// 첫 사용 시 언어 데이터를 내려받고, 이후엔 서비스워커가 캐시해 오프라인도 동작.
import Tesseract from 'tesseract.js'

export async function ocrImage(image, onProgress) {
  try {
    const res = await Tesseract.recognize(image, 'kor+eng', {
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
