# 게임 검증 계획

제품 수치·수용 기준은 [PRD](PRD.md), 기술 경계는 [TRD](TRD.md)를 따른다.
결과는 [TEST_RESULTS](TEST_RESULTS.md)에 실행별로 기록하며 이전 단계 성공을 새 실행으로 세지 않는다.
PC Chromium만 대상으로 하고 모바일·후속 07~09 기능은 제외한다.

## 실행과 증거 경계

- `npm test`: `tests/model.test.js`의 제품 모델 직접 import와 `tests/assets.test.js`의 원본 검사.
  제어 delta·경계 상태 준비는 모델 검사이며 실제 브라우저 입력 증거가 아니다.
- 소유 dev `http://127.0.0.1:5173`에서 `npm run test:e2e`: `tests/browser/game.spec.js`.
  전용 Chromium의 실제 키·버튼·DOM·Canvas·route를 사용한다. clock 자동 플레이와 자연 시간을 구분한다.
- `npm run build` 후 소유 preview `http://127.0.0.1:4173/`와
  `npm run preview -- --base=/space-Invaders-demo03/`의 하위 경로를 각각 검사한다.
  `GAME_URL`로 대상 URL을 설정한다. PNG 파일 route 지연/실패는 dev 전용이며
  인라인 data URL인 빌드에 같은 route가 작동한다고 간주하지 않는다.
- 06-03 공개 URL은 새 전용 브라우저와 자연 시간·실제 키/버튼으로 확인한다.
  모델/clock 주입 없이 시작·이동·발사·점수·기체 둘·카드·종료 후 재시작을 관찰한다.
  전체 승패 경계는 Node 및 제어 clock 검사와 구분하고 공개 전체 승리를 억지로 주장하지 않는다.
- 서버의 PID·URL·응답을 기록한다. 미상 포트 소유자를 종료하지 않는다.
  의존성 설치는 manifest 변경 또는 실제 missing-dependency 실패 뒤에만 수행한다.

## 전체 PRD 연결

| PRD ID | 자동 확인 경로 | 추가 확인과 판정 |
|---|---|---|
| GAME-01 | 모델 title/시작 전환; HTML 초기 0; `Enter starts`·실제 시작 버튼 | 제목·조작·준비 상태, 이미지 준비 전 입력 차단 |
| GAME-02 | 모델 clamp/반대 입력; `real button, keyboard`의 방향키·A/D·Canvas 위치 | 모델 사각형 경계와 PNG 불투명 외곽을 구분 |
| GAME-03 | 모델 출발·속도·간격·비정수 누적·화면 밖 제거; 실제 Space 연사 | playing의 조작키 기본 스크롤 방지와 다른 UI 입력 비간섭을 별도 확인 |
| GAME-04 | 모델 편대 초기 좌표·속도·양끝 단일 하강; native blur 동안 Canvas 진행 | 편대 그림의 진행과 모델 경계를 혼동하지 않음 |
| GAME-05 | 모델 strict 네 방향 접촉·작은 침투·한 탄환/한 적·중복 점수 | 픽셀 피격·테스트 전용 제품 글로벌 모델 API 금지 |
| GAME-06 | 모델 이동 뒤 충돌·승리 우선·방어선 직전/도달; bounded sweep 승패 | 실제 키+제어 clock 승리/패배는 별도 E2E 경로 |
| GAME-07 | 모델 won/lost 모든 필드 동결; `normal keyboard sweep`·`loss freezes` | 종료 DOM·Canvas 동결, Enter 무시, nonrepeat R/버튼 재시작 |
| GAME-08 | 모델 모든 초기 필드 비교; E2E 3판 재시작·동일 시간 이동량·입력 정리 | 루프 중복 없는지 실제 반복 조작으로 확인 |
| INPUT-01 | 이미지 지연 동안 Enter repeat; 패배 R repeat; native iframe 포커스 blur | 합성 blur·native blur·OS 창 전환을 구분, 자동 일시정지 없음 |
| INPUT-02 | 모델 상태별 start/restart; title/종료 이동·발사 무시; playing Enter/R 무시 | 실제 편집 UI의 키 입력 비간섭 별도 확인 |
| UI-01 | 실제 HTML output/label, 카드 computed style | 남색 패널·밝은 카드·테두리·라벨/값 위계, 점수 카드 하나만 |
| UI-02 | `score is an HTML card`·승리 0→240 bounding box | PC 폭 1100/820/640에서 잘림·겹침·controls 분리와 고정폭 숫자 |
| ASSET-01 | 원본 두 PNG·라이선스 파일 목록/바이트/SHA-256/PNG 크기 | 원본 재다운로드를 CI에서 수행하지 않음 |
| ASSET-02 | 모델 크기/탄환 출발/방어선; `actual decoded PNG raster` drawImage 인자 | 너비·원본 비율·플레이어 위왼쪽/적 아래왼쪽 정렬 |
| ASSET-03 | PNG 알파 0 제외 다색·불투명 기준 래스터 비교 | 자연 크기 Canvas 캡처에서 방향·몸체·날개·조종석·배경 대비를 에이전트 관찰 |
| ASSET-04 | 전체/개별 PNG route 지연·실패; decode 완료 대기·실패 검사 | Vite `?t` query는 pathname+image 유형으로 처리; 오류·시작불가·fallback 부재 |
| RELEASE-01 | root/dev, root/build, subpath/build 각각 decode·래스터·네트워크 | data URL 허용; 파일 응답/MIME/404·외부 요청 확인, dist 파일 수 강제 금지; 공개는 06-03 |
| DOC-01 | README 명령 실제 실행·문서 대조·출처 링크와 라이선스 경로 | 실제 공개 URL은 첫 배포 후 coordinator의 한 번의 기록 PR; 결과는 이슈에 우선 보존 |

## 05-02 보강 및 실행 순서

기존 검사를 먼저 실행하고 누락 경로를 최소 테스트로 연결한다. 실제 실패만 원인 확인 후 수정한다.
스크롤/편집 UI 비간섭, decode 자체의 지연/거부, 카드 색·위계·겹침은 기존 검사와 구분해 보강한다.
긴 자동 진행은 유한 반복과 timeout을 사용하고 clock 설치·시작 경합을 피한다.
PNG 네트워크 중단으로 생긴 의도한 오류는 정상 화면의 요청 오류와 분리한다.

1. Node 모델·원본 검사와 dev 전체 E2E.
2. 자연 시간 로컬 화면 관찰과 console/pageerror/외부 요청 확인.
3. build 및 root·subpath 빌드용 검사. 각 대상 서버를 종료한 뒤 다음 서버 실행.
4. 실제 결과·실패·복구·미실행·환경 대기·미확인 기록, diff 검토 후 단계 커밋.
5. 06의 CI/Pages 권한·환경·실제 run/artifact/commit/URL 대응 및 공개 브라우저 확인.

## Skill와 사람 관찰

`.github/skills/game-check/SKILL.md` 파일 생성, 도구의 실제 Skill 호출,
그 이후 검사 실행을 별도 증거로 기록한다. not found이면 실패를 남기고 보존 commit/push 후
coordinator에게 같은 미병합 feature SHA의 읽기 전용 검사 세션을 요청하고 writer는 기다린다.
단순 파일 읽기나 CLI 전용 reload를 App 인식 성공으로 간주하지 않는다.
사람 직접 플레이·App trust/Run UI·Customize 화면·자동 지침 적용·OS 창 전환은 관찰하지 않으면 미확인이다.
