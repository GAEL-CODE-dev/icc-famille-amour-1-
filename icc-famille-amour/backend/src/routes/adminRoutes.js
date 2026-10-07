import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import {
  createAdminSchema,
  updateAdminSchema,
  resetPasswordSchema,
} from "../validators/adminValidators.js";
import {
  listAdmins,
  createAdmin,
  updateAdmin,
  resetAdminPassword,
} from "../services/adminService.js";

const router = Router();

// Toutes les routes de gestion des admins exigent une session + le rôle super_admin.
router.use(requireAuth, requireRole("super_admin"));

router.get("/", async (req, res, next) => {
  try {
    res.json({ admins: await listAdmins() });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = createAdminSchema.parse(req.body);
    const admin = await createAdmin(data, req.admin, req.ip);
    res.status(201).json({ admin });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const data = updateAdminSchema.parse(req.body);
    const admin = await updateAdmin(req.params.id, data, req.admin, req.ip);
    res.json({ admin });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/reset-password", async (req, res, next) => {
  try {
    const { password } = resetPasswordSchema.parse(req.body);
    await resetAdminPassword(req.params.id, password, req.admin, req.ip);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
