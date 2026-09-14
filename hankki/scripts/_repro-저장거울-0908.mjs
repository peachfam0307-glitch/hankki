#!/usr/bin/env node
// 🪞🍎 저장 거울 재현판 — 2026-09-08 (큰 틀 5 · 계획 §11)
//
// 가짜 Capacitor·Filesystem·localStorage·창고로 노드에서 돈다(아이폰 없이).
// 재는 것
//   ① 저장 뒤 거울이 «한 번» 써진다(디바운스 — 저장 세 번에 쓰기 한 번) · 지문이 같으면 다시 안 쓴다
//   ② 본체 «키 없음» ＋ 거울 있음 → 되살아난다(서랍 hankki:* 전부 ＋ 사진이 창고로 ＋ 새로고침 한 번)
//   ③ 깨진 거울 → 안 건드린다(서랍 그대로 · 새로고침 0)
//   ④ 앱 밖(isNativePlatform=false) → 아무것도 안 한다(파일 0 · 예약 false · 되살리기 'skip')
//   ⑤ 사진은 «바뀐 것만» 쓴다(두 번째 뜨기에 새 열쇠 1장만)
//   ⑥ 본체 키가 «있으면»(빈 값이어도) 거울이 있어도 안 덮는다 — 옛 거울이 새 본체를 덮는 사고 금지
import * as M from '../src/mirror.js'

let 나쁨 = 0
const 잰다 = (좋나, 이름, 덧 = '') => { if (!좋나) 나쁨++; console.log(`  ${좋나 ? '✅' : '⛔'} ${이름}${덧 ? ' — ' + 덧 : ''}`) }

// ── 가짜 부품들 ────────────────────────────────────────────────────
function 가짜서랍 (초기 = {}) {
  const m = new Map(Object.entries(초기))
  return {
    get length () { return m.size },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)) },
    removeItem: (k) => { m.delete(k) },
    _m: m,
  }
}
function 가짜파일시스템 () {
  const 파일 = new Map()
  let 쓴횟수 = 0
  return {
    파일, get 쓴횟수 () { return 쓴횟수 },
    async writeFile ({ path, data }) { 쓴횟수++; 파일.set(path, data) },
    async readFile ({ path }) { if (!파일.has(path)) throw new Error('없음'); return { data: 파일.get(path) } },
    async rmdir ({ path }) { for (const k of [...파일.keys()]) if (k.startsWith(path + '/')) 파일.delete(k) },
  }
}
function 가짜창고 (초기 = {}) {
  const m = new Map(Object.entries(초기))
  return {
    _m: m,
    열쇠들: async () => [...m.keys()],
    여럿꺼내기: async (ks) => Object.fromEntries(ks.filter((k) => m.has(k)).map((k) => [k, m.get(k)])),
    여럿넣기: async (묶음) => { for (const [k, v] of 묶음) m.set(k, v); return true },
  }
}
/** 타이머를 «손으로» 돌리는 시계 — 10초를 진짜로 기다리지 않는다 */
function 가짜시계 () {
  let n = 0; const 대기 = new Map()
  return {
    setTimeout: (f) => { const id = ++n; 대기.set(id, f); return id },
    clearTimeout: (id) => { 대기.delete(id) },
    흘리기: async () => { const fs = [...대기.values()]; 대기.clear(); for (const f of fs) await f() },
    get 몇개 () { return 대기.size },
  }
}
function 환경만들기 ({ 앱안 = true, 서랍 = {}, 창고 = {}, FS = 가짜파일시스템() } = {}) {
  const 시계 = 가짜시계()
  const ls = 가짜서랍(서랍)
  const 창 = 가짜창고(창고)
  let 새로고침수 = 0
  const e = {
    Capacitor: { isNativePlatform: () => 앱안, Plugins: { Filesystem: FS } },
    localStorage: ls, document: null,
    setTimeout: 시계.setTimeout, clearTimeout: 시계.clearTimeout,
    창고: 창, 새로고침: () => { 새로고침수++ },
  }
  M._환경끼우기(e)
  return { e, ls, 창: 창, FS, 시계, get 새로고침수 () { return 새로고침수 } }
}

console.log('\n🪞🍎 저장 거울\n')

