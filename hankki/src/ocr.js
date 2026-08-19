// 사진에서 글자 읽기 (OCR)
// 1순위: Google Vision OCR 프록시(Cloudflare Worker) — 한국어 인식 최상. 키는 서버에만 숨김.
// 2순위: 폰 내장 OCR(TextDetector) — 있으면 사용(요즘 크롬은 기본 비활성이라 대개 건너뜀).
// 3순위: tesseract.js (어디서나 동작·오프라인). LSTM 엔진 + 전처리.
import Tesseract, { createWorker } from 'tesseract.js'
import { normalizeNumerals } from './ocrCorrect'
// 🔌 우리 서버와 주고받는 공통 부품(주소·앱토큰·기기번호·남은 장수) — 결제도 «같은 것»을 쓴다
import { OCR_PROXY_URL, OCR_APP_TOKEN, deviceId, saveOcrLeft } from './proxy'
export { getOcrLeft } from './proxy'

// ── Google Vision OCR 프록시 ──────────────────────────────────
// 서버(Cloudflare Worker)가 API 키를 숨기고 Vision을 호출해 '텍스트'만 돌려준다.
// 프록시엔 6중 방어벽(월 900건 상한 등)이 있어 비용 $0을 물리적으로 보장한다.
// 실패(오프라인·한도초과·오류)하면 아래 폰내장/tesseract로 '조용히' 폴백 → OCR은 늘 동작.
// ⚠️ 결제(`src/billing.js`)도 «같은 서버·같은 토큰»을 쓴다 → `src/proxy.js` 한 곳에만 적는다.

// 마지막 프록시 호출의 안내 신호 — 'user_quota'(내 월 무료 소진)·'global_quota'·'rate_limited'.
// 앱(EditorScreen)이 읽어 "무료 다 써서 기본 인식이에요" 안내를 띄운다. 읽으면 소비(초기화).
let _ocrNote = null
export function getOcrNote() {
  const n = _ocrNote
  _ocrNote = null
  return n
}


// 프록시로 OCR 시도 → 성공 시 텍스트, 실패 시 예외를 던져 폴백을 유도.
// batch = 🔢「한 묶음 = 1장」 표식. 같은 값으로 보내면 서버가 «유저 장수»를 한 번만 깎는다.
//   (앱의 편집 화면 한 번 = 레시피 하나 = 한 묶음 · 창업자 확정 2026-08-13)
async function ocrViaProxy(dataUrl, onProgress, batch) {
  _ocrNote = null
  if (typeof dataUrl !== 'string' || !/^data:image\//.test(dataUrl)) throw new Error('not_dataurl')
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('offline')
  if (onProgress) onProgress(8)
  // ⏳⏳ [2026-08-16] **막대가 «기어가게» 한다** — 창업자 *"레시피 2장 안내시 로딩 오래걸리는거"*
  //   🔬 옛 판 = 여기서 35 를 한 번 주고, 서버가 답할 때까지 **막대가 그 자리에 멈춰 있었다.**
  //      올리는 것도 기다리는 것도 «알려줄 게 없어서» 아무 소식이 없다.
  //   ⛔ 멈춘 막대는 「오래 걸린다」가 아니라 **「고장났다」로 읽힌다** — 그게 앱을 끄는 순간이다.
  //   ✅ 그래서 서버를 기다리는 동안 8 → 85 로 «조금씩» 올린다. 85 에서 멈추고, 답이 오면 92 → 100.
  //      ⚠️ 100 까지 밀지 않는다 — 다 찼는데 안 끝나면 그게 더 「고장」처럼 보인다.
  //      ⚠️ 시간을 «맞히려» 하지 않는다. 빠르면 금방 92 로 뛰어넘고, 느리면 85 에서 기다린다.
  let 기어감 = null
  if (onProgress) {
    let p = 8
    기어감 = setInterval(() => {
      p += Math.max(0.6, (85 - p) * 0.06) // 뒤로 갈수록 느려진다 — 끝이 가까운 척하지 않으려고
      if (p >= 85) { p = 85; clearInterval(기어감); 기어감 = null }
      onProgress(Math.round(p))
    }, 220)
  }
  const 그만기어 = () => { if (기어감) { clearInterval(기어감); 기어감 = null } }
  const headers = { 'Content-Type': 'application/json', 'x-hankki-token': OCR_APP_TOKEN }
  // 운영자 무제한 모드(이 기기가 ?founder=…로 진입해 둔 경우)면 무제한 헤더를 실어 보낸다.
  try {
    const f = localStorage.getItem('hankki:founder')
    if (f) headers['x-hankki-founder'] = f
  } catch {
    /* noop */
  }
  let resp
  try {
    resp = await fetch(OCR_PROXY_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ image: dataUrl, uid: deviceId(), batch: batch || '' }),
    })
  } catch (e) {
    그만기어() // ⛔ 던지기 전에 반드시 멈춘다 — 안 그러면 폴백이 도는 내내 막대가 혼자 기어간다
    throw e
  }
  그만기어()
  if (!resp.ok) {
    // 429(한도 초과) → 어느 한도인지 기록(앱이 "무료 다 썼어요" 안내). 전부 폴백으로 넘긴다 — 앱은 늘 동작해야 하니까.
    if (resp.status === 429) {
      const d = await resp.json().catch(() => null)
      _ocrNote = (d && d.error) || 'quota'
    }
    throw new Error('proxy_http_' + resp.status)
  }
  const data = await resp.json().catch(() => null)
  if (onProgress) onProgress(92)
  // 📢 남은 장수 — 서버가 매번 같이 보내준다. ⛔예전엔 이 줄을 «버렸다»(창업자 *"카운트가 안된다고"*).
  if (data && data.left) saveOcrLeft(data.left)
  return (data && data.text) || ''
}
// ── 📢 AI 스캔 남은 장수 ────────────────────────────────────
// ⭐ 저장·읽기는 `src/proxy.js` 로 옮겼다 — 결제(`src/billing.js`)도 같은 칸을 고쳐야 하기 때문이다.
//   여기서는 «받아서 넘기는» 일만 한다. (`getOcrLeft` 는 위에서 그대로 다시 내보낸다)

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

