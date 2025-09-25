// api/user/logout.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "../../firebase/admin";
import { parse } from "cookie";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  try {
    // Parse the cookie header
    const cookies = parse(req.headers.cookie || "");
    const session = cookies.session;

    if (!session) {
      return res.status(400).json({ error: "No session cookie found" });
    }

    // Decode session cookie to get UID
    const decodedClaims = await admin.auth().verifySessionCookie(session, true);

    // Revoke all refresh tokens for this user
    await admin.auth().revokeRefreshTokens(decodedClaims.uid);

    // Clear the cookie
    res.setHeader(
      "Set-Cookie",
      "session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
    );

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error: any) {
    console.error("Logout error:", error.message);
    return res.status(500).json({ error: "Failed to logout" });
  }
}
