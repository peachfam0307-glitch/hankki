// 🪞🍎 **저장 거울** — 아이폰 «앱» 안에서만, 우리 저장소를 폰 문서 폴더에 «한 벌 더» 둔다 (2026-09-08 · 큰 틀 5)
//
// 왜 = 앱 속 웹 저장소(localStorage·IndexedDB)는 OS 손에 있다. Capacitor 원문 = *"must be considered transient"*.
//   ⚠️ 정직하게 — 아이폰 앱 속 웹 저장소가 «언제» 지워지는지 원문을 못 찾았다(사파리 7일 규칙은 «사파리» 것).
//   모르니까 **지워져도 되살아나게** 둔다 — 실패의 모양을 바꾼다(절대원칙 34).
//   클라우드와 다르다: 로그인 안 한 사람도 지킨다 · 인터넷 없이 된다 · 유저 수와 무관(폰에서 되는 건 폰에).
//
// 무엇을 = 「있는 그대로」(계획 §11 ⓐ) — `localStorage` 의 `hankki:*` 전부 ＋ 창고(IndexedDB) 사진.
//   되살리기가 «글자 그대로 되돌려 놓기»라 비번·이사·합치기가 없다. 잠긴 일기도 잠긴 채로.
//   ⛔ 이 파일들은 «안쪽 전용»이다 — 유저에게 백업 파일로 주지 않는다(그건 백업 JSON 이 한다).
//
// 어디에 = Documents/한끼-거울/
//   본체.json      = { 판: 1, 쓴때, 서랍: { 'hankki:v1': '…', … } }      (글자 · 작다 · 지문이 바뀔 때만)
//   사진목록.json  = 성공적으로 써 둔 사진 열쇠 목록                       (⭐성공한 것만 — 못 쓴 장은 다음에 다시)
//   사진/<열쇠>.txt = 창고 사진 한 장(data: 글자 그대로)                     (바뀐 열쇠만 · 통째로 다시 안 쓴다)
//
// 언제 = 본체가 저장될 때(`store.jsx` `쓰기` 한 곳) → 10초 뒤 한 번 ＋ 화면이 뒤로 갈 때 즉시.
// 되살리기 = 켜자마자(첫 그리기 «전» · `main.jsx`) `hankki:v1` **키 자체가 없고** 거울 본체가 있으면.
//   ⛔ 잣대는 「키 없음」뿐이다 — 빈 값·에러·앱 초기화(`clear`/`reset` 은 키를 남긴다)는 «안» 걸린다.
//      그래야 옛 거울이 새 본체를 덮는 사고가 없다.
// 앱 밖(웹·안드로이드 TWA) = **아무것도 안 한다** (`Capacitor.isNativePlatform()` 아니면 return).
//
// 부품은 `window.Capacitor.Plugins.Filesystem` 으로 부른다 — 웹 번들에 npm 부품을 «안» 넣는다(안드로이드 배포와 무관).
//   껍데기(ios-app)엔 `@capacitor/filesystem` 8.1.3 이 깔려 있고 `cap sync` 가 등록한다.
//   ⚠️ 애플 제출엔 `PrivacyInfo.xcprivacy`(FileTimestamp C617.1) 가 «반드시» 있어야 한다 → ios-app/ios/App/App/ 에 뒀다.
//
// 재현판 = scripts/_repro-저장거울-0908.mjs (가짜 Capacitor·Filesystem·localStorage·창고로 노드에서 다섯 칸)

import { 열쇠들 as 창고열쇠들, 여럿꺼내기, 여럿넣기 } from './photoStore.js'

export const 거울폴더 = '한끼-거울'
export const 본체파일 = 거울폴더 + '/본체.json'
export const 사진목록파일 = 거울폴더 + '/사진목록.json'
export const 사진폴더 = 거울폴더 + '/사진'
export const 거울기다림 = 10 * 1000   // 저장 뒤 이만큼 잠잠하면 한 번 쓴다 — 매 저장마다 7MB 를 쓰지 않는다
const 본체열쇠 = 'hankki:v1'
const 접두 = 'hankki:'

// 🧪 재현판이 갈아끼울 수 있게 «환경»을 한 곳에 — 실물에선 전부 window 것
let 환경 = null
function 기본환경 () {
  const w = typeof window !== 'undefined' ? window : {}
  return {
    Capacitor: w.Capacitor,
    localStorage: typeof localStorage !== 'undefined' ? localStorage : null,
    document: typeof document !== 'undefined' ? document : null,
    setTimeout: (f, ms) => setTimeout(f, ms),
    clearTimeout: (t) => clearTimeout(t),
    창고: { 열쇠들: 창고열쇠들, 여럿꺼내기, 여럿넣기 },
    새로고침: () => { try { w.location.reload() } catch { /* noop */ } },
  }
}
/** 재현판 전용 — 가짜 환경을 끼운다. 실물 코드는 부르지 않는다. */
export function _환경끼우기 (가짜) { 환경 = 가짜 ? { ...기본환경(), ...가짜 } : null; 예약 = null; 마지막지문 = '' }
const 환경얻기 = () => 환경 || (환경 = 기본환경())

