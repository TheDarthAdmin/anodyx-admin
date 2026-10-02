import type { Metadata } from "next";

import { VerifyFlow } from "@/components/auth/verify-flow";

export const metadata: Metadata = { title: "Link openen" };

export default async function VerifyPage({ searchParams }: PageProps<"/verify">) {
  const { token } = await searchParams;
  return <VerifyFlow token={typeof token === "string" ? token : ""} />;
}
