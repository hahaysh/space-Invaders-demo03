# 구현 계획과 단계 기록

제품 기준은 [PRD](PRD.md), 구조는 [TRD](TRD.md), 자산은 [ideation](ideation.md)를 따른다.
이 문서는 구현 순서와 단계별 설계 검토를 담당한다.
05 이후 검사 항목은 [TEST_PLAN](TEST_PLAN.md), 실제 결과는 [TEST_RESULTS](TEST_RESULTS.md)에 남긴다.

## 착수·위임 검토

- 선택 base `main`, 착수 HEAD·origin/main·merge-base는 모두 `bd338c1f63f267e4932b2b2662aa829fef99df31`.
- 네 개발 문서 존재와 원문, 이슈 #2 본문·댓글(없음), clean worktree를 확인했다.
- App 도구로 기능 브랜치를 `hahaysh-base-game-m1-m2-m3`로 변경했다. main checkout은 사용하지 않는다.
- 안내 `hahaysh/space-Invaders@bfc109c5e5656db5ab2ad02804cf318702616b55`의
  `docs/00-전체-실습-안내.md`, `docs/화면과-에셋-기준.md`, `docs/04-01-첫-게임-구현.md`를
  GitHub public contents API raw 응답 원문으로 읽었다. 안내·샘플은 복사하지 않는다.
- 사용자가 추천안 선택·실행·커밋·푸시·PR 검토·정상 병합을 위임했다.
  이는 사람의 직접 플레이·App trust/Run UI 확인이나 자동 지침 로딩 확인과 다르다.
- 실제 환경 Node `24.14.1`, npm `10.8.3`. 의존성은 호환 안정 버전을 manifest에 고정한 후 설치한다.

## 구현 순서

| 단계 | 범위·예상 변경 | 실제 확인 방법 | 상태 |
|---|---|---|---|
| 04-01 / M1 | 계획 먼저, Vite·모델/UI, 시작·이동·발사, 점수 0 카드, 플레이어 PNG·라이선스 | Node 모델 import, Playwright 키/버튼/DOM/Canvas, 이미지 route 지연·실패, build | 완료 |
| 04-02 / M2 | 적 PNG·편대·충돌·점수·승패·완전 재시작 | 경계·중복·승리 우선·동결 모델 검사, 실제 입력·반복 재시작·blur·화면 | 완료 |
| 04-03 / M3 | README, 공식 스키마의 수동 App 실행 설정, PR 검토·정상 병합 | root/하위 경로 로컬 검증, base/head/diff/reviews/checks 및 원격 확인 | 로컬 완료; 원격 근거는 이슈 #2 |

### M1 설계 검토

DOM 없는 제품 모델을 Node에서 직접 import한다. UI는 단일 rAF와 키 집합을 소유하며
최초 HTML 점수 0을 rAF 이전에 표시한다. 플레이어 이미지 decode 완료까지 시작을 잠근다.
Canvas는 읽기 전용 표현이며 실제 PNG 비율·정렬을 지킨다. M2의 적·충돌·승패는 아직 넣지 않는다.
Playwright는 전용 브라우저를 사용하며 제품 전역 모델 API·치트는 만들지 않는다.

### M1 실제 결과 — 2026-09-14

- `npm test`: 4/4, `npm run test:e2e`: Chromium 6/6, `npm run build`: 성공.
- 실제 버튼·Enter·방향키·A/D·Space, 모델 경계·발사 위치/간격/제거, 반대 입력,
  blur 입력 정리, HTML 초기 0, 카드 computed style, PC 폭 1100/820/640을 검사했다.
- route 지연·실패로 시작 잠금·명시적 오류·도형 대체 부재를 확인했다.
- M1 PNG 1개와 라이선스 바이트·SHA-256·PNG 크기를 고정 출처와 대조했다.
- 독립 Chromium 캡처를 에이전트가 관찰했다. 청색 기체의 몸체·날개·조종석과 카드 대비가 보인다.
  사람의 직접 플레이는 미확인이다.
- Node 24.14.1/npm 10.8.3, Vite 8.0.0/Playwright 1.63.0을 manifest와 lock에 고정했다.
  registry latest Vite는 beta였으므로 확인된 안정 8.0.0을 선택했다.
- 소유 dev 서버 `http://127.0.0.1:5173`, PID `45948`, HTTP 200. 다음 단계에서 계속 사용한다.
- diff 공백 검사 성공. 실패한 제품 검사는 없음. 최초 포트 조회의 종료 코드 1은
  리스너 부재였으며 기존 프로세스를 종료하지 않았다.
