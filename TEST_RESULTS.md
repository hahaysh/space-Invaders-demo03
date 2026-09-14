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
이번 dev E2E·로컬 자연 시간·root/subpath 빌드 브라우저 검사는 아직 미실행이다.
준비한 소유 dev는 launcher PID `31616`, Vite PID `30936`,
`http://127.0.0.1:5173` HTTP 200을 확인한 뒤 대기 전 종료했다.
검사 세션과 서버 소유권을 겹치지 않게 한다.

## 후속·미확인

05-02 회귀 보강, 06-01 Pages 준비, 06-02 workflow, 06-03 PR/첫 배포는 미실행이다.
공개 URL·Actions run·artifact·배포 commit은 아직 없다.
사람 직접 플레이·OS 창 전환·App trust/Run UI·Customize 화면·자동 지침 적용은 미확인이다.
실제 Skill 호출 실패는 일반 검사 실행 성공으로 덮어쓰지 않는다.
