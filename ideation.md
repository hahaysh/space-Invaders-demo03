# 우주 방어

## 대상과 선택

PC 브라우저에서 키보드로 짧은 한 판을 즐기는 초보자를 위한 게임이다.
후보는 내려오는 편대를 막는 **우주 방어**와 항로를 지키는 **궤도 순찰**이다.
전자는 목표와 실패 이유가 즉시 보이고 공통 실습 기준과 맞는다. 후자는 항로·순찰 규칙을 추가하기 쉬워 범위가 커진다.
사용자 위임 검토로 추천안인 우주 방어를 선택했다.

## 한 판 경험

제목·조작 안내 → 시작 → 좌우 이동과 위쪽 연사로 적 편대 제거 → 모두 제거하면 승리,
적이 방어선에 도달하면 패배 → 초기 상태로 재시작한다.
움직이는 목표를 맞히는 즉각적인 점수 피드백과 내려오는 편대의 압박이 핵심 재미다.

첫 배포는 시작·이동·발사·적 이동·충돌·점수·승패·재시작이다.
일시정지, 난이도, 목숨과 재도전은 각각 후속 개선에서 설계·구현하며 가짜 UI를 미리 넣지 않는다.
런타임 외부 자산/CDN, 적 탄환·피격, 로그인, 사운드, 모바일 조작·터치·모바일 검증,
최고 점수와 웨이브는 제외한다. PC 창 크기 변경의 잘림·겹침은 확인한다.

## 화면 방향

짙은 남색 둥근 패널 안에 조금 밝은 동일 크기 카드, 은은한 테두리, 일정한 여백·간격을 사용한다.
작고 차분한 라벨 아래 큰 굵은 밝은 값을 HTML/CSS 실제 텍스트로 표시하고 숫자는 고정폭으로 정렬한다.
04는 점수만, 08은 점수/이번 게임 난이도, 09는 점수/목숨/이번 게임 난이도 순이다.
상태 안내와 버튼, 이후의 '다음 게임 난이도' 선택 행은 카드 밖에 둔다.
난이도 카드는 current, 선택기는 pending을 뜻하며 title의 current는 보통이다.
제품의 수치·수용 기준은 다음 단계의 PRD가 단일 기준이다.

## 고정 에셋 사양과 출처

제작자 [Kenney](https://kenney.nl/), 팩 **Space Shooter (Redux)**, **CC0 1.0**.
아래는 공식 배포처가 아닌 제3자 미러이며 팩 전용 공식 주소를 추정하지 않는다.
원본 커밋은 `b5ea6c01d219da1d2fc73c088dc86e3ab9e961c2`로 고정한다.

| 단계 | 원본 URL | 저장 경로 | 크기 / 바이트 | SHA-256 |
|---|---|---|---|---|
| M1 | https://raw.githubusercontent.com/mhmd-azeez/extism-space-commander/b5ea6c01d219da1d2fc73c088dc86e3ab9e961c2/assets/PNG/playerShip1_blue.png | `src/assets/ships/playerShip1_blue.png` | 99×75 / 2698 | `648ec1635979fb867d08bfd0c56f011d6559dd953a13c73109c6186a3069f7ee` |
| M2 | https://raw.githubusercontent.com/mhmd-azeez/extism-space-commander/b5ea6c01d219da1d2fc73c088dc86e3ab9e961c2/assets/PNG/Enemies/enemyRed1.png | `src/assets/ships/enemyRed1.png` | 93×84 / 3096 | `83bbe7b408f080c128de595ddeb5996aaa5432dc28d800eb5d0e07990b525e74` |
| M1 | https://raw.githubusercontent.com/mhmd-azeez/extism-space-commander/b5ea6c01d219da1d2fc73c088dc86e3ab9e961c2/assets/license.txt | `src/assets/ships/LICENSE-Kenney.txt` | 498 | `c8cf4591af39c24e65560fbfcc271de9d97b135e0316f963485b9e770455b6db` |

해당 구현 단계에 세 파일만 내려받고 해시를 대조한다. 실패·불일치는 중단·보고하며 임의 대체하지 않는다.
PNG는 수정하지 않는다. 너비 40, 높이 `40 × 원본 높이 / 원본 너비`로 원본 비율을 유지한다.
플레이어 그림은 모델의 왼쪽·위, 적 그림은 모델의 왼쪽·아래에 맞춘다.
그림과 투명 영역은 모델 사각형과 다르며 이동·충돌·탄환 출발·방어선을 바꾸지 않는다.
로컬 정적 import와 Vite URL, Canvas drawImage를 사용하고 로드 완료 전 시작을 막는다.
실패는 명시적 오류와 시작 불가로 드러낸다. 단순 도형 fallback은 사용하지 않는다.
빌드 data URL 인라인도 허용하되 실제 디코딩·표시와 외부 요청 부재를 검증한다.
지금은 출처와 사양만 기록하며 다운로드·코드는 만들지 않는다.

## 안내 출처

실습 원문: `hahaysh/space-Invaders@bfc109c5e5656db5ab2ad02804cf318702616b55`의 docs/02-01.
화면·에셋 원문: [고정 사양](https://github.com/hahaysh/space-Invaders/blob/d9857438015d8af60cce22e4c98fd075d84e7d24/docs/화면과-에셋-기준.md).
원문은 읽기만 했으며 안내서나 샘플 코드를 이 저장소에 복사하지 않았다.