// ① 디바운스 ＋ 지문
{
  const 판 = 환경만들기({ 서랍: { 'hankki:v1': '{"recipes":[1]}', 'hankki:tab': 'home', 'other:x': 'no' }, 창고: { 'recipes/a/image': 'data:image/webp;base64,AAA' } })
  잰다(M.거울예약() === true && M.거울예약() === true && M.거울예약() === true && 판.시계.몇개 === 1, '① 저장 세 번 → 예약은 «하나»만 남는다(디바운스)', `대기 ${판.시계.몇개}`)
  await 판.시계.흘리기()
  const 본체 = JSON.parse(판.FS.파일.get(M.본체파일) || 'null')
  잰다(본체 && 본체.판 === 1 && 본체.서랍['hankki:v1'] === '{"recipes":[1]}' && 본체.서랍['hankki:tab'] === 'home' && !('other:x' in 본체.서랍), '  ①-b 본체.json 에 hankki:* 만 «있는 그대로» 들어간다', Object.keys(본체?.서랍 || {}).join(','))
  잰다(판.FS.파일.has(M.사진폴더 + '/' + encodeURIComponent('recipes/a/image') + '.txt'), '  ①-c 사진이 파일 하나로 뜬다')
  const 전 = 판.FS.쓴횟수
  const r = await M.거울뜨기()
  잰다(r.본체쓴나 === false && r.사진쓴수 === 0 && 판.FS.쓴횟수 === 전, '  ①-d 아무것도 안 바뀌면 다시 «안» 쓴다(지문)', `쓰기 ${판.FS.쓴횟수 - 전}회`)
  판.ls.setItem('hankki:v1', '{"recipes":[1,2]}')
  const r2 = await M.거울뜨기()
  잰다(r2.본체쓴나 === true, '  ①-e 본체가 바뀌면 다시 쓴다')

  // ⑤ 사진은 바뀐 것만
  판.창._m.set('recipes/b/image', 'data:image/webp;base64,BBB')
  const 전2 = 판.FS.쓴횟수
  const r3 = await M.거울뜨기()
  잰다(r3.사진쓴수 === 1 && 판.FS.쓴횟수 - 전2 === 2, '⑤ 사진 한 장 늘면 «그 한 장» ＋ 목록만 쓴다(통째로 다시 안 쓴다)', `사진 ${r3.사진쓴수}장 · 쓰기 ${판.FS.쓴횟수 - 전2}회`)
  const 목록 = JSON.parse(판.FS.파일.get(M.사진목록파일))
  잰다(목록.length === 2 && 목록.includes('recipes/b/image'), '  ⑤-b 사진목록.json 에 성공한 열쇠만 쌓인다', 목록.join(','))

  // ② 되살리기 — 같은 파일시스템에 «빈 폰»
  const 새폰 = 환경만들기({ 서랍: {}, 창고: {}, FS: 판.FS })
  const 결과 = await 새폰.e.창고.열쇠들().then(() => M.거울되살리기())
  잰다(결과 === 'restored' && 새폰.새로고침수 === 1, '② 본체 «키 없음» ＋ 거울 있음 → 되살아나고 새로고침 한 번', `${결과} · 새로고침 ${새폰.새로고침수}`)
  잰다(새폰.ls.getItem('hankki:v1') === '{"recipes":[1,2]}' && 새폰.ls.getItem('hankki:tab') === 'home' && 새폰.ls.getItem('other:x') === null, '  ②-b 서랍 hankki:* 가 글자 그대로 돌아온다(다른 키는 안 건드림)')
  잰다(새폰.창._m.get('recipes/a/image') === 'data:image/webp;base64,AAA' && 새폰.창._m.get('recipes/b/image') === 'data:image/webp;base64,BBB', '  ②-c 사진 두 장이 창고로 돌아온다')
  const 다시 = await M.거울되살리기()
  잰다(다시 === 'skip' && 새폰.새로고침수 === 1, '  ②-d 되살린 뒤 다시 켜면 «키 있음»이라 skip(무한 새로고침 없음)', 다시)
}

// ③ 깨진 거울
{
  const FS = 가짜파일시스템(); FS.파일.set(M.본체파일, '{"판":1,"서랍":{')
  const 판 = 환경만들기({ 서랍: {}, FS })
  const r = await M.거울되살리기()
  잰다(r === 'broken' && 판.ls.length === 0 && 판.새로고침수 === 0, '③ 깨진 JSON → 안 건드린다(서랍 0칸 · 새로고침 0)', r)
  FS.파일.set(M.본체파일, JSON.stringify({ 판: 1, 서랍: { 'hankki:tab': 'home' } }))   // 본체 열쇠가 빠진 거울
  const r2 = await M.거울되살리기()
  잰다(r2 === 'broken' && 판.ls.length === 0, '  ③-b 본체 열쇠(hankki:v1) 없는 거울도 «깨진 것»으로 본다', r2)
}

// ⑥ 키가 있으면(빈 값이어도) 안 덮는다
{
  const FS = 가짜파일시스템(); FS.파일.set(M.본체파일, JSON.stringify({ 판: 1, 서랍: { 'hankki:v1': '{"recipes":[9]}' } }))
  const 판 = 환경만들기({ 서랍: { 'hankki:v1': '' }, FS })
  const r = await M.거울되살리기()
  잰다(r === 'skip' && 판.ls.getItem('hankki:v1') === '' && 판.새로고침수 === 0, '⑥ 본체 키가 «있으면» 빈 값이어도 거울이 안 덮는다(잣대 = 키 없음뿐)', r)
}

// ④ 앱 밖
{
  const 판 = 환경만들기({ 앱안: false, 서랍: { 'hankki:v1': '{"recipes":[1]}' } })
  판.FS.파일.set(M.본체파일, JSON.stringify({ 판: 1, 서랍: { 'hankki:v1': '{"recipes":[7]}' } }))
  const 예약 = M.거울예약()
  const 뜸 = await M.거울뜨기()
  판.ls.removeItem('hankki:v1')
  const 살림 = await M.거울되살리기()
  잰다(예약 === false && 뜸.본체쓴나 === false && 판.FS.쓴횟수 === 0 && 살림 === 'skip' && 판.새로고침수 === 0, '④ 앱 밖(웹·안드로이드)에선 아무것도 안 한다', `예약 ${예약} · 쓰기 ${판.FS.쓴횟수} · 되살리기 ${살림}`)
}

M._환경끼우기(null)
console.log(나쁨 ? `\n⛔ ${나쁨}칸 실패\n` : '\n✅ 거울은 앱 안에서만 · 바뀐 것만 · 키 없을 때만 되살린다\n')
process.exit(나쁨 ? 1 : 0)
