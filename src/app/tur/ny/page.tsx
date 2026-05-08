import { NyTurForm } from "./form";
import { MonsenLine } from "@/components/lars-monsen/monsen-line";

export default function NyTurPage() {
  return (
    <main className="bg-bg min-h-screen">
      <div className="max-w-[42rem] mx-auto px-md py-xl sm:px-lg sm:py-2xl">
        <header className="mb-lg">
          <h1 className="font-heading text-h1 font-bold mb-xs text-text-primary">
            Ny tur
          </h1>
          <p
            className="text-text-primary text-xl leading-snug mb-md"
            style={{ fontFamily: "var(--font-handwriting)" }}
          >
            Gi turen et navn og noen datoer. Resten ordner vi underveis.
          </p>
          <MonsenLine category="newTripIntro" variant="card" />
        </header>

        <NyTurForm />
      </div>
    </main>
  );
}
