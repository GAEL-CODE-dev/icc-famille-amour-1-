import { query } from "../config/db.js";

/**
 * Enregistre une ligne d'audit. À appeler explicitement depuis les services
 * après une action sensible réussie (connexion, écriture caisse, gestion admin, sauvegarde).
 * Ne doit jamais faire échouer l'action métier si l'écriture d'audit échoue.
 */
export async function logAudit({ adminId, action, entite, entiteId, ip, details }) {
  try {
    await query(
      `INSERT INTO audit_log (admin_id, action, entite, entite_id, ip, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [adminId ?? null, action, entite, entiteId ?? null, ip ?? null, details ?? null]
    );
  } catch (err) {
    console.error("[audit] échec de l'écriture du journal d'audit", err);
  }
}
