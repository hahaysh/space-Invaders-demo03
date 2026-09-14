---
name: game-check
description: 우주 방어 게임 검증, PRD 회귀 검사, 기체 이미지와 점수 카드 확인, 또는 배포 전후 검증을 요청할 때 사용한다. 실제 package scripts와 TEST_PLAN에 따라 검사하고 실행 결과와 미확인을 구분한다.
---

# 우주 방어 검증

1. 현재 브랜치·작업 범위와 `AGENTS.md`, `PRD.md`, `TRD.md`, `TEST_PLAN.md`,
   `TEST_RESULTS.md`, `package.json`을 읽는다. 기존 사용자 변경을 보존한다.
2. `npm test`로 제품 모델·원본 에셋을 검사한다. 의존성 설치는 manifest 변경 또는
   실제 missing-dependency 실패 뒤에만 한다. lock 버전·integrity와 TLS 검증을 유지한다.
3. 소유 dev 서버 `npm run dev`의 PID·5173 URL·응답을 확인하고 `npm run test:e2e`를 실행한다.
   미상 포트 소유자를 종료하지 않는다. 전용 브라우저만 사용한다.
4. TEST_PLAN의 PRD별 경로를 대조한다. Node 모델 경계와 실제 키/버튼·DOM 카드·Canvas 기체,
   PNG 로딩/디코딩 지연·실패를 구분한다. 제품 글로벌 모델 API·치트를 추가하지 않는다.
   알파 0 제외·다색 래스터·모델과 그림 정렬 차이, Vite query URL을 고려한다.
5. `npm run build` 후 `npm run preview`로 root와 저장소 하위 경로를 각각 검사한다.
   `GAME_URL`과 TEST_PLAN의 빌드용 검사 범위를 사용한다. 작은 PNG data URL은 정상이며
   dist의 특정 파일 수를 강제하지 않는다. 실제 decode/표시, 파일 응답/MIME/404와 외부 요청을 확인한다.
6. 공개 검사는 공개가 승인되고 URL이 존재할 때만 한다. 자연 시간 실제 키·버튼 관찰과
   제어 clock 또는 Node 모델 경계를 서로 다른 증거로 남긴다.
7. `TEST_RESULTS.md`에 실제 호출 여부·명령·환경·통과 수·실패·복구·미실행·환경 대기·미확인을 기록한다.
   읽기 전용 검사 세션이면 파일을 수정하지 말고 writer에게 결과를 전달한다.
   사람 UI·App trust/Run·자동 지침 로딩을 관찰 없이 성공으로 표시하지 않는다.
8. 자신이 시작한 서버와 전용 브라우저만 정리한다. 공개/원격 작업은 현재 승인 범위를 따른다.
