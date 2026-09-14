# 우주 방어

PC 브라우저에서 키보드로 적 편대를 막는 작은 Canvas 게임입니다.
시작·이동·발사·점수·승패·재시작까지 구현했습니다. 상단 **점수** 카드는 이번 게임의 점수를
실제 HTML 텍스트로 표시하며 상태 안내와 버튼은 카드 밖에 있습니다.

**공개 URL: 아직 없음 — 배포 예정.** 04-03은 기본 게임 코드 병합이며 첫 공개 배포가 아닙니다.
모바일·터치 조작은 지원하지 않습니다.

## 설치와 실행

Node.js 24 LTS를 권장합니다. 확인한 환경은 Node `24.14.1`, npm `10.8.3`입니다.
의존성 버전은 `package.json`과 `package-lock.json`에 고정되어 있습니다.

```sh
npm ci
npm run dev
```

브라우저에서 <http://127.0.0.1:5173>을 엽니다. 개발 서버는 실행한 터미널에서 `Ctrl+C`로 종료합니다.
5173이 사용 중이면 새 서버를 중복 실행하거나 모르는 프로세스를 종료하지 말고 먼저 소유자를 확인하세요.

| 입력 | 동작 |
|---|---|
| 시작 버튼 / Enter | 준비 화면에서 시작 |
| ← → / A D | 플레이 중 좌우 이동 |
| Space 길게 누르기 | 플레이 중 연속 발사 |
| 재시작 버튼 / R | 승리·패배 후 새 게임 |

이미지 준비가 끝나기 전에는 시작할 수 없습니다. 이미지 오류가 표시되면 서버와 요청 상태를 확인한 뒤
새로고침하세요. 대체 도형이나 외부 이미지로 오류를 숨기지 않습니다.
창·포커스를 벗어나면 눌린 입력은 비워지지만 게임은 자동 일시정지되지 않습니다.
상세 규칙과 수용 기준은 [PRD](PRD.md)를 참조하세요.

## 검사와 빌드

```sh
npm test
npm run build
npm run preview
```

`npm test`는 Node에서 제품 모델과 원본 에셋을 검사합니다.
`npm run build`는 `dist`를 만들고, `npm run preview`는 <http://127.0.0.1:4173>에서 그 결과를 제공합니다.
preview도 실행한 터미널에서 `Ctrl+C`로 종료하며 미상 포트 소유자를 종료하지 않습니다.

Playwright 검사는 **5173 개발 서버가 켜진 상태에서 별도 터미널**에서 실행합니다.

```sh
npm run test:e2e
```

Chromium 실행 파일이 없다는 오류가 나온 경우에만 `npx playwright install chromium`으로 준비한 후 다시 실행하세요.
테스트는 전용 브라우저에서 실제 버튼·키·DOM·Canvas를 확인합니다.
제어 clock을 사용하는 자동 플레이는 사람의 직접 플레이나 공개 자연 시간 검증과 다릅니다.
CI에서는 Playwright가 개발 서버를 자동 준비·종료합니다. 로컬 수동 실행에는 위 두 터미널 방식을 사용하세요.

## App 수동 실행 설정

[`.github/github-app.yml`](.github/github-app.yml)은 수동 **Run**(`npm run dev`)과
**Test**(`npm test`)만 제공합니다. 자동 설치·삭제·세션 트리거는 없습니다.

외부에서 작성하거나 바꾼 설정은 App에서 현재 내용을 검토·수락해야 적용됩니다.
이미 실행 중인 소유 서버를 먼저 종료한 다음 Run을 사용하세요.
명령 실행 결과는 확인했지만 **App trust 수락·Run UI 실제 조작은 미확인**입니다.
설정 파일 존재나 AGENTS 명시적 읽기는 자동 지침 로딩의 증거가 아닙니다.

## 비행체 에셋

제작자: [Kenney](https://kenney.nl/) · 팩: **Space Shooter (Redux)** · 라이선스: **CC0 1.0**.
포함 라이선스 원문은 [`src/assets/ships/LICENSE-Kenney.txt`](src/assets/ships/LICENSE-Kenney.txt)에 보존했습니다.
아래 주소는 공식 배포처가 아닌 제3자 미러의 고정 커밋
`b5ea6c01d219da1d2fc73c088dc86e3ab9e961c2`입니다.

| 사용 파일 | 고정 원본 |
|---|---|
| [`src/assets/ships/playerShip1_blue.png`](src/assets/ships/playerShip1_blue.png) | [청색 플레이어 PNG](https://raw.githubusercontent.com/mhmd-azeez/extism-space-commander/b5ea6c01d219da1d2fc73c088dc86e3ab9e961c2/assets/PNG/playerShip1_blue.png) |
| [`src/assets/ships/enemyRed1.png`](src/assets/ships/enemyRed1.png) | [적 PNG](https://raw.githubusercontent.com/mhmd-azeez/extism-space-commander/b5ea6c01d219da1d2fc73c088dc86e3ab9e961c2/assets/PNG/Enemies/enemyRed1.png) |
| [`src/assets/ships/LICENSE-Kenney.txt`](src/assets/ships/LICENSE-Kenney.txt) | [포함 라이선스](https://raw.githubusercontent.com/mhmd-azeez/extism-space-commander/b5ea6c01d219da1d2fc73c088dc86e3ab9e961c2/assets/license.txt) |

원본 파일은 수정하지 않았으며 로컬 정적 import로만 사용합니다. 런타임 외부 hotlink/CDN 요청은 없습니다.
빌드에서는 작은 PNG가 data URL로 인라인될 수 있습니다. 고정 해시·크기·그림 정렬은 [ideation](ideation.md)을 참조하세요.

## 개발 문서와 진행 상태

[작업 규칙](AGENTS.md) · [아이디어](ideation.md) · [제품 기준](PRD.md) ·
[기술 설계](TRD.md) · [구현 계획·실제 단계 결과](IMPLEMENTATION_PLAN.md)

M1/M2 실제 실행과 실패·재검사 근거는 구현 계획에 있습니다.
[검증 계획](TEST_PLAN.md)과 [실제 결과](TEST_RESULTS.md)는 모델·브라우저·이미지·빌드 검사를 구분합니다.
[game-check Skill](.github/skills/game-check/SKILL.md)은 이 절차를 재사용하며 실제 인식/호출 결과는
검증 결과에 기록합니다. Pages 공개는 이슈 #4의 후속 단계입니다.
