import { query } from "../config/db.js";

const PUBLIC_FIELDS = "id, nom, email, role, actif, created_at, updated_at";

export async function findAll() {
  const { rows } = await query(
    `SELECT ${PUBLIC_FIELDS} FROM admins ORDER BY nom ASC`
  );
  return rows;
}

export async function findById(id) {
  const { rows } = await query(
    `SELECT ${PUBLIC_FIELDS} FROM admins WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function findByEmail(email) {
  const { rows } = await query(`SELECT id FROM admins WHERE email = $1`, [email]);
  return rows[0] ?? null;
}

export async function countActiveSuperAdmins(excludingId = null) {
  const { rows } = await query(
    `SELECT count(*)::int AS n FROM admins
     WHERE role = 'super_admin' AND actif = true AND id != COALESCE($1, '00000000-0000-0000-0000-000000000000')`,
    [excludingId]
  );
  return rows[0].n;
}

export async function insert({ nom, email, passwordHash, role }) {
  const { rows } = await query(
    `INSERT INTO admins (nom, email, password_hash, role, actif)
     VALUES ($1, $2, $3, $4, true)
     RETURNING ${PUBLIC_FIELDS}`,
    [nom, email, passwordHash, role]
  );
  return rows[0];
}

export async function update(id, fields) {
  const sets = [];
  const values = [];
  let i = 1;

  for (const [key, value] of Object.entries(fields)) {
    sets.push(`${key} = $${i}`);
    values.push(value);
    i += 1;
  }
  if (sets.length === 0) return findById(id);

  values.push(id);
  const { rows } = await query(
    `UPDATE admins SET ${sets.join(", ")} WHERE id = $${i} RETURNING ${PUBLIC_FIELDS}`,
    values
  );
  return rows[0] ?? null;
}

export async function updatePasswordHash(id, passwordHash) {
  await query(`UPDATE admins SET password_hash = $1 WHERE id = $2`, [
    passwordHash,
    id,
  ]);
}
