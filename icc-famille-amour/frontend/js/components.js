(function () {
  const PAGE_ROUTE_MAP = {
    dashboard: "dashboard.html",
  };

  function normalizeLink(link) {
    if (!link) return "";
    return link.split("/").pop() || "";
  }

  function setActiveNavItem(pageId) {
    const pageName = PAGE_ROUTE_MAP[pageId] || "";

    document.querySelectorAll("nav a[href]").forEach((link) => {
      const href = normalizeLink(link.getAttribute("href") || "");
      const isActive = href === pageName && pageName !== "";

      link.classList.toggle("bg-red-50", isActive);
      link.classList.toggle("font-semibold", isActive);
      link.classList.toggle("text-red-700", isActive);
      link.classList.toggle("text-gray-600", !isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function bindMobileSidebar() {
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    const menuBtn = document.getElementById("openSidebar") || document.getElementById("menuBtn");
    const closeSidebarBtn = document.getElementById("closeSidebar") || document.getElementById("closeSidebarBtn");

    if (!sidebar || !sidebarOverlay || !menuBtn || !closeSidebarBtn) {
      return;
    }

    const closeSidebar = () => {
      sidebar.classList.add("-translate-x-full");
      sidebarOverlay.classList.add("hidden");
      document.body.classList.remove("overflow-hidden");
    };

    const openSidebar = () => {
      sidebar.classList.remove("-translate-x-full");
      sidebarOverlay.classList.remove("hidden");
      document.body.classList.add("overflow-hidden");
    };

    menuBtn.addEventListener("click", openSidebar);
    closeSidebarBtn.addEventListener("click", closeSidebar);
    sidebarOverlay.addEventListener("click", closeSidebar);

    sidebar.querySelectorAll("nav a").forEach((link) => {
      link.addEventListener("click", closeSidebar);
    });
  }

  function setSidebarUser({ name = "Administrateur", role = "Administration" } = {}) {
    const userName = document.getElementById("sidebarUserName");
    const userRole = document.getElementById("sidebarUserRole");
    const avatar = document.getElementById("sidebarAvatar");

    if (userName) userName.textContent = name;
    if (userRole) userRole.textContent = role;
    if (avatar) avatar.textContent = (name || "A").trim().charAt(0).toUpperCase() || "A";
  }

  function bindLogout() {
    const logoutBtn = document.getElementById("logoutBtn");

    if (!logoutBtn || logoutBtn.dataset.bound === "true") {
      return;
    }

    logoutBtn.dataset.bound = "true";
    logoutBtn.addEventListener("click", async () => {
      logoutBtn.disabled = true;

      try {
        if (window.ICC_API && window.ICC_API.post) {
          await window.ICC_API.post("/auth/logout");
        }
      } catch (error) {
        console.warn("Déconnexion déjà invalide ou API indisponible.", error);
      } finally {
        window.redirectTo ? window.redirectTo("login") : (window.location.href = "/login.html");
      }
    });
  }

  function bindPage(options = {}) {
    const { page = "dashboard", user = {} } = options;

    setActiveNavItem(page);
    bindMobileSidebar();
    bindLogout();
    setSidebarUser(user);
  }

  window.AppShell = {
    bindPage,
    bindMobileSidebar,
    setSidebarUser,
    bindLogout,
    setActiveNavItem,
  };
})();
