// 🔎 로그인 실패 «오류 글» — gate_fail 주소 꼬리(?m=)에 실리나 · 개인정보가 지워지나 (창업자 2026-10-13 「그거 넣어줘」)
import { readFileSync } from 'node:fs'
import { 실패글, 수집주소만들기 } from '../src/stats.js'
let 죽음 = 0
const 재다 = (n, ok) => { console.log(`${ok ? '✅' : '⛔'} ${n}`); if (!ok) 죽음++ }
const 가짜 = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) } }

재다('애플 오류 글이 그대로 실린다', 실패글({ message: 'The operation couldn’t be completed. (com.apple.AuthenticationServices.AuthorizationError error 1004.)' }).includes('error 1004'))
재다('코드가 앞에 붙는다', 실패글({ code: 'auth/internal-error', message: 'x' }).startsWith('auth/internal-error'))
재다('메일은 지운다', !실패글({ message: 'user kim@naver.com failed' }).includes('naver'))
재다('긴 숫자는 지운다', !실패글({ message: 'id 1234567890 bad' }).includes('1234567890'))
재다('토큰은 지운다', !실패글({ message: 'tok eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMyJ9 x' }).includes('eyJhbGci'))
재다('80자로 자른다', 실패글({ message: 'a '.repeat(200) }).length <= 80)
재다('빈 오류도 죽지 않는다', 실패글(null) === 'empty' && 실패글(undefined) === 'empty')
const u = 수집주소만들기({ 이름: 'gate_fail', 저장소: 가짜(), 꼬리: 'error 1004' })
재다('아이폰 직접 주소 dl 에 ?m= 이 실린다', decodeURIComponent(new URL(u).searchParams.get('dl')).includes('?m=error%201004#gate_fail') || new URL(u).searchParams.get('dl').includes('?m=error%201004#gate_fail'))
const u2 = 수집주소만들기({ 이름: 'home', 저장소: 가짜() })
재다('꼬리 없으면 주소 그대로', !new URL(u2).searchParams.get('dl').includes('?m='))
const s = readFileSync(new URL('../src/stats.js', import.meta.url), 'utf8')
재다('gate_fail 이름은 그대로(꼬리만 붙는다)', /행동보내기\('gate_fail', 실패글\(e\)\)/.test(s))
console.log(죽음 ? `\n⛔ ${죽음}칸 죽었다` : '\n✅ 로그인 오류 글 — 전부 통과')
process.exit(죽음 ? 1 : 0)
