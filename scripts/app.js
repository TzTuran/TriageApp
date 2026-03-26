/* =========================================
   Plant Triage – App Logic
   ========================================= */
"use strict";

const IMG_SIZE = 224;

const CLASSES = [
  { label: "Bacterial Blight",        isDiseased: true  },
  { label: "Curl Virus",              isDiseased: true  },
  { label: "Healthy Leaf",            isDiseased: false },
  { label: "Herbicide Growth Damage", isDiseased: true  },
  { label: "Leaf Hopper Jassids",     isDiseased: true  },
  { label: "Leaf Redding",            isDiseased: true  },
  { label: "Leaf Variegation",        isDiseased: true  },
];

// =========================================
// Disease information database
// =========================================
const DISEASE_INFO = {
  "Bacterial Blight": {
    severity: "High",
    severityColor: "#ef4444",
    prevention: [
      "Use certified disease-free seeds before planting",
      "Rotate crops — avoid planting cotton in the same field consecutively",
      "Remove and destroy infected plant debris after harvest",
      "Plant resistant varieties where available"
    ],
    pesticides: [
      { name: "Copper Hydroxide (Kocide)",   type: "Bactericide",          note: "Apply at first sign of infection" },
      { name: "Copper Oxychloride",           type: "Bactericide",          note: "Preventive foliar spray" },
      { name: "Streptomycin Sulfate",         type: "Antibiotic bactericide", note: "Use sparingly to avoid resistance" }
    ]
  },
  "Curl Virus": {
    severity: "High",
    severityColor: "#ef4444",
    prevention: [
      "Plant virus-resistant or tolerant cotton varieties",
      "Remove and burn infected plants immediately to prevent spread",
      "Avoid planting near other susceptible crops like tomatoes",
      "Use reflective mulches to deter whitefly vectors"
    ],
    pesticides: [
      { name: "Imidacloprid (Admire Pro)",  type: "Systemic insecticide",    note: "Controls whitefly vector — apply early season" },
      { name: "Dinotefuran (Scorpion)",      type: "Insecticide",             note: "Effective against whitefly populations" },
      { name: "Spiromesifen (Oberon)",       type: "Insecticide/Miticide",    note: "Use in rotation to prevent resistance" }
    ]
  },
  "Healthy Leaf": {
    severity: "None",
    severityColor: "#10b981",
    prevention: [
      "Continue regular field scouting to catch early signs",
      "Maintain proper irrigation and fertilization schedules",
      "Keep field free of weeds that can host pests and disease"
    ],
    pesticides: []
  },
  "Herbicide Growth Damage": {
    severity: "Medium",
    severityColor: "#f59e0b",
    prevention: [
      "Calibrate sprayers carefully before herbicide application",
      "Avoid spraying during windy conditions to prevent drift",
      "Use herbicides labeled safe for cotton at recommended rates",
      "Scout fields 5–7 days after application to catch damage early"
    ],
    pesticides: [
      { name: "No pesticide treatment",              type: "Cultural remedy",            note: "Apply foliar gibberellic acid (GA3) to aid recovery in mild cases" },
      { name: "Cytokinin-based growth stimulants",   type: "Plant growth regulator",     note: "Helps stimulate new growth after damage" }
    ]
  },
  "Leaf Hopper Jassids": {
    severity: "Medium",
    severityColor: "#f59e0b",
    prevention: [
      "Plant hairy-leaf cotton varieties — jassids avoid them naturally",
      "Use yellow sticky traps to monitor and reduce adult populations",
      "Avoid excessive nitrogen fertilizer — it attracts jassids",
      "Scout when 2+ nymphs per leaf are found with visible damage"
    ],
    pesticides: [
      { name: "Flonicamid (Carbine 50WG)",      type: "Insecticide",          note: "Best results against cotton jassids" },
      { name: "Thiamethoxam (Centric 40WG)",     type: "Systemic insecticide", note: "Effective systemic option" },
      { name: "Sulfoxaflor (Transform WG)",      type: "Insecticide",          note: "Good efficacy — rotate to prevent resistance" },
      { name: "Flupyradifurone (Sivanto Prime)", type: "Insecticide",          note: "⚠️ Avoid pyrethroids — not effective on jassids" }
    ]
  },
  "Leaf Redding": {
    severity: "Medium",
    severityColor: "#f59e0b",
    prevention: [
      "Ensure adequate potassium and phosphorus levels in the soil",
      "Avoid water stress — maintain consistent irrigation",
      "Test soil before planting to correct nutrient deficiencies early",
      "Monitor plants post-flowering when redding is most common"
    ],
    pesticides: [
      { name: "No direct pesticide",        type: "Nutritional remedy",  note: "Apply potassium foliar sprays (0-0-25 SOP) to correct deficiency" },
      { name: "Phosphoric acid fertilizer", type: "Soil amendment",       note: "Corrects phosphorus deficiency linked to redding" }
    ]
  },
  "Leaf Variegation": {
    severity: "Low",
    severityColor: "#3b82f6",
    prevention: [
      "Check for and control aphid or mite populations",
      "Ensure balanced micronutrient supply, especially magnesium and iron",
      "Use clean, certified planting material free from viral contamination",
      "Avoid mechanical injury to plants during field operations"
    ],
    pesticides: [
      { name: "Abamectin (Agri-Mek)",       type: "Miticide/Insecticide",   note: "Controls mites that cause variegation symptoms" },
      { name: "Spirotetramat (Movento)",     type: "Systemic insecticide",   note: "Controls aphid populations causing mosaic patterns" },
      { name: "Imidacloprid (Provado)",      type: "Systemic insecticide",   note: "Broad-spectrum vector control" }
    ]
  }
};

