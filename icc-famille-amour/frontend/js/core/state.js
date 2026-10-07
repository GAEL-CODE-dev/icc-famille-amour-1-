const appState = {
  currentUser: null,
  isAuthenticated: false,
  permissions: [],
};

function setCurrentUser(user) {
  appState.currentUser = user || null;
  appState.isAuthenticated = Boolean(user);
}

function setPermissions(permissions = []) {
  appState.permissions = permissions;
}

function hasPermission(permission) {
  return appState.permissions.includes(permission) || appState.permissions.includes("*") || false;
}

window.ICC_STATE = appState;

export { appState, setCurrentUser, setPermissions, hasPermission };
