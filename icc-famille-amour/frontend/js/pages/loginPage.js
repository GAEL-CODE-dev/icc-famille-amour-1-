import { login } from "../services/authService.js";

async function initLoginPage() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    const errorEl = document.getElementById("form-error");
    const submitButton = document.getElementById("submit-btn");
    const submitLabel = document.getElementById("submit-label");

    if (!email || !password) {
      if (errorEl) {
        errorEl.textContent = "Veuillez remplir tous les champs.";
        errorEl.classList.remove("hidden");
      }
      return;
    }

    submitButton.disabled = true;
    submitLabel.textContent = "Connexion...";

    try {
      await login(email, password);
      if (window.redirectTo) {
        window.redirectTo("dashboard");
      } else {
        window.location.assign("/pages/dashboard.html");
      }
    } catch (error) {
      if (errorEl) {
        errorEl.textContent = error?.message || "Impossible de se connecter.";
        errorEl.classList.remove("hidden");
      }
    } finally {
      submitButton.disabled = false;
      submitLabel.textContent = "Se connecter";
    }
  });
}

window.initLoginPage = initLoginPage;
export { initLoginPage };
