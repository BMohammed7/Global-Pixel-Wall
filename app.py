"""
Global Pixel Wall - Flask backend.
Serves pixel grid state from JSON and accepts updates.
"""

import json
from pathlib import Path

from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# Path to the JSON file storing pixel colors (same directory as app.py)
PIXELS_FILE = Path(__file__).parent / "pixels.json"

# Default: 20x20 grid, 400 pixels, ID "0".."399", default color #1a1a2e
DEFAULT_PIXELS = {str(i): "#1a1a2e" for i in range(400)}


def load_pixels():
    """Load pixel state from JSON file. Create file with defaults if missing."""
    if not PIXELS_FILE.exists():
        save_pixels(DEFAULT_PIXELS)
        return DEFAULT_PIXELS.copy()
    try:
        with open(PIXELS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return DEFAULT_PIXELS.copy()


def save_pixels(pixels):
    """Write pixel state to JSON file."""
    with open(PIXELS_FILE, "w", encoding="utf-8") as f:
        json.dump(pixels, f, indent=2)


@app.route("/")
def index():
    """Serve the main page."""
    return render_template("index.html")


@app.route("/pixels", methods=["GET"])
def get_pixels():
    """Return the current state of the pixel grid from the JSON file."""
    pixels = load_pixels()
    return jsonify(pixels)


@app.route("/update", methods=["POST"])
def update_pixel():
    """Accept pixel ID and color, update the JSON file, return success."""
    data = request.get_json(force=True, silent=True) or {}
    pixel_id = data.get("id")
    color = data.get("color")

    if pixel_id is None or color is None:
        return jsonify({"success": False, "error": "Missing 'id' or 'color'"}), 400

    try:
        idx = int(pixel_id)
        if not (0 <= idx < 400):
            return jsonify({"success": False, "error": "Invalid pixel id"}), 400
    except (TypeError, ValueError):
        return jsonify({"success": False, "error": "Invalid pixel id"}), 400
    pixel_id = str(pixel_id)

    pixels = load_pixels()
    pixels[pixel_id] = str(color).strip()
    save_pixels(pixels)
    return jsonify({"success": True})


if __name__ == "__main__":
    # Ensure pixels.json exists on startup
    load_pixels()
    app.run(debug=True, port=5000)
