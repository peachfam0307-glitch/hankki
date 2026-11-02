// ⏰ 시험 시계 — 운영 1단계 「스모크 시계 한 곳」 (창업자 2026-11-02 「땜질식은 해결못해 · 큰 틀에서」)
//   뿌리 = 날짜를 쓰는 재현판 14개가 «각자» 오늘을 만들었다 → 31일·1일에 저절로 죽었다(배포 run 3039).
//   파일마다 고치면 땜빵이다(15번째가 또 생긴다). 그래서 «한 곳»에서 시계를 바꾼다:
//     node --import ./scripts/시험시계.mjs <재현판>     ＋  HANKKI_NOW=2026-01-31T23:30:00+09:00
//   ① node 쪽 Date 를 그 시각으로 옮긴다(흐르게 · 멈추지 않음)
//   ② playwright 로 여는 «모든» 브라우저 창도 같은 시각으로 옮긴다(context.clock.setSystemTime)
//   HANKKI_NOW 가 없으면 아무것도 안 한다 = 평소 스모크는 그대로.
const 값 = process.env.HANKKI_NOW
if (값) {
  const 목표 = Date.parse(값)
  if (Number.isNaN(목표)) { console.error(`⛔ HANKKI_NOW 를 못 읽었다: ${값}`); process.exit(2) }
  const 진짜 = Date, 차이 = 목표 - 진짜.now()
  class 가짜 extends 진짜 {
    constructor(...a) { a.length ? super(...a) : super(진짜.now() + 차이) }
    static now() { return 진짜.now() + 차이 }
  }
  globalThis.Date = 가짜
  // 브라우저 창 — playwright 가 «처음 불릴 때» 감싼다
  try {
    const pw = await import('playwright')   // 재현판과 «같은» 모듈 객체(ESM)를 감싸야 먹는다
    const 감싸기 = (브라우저) => {
      const 원래 = 브라우저.newContext.bind(브라우저)
      // 재현판이 스스로 시계를 만지면(install·setFixedTime…) 그쪽이 이긴다 — 안 만졌으면 첫 창을 열 때 옮긴다
      브라우저.newContext = async (...a) => {
        const c = await 원래(...a); let 만짐 = false
        // ⚠️ 가짜 Date 객체를 그대로 넘기면 playwright 가 엉뚱한 시각으로 읽는다(실측 10/17) → 숫자로 바꿔 넘긴다
        //    ＋ playwright 는 «node 쪽 지금»과의 차이로 창 시각을 잡는다(실측: 창 = 진짜지금 + (준값 − 가짜지금))
        //      → 시각(절대값)을 넘길 땐 «차이»를 더해 상쇄한다. 길이(runFor·fastForward)는 그대로.
        const 시각으로 = (v) => { const t = v instanceof 진짜 ? v.getTime() : typeof v === 'string' ? 진짜.parse(v) : v; return typeof t === 'number' ? t + 차이 : v }
        for (const k of ['install', 'setFixedTime', 'setSystemTime', 'pauseAt', 'runFor', 'fastForward']) {
          const f = c.clock[k].bind(c.clock), 길이 = k === 'runFor' || k === 'fastForward'
          c.clock[k] = (x, ...b) => {
            만짐 = true
            if (!길이) { if (k === 'install') x = x && 'time' in x ? { ...x, time: 시각으로(x.time) } : { ...(x || {}), time: 진짜.now() + 차이 + 차이 }; else x = 시각으로(x) }
            return f(x, ...b)
          }
        }
        const 창 = c.newPage.bind(c)
        // setSystemTime 은 install 없이는 안 먹는다(실측) → install 로 옮긴다(시계는 계속 흐른다)
        c.newPage = async (...b) => { if (!만짐) await c.clock.install({ time: 진짜.now() + 차이 }); return 창(...b) }
        return c
      }
      const 원래쪽 = 브라우저.newPage.bind(브라우저)
      브라우저.newPage = async (...a) => { const c = await 브라우저.newContext(...a); const p = await c.newPage(); return p }
      void 원래쪽
      return 브라우저
    }
    for (const 종 of ['chromium', 'webkit', 'firefox']) {
      const t = pw[종]; if (!t) continue
      const l = t.launch.bind(t); t.launch = async (...a) => 감싸기(await l(...a))
    }
  } catch (e) { /* playwright 없는 판은 node 시계만 */ }
}
