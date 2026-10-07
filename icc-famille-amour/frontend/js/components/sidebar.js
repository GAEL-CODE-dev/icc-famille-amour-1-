function createSidebar({ currentUser = null, page = "dashboard" } = {}) {
  const navItems = [
    { key: "dashboard", label: "Tableau de bord", href: "/pages/dashboard.html", icon: "layout-dashboard" },
    { key: "registration", label: "Enregistrement membre", href: "/index.html", icon: "user-round-plus" },
  ];

  const userName = currentUser?.nom || "Administrateur";
  const initials = (userName || "A").trim().charAt(0).toUpperCase() || "A";

  const markup = `
    <aside id="sidebar" class="fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col border-r border-gray-100 bg-white shadow-xl transition-transform duration-300 lg:translate-x-0">
      <div class="flex h-20 shrink-0 items-center justify-between border-b px-5">
        <a href="/index.html" class="flex items-center gap-3 rounded-xl">
          <img src="/logo/edcf925a-ec94-41cc-bbc4-f971ba7298c3.JPG" alt="Logo ICC Famille Amour" class="h-11 w-11 rounded-xl object-cover shadow-sm" />
          <div>
            <p class="font-bold leading-tight text-gray-900">ICC Famille</p>
            <p class="text-sm font-medium text-red-700">Amour</p>
          </div>
        </a>
        <button id="closeSidebar" type="button" class="rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 lg:hidden" aria-label="Fermer le menu">
          <i data-lucide="x" class="h-5 w-5"></i>
        </button>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto p-4">
        <p class="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Principal</p>
        ${navItems
          .map(
            (item) => `
              <a href="${item.href}" class="group flex items-center gap-3 rounded-xl px-4 py-3 text-gray-600 transition hover:bg-red-50 hover:text-red-700 ${page === item.key ? "bg-red-50 font-semibold text-red-700" : ""}">
                <i data-lucide="${item.icon}" class="h-5 w-5"></i>
                <span>${item.label}</span>
              </a>
            `
          )
          .join("")}
      </nav>

      <div class="shrink-0 border-t bg-white p-4">
        <div class="mb-3 flex items-center gap-3 rounded-xl bg-gray-50 p-3">
          <div id="sidebarAvatar" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-700 text-sm font-bold text-white">${initials}</div>
          <div class="min-w-0">
            <p id="sidebarUserName" class="truncate text-sm font-semibold text-gray-900">${userName}</p>
            <p id="sidebarUserRole" class="truncate text-xs text-gray-500">Administration</p>
          </div>
        </div>
        <button id="logoutBtn" type="button" class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">Déconnexion</button>
      </div>
    </aside>
  `;

  const container = document.createElement("div");
  container.innerHTML = markup;
  return container.firstElementChild;
}

window.createSidebar = createSidebar;
export { createSidebar };
