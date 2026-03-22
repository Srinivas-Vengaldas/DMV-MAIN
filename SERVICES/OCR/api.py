"""
Lease extraction REST API for Render / frontend.
Run: uvicorn api:app --host 0.0.0.0 --port 8000

Endpoints:
  GET  /health     - readiness (model loaded)
  POST /extract    - body: multipart form with "file" (image) and optional "page" (p1|p11)
"""

import sys
from pathlib import Path

# Run from lease_extraction directory
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Lease Extraction API", version="1.0.0")

# Allow frontend to call from another origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model loaded once at startup (kept in memory for speed)
_ocr_ready = False


def _ensure_model():
    global _ocr_ready
    if _ocr_ready:
        return
    from models.ocr_backends import _get_paddle_ocr
    import os
    os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")
    _get_paddle_ocr(use_gpu=False)  # Render usually has no GPU
    _ocr_ready = True


@app.on_event("startup")
def startup():
    """Load OCR model once at startup so first request is fast."""
    try:
        _ensure_model()
    except Exception as e:
        print(f"Startup: model load deferred ({e}). Will load on first /extract.")


@app.get("/health")
def health():
    """Readiness: 200 when model is loaded and ready for inference."""
    try:
        _ensure_model()
        return {"status": "ok", "model": "paddle"}
    except Exception as e:
        raise HTTPException(503, detail=str(e))


@app.post("/extract")
async def extract(
    file: UploadFile = File(...),
    page: str = Form("p1"),
    max_side: int = Form(1600),
):
    """
    Extract lease fields from an image.
    - file: image file (JPEG/PNG)
    - page: "p1" or "p11"
    - max_side: resize longest side to this for speed (default 1600, 0 = no resize)
    """
    if page not in ("p1", "p11"):
        raise HTTPException(400, "page must be p1 or p11")
    try:
        _ensure_model()
    except Exception as e:
        raise HTTPException(503, f"Model not ready: {e}")

    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(400, "Invalid or unsupported image")

    # Quality gatekeeper: resolution + blur before OCR
    from utils_quality import run_quality_check_on_image

    qc_conf = {
        "min_width": 1200,      # or 1800
        "min_height": 1600,     # or 2200
        "min_blur_score": 500.0 # or 400.0 to be stricter
    }
    qc_result = run_quality_check_on_image(img, qc_conf)
    if not qc_result.get("pass", False):
        # 422: Unprocessable Entity (image is valid but quality too low)
        raise HTTPException(status_code=422, detail={"reason": qc_result["reason"], "checks": qc_result["checks"]})

    try:
        from models.extractor_v2 import extract_from_image
        out = extract_from_image(
            img,
            page,
            backend="paddle",
            max_side=max_side if max_side > 0 else None,
        )
        return out
    except Exception as e:
        raise HTTPException(500, str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
