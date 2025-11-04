## Trashformers – Full Stack Setup Guide

Trashformers is a computer-vision recycling assistant. A Next.js frontend captures or uploads images, while a Flask + YOLOv8 backend segments recyclable materials (plastic, paper, metal). This README walks through everything required to get the project running locally and explains the architecture so you can extend it confidently.

---

### 1. Prerequisites

Make sure the following tools are available on your machine:

- **Git** 2.35+
- **Node.js** 18 LTS or newer (ships with npm 9+)
- **Python** 3.10 or 3.11 (YOLOv8 requires 3.10+)
- **pip** and **virtualenv** (or an environment manager such as `venv`, `conda`, or `pipenv`)
- **PowerShell** (Windows) or a Unix shell (macOS/Linux)

Optional but recommended:

- [pnpm](https://pnpm.io/) or [yarn](https://yarnpkg.com/) if you prefer an alternative package manager.
- [Git LFS](https://git-lfs.com/) for large model files if you plan to version the YOLO weights.

---

### 2. Clone The Repository

```bash
git clone https://github.com/your-org/trashformers.git
cd trashformers/trashformers-app
```

The repo contains a Next.js application at the root and a backend folder under `backend/`.

```text
trashformers-app/
├── app/                   # Next.js app router pages and layout
├── components/            # Reusable frontend components
├── lib/                   # Frontend utilities
├── public/                # Static assets
├── backend/               # Flask + YOLOv8 inference service
├── package.json
├── tsconfig.json
└── README.md (you are here)
```

---

### 3. Backend Setup (Flask + YOLOv8)

The backend exposes a `/segment` endpoint that accepts an image, runs YOLOv8 segmentation, and returns polygons plus per-class counts. Follow these steps before starting the frontend.

#### 3.1 Create and Activate a Virtual Environment

**Windows PowerShell**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**macOS/Linux (bash/zsh)**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

> Tip: If you use conda, run `conda create -n trashformers python=3.10` and `conda activate trashformers` instead.

#### 3.2 Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

Key Python dependencies (see `backend/requirements.txt`):

- **flask** – lightweight web framework for the REST API.
- **flask-cors** – enables cross-origin requests from the frontend.
- **ultralytics** – YOLOv8 model loading and inference.
- **pillow** – image decoding and preprocessing.
- **gunicorn** – Production-grade WSGI server for the Flask API.

#### 3.3 Provide YOLO Weights

Place the trained segmentation weights at `backend/models/trash_classifier.pt` (create the `models/` directory if needed). Example:

```powershell
mkdir models
copy C:\path\to\trash_classifier.pt .\models\trash_classifier.pt
```

If you do not have a model yet, you can train one with Ultralytics YOLO or request the pre-trained checkpoint from your team.

#### 3.4 Launch The API

Using Gunicorn (production-like):

```powershell
gunicorn app:app --bind 0.0.0.0:8000 --workers 1 --timeout 120
```

Alternatively, run the Flask development server (single-threaded, auto reload):

```powershell
python app.py
```

The API exposes two endpoints:

| Method | Route      | Description                  |
|--------|------------|------------------------------|
| GET    | `/health`  | Returns `{ "status": "ok" }` |
| POST   | `/segment` | Multipart upload with `file` |

Sample request via `curl`:

```bash
curl -F "file=@sample.jpg" http://127.0.0.1:8000/segment
```

Payload excerpt:

```json
{
	"filename": "sample.jpg",
	"image_size": { "width": 1280, "height": 720 },
	"segments": [
		{
			"id": 0,
			"label": "Plastic",
			"confidence": 0.94,
			"polygon": [[123.4, 512.2], [156.0, 489.6]],
			"bounding_box": [110.0, 420.0, 320.0, 640.0]
		}
	],
	"counts": { "Plastic": 3, "Paper": 1 }
}
```

Keep this server running while you work on the frontend.

---

### 4. Frontend Setup (Next.js App Router)

#### 4.1 Install Node Dependencies

From the repository root (`trashformers-app/`):

```bash
npm install
# or
pnpm install
# or
yarn install
```

Notable JavaScript dependencies:

- **next / react / react-dom** – the base framework using the App Router.
- **tailwindcss / postcss / autoprefixer** – utility-first styling.
- **shadcn/ui** – headless component primitives for buttons, cards, charts.
- **lucide-react** – icon set used across the UI.
- **recharts** – renders the material distribution pie chart.

#### 4.2 Configure Environment Variables

Create a `.env.local` file in the project root to point the frontend at the backend API:

```bash
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
```

Use your deployed backend URL in production. Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

#### 4.3 Run The Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Upload or capture an image; the frontend will POST it to the Flask API and render polygons + counts upon success.

#### 4.4 Production Build (optional)

```bash
npm run build
npm run start
```

---

### 5. Frontend Architecture

The app uses the Next.js App Router (`app/` directory) with client components for interactive features. Tailwind CSS provides layout and theming, while shadcn/ui primitives supply consistent surfaces, cards, and tooltips.

**Key Components** (all under `components/`):

- `page-header.tsx` – Hero section introducing the product.
- `capture-panel.tsx` – Handles file uploads, mobile capture (`capture="environment"`), progress display, and error presentation. Long filenames are truncated with a tooltip.
- `workflow-panel.tsx` – Three-step progress indicator (upload → segment → review).
- `preview-stage.tsx` – Renders the original/segmented image toggle, overlays YOLO polygons as SVG, and ensures mobile-friendly minimum height.
- `material-summary.tsx` – Shows per-material counts, status chips, and distribution chart.
- `material-pie-chart.tsx` – Thin wrapper around Recharts pie rendering with shadcn tooltips.

**State & Data Flow (`app/page.tsx`)**

```tsx
const apiBase = process.env.NEXT_PUBLIC_API_BASE;
const formData = new FormData();
formData.append("file", file);

const response = await fetch(`${apiBase}/segment`, {
	method: "POST",
	body: formData,
});

const data = await response.json();
```

1. Users add a file via `CapturePanel` → `handleFileLoad` converts it to a data URL for preview.
2. `bootstrapProcessing` sends the file to the backend and shows animated progress.
3. Responses update `segments` (polygon coordinates, normalized labels) and `counts` (Plastic/Paper/Metal only). Labels fall back to original text for unknown classes but default to a neutral color.
4. `PreviewStage` draws polygons using an SVG overlay sized to the actual image dimensions, with dynamic stroke width/font size for readability.
5. `MaterialSummary` consumes normalized counts to keep the legend in sync with the icon set and pie chart.

**Styling**

- Tailwind utility classes are configured in `app/globals.css` and `tailwind.config` (via `postcss.config.mjs`).
- Theme colors draw from Tailwind’s emerald, sky, amber palette to match material categories.
- The layout uses CSS grid to align capture panel, preview stage, and summary in desktop view while stacking vertically on mobile.

---

### 6. Backend Architecture

All backend logic lives in `backend/app.py`.

```python
from ultralytics import YOLO
model = YOLO("models/trash_classifier.pt")

@app.route("/segment", methods=["POST"])
def segment_image():
		image = Image.open(io.BytesIO(upload.read()))
		results = model.predict(source=image, iou=0.5, conf=0.25, agnostic_nms=True)
		...
```

**Important implementation details:**

- The YOLO model is loaded once at startup for performance.
- Requests must send a file under the form field `file` (see `fetchSegmentation` in the frontend for a working example).
- After running predictions, the backend constructs:
	- `segments`: each segment includes an `id`, `label`, `confidence`, `polygon` coordinates (rounded for compactness), and a `bounding_box`.
	- `counts`: class frequency used by the frontend summary.
- Errors (missing file, inference failure) return JSON `{ "error": ... }` with appropriate status codes so the UI can surface them.
- `flask-cors` allows the Next.js dev server (`localhost:3000`) to communicate with the API without manual headers.

You can adjust detection thresholds by tweaking `iou` and `conf` values in the `model.predict` call.

---

### 7. Testing & Troubleshooting

**Verify the backend**

- Run `curl http://127.0.0.1:8000/health` – expect `{"status":"ok"}`.
- Send a sample image with `curl -F "file=@sample.jpg" http://127.0.0.1:8000/segment` to ensure inference works.

**Verify the frontend**

- With both servers running, upload a known test image. Check the browser console (F12) for failed network calls—404/500 codes usually mean the backend isn’t reachable.
- If the preview image is blank on mobile, confirm `NEXT_PUBLIC_API_BASE` is accessible from that device and that the backend container allows external connections.

**Common Issues**

- *`ModuleNotFoundError: ultralytics`*: Activate the virtualenv and reinstall dependencies.
- *`Model file not found`*: Ensure `backend/models/trash_classifier.pt` exists before starting.
- *CORS errors*: Confirm the backend is running with CORS enabled (default in `app.py`).
- *Large image uploads fail*: Ensure your server reverse proxy (if any) allows multipart payloads >15MB.

---

### 8. Deployment Checklist

**Backend**

1. Provision a server (Render, AWS, etc.) with Python 3.10+ and enough RAM for YOLO.
2. Copy the `backend/` folder, install requirements, and upload the weight file.
3. Launch with `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120`.
4. Expose `/health` for platform health checks.

**Frontend**

1. Set `NEXT_PUBLIC_API_BASE` to the deployed backend URL.
2. Run `npm run build` and deploy to Vercel, Netlify, or your host of choice.
3. Configure HTTPS on both tiers to avoid mixed-content issues.

---

### 9. Contributing

1. Fork the repo and create a feature branch.
2. Update both code and documentation if you change behavior.
3. Run `npm run lint` (if configured) and your preferred Python formatter (e.g., `ruff`, `black`).
4. Submit a pull request describing changes and testing steps.

---

### 10. Reference Commands

| Task                                 | Command |
|--------------------------------------|---------|
| Install backend deps                 | `pip install -r backend/requirements.txt` |
| Start backend locally (gunicorn)     | `gunicorn app:app --bind 0.0.0.0:8000 --workers 1 --timeout 120` |
| Start backend in Render (gunicorn)   | `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120` |
| Start backend (Flask)                | `python backend/app.py` |
| Install frontend deps                | `npm install` |
| Run frontend dev server              | `npm run dev` |
| Build frontend for production        | `npm run build` |
| Start frontend in production mode    | `npm run start` |
| Run combined app (two terminals)     | terminal 1: backend command, terminal 2: `npm run dev` |

---

You should now have a fully working Trashformers stack: upload an image, see the segmented items, and view material summaries in seconds. If anything is unclear or missing, open an issue or PR with improvements. Happy hacking!
