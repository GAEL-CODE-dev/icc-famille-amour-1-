import express from "express";

import {
  createMember,
  getMembers,
  updateMember,
  deleteMember,
} from "../controllers/memberController.js";

import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

// Inscription publique
router.post("/", createMember);

// Liste des membres
router.get("/", requireAuth, getMembers);

// Modification
router.put("/:id", requireAuth, updateMember);

// Suppression logique
router.delete("/:id", requireAuth, deleteMember);

export default router;