- 적·점수 증가·승패·재시작은 M2 미구현이며 공개 URL·App trust/Run UI·자동 지침 로딩은 미확인.

### M2 설계 검토

고정 SHA의 `docs/04-02-핵심-게임-완성.md`를 contents API raw 원문으로 읽고 계획·PRD·TRD와
M1 코드를 검토했다. 같은 모델에 편대/방향을 추가하며 충돌 소비는 탄환별 한 적으로 제한한다.
살아 있는 편대 경계로 반전·하강하고, 충돌 후 적 소진을 방어선보다 먼저 판단한다.
종료 상태는 모델 갱신을 차단하며 재시작은 새 모델과 빈 키 집합·새 rAF 기준 시각을 사용한다.
루프는 시작 시 한 번만 등록한다. 두 이미지 decode를 함께 기다리며 실패는 그대로 드러낸다.
Node에서 규칙 경계, Playwright에서 치트 없이 실제 키로 승패·재시작과 점수 카드 안정성을 확인한다.
M1 커밋 때 나온 Git 줄바꿈 경고에 따라 라이선스 원본의 체크아웃 바이트 보존도 고정한다.

### M2 실제 결과 — 2026-09-14

- `npm test`: 11/11, 최종 `npm run test:e2e`: Chromium 14/14, `npm run build`: 성공.
- Node 제품 모델 import: 24개 편대·속도·양쪽 경계 단일 하강, strict 4방향 접촉,
  한 탄환/한 적·중복 점수 방지, 이동 후 마지막 충돌/방어선 동시 도달 승리 우선,
  종료 상태 전체 동결·재시작 전체 필드 초기화를 검사했다.
- 비정수 프레임에서도 발사 대기 잔여 시간을 보존한다. Node에서 16ms×25의 간격 누적 검사를 추가했다.
- Playwright 제어 clock + 실제 키로 좌우 연사하여 240점 승리, 발사 없이 패배,
  R과 버튼 재시작·세 판 반복·입력 초기화·동일 시간 이동량(루프 중복 부재)을 확인했다.
  Node 상태 주입 검사를 브라우저 플레이 증거로 바꾸어 기록하지 않았다.
- 점수 0→240 카드 bounding box 동일, 원본 PNG 2개 hash/크기 일치,
  drawImage 인자·decode·투명 픽셀 제외·다색 원본 래스터와 실제 Canvas 불투명 픽셀 일치를 검사했다.
  관찰용 Canvas 계측은 테스트에만 있으며 제품 전역 모델 API는 없다.
- 두 PNG 각각 지연/실패 route로 전체 시작 잠금, Enter repeat 무시, 명시적 오류를 확인했다.
  정상 화면에서 외부 요청과 실패 요청이 없었다.
- 첫 M2 브라우저 실행은 10/13: M1 전용 점수 0 기대가 실제 적 제거로 10이 되어 실패했고,
  적 PNG의 Vite `?t=` URL을 경로만 매칭하지 못한 route 2개가 실패했다.
  점수 0은 발사 전 검사로 이동하고 실제 증가·최대값은 별도 승리 검사로 유지했으며,
  route는 pathname와 image resource type을 기준으로 수정했다. 해당 검사들은 재실행 통과했다.
- headless `bringToFront`만으로 창 blur가 관찰되지 않은 시도는 실패로 기록한다.
  대안인 독립 테스트 iframe의 실제 버튼 클릭으로 네이티브 window blur를 확인했고,
  입력 정리 후 기체 정지·편대 이동 지속을 검증했다. OS 창 전환은 미확인이다.
- 자연 시간 1초 실제 발사 캡처에서 20점과 남은 편대, 청색 플레이어/적갈색 적의 몸체·날개·조종석,
  방어선과 카드 대비를 에이전트가 관찰했다. 전체 승리는 제어 clock 자동 플레이이며 사람 플레이가 아니다.
- 소유 dev PID `45948` 유지. M1 원격 근거 `a81459f`, 이슈 #2 단계 댓글에 기록했다.
  Pages·공개 URL·App trust/Run UI·자동 지침 로딩은 미실행/미확인이다.

### M3 설계 검토

