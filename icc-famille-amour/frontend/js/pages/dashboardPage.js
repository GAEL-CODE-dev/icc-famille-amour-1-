import { getCurrentAdmin } from "../services/authService.js";
import { createSidebar } from "../components/sidebar.js";
import { createStatsCard } from "../components/statsCard.js";

async function initDashboardPage() {
  const admin = await getCurrentAdmin();

  const app = document.getElementById("app-shell");
  if (app) {
    app.appendChild(createSidebar({ currentUser: admin, page: "dashboard" }));
  }

  const statsGrid = document.getElementById("stats-grid");
  if (statsGrid) {
    statsGrid.appendChild(createStatsCard({ label: "Membres", value: "0" }));
    statsGrid.appendChild(createStatsCard({ label: "Actifs", value: "0", tone: "danger" }));
    statsGrid.appendChild(createStatsCard({ label: "Inactifs", value: "0" }));
  }

  const nameEl = document.getElementById("welcome-name");
  if (nameEl) nameEl.textContent = admin.nom;
}

window.initDashboardPage = initDashboardPage;
export { initDashboardPage };
