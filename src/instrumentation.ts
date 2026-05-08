export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { validateEnv, logEnvReport } = await import("@/lib/env");
  logEnvReport(validateEnv());
}
