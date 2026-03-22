import * as jwt from "jsonwebtoken";

type SessionPayload = {
  userId: string;
  email: string;
  role: "RESIDENT" | "STAFF" | "ADMIN";
};

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");
  return secret;
}

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

export function verifySession(token: string) {
  const decoded = jwt.verify(token, getSecret());
  if (typeof decoded === "string") throw new Error("Invalid token payload");
  return decoded as SessionPayload & { iat: number; exp: number };
}