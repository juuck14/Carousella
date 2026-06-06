---
name: design-tuner
description: >
  캐러셀 이미지의 디자인 파라미터를 조정한다. 폰트 크기, 줄간격, 여백, 색상, 표지 레이아웃 비율 등
  backend/config.py의 값을 변경하고 실제 생성 결과를 확인한다.
  "폰트 크게", "여백 줄여", "배경색 바꿔", "줄간격", "표지 이미지 비율", "디자인 수정",
  "색상", "config 바꿔" 등의 요청 시 이 스킬을 사용하라.
---

## config.py 파라미터 맵

```python
# 폰트
FONT_PATH_REGULAR  # 본문/레이블 폰트 경로
FONT_PATH_BOLD     # 제목 폰트 경로

# 캔버스
CANVAS_SIZE = 1080  # 변경 금지 (인스타그램 표준)
DPI = 150

# 여백
MARGIN = 120        # 사방 여백. 최소 120 권장

# 색상
BG_COLOR = "#F4F3EF"        # 본문 배경
TEXT_COLOR = "#1C1C1C"      # 본문 텍스트
PAGE_NUM_COLOR = "#B0ADA6"  # 페이지 번호
RULE_COLOR = "#D8D5CE"      # 구분선
COVER_BG_COLOR = "#111111"  # 표지 배경
COVER_TEXT_COLOR = "#F4F3EF"
COVER_LABEL_COLOR = "#888880"

# 표지 레이아웃
COVER_SPLIT_RATIO = 0.42   # 상단 텍스트 영역 비율 (0~1)
COVER_TITLE_SIZE = 48      # 표지 제목 폰트 크기
COVER_LABEL_SIZE = 20      # 레이블 크기

# 본문
BODY_FONT_SIZE = 22        # 본문 크기
LINE_SPACING = 2.05        # 줄간격 배수
PARA_SPACING = 0.6         # 단락 간격 (줄간격 배수)
LETTER_SPACING = 0         # 자간 추가 픽셀
PAGE_NUM_SIZE = 20         # 페이지 번호 크기
```

## 조정 가이드

| 요청 | 수정 파라미터 | 권장 범위 |
|------|------------|---------|
| 글자 크게/작게 | `BODY_FONT_SIZE` | 18~36 |
| 줄간격 넓게/좁게 | `LINE_SPACING` | 1.6~2.4 |
| 단락 간격 | `PARA_SPACING` | 0.4~1.2 |
| 여백 조정 | `MARGIN` | 100~180 |
| 표지 이미지 비율 | `COVER_SPLIT_RATIO` | 0.3~0.6 |
| 제목 크기 | `COVER_TITLE_SIZE` | 36~80 |
| 배경 밝기 | `BG_COLOR` | 오프화이트 계열 유지 |

## 작업 절차

1. 요청한 파라미터 수정 (한 번에 한 영역만)
2. `python backend/generate.py inputs/velocity.md` 실행
3. 생성된 `2026-*/page_01.png`, `page_02.png` 등을 `Read` 도구로 열어 시각 확인
4. 결과가 만족스럽지 않으면 값 재조정 후 반복

## 미니멀리즘 원칙

- 화려한 장식 요소 추가 금지
- 배경은 항상 단색 (그라디언트, 패턴 금지)
- 색상은 기존 팔레트(오프화이트, 차콜, 웜그레이) 안에서 조정
- 여백은 충분하게 — 120px 미만으로 줄이지 않는다