const JSONBIN_BIN_ID  = "69c4ec3bb7ec241ddca510d8";
const JSONBIN_API_KEY = "$2a$10$91AxsFlTwYO.kVHcntrxCOQOT6F.BZEEvyO.enPgQRsBd3ok/e1H2";

const MS_COUNTIES = [
  "Adams","Alcorn","Amite","Attala","Benton","Bolivar","Calhoun","Carroll",
  "Chickasaw","Choctaw","Claiborne","Clarke","Clay","Coahoma","Copiah",
  "Covington","DeSoto","Forrest","Franklin","George","Greene","Grenada",
  "Hancock","Harrison","Hinds","Holmes","Humphreys","Issaquena","Itawamba",
  "Jackson","Jasper","Jefferson","Jefferson Davis","Jones","Kemper",
  "Lafayette","Lamar","Lauderdale","Lawrence","Leake","Lee","Leflore",
  "Lincoln","Lowndes","Madison","Marion","Marshall","Monroe","Montgomery",
  "Neshoba","Newton","Noxubee","Oktibbeha","Panola","Pearl River","Perry",
  "Pike","Pontotoc","Prentiss","Quitman","Rankin","Scott","Sharkey",
  "Simpson","Smith","Stone","Sunflower","Tallahatchie","Tate","Tippah",
  "Tishomingo","Tunica","Union","Walthall","Warren","Washington","Wayne",
  "Webster","Wilkinson","Winston","Yalobusha","Yazoo"
];

// --- DOM refs ---
const fileInput      = document.getElementById("fileInput");
const uploadZone     = document.getElementById("uploadZone");
const previewWrap    = document.getElementById("previewWrap");
const leafImg        = document.getElementById("leafImg");
const clearBtn       = document.getElementById("clearBtn");
const analyzeBtn     = document.getElementById("analyzeBtn");
const statusBanner   = document.getElementById("statusBanner");
const statusText     = document.getElementById("statusText");
const resultIdle     = document.getElementById("resultIdle");
const resultSpinner  = document.getElementById("resultSpinner");
const resultOutput   = document.getElementById("resultOutput");
const resultError    = document.getElementById("resultError");
const resultErrorMsg = document.getElementById("resultErrorMsg");
const resultTop      = document.getElementById("resultTop");
const resultIcon     = document.getElementById("resultIcon");
const resultLabel    = document.getElementById("resultLabel");
const resultConf     = document.getElementById("resultConf");
const confidenceBars = document.getElementById("confidenceBars");
const diseaseInfoSection = document.getElementById("diseaseInfoSection");
const severityBadge      = document.getElementById("severityBadge");
const preventionList     = document.getElementById("preventionList");
const pesticidesList     = document.getElementById("pesticidesList");
const pesticidesBlock    = document.getElementById("pesticidesBlock");
const reportSection      = document.getElementById("reportSection");
const countySelect   = document.getElementById("countySelect");
const reportBtn      = document.getElementById("reportBtn");
const reportStatus   = document.getElementById("reportStatus");
const installBanner  = document.getElementById("installBanner");
const installBtn     = document.getElementById("installBtn");

// --- State ---
let model = null;
let imageReady = false;
let lastDetectedDisease = null;
let deferredPrompt = null;

// Populate county dropdown
MS_COUNTIES.forEach(name => {
  const opt = document.createElement("option");
  opt.value = name;
  opt.textContent = name + " County";
  countySelect.appendChild(opt);
});

