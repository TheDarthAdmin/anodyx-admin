import { getJson } from "@/lib/api";
import { afterLoginPath } from "@/lib/auth-flow";
import type { Account } from "@/lib/types";

/** Ask the API where this admin stands and return the next page. */
export async function nextPathAfterLogin(): Promise<string> {
  const result = await getJson("/account");
  return afterLoginPath(result.status === 200 ? (result.body as Account) : null);
}
