const DATA_URL = "https://raw.githubusercontent.com/code-cracked/plants-vs-zombies-api/main/data/";
const IMAGE_BASE = "https://pvz-2-api.vercel.app";

const params = new URLSearchParams(window.location.search);
const category = params.get("category") === "zombies" ? "zombies" : "plants";
const characterName = params.get("name") || "";
const page = params.get("page") || "1";
const search = params.get("search") || "";

const statusArea = document.getElementById("statusArea");
const characterDetails = document.getElementById("characterDetails");
const backButton = document.getElementById("backButton");

backButton.href =
  "index.html?category=" + category +
  "&page=" + page +
  "&search=" + encodeURIComponent(search);

function formatLabel(text) {
  let words = text.replace(/_/g, " ").split(" ");
  for (let i = 0; i < words.length; i++) {
    words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
  }
  return words.join(" ");
}

function showLoading() {
  statusArea.innerHTML = `
    <div class="status-box text-center">
      <div class="spinner-border game-spinner" role="status"></div>
      <p class="mt-3 mb-0">Opening the Almanac page...</p>
    </div>`;
}

function showError(message) {
  message = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  statusArea.innerHTML = `
    <div class="status-box status-error text-center">
      <p class="status-heading">Entry not found</p>
      <p class="mb-3">${message}</p>
      <a href="${backButton.href}" class="btn btn-game btn-game-orange">Back to List</a>
    </div>`;
}

async function loadCharacter() {
  if (characterName === "") {
    showError("No character was selected. Go back and choose a plant or zombie.");
    return;
  }

  showLoading();

  try {
    const response = await fetch(DATA_URL + category + ".json");
    if (!response.ok) {
      throw new Error("The " + category + " data could not be loaded (status " + response.status + ").");
    }
    const json = await response.json();
    const data = json.data[characterName];

    if (!data) {
      throw new Error("No such " + (category === "plants" ? "plant" : "zombie") + " exists: \"" + characterName + "\".");
    }
    statusArea.innerHTML = "";
    showCharacter(data);
  } catch (error) {
    showError("Could not load this character. " + error.message);
  }
}

function showCharacter(data) {
  const name = formatLabel(data.name || characterName);
  document.title = name + " | Garden Almanac";

  let family = "";
  let statsHtml = "";

  for (const key in data) {
    const lowerKey = key.toLowerCase();
    const value = data[key];

    if (lowerKey === "name" || lowerKey === "image") continue;
    if (lowerKey === "description" || lowerKey === "story") continue;

    if (lowerKey === "family") family = value;

    let valueClass = "stat-value";
    if (String(value).length > 22) valueClass = "stat-value stat-value-long";

    statsHtml += `
      <div class="col-sm-6">
        <div class="stat-item">
          <p class="stat-label">${formatLabel(key)}</p>
          <p class="${valueClass}">${value}</p>
        </div>
      </div>`;
  }

  if (statsHtml === "") {
    statsHtml = `<p class="almanac-text">The API has no stats for this character.</p>`;
  }

  let tag = category === "plants" ? "Plant" : "Zombie";
  if (family !== "") tag = family;

  let imageHtml = `<div class="detail-placeholder">?</div>`;
  if (data.image) {
    imageHtml = `<img src="${IMAGE_BASE + encodeURI(data.image)}" alt="${name}" class="detail-img" />`;
  }

  const story = data.story || data.description || "";
  let storyHtml = `<p class="almanac-text">The API has no story entry for this character.</p>`;
  if (story !== "") storyHtml = `<p class="almanac-text">${story}</p>`;

  const themeClass = category === "plants" ? "theme-plants" : "theme-zombies";

  characterDetails.innerHTML = `
    <div class="almanac-card ${themeClass}">
      <div class="row g-0">
        <div class="col-lg-5">
          <div class="art-panel h-100">
            <h1 class="detail-name">${name}</h1>
            <div class="detail-art">${imageHtml}</div>
            <div class="art-ribbon">${category === "plants" ? "Plant" : "Zombie"}</div>
          </div>
        </div>
        <div class="col-lg-7">
          <div class="info-panel h-100">
            <span class="detail-tag">${tag}</span>
            <div class="tab-content">
              <div class="tab-pane fade show active" id="statsPane" role="tabpanel">
                <div class="row g-3">${statsHtml}</div>
              </div>
              <div class="tab-pane fade" id="storyPane" role="tabpanel">
                ${storyHtml}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <ul class="nav almanac-tabs" role="tablist">
      <li class="nav-item" role="presentation">
        <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#statsPane" type="button" role="tab">Stats</button>
      </li>
      <li class="nav-item" role="presentation">
        <button class="nav-link" data-bs-toggle="tab" data-bs-target="#storyPane" type="button" role="tab">Story</button>
      </li>
    </ul>`;
}

loadCharacter();
