---
name: carousel-orchestrator
description: >
  캐러셀 생성기 프로젝트의 모든 개발 작업을 조율하는 오케스트레이터.
  백엔드(Python/FastAPI), 프론트엔드(React), 디자인 파라미터 조정 등
  어떤 개발 요청이든 이 스킬로 시작한다.
  "기능 추가", "버그 수정", "UI 바꿔", "디자인 수정", "새로운 기능", "고쳐줘",
  "추가해줘", "다시 실행", "수정해줘" 등 프로젝트 관련 작업 요청 시 이 스킬을 사용하라.
  단순 질문(코드 설명, 구조 파악)은 직접 응답한다.
---

## 에이전트 팀 구성

| 에이전트 | 파일 | 전문 영역 |
|---------|------|---------|
| backend-dev | `.claude/agents/backend-dev.md` | generate.py, config.py, main.py |
| frontend-dev | `.claude/agents/frontend-dev.md` | React 컴포넌트, CSS |
| design-tuner | `.claude/agents/design-tuner.md` | 디자인 파라미터, 시각 검증 |

## Phase 0: 컨텍스트 확인

작업 시작 전 기존 상태를 파악한다.

```
git status → 미커밋 변경사항 확인
최근 수정 파일 확인 → 작업 범위 판단
```

- **신규 기능**: 요구사항 분석 후 Phase 1 진행
- **버그 수정**: 오류 재현 → 원인 파악 → 수정 → 검증
- **디자인 조정**: design-tuner만 단독 실행
- **부분 수정 요청**: 해당 에이전트만 선택적 호출

## Phase 1: 요청 분류 및 팀 구성

요청 내용에 따라 필요한 에이전트만 선택한다.

| 요청 유형 | 투입 에이전트 | 실행 모드 |
|---------|------------|---------|
| 백엔드 기능만 | backend-dev | 단독 |
| 프론트 UI만 | frontend-dev | 단독 |
| 디자인 조정만 | design-tuner | 단독 |
| API + UI 동시 변경 | backend-dev + frontend-dev | 에이전트 팀 |
| 새 기능 (풀스택) | 전체 팀 | 에이전트 팀 |

**에이전트 팀 실행 시:**
```
TeamCreate(
  team_name="carousel-dev",
  members=["backend-dev", "frontend-dev", ...]  # 필요한 에이전트만
)
TaskCreate(tasks with dependencies)
```

## Phase 2: 작업 실행

### API 변경이 포함된 경우 (팀 모드)
1. backend-dev가 먼저 API 스펙 확정 후 frontend-dev에게 공지
2. frontend-dev는 공지 받은 스펙으로 연동 코드 작성
3. 두 작업 완료 후 통합 테스트

### 단독 에이전트 작업
해당 스킬을 직접 실행하고 결과를 확인한다.

### 작업 완료 기준
- 백엔드: `python backend/generate.py inputs/velocity.md` 성공 + PNG 확인
- 프론트엔드: `preview_screenshot`으로 UI 확인
- 디자인: Read 도구로 생성 이미지 시각 확인

## Phase 3: 검증

변경 범위에 따른 검증:

| 변경 범위 | 검증 방법 |
|---------|---------|
| generate.py | CLI 실행 + 결과 이미지 Read |
| main.py | `/api/health` + `/api/generate` 호출 테스트 |
| 프론트엔드 | preview_screenshot |
| config.py | CLI 실행 + 이미지 시각 확인 |

## Phase 4: 마무리

1. 변경된 파일 목록 요약
2. 사용자에게 결과 보고
3. 추가 조정 필요 여부 확인

## 에러 핸들링

- **Python 오류**: traceback 전문 확인 → backend-dev 스킬로 수정
- **API 500**: `backend/main.py` 예외 처리 확인
- **프론트 빌드 오류**: `vite.config.js` 및 import 경로 확인
- **이미지 생성 실패**: 폰트 경로(`config.py`) → Pillow 버전 확인

## 테스트 시나리오

**정상 흐름:**
"본문 페이지에 페이지 번호를 좌측 하단으로 옮겨줘"
→ backend-dev(create_body_image 수정) → CLI 검증 → 이미지 확인

**에러 흐름:**
"이미지 업로드하면 500 에러 남"
→ main.py 로그 확인 → generate.py 예외 추적 → 수정 → API 재테스트
