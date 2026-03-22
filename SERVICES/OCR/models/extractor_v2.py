"""
Lease extractor v2: PaddleOCR + refined regex + spatial rules for target fields.
Uses both regex on full text and spatial lookup (value near label) for accuracy.
"""

import re
from typing import List, Tuple, Dict, Optional
import numpy as np

from config.schemas import (
    TARGET_FIELDS_P1,
    TARGET_FIELDS_P11,
    target_extraction_p1,
    target_extraction_p11,
)


def bbox_center(bbox) -> Tuple[float, float]:
    pts = np.array(bbox)
    return (float(pts[:, 0].mean()), float(pts[:, 1].mean()))


def _normalize_bbox(bbox, w: float, h: float):
    """Return (cx, cy) in 0-1 normalized coords."""
    cx, cy = bbox_center(bbox)
    return (cx / w if w else 0, cy / h if h else 0)


def _find_value_near_label(
    ocr_results: List,
    label_pattern: str,
    search_direction: str = "right",
    w: float = 1.0,
    h: float = 1.0,
    max_dist: float = 0.25,
) -> Optional[str]:
    """Find text near a label using normalized bbox positions. w,h = image width, height."""
    label_re = re.compile(label_pattern, re.I)
    label_boxes = []
    for bbox, text, conf in ocr_results:
        if label_re.search(text) and text.strip():
            nx, ny = _normalize_bbox(bbox, w, h)
            label_boxes.append((nx, ny, text))
    if not label_boxes:
        return None
    lx, ly, _ = label_boxes[0]
    candidates = []
    for bbox, text, conf in ocr_results:
        if label_re.search(text) or not (text and text.strip()):
            continue
        nx, ny = _normalize_bbox(bbox, w, h)
        dx, dy = nx - lx, ny - ly
        if search_direction == "right" and 0 < dx <= max_dist and abs(dy) < 0.08:
            candidates.append((dx, text.strip(), conf))
        elif search_direction == "below" and 0 < dy <= max_dist and abs(dx) < 0.15:
            candidates.append((dy, text.strip(), conf))
    if not candidates:
        return None
    candidates.sort(key=lambda x: x[0])
    return candidates[0][1]


def _clean(s: str) -> str:
    """Normalize extracted string."""
    if not s or not isinstance(s, str):
        return ""
    return " ".join(s.split()).strip()


def get_ocr_results(image: np.ndarray, backend: str = "paddle") -> List[Tuple[List, str, float]]:
    """Run OCR and return list of (bbox, text, confidence). image: BGR (OpenCV)."""
    if backend.lower() == "paddle":
        from models.ocr_backends import run_paddle_ocr
        return run_paddle_ocr(image)
    else:
        import cv2
        from models.ocr_backends import run_easyocr
        img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        return run_easyocr(img_rgb)


# --- Regex patterns (GCAAR lease form) ---

# Page 1
RE_LANDLORD_CONTACT = re.compile(
    r"Landlord\s*Contact\s*:?\s*([\d\-]{10,14})\s*[|\s\(]+([^\s\)]+@[^\s\)]+)",
    re.I
)
RE_LANDLORD_CONTACT_PIPE = re.compile(
    r"([\d]{3}[\-]?\d{3}[\-]?\d{4})\s*[|]\s*([\w.]+@[\w.\-]+)",
    re.I
)
RE_AGREEMENT_DATE = re.compile(r"(?:THIS\s+LEASE\s*,?\s+is\s+made|made\s+on)\s+(\w+\s+\d{1,2},?\s+\d{4})", re.I)
RE_BEGINNING_ON = re.compile(r"beginning\s+on\s+(?:the\s+first\s+day\s+of\s+)?(\w+\s+\d{1,2},?\s+\d{4})", re.I)
RE_ENDING_ON = re.compile(r"ending\s+on\s+(?:the\s+last\s+day\s+of\s+)?(\w+\s+\d{1,2},?\s+\d{4})", re.I)
RE_LANDLORD_AGENT = re.compile(r"(?:by\s+and\s+between|Agent)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)", re.I)
# "between [Landlord] and [Tenant]" -> tenant is group 1 (name after "and")
# Allow trailing: . , (the Premises, (hereinafter, "for the", or end of line
RE_BETWEEN_AND_TENANT = re.compile(
    r"between\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+and\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:\.|,|\s*\(\s*the\s+[Pp]remises|\s*\(\s*hereinafter|\s+for\s+the|$)",
    re.I | re.DOTALL,
)
# Fallback: "and <Name>" without strict delimiter
RE_AND_TENANT_FALLBACK = re.compile(
    r"between\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+and\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
    re.I,
)
# Form text: "... and Jennifer Rodriguez (hereinafter referred to as 'Tenant')"
RE_TENANT_HEREINAFTER = re.compile(
    r"and\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\(\s*hereinafter\s+referred\s+to\s+as\s+['\"]Tenant['\"]\s*\)",
    re.I,
)
RE_PREMISES = re.compile(
    r"premises\s+known\s+as\s+([^(\n]+?)\s*\(\s*the\s+Premises",
    re.I
)
RE_PREMISES_FALLBACK = re.compile(
    r"premises\s+known\s+as\s+([^(\n]+?)\s+for\s+the\s+term",
    re.I
)
RE_LEASE_TERM = re.compile(r"(\d+)\s*Months?", re.I)
RE_DATES_LONG = re.compile(r"(\w+\s+\d{1,2},?\s+\d{4})")