// =========================================
// Model loading
// =========================================
async function loadModel() {
  setStatus("loading", "Loading AI model…");
  try {
    model = await tf.loadLayersModel("models/cotton/model.json");
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

  // Hide info/report sections on re-analysis
  diseaseInfoSection.classList.add("hidden");
  reportSection.classList.add("hidden");
  reportStatus.classList.add("hidden");
  reportStatus.textContent = "";

  showResultState("spinner");
  analyzeBtn.disabled = true;

  try {
    await tf.nextFrame();

    const input  = preprocess(leafImg);
    const logits = model.predict(input);
    const probs  = await logits.data();
    logits.dispose();
    input.dispose();

    let maxIdx = 0;
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > probs[maxIdx]) maxIdx = i;
    }

    lastDetectedDisease = CLASSES[maxIdx].label;
    renderResult(probs, maxIdx);
    showResultState("output");

    // Show disease info + report section after detection
    renderDiseaseInfo(lastDetectedDisease);
    reportSection.classList.remove("hidden");
    setTimeout(() => {
      reportSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);

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

  confidenceBars.innerHTML = "";
  CLASSES.forEach((c, i) => {
    const pct     = (probs[i] * 100).toFixed(1);
    const isTop   = i === topIdx;
    const fillCls = c.isDiseased ? "bar-fill disease" : "bar-fill";
    confidenceBars.innerHTML += `
      <div class="bar-row">
        <div>
          <div class="bar-label">${c.label}${isTop ? " ✓" : ""}</div>
          <div class="bar-track">
            <div class="${fillCls}" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="bar-pct">${pct}%</div>
      </div>`;
  });
}

// =========================================
// Disease info panel
// =========================================
function renderDiseaseInfo(label) {
  const info = DISEASE_INFO[label];
  if (!info) { diseaseInfoSection.classList.add("hidden"); return; }

  // Severity badge
  severityBadge.textContent = info.severity;
  severityBadge.style.background = severityBadgeBackground(info.severity);
  severityBadge.style.color      = severityBadgeColor(info.severity);
  severityBadge.style.borderColor = info.severityColor + "55";

  // Prevention list
  preventionList.innerHTML = info.prevention
    .map(p => `<li class="info-list-item">${p}</li>`)
    .join("");

  // Pesticides / remedies
  if (info.pesticides.length === 0) {
    pesticidesBlock.classList.add("hidden");
  } else {
    pesticidesBlock.classList.remove("hidden");
    pesticidesList.innerHTML = info.pesticides.map(p => `
      <div class="pesticide-card">
        <div class="pesticide-top">
          <span class="pesticide-name">${p.name}</span>
          <span class="pesticide-type">${p.type}</span>
        </div>
        <p class="pesticide-note">${p.note}</p>
      </div>`).join("");
  }

  diseaseInfoSection.classList.remove("hidden");
}

function severityBadgeBackground(severity) {
  const map = { High: "#fef2f2", Medium: "#fffbeb", Low: "#eff6ff", None: "#f0fdf4" };
  return map[severity] || "#f3f4f6";
}

function severityBadgeColor(severity) {
  const map = { High: "#b91c1c", Medium: "#92400e", Low: "#1d4ed8", None: "#15803d" };
  return map[severity] || "#374151";
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
    analyzeBtn.disabled = !model;
    showResultState("idle");
    reportSection.classList.add("hidden");
  };
  leafImg.src = url;
  previewWrap.classList.remove("hidden");
  uploadZone.classList.add("hidden");
}

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

clearBtn.addEventListener("click", () => {
  leafImg.src = "";
  fileInput.value = "";
  imageReady = false;
  lastDetectedDisease = null;
  analyzeBtn.disabled = true;
  previewWrap.classList.add("hidden");
  uploadZone.classList.remove("hidden");
  showResultState("idle");
  diseaseInfoSection.classList.add("hidden");
  reportSection.classList.add("hidden");
});

analyzeBtn.addEventListener("click", predict);

// Drag and drop
uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("drag-over");
});
["dragleave", "dragend"].forEach(ev =>
  uploadZone.addEventListener(ev, () => uploadZone.classList.remove("drag-over"))
);
uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("drag-over");
  const file = e.dataTransfer?.files[0];
  if (file) handleFile(file);
});

// =========================================
// Report submission
// =========================================
async function sendReport() {
  const county  = countySelect.value;
  const disease = lastDetectedDisease;

  if (!county) {
    showReportStatus("warning", "Please select a county first.");
    return;
  }
  if (!disease) {
    showReportStatus("warning", "No detection result found. Please analyze an image first.");
    return;
  }

  reportBtn.disabled = true;
  showReportStatus("sending", "Sending report…");

  try {
    // Fetch current reports
    const getRes  = await fetch(
      `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`,
      { headers: { "X-Master-Key": JSONBIN_API_KEY } }
    );
    const getData = await getRes.json();
    const reports = getData.record.reports || [];

    // Append new report
    reports.push({
      county,
      disease,
      timestamp: new Date().toISOString()
    });

    // Save back
    await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_API_KEY
      },
      body: JSON.stringify({ reports })
    });

    showReportStatus("success", `Report sent: ${disease} detected in ${county} County.`);
    countySelect.value = "";

  } catch (err) {
    console.error("Report error:", err);
    showReportStatus("error", "Failed to send. Check your internet connection.");
  } finally {
    reportBtn.disabled = false;
  }
}

function showReportStatus(type, message) {
  reportStatus.className = `report-status report-status-${type}`;
  reportStatus.textContent = message;
  reportStatus.classList.remove("hidden");
}

reportBtn.addEventListener("click", sendReport);

// =========================================
// PWA Install
// =========================================
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBanner.classList.remove("hidden");
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === "accepted") installBanner.classList.add("hidden");
  deferredPrompt = null;
});

// =========================================
// Service Worker
// =========================================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js")
    .catch(err => console.warn("SW registration failed:", err));
}

// =========================================
// Boot
// =========================================
showResultState("idle");
loadModel();
