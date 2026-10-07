import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "./errorHandler.js";

const ACCESS_COOKIE = "icc_access";

export function requireAuth(req, res, next) {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) {
    return next(new ApiError(401, "UNAUTHENTICATED", "Connexion requise."));
  }
  try {
    const payload = jwt.verify(token, env.jwt.accessSecret);
    req.admin = { id: payload.sub, role: payload.role, nom: payload.nom };
    next();
  } catch {
    next(new ApiError(401, "UNAUTHENTICATED", "Session invalide ou expirée."));
  }
}

/**
 * @param {...('super_admin'|'tresorier'|'secretaire')} roles
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin) {
      return next(new ApiError(401, "UNAUTHENTICATED", "Connexion requise."));
    }
    if (!roles.includes(req.admin.role)) {
      return next(
        new ApiError(403, "FORBIDDEN", "Vous n'avez pas les droits pour cette action.")
      );
    }
    next();
  };
}

export function signAccessToken(admin) {
  return jwt.sign(
    { sub: admin.id, role: admin.role, nom: admin.nom },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessTtl }
  );
}

export function signRefreshToken(admin) {
  return jwt.sign({ sub: admin.id }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshTtl,
  });
}

export const ACCESS_COOKIE_NAME = ACCESS_COOKIE;
export const REFRESH_COOKIE_NAME = "icc_refresh";

export function cookieOptions(maxAgeMs) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: maxAgeMs,
    path: "/",
  };
}
