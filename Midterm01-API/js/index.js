const DATA_URL = "https://raw.githubusercontent.com/code-cracked/plants-vs-zombies-api/main/data/";
const IMAGE_BASE = "https://pvz-2-api.vercel.app";
const CARDS_PER_PAGE = 12;

let plantList = [];
let zombieList = [];

let plantData = {};
let zombieData = {};

let plantPage = 1;
let zombiePage = 1;
let plantSearch = "";
let zombieSearch = "";

let currentCategory = "plants";

const plantsTab = document.getElementById("plantsTab");
const zombiesTab = document.getElementById("zombiesTab");
const navPlants = document.getElementById("navPlants");
const navZombies = document.getElementById("navZombies");
const woodFrame = document.getElementById("woodFrame");
const collectionTitle = document.getElementById("collectionTitle");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const statusArea = document.getElementById("statusArea");
const characterGrid = document.getElementById("characterGrid");
const resultCount = document.getElementById("resultCount");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const prevItem = document.getElementById("prevItem");
const nextItem = document.getElementById("nextItem");
const pageNumber = document.getElementById("pageNumber");

function formatName(name) {
  let words = name.split(" ");
  for (let i = 0; i < words.length; i++) {
    words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
  }
  return words.join(" ");
}

function safeText(text) {
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function readUrlValues() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  const page = parseInt(params.get("page"));
  const search = params.get("search") || "";

  if (category === "zombies") {
    currentCategory = "zombies";
  }

  if (currentCategory === "plants") {
    plantSearch = search;
    if (page > 0) plantPage = page;
  } else {
    zombieSearch = search;
    if (page > 0) zombiePage = page;
  }
}

async function getList(category) {
  if (category === "plants" && plantList.length > 0) return plantList;
  if (category === "zombies" && zombieList.length > 0) return zombieList;

  const response = await fetch(DATA_URL + category + ".json");
  if (!response.ok) {
    throw new Error("The server answered with status " + response.status);
  }
  const json = await response.json();

  let names = [];
  for (const key in json.data) {
    names.push(key);
  }

  if (category === "plants") {
    plantList = names;
    plantData = json.data;
  } else {
    zombieList = names;
    zombieData = json.data;
  }
  return names;
}

function showLoading() {
  characterGrid.innerHTML = "";
  statusArea.innerHTML = `
    <div class="status-box text-center">
      <div class="spinner-border game-spinner" role="status"></div>
      <p class="mt-3 mb-0">Planting the seeds... loading the Almanac</p>
    </div>`;
}

function showError(message) {
  characterGrid.innerHTML = "";
  statusArea.innerHTML = `
    <div class="status-box status-error text-center">
      <p class="status-heading">The zombies ate the connection!</p>
      <p class="mb-3">${message}</p>
      <button type="button" class="btn btn-game btn-game-orange" id="retryBtn">Try Again</button>
    </div>`;
  document.getElementById("retryBtn").addEventListener("click", loadCategory);
}

function updateCategoryLook() {
  if (currentCategory === "plants") {
    plantsTab.classList.add("active");
    zombiesTab.classList.remove("active");
    woodFrame.classList.remove("frame-zombies");
    collectionTitle.textContent = "Plant Almanac";
    searchInput.placeholder = "Search for a plant...";
    searchInput.value = plantSearch;
  } else {
    zombiesTab.classList.add("active");
    plantsTab.classList.remove("active");
    woodFrame.classList.add("frame-zombies");
    collectionTitle.textContent = "Zombie Almanac";
    searchInput.placeholder = "Search for a zombie...";
    searchInput.value = zombieSearch;
  }
}

async function loadCategory() {
  updateCategoryLook();
  showLoading();

  try {
    await getList(currentCategory);
    statusArea.innerHTML = "";
    showCards();
  } catch (error) {
    showError("We could not load the " + currentCategory + " list. " + error.message);
  }
}

