"""
OCR backends: PaddleOCR (primary) and EasyOCR (fallback).
Both return unified format: list of (bbox, text, confidence).
"""

from typing import List, Tuple
import numpy as np

# bbox: list of 4 [x,y] points (same as EasyOCR)
# Returns: List[Tuple[bbox, text, confidence]]


def run_paddle_ocr(image: np.ndarray, ocr_engine=None) -> List[Tuple[List, str, float]]:
    """
    Run PaddleOCR. image: H,W,C in BGR or RGB.
    Returns list of (bbox, text, confidence). bbox: [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
    """
    if ocr_engine is None:
        ocr_engine = _get_paddle_ocr()
    # New API: predict(); old API: ocr(..., cls=False)
    if hasattr(ocr_engine, "predict"):
        result = ocr_engine.predict(image, use_textline_orientation=False)
    else:
        result = ocr_engine.ocr(image, cls=False)
    out = []
    if result is None or len(result) == 0:
        return out

    # PaddleOCR 2.x: result is list of OCRResult (dict-like: rec_polys, rec_texts, rec_scores)
    first = result[0]
    def _get(obj, key, default=None):
        if hasattr(obj, "get"):
            return obj.get(key, default)
        return getattr(obj, key, default)

    polys = _get(first, "rec_polys", _get(first, "rec_poly", None))
    if polys is not None or _get(first, "rec_texts", None) is not None:
        for page in result:
            polys = _get(page, "rec_polys", _get(page, "rec_poly", []))
            texts = _get(page, "rec_texts", [])
            scores = _get(page, "rec_scores", [])
            if not isinstance(polys, (list, tuple)):
                polys = list(polys) if hasattr(polys, "__iter__") else []
            if not isinstance(texts, (list, tuple)):
                texts = []
            if not isinstance(scores, (list, tuple)):
                scores = []
            for i, box in enumerate(polys):
                text = texts[i] if i < len(texts) else ""
                if isinstance(text, (list, tuple)):
                    text = text[0] if text else ""
                conf = float(scores[i]) if i < len(scores) else 1.0
                if hasattr(box, "tolist"):
                    box = box.tolist()
                out.append((box, str(text), conf))
        return out

    # Old format: list of (box, (text, conf))
    page = result[0] if isinstance(result[0], (list, tuple)) else result
    for line in page:
        if line is None or (hasattr(line, "__len__") and len(line) < 2):
            continue
        try:
            box = line[0] if not isinstance(line, dict) else line.get("box", line.get("dt_poly"))
            text = line[1][0] if isinstance(line[1], (list, tuple)) else str(line[1])
            conf = line[1][1] if isinstance(line[1], (list, tuple)) and len(line[1]) > 1 else 1.0
            out.append((box, text, float(conf)))
        except (KeyError, TypeError, IndexError):
            continue
    return out


_paddle_ocr = None


def _get_paddle_ocr(use_gpu: bool = True):
    global _paddle_ocr
    if _paddle_ocr is None:
        import os
        os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")
        from paddleocr import PaddleOCR
        # PaddleOCR 2.x uses device="gpu"|"cpu" (not use_gpu/show_log)
        device = "gpu" if use_gpu else "cpu"
        try:
            _paddle_ocr = PaddleOCR(
                lang="en",
                use_textline_orientation=False,
                device=device,
            )
        except (ValueError, TypeError):
            _paddle_ocr = PaddleOCR(use_angle_cls=False, lang="en", use_gpu=use_gpu, show_log=False)
    return _paddle_ocr


def run_easyocr(image: np.ndarray, reader=None) -> List[Tuple[List, str, float]]:
    """Run EasyOCR. image: RGB. Returns (bbox, text, conf)."""
    if reader is None:
        reader = _get_easyocr()
    results = reader.readtext(image)
    return [(r[0], r[1], float(r[2])) for r in results]


_easyocr_reader = None


def _get_easyocr(gpu: bool = True):
    global _easyocr_reader
    if _easyocr_reader is None:
        from models.extractor import _install_ssl_fix
        _install_ssl_fix()
        import easyocr
        _easyocr_reader = easyocr.Reader(["en"], gpu=gpu)
    return _easyocr_reader
