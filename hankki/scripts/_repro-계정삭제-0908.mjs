#!/usr/bin/env node
// 🗑🍎 계정 삭제 재현판 — 2026-09-08 (큰 틀 6-① · 창업자 확정 ⓑ)
//
// 가짜 F(파이어스토어)·A(인증)·부품으로 `cloud.js 계정삭제()` 를 노드에서 돌린다.
// 재는 것
//   ① 순서 = 재인증 → 서버 기록 삭제 → deleteUser → 폰 표식 지움 (그 순서 그대로)
//   ② 재인증이 «다른 계정»이면 아무것도 안 지운다
//   ③ 재인증 취소(팝업 닫힘) = 아무것도 안 지운다
//   ④ 기록은 지웠는데 deleteUser 가 죽으면 → 「기록은 지웠고 계정만 남았어요」로 던진다(조용히 됐다고 안 한다) · 표식은 남는다(로그인 유지)
//   ⑤ 앱 안(Capacitor)이면 재인증이 부품 길(팝업 아님) · 부품 deleteUser 도 부른다
//   ⑥ 시트(글자) = 로그인 안 한 사람에겐 단추 없음 · 「삭제」 입력 · 비우기 뒤 받았다지우기 · 설정 줄이 시트를 연다 · 웹 안내 문구가 새 자리를 가리킨다
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 읽기 = (p) => fs.readFileSync(path.join(여기, '..', p), 'utf8')
let 나쁨 = 0
const 잰다 = (좋나, 이름, 덧 = '') => { if (!좋나) 나쁨++; console.log(`  ${좋나 ? '✅' : '⛔'} ${이름}${덧 ? ' — ' + 덧 : ''}`) }

// 가짜 localStorage (cloud.js 표식·번호·지문·받았다 칸)
const 서랍 = new Map()
globalThis.localStorage = {
  getItem: (k) => (서랍.has(k) ? 서랍.get(k) : null),
  setItem: (k, v) => { 서랍.set(k, String(v)) },
  removeItem: (k) => { 서랍.delete(k) },
  key: (i) => [...서랍.keys()][i] ?? null,
  get length () { return 서랍.size },
}
globalThis.window = globalThis.window || {}

const C = await import('../src/cloud.js')
const 번호 = '110688000000000006208'
const 구글사람 = (n = 번호) => ({ uid: 'FUID', displayName: '한끼러버', providerData: [{ providerId: 'google.com', uid: n }] })
const 표식채우기 = () => { 서랍.set('hankki:cloud:on', '1'); 서랍.set('hankki:cloud:sub', 번호); 서랍.set('hankki:cloud:pulled', '1') }

/** 가짜 판 — 문서 4개(meta 1 · 레시피 2 · 일기 1) · 순서 기록 · A 는 «기본 팝업 길», 덧A 로 바꿔 끼운다 */
function 판만들기 ({ 재인증사람 = 구글사람(), 재인증죽음 = null, delete죽음 = null, 덧A = null } = {}) {
  const 순서 = []
  const 문서 = new Map([[`users/${번호}`, {}], [`users/${번호}/recipes/r1`, {}], [`users/${번호}/recipes/r2`, {}], [`users/${번호}/diary/d1`, {}]])
  const F = {
    collection: (db, ...p) => ({ 길: p.join('/') }),
    doc: (db, ...p) => ({ 길: p.join('/') }),
    getDocs: async (c) => { const 것 = [...문서.keys()].filter((k) => k.startsWith(c.길 + '/')).map((k) => ({ ref: { 길: k } })); return { forEach: (f) => 것.forEach(f) } },
    writeBatch: () => { const 할일 = []; return { delete: (r) => 할일.push(r), set: () => {}, commit: async () => { 순서.push('기록삭제'); for (const r of 할일) 문서.delete(r.길) } } },
  }
  const auth = { currentUser: 구글사람() }
  const A = {
    GoogleAuthProvider: Object.assign(function () {}, { credential: (t) => ({ t }) }),
    signInWithPopup: async () => { 순서.push('재인증'); if (재인증죽음) throw 재인증죽음; auth.currentUser = 재인증사람; return { user: 재인증사람 } },
    deleteUser: async () => { 순서.push('계정삭제'); if (delete죽음) throw delete죽음; auth.currentUser = null },
    ...(덧A ? 덧A({ 순서, auth }) : {}),
  }
  C._가짜창고물리기({ F, db: {}, auth, A })
  return { 순서, 문서, auth }
}

console.log('\n🗑🍎 계정 삭제\n')

