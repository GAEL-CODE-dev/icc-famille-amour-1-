import { z } from "zod";

const roleEnum = z.enum(["super_admin", "tresorier", "secretaire"]);

export const createAdminSchema = z.object({
  nom: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères."),
  email: z.string().trim().email("Adresse email invalide."),
  role: roleEnum,
  password: z
    .string()
    .min(10, "Le mot de passe doit contenir au moins 10 caractères."),
});

export const updateAdminSchema = z.object({
  nom: z.string().trim().min(2).optional(),
  role: roleEnum.optional(),
  actif: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(10, "Le mot de passe doit contenir au moins 10 caractères."),
});
