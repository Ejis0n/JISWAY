import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function requireAdminToken(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) throw new Error("UNAUTHORIZED");
  return token;
}

