const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">' +
    '<rect width="400" height="600" fill="#f0e8d8"/>' +
    '<rect x="20" y="20" width="360" height="560" fill="none" stroke="#d4a5a5" stroke-width="3"/>' +
    '<text x="200" y="310" font-family="serif" font-size="28" text-anchor="middle" fill="#6d2232">Cover coming soon</text>' +
    "</svg>"
  );

let books = [];
let activeGenre = "All";
let searchQuery = "";

function sortTitle(title) {
  return title.replace(/^the\s+/i, "");
}

const bookGrid = document.getElementById("bookGrid");
const genreFilters = document.getElementById("genreFilters");
const searchInput = document.getElementById("searchInput");
const resultCount = document.getElementById("resultCount");
const surpriseBtn = document.getElementById("surpriseBtn");
const bookModalEl = document.getElementById("bookModal");
const bookModal = new bootstrap.Modal(bookModalEl);

fetch("books.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }
    return response.json();
  })
  .then((data) => {
    books = data.sort((a, b) =>
      sortTitle(a.title).localeCompare(sortTitle(b.title))
    );
    renderGenreFilters();
    renderBooks();
  })
  .catch((error) => {
    console.error("Could not load books.json:", error);
    bookGrid.innerHTML =
      '<div class="col-12"><div class="alert alert-danger">' +
      "Could not load books.json. If you opened index.html directly, " +
      "run the project with a local server (e.g., VS Code Live Server) " +
      "or view it through GitHub Pages." +
      "</div></div>";
  });

function getGenres() {
  const genres = [];
  books.forEach((book) => {
    book.genre.forEach((g) => {
      if (!genres.includes(g)) {
        genres.push(g);
      }
    });
  });
  return genres.sort();
}

function countByGenre(genre) {
  return books.filter((book) => book.genre.includes(genre)).length;
}

function renderGenreFilters() {
  const genres = ["All", ...getGenres()];
  genreFilters.innerHTML = genres
    .map((genre) => {
      const n = genre === "All" ? books.length : countByGenre(genre);
      return `<button type="button" class="filter-btn${genre === activeGenre ? " active" : ""
        }" data-genre="${genre}">${genre} (${n})</button>`;
    })
    .join("");
}

function getFilteredBooks() {
  const query = searchQuery.trim().toLowerCase();
  return books.filter((book) => {
    const matchesGenre =
      activeGenre === "All" || book.genre.includes(activeGenre);
    const matchesSearch =
      query === "" ||
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query);
    return matchesGenre && matchesSearch;
  });
}

function renderBooks() {
  const filtered = getFilteredBooks();

  resultCount.textContent =
    filtered.length + (filtered.length === 1 ? " volume" : " volumes");

  if (filtered.length === 0) {
    bookGrid.innerHTML =
      '<div class="col-12 text-center text-muted py-5">No books match your search.</div>';
    return;
  }

  bookGrid.innerHTML = filtered
    .map(
      (book) => `
      <div class="col-6 col-md-4 col-lg-3 shelf-slot">
        <div class="book-wrap" data-id="${book.id}" tabindex="0" role="button"
             aria-label="Open details for ${book.title}">
          <div class="book-stage">
            <div class="book">
              <img class="book-cover" src="${book.cover}" alt="Cover of ${book.title}"
                   onerror="this.onerror=null;this.src=PLACEHOLDER;">
            </div>
          </div>
          <div class="book-info">
            <div class="book-title">${book.title}</div>
            <div class="book-author">${book.author}</div>
            <div class="book-genre">${book.genre.join(", ")}</div>
          </div>
        </div>
      </div>`
    )
    .join("");
}

function setGenre(genre) {
  activeGenre = genre;
  renderGenreFilters();
  renderBooks();
}

function openBook(id) {
  const book = books.find((b) => b.id === Number(id));
  if (!book) return;

  document.getElementById("modalTitle").textContent = book.title;
  document.getElementById("modalAuthor").textContent = book.author;
  document.getElementById("modalGenre").textContent = book.genre.join(", ");
  document.getElementById("modalDate").textContent = book.publicationDate;
  document.getElementById("modalDescription").textContent = book.description;

  const cover = document.getElementById("modalCover");
  cover.onerror = function () {
    cover.onerror = null;
    cover.src = PLACEHOLDER;
  };
  cover.src = book.cover;
  cover.alt = "Cover of " + book.title;

  bookModal.show();
}

genreFilters.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-genre]");
  if (!btn) return;
  setGenre(btn.dataset.genre);
});

searchInput.addEventListener("input", (event) => {
  searchQuery = event.target.value;
  renderBooks();
});

bookGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".book-wrap");
  if (!card) return;
  openBook(card.dataset.id);
});

bookGrid.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest(".book-wrap");
  if (!card) return;
  event.preventDefault();
  openBook(card.dataset.id);
});

surpriseBtn.addEventListener("click", () => {
  if (books.length === 0) return;
  const pool = getFilteredBooks();
  const source = pool.length > 0 ? pool : books;
  const pick = source[Math.floor(Math.random() * source.length)];
  openBook(pick.id);
});