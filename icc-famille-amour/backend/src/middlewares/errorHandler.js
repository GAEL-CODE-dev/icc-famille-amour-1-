import { isProd } from "../config/env.js";

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Ressource introuvable." },
  });
}

// Signature à 4 paramètres obligatoire pour qu'Express reconnaisse ce middleware d'erreur.
export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  // Erreur de validation zod
  if (err?.name === "ZodError") {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Données invalides.",
        details: err.issues?.map((i) => ({ path: i.path, message: i.message })),
      },
    });
  }

  // Ne jamais exposer la pile d'appel ni le détail SQL en production.
  console.error("[error]", err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Une erreur interne est survenue.",
      ...(isProd ? {} : { debug: err.message }),
    },
  });
}