function showCards() {
  let fullList = plantList;
  let searchText = plantSearch;
  let page = plantPage;

  if (currentCategory === "zombies") {
    fullList = zombieList;
    searchText = zombieSearch;
    page = zombiePage;
  }

  let results = [];
  for (let i = 0; i < fullList.length; i++) {
    if (fullList[i].toLowerCase().includes(searchText.toLowerCase())) {
      results.push(fullList[i]);
    }
  }

  let totalPages = Math.ceil(results.length / CARDS_PER_PAGE);
  if (totalPages < 1) totalPages = 1;
  if (page > totalPages) page = totalPages;
  if (currentCategory === "plants") {
    plantPage = page;
  } else {
    zombiePage = page;
  }

  const start = (page - 1) * CARDS_PER_PAGE;
  const pageItems = results.slice(start, start + CARDS_PER_PAGE);

  if (results.length === 0) {
    characterGrid.innerHTML = "";
    statusArea.innerHTML = `
      <div class="status-box text-center">
        <p class="status-heading">No ${currentCategory} found</p>
        <p class="mb-0">Nothing on this lawn matches "<strong>${safeText(searchText)}</strong>". Try another name.</p>
      </div>`;
  } else {
    statusArea.innerHTML = "";
  }

  let characterData = currentCategory === "plants" ? plantData : zombieData;
  let cardsHtml = "";
  for (let i = 0; i < pageItems.length; i++) {
    const name = pageItems[i];
    const imagePath = characterData[name].image || "";
    const viewLink =
      "view.html?category=" + currentCategory +
      "&name=" + encodeURIComponent(name) +
      "&page=" + page +
      "&search=" + encodeURIComponent(searchText);

    cardsHtml += `
      <div class="col">
        <a href="${viewLink}" class="card seed-card h-100 text-decoration-none">
          <div class="seed-art">
            <img src="${IMAGE_BASE + encodeURI(imagePath)}" alt="${formatName(name)}" class="seed-img" id="cardImage${i}" />
            <span class="seed-placeholder" id="cardPlaceholder${i}">?</span>
          </div>
          <div class="card-body seed-body">
            <h3 class="seed-name">${formatName(name)}</h3>
            <span class="seed-view">View Details</span>
          </div>
        </a>
      </div>`;
  }
  characterGrid.innerHTML = cardsHtml;

  resultCount.textContent = formatTitle(currentCategory) + " found: " + results.length + " of " + fullList.length;
  pageNumber.textContent = "Page " + page + " of " + totalPages;
  prevBtn.disabled = page <= 1;
  nextBtn.disabled = page >= totalPages;
  prevItem.classList.toggle("disabled", page <= 1);
  nextItem.classList.toggle("disabled", page >= totalPages);

  for (let i = 0; i < pageItems.length; i++) {
    showWhenLoaded(i);
  }
}

function formatTitle(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function showWhenLoaded(index) {
  const image = document.getElementById("cardImage" + index);
  const placeholder = document.getElementById("cardPlaceholder" + index);

  if (image.complete && image.naturalWidth > 0) {
    image.classList.add("loaded");
    placeholder.classList.add("d-none");
    return;
  }
  image.onload = function () {
    image.classList.add("loaded");
    placeholder.classList.add("d-none");
  };
}

function switchCategory(category) {
  currentCategory = category;
  loadCategory();
}


plantsTab.addEventListener("click", function () {
  switchCategory("plants");
});

zombiesTab.addEventListener("click", function () {
  switchCategory("zombies");
});

navPlants.addEventListener("click", function () {
  switchCategory("plants");
});

navZombies.addEventListener("click", function () {
  switchCategory("zombies");
});

function runSearch() {
  if (currentCategory === "plants") {
    plantSearch = searchInput.value.trim();
    plantPage = 1;
  } else {
    zombieSearch = searchInput.value.trim();
    zombiePage = 1;
  }
  showCards();
}

searchForm.addEventListener("submit", function (event) {
  event.preventDefault();
  runSearch();
});

searchInput.addEventListener("input", function () {
  if (currentCategory === "plants" && plantList.length > 0) runSearch();
  if (currentCategory === "zombies" && zombieList.length > 0) runSearch();
});

prevBtn.addEventListener("click", function () {
  if (currentCategory === "plants") {
    plantPage = plantPage - 1;
  } else {
    zombiePage = zombiePage - 1;
  }
  showCards();
  woodFrame.scrollIntoView({ behavior: "smooth" });
});

nextBtn.addEventListener("click", function () {
  if (currentCategory === "plants") {
    plantPage = plantPage + 1;
  } else {
    zombiePage = zombiePage + 1;
  }
  showCards();
  woodFrame.scrollIntoView({ behavior: "smooth" });
});

readUrlValues();
loadCategory();
if (window.location.search !== "") {
  document.getElementById("collection").scrollIntoView();
}
