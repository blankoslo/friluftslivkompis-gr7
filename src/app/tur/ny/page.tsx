import { NyTurForm } from "./form";

export default function NyTurPage() {
  return (
    <main className="p-xl max-w-2xl mx-auto">
      <h1 className="font-heading text-h1 font-bold mb-xs text-text-primary">
        Ny tur
      </h1>
      <p className="text-text-muted mb-xl">
        Gi turen et navn og noen datoer. Resten ordner vi underveis.
      </p>

      <NyTurForm />
    </main>
  );
}
