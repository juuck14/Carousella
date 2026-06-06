"""
generate.py — 이미지 생성 코어
GUI(FastAPI)와 CLI 양쪽에서 호출됩니다.
"""

import os
import re
import sys
from datetime import date
from PIL import Image, ImageDraw, ImageFont, ImageFilter

from config import (
    FONT_PATH_REGULAR, FONT_PATH_BOLD,
    CANVAS_SIZE, DPI, MARGIN,
    BG_COLOR, TEXT_COLOR, PAGE_NUM_COLOR, RULE_COLOR,
    COVER_BG_COLOR, COVER_TEXT_COLOR, COVER_LABEL_COLOR,
    COVER_SPLIT_RATIO, COVER_TITLE_SIZE, COVER_LABEL_SIZE,
    BODY_FONT_SIZE, LINE_SPACING, PARA_SPACING, LETTER_SPACING, PAGE_NUM_SIZE,
    PROJECT_ROOT, IMAGES_DIR,
)

PAGE_BREAK = "---"   # 본문 내 강제 페이지 분리 마커


# =============================================================================
#  폰트
# =============================================================================

def load_fonts():
    for label, path in [("REGULAR", FONT_PATH_REGULAR), ("BOLD", FONT_PATH_BOLD)]:
        if not os.path.exists(path):
            raise FileNotFoundError(
                f"폰트 파일 없음: {path}\n"
                f"backend/config.py 의 FONT_PATH_{label} 를 수정하세요."
            )
    return {
        "cover_title": ImageFont.truetype(FONT_PATH_BOLD,    COVER_TITLE_SIZE),
        "cover_label": ImageFont.truetype(FONT_PATH_REGULAR, COVER_LABEL_SIZE),
        "body":        ImageFont.truetype(FONT_PATH_REGULAR, BODY_FONT_SIZE),
        "page_num":    ImageFont.truetype(FONT_PATH_REGULAR, PAGE_NUM_SIZE),
    }


# =============================================================================
#  텍스트 유틸
# =============================================================================

def measure_text_width(text, font, draw, letter_spacing=0):
    if not text:
        return 0
    bbox = draw.textbbox((0, 0), text, font=font)
    return (bbox[2] - bbox[0]) + letter_spacing * max(0, len(text) - 1)


def wrap_paragraph(para_text, font, draw, max_width, letter_spacing=0):
    """단락 하나를 줄바꿈 처리 → 줄 리스트 반환."""
    result = []
    for sub in para_text.split('\n'):
        words = sub.split()
        if not words:
            continue
        current = ""
        for word in words:
            candidate = (current + " " + word).lstrip() if current else word
            if measure_text_width(candidate, font, draw, letter_spacing) <= max_width:
                current = candidate
            else:
                if current:
                    result.append(current)
                if measure_text_width(word, font, draw, letter_spacing) > max_width:
                    buf = ""
                    for ch in word:
                        test = buf + ch
                        if measure_text_width(test, font, draw, letter_spacing) <= max_width:
                            buf = test
                        else:
                            result.append(buf)
                            buf = ch
                    current = buf
                else:
                    current = word
        if current:
            result.append(current)
    return result


def draw_text_with_letter_spacing(draw, pos, text, font, fill, letter_spacing=0):
    if letter_spacing == 0:
        draw.text(pos, text, font=font, fill=fill)
        return
    x, y = pos
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        bbox = draw.textbbox((0, 0), ch, font=font)
        x += (bbox[2] - bbox[0]) + letter_spacing


# =============================================================================
#  페이지 분할
# =============================================================================

def split_paragraphs_into_pages(paragraphs, font, draw, max_width,
                                 font_size, line_spacing, para_spacing, available_height):
    """
    단락 리스트 → 페이지별 [(text, _), ...] 리스트.
    - 단락이 중간에 잘리지 않도록 단락 단위 배치
    - PAGE_BREAK('---') 단락은 강제 페이지 분리
    - 한 단락이 페이지 전체보다 클 경우에만 줄 단위 분할
    """
    line_h     = font_size * line_spacing
    para_gap_h = font_size * para_spacing

    pages              = []
    current_page_lines = []
    current_height     = 0.0

    for para in paragraphs:
        # 강제 페이지 분리
        if para.strip() == PAGE_BREAK:
            if current_page_lines:
                pages.append(current_page_lines)
                current_page_lines = []
                current_height     = 0.0
            continue

        lines = wrap_paragraph(para, font, draw, max_width, LETTER_SPACING)
        if not lines:
            continue

        gap    = para_gap_h if current_page_lines else 0
        para_h = len(lines) * line_h + gap

        # 현재 페이지에 안 들어가면 새 페이지
        if current_page_lines and current_height + para_h > available_height:
            pages.append(current_page_lines)
            current_page_lines = []
            current_height     = 0.0
            para_h             = len(lines) * line_h

        # 단락 자체가 한 페이지 초과 → 줄 단위 강제 분할
        if not current_page_lines and para_h > available_height:
            for i, line in enumerate(lines):
                if current_height + line_h > available_height and current_page_lines:
                    pages.append(current_page_lines)
                    current_page_lines = []
                    current_height     = 0.0
                current_page_lines.append((line, i == 0))
                current_height += line_h
            continue

        # 단락을 현재 페이지에 추가
        for i, line in enumerate(lines):
            if current_page_lines and i == 0:
                current_page_lines.append(("", True))  # 단락 간격 마커
                current_height += para_gap_h
            current_page_lines.append((line, i == 0))
            current_height += line_h

    if current_page_lines:
        pages.append(current_page_lines)

    return pages


