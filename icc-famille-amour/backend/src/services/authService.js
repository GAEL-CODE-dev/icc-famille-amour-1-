import argon2 from "argon2";
import { query } from "../config/db.js";
import { env } from "../config/env.js";
import { ApiError } from "../middlewares/errorHandler.js";
import { logAudit } from "../middlewares/audit.js";

const GENERIC_ERROR = "Identifiants incorrects.";

/**
 * =========================================================
 * AUTHENTIFICATION
 * =========================================================
 */

export async function authenticate({ email, password, ip }) {
  const { rows } = await query(
    `SELECT
       id,
       nom,
       email,
       password_hash,
       role,
       actif,
       tentatives_echec,
       verrouille_jusqua
     FROM admins
     WHERE email = $1`,
    [email]
  );

  const admin = rows[0];

  // Ne pas révéler si l'adresse email existe.
  if (!admin || !admin.actif) {
    throw new ApiError(
      401,
      "INVALID_CREDENTIALS",
      GENERIC_ERROR
    );
  }

  if (
    admin.verrouille_jusqua &&
    new Date(admin.verrouille_jusqua) > new Date()
  ) {
    throw new ApiError(
      423,
      "ACCOUNT_LOCKED",
      "Compte temporairement verrouillé suite à plusieurs échecs. Réessayez plus tard."
    );
  }

  const valid = await argon2
    .verify(admin.password_hash, password)
    .catch(() => false);

  if (!valid) {
    await registerFailedAttempt(admin);

    await logAudit({
      adminId: admin.id,
      action: "login_echec",
      entite: "admin",
      entiteId: admin.id,
      ip,
    });

    throw new ApiError(
      401,
      "INVALID_CREDENTIALS",
      GENERIC_ERROR
    );
  }

  // Connexion réussie : remise à zéro du compteur.
  await query(
    `UPDATE admins
     SET tentatives_echec = 0,
         verrouille_jusqua = NULL
     WHERE id = $1`,
    [admin.id]
  );

  await logAudit({
    adminId: admin.id,
    action: "login_succes",
    entite: "admin",
    entiteId: admin.id,
    ip,
  });

  return {
    id: admin.id,
    nom: admin.nom,
    email: admin.email,
    role: admin.role,
  };
}


/**
 * =========================================================
 * PROFIL ADMINISTRATEUR
 * =========================================================
 */

/**
 * Récupérer le profil de l'administrateur connecté.
 */
export async function getMyProfile(adminId) {
  const { rows } = await query(
    `SELECT
       id,
       nom,
       email,
       role,
       actif,
       created_at,
       updated_at
     FROM admins
     WHERE id = $1`,
    [adminId]
  );

  const admin = rows[0];

  if (!admin) {
    throw new ApiError(
      404,
      "ADMIN_NOT_FOUND",
      "Administrateur introuvable."
    );
  }

  return admin;
}


/**
 * Modifier le profil de l'administrateur connecté.
 *
 * Pour cette version :
 * - nom modifiable
 * - email modifiable
 * - rôle non modifiable ici
 * - statut actif non modifiable ici
 */
export async function updateMyProfile(
  adminId,
  { nom, email },
  ip
) {
  const nomClean = nom?.trim();
  const emailClean = email?.trim().toLowerCase();

  if (!nomClean || nomClean.length < 2) {
    throw new ApiError(
      400,
      "INVALID_NAME",
      "Le nom doit contenir au moins 2 caractères."
    );
  }

  if (!emailClean) {
    throw new ApiError(
      400,
      "INVALID_EMAIL",
      "L'adresse email est obligatoire."
    );
  }

  // Vérifier que l'email n'est pas déjà utilisé
  // par un autre administrateur.
  const duplicate = await query(
    `SELECT id
     FROM admins
     WHERE email = $1
       AND id <> $2
     LIMIT 1`,
    [emailClean, adminId]
  );

  if (duplicate.rows.length > 0) {
    throw new ApiError(
      409,
      "EMAIL_ALREADY_USED",
      "Cette adresse email est déjà utilisée par un autre administrateur."
    );
  }

  const { rows } = await query(
    `UPDATE admins
     SET nom = $1,
         email = $2
     WHERE id = $3
     RETURNING
       id,
       nom,
       email,
       role,
       actif,
       created_at,
       updated_at`,
    [nomClean, emailClean, adminId]
  );

  const admin = rows[0];

  if (!admin) {
    throw new ApiError(
      404,
      "ADMIN_NOT_FOUND",
      "Administrateur introuvable."
    );
  }

  await logAudit({
    adminId,
    action: "profil_admin_modifie",
    entite: "admin",
    entiteId: adminId,
    ip,
  });

  return admin;
}


