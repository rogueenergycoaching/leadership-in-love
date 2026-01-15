function getEnvVar(name: string, required: boolean = true): string {
  const value = process.env[name];

  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value || "";
}

export const env = {
  // Database
  DATABASE_URL: getEnvVar("DATABASE_URL"),
  DIRECT_URL: getEnvVar("DIRECT_URL", false),

  // Authentication
  AUTH_SECRET: getEnvVar("AUTH_SECRET"),

  // AI
  ANTHROPIC_API_KEY: getEnvVar("ANTHROPIC_API_KEY"),

  // App
  NEXTAUTH_URL: getEnvVar("NEXTAUTH_URL", false) || "http://localhost:3000",

  // Runtime checks
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
};

export function validateEnv(): void {
  const required = ["DATABASE_URL", "AUTH_SECRET", "ANTHROPIC_API_KEY"];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("Missing required environment variables:");
    missing.forEach((key) => console.error(`  - ${key}`));
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}
