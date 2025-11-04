# Trashformers Inference API

Simple Flask API that serves YOLOv8 segmentation predictions for the Trashformers frontend.

## Prerequisites

- Python 3.10+
- `trash_classifier.pt` trained YOLOv8 segmentation weights. Place the file under `backend/models/trash_classifier.pt`.
- Ideally create a virtual environment for the backend services.

## Setup

Activate the virtual environment:

- macOS/Linux (bash/zsh):

  ```bash
  source .venv/bin/activate
  ```

- Windows PowerShell:

  ```powershell
  .\.venv\Scripts\Activate.ps1
  ```

- Windows Command Prompt:

  ```cmd
  .\.venv\Scripts\activate
  ```

Then install dependencies:

```bash
pip install -r requirements.txt
```

## Running locally

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

> Alternatively run `python app.py` which uses Flask's built-in development server.

## API

- `GET /health` &rarr; `{ "status": "ok" }`
- `POST /segment`
  - multipart form with `file` field containing an image (`.jpg`, `.png`, etc.)
  - response example:

```json
{
  "filename": "sample.jpg",
  "image_size": { "width": 1280, "height": 720 },
  "segments": [
    {
      "id": 0,
      "label": "Plastic",
      "confidence": 0.9412,
      "polygon": [[123.4, 512.2], [156.0, 489.6], ...],
      "bounding_box": [110.0, 420.0, 320.0, 640.0]
    }
  ],
  "counts": {
    "Plastic": 3,
    "Paper": 1
  }
}
```

The frontend can use the `polygon` coordinates to draw overlays and the `counts` object to update material summaries.

## Deploying to Render.com

Render provides persistent containerized services, perfect for running the YOLO model continuously. Below is a minimal setup using a Render "Web Service".

### 1. Prepare the repository

- Commit the `backend/` folder, `requirements.txt`, and the `trash_classifier.pt` weight file (or upload it separately into cloud storage and download in a startup script; note that git-lfs may be required if the model is large).
- Ensure `app.py` lives at `backend/app.py` and exposes the `app` object.

### 2. Create a new Web Service

1. Sign in to [Render](https://render.com/) and click **New + → Web Service**.
2. Connect the Git repository that contains this project.
3. Select the branch (e.g., `main`) and provide a service name (`trashformers-backend`).
4. Under **Root Directory**, set `backend`. This ensures Render runs commands with the backend folder as working directory.
5. Set the **Runtime** to **Python 3**.
6. Set the **Build Command** to:
  ```bash
  pip install -r requirements.txt
  ```
7. Set the **Start Command** to:
  ```bash
  uvicorn app:app --host 0.0.0.0 --port 10000
  ```
  Render injects the port via `$PORT`; you can also use `--port $PORT`.

### 3. Environment settings

Set environment variables in the Render dashboard (Settings → Environment):

| Variable | Suggested Value | Notes |
| --- | --- | --- |
| `PYTHONUNBUFFERED` | `1` | Ensures logs flush immediately |
| `TORCH_HOME` | `/opt/render/.cache/torch` | Keeps model caches between deploys |

If the model file is not committed to the repo (because of size), add a **start command** script that downloads it before launching the server, for example:

```bash
curl -L $MODEL_URL -o models/trash_classifier.pt
uvicorn app:app --host 0.0.0.0 --port $PORT
```

### 4. Provision memory

YOLOv8 inference requires more memory than the smallest Render plans. Consider starting with a **Starter** or **Standard** plan offering at least 1 GB RAM. Monitor usage and scale up if needed.

### 5. Configure health check

- In Render → Web Service → **Health Check Path**, set `/health`.
- Render will mark deploys healthy once `GET /health` returns a 200 response.

### 6. Test after deploy

After Render finishes building and deploying:

```bash
curl https://<your-service>.onrender.com/health
curl -F "file=@path/to/sample.jpg" https://<your-service>.onrender.com/segment
```

## Frontend integration

Store the backend URL in the Next.js environment, e.g., add to `.env.local` (create if doesn't exist yet):

```
NEXT_PUBLIC_API_BASE=https://<your-service>.onrender.com
```

Then the frontend can now `POST` to `${process.env.NEXT_PUBLIC_API_BASE}/segment`.
