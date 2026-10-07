import { api, ApiClientError } from "../api.js";

async function init() {
  try {
    const { admin } = await api.get("/auth/me");
    const nomEl = document.getElementById("admin-nom");
    if (nomEl) nomEl.textContent = `, ${admin.nom}`;
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 401) {
      window.location.href = "./login.html";
    }
  }
}

document.getElementById("logout-btn")?.addEventListener("click", async () => {
  await api.post("/auth/logout");
  window.location.href = "./login.html";
});

init();
