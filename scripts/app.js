/* =========================================
   LeafDetect – App Logic (Fixed & Improved)
   ========================================= */

"use strict";

const IMG_SIZE = 224;

// Class labels — sorted alphabetically (matches sklearn LabelEncoder order)
const CLASSES = [
  { label: "Bacterial Blight",        isDiseased: true  },
  { label: "Curl Virus",              isDiseased: true  },
  { label: "Healthy Leaf",            isDiseased: false },
  { label: "Herbicide Growth Damage", isDiseased: true  },
  { label: "Leaf Hopper Jassids",     isDiseased: true  },
  { label: "Leaf Redding",            isDiseased: true  },
  { label: "Leaf Variegation",        isDiseased: true  },
];

// --- DOM refs ---
const fileInput    = document.getElementById("fileInput");
const uploadZone   = document.getElementById("uploadZone");
const previewWrap  = document.getElementById("previewWrap");
const leafImg      = document.getElementById("leafImg");
const clearBtn     = document.getElementById("clearBtn");
const analyzeBtn   = document.getElementById("analyzeBtn");

const statusBanner = document.getElementById("statusBanner");
const statusText   = document.getElementById("statusText");

const resultIdle    = document.getElementById("resultIdle");
const resultSpinner = document.getElementById("resultSpinner");
const resultOutput  = document.getElementById("resultOutput");
const resultError   = document.getElementById("resultError");
const resultErrorMsg = document.getElementById("resultErrorMsg");

const resultIcon    = document.getElementById("resultIcon");
const resultLabel   = document.getElementById("resultLabel");
const resultConf    = document.getElementById("resultConf");
const confidenceBars = document.getElementById("confidenceBars");
const resultTop     = resultOutput.querySelector(".result-top");

// --- State ---
let model = null;
let imageReady = false;

// =========================================
// Model loading
// =========================================
async function loadModel() {
  setStatus("loading", "Loading AI model…");
  try {
    model = await tf.loadLayersModel("models/cotton/model.json");
    // Warm-up: run a dummy tensor so first real prediction is fast
    const dummy = tf.zeros([1, IMG_SIZE, IMG_SIZE, 3]);
    const warm  = model.predict(dummy);
    warm.dispose();
    dummy.dispose();

    setStatus("ready", "Model ready — select a leaf image to begin.");
  } catch (err) {
    console.error("Model load error:", err);
    setStatus("error", "Failed to load model. Make sure model files are present.");
  }
}

// =========================================
// Status banner
// =========================================
function setStatus(type, message) {
  statusBanner.className = `status-banner ${type}`;
  statusText.textContent = message;
}

// =========================================
// Preprocessing
// =========================================
function preprocess(imgEl) {
  return tf.tidy(() =>
    tf.browser
      .fromPixels(imgEl)
      .resizeNearestNeighbor([IMG_SIZE, IMG_SIZE])
      .toFloat()
      .div(255.0)
      .expandDims(0)
  );
}

// =========================================
// Prediction
// =========================================
async function predict() {
  if (!model || !imageReady) return;

  showResultState("spinner");
  analyzeBtn.disabled = true;

  try {
    await tf.nextFrame(); // Let the spinner render

    const input  = preprocess(leafImg);
    const logits = model.predict(input);
    const probs  = await logits.data();
    logits.dispose();
    input.dispose();

    // Find top class
    let maxIdx = 0;
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > probs[maxIdx]) maxIdx = i;
    }

    renderResult(probs, maxIdx);
    showResultState("output");
  } catch (err) {
    console.error("Prediction error:", err);
    resultErrorMsg.textContent = "Inference failed: " + (err.message || "unknown error");
    showResultState("error");
  } finally {
    analyzeBtn.disabled = false;
  }
}

// =========================================
// Render result
// =========================================
function renderResult(probs, topIdx) {
  const cls  = CLASSES[topIdx];
  const conf = probs[topIdx] * 100;

  resultIcon.textContent = cls.isDiseased ? "🔴" : "🟢";
  resultLabel.textContent = cls.label;
  resultConf.textContent  = conf.toFixed(1) + "%";

  if (cls.isDiseased) {
    resultTop.classList.add("disease");
    resultConf.style.color = "var(--red-700)";
  } else {
    resultTop.classList.remove("disease");
    resultConf.style.color = "var(--green-700)";
  }

  // Build confidence bars
  confidenceBars.innerHTML = "";
  CLASSES.forEach((c, i) => {
    const pct = (probs[i] * 100).toFixed(1);
    const isTop = i === topIdx;
    const fillClass = c.isDiseased ? "bar-fill disease" : "bar-fill";

    confidenceBars.innerHTML += `
      <div class="bar-row">
        <div>
          <div class="bar-label">${c.label}${isTop ? " ✓" : ""}</div>
          <div class="bar-track">
            <div class="${fillClass}" style="width: ${pct}%"></div>
          </div>
        </div>
        <div class="bar-pct">${pct}%</div>
      </div>
    `;
  });
}

// =========================================
// Result state machine
// =========================================
function showResultState(state) {
  resultIdle.classList.add("hidden");
  resultSpinner.classList.add("hidden");
  resultOutput.classList.add("hidden");
  resultError.classList.add("hidden");

  if (state === "idle")    resultIdle.classList.remove("hidden");
  if (state === "spinner") resultSpinner.classList.remove("hidden");
  if (state === "output")  resultOutput.classList.remove("hidden");
  if (state === "error")   resultError.classList.remove("hidden");
}

// =========================================
// Image selection
// =========================================
function handleFile(file) {
  if (!file || !file.type.startsWith("image/")) return;

  const url = URL.createObjectURL(file);
  leafImg.onload = () => {
    imageReady = true;
    // Only enable analyze if model is ready
    analyzeBtn.disabled = !model;
    showResultState("idle");
  };
  leafImg.src = url;
  previewWrap.classList.remove("hidden");
  uploadZone.classList.add("hidden");
}

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

// Clear image
clearBtn.addEventListener("click", () => {
  leafImg.src = "";
  fileInput.value = "";
  imageReady = false;
  analyzeBtn.disabled = true;
  previewWrap.classList.add("hidden");
  uploadZone.classList.remove("hidden");
  showResultState("idle");
});

// Analyze click
analyzeBtn.addEventListener("click", predict);

// =========================================
// Drag-and-drop
// =========================================
uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("drag-over");
});

["dragleave", "dragend"].forEach((ev) => {
  uploadZone.addEventListener(ev, () => uploadZone.classList.remove("drag-over"));
});

uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("drag-over");
  const file = e.dataTransfer?.files[0];
  if (file) handleFile(file);
});

// =========================================
// PWA Service Worker
// =========================================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js")
    .catch((err) => console.warn("SW registration failed:", err));
}

// =========================================
// Boot
// =========================================
showResultState("idle");
loadModel();