# =============================================================================
#  파싱
# =============================================================================

def parse_body_text(body_text: str) -> list:
    """
    본문 텍스트 → 단락 리스트.
    - 빈 줄(\n\n)로 단락 구분
    - '---' 단독 블록은 강제 페이지 분리 마커로 보존
    """
    body = re.sub(r'\n{2,}', '\n\n', body_text.strip())
    return [b.strip() for b in body.split('\n\n') if b.strip()]


def parse_md(filepath: str):
    """
    CLI용 .md 파일 파싱.
    반환: (title, subtitle, image_filename, paragraphs)
    """
    with open(filepath, "r", encoding="utf-8") as f:
        raw = f.read()

    lines     = raw.splitlines()
    non_empty = [l for l in lines if l.strip()]

    if len(non_empty) < 3:
        raise ValueError(".md 파일은 최소 3줄 필요: # 제목 / 이미지파일명 / 본문")

    title = non_empty[0].lstrip("#").strip()

    if non_empty[1].startswith("##"):
        subtitle       = non_empty[1].lstrip("#").strip()
        image_filename = non_empty[2].strip()
        body_anchor    = non_empty[3] if len(non_empty) > 3 else ""
    else:
        subtitle       = ""
        image_filename = non_empty[1].strip()
        body_anchor    = non_empty[2]

    body_start = raw.index(body_anchor)
    paragraphs = parse_body_text(raw[body_start:])

    return title, subtitle, image_filename, paragraphs


# =============================================================================
#  이미지 렌더링
# =============================================================================

def load_cover_image(image_path, target_w: int, target_h: int):
    """cover-fit으로 이미지 로드. 경로 없으면 None."""
    if not image_path or not os.path.exists(image_path):
        return None
    img          = Image.open(image_path).convert("RGB")
    src_w, src_h = img.size
    scale        = max(target_w / src_w, target_h / src_h)
    sw, sh       = int(src_w * scale), int(src_h * scale)
    img          = img.resize((sw, sh), Image.LANCZOS)
    left         = (sw - target_w) // 2
    top          = (sh - target_h) // 2
    return img.crop((left, top, left + target_w, top + target_h))


