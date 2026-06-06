# Instagram Carousel Generator

마크다운 텍스트를 인스타그램 캐러셀 이미지(1080×1080 PNG)로 자동 변환하는 웹 앱.

## 스택

- **Backend**: Python, FastAPI, Pillow
- **Frontend**: React, Vite

## 실행

의존성 설치 (최초 1회):

```bash
pip install fastapi uvicorn pillow python-multipart
npm install
```

개발 서버 시작:

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속.

## 입력 형식

```
# 제목
## 부제목 (선택)
cover_image.jpg (선택)

본문 텍스트...

두 번째 단락 (빈 줄로 구분)

---

강제 페이지 분리
```

## CLI 사용

```bash
python backend/generate.py inputs/example.md
```

결과 이미지는 `./YYYY-MM-DD/` 폴더에 저장.

## 프로젝트 구조

```
backend/
├── config.py      # 디자인 파라미터 (폰트, 색상, 여백)
├── generate.py    # 이미지 생성 코어
└── main.py        # FastAPI 서버
frontend/src/
├── App.jsx
└── components/
    ├── InputPanel.jsx   # 입력 폼
    └── PreviewPanel.jsx # 이미지 미리보기
inputs/            # 테스트용 .md 파일
```
