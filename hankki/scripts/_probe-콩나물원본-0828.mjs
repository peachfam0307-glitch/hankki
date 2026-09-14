// 🔬 [2026-08-28] 창업자가 보낸 «콩나물무침 댓글 화면» 원본 그대로
// ⚠️ 진짜 OCR 출력이 아니라 «화면을 보고 내가 옮겨 적은 것»이다(kor.traineddata 를 못 받는다)
import { parseRecipeText } from '../src/parseRecipe.js'
const r = parseRecipeText(`댓글

jangnamcook 21시간 • 작성자
콩나물의 시원함을 최대한 살린 콩나물무침
7

깨끗히 씻은 콩나물 300g을
냄비에 넣고
물은 딱 1/3컵만 넣어주세요.
적게 넣어야 이 물을 버리지 않고 다 사용할
수 있어요.

중불로 불을 올린 뒤 끓어 김이
올라오는순간부터
3분동안 찌듯이 삶아주시고
익은 콩나물은 꺼내 김을 날려주세요.
김을 날려야 콩나물에 양념이 쏙 배어들어요.

양념은 콩나물삶은물에
맛소금 1/5스푼 (짠맛은 취향에 따라
가감해주세요!)
들기름 1스푼 넣고 마구 섞어주시면
유장이 만들어지는데

콩나물을 여기에 넣고
으깬 통깨, 그리고 마늘은 빼고 얇게썬
대파를 넣어주시면
구수하면서 시원한 콩나물무침 완성입니다!

도움이 되셨다면 좋아요 한번씩
눌러주시구요ㅎㅎ
행복한 하루 보내세요!

답글 달기

just.knitting_ 6시간
맛소금은 어떤건가요?
1
답글 달기

회원님의 생각을 남겨보...`, { fromOcr: true })
console.log('제목 =', JSON.stringify(r.title))
console.log('재료 ='); r.ingredients.forEach((x, i) => console.log('  ', i + 1, x))
console.log('걸음 ='); r.steps.forEach((x, i) => console.log('  ', i + 1, x))
