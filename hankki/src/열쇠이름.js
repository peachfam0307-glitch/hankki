// 🔑 열쇠의 «이름과 단위» — 이것만 담는 작은 파일 [2026-09-09]
//   ⛔ 왜 따로 뒀나 = 안내말.js 가 이 둘을 쓰는데, ocr.js 를 통째로 부르면
//      그 아래 딸린 것들(ocrCorrect 등)까지 끌려와 «재현판이 node 로 못 읽는다».
//   ⭐ 값은 여전히 «한 곳»이다 — ocr.js 가 여기서 읽어 그대로 다시 내보낸다.
export const KEY_NAME = '레시피열쇠'
export const KEY_UNIT = '개'
// ⭐ 넓은 자리엔 KEY_NAME, 좁은 자리(칸·꼬리말)엔 KEY_SHORT — 셋이 한 식구라 같이 둔다
export const KEY_SHORT = '열쇠'
