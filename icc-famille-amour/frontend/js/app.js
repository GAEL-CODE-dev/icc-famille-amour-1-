import "./core/router.js";
import "./core/state.js";
import "./core/api.js";

window.ICCApp = {
  boot: async function boot() {
    const page = document.body.dataset.page || "home";
    if (page === "login") {
      const { initLoginPage } = await import("./pages/loginPage.js");
      initLoginPage();
    }

    if (page === "dashboard") {
      const { initDashboardPage } = await import("./pages/dashboardPage.js");
      initDashboardPage();
    }
  },
};

window.addEventListener("DOMContentLoaded", () => {
  window.ICCApp.boot();
});
