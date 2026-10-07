function createStatsCard({ label, value, tone = "default" }) {
  const article = document.createElement("article");
  article.className = `rounded-2xl border bg-white p-5 shadow-sm ${tone === "danger" ? "border-red-100 bg-red-50" : "border-gray-200"}`;
  article.innerHTML = `
    <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">${label}</p>
    <h3 class="mt-3 text-3xl font-bold text-gray-900">${value}</h3>
  `;
  return article;
}

window.createStatsCard = createStatsCard;
export { createStatsCard };
