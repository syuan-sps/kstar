import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeLocale, type Locale } from "./config";

/** Server-side locale read. Reading cookies() opts the route into dynamic
 *  rendering — accepted trade-off for the single-URL 中/EN toggle. */
export async function getLocale(): Promise<Locale> {
  return normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}
