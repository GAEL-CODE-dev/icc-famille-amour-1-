const ROUTES = Object.freeze({
  login: "/login.html",
  dashboard: "/pages/dashboard.html",
  publicSite: "/index.html",
});

function resolveRoute(routeName) {
  if (!routeName) return null;
  if (routeName.startsWith("/") || routeName.startsWith("http")) return routeName;
  return ROUTES[routeName] || routeName;
}

function redirectTo(routeName) {
  const target = resolveRoute(routeName);
  if (!target) return false;
  window.location.assign(target);
  return true;
}

window.ICC_ROUTES = ROUTES;
window.redirectTo = redirectTo;
window.resolveRoute = resolveRoute;

export { ROUTES, resolveRoute, redirectTo };
