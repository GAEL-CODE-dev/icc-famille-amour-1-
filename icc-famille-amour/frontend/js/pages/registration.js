import { api } from "../api.js";

const form = document.getElementById("member-registration-form");
const status = document.getElementById("form-status");
const submitButton = document.getElementById("submit-member");

function showStatus(message, state) {
  status.textContent = message;
  status.dataset.state = state;
  status.setAttribute("role", state === "error" ? "alert" : "status");
  status.classList.remove("hidden");
  status.focus();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const member = Object.fromEntries(formData.entries());

  for (const field of ["nom", "prenom", "telephone", "email", "adresse", "notes"]) {
    member[field] = member[field].trim();
  }

  member.date_naissance ||= null;
  member.telephone ||= null;
  member.email ||= null;
  member.adresse ||= null;
  member.notes ||= null;

  submitButton.disabled = true;
  submitButton.setAttribute("aria-busy", "true");
  status.classList.add("hidden");

  try {
    await api.post("/members", member);
    sessionStorage.setItem("icc_registered_member_first_name", member.prenom);
    window.location.assign("./confirmation.html");
  } catch (error) {
    showStatus(error.message || "Impossible d’enregistrer le membre. Réessayez.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.removeAttribute("aria-busy");
    window.lucide?.createIcons();
  }
});