/** 아이폰(또는 안드로이드) «앱» 안인가 — 아니면 이 파일은 아무것도 안 한다 */
export function 앱안인가 (e = 환경얻기()) {
  try { return !!(e.Capacitor && e.Capacitor.isNativePlatform && e.Capacitor.isNativePlatform()) } catch { return false }
}
function 부품 (e = 환경얻기()) {
  try { return (e.Capacitor && e.Capacitor.Plugins && e.Capacitor.Plugins.Filesystem) || null } catch { return null }
}

// ── 파일 읽고 쓰기 (전부 Documents · utf8) ─────────────────────────────
const 문서 = 'DOCUMENTS'
async function 쓰기 (F, path, data) { await F.writeFile({ path, data, directory: 문서, encoding: 'utf8', recursive: true }) }
async function 읽기 (F, path) {
  try { const r = await F.readFile({ path, directory: 문서, encoding: 'utf8' }); return typeof r?.data === 'string' ? r.data : null }
  catch { return null }
}

/** 값이 «같은지» 싸게 본다 — 길이 ＋ 짧은 해시. 7MB 를 매번 비교하지 않으려고. */
export function 지문 (글) {
  let h = 5381
  for (let i = 0; i < 글.length; i++) h = ((h << 5) + h + 글.charCodeAt(i)) | 0
  return 글.length + ':' + (h >>> 0).toString(36)
}

/** 서랍(localStorage)에서 `hankki:*` 를 전부 모은다 */
export function 서랍모으기 (ls) {
  const 판 = {}
  if (!ls) return 판
  try {
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i)
      if (k && k.startsWith(접두)) { const v = ls.getItem(k); if (v != null) 판[k] = v }
    }
  } catch { /* 못 읽으면 모은 데까지 */ }
  return 판
}

const 사진파일이름 = (열쇠) => 사진폴더 + '/' + encodeURIComponent(열쇠) + '.txt'

// ── 뜨기 ──────────────────────────────────────────────────────────────
let 예약 = null
let 마지막지문 = ''
let 뜨는중 = null

/** 거울을 «지금» 한 번 뜬다. 돌려주는 값 = { 본체쓴나, 사진쓴수 } (재현판·기록용). 실패해도 던지지 않는다. */
export async function 거울뜨기 () {
  const e = 환경얻기()
  if (!앱안인가(e)) return { 본체쓴나: false, 사진쓴수: 0, 이유: '앱 밖' }
  const F = 부품(e)
  if (!F) return { 본체쓴나: false, 사진쓴수: 0, 이유: '부품 없음' }
  if (뜨는중) return 뜨는중   // 겹치면 지금 도는 것에 얹힌다
  뜨는중 = (async () => {
    let 본체쓴나 = false
    let 사진쓴수 = 0
    try {
      // ① 본체 — 지문이 같으면 안 쓴다
      const 서랍 = 서랍모으기(e.localStorage)
      if (서랍[본체열쇠] != null) {
        const 글 = JSON.stringify({ 판: 1, 쓴때: Date.now(), 서랍 })
        const 지금지문 = 지문(JSON.stringify(서랍))
        if (지금지문 !== 마지막지문) {
          await 쓰기(F, 본체파일, 글)
          마지막지문 = 지금지문
          본체쓴나 = true
        }
      }
      // ② 사진 — 창고 열쇠 중 «아직 안 뜬 것»만 파일 하나씩
      const 창고열쇠 = await e.창고.열쇠들()
      const 목록글 = await 읽기(F, 사진목록파일)
      let 뜬것 = []
      try { const p = JSON.parse(목록글 || '[]'); if (Array.isArray(p)) 뜬것 = p } catch { 뜬것 = [] }
      const 뜬셋 = new Set(뜬것)
      const 새열쇠 = 창고열쇠.filter((k) => !뜬셋.has(k))
      if (새열쇠.length) {
        const 사진들 = await e.창고.여럿꺼내기(새열쇠)
        for (const k of 새열쇠) {
          const v = 사진들[k]
          if (typeof v !== 'string') continue
          try { await 쓰기(F, 사진파일이름(k), v); 뜬셋.add(k); 사진쓴수++ } catch { /* 이 장은 다음에 다시 */ }
        }
      }
      // 창고에서 사라진 열쇠는 목록에서만 뺀다(파일은 두어도 되살릴 때 목록 기준이라 안 섞인다)
      const 창고셋 = new Set(창고열쇠)
      const 새목록 = [...뜬셋].filter((k) => 창고셋.has(k))
      if (사진쓴수 || 새목록.length !== 뜬것.length) await 쓰기(F, 사진목록파일, JSON.stringify(새목록))
    } catch { /* 거울은 덤이다 — 본체가 정본이라 실패해도 조용히 */ }
    return { 본체쓴나, 사진쓴수 }
  })()
  try { return await 뜨는중 } finally { 뜨는중 = null }
}

