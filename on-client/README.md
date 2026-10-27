# 내 보안 Agent 시작 틀 0.2.11

이 보안 Agent는 회사 직원이 자기 로그인 상태, 업무 앱 접속 결과, 최근 접속 기록과 보안 경보를 보는 보안 앱입니다. 13단계부터 22단계까지 이 프로젝트 하나로 화면을 채워 가며 완성합니다. 처음이라면 docs/GETTING_STARTED_STUDENT.md부터 읽습니다. 무엇을 왜 만드는지와 단계별 순서가 그 문서에 있습니다.

이 시작 틀을 받은 것만으로 단계를 통과하지 않습니다. 단계마다 docs/STUDENT_PROMPTS.md의 안내를 수업용 AI에 붙여 넣어 student/extension.mjs를 고치고, 화면에서 확인하고, 커밋한 뒤 ALEPH에 제출합니다. 제출하면 서버가 그 커밋의 코드를 받아 AI가 단계 과제 기준으로 읽고 판정합니다. 코드를 실행해서 판정하지 않습니다.

## 켜기

검수 환경은 Node.js 24.19.0이며 외부 npm 의존성이 없습니다. 이 폴더의 PowerShell에서 아래를 실행하고 PC 브라우저로 http://127.0.0.1:5189 를 엽니다. 자세한 켜기·끄기·다시 켜기는 docs/STUDENT_LAUNCH_GUIDE.md에 있습니다.

    powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1

npm start도 같은 서버를 켭니다. 기본 실행은 실제 회사 시스템(기존 엔진)에 연결되지 않은 상태입니다. npm run demo는 예제 자료로 화면을 보여 줄 뿐이며 실제 연결이나 성취가 아닙니다. npm run check는 student/extension.mjs의 문법만 확인합니다.

## 지킬 것

- 기존 1~3차 프로젝트와 학생 파일은 지우거나 덮어쓰지 않습니다. 새 폴더에서 시작하거나, 이미 하던 프로젝트를 이어 씁니다.
- AI 열쇠·비밀번호·토큰을 코드, 커밋, 캡처, 도움정보에 넣지 않습니다. 주소나 열쇠를 직접 입력하는 칸도 만들지 않습니다.
- .env.example에는 비밀 없는 설정만 있습니다.

## 더 읽을 곳

- 단계별 안내와 AI에 붙여 넣을 문장: docs/STUDENT_PROMPTS.md
- 단계별 확인 항목: docs/CURRICULUM.json, docs/IMPLEMENTATION_CONTRACT.md
- 오류 코드별 해결: docs/CONNECTION_TROUBLESHOOT.md
- 시작 틀 업데이트(내 파일 보존): docs/STARTER_UPDATE.md
- 실제 회사 시스템(SDP)·앱 안 AI 연결은 담당자가 따로 안내할 때만 씁니다: docs/SDP_HOST_CONNECTION.md, docs/AI_SETUP_GUIDE.md. 이 연결은 앱을 처음 켜고 13~16단계 화면을 만들거나 공식 AI 코드 판정을 받기 위한 전제 조건은 아닙니다. 다만 17단계 이후의 실제 연결과 새 환경 재현은 해당 단계의 기준에 따라 따로 확인합니다.


## 마지막 총공세 1~5일차: Windows PC 관제 및 재현 (2026-10-27)

이 저장소의 PICASOAR는 기존 13~22단계 보안 Agent 화면에 **로컬 PC 관제**를 확장했습니다. 기존 학생 구현·SDP 연결과 독립적으로 로컬 CPU·물리 메모리·시스템 디스크, 네트워크 어댑터, Windows 방화벽 프로필, 최근 24시간 System/Application 경고·오류 건수를 조회합니다. 실제 침해 탐지 결과로 해석하지 않습니다.

Windows 11에서 처음 실행할 때 (기존 프로젝트 폴더를 보존하고 새 폴더에서 진행):

```powershell
git clone https://github.com/Deumy316/PICASOAR.git C:\work\PICASOAR-REPRO-DAY5
Set-Location C:\work\PICASOAR-REPRO-DAY5
git checkout --detach 9b707c92d94afe0829a99c645885d7b554dc56a9
Set-Location .\on-client
node --version
npm.cmd --version
npm.cmd run check
npm.cmd start
```

브라우저: http://127.0.0.1:5189/ . 실행 창의 `Ctrl+C`로 종료합니다. 기존 폴더를 덮어쓰지 말고, 지정 폴더가 이미 존재하면 새로운 빈 폴더 이름을 사용하세요. `npm.cmd run demo`는 기본 서버를 종료한 후 실행하며, 업무 앱·보안 기록은 **예제 데이터**, 로컬 PC 상태 카드는 **실측 데이터**입니다. 연결되지 않은 SDP·AI 기능은 미연결로 표시될 수 있습니다.

검증 기준: Windows 11, Node.js v24.21.0, npm 11.19.0, 커밋 `9b707c92d94afe0829a99c645885d7b554dc56a9`에서 사용자 재현 확인. 프로젝트 `package.json`의 엔진 명시는 24.19.0이며 24.21.0에서의 사용자 확인이 그 설정을 변경하지는 않습니다. `npm.cmd run check`는 학생 JS 문법 검사만 수행합니다. `npm run package-app`은 아직 구현되지 않았으며 6일차 포장 단계에서 별도 확인해야 합니다.

상세 실행, 다시 조회, 오류 구분 및 재현 체크리스트: [docs/STUDENT_LAUNCH_GUIDE.md](docs/STUDENT_LAUNCH_GUIDE.md)의 **부록 A — 마지막 총공세 5일차**를 참고하세요.
