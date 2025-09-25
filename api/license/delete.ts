import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getFirestore } from "firebase-admin/firestore";
import { verifyAdmin } from "../../utils/checkAdmin";
import withCors from "../../middleware/cors";

const db = getFirestore();

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed. Use DELETE." });
  }

  try {
    await verifyAdmin(req);

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { licenseId } = body;

    if (!licenseId) {
      return res.status(400).json({ error: "licenseId is required." });
    }

    const licenseRef = db.collection("Licenses").doc(licenseId);
    const licenseDoc = await licenseRef.get();

    if (!licenseDoc.exists) {
      return res.status(404).json({ error: "License not found." });
    }

    await licenseRef.delete();

    return res.status(200).json({
      message: "License deleted successfully.",
      licenseId,
    });
  } catch (error: any) {
    console.error("Delete License Error:", error);
    return res
      .status(
        error.message.includes("Unauthorized") ||
          error.message.includes("Forbidden")
          ? 403
          : 500
      )
      .json({
        error: error.message || "Server error",
      });
  }
}

export default withCors(handler);