# Page 11 (signature block)
RE_TENANT_SIG = re.compile(r"Tenant\s+([A-Za-z][A-Za-z\s]{2,30}?)(?=\s+Date\s+|\s*\d{1,2}/\d{1,2}/|\s*$)", re.I)
RE_LANDLORD_SIG = re.compile(r"Landlord\s+([A-Za-z][A-Za-z\s]{2,30}?)(?=\s+Date\s+|\s*\d{1,2}/\d{1,2}/|\s*$)", re.I)
RE_DATE_MMDDYYYY = re.compile(r"(\d{1,2}/\d{1,2}/\d{4})")


def extract_page1_target(
    ocr_results: List,
    full_text: str = "",
    img_shape: Optional[Tuple[int, int]] = None,
) -> Dict:
    """Extract target fields for Page 1: regex + spatial fallback."""
    result = target_extraction_p1()
    if not full_text:
        full_text = " ".join([t for (_, t, _) in ocr_results])
    w = (img_shape[1] if img_shape and len(img_shape) >= 2 else 1.0) or 1.0
    h = (img_shape[0] if img_shape else 1.0) or 1.0

    def _extract_email_phone(text: str) -> Tuple[str, str]:
        if not text:
            return ("", "")
        # Light OCR cleanup: separators and common confusions in emails.
        t = text.replace("|", " ").replace("¦", " ").replace("∣", " ").replace("l@", "@")
        email_re = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}", re.I)
        phone_re = re.compile(r"\b(\d{3})[^\d]?(\d{3})[^\d]?(\d{4})\b")

        em = email_re.search(t)
        ph = phone_re.search(t)
        email = _clean(em.group(0)) if em else ""
        phone = f"{ph.group(1)}-{ph.group(2)}-{ph.group(3)}" if ph else ""
        return (phone, email)

    def _header_text() -> str:
        """Best-effort: collect OCR text from top-left header area."""
        if not img_shape or not ocr_results:
            return ""
        header_chunks: List[str] = []
        for bbox, text, conf in ocr_results:
            if not (text and str(text).strip()):
                continue
            nx, ny = _normalize_bbox(bbox, w, h)
            # Header line (top ~12%) and left-ish (first ~70%)
            if ny <= 0.12 and nx <= 0.70:
                header_chunks.append(str(text))
        return " ".join(header_chunks)

    # Landlord contact (header: "Landlord Contact: phone | email")
    m = RE_LANDLORD_CONTACT.search(full_text)
    if m:
        result["landlord_contact_phone"] = _clean(m.group(1))
        result["landlord_contact_email"] = _clean(m.group(2))
    else:
        m = RE_LANDLORD_CONTACT_PIPE.search(full_text)
        if m:
            result["landlord_contact_phone"] = _clean(m.group(1))
            result["landlord_contact_email"] = _clean(m.group(2))
        elif img_shape and ocr_results:
            val = _find_value_near_label(ocr_results, r"Landlord\s*Contact", "right", w, h, 0.35)
            if val and re.match(r"[\d\-]{10,14}", val):
                result["landlord_contact_phone"] = _clean(val)

    # If the scan is blurry the label often breaks; fall back to top-left header search.
    if not result["landlord_contact_phone"] or not result["landlord_contact_email"]:
        phone, email = _extract_email_phone(_header_text())
        if not result["landlord_contact_phone"] and phone:
            result["landlord_contact_phone"] = phone
        if not result["landlord_contact_email"] and email:
            result["landlord_contact_email"] = email

    # Final fallback: search entire OCR text for email/phone anywhere (least precise).
    if not result["landlord_contact_phone"] or not result["landlord_contact_email"]:
        phone, email = _extract_email_phone(full_text)
        if not result["landlord_contact_phone"] and phone:
            result["landlord_contact_phone"] = phone
        if not result["landlord_contact_email"] and email:
            result["landlord_contact_email"] = email

    # All long-format dates (for agreement, start, end)
    dates = RE_DATES_LONG.findall(full_text)

    # Agreement date (first date in "THIS LEASE is made [date]")
    m = RE_AGREEMENT_DATE.search(full_text)
    if m:
        result["agreement_date"] = _clean(m.group(1))
    elif dates:
        result["agreement_date"] = _clean(dates[0])

    # Start/end dates from "beginning on ... ending on ..."
    m = RE_BEGINNING_ON.search(full_text)
    if m:
        result["lease_start_date"] = _clean(m.group(1))
    m = RE_ENDING_ON.search(full_text)
    if m:
        result["lease_end_date"] = _clean(m.group(1))
    if not result["lease_start_date"] and len(dates) >= 2:
        result["lease_start_date"] = _clean(dates[1])
    if not result["lease_end_date"] and len(dates) >= 3:
        result["lease_end_date"] = _clean(dates[2])
    if dates and not result["agreement_date"]:
        result["agreement_date"] = _clean(dates[0])

    # Landlord/Agent name (first name after "by and between")
    m = RE_LANDLORD_AGENT.search(full_text)
    if m:
        result["landlord_agent_name"] = _clean(m.group(1))

    # Tenant name = second name in "between [Landlord] and [Tenant]" (never use landlord as tenant)
    landlord_name = (result.get("landlord_agent_name") or "").lower()

    def _set_tenant(name: str) -> bool:
        if not name or name.lower() == landlord_name or len(name) > 50:
            return False
        if " and " in name:
            return False
        result["tenant_name"] = _clean(name)
        return True

    m = RE_BETWEEN_AND_TENANT.search(full_text)
    if m:
        _set_tenant(m.group(1))
    if not result["tenant_name"]:
        m = RE_AND_TENANT_FALLBACK.search(full_text)
        if m:
            _set_tenant(m.group(1))
    if not result["tenant_name"]:
        m = RE_TENANT_HEREINAFTER.search(full_text)
        if m:
            _set_tenant(m.group(1))
    if not result["tenant_name"] and img_shape and ocr_results:
        val = _find_value_near_label(ocr_results, r"^Tenant$|Tenant\s*$", "right", w, h, 0.25)
        if val and re.match(r"[A-Za-z]", val) and _set_tenant(val):
            pass

    # Property address (stop at " (the Premises" to avoid capturing rest of document)
    m = RE_PREMISES.search(full_text)
    if m:
        result["property_address"] = _clean(m.group(1))
    else:
        m = RE_PREMISES_FALLBACK.search(full_text)
        if m:
            result["property_address"] = _clean(m.group(1))

    # Lease term
    m = RE_LEASE_TERM.search(full_text)
    if m:
        result["lease_term_months"] = _clean(m.group(0))

    return result


