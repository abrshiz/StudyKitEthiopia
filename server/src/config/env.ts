import "dotenv/config";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

const defaultOrigins = "http://localhost:8080,http://localhost:8081";

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: required("MONGODB_URI"),
  /** Comma-separated in CLIENT_ORIGIN — both dev ports can talk to the API. */
  clientOrigins: (process.env.CLIENT_ORIGIN ?? defaultOrigins)
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  publicAppUrl: optional("PUBLIC_APP_URL", "http://localhost:8080"),

  jwtSecret: optional("JWT_SECRET", "dev-only-jwt-secret-change-me-in-production"),
  /** Cookie ttl in seconds. 7 days is plenty for a study app. */
  jwtTtlSeconds: Number(process.env.JWT_TTL_SECONDS ?? 60 * 60 * 24 * 7),
  cookieName: optional("COOKIE_NAME", "sk_at"),
  cookieDomain: optional("COOKIE_DOMAIN", ""),
  cookieSecure: (process.env.COOKIE_SECURE ?? "false").toLowerCase() === "true",

  microsoft: {
    clientId: optional("MICROSOFT_CLIENT_ID"),
    clientSecret: optional("MICROSOFT_CLIENT_SECRET"),
    tenant: optional("MICROSOFT_TENANT", "common"),
    redirectUri: optional(
      "MICROSOFT_REDIRECT_URI",
      "http://localhost:4000/api/auth/microsoft/callback",
    ),
  },

  gemini: {
    apiKey: optional("GEMINI_API_KEY"),
    model: optional("GEMINI_MODEL", "gemini-pro"),
  },

  chapa: {
    secretKey: optional("CHAPA_SECRET_KEY"),
    webhookSecret: optional("CHAPA_WEBHOOK_SECRET"),
    baseUrl: optional("CHAPA_BASE_URL", "https://api.chapa.co/v1"),
    callbackUrl: optional(
      "CHAPA_CALLBACK_URL",
      "http://localhost:4000/api/chapa/webhook",
    ),
    returnUrl: optional("CHAPA_RETURN_URL", "http://localhost:8080/billing?status=success"),
  },

  resend: {
    apiKey: optional("RESEND_API_KEY"),
    from: optional("RESEND_FROM", "StudyKit ET <no-reply@studykit.et>"),
  },

  uploadsDir: optional("UPLOADS_DIR", "uploads"),
};

export type AppEnv = typeof env;
