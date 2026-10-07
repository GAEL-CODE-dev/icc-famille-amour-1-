import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./config/db.js";

const app = createApp();

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("[db] Connexion PostgreSQL établie.");

    app.listen(env.port, () => {
      console.log(
        `[server] ICC Famille Amour API démarrée sur le port ${env.port} (${env.nodeEnv})`
      );
    });
  } catch (error) {
    console.error(
      "[db] Connexion PostgreSQL impossible.",
      error.code || "CONNECTION_FAILED"
    );
    await pool.end();
    process.exitCode = 1;
  }
}

start();

