# Deploy Lease Extraction API on Render

## 1. Performance (speed) tips

- **Model loaded once**: The API loads PaddleOCR at startup and keeps it in memory. First request may be slow (~30s); later requests are much faster.
- **Image resize**: `max_side=1600` (default) resizes the image before OCR. Use `max_side=0` for no resize (slower, slightly more accurate).
- **CPU only**: Render free tier has no GPU. The app uses CPU; set `use_gpu=False` (already done in `api.py`).
- **Memory**: PaddleOCR needs ~1–2 GB RAM. Use at least a **Starter** (512MB may OOM); **Standard** (2GB) is safer.

## 2. Deploy on Render

### Option A: Render Dashboard

1. Connect your repo (e.g. GitHub).
2. **Build command:** `pip install -r requirements.txt`
3. **Start command:** `uvicorn api:app --host 0.0.0.0 --port $PORT`
4. **Root directory:** `lease_extraction` (if the app lives in a subfolder of the repo).
5. **Environment:** Add `PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True`.
6. **Instance:** Prefer 2 GB RAM (Starter or Standard).

### Option B: render.yaml

If your repo root is the `lease_extraction` folder (or you run from it), you can use the included `render.yaml` and deploy from the Render dashboard with “New Blueprint”.

## 3. API usage (for your frontend)

**Health check**
```http
GET https://your-service.onrender.com/health
```
Returns `{"status":"ok","model":"paddle"}` when ready.

**Extract from image**
```http
POST https://your-service.onrender.com/extract
Content-Type: multipart/form-data

file: <binary image>
page: p1   (or p11)
max_side: 1600   (optional; 0 = no resize)
```

**Example (JavaScript fetch)**
```javascript
const formData = new FormData();
formData.append('file', imageFile);  // File from <input type="file">
formData.append('page', 'p1');
formData.append('max_side', '1600');

const res = await fetch('https://your-service.onrender.com/extract', {
  method: 'POST',
  body: formData,
});
const data = await res.json();
// data.tenant_name, data.property_address, etc.
```

**Example (curl)**
```bash
curl -X POST https://your-service.onrender.com/extract \
  -F "file=@lease_page1.jpg" \
  -F "page=p1" \
  -F "max_side=1600"
```

## 4. Cold starts

On free tier, the service sleeps after inactivity. The first request after wake can take 30–60 s (model load). Use a cron or uptime checker to hit `/health` every 10–15 minutes if you need faster first response.