/**
 * =========================================================
 * MOT DE PASSE
 * =========================================================
 */

/**
 * Modifier le mot de passe de l'administrateur connecté.
 *
 * L'ancien mot de passe est obligatoire.
 */
export async function changeMyPassword(
  adminId,
  { currentPassword, newPassword },
  ip
) {
  if (!currentPassword) {
    throw new ApiError(
      400,
      "CURRENT_PASSWORD_REQUIRED",
      "L'ancien mot de passe est obligatoire."
    );
  }

  if (!newPassword) {
    throw new ApiError(
      400,
      "NEW_PASSWORD_REQUIRED",
      "Le nouveau mot de passe est obligatoire."
    );
  }

  if (newPassword.length < 10) {
    throw new ApiError(
      400,
      "WEAK_PASSWORD",
      "Le nouveau mot de passe doit contenir au moins 10 caractères."
    );
  }

  if (currentPassword === newPassword) {
    throw new ApiError(
      400,
      "PASSWORD_UNCHANGED",
      "Le nouveau mot de passe doit être différent de l'ancien."
    );
  }

  const { rows } = await query(
    `SELECT
       id,
       password_hash,
       actif
     FROM admins
     WHERE id = $1`,
    [adminId]
  );

  const admin = rows[0];

  if (!admin || !admin.actif) {
    throw new ApiError(
      401,
      "UNAUTHENTICATED",
      "Compte administrateur introuvable ou inactif."
    );
  }

  // Vérification de l'ancien mot de passe.
  const valid = await argon2
    .verify(admin.password_hash, currentPassword)
    .catch(() => false);

  if (!valid) {
    await logAudit({
      adminId,
      action: "changement_mot_de_passe_echec",
      entite: "admin",
      entiteId: adminId,
      ip,
    });

    throw new ApiError(
      401,
      "INVALID_CURRENT_PASSWORD",
      "L'ancien mot de passe est incorrect."
    );
  }

  // Hash Argon2id du nouveau mot de passe.
  const passwordHash = await hashPassword(
    newPassword
  );

  await query(
    `UPDATE admins
     SET password_hash = $1
     WHERE id = $2`,
    [passwordHash, adminId]
  );

  await logAudit({
    adminId,
    action: "mot_de_passe_modifie",
    entite: "admin",
    entiteId: adminId,
    ip,
  });

  return true;
}


/**
 * =========================================================
 * TENTATIVES DE CONNEXION
 * =========================================================
 */

async function registerFailedAttempt(admin) {
  const attempts =
    admin.tentatives_echec + 1;

  const shouldLock =
    attempts >= env.login.maxAttempts;

  const lockUntil = shouldLock
    ? new Date(
        Date.now() +
          env.login.lockMinutes * 60_000
      )
    : null;

  await query(
    `UPDATE admins
     SET tentatives_echec = $1,
         verrouille_jusqua = $2
     WHERE id = $3`,
    [
      attempts,
      lockUntil,
      admin.id,
    ]
  );
}


/**
 * =========================================================
 * HASH MOT DE PASSE
 * =========================================================
 */

export async function hashPassword(plain) {
  return argon2.hash(
    plain,
    {
      type: argon2.argon2id,
    }
  );
}
