"""
Lease document information extractor.
Uses EasyOCR for text detection + rule-based spatial extraction for known form layout.
"""

import re
from typing import List, Tuple, Dict, Optional
import numpy as np

# OCR is lazy-loaded to avoid import at module level (heavy dependency)
_ocr_reader = None


def _install_ssl_fix():
    """Bypass SSL verification for HTTPS downloads (macOS Python.org CERTIFICATE_VERIFY_FAILED)."""
    import ssl
    import urllib.request
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    https_handler = urllib.request.HTTPSHandler(context=ctx)
    opener = urllib.request.build_opener(https_handler)
    urllib.request.install_opener(opener)


def get_ocr_reader(lang: List[str] = None, gpu: bool = True):
    global _ocr_reader
    if _ocr_reader is None:
        _install_ssl_fix()
        import easyocr
        _ocr_reader = easyocr.Reader(lang or ["en"], gpu=gpu)
    return _ocr_reader


def run_ocr(image: np.ndarray, reader=None) -> List[Tuple[List, str, float]]:
    """
    Run OCR on image. Returns list of (bbox, text, confidence).
    image: numpy array (H, W, 3) in RGB or BGR.
    """
    if reader is None:
        reader = get_ocr_reader()
    results = reader.readtext(image)
    return results


def bbox_center(bbox: List) -> Tuple[float, float]:
    pts = np.array(bbox)
    return (pts[:, 0].mean(), pts[:, 1].mean())


def find_value_near_label(
    ocr_results: List,
    label_pattern: str,
    search_direction: str = "right",
    max_distance_ratio: float = 0.3,
) -> Optional[str]:
    """
    Find OCR text that appears near a label matching label_pattern.
    search_direction: 'right', 'below', 'left', 'above'
    """
    label_re = re.compile(label_pattern, re.I)
    label_boxes = []
    for bbox, text, conf in ocr_results:
        if label_re.search(text):
            cx, cy = bbox_center(bbox)
            label_boxes.append((bbox, cx, cy, text))

    if not label_boxes:
        return None

    # Use first label
    _, lx, ly, _ = label_boxes[0]
    candidates = []
    for bbox, text, conf in ocr_results:
        if label_re.search(text):
            continue
        if not text or not text.strip():
            continue
        cx, cy = bbox_center(bbox)
        dx = cx - lx
        dy = cy - ly

        if search_direction == "right" and 0 < dx < max_distance_ratio and abs(dy) < 0.1:
            candidates.append((dx, text.strip(), conf))
        elif search_direction == "below" and 0 < dy < max_distance_ratio and abs(dx) < 0.2:
            candidates.append((dy, text.strip(), conf))
        elif search_direction == "left" and -max_distance_ratio < dx < 0 and abs(dy) < 0.1:
            candidates.append((-dx, text.strip(), conf))
        elif search_direction == "above" and -max_distance_ratio < dy < 0 and abs(dx) < 0.2:
            candidates.append((-dy, text.strip(), conf))

    if not candidates:
        return None
    candidates.sort(key=lambda x: x[0])
    return candidates[0][1]


