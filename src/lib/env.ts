type EnvSpec = {
  name: string;
  required: boolean;
  description: string;
};

const ENV_SPEC: EnvSpec[] = [
  {
    name: "MONGODB_URI",
    required: true,
    description: "MongoDB Atlas tilkoblingsstreng for trips/users.",
  },
  {
    name: "ANTHROPIC_API_KEY",
    required: true,
    description: "Anthropic-nøkkel for D1 AI-rangering og P1 pakkeliste.",
  },
];

export type EnvReport = {
  ok: boolean;
  missingRequired: string[];
  missingOptional: string[];
};

export function validateEnv(): EnvReport {
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  for (const spec of ENV_SPEC) {
    const value = process.env[spec.name];
    if (!value || value.trim().length === 0) {
      if (spec.required) missingRequired.push(spec.name);
      else missingOptional.push(spec.name);
    }
  }

  return {
    ok: missingRequired.length === 0,
    missingRequired,
    missingOptional,
  };
}

export function logEnvReport(report: EnvReport): void {
  if (report.missingRequired.length > 0) {
    console.error(
      `[ADMIN_ALERT] manglende påkrevde miljøvariabler: ${report.missingRequired.join(", ")}`,
    );
  }
  if (report.missingOptional.length > 0) {
    console.warn(
      `[env] mangler valgfrie variabler: ${report.missingOptional.join(", ")}`,
    );
  }
  if (report.ok && report.missingOptional.length === 0) {
    console.log("[env] alle miljøvariabler satt.");
  }
}
