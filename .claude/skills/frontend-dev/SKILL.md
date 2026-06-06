---
name: frontend-dev
description: >
  캐러셀 생성기의 프론트엔드(React) 작업을 수행한다. InputPanel/PreviewPanel 컴포넌트 수정,
  CSS 모듈 스타일 변경, 라이트박스/드롭존 동작 조정, API 연동 로직, 레이아웃 변경 등을 담당.
  "UI 바꿔줘", "버튼 스타일", "미리보기 레이아웃", "프론트엔드 수정", "컴포넌트",
  "드롭존", "라이트박스" 등의 요청 시 이 스킬을 사용하라.
---

## 프로젝트 구조

```
frontend/src/
├── main.jsx
├── index.css          ← CSS 변수 정의 (:root)
├── App.jsx            ← 레이아웃 (sidebar + main)
├── App.module.css
└── components/
    ├── InputPanel.jsx       ← 입력 폼
    ├── InputPanel.module.css
    ├── PreviewPanel.jsx     ← 이미지 그리드 + 라이트박스
    └── PreviewPanel.module.css
```

## CSS 변수 (index.css :root)

| 변수 | 값 | 용도 |
|------|-----|------|
| `--bg` | #F4F3EF | 페이지 배경 |
| `--surface` | #FAFAF7 | 사이드바, 카드 |
| `--border` | #D8D5CE | 구분선, 테두리 |
| `--text` | #1C1C1C | 본문 텍스트 |
| `--muted` | #888880 | 보조 텍스트 |
| `--accent` | #1C1C1C | 버튼, 포인트 |
| `--radius` | 6px | 모서리 반경 |
| `--font` | Georgia, Batang, serif | 기본 폰트 |

색상 변경은 이 변수만 수정한다. 컴포넌트 파일에 하드코딩 금지.

## 라이브러리

- **react-dropzone** — `useDropzone` 훅, `InputPanel.jsx`에서 사용
- **yet-another-react-lightbox** — `PreviewPanel.jsx`에서 `<Lightbox>` 컴포넌트로 사용

새 라이브러리 추가 전 이 두 라이브러리로 해결 가능한지 먼저 검토한다.

## API 연동

`App.jsx`의 `handleGenerate()` 함수가 `/api/generate`에 FormData POST 요청을 보낸다.

```javascript
const fd = new FormData()
fd.append('title', title)
fd.append('subtitle', subtitle)
fd.append('body', body)
if (imgFile) fd.append('image', imgFile)
```

응답: `{ session_id, pages: ["/api/outputs/.../page_01.png", ...] }`
→ `setPages(data.pages)`로 상태 업데이트 → `PreviewPanel`에 전달

백엔드 API 스펙 변경 시 이 연동 코드도 함께 수정한다.

## 규칙

1. CSS는 CSS 모듈만 사용 (`.module.css`). 전역 클래스, 인라인 스타일 금지.
2. 상태는 `App.jsx`에서 관리하고 props로 전달. 컴포넌트 내부 상태는 UI 전용(열림/닫힘 등)만.
3. UI 변경 후 `preview_screenshot`으로 실제 화면을 반드시 확인한다.

## Vite 프록시

`vite.config.js`에서 `/api` 요청을 `http://localhost:8000`으로 프록시.
개발 시 백엔드(포트 8000)가 반드시 실행 중이어야 API 호출이 동작한다.