def extract_page11_target(
    ocr_results: List,
    full_text: str = "",
    img_shape: Optional[Tuple[int, int]] = None,
) -> Dict:
    """Extract target fields for Page 11 (signature block)."""
    result = target_extraction_p11()
    if not full_text:
        full_text = " ".join([t for (_, t, _) in ocr_results])
    w = (img_shape[1] if img_shape and len(img_shape) >= 2 else 1.0) or 1.0
    h = (img_shape[0] if img_shape else 1.0) or 1.0

    # Tenant signature name (first "Tenant" row in witness block)
    m = RE_TENANT_SIG.search(full_text)
    if m:
        result["tenant_signature_name"] = _clean(m.group(1))
    if not result["tenant_signature_name"] and img_shape and ocr_results:
        val = _find_value_near_label(ocr_results, r"Tenant", "right", w, h, 0.25)
        if val and re.match(r"[A-Za-z]", val):
            result["tenant_signature_name"] = _clean(val)

    # Landlord signature name
    m = RE_LANDLORD_SIG.search(full_text)
    if m:
        result["landlord_signature_name"] = _clean(m.group(1))
    if not result["landlord_signature_name"] and img_shape and ocr_results:
        val = _find_value_near_label(ocr_results, r"Landlord", "right", w, h, 0.25)
        if val and re.match(r"[A-Za-z]", val):
            result["landlord_signature_name"] = _clean(val)

    # Dates MM/DD/YYYY (first = tenant, second = landlord)
    dates = RE_DATE_MMDDYYYY.findall(full_text)
    if dates:
        result["tenant_signature_date"] = _clean(dates[0])
    if len(dates) >= 2:
        result["landlord_signature_date"] = _clean(dates[1])

    return result


def _resize_for_speed(image: np.ndarray, max_side: int) -> np.ndarray:
    """Resize image so longest side is max_side; keeps aspect ratio. Speeds up OCR."""
    import cv2
    h, w = image.shape[:2]
    if max(h, w) <= max_side:
        return image
    scale = max_side / max(h, w)
    new_w, new_h = int(w * scale), int(h * scale)
    return cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)


def extract_from_image(
    image: np.ndarray,
    page_type: str,
    backend: str = "paddle",
    max_side: Optional[int] = None,
) -> Dict:
    """
    Main entry: run OCR and extract target fields.
    max_side: if set, resize image so longest side is this (e.g. 1600) for faster OCR on cloud.
    """
    if max_side and max_side > 0:
        image = _resize_for_speed(image, max_side)
    ocr_results = get_ocr_results(image, backend)
    h, w = image.shape[:2]
    img_shape = (h, w)
    raw_lines = [t for (_, t, _) in ocr_results if t and str(t).strip()]
    raw_text = "\n".join(raw_lines)

    if page_type in ("p1", "1"):
        result = extract_page1_target(ocr_results, img_shape=img_shape)
    elif page_type in ("p11", "11"):
        result = extract_page11_target(ocr_results, img_shape=img_shape)
    else:
        raise ValueError(f"Unknown page_type: {page_type}")
    result["raw_text"] = raw_text
    return result
