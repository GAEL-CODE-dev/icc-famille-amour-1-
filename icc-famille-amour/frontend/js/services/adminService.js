import { api } from "../core/api.js";

async function getAdmins() {
  const { admins } = await api.get("/admins");
  return admins;
}

async function createAdmin(payload) {
  return api.post("/admins", payload);
}

async function updateAdmin(id, payload) {
  return api.put(`/admins/${id}`, payload);
}

export { getAdmins, createAdmin, updateAdmin };
