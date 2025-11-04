"""Flask API that segments trash images using a YOLOv8 segmentation model."""
from __future__ import annotations

from PIL import Image
import io

import logging
from pathlib import Path
from typing import Any, Dict, List

from flask import Flask, jsonify, request
from flask_cors import CORS
from ultralytics import YOLO

log = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "trash_classifier.pt"

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Model file not found at {MODEL_PATH}. Place trash_classifier.pt in this location."
    )

# Load YOLO model once at startup so subsequent requests are faster.
model = YOLO(str(MODEL_PATH))

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


@app.route("/health", methods=["GET"])
def health_check() -> Any:
    """Return a simple health check response."""
    return jsonify({"status": "ok"})


@app.route("/segment", methods=["POST"])
def segment_image() -> Any:
    """Run segmentation on the provided image and return polygons per detected item."""
    if "file" not in request.files:
        return jsonify({"error": "No file part in request."}), 400

    upload = request.files["file"]
    if upload.filename == "":
        return jsonify({"error": "Empty filename."}), 400

    try:
        # Convert uploaded file to PIL Image
        image = Image.open(io.BytesIO(upload.read()))
        
        # Run inference with adjusted NMS parameters
        results = model.predict(
            source=image, 
            stream=False, 
            verbose=False,
            iou=0.5,   # IoU threshold for NMS (default: 0.7, lower = more aggressive)
            conf=0.25, # Confidence threshold (default: 0.25, higher = fewer detections)
            agnostic_nms=True  # Apply NMS across all classes (helps with diff labels on same object)
        )
    except Exception as exc:  # noqa: BLE001
        log.exception("Model inference failed")
        return jsonify({"error": f"Inference failed: {exc}"}), 500

    if not results:
        return jsonify({"error": "No inference results returned."}), 500

    result = results[0]
    height, width = (result.orig_shape or (None, None))

    segments: List[Dict[str, Any]] = []
    counts: Dict[str, int] = {}

    if result.masks is not None and result.boxes is not None:
        for idx, (cls_id, conf) in enumerate(zip(result.boxes.cls.tolist(), result.boxes.conf.tolist())):
            label = result.names.get(int(cls_id), str(cls_id))
            counts[label] = counts.get(label, 0) + 1

            polygon_points: List[List[float]] = []
            # Each mask.xy entry is a Nx2 array representing a polygon in image coordinates.
            if idx < len(result.masks.xy):
                polygon = result.masks.xy[idx]
                polygon_points = [[float(round(x, 2)), float(round(y, 2))] for x, y in polygon.tolist()]

            box = result.boxes.xyxy[idx].tolist() if idx < len(result.boxes.xyxy) else None

            segments.append(
                {
                    "id": idx,
                    "label": label,
                    "confidence": float(round(conf, 4)),
                    "polygon": polygon_points,
                    "bounding_box": box,
                }
            )

    response: Dict[str, Any] = {
        "filename": upload.filename,
        "image_size": {"width": width, "height": height},
        "segments": segments,
        "counts": counts,
    }

    return jsonify(response)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
