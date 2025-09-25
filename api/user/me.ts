import type { VercelResponse } from "@vercel/node";
import withAuth, { AuthenticatedRequest } from "../../middleware/withAuth";
import withCors from "../../middleware/cors";

import admin from "../../firebase/admin";

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const db = admin.firestore();

  try {
    const userDocRef = db.collection("Users").doc(req.user.uid);
    const userDocSnap = await userDocRef.get();

    let userData = {};
    if (userDocSnap.exists) {
      const data = userDocSnap.data();
      userData = {
        role: data?.role || "subscriber",
        firstName: data?.firstName || "",
        lastName: data?.lastName || "",
      };
    } else {
      userData = { role: "subscriber", firstName: "", lastName: "" };
    }

    return res.status(200).json({
      message: "You are authenticated!",
      user: {
        ...req.user,
        ...userData,
      },
    });
  } catch (err) {
    console.error("Error fetching user role:", err);
    return res.status(500).json({ error: "Failed to fetch user role" });
  }
}

export default withCors(withAuth(handler));
