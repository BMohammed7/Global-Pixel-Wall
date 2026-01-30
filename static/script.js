/**
 * Global Pixel Wall - Frontend
 * Loads pixel state from backend, renders 20x20 grid, sends updates on color change.
 */

(function () {
  const GRID_SIZE = 20;
  const TOTAL_PIXELS = GRID_SIZE * GRID_SIZE;

  const loadingEl = document.getElementById("loading");
  const gridContainerEl = document.getElementById("grid-container");
  const pixelGridEl = document.getElementById("pixel-grid");
  const colorPickerEl = document.getElementById("color-picker");

  let pixelState = {};
  let pendingPixelId = null;

  function showLoading(show) {
    loadingEl.hidden = !show;
    gridContainerEl.hidden = show;
  }

  function renderGrid(state) {
    pixelState = state;
    pixelGridEl.innerHTML = "";

    for (let i = 0; i < TOTAL_PIXELS; i++) {
      const id = String(i);
      const color = state[id] || "#1a1a2e";

      const cell = document.createElement("button");
      cell.className = "pixel";
      cell.type = "button";
      cell.dataset.id = id;
      cell.style.backgroundColor = color;
      cell.setAttribute("aria-label", `Pixel ${id}, color ${color}`);

      cell.addEventListener("click", function () {
        openColorPicker(id, color);
      });

      pixelGridEl.appendChild(cell);
    }
  }

  function openColorPicker(id, currentColor) {
    pendingPixelId = id;
    colorPickerEl.value = currentColor;
    colorPickerEl.click();
  }

  colorPickerEl.addEventListener("input", function () {
    const color = colorPickerEl.value;
    if (pendingPixelId == null) return;
    const id = pendingPixelId;
    pendingPixelId = null;

    updatePixelLocally(id, color);
    sendUpdate(id, color);
  });

  function updatePixelLocally(id, color) {
    pixelState[id] = color;
    const cell = pixelGridEl.querySelector(`[data-id="${id}"]`);
    if (cell) {
      cell.style.backgroundColor = color;
      cell.setAttribute("aria-label", `Pixel ${id}, color ${color}`);
    }
  }

  function sendUpdate(id, color) {
    fetch("/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, color }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          console.error("Update failed:", data.error);
        }
      })
      .catch((err) => {
        console.error("Request failed:", err);
      });
  }

  function loadPixels() {
    showLoading(true);

    fetch("/pixels")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load pixels");
        return res.json();
      })
      .then((state) => {
        renderGrid(state);
        showLoading(false);
      })
      .catch((err) => {
        console.error(err);
        loadingEl.querySelector("p").textContent = "Could not load grid. Check the server.";
      });
  }

  loadPixels();
})();
