import "dotenv/config";

const nodeEnv = process.env.NODE_ENV || "development";
const configuredFrontendOrigins = (
  process.env.FRONTEND_ORIGINS ||
  process.env.FRONTEND_ORIGIN ||
  "http://localhost:4173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const localFrontendOrigins = [
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. Copiez .env.example vers .env et remplissez-le.`
    );
  }
  return value;
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT || 4000),
  databaseUrl: required("DATABASE_URL"),
  frontendOrigins:
    nodeEnv === "production"
      ? configuredFrontendOrigins
      : [...new Set([...configuredFrontendOrigins, ...localFrontendOrigins])],
  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    accessTtl: process.env.JWT_ACCESS_TTL || "15m",
    refreshTtl: process.env.JWT_REFRESH_TTL || "7d",
  },
  login: {
    maxAttempts: Number(process.env.LOGIN_MAX_ATTEMPTS || 5),
    lockMinutes: Number(process.env.LOGIN_LOCK_MINUTES || 15),
  },
};

export const isProd = env.nodeEnv === "production";
