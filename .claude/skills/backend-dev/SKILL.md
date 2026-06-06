---
name: backend-dev
description: >
  캐러셀 생성기의 백엔드(Python) 작업을 수행한다. generate.py 이미지 생성 로직 수정,
  config.py 파라미터 조정, FastAPI main.py 엔드포인트 변경, --- 페이지 분리 처리,
  텍스트 래핑/페이지 분할 알고리즘 수정, Pillow 렌더링 버그 수정 등을 담당.
  "generate.py 고쳐줘", "페이지 분할 로직", "API 엔드포인트", "이미지 생성 안 됨",
  "백엔드 수정" 등의 요청 시 이 스킬을 사용하라.
---

## 프로젝트 구조

```
backend/
├── config.py      ← 디자인 파라미터 (폰트, 색상, 여백)
├── generate.py    ← 이미지 생성 코어
│   ├── parse_body_text()       — 텍스트 → 단락 리스트
│   ├── split_paragraphs_into_pages()  — 페이지 분할 (--- 처리 포함)
│   ├── create_cover_image()    — 표지 생성
│   ├── create_body_image()     — 본문 페이지 생성
│   └── generate_images()       — 공개 API (GUI + CLI 공용)
└── main.py        ← FastAPI: POST /api/generate, GET /api/outputs/
```

## 핵심 데이터 흐름

```
body_text (str)
  → parse_body_text()         # \n\n으로 단락 분리, --- 보존
  → split_paragraphs_into_pages()  # 단락 단위 페이지 배치, --- = 강제 분리
  → [page_entries]            # [(text, is_marker), ...]
  → create_body_image()       # Pillow 렌더링
  → PNG 파일 저장
```

## 자주 수정하는 지점

### 페이지 분할 로직
`split_paragraphs_into_pages()` — 단락이 잘리지 않도록 단락 단위 배치.
`PAGE_BREAK = "---"` 마커를 만나면 강제로 새 페이지를 시작한다.

**주의**: 높이 계산과 렌더링의 간격값이 반드시 일치해야 한다.
- 계산: `para_gap_h = BODY_FONT_SIZE * PARA_SPACING`
- 렌더링(`create_body_image`): 빈 항목(`text == ""`)은 `para_gap_h`만큼 전진, 일반 줄은 `line_h`

### API 응답 구조
`POST /api/generate` 반환값:
```json
{ "session_id": "abc123", "pages": ["/api/outputs/abc123/page_01.png", ...] }
```
이 구조를 바꾸면 `frontend/src/App.jsx`의 `data.pages` 파싱도 함께 수정해야 한다.

### 이미지 cover-fit
`load_cover_image(path, target_w, target_h)` — scale = max(w_ratio, h_ratio) 방식.
이미지가 잘리거나 늘어나면 이 함수를 확인한다.

## 실행 및 테스트

```bash
# CLI 테스트
python backend/generate.py inputs/velocity.md

# 서버 실행
python -m uvicorn backend.main:app --reload --port 8000
```

수정 후 반드시 CLI로 실제 PNG 생성 결과를 확인한다.
생성된 PNG는 `Read` 도구로 직접 열어 시각적으로 검증한다.

## 의존성

```
Pillow      — 이미지 생성
FastAPI     — API 서버
uvicorn     — ASGI 서버
python-multipart — 파일 업로드 파싱
```
