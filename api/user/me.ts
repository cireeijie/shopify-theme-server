// api/user/me.ts
import type { VercelResponse } from "@vercel/node";
import withAuth, { AuthenticatedRequest } from "../../middleware/withAuth";
import withCors from "../../middleware/cors";

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  return res.status(200).json({
    message: "You are authenticated!",
    user: req.user,
  });
}

export default withCors(withAuth(handler));
