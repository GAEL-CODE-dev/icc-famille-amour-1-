import { api } from "../core/api.js";

async function getCurrentAdmin() {
  const { admin } = await api.get("/auth/me");
  return admin;
}

async function login(email, password) {
  await api.post("/auth/login", { email, password });
}

async function logout() {
  await api.post("/auth/logout");
}

export { getCurrentAdmin, login, logout };
