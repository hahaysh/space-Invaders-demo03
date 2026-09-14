# 게임 검증 실제 결과

검증 항목은 [TEST_PLAN](TEST_PLAN.md), 제품 규칙은 [PRD](PRD.md)를 참조한다.
이전 04 결과는 [이슈 #2 완료 댓글](https://github.com/hahaysh/space-Invaders-demo03/issues/2#issuecomment-5662594154)과
[캐시 한계 댓글](https://github.com/hahaysh/space-Invaders-demo03/issues/2#issuecomment-5662615080)의 과거 근거다.
아래 결과와 합산하거나 새 실행 성공으로 취급하지 않는다.

## 05-01 착수와 설치 — 2026-09-14

base main, HEAD/origin/main/실제 원격 main:
`db5cf95639d03ba883bc0278d1f06f1308728f5a`. clean의 새 App worktree에서 시작했다.
Node `24.14.1`, npm `10.8.3`, Windows x64, Vite `8.0.0`, Playwright `1.63.0`.
고정 안내 ref의 전체·에셋·05-01을 GitHub contents raw API로 읽고 사용자 위임 설계를 검토했다.
이는 사람 UI 검토나 자동 지침 로딩 증거가 아니다.

| 실제 명령/확인 | 결과 | 범위·실패와 복구 |
|---|---|---|
| `npm run build` (설치 전) | 실패 | node_modules 없음, `vite is not recognized`; 의존성 부재 확인 |
| `npm ci --no-audit --no-fund --registry=https://registry.npmjs.org --cache=<전용 빈 캐시> --loglevel=http` | 성공, 종료 0 | 자기 session artifacts의 미존재 `npm-cold-cache-issue4-20260914` 사용, tarball GET 200 (cache miss) 25건, added 19 packages in 5s |
| lock SHA-256 설치 전후 | 동일 | `96ee734d6bc2accaff11e959d0ab480dd5ab4ebe9b0a830b6e5b05183c176c76`; 파일 전체 불변으로 version/integrity 유지 |
| `npm ls --depth=0` | 성공 | 고정 Vite/Playwright 버전 일치 |
| `npm test` | 11/11 성공 | 제품 모델 10개 + 원본 에셋 1개; 상태 주입 모델 경계는 브라우저 플레이와 별개 |
| `npm run build` (설치 후) | 성공 | 상대 base의 dist 생성; 공개/이미지 실제 표시 검사와 별개 |

전용 캐시는 실행 전에 경로가 없음을 확인했다. TLS·인증 완화나 공용 캐시 삭제는 하지 않았다.
Windows 플랫폼에서 선택한 패키지의 실제 다운로드/설치 증거이며 lock 전체 플랫폼 tarball 50개
모두의 설치 증거는 아니다. 로그는 자기 session artifacts에 보존했다.
원격 설치 근거: [이슈 #4 댓글](https://github.com/hahaysh/space-Invaders-demo03/issues/4#issuecomment-5662655718).

## 05-01 Skill과 브라우저

TEST_PLAN/TEST_RESULTS와 최소 Skill 파일을 작성한 뒤 `skill` 도구에 `game-check`를 실제 요청했다.
응답은 **`Skill "game-check" not found`**였다. 호출 시도는 했으나 로딩·실행에 실패했으며,
현재 세션의 파일 읽기를 Skill 호출 성공으로 표시하지 않는다.
변경을 commit/push로 보존하고 coordinator에게 정확 feature SHA를 전달해
같은 미병합 기능 브랜치 기준의 읽기 전용 검사 세션을 요청한다. 결과가 올 때까지 writer는 대기한다.
이 호출 시점에는 dev E2E·로컬 자연 시간·root/subpath 빌드 브라우저 검사가 미실행이었다.
준비한 소유 dev는 launcher PID `31616`, Vite PID `30936`,
`http://127.0.0.1:5173` HTTP 200을 확인한 뒤 대기 전 종료했다.
검사 세션과 서버 소유권을 겹치지 않게 한다.

### 같은 feature의 실제 Skill 발견·실행

coordinator가 feature `3e722634d28434a1a049141c85f1e9ff57c7f4af`를 명시적 base로 연
읽기 전용 검사 세션 `e56471ae-2892-48fe-95da-46388716a1db`의 첫 도구 호출에서
`Skill "game-check" loaded successfully. Follow the instructions in the skill context.`
응답과 8항 skill context 로딩이 확인됐다. 그 지침에 따른 실행 결과를 inspector와 coordinator가
writer에게 전달했다. 기존 writer의 not found 실패는 그대로 남기며, 아래는 inspector 실행이다.

| 실제 명령 | 결과 | 구분 |
|---|---|---|
| 설치 전 `npm run build` | 의존성 부재 실패 | 새 inspector worktree의 vite 미설치 |
| `npm ci --no-audit --no-fund --registry=https://registry.npmjs.org` | 성공, 19 packages/2s | 기본 캐시 사용; writer의 별도 cold-cache 근거와 다름. lock SHA 불변 |
| `npm test` | 11/11 | 모델 10 + 에셋 1 |
| `npm run dev` 후 `npm run test:e2e -- --reporter=list --output=<inspector artifacts>\e2e-dev` | 14/14, 1.3분 | 실제 키/버튼·제어 clock·route·래스터 |
| `npm run build` | 성공 | 기존과 동일 JS/CSS 산출물 |
| root preview의 `GAME_URL`로 E2E 빌드용 grep | 6/6, 14.3초 | HTML·실제 키·카드·승리/재시작·PNG |
| subpath preview의 `GAME_URL`로 같은 grep | 6/6, 14.9초 | 저장소 하위 경로 동일 dist |

빌드용 grep은 `initial HTML|real button|Enter starts|score is an HTML|normal keyboard sweep|actual decoded PNG`.
root는 `npm run preview`, 하위 경로는 `npm run preview -- --base=/space-Invaders-demo03/`.
총 테스트 실행 37/37, 제품 검사 실패 0. 의도한 PNG 실패 route의 EncodingError 3건은 정상 오류 표출이다.
전용 Chromium 자연 시간 시작 버튼→ArrowRight 250ms→Space 1500ms 후 40점/playing을 관찰했다.
실제 800×600 Canvas 캡처에서 두 기체의 방향·몸체·날개·조종석·대비를 inspector가 관찰했다.
카드 160×96, 라벨 12px/값 32px·750·tabular-nums·조작 분리를 확인했다.
dev 두 PNG 200 image/png; root/subpath HTML/CSS/JS 200 및 정상 MIME,
인라인 PNG 두 개 decode 99×75/93×84와 래스터 통과. 정상 화면의
console error/pageerror/requestfailed/HTTP 오류/외부 요청은 모두 0이었다.

이는 에이전트 검사이며 사람 플레이/자연 시간 전체 승리/OS 창 전환이 아니다.
decode 자체의 독립 지연·거부, 편집 UI/스크롤 비간섭, PC 폭별 전체 기하학적 겹침은
기존 검사만으로 확정하지 않는다. 05-02에서 보강할 검증 공백이며 확인된 제품 결함은 아니다.

inspector 시작/종료 HEAD 동일, 추적파일·staged diff·status 모두 clean, commit/push 없음.
소유 dev launcher/Vite 43544/44448, root 41408/27836, subpath 32152/28268은
각각 HTTP 200 확인 후 모두 종료했고 5173/4173 리스너와 전용 브라우저가 남지 않았다.
로그·스크린샷은 해당 검사 세션 artifacts에 보존됐으며 writer는 그 worktree를 읽거나 수정하지 않았다.
05-01은 이 실제 호출·실행 근거를 받아 **완료, 누적 10/20**으로 확정한다.

## 후속·미확인

06-01 Pages 준비, 06-02 workflow, 06-03 PR/첫 배포는 미실행이다.
공개 URL·Actions run·artifact·배포 commit은 아직 없다.
사람 직접 플레이·OS 창 전환·App trust/Run UI·Customize 화면·자동 지침 적용은 미확인이다.
실제 Skill 호출 실패는 일반 검사 실행 성공으로 덮어쓰지 않는다.

## 05-02 검증 공백 보강 — 2026-09-14

고정 ref의 05-02 원문과 PRD/TEST_PLAN/inspector 결과를 대조해 사용자 위임 추천안으로
검사 누락만 보강했다. 현재 writer의 Skill 재호출은 다시 not found였으므로
SKILL.md를 명시적으로 읽은 **일반 대체 실행**이다. 05-01 inspector 실제 호출 성공과 구분한다.

제품 결함은 재현되지 않았으며 제품 소스·PNG·lock은 바꾸지 않았다.
`verification.spec.js`에 다음 7개 검사를 추가했다:
기체별 네이티브 decode 성공 후 완료 지연/거부 4개, 실제 키 기본 스크롤/편집 UI 비간섭 1개,
PC 세 폭·title/playing/lost의 card/controls/canvas 비겹침·색/위계 1개, 정상 요청 MIME/오류 1개.
편집 UI에서 방향키·Space를 실제로 유지한 채 제어 시간을 진행해 기체/탄환 영역이 변하지 않는지도 확인했다.
네트워크 실패와 decode 거부를 분리했으며 data URL에서도 같은 decode 검사를 실행했다.

| writer 실제 실행 | 결과 |
|---|---|
| `npm run test:e2e -- tests/browser/verification.spec.js --reporter=list` | 최초 7/7 |
| 입력 비간섭 그림 확인 보강 후 `npm test` | 11/11 |
| `npm run test:e2e -- --reporter=list` | 전체 21/21, 1.7분 |
| `npm run build` | 성공, 제품 JS/CSS 산출물 불변 |
| root preview + TEST_PLAN 빌드 grep | 13/13, 38.6초 |
| subpath preview + 같은 grep | 13/13, 37.9초 |
| 전용 Chromium 자연 시간 버튼→오른쪽 250ms→Space 1500ms | 30점/playing, 요청·pageerror·외부 오류 0 |

새 최종 회귀 실행은 Node11+dev21+root13+subpath13이며, 최초 보강7회와 inspector37회는 별도다.
root/subpath 실제 PNG 래스터·비율·정렬·decode, 파일 응답 MIME/404·외부요청 부재를 확인했다.
의도한 decode 거부/네트워크 route 오류만 예상 실패로 취급했으며 정상 자원 검사는 별도다.
기존 04와 05-01 결과를 이번 성공으로 복제하지 않았다. 이번 보강 검사 실패·미해결 제품 결함은 0이다.

writer가 자연 시간 전체 페이지 캡처를 직접 열어 청색 위방향 플레이어, 적갈색/주황갈색 아래방향 적,
몸체·날개·조종석·배경 대비와 점수30 HTML 카드를 관찰했다. 사람의 직접 플레이는 아니다.
소유 dev Vite PID33540, root preview38752, subpath preview20056은 각 URL HTTP200 확인 후
순차 종료했다. 전용 Chromium은 finally에서 종료했다. 다른 세션 자원은 조작하지 않았다.
05-02 배포 후보 검증 완료, 누적 **11/20**. 공개 URL 확인과 README 실제 URL은 06 이후 경계다.
