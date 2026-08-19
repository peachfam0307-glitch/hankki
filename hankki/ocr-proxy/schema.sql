-- ═══════════════════════════════════════════════════════════════
-- 💳 한끼 결제 원장 — Cloudflare D1  (2026-08-19)
--
-- 만드는 법 (창업자 · Cloudflare 대시보드):
--   ① Storage & Databases → D1 → Create → 이름 `hankki-billing`   (⭐무료 · 카드 필요 없음)
--   ② 그 DB 의 Console 탭에 이 파일 내용을 붙여넣고 실행
--   ③ Workers & Pages → `hankki-ocr` → Settings → Bindings →
--      D1 database 추가 · Variable name **`HANKKI_DB`** → `hankki-billing`
--   ⛔ 바인딩 이름이 한 글자만 달라도 결제가 통째로 꺼진다(`billing_off`).
--
-- 🔒 안전 = **D1 은 Time Travel 이 늘 켜져 있다**(무료 플랜 7일 되감기). 따로 켤 게 없다.
-- ⛔ 여기에 개인정보는 안 들어간다 — `uid` 는 기기가 만든 «임의 난수»다(Play 데이터 보안 신고 그대로).
-- ═══════════════════════════════════════════════════════════════

-- ① 구매 기록 — ⭐**토큰이 기본키라 두 번 적히지 않는다** = 「몇 번을 보내도 같다」의 뿌리.
CREATE TABLE IF NOT EXISTS purchases (
  token      TEXT PRIMARY KEY,        -- 구글이 준 구매 토큰
  sku        TEXT NOT NULL,           -- 상품 ID (deco_chuseok · ocr_pack_20 …)
  uid        TEXT,                    -- 그때 그 기기
  order_id   TEXT,                    -- 구글 주문번호(문의 대조용)
  state      INTEGER,                 -- 0=구매됨 1=취소됨 2=보류
  acked      INTEGER NOT NULL DEFAULT 0,   -- ⭐0이면 3일 뒤 «환불·회수»된다
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS purchases_unacked ON purchases (acked, created_at);

-- ② 소모성 잔량 — ⭐**uid 가 아니라 «토큰»에 매단다.**
--   그래야 폰을 바꿔 uid 가 바뀌어도 `uid` 칸만 갈아 끼워 «남은 장수»가 따라온다.
CREATE TABLE IF NOT EXISTS credits (
  token         TEXT PRIMARY KEY,
  sku           TEXT NOT NULL,
  uid           TEXT NOT NULL,             -- 지금 이 팩을 쓰는 기기
  remaining     INTEGER NOT NULL,          -- 남은 장수
  needs_consume INTEGER NOT NULL DEFAULT 0,-- (예비) 「다 쓴 뒤에 비우기」 모드에서만 쓴다
  consumed      INTEGER NOT NULL DEFAULT 0,-- ⛔⛔ **구글 쪽에서 비웠다는 표시일 뿐 «잔량과 무관»하다.**
                                           --   섞어 보면 «사자마자 잔량이 0» 이 된다(2026-08-19 실제 버그).
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS credits_uid ON credits (uid, remaining);

-- ③ 영구 팩 — ⛔consume 하지 않는다. 사실 구글이 기억해 주므로 이 표는 «장부»에 가깝다
--   (앱이 켜질 때마다 `listPurchases()` 로 다시 들고 와 sync 하면 저절로 되살아난다).
CREATE TABLE IF NOT EXISTS entitlements (
  uid        TEXT NOT NULL,
  sku        TEXT NOT NULL,
  token      TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (uid, sku)
);
