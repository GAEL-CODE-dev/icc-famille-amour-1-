import pg from "pg";
import { env } from "./env.js";

// Neon exige SSL ; pg s'en charge via ?sslmode=require dans l'URL,
// mais on force aussi rejectUnauthorized:false pour les certificats intermédiaires Neon.
export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on("error", (err) => {
  // Erreur sur une connexion inactive du pool : on log, on ne crashe jamais le process.
  console.error("[db] erreur inattendue sur une connexion inactive", err);
});

/**
 * Exécute une requête paramétrée. Ne jamais concaténer des valeurs dans le texte SQL.
 * @param {string} text
 * @param {any[]} params
 */
export function query(text, params = []) {
  return pool.query(text, params);
}

/**
 * Fournit un client dédié pour une transaction (BEGIN/COMMIT/ROLLBACK).
 * Toujours faire client.release() dans un `finally`.
 */
export async function getClient() {
  const client = await pool.connect();
  return client;
}

export async function withTransaction(fn) {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
