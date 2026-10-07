import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const buildFile = fileURLToPath(import.meta.url);
const outputDir = path.join(sourceDir, "dist");
const apiOrigin = process.env.API_BASE_URL?.trim();

if (!apiOrigin) {
  throw new Error("La variable API_BASE_URL est requise pour construire le site.");
}

const parsedApiOrigin = new URL(apiOrigin);

if (parsedApiOrigin.protocol !== "https:") {
  throw new Error("API_BASE_URL doit utiliser HTTPS en production.");
}

const apiBase = `${apiOrigin.replace(/\/+$/, "")}/api/v1`;

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
await writeFile(
  path.join(outputDir, "js", "runtime-config.js"),
  `window.ICC_API_BASE = ${JSON.stringify(apiBase)};\n`,
  "utf8"
);

console.log(`[build] Frontend préparé pour ${parsedApiOrigin.host}.`);