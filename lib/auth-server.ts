// Server-only auth helpers (use next/headers — not Edge-compatible)
import { cookies } from "next/headers";
import { verifyJWT, COOKIE_NAME } from "./auth";

export async function getAdminFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyJWT(token);
}
