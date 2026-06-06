"""
generate.py — 이미지 생성 코어 (GUI 전용)
"""

import os
import re
from datetime import date
from PIL import Image, ImageDraw, ImageFont, ImageFilter

from config import (
    FONT_PATH_REGULAR, FONT_PATH_BOLD,
    CANVAS_SIZE, DPI,
    MARGIN, BG_COLOR, TEXT_COLOR, PAGE_NUM_COLOR, RULE_COLOR,
    COVER_BG_COLOR, COVER_TEXT_COLOR, COVER_LABEL_COLOR,
    COVER_SPLIT_RATIO, COVER_TITLE_SIZE, COVER_LABEL_SIZE,
    BODY_FONT_SIZE, LINE_SPACING, PARA_SPACING, LETTER_SPACING, PAGE_NUM_SIZE,
)

PAGE_BREAK = "---"   # 강제 페이지 분리 마커


# =============================================================================
#  기본 설정값 (config.py 기반)
# =============================================================================

DEFAULT_CFG = {
    "body_font_size":   BODY_FONT_SIZE,
    "line_spacing":     LINE_SPACING,
    "para_spacing":     PARA_SPACING,
    "letter_spacing":   LETTER_SPACING,
    "margin":           MARGIN,
    "cover_split_ratio": COVER_SPLIT_RATIO,
    "cover_title_size": COVER_TITLE_SIZE,
    "cover_label_size": COVER_LABEL_SIZE,
    "bg_color":         BG_COLOR,
    "text_color":       TEXT_COLOR,
    "page_num_color":   PAGE_NUM_COLOR,
    "rule_color":       RULE_COLOR,
    "cover_bg_color":   COVER_BG_COLOR,
    "cover_text_color": COVER_TEXT_COLOR,
    "cover_label_color": COVER_LABEL_COLOR,
    "page_num_size":    PAGE_NUM_SIZE,
}


def make_cfg(overrides: dict | None) -> dict:
    """기본 설정에 사용자 override를 병합한 cfg 딕셔너리 반환."""
    cfg = DEFAULT_CFG.copy()
    if overrides:
        for k, v in overrides.items():
            if k in cfg:
                cfg[k] = type(cfg[k])(v)   # 타입 보존 (int/float/str)
    return cfg


# =============================================================================
#  폰트
# =============================================================================

