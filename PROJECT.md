# Instagram Carousel Generator

## 프로젝트 개요

`.md` 파일 또는 GUI 입력을 통해 인스타그램용 1080×1080 이미지 시리즈를 자동 생성하는 웹 앱.

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | React + Vite |
| 백엔드 | Python + FastAPI |
| 이미지 생성 | Pillow |
| 로컬 실행 | 단일 커맨드 (`npm run dev` 하나로 프론트+백 동시 실행) |
| 프로덕션 | Python이 React 빌드 정적 파일 서빙 → `python backend/main.py` 하나만 실행 |
| 정적 호스팅 | 프론트: Netlify/Vercel, 백: Render/Railway (분리 배포 가능한 구조 유지) |

> DB 없음. 파일 기반 정적 소스만 사용.

---

## 폴더 구조 (목표)

```
carousel/
├── frontend/                ← React 앱 (Vite)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── InputPanel.jsx   ← 왼쪽: 제목/부제목/이미지/본문 입력
│   │   │   ├── PreviewPanel.jsx ← 오른쪽: 생성된 이미지 그리드
│   │   │   └── ImageModal.jsx   ← 클릭 시 자세히 보기
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
├── backend/                 ← Python FastAPI
│   ├── main.py              ← API 서버 진입점 + React 빌드 서빙
│   ├── generate.py          ← 이미지 생성 로직 (기존 src/generate.py)
│   └── config.py            ← 디자인 설정 (기존 src/config.py)
│
├── images/                  ← 표지 이미지 보관
├── inputs/                  ← CLI용 .md 파일 (선택)
├── outputs/                 ← 생성된 이미지 저장
└── PROJECT.md
```

---

## 실행 방식

### 개발 환경 (단일 커맨드)
```bash
npm run dev   # frontend/package.json의 concurrently로 프론트+백 동시 실행
```
- React dev server: `http://localhost:5173`
- FastAPI: `http://localhost:8000`
- Vite가 `/api/*` 요청을 FastAPI로 프록시

### 프로덕션 (단일 커맨드)
```bash
npm run build          # React → frontend/dist/ 빌드
python backend/main.py # FastAPI가 dist/ 정적 파일 + API 동시 서빙
```
- 브라우저: `http://localhost:8000` (하나만 실행)

### 정적 호스팅 (배포 시)
- 프론트: `frontend/dist/` → Netlify / Vercel
- 백: `backend/` → Render / Railway
- 환경변수 `VITE_API_URL`로 백엔드 주소 분리

---

## MD 파일 포맷

```markdown
# 제목                        ← 필수
## 부제목                     ← 선택 (없으면 생략)
이미지파일명.jpg               ← 필수 (images/ 폴더 내)
본문 단락...

---                           ← 강제 페이지 분리 (이 위치에서 무조건 새 페이지)

계속되는 본문...
```

---

## API 설계

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/generate` | 이미지 생성 요청. multipart/form-data (제목, 부제목, 이미지 파일, 본문 텍스트) |
| `GET`  | `/api/outputs/{filename}` | 생성된 이미지 파일 서빙 |

---

## GUI 기능 명세

### 왼쪽 입력 패널
- 제목 (text input)
- 부제목 (text input, 선택)
- 표지 이미지 (file input, jpg/png)
- 본문 텍스트 (textarea)
  - `---` 입력 시 해당 위치에서 강제 페이지 분리
- [미리보기 생성] 버튼

### 오른쪽 미리보기 패널
- 생성된 이미지들을 순서대로 썸네일 그리드로 표시
- 이미지 클릭 → 모달로 원본 크기 확인
- [전체 다운로드] 버튼 (zip)

---

## 구현 순서

1. **백엔드**: FastAPI 설정 + `/api/generate` 엔드포인트
2. **프론트엔드**: React 프로젝트 생성 + 기본 레이아웃
3. **연결**: Vite 프록시 설정 + API 연동
4. **기능**: 강제 페이지 분리 (`---`) 처리
5. **배포 구조**: 단일 실행 스크립트 + 정적 호스팅 분리 옵션