def extract_page1(ocr_results: List, full_text: str = "") -> Dict:
    """Extract Page 1 fields using patterns and spatial heuristics."""
    from config.schemas import empty_page1

    result = empty_page1()

    # Build full text for regex fallback
    if not full_text:
        full_text = " ".join([t for (_, t, _) in ocr_results])

    # Landlord contact: "Landlord Contact: 311-837-6167 (email)"
    m = re.search(r"Landlord\s+Contact:\s*([\d\-]+)\s*\(([^)]+)\)", full_text, re.I)
    if m:
        result["landlord_contact_phone"] = m.group(1).strip()
        result["landlord_contact_email"] = m.group(2).strip()

    # Date: "August 24, 2025" near "is made"
    m = re.search(r"(\w+\s+\d{1,2},?\s+\d{4})", full_text)
    if m:
        result["agreement_date"] = m.group(1).strip()

    # Tenant name - often "between" ... "and" ... or near "Tenant"
    m = re.search(r"(?:Tenant|between)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)", full_text)
    if m:
        result["tenant_name"] = m.group(1).strip()

    # Property address - "premises known as" or street pattern
    m = re.search(r"(?:premises\s+known\s+as|at)\s+([^,]+(?:,\s*[^,]+){2,})", full_text, re.I)
    if m:
        result["property_address"] = m.group(1).strip()

    # Rent amount - "$" followed by digits
    m = re.search(r"\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)", full_text)
    if m:
        result["monthly_rent_amount"] = m.group(1).strip()

    # Lease dates
    dates = re.findall(r"(\w+\s+\d{1,2},?\s+\d{4})", full_text)
    if len(dates) >= 2:
        result["lease_start_date"] = dates[1] if len(dates) > 1 else ""
        result["lease_end_date"] = dates[2] if len(dates) > 2 else ""
    if len(dates) >= 1 and not result["agreement_date"]:
        result["agreement_date"] = dates[0]

    # Lease term
    m = re.search(r"(\d+)\s*Months?", full_text, re.I)
    if m:
        result["lease_term_months"] = m.group(0).strip()

    # Late fee
    m = re.search(r"(?:late\s+charge|five\s+percent)\s*\(?(\d+)%?\)?", full_text, re.I)
    if m:
        result["late_fee_percentage"] = m.group(1) + "%"

    # Returned check fee
    m = re.search(r"\$(\d+(?:\.\d{2})?)\s*(?:service\s+charge|returned)", full_text, re.I)
    if m:
        result["returned_check_fee"] = "$" + m.group(1)

    result["form_id"] = "GCAAR Form # 1221 - DC Residential Lease"
    result["page_number"] = "1 of 11"

    return result


def extract_page11(ocr_results: List, full_text: str = "") -> Dict:
    """Extract Page 11 fields (signatures, financials, guarantors)."""
    from config.schemas import empty_page11

    result = empty_page11()

    if not full_text:
        full_text = " ".join([t for (_, t, _) in ocr_results])

    # Addendum
    if re.search(r"Addendum\s+Attached.*Yes", full_text, re.I | re.DOTALL):
        result["addendum_attached"] = "Yes"
    else:
        result["addendum_attached"] = "No"

    # Tenant / Landlord signatures - first names in witness section
    # Pattern: "Tenant" ... "Date" ... "Landlord" ... "Date"
    tenant_match = re.search(r"Tenant\s+([A-Za-z\s]+?)(?:\s+Date\s+|\d)", full_text)
    if tenant_match:
        result["tenant_signature_name"] = tenant_match.group(1).strip()

    landlord_match = re.search(r"Landlord\s+([A-Za-z\s]+?)(?:\s+Date\s+|\d)", full_text)
    if landlord_match:
        result["landlord_signature_name"] = landlord_match.group(1).strip()

    # Dates in MM/DD/YYYY
    dates = re.findall(r"\d{1,2}/\d{1,2}/\d{4}", full_text)
    if dates:
        result["tenant_signature_date"] = dates[0]
        if len(dates) > 1:
            result["landlord_signature_date"] = dates[1]

    # Security deposit
    m = re.search(r"Security\s+Deposit\s+Received:\s*\$?\s*([\d,.]*)", full_text, re.I)
    if m and m.group(1).strip():
        result["security_deposit_amount"] = m.group(1).strip()

    # Guarantors
    if "Guarantors" in full_text and re.search(r"Name of Guarantor", full_text):
        # Check if any guarantor fields have content
        for i in range(1, 4):
            m = re.search(rf"Guarantor\s+{i}.*?Name[:\s]+([^\n]+)", full_text, re.I | re.DOTALL)
            if m and m.group(1).strip():
                result["guarantors_used"] = "Yes"
                break

    return result


def extract_from_image(image: np.ndarray, page_type: str, reader=None) -> Dict:
    """
    Main entry: run OCR on image and extract fields for page_type ('p1' or 'p11').
    """
    ocr_results = run_ocr(image, reader)
    if page_type in ("p1", "1"):
        return extract_page1(ocr_results)
    elif page_type in ("p11", "11"):
        return extract_page11(ocr_results)
    else:
        raise ValueError(f"Unknown page_type: {page_type}")
