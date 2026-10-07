import * as adminRepo from "../repositories/adminRepository.js";
import { hashPassword } from "./authService.js";
import { ApiError } from "../middlewares/errorHandler.js";
import { logAudit } from "../middlewares/audit.js";

export async function listAdmins() {
  return adminRepo.findAll();
}

export async function createAdmin({ nom, email, role, password }, actor, ip) {
  const existing = await adminRepo.findByEmail(email);
  if (existing) {
    throw new ApiError(409, "EMAIL_TAKEN", "Cet email est déjà utilisé par un autre administrateur.");
  }

  const passwordHash = await hashPassword(password);
  const admin = await adminRepo.insert({ nom, email, passwordHash, role });

  await logAudit({
    adminId: actor.id,
    action: "admin_cree",
    entite: "admin",
    entiteId: admin.id,
    ip,
    details: { role },
  });

  return admin;
}

export async function updateAdmin(id, fields, actor, ip) {
  const target = await adminRepo.findById(id);
  if (!target) {
    throw new ApiError(404, "NOT_FOUND", "Administrateur introuvable.");
  }

  // Empêcher de retirer le dernier super_admin actif (rôle ou désactivation).
  const demoting = fields.role && fields.role !== "super_admin" && target.role === "super_admin";
  const deactivating = fields.actif === false && target.role === "super_admin";

  if ((demoting || deactivating) && target.actif) {
    const remaining = await adminRepo.countActiveSuperAdmins(id);
    if (remaining === 0) {
      throw new ApiError(
        409,
        "LAST_SUPER_ADMIN",
        "Impossible : il doit rester au moins un super-administrateur actif."
      );
    }
  }

  const updated = await adminRepo.update(id, fields);

  await logAudit({
    adminId: actor.id,
    action: "admin_modifie",
    entite: "admin",
    entiteId: id,
    ip,
    details: fields,
  });

  return updated;
}

export async function resetAdminPassword(id, password, actor, ip) {
  const target = await adminRepo.findById(id);
  if (!target) {
    throw new ApiError(404, "NOT_FOUND", "Administrateur introuvable.");
  }
  const passwordHash = await hashPassword(password);
  await adminRepo.updatePasswordHash(id, passwordHash);

  await logAudit({
    adminId: actor.id,
    action: "admin_mot_de_passe_reinitialise",
    entite: "admin",
    entiteId: id,
    ip,
  });
}
