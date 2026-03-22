"""
Image quality checks (resolution, blur) for lease images.
Designed to run fast in API/CLI before OCR.
"""

from typing import Dict, Any

import cv2
import numpy as np


def check_resolution(image: np.ndarray, min_width: int, min_height: int) -> Dict[str, Any]:
    """Check if image meets minimum width/height."""
    h, w = image.shape[:2]
    if w < min_width or h < min_height:
        return {
            "pass": False,
            "reason": f"Resolution too low: {w}x{h}. Minimum required: {min_width}x{min_height}",
        }
    return {"pass": True, "width": w, "height": h}


def check_blur(image: np.ndarray, min_blur_score: float) -> Dict[str, Any]:
    """Compute Laplacian variance blur score and compare to threshold."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
    smooth = cv2.medianBlur(gray, 3)
    blur_score = cv2.Laplacian(smooth, cv2.CV_64F).var()

    if blur_score < min_blur_score:
        return {
            "pass": False,
            "reason": f"Image too blurry. Blur score: {blur_score:.1f}. Minimum required: {min_blur_score}",
        }
    return {"pass": True, "blur_score": round(float(blur_score), 2)}


def run_quality_check_on_image(image: np.ndarray, config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run pixel-level quality checks (resolution, blur) on an image loaded in memory.
    File-type/size checks should be done by the caller.
    """
    results: Dict[str, Any] = {}

    results["resolution"] = check_resolution(image, config["min_width"], config["min_height"])
    if not results["resolution"]["pass"]:
        return {"pass": False, "checks": results, "reason": results["resolution"]["reason"]}

    results["blur"] = check_blur(image, config["min_blur_score"])
    if not results["blur"]["pass"]:
        return {"pass": False, "checks": results, "reason": results["blur"]["reason"]}

    return {"pass": True, "checks": results, "reason": None}

