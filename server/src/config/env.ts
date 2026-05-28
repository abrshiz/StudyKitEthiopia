import "dotenv/config";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
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
};
