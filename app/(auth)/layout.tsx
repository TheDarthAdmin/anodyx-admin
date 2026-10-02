import { AdminMark } from "@/components/brand";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-ink text-paper">
      <header className="px-6 py-6 sm:px-10">
        <AdminMark />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:items-center sm:pt-0">
        <div className="w-full max-w-[400px] rounded-2xl bg-paper p-6 text-ink shadow-[0_24px_60px_-20px_rgb(0_0_0/0.5)] sm:p-8">
          {children}
        </div>
      </main>
      <footer className="px-6 pb-6 text-sm text-shell-dim sm:px-10">
        Beheeromgeving voor platformbeheerders. Elke actie wordt gelogd.
      </footer>
    </div>
  );
}
