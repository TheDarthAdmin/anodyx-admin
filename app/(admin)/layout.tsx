import { redirect } from "next/navigation";

import { AdminMark } from "@/components/brand";
import { LogoutButton } from "@/components/shell/logout-button";
import { Nav } from "@/components/shell/nav";
import { platformGet } from "@/lib/server/api";
import type { Account } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/">) {
  const account = await platformGet<Account>("/account");
  if (!account.has_password || account.enrollment_required) redirect("/beveiligen");

  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 z-10 flex flex-col gap-4 bg-ink px-3 py-3 lg:h-[100dvh] lg:gap-8 lg:px-4 lg:py-6">
        <div className="flex items-center justify-between gap-3 px-2">
          <AdminMark />
          <LogoutButton className="lg:hidden" />
        </div>
        <Nav />
        <div className="mt-auto hidden gap-1 border-t border-graphite px-2 pt-4 lg:grid">
          <p className="truncate text-sm text-paper" title={account.email}>
            {account.display_name ?? account.email}
          </p>
          <p className="label-mono text-shell-dim">Platformbeheerder</p>
          <LogoutButton className="-mx-3 mt-2" />
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-8 lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-[1200px]">{children}</div>
      </main>
    </div>
  );
}
