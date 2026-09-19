// 🔔📮 폰 알림 «구독» — 허락(pushConsent)이 난 «뒤»에 폰 주소를 만들어 워커에 보낸다. (2026-09-19 · 3번)
//
// 📄 설계 = docs/알림-설계-2026-09-19.md · 워커 = ocr-proxy/worker-push.js
//
// ⛔⛔ 왜 허락과 구독을 «가르나» — `pushConsent.js` 는 화면·네트워크를 모른다(aiConsent 와 같은 꼴).
//    여기는 네트워크를 «안다». 둘을 섞으면 재현판이 가짜 폰으로 못 돌린다.
// ⛔ 실패해도 앱은 «그대로» 돈다 — 구독 보내기가 안 되면 다음에 또 담을 때 다시 한다(허락은 이미 폰에 남아 있다).
// ⭐ 서비스워커를 새로 등록하지 «않는다» — 이미 도는 `src/sw.js` 를 `navigator.serviceWorker.ready` 로 «찾는다».
// 🔒 재현판 = scripts/_repro-알림허락-0919.mjs ⑧

import { 알림허락받기, 알림동의상태, 알림동의쓰기, 푸시가능, 브라우저권한 } from './pushConsent'
import { OCR_APP_TOKEN } from './ocr'

export const PUSH_URL = 'https://hankki-push.annyeong-hankki.workers.dev'   // ⛔ 워커 이름이 `hankki-push` 여야 이 주소가 난다
const 보낸표 = 'hankki:push:subscribed'   // 값 = 워커에 «이미 보낸» endpoint — 같은 주소를 매번 다시 보내지 않는다(KV 쓰기 1,000/일)

/** 🙋 담기가 끝난 직후 부른다 = 허락 → 켜졌으면 구독까지. Promise<boolean>
 *  ⚙️ 설정 「켜기」는 { 다시묻기: true } — 우리 시트에서 「괜찮아요」 했던 사람도 다시 물을 수 있다. */
export async function 알림켜기({ 다시묻기 = false } = {}) {
  let 됐나 = false
  try { 됐나 = await 알림허락받기({ 다시묻기 }) } catch { 됐나 = false }
  if (!됐나) return false
  return 구독맞추기()
}

/** ⚙️ 설정 「끄기」 — 구독을 «폰에서» 지우고 우리 답을 no 로. 워커 칸은 다음 보낼 때 410 이 와서 스스로 빠진다(따로 지우는 길을 안 만든다).
 *  ⛔ 브라우저 권한은 우리가 못 내린다 — 하지만 구독이 없으면 아무것도 안 온다. */
export async function 알림끄기() {
  try {
    if (푸시가능()) {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()
    }
  } catch { /* 못 지워도 아래 답은 no 로 남긴다 — 다음 구독맞추기가 안 돈다 */ }
  try { localStorage.removeItem(보낸표) } catch { /* noop */ }
  알림동의쓰기('no')
  return true
}

/** 🔁 켜져 있는 폰이면 구독이 워커에 «있게» 맞춘다 — 앱을 켤 때도 한 번 부른다(서비스워커가 바뀌어도 살아남게). */
export async function 구독맞추기() {
  try {
    if (!푸시가능() || 알림동의상태() !== 'yes' || 브라우저권한() !== 'granted') return false
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      const r = await fetch(`${PUSH_URL}/vapid`)
      if (!r.ok) return false
      const { pub } = await r.json()
      if (!pub) return false
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64urlToBytes(pub) })
    }
    let 이미 = null
    try { 이미 = localStorage.getItem(보낸표) } catch { 이미 = null }
    if (이미 === sub.endpoint) return true
    const r = await fetch(`${PUSH_URL}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-hankki-token': OCR_APP_TOKEN },
      body: JSON.stringify({ platform: 'web', sub: sub.toJSON() }),
    })
    if (!r.ok) return false
    try { localStorage.setItem(보낸표, sub.endpoint) } catch { /* 못 적어도 된다 — 다음에 한 번 더 보낼 뿐 */ }
    return true
  } catch { return false }
}

function b64urlToBytes(s) {
  const b64 = (s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}