// ① 정상 순서
{
  표식채우기()
  const 판 = 판만들기()
  const r = await C.계정삭제()
  잰다(판.순서.join('→') === '재인증→기록삭제→계정삭제', '① 순서 = 재인증 → 기록 삭제 → 계정 삭제', 판.순서.join('→'))
  잰다(r.지운것 === 4 && 판.문서.size === 0, '  ①-b 레시피 2·일기 1·meta 1 = 4건 전부 지워졌다', `${r.지운것}건 · 남은 ${판.문서.size}`)
  잰다(서랍.get('hankki:cloud:on') == null && 서랍.get('hankki:cloud:sub') == null && 서랍.get('hankki:cloud:pulled') == null, '  ①-c 폰 표식(로그인·번호·받았다)이 지워졌다')
}
// ② 다른 계정
{
  표식채우기()
  const 판 = 판만들기({ 재인증사람: 구글사람('999999999') })
  let 던짐 = ''; try { await C.계정삭제() } catch (e) { 던짐 = e.message }
  잰다(/다른 계정/.test(던짐) && 판.문서.size === 4 && !판.순서.includes('기록삭제'), '② 다른 계정으로 재인증되면 아무것도 안 지운다', 던짐)
}
// ③ 재인증 취소
{
  표식채우기()
  const 판 = 판만들기({ 재인증죽음: Object.assign(new Error('popup closed'), { code: 'auth/popup-closed-by-user' }) })
  let 던짐 = ''; try { await C.계정삭제() } catch (e) { 던짐 = e.message }
  잰다(던짐 === 'popup closed' && 판.문서.size === 4 && 서랍.get('hankki:cloud:on') === '1', '③ 재인증을 닫으면 아무것도 안 지우고 로그인도 그대로')
}
// ④ deleteUser 실패
{
  표식채우기()
  const 판 = 판만들기({ delete죽음: Object.assign(new Error('recent'), { code: 'auth/requires-recent-login' }) })
  let err = null; try { await C.계정삭제() } catch (e) { err = e }
  잰다(!!err && /기록은 지웠고 계정 삭제만 남았어요/.test(err.message) && err.단계 === '계정' && 판.문서.size === 0, '④ 기록은 지웠는데 계정이 안 지워지면 «정직하게» 던진다', err?.message)
  잰다(서랍.get('hankki:cloud:on') === '1', '  ④-b 그때 로그인 표식은 남긴다(다시 누르면 재인증 → 바로 삭제)')
}
// ⑤ 앱 안 = 부품 길
{
  표식채우기()
  const 부품기록 = { google: 0, del: 0, signOut: 0 }
  globalThis.window.Capacitor = { isNativePlatform: () => true, Plugins: { FirebaseAuthentication: {
    signInWithGoogle: async () => { 부품기록.google++; return { credential: { idToken: 'T' } } },
    deleteUser: async () => { 부품기록.del++ }, signOut: async () => { 부품기록.signOut++ },
  } } }
  const 판 = 판만들기({ 덧A: ({ 순서, auth }) => ({
    signInWithPopup: async () => { throw new Error('앱 안에서 팝업이 불렸다') },
    signInWithCredential: async () => { 순서.push('웹층로그인'); auth.currentUser = 구글사람(); return { user: 구글사람() } },
  }) })
  let 던짐 = ''; try { await C.계정삭제() } catch (e) { 던짐 = e.message }
  잰다(던짐 === '' && 판.순서.join('→') === '웹층로그인→기록삭제→계정삭제' && 부품기록.google === 1 && 부품기록.del === 1, '⑤ 앱 안 = 부품으로 재인증(팝업 아님) → 웹 층 → 기록 → 계정(부품 쪽도)', `${판.순서.join('→')} · 부품 google ${부품기록.google} del ${부품기록.del}${던짐 ? ' · ' + 던짐 : ''}`)
  delete globalThis.window.Capacitor
}
// ⑥ 시트·설정·문서(글자)
{
  const s = 읽기('src/components/DeleteAccountSheet.jsx')
  const 비로그인블록 = (s.split('사람 === null && (')[1] || '').split('사람 && 단계')[0]
  잰다(비로그인블록.length > 0 && !/<button/.test(비로그인블록), '⑥ 로그인 안 한 사람에겐 단추가 없다(사실 한 줄만)')
  잰다(/const 확인글자 = '삭제'/.test(s) && /입력\.trim\(\) !== 확인글자/.test(s), '  ⑥-b 계정 삭제는 「삭제」 입력이라야 눌린다')
  잰다(/await 클라우드비우기\(\)[\s\S]{0,400}받았다지우기\(\)/.test(s), '  ⑥-c 비우기 뒤 「받았다」 표식을 지운다(안 지우면 다음 켤 때 저절로 다시 올라간다)')
  잰다(/if \(!바쁨\) onClose\(\)/.test(s), '  ⑥-d 진행 중엔 닫히지 않는다')
  const p = 읽기('src/screens/ProfileScreen.jsx')
  잰다(/label: '계정 · 데이터 삭제', onClick: \(\) => setDelAccount\(true\)/.test(p) && /<DeleteAccountSheet/.test(p), '  ⑥-e 설정 「계정 · 데이터 삭제」 줄이 시트를 연다(웹 새 창 아님)')
  const h = 읽기('public/delete-account.html')
  잰다(/설정 → 계정 · 데이터 삭제/.test(h) && /［클라우드 비우기］/.test(h) && /［계정 삭제］/.test(h) && !/설정 → 클라우드 저장 → ［클라우드 비우기］/.test(h), '  ⑥-f 웹 안내가 «있는 단추»를 가리킨다')
}

console.log(나쁨 ? `\n⛔ ${나쁨}칸 실패\n` : '\n✅ 재인증 → 기록 → 계정 순서 · 다른 계정·취소·중간 실패 전부 안전 쪽\n')
process.exit(나쁨 ? 1 : 0)
