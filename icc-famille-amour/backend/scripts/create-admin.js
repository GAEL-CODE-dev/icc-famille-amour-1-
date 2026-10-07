import "dotenv/config";
import argon2 from "argon2";
import { pool } from "../src/config/db.js";

const nom = "yangu gael";
const email = "gaelyangu@gmail.com";
const password = "Chancelvie2002";

try {
  // Vérifier si l'administrateur existe déjà
  const existing = await pool.query(
    "SELECT id FROM admins WHERE email = $1",
    [email]
  );

  if (existing.rows.length > 0) {
    console.log("❌ Cet administrateur existe déjà.");
    process.exit(0);
  }

  // Hasher le mot de passe
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  // Créer l'administrateur
  const { rows } = await pool.query(
    `INSERT INTO admins
      (nom, email, password_hash, role, actif)
     VALUES
      ($1, $2, $3, $4, $5)
     RETURNING id, nom, email, role, actif`,
    [nom, email, passwordHash, "super_admin", true]
  );

  console.log("✅ Administrateur créé avec succès !");
  console.table(rows);

  console.log("\n⚠️ Identifiants de connexion :");
  console.log("Email :", email);
  console.log("Mot de passe :", password);
} catch (error) {
  console.error("❌ Erreur lors de la création :", error.message);
} finally {
  await pool.end();
}
