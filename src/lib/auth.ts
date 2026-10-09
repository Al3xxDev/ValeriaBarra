import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const cookieName = "valeria_admin_session";
function getSecret() {
  const value = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production" && (!value || value.length < 32)) throw new Error("AUTH_SECRET must contain at least 32 characters in production.");
  return new TextEncoder().encode(value || "development-only-secret-change-before-deploy-32chars");
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function getSession() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    return payload.role === "admin" && typeof payload.sub === "string" ? { userId: payload.sub } : null;
  } catch {
    return null;
  }
}

export async function destroySession() {
  (await cookies()).delete(cookieName);
}

export async function getActiveAdminSession() {
  const session = await getSession();
  if (!session) return null;
  try {
    const user = await prisma.adminUser.findUnique({ where: { id: session.userId }, select: { id: true } });
    return user ? session : null;
  } catch {
    return null;
  }
}
