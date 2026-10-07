document.addEventListener("DOMContentLoaded", () => {
  const api = window.ICC_API;

  if (!api) {
    console.error("Le client API n'est pas chargé. Vérifiez ./js/api.js");
    return;
  }

  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorElement = document.getElementById("form-error");
  const submitButton = document.getElementById("submit-btn");
  const submitLabel = document.getElementById("submit-label");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    errorElement.classList.add("hidden");
    errorElement.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      errorElement.textContent = "Veuillez remplir tous les champs.";
      errorElement.classList.remove("hidden");
      return;
    }

    submitButton.disabled = true;
    submitLabel.textContent = "Connexion...";

    try {
      await api.post("/auth/login", {
        email,
        password,
      });

      if (window.redirectTo) {
        window.redirectTo("dashboard");
      } else {
        window.location.assign("/pages/dashboard.html");
      }
    } catch (error) {
      console.error("Erreur de connexion :", error);

      errorElement.textContent =
        error?.message || "Impossible de se connecter.";

      errorElement.classList.remove("hidden");
    } finally {
      submitButton.disabled = false;
      submitLabel.textContent = "Se connecter";
    }
  });
});

