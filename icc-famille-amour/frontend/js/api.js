// Client API centralisé. Les cookies (httpOnly) portent la session : credentials: "include" partout.
const API_BASE =
  window.ICC_API_BASE || "http://localhost:4000/api/v1";

class ApiClientError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    // pas de corps JSON (ex: erreur réseau amont)
  }

  if (!res.ok) {
    const err = payload?.error;
    throw new ApiClientError(
      res.status,
      err?.code || "UNKNOWN_ERROR",
      err?.message || payload?.message || "Une erreur est survenue.",
      err?.details
    );
  }

  return payload;
}

const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path) => request(path, { method: "DELETE" }),
};

// Disponible dans toutes les pages HTML
window.ICC_API = api;
window.ApiClientError = ApiClientError;

// Permet aussi aux pages JS d'importer directement ces éléments
export { api, ApiClientError };
