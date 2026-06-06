"""
main.py — FastAPI 서버
- 개발: uvicorn backend.main:app --reload --port 8000
- 프로덕션: npm run build 후 이 파일만 실행하면 React 빌드도 서빙
"""

import os
import sys
import uuid
import shutil

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

# backend/ 폴더를 sys.path에 추가해 generate, config를 직접 import
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from generate import generate_images  # noqa: E402

# =============================================================================
#  경로 설정
# =============================================================================

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUTS_DIR  = os.path.join(PROJECT_ROOT, "outputs")
DIST_DIR     = os.path.join(PROJECT_ROOT, "dist")   # React 프로덕션 빌드

os.makedirs(OUTPUTS_DIR, exist_ok=True)

# =============================================================================
#  앱 초기화
# =============================================================================

app = FastAPI(title="Carousel Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
#  API 라우트
# =============================================================================

@app.post("/api/generate")
async def api_generate(
    title:    str        = Form(...),
    subtitle: str        = Form(""),
    body:     str        = Form(...),
    image:    UploadFile = File(None),
):
    """
    이미지 생성 엔드포인트.
    반환: { session_id, pages: ["/api/outputs/{id}/page_01.png", ...] }
    """
    session_id = uuid.uuid4().hex
    output_dir = os.path.join(OUTPUTS_DIR, session_id)
    os.makedirs(output_dir)

    # 업로드된 표지 이미지 저장
    image_path = None
    if image and image.filename:
        ext        = os.path.splitext(image.filename)[1] or ".jpg"
        image_path = os.path.join(output_dir, f"cover{ext}")
        with open(image_path, "wb") as f:
            shutil.copyfileobj(image.file, f)

    try:
        saved = generate_images(
            title      = title.strip(),
            subtitle   = subtitle.strip(),
            image_path = image_path,
            body_text  = body,
            output_dir = output_dir,
        )
    except Exception as e:
        shutil.rmtree(output_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))

    # 클라이언트가 접근할 URL 경로로 변환
    pages = [
        f"/api/outputs/{session_id}/{os.path.basename(p)}"
        for p in saved
    ]
    return JSONResponse({"session_id": session_id, "pages": pages})


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# =============================================================================
#  정적 파일 서빙
# =============================================================================

# 생성된 이미지 서빙
app.mount("/api/outputs", StaticFiles(directory=OUTPUTS_DIR), name="outputs")

# 프로덕션: React dist/ 서빙 (개발 시에는 Vite dev server가 담당)
if os.path.exists(DIST_DIR):
    app.mount("/", StaticFiles(directory=DIST_DIR, html=True), name="frontend")


# =============================================================================
#  실행
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
