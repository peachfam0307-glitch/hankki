// 시드 데이터 — 처음 설치했을 때 바로 쓸 수 있는 기본 제공 레시피(basics.js).
// 전부 수정·삭제 가능. 지우면 다시 생기지 않는다.
import { basicRecipes } from './basics'

export const SOURCES = {
  instagram: { label: 'Instagram', icon: 'instagram' },
  youtube: { label: 'YouTube', icon: 'youtube' },
  link: { label: '링크', icon: 'link' },
  photo: { label: '사진', icon: 'photo' },
  manual: { label: '직접 작성', icon: 'pen' },
  hankki: { label: '기본 제공', icon: 'pen' },
}

export const seedRecipes = basicRecipes.map((r, i) => ({
  ...r,
  savedAt: Date.now() - i * 60000,
}))

export const POPULAR_SEARCHES = [
  '김치볶음밥',
  '파스타',
  '닭가슴살',
  '감자',
  '계란',
  '스테이크',
  '샐러드',
  '된장찌개',
]

export const TAG_LIST = [
  '간단한 요리',
  '다이어트',
  '아이 반찬',
  '손님 요리',
  '도시락',
  '캠핑 요리',
  '국물 요리',
  '술안주',
  '반찬',
  '자취 요리',
]

export const INGREDIENT_CHIPS = [
  { name: '계란', emoji: '🥚' },
  { name: '두부', emoji: '🧈' },
  { name: '김치', emoji: '🥬' },
  { name: '양파', emoji: '🧅' },
  { name: '대파', emoji: '🌿' },
  { name: '닭고기', emoji: '🍗' },
  { name: '소고기', emoji: '🥩' },
  { name: '돼지고기', emoji: '🥓' },
]