/** 저장이 있었다고 알린다 — 10초 잠잠하면 한 번 뜬다. 앱 밖이면 아무것도 안 한다(0 비용). */
export function 거울예약 () {
  const e = 환경얻기()
  if (!앱안인가(e)) return false
  if (예약) e.clearTimeout(예약)
  예약 = e.setTimeout(() => { 예약 = null; return 거울뜨기() }, 거울기다림)   // 돌려주는 건 재현판의 가짜 시계가 기다리려고
  return true
}

/** 화면이 뒤로 가면(앱 전환·끄기 직전) 기다리지 않고 바로 뜬다 */
export function 거울귀기울이기 () {
  const e = 환경얻기()
  if (!앱안인가(e) || !e.document) return
  e.document.addEventListener('visibilitychange', () => {
    if (e.document.visibilityState === 'hidden' && 예약) { e.clearTimeout(예약); 예약 = null; 거울뜨기() }
  })
}

// ── 되살리기 ──────────────────────────────────────────────────────────
/**
 * 켜자마자 부른다(첫 그리기 «전»). 본체 키가 «없고» 거울이 있으면 되돌려 놓고 새로고침한다.
 * 돌려주는 값 = 'skip'(할 일 없음) · 'restored'(되살렸다) · 'broken'(거울이 깨져 안 건드림)
 */
export async function 거울되살리기 () {
  const e = 환경얻기()
  if (!앱안인가(e)) return 'skip'
  const F = 부품(e)
  const ls = e.localStorage
  if (!F || !ls) return 'skip'
  try { if (ls.getItem(본체열쇠) !== null) return 'skip' } catch { return 'skip' }   // ⭐ 잣대 = 키 «자체가» 없음
  const 글 = await 읽기(F, 본체파일)
  if (글 == null) return 'skip'
  let 본체
  try { 본체 = JSON.parse(글) } catch { return 'broken' }
  if (!본체 || 본체.판 !== 1 || !본체.서랍 || typeof 본체.서랍[본체열쇠] !== 'string') return 'broken'
  // ① 서랍 되돌리기 — 본체 열쇠는 «맨 마지막»에. 중간에 끊겨도 「키 없음」이 남아 다음 켤 때 다시 온다
  try {
    for (const [k, v] of Object.entries(본체.서랍)) { if (k !== 본체열쇠 && k.startsWith(접두) && typeof v === 'string') ls.setItem(k, v) }
  } catch { /* 몇 칸 못 넣어도 본체만 있으면 앱은 산다 */ }
  // ② 사진 — 목록에 적힌 것만 창고에 다시
  try {
    const 목록 = JSON.parse((await 읽기(F, 사진목록파일)) || '[]')
    const 묶음 = []
    for (const k of Array.isArray(목록) ? 목록 : []) {
      const v = await 읽기(F, 사진파일이름(k))
      if (typeof v === 'string' && v.startsWith('data:')) 묶음.push([k, v])
    }
    if (묶음.length) await e.창고.여럿넣기(묶음)
  } catch { /* 사진은 못 살려도 글은 산다 — 쪽지(idb://)는 아이콘으로 그려진다 */ }
  try { ls.setItem(본체열쇠, 본체.서랍[본체열쇠]) } catch { return 'broken' }
  마지막지문 = 지문(JSON.stringify(본체.서랍))
  e.새로고침()
  return 'restored'
}

/** 거울을 지운다 — 앱 안 계정 삭제(5.1.1(v)) · 「모든 데이터 지우기」 때 같이 부른다 */
export async function 거울지우기 () {
  const e = 환경얻기()
  if (!앱안인가(e)) return false
  const F = 부품(e)
  if (!F) return false
  try { await F.rmdir({ path: 거울폴더, directory: 문서, recursive: true }); 마지막지문 = ''; return true } catch { return false }
}
