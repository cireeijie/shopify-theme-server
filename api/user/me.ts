// api/user/me.ts
import type { VercelResponse } from "@vercel/node";
import withAuth, { AuthenticatedRequest } from "../../middleware/withAuth";

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  return res.status(200).json({
    message: "You are authenticated!",
    user: req.user, // Available thanks to middleware
  });
}

export default withAuth(handler);
