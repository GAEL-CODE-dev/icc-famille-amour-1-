/**
 * Usage : node src/seedSuperAdmin.js "Nom Complet" email@exemple.com "MotDePasseSolide123!"
 * À exécuter une seule fois pour créer le premier compte super_admin.
 */
import { pool } from "./config/db.js";
import { hashPassword } from "./services/authService.js";

async function main() {
  const [nom, email, password] = process.argv.slice(2);
  if (!nom || !email || !password) {
    console.error('Usage: node src/seedSuperAdmin.js "Nom" email@exemple.com "MotDePasse"');
    process.exit(1);
  }
  if (password.length < 10) {
    console.error("Le mot de passe doit contenir au moins 10 caractères.");
    process.exit(1);
  }

  const hash = await hashPassword(password);
  const { rows } = await pool.query(
    `INSERT INTO admins (nom, email, password_hash, role, actif)
     VALUES ($1, $2, $3, 'super_admin', true)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id, nom, email, role`,
    [nom, email, hash]
  );
  console.log("Super-admin créé/mis à jour :", rows[0]);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
