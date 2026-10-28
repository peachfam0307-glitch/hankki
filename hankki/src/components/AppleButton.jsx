// 🍎 「Apple로 로그인」 단추 — **아이폰 앱 안에서만** 보인다(부르는 쪽이 `앱안인가()` 로 가른다). (2026-09-08 · 큰 틀 4)
//
// 왜 = 애플 심사 4.8 — 제3자 로그인(구글)을 쓰면 「이름·이메일만 받고 이메일을 숨길 수 있는 로그인」을 «같이» 둬야 한다.
//    ⭐ 순서는 «구글 먼저, 애플 둘째»(열쇠 갈래 ⓑ) — 안드로이드에서 구글로 쓰던 사람이 아이폰에서 애플로 들어오면 칸이 둘로 갈린다.
//
// 애플 HIG(sign-in-with-apple · 2026-09-08 원문 열람) 가 정한 것
//   · 색 = 검정 또는 흰색만(«custom colors» 금지) · 로고와 글자는 «같은 색» · 글자만 빼고 모양(모서리·글꼴)은 바꿔도 된다
//   · 제목 = 「Sign in with Apple / Sign up with Apple / Continue with Apple」 중 하나를 그 언어로 → 우리 = 「Apple로 로그인」
//   · 크기 = 다른 로그인 단추보다 «작지 않게» → GoogleButton 과 같은 높이·폭
//   · ⛔⛔ **로고는 «Apple Design Resources 에서 내려받은 원본»만** — *"never create a custom Apple logo"*
//        그래서 여기에 로고를 «그리지 않는다». `public/apple-logo-white.svg` 가 있으면 보여 주고 없으면 글자만 둔다.
//        ✅ 2026-09-08 창업자가 `Logo-Sign-in-with-Apple.dmg` 를 받아 줬고, 그 안의 「Left White Logo Small」 SVG 를 «한 글자도 안 고치고» 넣었다.
//   · App Review 가 «모든 custom 단추»를 본다 → 로고 없이 제출하지 않는다(게이트 = 재현판 ⑥이 파일 유무를 «알린다»).
//
// ⛔ 「Apple」은 남의 상표라 영어 그대로 — 우리 「화면에 영어 0개」 원칙의 두 번째 예외(첫째 = Google 단추).

import { useState } from 'react'

export const 애플로고경로 = 'apple-logo-white.svg'

export default function AppleButton ({ label = 'Apple로 로그인', busy = false, disabled = false, onClick }) {
  const [로고있나, set로고있나] = useState(true)
  const base = (import.meta.env && import.meta.env.BASE_URL) || './'
  return (
    <button
      className="press" disabled={disabled} onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        // HIG 「Black」 스타일 — 밝은 바탕용 · 로고·글자 = 흰색
        background: '#000', border: '1px solid #000', borderRadius: 14,
        color: '#fff', fontSize: 15, fontWeight: 700, padding: '15px 16px',
        marginTop: 10,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {/* 원본 = Apple Design Resources 「Left White Logo Small」(24×44 · 여백 포함 · 검정 바탕에 흰 로고) — 비율 그대로 높이만 맞춘다(⛔늘리거나 자르지 않는다) */}
      {로고있나 && (
        <img
          src={base + 애플로고경로} alt="" aria-hidden="true" width={12} height={22}
          style={{ display: 'block', flex: '0 0 auto' }}
          onError={() => set로고있나(false)}
        />
      )}
      <span>{busy ? '여는 중…' : label}</span>
    </button>
  )
}
