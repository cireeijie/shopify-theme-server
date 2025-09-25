// middleware/withAuth.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "../firebase/admin";
import { parse } from "cookie";

export interface AuthenticatedRequest extends VercelRequest {
  user?: admin.auth.DecodedIdToken;
}

/**
 * Protects API routes by checking for a valid Firebase session cookie.
 * @param handler API route handler
 */
export default function withAuth(handler: Function) {
  return async (req: AuthenticatedRequest, res: VercelResponse) => {
    try {
      // Parse cookies
      const cookies = parse(req.headers.cookie || "");
      const session = cookies.session;

      if (!session) {
        return res
          .status(401)
          .json({ error: "Unauthorized: No session cookie found" });
      }

      // Verify Firebase session cookie
      const decodedClaims = await admin
        .auth()
        .verifySessionCookie(session, true);

      // Attach user to request
      req.user = decodedClaims;

      // Proceed to the actual handler
      return handler(req, res);
    } catch (error: any) {
      console.error("Auth middleware error:", error.message);
      return res
        .status(401)
        .json({ error: "Unauthorized: Invalid or expired session" });
    }
  };
}