def load_fonts(cfg: dict) -> dict:
    for label, path in [("REGULAR", FONT_PATH_REGULAR), ("BOLD", FONT_PATH_BOLD)]:
        if not os.path.exists(path):
            raise FileNotFoundError(
                f"폰트 파일 없음: {path}\n"
                f"backend/config.py 의 FONT_PATH_{label} 를 수정하세요."
            )
    return {
        "cover_title": ImageFont.truetype(FONT_PATH_BOLD,    int(cfg["cover_title_size"])),
        "cover_label": ImageFont.truetype(FONT_PATH_REGULAR, int(cfg["cover_label_size"])),
        "body":        ImageFont.truetype(FONT_PATH_REGULAR, int(cfg["body_font_size"])),
        "page_num":    ImageFont.truetype(FONT_PATH_REGULAR, int(cfg["page_num_size"])),
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

def split_paragraphs_into_pages(paragraphs, font, draw, max_width, cfg, available_height):
    """
    단락 리스트 → 페이지별 [(text, marker), ...] 리스트.
    - 단락이 중간에 잘리지 않도록 단락 단위 배치
    - PAGE_BREAK('---') 단락은 강제 페이지 분리
    """
    line_h     = cfg["body_font_size"] * cfg["line_spacing"]
    para_gap_h = cfg["body_font_size"] * cfg["para_spacing"]
    ls         = cfg["letter_spacing"]

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

        lines = wrap_paragraph(para, font, draw, max_width, ls)
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
                current_page_lines.append(("", True))   # 단락 간격 마커
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
    - '---' 단독 행은 강제 페이지 분리 마커로 보존 (앞뒤 빈줄 없어도 인식)
    """
    body = re.sub(r'\n{2,}', '\n\n', body_text.strip())
    paragraphs = []
    for block in body.split('\n\n'):
        block = block.strip()
        if not block:
            continue
        # 블록 내에서 --- 단독 행을 기준으로 추가 분리
        parts = re.split(r'(?:^|\n)---(?:\n|$)', block)
        for i, part in enumerate(parts):
            part = part.strip()
            if part:
                paragraphs.append(part)
            # 두 part 사이엔 PAGE_BREAK 삽입
            if i < len(parts) - 1:
                paragraphs.append(PAGE_BREAK)
    return paragraphs


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


def create_cover_image(title: str, subtitle: str, image_path, fonts: dict, cfg: dict) -> Image.Image:
    margin   = int(cfg["margin"])
    split_y  = int(CANVAS_SIZE * cfg["cover_split_ratio"])
    canvas   = Image.new("RGB", (CANVAS_SIZE, CANVAS_SIZE), cfg["cover_bg_color"])

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
    label_y = margin
    draw.text((margin, label_y), label, font=fonts["cover_label"], fill=cfg["cover_label_color"])
    lbl_h  = draw.textbbox((0, 0), label, font=fonts["cover_label"])[3]
    rule_y = label_y + lbl_h + 16
    draw.line([(margin, rule_y), (CANVAS_SIZE - margin, rule_y)], fill="#3A3A38", width=1)

    # 제목 + 부제목
    tmp = ImageDraw.Draw(Image.new("RGB", (CANVAS_SIZE, CANVAS_SIZE)))
    tw  = CANVAS_SIZE - margin * 2

    title_lines   = wrap_paragraph(title, fonts["cover_title"], tmp, tw)
    title_line_h  = int(cfg["cover_title_size"] * 1.28)
    title_block_h = len(title_lines) * title_line_h

    sub_lines   = wrap_paragraph(subtitle, fonts["cover_label"], tmp, tw) if subtitle else []
    sub_line_h  = int(cfg["cover_label_size"] * 1.5)
    sub_block_h = len(sub_lines) * sub_line_h + cfg["cover_label_size"] if sub_lines else 0

    ty = (rule_y + split_y) // 2 - (title_block_h + sub_block_h) // 2
    for line in title_lines:
        draw.text((margin, ty), line, font=fonts["cover_title"], fill=cfg["cover_text_color"])
        ty += title_line_h
    if sub_lines:
        ty += cfg["cover_label_size"]
        for line in sub_lines:
            draw.text((margin, ty), line, font=fonts["cover_label"], fill=cfg["cover_label_color"])
            ty += sub_line_h

    # 날짜
    today = date.today().strftime("%Y.%m.%d")
    tb    = draw.textbbox((0, 0), today, font=fonts["cover_label"])
    draw.text(
        (CANVAS_SIZE - margin - (tb[2] - tb[0]), split_y - margin // 2 - (tb[3] - tb[1]) // 2),
        today, font=fonts["cover_label"], fill=cfg["cover_label_color"],
    )
    return canvas


def create_body_image(page_entries: list, page_num: int, fonts: dict, cfg: dict) -> Image.Image:
    margin     = int(cfg["margin"])
    line_h     = cfg["body_font_size"] * cfg["line_spacing"]
    para_gap_h = cfg["body_font_size"] * cfg["para_spacing"]
    ls         = cfg["letter_spacing"]

    img  = Image.new("RGB", (CANVAS_SIZE, CANVAS_SIZE), cfg["bg_color"])
    draw = ImageDraw.Draw(img)

    draw.line([(margin, margin - 28), (CANVAS_SIZE - margin, margin - 28)],
              fill=cfg["rule_color"], width=1)

    y = float(margin)
    for text, _ in page_entries:
        if text.strip():
            draw_text_with_letter_spacing(
                draw, (margin, int(y)), text,
                font=fonts["body"], fill=cfg["text_color"], letter_spacing=ls,
            )
            y += line_h
        else:
            y += para_gap_h

    label   = f"— {page_num} —"
    pn_bbox = draw.textbbox((0, 0), label, font=fonts["page_num"])
    pn_y    = CANVAS_SIZE - margin + 8
    draw.text(((CANVAS_SIZE - (pn_bbox[2] - pn_bbox[0])) // 2, pn_y),
              label, font=fonts["page_num"], fill=cfg["page_num_color"])
    draw.line([(margin, pn_y - 14), (CANVAS_SIZE - margin, pn_y - 14)],
              fill=cfg["rule_color"], width=1)

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
    settings: dict | None = None,
) -> list:
    """이미지 생성 후 저장된 절대 경로 리스트 반환."""
    cfg        = make_cfg(settings)
    fonts      = load_fonts(cfg)
    paragraphs = parse_body_text(body_text)

    margin           = int(cfg["margin"])
    tmp_draw         = ImageDraw.Draw(Image.new("RGB", (CANVAS_SIZE, CANVAS_SIZE)))
    text_area_width  = CANVAS_SIZE - margin * 2
    text_area_height = CANVAS_SIZE - margin * 2 - 60

    pages = split_paragraphs_into_pages(
        paragraphs, fonts["body"], tmp_draw, text_area_width, cfg, text_area_height,
    )

    saved = []

    cover_path = os.path.join(output_dir, "page_01.png")
    create_cover_image(title, subtitle, image_path, fonts, cfg).save(
        cover_path, "PNG", dpi=(DPI, DPI)
    )
    saved.append(cover_path)

    for i, page_entries in enumerate(pages):
        path = os.path.join(output_dir, f"page_{i + 2:02d}.png")
        create_body_image(page_entries, i + 2, fonts, cfg).save(path, "PNG", dpi=(DPI, DPI))
        saved.append(path)

    return saved
