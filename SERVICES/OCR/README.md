# Lease extraction API (PaddleOCR)

Extracts structured fields from GCAAR DC Residential Lease images (page **p1** or **p11**): OCR via PaddleOCR, rule-based parsing, and an image quality gate before inference.

## Setup

```bash
cd SERVICES/OCR
pip install -r requirements.txt
```

Python 3.11+ recommended. CPU is supported (`use_gpu=False` in code paths used on Render).

## Run locally

```bash
uvicorn api:app --host 0.0.0.0 --port 8000
```

- `GET /health` — model readiness  
- `POST /extract` — multipart form: `file` (image), `page` (`p1` | `p11`), optional `max_side` (default `1600`)

See `DEPLOY_RENDER.md` for hosting on Render.

## Target fields (summary)

**Page 1:** landlord contact, agreement date, landlord/agent name, tenant name, property address, lease term, start/end dates, rent, fees, etc.

**Page 11:** signature names and dates, deposits, guarantors, etc.

## Stack

- **OCR:** PaddleOCR (primary); EasyOCR helpers remain in `models/extractor.py` for SSL/install paths used by optional backends.
- **Extraction:** `models/extractor_v2.py` (regex + spatial rules on OCR output).
- **Quality gate:** `utils_quality.py` (resolution + blur) before extraction.
