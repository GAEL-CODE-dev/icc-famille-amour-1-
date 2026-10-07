import { pool } from "../config/db.js";

/**
 * Inscription publique d'un membre
 */
export async function createMember(req, res) {
  try {
    const {
      nom,
      prenom,
      telephone,
      email,
      adresse,
      date_naissance,
      notes,
    } = req.body;

    if (!nom || !prenom) {
      return res.status(400).json({
        success: false,
        message: "Le nom et le prénom sont obligatoires.",
      });
    }

    const nomClean = nom.trim();
    const prenomClean = prenom.trim();
    const telephoneClean = telephone?.trim() || null;
    const emailClean = email?.trim().toLowerCase() || null;
    const adresseClean = adresse?.trim() || null;
    const notesClean = notes?.trim() || null;

    if (telephoneClean) {
      const existingMember = await pool.query(
        `
        SELECT id
        FROM members
        WHERE telephone = $1
          AND deleted_at IS NULL
        LIMIT 1
        `,
        [telephoneClean]
      );

      if (existingMember.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Un membre utilise déjà ce numéro de téléphone.",
        });
      }
    }

    const result = await pool.query(
      `
      INSERT INTO members (
        nom,
        prenom,
        telephone,
        email,
        adresse,
        date_naissance,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        nom,
        prenom,
        telephone,
        email,
        adresse,
        date_naissance,
        date_adhesion,
        statut,
        created_at
      `,
      [
        nomClean,
        prenomClean,
        telephoneClean,
        emailClean,
        adresseClean,
        date_naissance || null,
        notesClean,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Inscription enregistrée avec succès.",
      member: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur création membre :", error);

    return res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de l'inscription.",
    });
  }
}

/**
 * Liste, recherche et filtrage des membres
 * Réservé aux administrateurs authentifiés
 */
export async function getMembers(req, res) {
  try {
    const {
      search = "",
      statut = "",
      page = "1",
      limit = "20",
    } = req.query;

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(
      Math.max(parseInt(limit, 10) || 20, 1),
      100
    );

    const offset = (currentPage - 1) * perPage;

    const conditions = ["deleted_at IS NULL"];
    const values = [];

    if (search.trim()) {
      values.push(`%${search.trim()}%`);

      conditions.push(`
        (
          nom ILIKE $${values.length}
          OR prenom ILIKE $${values.length}
          OR telephone ILIKE $${values.length}
          OR email::text ILIKE $${values.length}
        )
      `);
    }

    if (statut.trim()) {
      values.push(statut.trim());

      conditions.push(`statut = $${values.length}`);
    }

    const whereClause = conditions.join(" AND ");

    const countResult = await pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM members
      WHERE ${whereClause}
      `,
      values
    );

    const total = countResult.rows[0].total;

    const dataValues = [...values];

    dataValues.push(perPage);
    const limitPosition = dataValues.length;

    dataValues.push(offset);
    const offsetPosition = dataValues.length;

    const result = await pool.query(
      `
      SELECT
        id,
        nom,
        prenom,
        telephone,
        email,
        adresse,
        date_naissance,
        date_adhesion,
        statut,
        notes,
        created_at,
        updated_at
      FROM members
      WHERE ${whereClause}
      ORDER BY nom ASC, prenom ASC
      LIMIT $${limitPosition}
      OFFSET $${offsetPosition}
      `,
      dataValues
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        page: currentPage,
        limit: perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error("Erreur récupération membres :", error);

    return res.status(500).json({
      success: false,
      message: "Impossible de récupérer les membres.",
    });
  }
}

/**
 * Modifier un membre
 * Réservé aux administrateurs authentifiés
 */
export async function updateMember(req, res) {
  try {
    const { id } = req.params;

    const {
      nom,
      prenom,
      telephone,
      email,
      adresse,
      date_naissance,
      date_adhesion,
      statut,
      notes,
    } = req.body;

    if (!nom || !prenom) {
      return res.status(400).json({
        success: false,
        message: "Le nom et le prénom sont obligatoires.",
      });
    }

    const nomClean = nom.trim();
    const prenomClean = prenom.trim();
    const telephoneClean = telephone?.trim() || null;
    const emailClean = email?.trim().toLowerCase() || null;
    const adresseClean = adresse?.trim() || null;
    const notesClean = notes?.trim() || null;

    const existingMember = await pool.query(
      `
      SELECT id
      FROM members
      WHERE id = $1
        AND deleted_at IS NULL
      `,
      [id]
    );

    if (existingMember.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Membre introuvable.",
      });
    }

    if (telephoneClean) {
      const duplicatePhone = await pool.query(
        `
        SELECT id
        FROM members
        WHERE telephone = $1
          AND id <> $2
          AND deleted_at IS NULL
        LIMIT 1
        `,
        [telephoneClean, id]
      );

      if (duplicatePhone.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Ce numéro de téléphone est déjà utilisé.",
        });
      }
    }

    const result = await pool.query(
      `
      UPDATE members
      SET
        nom = $1,
        prenom = $2,
        telephone = $3,
        email = $4,
        adresse = $5,
        date_naissance = $6,
        date_adhesion = $7,
        statut = $8,
        notes = $9
      WHERE id = $10
        AND deleted_at IS NULL
      RETURNING
        id,
        nom,
        prenom,
        telephone,
        email,
        adresse,
        date_naissance,
        date_adhesion,
        statut,
        notes,
        created_at,
        updated_at
      `,
      [
        nomClean,
        prenomClean,
        telephoneClean,
        emailClean,
        adresseClean,
        date_naissance || null,
        date_adhesion || null,
        statut || "actif",
        notesClean,
        id,
      ]
    );

    return res.status(200).json({
      success: true,
      message: "Membre modifié avec succès.",
      member: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur modification membre :", error);

    return res.status(500).json({
      success: false,
      message: "Impossible de modifier le membre.",
    });
  }
}

/**
 * Désactiver / supprimer logiquement un membre
 * Réservé aux administrateurs authentifiés
 */
export async function deleteMember(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE members
      SET deleted_at = now(),
          statut = 'inactif'
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING id, nom, prenom, deleted_at, statut
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Membre introuvable ou déjà supprimé.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Membre retiré avec succès.",
      member: result.rows[0],
    });
  } catch (error) {
    console.error("Erreur suppression membre :", error);

    return res.status(500).json({
      success: false,
      message: "Impossible de retirer le membre.",
    });
  }
}