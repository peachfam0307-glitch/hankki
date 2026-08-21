// 🔵🔴🟡🟢 구글 로그인 단추 — 첫 화면(CloudGate)과 설정 시트(CloudSheet)가 «같은 것»을 쓴다.
//
// 📮 창업자 2026-08-21 = 다른 앱 로그인 창 캡처를 보내며 *"다른사이트로그인창"*
//    → 우리와 다른 점 셋 = ①G 로고가 단추 «안»에 있다 ②흰 바탕 ＋ 얇은 테두리 ③아래쪽에 붙어 있다
//    ⛔ 우리는 파란 채움에 «글자만» 있었다. 그건 우리 앱 단추이지 «구글 단추»로 안 보인다.
//
// ⭐⭐ 이건 미감이 아니라 «믿음» 문제다 — 처음 온 사람은 「내 구글 계정을 준다」를 망설인다.
//    그때 알아보는 건 글자가 아니라 **그 네 색 G** 다. 세상 모든 앱이 같은 모양을 쓴다.
//
// ⛔ 로고를 «그림 파일»로 넣지 않는다 — 구글 브랜드 규정이 비율·여백·색을 못 바꾸게 하는데
//    PNG 로 두면 나중에 누가 크기를 늘리다 찌그러뜨린다. SVG 는 어떻게 키워도 안 망가진다.
//    ＋ precache 도 안 먹는다(4473KiB 를 지킨다).
//
// ⛔ 글자에서 「Google」을 «한글로 바꾸지 않는다** — G 로고를 쓰면 워드마크도 같이 가야 한다(브랜드 규정).
//    📌 우리 앱의 「화면에 영어 0개」 원칙과 부딪히는 «유일한» 자리다. 여긴 남의 상표라 예외.

function G ({ size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ flex: '0 0 auto' }}>
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  )
}

export default function GoogleButton ({ label = 'Google 계정으로 시작하기', busy = false, disabled = false, onClick }) {
  return (
    <button
      className="press" disabled={disabled} onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        // ⛔ 구글 규정 = 흰 바탕(또는 검정)에 테두리. 우리 포인트색(--brown)으로 칠하지 않는다.
        background: '#fff', border: '1px solid #dadce0', borderRadius: 14,
        // ⛔ 글자색도 규정값(#3c4043) — 우리 --text 로 두면 다크 테마에서 흰 바탕에 흰 글씨가 된다
        color: '#3c4043', fontSize: 15, fontWeight: 700, padding: '15px 16px',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {!busy && <G />}
      {busy ? '기다려 주세요…' : label}
    </button>
  )
}
