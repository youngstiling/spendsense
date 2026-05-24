import { parseCsv, DEFAULT_CATEGORIES } from "./lib/csv.js";

const CATEGORIES = DEFAULT_CATEGORIES;

const STORAGE_KEY = "spendsense-expenses";

const state = {
  expenses: loadExpenses(),
  filter: "all",
};

const $ = (sel) => document.querySelector(sel);

function loadExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveExpenses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.expenses));
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function getAllCategories() {
  const fromExpenses = state.expenses.map((e) => e.category);
  return [...new Set([...CATEGORIES, ...fromExpenses])].sort();
}

function populateCategorySelects() {
  const categorySelect = $("#category");
  const filterSelect = $("#filter-category");
  const filterValue = filterSelect.value;

  categorySelect.replaceChildren();
  filterSelect.replaceChildren(new Option("All categories", "all"));

  getAllCategories().forEach((cat) => {
    categorySelect.append(new Option(cat, cat));
    filterSelect.append(new Option(cat, cat));
  });

  if ([...filterSelect.options].some((o) => o.value === filterValue)) {
    filterSelect.value = filterValue;
  }
}

function initForm() {
  populateCategorySelects();
  $("#date").value = todayISO();

  $("#expense-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const expense = {
      id: crypto.randomUUID(),
      description: $("#description").value.trim(),
      amount: parseFloat($("#amount").value),
      category: $("#category").value,
      date: $("#date").value,
    };

    state.expenses.unshift(expense);
    saveExpenses();
    render();

    e.target.reset();
    $("#date").value = todayISO();
    $("#description").focus();
  });

  $("#filter-category").addEventListener("change", (e) => {
    state.filter = e.target.value;
    renderList();
  });
}

function initCsvImport() {
  const csvInput = $("#csv-input");
  const status = $("#import-status");

  $("#btn-import-csv").addEventListener("click", () => {
    csvInput.value = "";
    csvInput.click();
  });

  csvInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = parseCsv(reader.result);
        if (imported.length === 0) {
          showImportStatus("No expenses found in CSV. Check column headers.", true);
          return;
        }
        state.expenses = [...imported, ...state.expenses];
        saveExpenses();
        populateCategorySelects();
        render();
        showImportStatus(`Imported ${imported.length} expenses from ${file.name}`);
      } catch (err) {
        showImportStatus(err.message || "Could not parse CSV file.", true);
      }
    };
    reader.onerror = () => showImportStatus("Failed to read file.", true);
    reader.readAsText(file);
  });

  function showImportStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("error", isError);
    status.classList.remove("hidden");
    clearTimeout(showImportStatus._timer);
    showImportStatus._timer = setTimeout(() => status.classList.add("hidden"), 6000);
  }
}

function getFilteredExpenses() {
  if (state.filter === "all") return state.expenses;
  return state.expenses.filter((e) => e.category === state.filter);
}

function getTotal() {
  return state.expenses.reduce((sum, e) => sum + e.amount, 0);
}

function getThisMonthTotal() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  return state.expenses
    .filter((e) => {
      const d = new Date(e.date + "T00:00:00");
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, e) => sum + e.amount, 0);
}

function getTopCategory() {
  const totals = {};
  state.expenses.forEach((e) => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });

  let top = null;
  let max = 0;
  for (const [cat, amount] of Object.entries(totals)) {
    if (amount > max) {
      max = amount;
      top = cat;
    }
  }
  return top ? { category: top, amount: max } : null;
}

function deleteExpense(id) {
  state.expenses = state.expenses.filter((e) => e.id !== id);
  saveExpenses();
  render();
}

function renderSummary() {
  const top = getTopCategory();
  const count = state.expenses.length;

  $("#summary").innerHTML = `
    <div class="summary-card">
      <div class="label">Total spent</div>
      <div class="value">${formatCurrency(getTotal())}</div>
    </div>
    <div class="summary-card">
      <div class="label">This month</div>
      <div class="value">${formatCurrency(getThisMonthTotal())}</div>
    </div>
    <div class="summary-card">
      <div class="label">Top category</div>
      <div class="value muted">${top ? top.category : "—"}</div>
    </div>
    <div class="summary-card">
      <div class="label">Expenses</div>
      <div class="value muted">${count}</div>
    </div>
  `;
}

function renderList() {
  const filtered = getFilteredExpenses();
  const list = $("#expense-list");
  const empty = $("#empty-state");

  if (filtered.length === 0) {
    list.innerHTML = "";
    empty.classList.remove("hidden");
    empty.textContent =
      state.expenses.length === 0
        ? "No expenses yet. Add your first one above."
        : "No expenses in this category.";
    return;
  }

  empty.classList.add("hidden");
  list.innerHTML = filtered
    .map(
      (e) => `
    <li class="expense-item" data-id="${e.id}">
      <div class="expense-info">
        <div class="desc">${escapeHtml(e.description)}</div>
        <div class="meta">${escapeHtml(e.category)} · ${formatDate(e.date)}</div>
      </div>
      <span class="expense-amount">${formatCurrency(e.amount)}</span>
      <button class="btn btn-delete" aria-label="Delete expense">✕</button>
    </li>
  `
    )
    .join("");

  list.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.closest(".expense-item").dataset.id;
      deleteExpense(id);
    });
  });
}

function renderBreakdown() {
  const container = $("#category-breakdown");

  if (state.expenses.length === 0) {
    container.innerHTML =
      '<p class="breakdown-empty">Add expenses to see a breakdown.</p>';
    return;
  }

  const totals = {};
  state.expenses.forEach((e) => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });

  const max = Math.max(...Object.values(totals));

  container.innerHTML = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([cat, amount]) => `
      <div class="breakdown-row">
        <span class="breakdown-label">${escapeHtml(cat)}</span>
        <div class="breakdown-bar-track">
          <div class="breakdown-bar-fill" style="width: ${(amount / max) * 100}%"></div>
        </div>
        <span class="breakdown-amount">${formatCurrency(amount)}</span>
      </div>
    `
    )
    .join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function render() {
  renderSummary();
  renderList();
  renderBreakdown();
}

initForm();
initCsvImport();
render();
