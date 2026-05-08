import { NyTurForm } from "./form";

export default function NyTurPage() {
  return (
    <main className="bg-bg min-h-screen">
      <div className="max-w-[42rem] mx-auto px-md py-xl sm:px-lg sm:py-2xl">
        <header className="mb-lg">
          <h1 className="font-heading text-h1 font-bold mb-xs text-text-primary">
            Ny tur
          </h1>
          <p
            className="text-text-primary text-xl leading-snug"
            style={{ fontFamily: "var(--font-handwriting)" }}
          >
            Gi turen et navn og noen datoer. Resten ordner vi underveis.
          </p>
        </header>

        <NyTurForm />
      </div>
    </main>
  );
}