고정 SHA의 `docs/04-03-App-설정과-README.md`를 contents API raw 원문으로 읽었다.
현재 manifest와 M1/M2 결과·계획을 검토하고
[공식 App 설정](https://docs.github.com/copilot/reference/github-copilot-app-reference/repository-configuration)을
직접 확인했다. `scripts`는 name/command 목록이며 triggers 없는 수동 Run/Test만 둔다.
자동 설치/삭제·지침 복제·자동화·추가 커스터마이징은 만들지 않는다.
README는 실행/조작/에셋 출처를 안내하고 수치는 PRD로 연결한다. 공개 주소는 배포 예정으로 표기한다.
빌드 root 및 저장소 하위 경로의 실제 decode/화면/네트워크를 확인한 후 기능 PR을 검토·정상 병합한다.
App trust 수락과 Run UI 조작은 미확인으로 남기며 CLI 실행을 UI 검증으로 간주하지 않는다.

### M3 실제 로컬 결과 — 2026-09-14

- README의 명령과 manifest, App 공식 name/command 목록·triggers 부재·auto_open_in_browser를 대조했다.
  Run/Test 명령을 실제 CLI로 실행했다. App UI 적용·수락은 검사하지 않았다.
- `npm test` 11/11, `npm run build` 성공, `npm ls --depth=0` 고정 의존성 2개 일치.
  M1 설치는 `npm install`이었다. PR 검토 중 아래 lock 보완 후 `npm ci`도 실제 실행했다.
- 같은 dist에 대해 root `http://127.0.0.1:4173/` Playwright 6/6,
  하위 경로 `http://127.0.0.1:4173/space-Invaders-demo03/` 6/6.
  각 경로의 최초 HTML/실제 시작·이동·발사/카드/240점 승리·재시작/PNG decode·다색 래스터를 검사했다.
  M2 dev 전체 14/14의 이미지 route 지연·실패 검사는 그대로 유지된다.
- 하위 경로는 `npm run preview -- --base=/space-Invaders-demo03/`로 같은 산출물을 제공했다.
  이는 로컬 마운트 검사이며 Pages 공개 검사가 아니다.
- 빌드 PNG data URL 정확히 2개, HTML/CSS/JS HTTP 200 및 올바른 MIME, pageerror 없음.
  dev PNG 파일 URL도 각각 HTTP 200·`image/png`. 정상 브라우저 검사에서 외부/실패 요청 없음.
- Git에 저장된 라이선스도 원본 498바이트·SHA-256 일치. diff 공백 검사 성공.
  최초 M3 게임 검사는 실패가 없었으며 PR 검토 보완은 아래에 구분한다.
  사람이 직접 수행한 UI 검토를 대신했다고 기록하지 않는다.
- 소유 서버: M1/M2 dev PID `45948` 종료 → 실제 `npm run dev` PID `28028` HTTP 200 →
  root preview PID `12236` HTTP 200 → 하위 경로 preview PID `31628` HTTP 200.
  네 PID 모두 종료 확인했고 5173/4173 리스너 부재를 확인했다.
  독립 테스트 브라우저도 종료했으며 다른 세션 서버/탭은 조작하지 않았다.

### M3 PR 검토 보완 — 공개 npm 주소

실제 PR diff·lock 메타데이터 검토에서 환경 전용 미러의 resolved URL을 발견했다.
공개 저장소의 설치 이식성을 위해 버전·integrity·나머지 메타데이터는 그대로 두고
50개 resolved만 `https://registry.npmjs.org/` 배포 주소로 정규화했다.
`npm install --package-lock-only --replace-registry-host=always` 시도는 주소를 바꾸지 않아 효과가 없었고,
lock의 resolved 필드만 일괄 변환했다. 공개 tarball 50개 모두 HEAD 200을 실제 확인했다.
처음 일회성 메타데이터 비교는 root에 불필요한 `resolved: undefined` 필드를 추가하여 실패했다.
비교 스크립트를 바로잡은 후 모든 버전·integrity·나머지 메타데이터가 동일함을 확인했다.

`npm ci --no-audit --no-fund --registry=https://registry.npmjs.org` 성공 후
Node 11/11·Playwright 전체 14/14·build를 다시 통과했다.
빌드 파일명/해시는 앞선 root·하위 경로 검사 때와 동일하다.
추가 소유 dev PID `30652`, HTTP 200을 확인해 검사한 후 종료했다.
이 보완은 M3의 설치 안내와 직접 관련되며 게임 기능·05 이후 범위를 추가하지 않는다.

### 원격 완료 기록의 위치

M1 `a81459f`, M2 `6d16797`은 각각 feature 원격 반영 후 이슈 #2에 단계 보고를 남겼다.
M3 PR의 실제 base/head·diff·reviews/checks 검토, 정상 merge SHA, 원격 main 파일·clean 확인과
최종 **9/20** 확정은 [기본 게임 이슈 #2](https://github.com/hahaysh/space-Invaders-demo03/issues/2)의
최신 04-03 완료 댓글에 기록한다. 커밋 안에 자기 자신의 SHA나 미래 병합 성공을 미리 기록하지 않는다.

## 공통 진행표

05-01은 기본 게임 PR #3가 정상 병합된 main `db5cf95639d03ba883bc0278d1f06f1308728f5a`의
새 App 이슈 #4 worktree에서 시작한다. 실제 원격 main과 문서·게임·README·App 설정을 확인했고,
기능 브랜치는 `hahaysh-game-verification-first-deploy`다. 이슈 #2의 완료·캐시한계 댓글을 읽었다.
고정 안내의 전체·에셋·05-01 원문과 기존 tests/scripts를 검토한 뒤 사용자 위임 추천안으로
전체 PRD 확인 경로·실제 결과·최소 game-check를 분리했다.
새 빈 캐시 공개 registry 설치와 lock 불변, Node/build의 새 결과는 TEST_RESULTS에 기록했다.
Skill 파일 생성 후 실제 도구 호출을 시도하며, 미발견이면 보존 커밋을 같은 feature의
읽기 전용 검사 세션으로 전달하고 writer는 기다린다. 05-02 이후는 그 결과를 받은 뒤 진행한다.

| 단계 ID | 상태 | 완료 근거 |
|---|---|---|
| 01-01 | 완료 | 초기 커밋 `8ecece5` |
| 01-02 | 완료 | AGENTS `b8c36b1` |
| 02-01 | 완료 | ideation `0eab2ef` |
| 02-02 | 완료 | PRD `bfb8491` |
| 02-03 | 완료 | TRD `87b1929` |
| 03-01 | 완료 | 문서 PR #1 merge `bd338c1` |
| 04-01 | 완료 | M1 모델 4/4·브라우저 6/6·build |
| 04-02 | 완료 | M2 모델 11/11·브라우저 14/14·build |
| 04-03 | 완료 | PR #3 merge `db5cf95`, 이슈 #2 완료 댓글 |
| 05-01 | 완료 | 같은 feature 새 검사 세션의 Skill 실제 로딩·37/37, TEST_RESULTS |
| 05-02 | 완료 | 검증 공백7개 보강, Node11/dev21/root13/subpath13, 제품 결함 없음 |
| 06-01 | 완료 | Public/추적파일 검토, Pages workflow·main branch 전용 환경 API 확인 |
| 06-02 | 완료 | 공식SHA 고정 workflow·7조건/권한 검토·CI경로 Node11/E2E21/build |
| 06-03 | 미실행 | 별도 검증·배포 이슈 |
| 07-01 | 미실행 | 후속 이슈 |
| 07-02 | 미실행 | 후속 이슈 |
| 08-01 | 미실행 | 후속 이슈 |
| 08-02 | 미실행 | 후속 이슈 |
| 09-01 | 미실행 | 후속 이슈 |
| 09-02 | 미실행 | 후속 이슈 |

누적 완료: **13/20**. 최초 not found와 새 검사 세션의 실제 로딩·실행을 구분해 보존했다.
이슈 #4 범위는 05~06 첫 공개까지이며, 한 번의 기록 PR은 coordinator가 맡는다. 07~09는 시작하지 않는다.

## 06-03 첫 배포 실패 복구 설계 — 2026-09-14

PR #5 정상 병합 main `67b7c7cf58d5d93c480573a9de13ae31bac14a84`의 새 clean App
worktree에서 시작했다. main push run `34837213581`의 E2E 패배 대기 실패로
build/upload/deploy가 차단됐으며 첫 공개 성공은 아직 아니다.
위임 검토·허용 안내 원문과 실제 실패 로그를 읽고 제품이 아닌 검사 시계 경계를 보강한다.

Playwright clock 계약상 install은 최초 rAF 등 시간 API 사용보다 앞서야 한다.
기존 navigation 뒤 설치 4곳을 공용 helper의 navigation 전 설치·정지로 바꾼다.
패배 대기는 같은 56초 최대 예산 안의 유한 DOM 관찰로 바꾸고 기대값·제품 수치는 유지한다.
원격 실패의 정확 콜백 순서는 미확정이며 로컬 기존 테스트 3회는 모두 통과했다.
타겟 반복 → Node/dev 전체 → build/root/subpath → 복구 PR CI 검토·정상 merge →
정확 main 배포·공개 자연 시간 확인 순서다. 원격 근거는 이슈 #4에 즉시 보존하며
이 세션에서 추가 기록 PR이나 07 기능을 만들지 않는다.