// 폰 세로 캡처(스크린샷)인지 — 맞으면 상태바(위 4.5%)와 하단 바(아래 5%)를 잘라
// "KT 7:38" 같은 상태바 글자나 댓글 입력창이 레시피에 섞이지 않게 한다.
function screenshotCrop(img) {
  const isPhoneShot = img.height / img.width >= 1.7
  const top = isPhoneShot ? Math.round(img.height * 0.045) : 0
  const bottom = isPhoneShot ? Math.round(img.height * 0.05) : 0
  return { top, height: img.height - top - bottom }
}

// 폰 내장 OCR (Shape Detection API). 있으면 이걸 먼저 쓴다 — 한국어에 강하다.
async function detectWithPlatform(dataUrl, noCrop) {
  try {
    if (!('TextDetector' in window)) return null
    const img = await loadImg(dataUrl)
    if (!img) return null
    const crop = noCrop ? { top: 0, height: img.height } : screenshotCrop(img)
    const c = document.createElement('canvas')
    c.width = img.width
    c.height = crop.height
    c.getContext('2d').drawImage(img, 0, crop.top, img.width, crop.height, 0, 0, img.width, crop.height)
    const det = new window.TextDetector()
    const results = await det.detect(c)
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

// 국소 적응형 이진화(Bradley–Roth) — OCR 정확도의 진짜 승부처.
// 이미지 전체에 같은 기준을 쓰는 대신, 각 픽셀 주변 창(window)의 평균과 비교해
// 글자/배경을 나눈다. 그래서 그림자·구김·불균일 조명(영수증·기울여 찍은 사진)에서도
// 글자가 뭉개지지 않는다. 적분영상(integral image)으로 O(n) 처리.
function bradleyThreshold(gray, w, h) {
  const S = Math.max(16, Math.round(Math.max(w, h) / 20)) // 창 크기 — 글자보다 조금 크게
  const half = S >> 1
  const T = 0.15 // 지역 평균 대비 이만큼 어두우면 글자(잉크)로 본다
  const iw = w + 1
  const integral = new Float64Array(iw * (h + 1))
  for (let y = 1; y <= h; y++) {
    let rowsum = 0
    const rowOff = (y - 1) * w
    const curOff = y * iw
    const upOff = (y - 1) * iw
    for (let x = 1; x <= w; x++) {
      rowsum += gray[rowOff + (x - 1)]
      integral[curOff + x] = integral[upOff + x] + rowsum
    }
  }
  const out = new Uint8ClampedArray(w * h)
  for (let y = 0; y < h; y++) {
    const y1 = y - half < 0 ? 0 : y - half
    const y2 = y + half >= h ? h - 1 : y + half
    const rowOff = y * w
    for (let x = 0; x < w; x++) {
      const x1 = x - half < 0 ? 0 : x - half
      const x2 = x + half >= w ? w - 1 : x + half
      const count = (x2 - x1 + 1) * (y2 - y1 + 1)
      const sum =
        integral[(y2 + 1) * iw + (x2 + 1)] -
        integral[y1 * iw + (x2 + 1)] -
        integral[(y2 + 1) * iw + x1] +
        integral[y1 * iw + x1]
      const val = gray[rowOff + x]
      out[rowOff + x] = val * count <= sum * (1 - T) ? 0 : 255
    }
  }
  return out
}

// tesseract용 전처리 — 정확도의 핵심.
//  · 작은 캡처는 키우고(글자 해상도↑), 큰 사진은 적당히 줄여 메모리 부담↓
//  · 흑백 + 밝기 중앙값으로 반전 여부 판단(밝은 음식 사진이 섞여도 안 속음)
//  · mode 'global'  : 반전 + 전역 대비 강화 (오버레이 자막 등 색 배경에 강함)
//  · mode 'adaptive': 국소 적응형 이진화 (문서·영수증·조명 얼룩에 강함)
function preprocess(dataUrl, forceInvert, noCrop, mode = 'global') {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const crop = noCrop ? { top: 0, height: img.height } : screenshotCrop(img)
        const longSide = Math.max(img.width, crop.height)
        // 적응형은 적분영상 메모리(Float64)가 커서 상한을 조금 낮춘다(1600px면 글자 충분).
        const maxDown = mode === 'adaptive' ? 1600 : 2400
        let scale = 1
        if (longSide < 1500) scale = Math.min(3, 1500 / longSide)
        else if (longSide > maxDown) scale = maxDown / longSide
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(crop.height * scale))
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        const ctx = c.getContext('2d')
        ctx.drawImage(img, 0, crop.top, img.width, crop.height, 0, 0, w, h)
        const im = ctx.getImageData(0, 0, w, h)
        const d = im.data
        // 1) 그레이스케일 + 밝기 히스토그램 (반전 판단용)
        const total = w * h
        const gray = new Uint8ClampedArray(total)
        const hist = new Uint32Array(256)
        for (let p = 0, i = 0; p < total; p++, i += 4) {
          const g = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) | 0
          gray[p] = g
          hist[g]++
        }
        let acc = 0
        let median = 127
        for (let v = 0; v < 256; v++) {
          acc += hist[v]
          if (acc >= total / 2) { median = v; break }
        }
        const invert = forceInvert !== undefined ? forceInvert : median < 110
        // 필요하면 먼저 반전해 '검은 글씨 / 흰 배경'으로 통일
        if (invert) for (let p = 0; p < total; p++) gray[p] = 255 - gray[p]

        if (mode === 'adaptive') {
          const bin = bradleyThreshold(gray, w, h)
          for (let p = 0, i = 0; p < total; p++, i += 4) {
            d[i] = d[i + 1] = d[i + 2] = bin[p]
          }
        } else {
          // 전역 대비 강화
          const contrast = 1.5
          for (let p = 0, i = 0; p < total; p++, i += 4) {
            let g = (gray[p] - 128) * contrast + 128
            g = g < 0 ? 0 : g > 255 ? 255 : g
            d[i] = d[i + 1] = d[i + 2] = g
          }
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

// 인식 직전에 페이지 분할 모드(PSM)를 바꾼다.
//  · 6 = 단일 텍스트 블록 (레시피 캡처처럼 문단이 뭉쳐 있을 때)
//  · 4 = 여러 크기의 단일 컬럼 (영수증처럼 '품목 … 금액'이 줄줄이 있을 때 더 정확)
let _curPsm = '6'
async function setPsm(worker, psm) {
  if (_curPsm === psm) return
  try {
    await worker.setParameters({ tessedit_pageseg_mode: psm })
    _curPsm = psm
  } catch {
    /* noop */
  }
}

// 뜻있는 글자 수 — 두 인식 결과 중 나은 쪽 고르는 기준
function goodChars(s) {
  return (String(s).match(/[가-힣a-zA-Z0-9]/g) || []).length
}

// 신뢰도 기반 조립 — tesseract 가 음식 사진·아이콘에서 '지어낸' 단어는 신뢰도가
// 낮다. 줄 평균이 낮으면 통째로 버리고, 살아남은 줄에서도 저신뢰 단어만 도려낸다.
// (외계어의 최대 원인: 캡처 속 영상 화면을 글자로 착각하는 것)
// 줄 텍스트는 tesseract 원문(ln.text)을 쓴다 — 단어를 이어붙이면 한글 띄어쓰기가 깨진다.
const WORD_MIN_CONF = 40
const LINE_MIN_CONF = 55

function assembleFromBlocks(data) {
  if (!data || !Array.isArray(data.blocks)) return null
  const lines = []
  for (const b of data.blocks) {
    for (const par of b.paragraphs || []) {
      for (const ln of par.lines || []) {
        const words = (ln.words || []).filter((w) => w && w.text && w.text.trim())
        const kept = words.filter((w) => (w.confidence || 0) >= WORD_MIN_CONF)
        if (!kept.length) continue
        const avg = kept.reduce((s, w) => s + w.confidence, 0) / kept.length
        if (avg < LINE_MIN_CONF) continue
        let text = String(ln.text || '').replace(/\n/g, ' ')
        for (const w of words) {
          // 한글 단어는 남긴다 — 진짜 단어의 낮은 음절 하나를 파내면 "고추가루"가 "고 가루"가 된다.
          if ((w.confidence || 0) < WORD_MIN_CONF && !/[가-힣]/.test(w.text)) text = text.replace(w.text, ' ')
        }
        text = text.replace(/\s{2,}/g, ' ').trim()
        if (text) lines.push(text)
      }
    }
  }
  return lines.join('\n')
}

// opts.noCrop: 영수증처럼 폰 캡처가 아닌 사진은 상태바 자르기를 건너뛴다(내용이 잘리니까).
export async function ocrImage(image, onProgress, opts = {}) {
  // 0) Google Vision 프록시 우선 — 한국어 인식 최상. 실패하면 폰내장→tesseract로 폴백.
  if (typeof image === 'string') {
    try {
      const t = await ocrViaProxy(image, onProgress, opts.batch)
      if (t && !looksGibberish(t)) {
        if (onProgress) onProgress(100)
        return normalizeNumerals(t)
      }
    } catch {
      /* 폴백 계속 (오프라인·한도·오류) */
    }
  }
  // 1) 폰 내장 OCR (있으면 정확, 요즘 크롬은 기본 비활성이라 대개 건너뜀)
  if (typeof image === 'string') {
    if (onProgress) onProgress(15)
    const platform = await detectWithPlatform(image, opts.noCrop)
    if (platform && !looksGibberish(platform)) {
      if (onProgress) onProgress(100)
      return platform
    }
  }
  // 2) tesseract (전처리 + LSTM 엔진 + 신뢰도 필터). 숫자 오독은 마지막에 교정.
  const finish = (t) => normalizeNumerals(t)
  try {
    const worker = await getWorker()
    const recognize = async (src, psm = '6') => {
      await setPsm(worker, psm)
      _progressCb = onProgress || null
      const { data } = await worker.recognize(src, {}, { blocks: true, text: true })
      _progressCb = null
      const raw = (data && data.text) || ''
      // 영수증은 파서(receipt.js)가 헤더·노이즈를 스스로 거른다 — 신뢰도 필터로
      // 품목 줄을 잃지 않게 원문(raw)을 그대로 넘긴다. (인식률 저하의 숨은 원인)
      if (opts.receipt) return raw
      const filtered = assembleFromBlocks(data)
      // 필터가 과하게 지웠으면(진짜 글자까지) 원문으로 폴백 — 파서가 걸러준다.
      if (filtered && goodChars(filtered) >= Math.min(20, goodChars(raw) * 0.3)) return filtered
      return raw
    }
    if (typeof image !== 'string') return finish(await recognize(image))

    if (opts.receipt) {
      // 영수증: 적응형 이진화 + 컬럼(PSM 4)이 1순위 — 그림자·구김·조명 얼룩에 강하다.
      const a = await preprocess(image, undefined, opts.noCrop, 'adaptive')
      let text = await recognize(a.url, '4')
      // 살아난 품목 줄이 적으면 전역 대비(PSM 6)로 한 번 더 — 둘 중 나은 쪽.
      if (looksGibberish(text) || goodChars(text) < 12) {
        const g = await preprocess(image, undefined, opts.noCrop, 'global')
        const t2 = await recognize(g.url, '6')
        if (goodChars(t2) > goodChars(text)) text = t2
      }
      return finish(text)
    }

    // 레시피(캡처): 전역 대비가 1순위 — 인스타·유튜브 색 배경 자막에 강하다.
    const p1 = await preprocess(image, undefined, opts.noCrop, 'global')
    let text = await recognize(p1.url, '6')
    // 외계어면 적응형(자동 반전)으로 구제 — 조명 얼룩·저대비 캡처 대비.
    if (looksGibberish(text)) {
      const a = await preprocess(image, undefined, opts.noCrop, 'adaptive')
      const t2 = await recognize(a.url, '6')
      if (goodChars(t2) > goodChars(text)) text = t2
    }
    // 그래도 외계어면 반전을 뒤집어 마지막 시도 — 다크모드 자막 대비.
    if (looksGibberish(text)) {
      const p3 = await preprocess(image, !p1.inverted, opts.noCrop, 'global')
      const t3 = await recognize(p3.url, '6')
      if (goodChars(t3) > goodChars(text)) text = t3
    }
    return finish(text)
  } catch {
    _progressCb = null
    // 워커 생성 실패 등 — 편의 함수로 한 번 더 시도
    try {
      const processed = typeof image === 'string' ? (await preprocess(image, undefined, opts.noCrop)).url : image
      const res = await Tesseract.recognize(processed, 'kor+eng')
      return finish((res && res.data && res.data.text) || '')
    } catch {
      return ''
    }
  }
}