def create_cover_image(title: str, subtitle: str, image_path, fonts: dict) -> Image.Image:
    canvas  = Image.new("RGB", (CANVAS_SIZE, CANVAS_SIZE), COVER_BG_COLOR)
    split_y = int(CANVAS_SIZE * COVER_SPLIT_RATIO)

    # 하단 이미지 영역
    img_area_h = CANVAS_SIZE - split_y
    cover_img  = load_cover_image(image_path, CANVAS_SIZE, img_area_h)
    if cover_img:
        canvas.paste(cover_img.filter(ImageFilter.GaussianBlur(radius=0.8)), (0, split_y))
    else:
        canvas.paste(Image.new("RGB", (CANVAS_SIZE, img_area_h), "#1A1A1A"), (0, split_y))

    draw = ImageDraw.Draw(canvas)
    draw.line([(0, split_y), (CANVAS_SIZE, split_y)], fill="#333330", width=1)

    # 레이블
    label   = "— 평론 —"
    label_y = MARGIN
    draw.text((MARGIN, label_y), label, font=fonts["cover_label"], fill=COVER_LABEL_COLOR)
    lbl_h  = draw.textbbox((0, 0), label, font=fonts["cover_label"])[3]
    rule_y = label_y + lbl_h + 16
    draw.line([(MARGIN, rule_y), (CANVAS_SIZE - MARGIN, rule_y)], fill="#3A3A38", width=1)

    # 제목 + 부제목
    tmp = ImageDraw.Draw(Image.new("RGB", (CANVAS_SIZE, CANVAS_SIZE)))
    tw  = CANVAS_SIZE - MARGIN * 2

    title_lines   = wrap_paragraph(title, fonts["cover_title"], tmp, tw)
    title_line_h  = int(COVER_TITLE_SIZE * 1.28)
    title_block_h = len(title_lines) * title_line_h

    sub_lines   = wrap_paragraph(subtitle, fonts["cover_label"], tmp, tw) if subtitle else []
    sub_line_h  = int(COVER_LABEL_SIZE * 1.5)
    sub_block_h = len(sub_lines) * sub_line_h + COVER_LABEL_SIZE if sub_lines else 0

    ty = (rule_y + split_y) // 2 - (title_block_h + sub_block_h) // 2
    for line in title_lines:
        draw.text((MARGIN, ty), line, font=fonts["cover_title"], fill=COVER_TEXT_COLOR)
        ty += title_line_h
    if sub_lines:
        ty += COVER_LABEL_SIZE
        for line in sub_lines:
            draw.text((MARGIN, ty), line, font=fonts["cover_label"], fill=COVER_LABEL_COLOR)
            ty += sub_line_h

    # 날짜
    today = date.today().strftime("%Y.%m.%d")
    tb    = draw.textbbox((0, 0), today, font=fonts["cover_label"])
    draw.text(
        (CANVAS_SIZE - MARGIN - (tb[2] - tb[0]), split_y - MARGIN // 2 - (tb[3] - tb[1]) // 2),
        today, font=fonts["cover_label"], fill=COVER_LABEL_COLOR,
    )
    return canvas


def create_body_image(page_entries: list, page_num: int, fonts: dict) -> Image.Image:
    img  = Image.new("RGB", (CANVAS_SIZE, CANVAS_SIZE), BG_COLOR)
    draw = ImageDraw.Draw(img)

    line_h     = BODY_FONT_SIZE * LINE_SPACING
    para_gap_h = BODY_FONT_SIZE * PARA_SPACING

    draw.line([(MARGIN, MARGIN - 28), (CANVAS_SIZE - MARGIN, MARGIN - 28)],
              fill=RULE_COLOR, width=1)

    y = float(MARGIN)
    for text, _ in page_entries:
        if text.strip():
            draw_text_with_letter_spacing(
                draw, (MARGIN, int(y)), text,
                font=fonts["body"], fill=TEXT_COLOR, letter_spacing=LETTER_SPACING,
            )
            y += line_h
        else:
            y += para_gap_h

    label   = f"— {page_num} —"
    pn_bbox = draw.textbbox((0, 0), label, font=fonts["page_num"])
    pn_y    = CANVAS_SIZE - MARGIN + 8
    draw.text(((CANVAS_SIZE - (pn_bbox[2] - pn_bbox[0])) // 2, pn_y),
              label, font=fonts["page_num"], fill=PAGE_NUM_COLOR)
    draw.line([(MARGIN, pn_y - 14), (CANVAS_SIZE - MARGIN, pn_y - 14)],
              fill=RULE_COLOR, width=1)

    return img


# =============================================================================
#  공개 API
# =============================================================================

def generate_images(
    title: str,
    subtitle: str,
    image_path,        # 표지 이미지 전체 경로 or None
    body_text: str,
    output_dir: str,
) -> list:
    """이미지 생성 후 저장된 절대 경로 리스트 반환."""
    fonts      = load_fonts()
    paragraphs = parse_body_text(body_text)

    tmp_draw         = ImageDraw.Draw(Image.new("RGB", (CANVAS_SIZE, CANVAS_SIZE)))
    text_area_width  = CANVAS_SIZE - MARGIN * 2
    text_area_height = CANVAS_SIZE - MARGIN * 2 - 60

    pages = split_paragraphs_into_pages(
        paragraphs, fonts["body"], tmp_draw, text_area_width,
        BODY_FONT_SIZE, LINE_SPACING, PARA_SPACING, text_area_height,
    )

    saved = []

    cover_path = os.path.join(output_dir, "page_01.png")
    create_cover_image(title, subtitle, image_path, fonts).save(
        cover_path, "PNG", dpi=(DPI, DPI)
    )
    saved.append(cover_path)

    for i, page_entries in enumerate(pages):
        path = os.path.join(output_dir, f"page_{i + 2:02d}.png")
        create_body_image(page_entries, i + 2, fonts).save(path, "PNG", dpi=(DPI, DPI))
        saved.append(path)

    return saved


# =============================================================================
#  CLI
# =============================================================================

if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

    if len(sys.argv) < 2:
        print("사용법: python backend/generate.py inputs/review.md")
        sys.exit(1)

    md_path = sys.argv[1]
    title, subtitle, image_filename, paragraphs = parse_md(md_path)
    image_path = os.path.join(IMAGES_DIR, image_filename) if image_filename else None

    out_dir = os.path.join(PROJECT_ROOT, date.today().strftime("%Y-%m-%d"))
    os.makedirs(out_dir, exist_ok=True)

    for p in generate_images(title, subtitle, image_path, "\n\n".join(paragraphs), out_dir):
        print(f"저장: {p}")
    print(f"\n완료! → {out_dir}/")
