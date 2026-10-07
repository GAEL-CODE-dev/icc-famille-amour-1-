import { api, ApiClientError } from "../api.js";

const listEl = document.getElementById("admins-list");
const listErrorEl = document.getElementById("list-error");
const accessDeniedEl = document.getElementById("access-denied");
const openCreateBtn = document.getElementById("open-create");
const createPanel = document.getElementById("create-panel");
const createForm = document.getElementById("create-form");
const createErrorEl = document.getElementById("create-error");

const ROLE_LABELS = {
  super_admin: "Super-administrateur",
  tresorier: "Trésorier",
  secretaire: "Secrétaire",
};

function showListError(message) {
  listErrorEl.textContent = message;
  listErrorEl.classList.remove("hidden");
}

function renderAdmins(admins, currentAdminId) {
  listEl.innerHTML = "";
  if (admins.length === 0) {
    listEl.innerHTML = `<p class="p-4 text-sm" style="color: var(--icc-ink-soft);">Aucun administrateur.</p>`;
    return;
  }

  for (const admin of admins) {
    const row = document.createElement("div");
    row.className = "p-4 flex items-center justify-between gap-3 flex-wrap";
    row.innerHTML = `
      <div>
        <p class="text-sm font-medium">${escapeHtml(admin.nom)} ${admin.id === currentAdminId ? "<span class='text-xs' style='color: var(--icc-ink-soft);'>(vous)</span>" : ""}</p>
        <p class="text-xs" style="color: var(--icc-ink-soft);">${escapeHtml(admin.email)}</p>
      </div>
      <div class="flex items-center gap-2">
        <select data-action="role" data-id="${admin.id}" class="text-sm border rounded-lg px-2 py-1" style="border-color: var(--icc-line);">
          ${Object.entries(ROLE_LABELS)
            .map(
              ([value, label]) =>
                `<option value="${value}" ${admin.role === value ? "selected" : ""}>${label}</option>`
            )
            .join("")}
        </select>
        <button
          data-action="toggle-actif" data-id="${admin.id}" data-actif="${admin.actif}"
          class="text-xs px-3 py-1.5 rounded-lg border"
          style="border-color: var(--icc-line); ${admin.actif ? "" : "color: var(--icc-red-dark);"}"
        >
          ${admin.actif ? "Actif" : "Désactivé"}
        </button>
      </div>
    `;
    listEl.appendChild(row);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

async function loadAdmins(currentAdminId) {
  try {
    const { admins } = await api.get("/admins");
    renderAdmins(admins, currentAdminId);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 403) {
      accessDeniedEl.classList.remove("hidden");
      openCreateBtn.classList.add("hidden");
      listEl.classList.add("hidden");
    } else {
      showListError("Impossible de charger la liste des administrateurs.");
    }
  }
}

listEl.addEventListener("change", async (event) => {
  const target = event.target;
  if (target.dataset.action === "role") {
    await applyUpdate(target.dataset.id, { role: target.value });
  }
});

listEl.addEventListener("click", async (event) => {
  const btn = event.target.closest("[data-action='toggle-actif']");
  if (!btn) return;
  const actif = btn.dataset.actif === "true";
  await applyUpdate(btn.dataset.id, { actif: !actif });
});

async function applyUpdate(id, fields) {
  try {
    await api.put(`/admins/${id}`, fields);
    const me = await api.get("/auth/me");
    await loadAdmins(me.admin.id);
  } catch (err) {
    const message =
      err instanceof ApiClientError ? err.message : "La mise à jour a échoué.";
    showListError(message);
  }
}

openCreateBtn.addEventListener("click", () => {
  createErrorEl.classList.add("hidden");
  createForm.reset();
  createPanel.classList.remove("hidden");
  createPanel.classList.add("flex");
});

document.getElementById("cancel-create").addEventListener("click", () => {
  createPanel.classList.add("hidden");
  createPanel.classList.remove("flex");
});

createForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  createErrorEl.classList.add("hidden");

  const data = Object.fromEntries(new FormData(createForm).entries());
  try {
    await api.post("/admins", data);
    createPanel.classList.add("hidden");
    createPanel.classList.remove("flex");
    const me = await api.get("/auth/me");
    await loadAdmins(me.admin.id);
  } catch (err) {
    createErrorEl.textContent =
      err instanceof ApiClientError ? err.message : "La création a échoué.";
    createErrorEl.classList.remove("hidden");
  }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await api.post("/auth/logout");
  window.location.href = "../login.html";
});

async function init() {
  try {
    const { admin } = await api.get("/auth/me");
    await loadAdmins(admin.id);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 401) {
      window.location.href = "../login.html";
    }
  }
}

init();
