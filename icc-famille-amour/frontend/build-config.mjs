import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const buildFile = fileURLToPath(import.meta.url);
const outputDir = path.join(sourceDir, "dist");
const apiOrigin = process.env.API_BASE_URL?.trim();

const parsedApiOrigin = apiOrigin ? new URL(apiOrigin) : null;

if (parsedApiOrigin && parsedApiOrigin.protocol !== "https:") {
  throw new Error("API_BASE_URL doit utiliser HTTPS en production.");
}

if (!parsedApiOrigin) {
  console.warn(
    "[build] API_BASE_URL non définie : le site est publié avec la configuration d'API par défaut."
  );
}

const apiBase = parsedApiOrigin
  ? `${apiOrigin.replace(/\/+$/, "")}/api/v1`
  : null;

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
const entries = await readdir(sourceDir, { withFileTypes: true });

for (const entry of entries) {
  if (
    ["dist", "node_modules", ".git", ".env"].includes(entry.name) ||
    entry.name.startsWith(".env.") ||
    path.join(sourceDir, entry.name) === buildFile
  ) {
    continue;
  }

  await cp(
    path.join(sourceDir, entry.name),
    path.join(outputDir, entry.name),
    {
      recursive: true,
      filter: (source) => {
        const name = path.basename(source);
        return name !== "node_modules" &&
          name !== ".git" &&
          name !== ".env" &&
          !name.startsWith(".env.");
      },
    }
  );
}
if (apiBase) {
  await writeFile(
    path.join(outputDir, "js", "runtime-config.js"),
    `window.ICC_API_BASE = ${JSON.stringify(apiBase)};\n`,
    "utf8"
  );
  console.log(`[build] Frontend préparé pour ${parsedApiOrigin.host}.`);
} else {
  console.log("[build] Frontend préparé.");
}