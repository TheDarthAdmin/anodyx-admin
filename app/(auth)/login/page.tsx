import type { Metadata } from "next";

import { LoginFlow } from "@/components/auth/login-flow";

export const metadata: Metadata = { title: "Inloggen" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { reden } = await searchParams;
  const notice = reden === "uitgelogd" ? "Je bent uitgelogd." : undefined;
  return <LoginFlow notice={notice} />;
}
