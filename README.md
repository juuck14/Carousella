# 평론 캐러셀

인스타그램 캐러셀 이미지(1080×1080 PNG)를 브라우저에서 바로 만드는 웹 앱.  
텍스트를 입력하면 실시간으로 미리보기가 생성되고, PNG 또는 ZIP으로 내보낼 수 있다.

**라이브**: https://juuck14.github.io/instagram-carousel-generator/

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| **실시간 미리보기** | 타이핑하는 즉시 페이지 분할 및 렌더링 갱신 |
| **자동 페이지 분할** | 텍스트 높이를 DOM으로 측정해 1080px 기준 자동 분할 |
| **강제 페이지 분리** | 본문에 `---` 입력 시 해당 위치에서 페이지 강제 분리 |
| **표지 이미지** | 드래그 앤 드롭 또는 클릭으로 업로드, cover-fit 적용 |
| **PNG 내보내기** | 현재 페이지 단건 / 전체 ZIP 일괄 다운로드 |
| **디자인 설정** | 폰트 크기·줄간격·여백·표지 비율 등 슬라이더로 실시간 조정 |
| **설정 자동 저장** | 조정한 설정을 브라우저 로컬스토리지에 저장 |
| **키보드 내비** | ← → 키로 페이지 이동 |

---

## 디자인 — 무드 A: 활자

| 요소 | 스펙 |
|------|------|
| 표지 배경 | `#141210` (딥 블랙) |
| 본문 배경 | `#F4F3EF` (따뜻한 아이보리) |
| 표지 제목 폰트 | Nanum Myeongjo 700 (Display) |
| 본문 폰트 | Noto Serif KR 400 |
| 강조 색상 | `#A8643F` (Clay / 테라코타) |
| 기본 본문 크기 | 30px |
| 기본 표지 제목 크기 | 64px |
| 캔버스 크기 | 1080 × 1080 px |

---

## 로컬 개발

```bash
# 의존성 설치 (최초 1회)
npm install

# 개발 서버 시작
npm run dev
```

브라우저에서 http://localhost:5173 접속.

> 서버가 필요 없는 순수 브라우저 앱. 백엔드 없음.

---

## 입력 형식

**제목 / 부제목**: 사이드바 입력 필드에 직접 입력.

**본문**: 아래 규칙을 따른다.

```
첫 번째 단락 텍스트.
같은 단락 내 줄바꿈은 그대로 유지된다.

빈 줄 하나 = 단락 구분.
자동으로 1080px 기준 높이를 계산해 페이지를 나눈다.

---

위 줄(---)은 강제 페이지 분리.
아래 내용은 무조건 다음 페이지에 시작된다.
```

---

## 내보내기

- **이 페이지 PNG**: 현재 보고 있는 페이지를 1080×1080 PNG로 다운로드
- **전체 내보내기**: 모든 페이지를 `carousel.zip`으로 일괄 다운로드  
  파일명: `page_01.png`, `page_02.png`, …

내보내기는 Canvas API로 렌더링하므로 미리보기와 동일한 레이아웃·폰트가 적용된다.

---

## 프로젝트 구조

```
frontend/
├── index.html                  # Google Fonts 로드 (Noto Serif KR, Nanum Myeongjo)
├── src/
│   ├── main.jsx
│   ├── App.jsx                 # 레이아웃, 내보내기 로직, 토스트
│   ├── hooks/
│   │   ├── usePagination.js    # DOM 텍스트 측정 기반 실시간 페이지 분할
│   │   └── useSettings.js      # 설정 로컬스토리지 영속
│   ├── lib/
│   │   ├── defaultConfig.js    # 기본 설정값 + 슬라이더 필드 정의
│   │   ├── testData.js         # 샘플 텍스트 데이터
│   │   ├── generate.js         # Canvas 내보내기 진입점
│   │   ├── renderCover.js      # 표지 Canvas 렌더러
│   │   ├── renderBody.js       # 본문 Canvas 렌더러
│   │   ├── layout.js           # Canvas 기반 페이지 분할 (내보내기 전용)
│   │   ├── parseText.js        # 본문 파싱 (단락 / 페이지 브레이크)
│   │   └── canvasUtils.js      # Canvas 폰트·텍스트 유틸
│   └── components/
│       ├── CarouselPage.jsx    # React 기반 캐러셀 페이지 렌더러 (미리보기)
│       ├── PreviewPane.jsx     # 스테이지 + 화살표 + 도트 + 썸네일 레일
│       ├── InputPanel.jsx      # 입력 사이드바
│       └── SettingsPanel.jsx   # 디자인 설정 슬라이더
.github/workflows/
└── deploy.yml                  # GitHub Pages 수동 배포 (workflow_dispatch)
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| UI 프레임워크 | React 19 + Vite 6 |
| 미리보기 렌더링 | CSS / HTML (DOM, `transform: scale`) |
| PNG 내보내기 | Canvas API |
| 폰트 | Google Fonts (Noto Serif KR, Nanum Myeongjo) |
| 이미지 업로드 | react-dropzone |
| ZIP 생성 | JSZip |
| 호스팅 | GitHub Pages (정적) |

---

## 릴리즈 절차

```bash
# 1. 개발 완료 후 main에 커밋·푸시 (배포 없음)
git push origin main

# 2. 릴리즈 태그 + 릴리즈 노트 작성
gh release create v1.x.x --title "v1.x.x" --notes "변경 내용..."

# 3. GitHub Pages 배포 트리거
gh workflow run deploy.yml
```

> GitHub Pages environment 보호 규칙이 `main` 브랜치만 허용하기 때문에  
> 태그 기반 자동 배포 대신 수동 트리거(`workflow_dispatch`) 방식을 사용한다.
