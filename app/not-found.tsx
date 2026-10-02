import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid max-w-xl gap-4 px-6 py-24">
      <h1 className="text-3xl font-bold tracking-tight">Niet gevonden</h1>
      <p className="text-muted-foreground">Deze pagina of tenant bestaat niet (meer).</p>
      <Link href="/" className="justify-self-start font-medium underline underline-offset-4">
        Naar het overzicht
      </Link>
    </main>
  );
}
