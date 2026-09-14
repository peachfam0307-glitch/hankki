#!/usr/bin/env node
// 🎴📦 표지 굽기 재현판 — 2026-09-07 (큰 틀 2)
//
// 재는 것 셋
//   ① 크롬처럼 WebP 를 구울 수 있으면 → WebP 를 낸다 (머리글자 data:image/webp)
//   ② 사파리처럼 `image/webp` 를 달라 해도 «조용히 PNG» 를 주면 → ⛔PNG 를 내지 않고 JPEG q0.86 으로 간다
//      (PNG 는 JPEG 보다 훨씬 커서, 여기서 놓치면 아이폰 표지가 «더 커진다»)
//   ③ toDataURL 이 던져도 → JPEG 으로 간다 (표지 저장이 끊기지 않는다)
//   ④ JPEG 품질은 «지금 저장하는 값» 0.86 그대로 (ShareDrawCard 가 쓰던 값 — 바뀌면 이 칸이 잡는다)
import { 표지굽기, 표지JPEG품질, 표지WEBP품질 } from '../src/coverEncode.js'

let 나쁨 = 0
const 잰다 = (좋나, 이름, 덧 = '') => { if (!좋나) 나쁨++; console.log(`  ${좋나 ? '✅' : '⛔'} ${이름}${덧 ? ' — ' + 덧 : ''}`) }

const 부른것 = []
const 캔버스 = (모양) => ({ toDataURL (type, q) { 부른것.push([type, q]); return 모양(type, q) } })

console.log('\n🎴📦 표지 굽기\n')

// ① 크롬
부른것.length = 0
const 크롬 = 표지굽기(캔버스((t) => t === 'image/webp' ? 'data:image/webp;base64,AAAA' : 'data:image/jpeg;base64,BBBB'))
잰다(크롬.종류 === 'webp' && 크롬.url.startsWith('data:image/webp'), '① 구울 수 있으면 WebP', 크롬.종류)
잰다(부른것[0]?.[1] === 표지WEBP품질 && 표지WEBP품질 === 0.8, '  ①-b WebP 품질 = 0.8 (실측으로 고른 값)', String(부른것[0]?.[1]))

// ② 사파리 — 조용히 PNG
부른것.length = 0
const 사파리 = 표지굽기(캔버스((t) => t === 'image/webp' ? 'data:image/png;base64,PPPP' : 'data:image/jpeg;base64,BBBB'))
잰다(사파리.종류 === 'jpeg' && 사파리.url.startsWith('data:image/jpeg'), '② ⭐ 못 구우면(PNG 로 떨어지면) JPEG 으로 — PNG 를 «안» 낸다', 사파리.종류)

// ③ 던지는 캔버스
const 던짐 = 표지굽기(캔버스((t) => { if (t === 'image/webp') throw new Error('no webp'); return 'data:image/jpeg;base64,BBBB' }))
잰다(던짐.종류 === 'jpeg', '③ toDataURL 이 던져도 JPEG 으로 (표지 저장이 안 끊긴다)', 던짐.종류)

// ④ JPEG 품질 그대로
잰다(부른것.some(([t, q]) => t === 'image/jpeg' && q === 0.86) && 표지JPEG품질 === 0.86, '④ JPEG 품질 = 0.86 (지금 저장하던 값 그대로)', String(표지JPEG품질))

console.log(나쁨 ? `\n⛔ ${나쁨}칸 실패\n` : '\n✅ 표지가 되면 WebP, 안 되면 JPEG — PNG 로는 절대 안 간다\n')
process.exit(나쁨 ? 1 : 0)
