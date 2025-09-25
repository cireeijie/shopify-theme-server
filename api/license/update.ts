import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getFirestore } from "firebase-admin/firestore";
import { verifyAdmin } from "../../utils/checkAdmin";
import withCors from "../../middleware/cors";

const db = getFirestore();

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method Not Allowed. Use PATCH." });
  }

  try {
    // Verify admin
    await verifyAdmin(req);

    // Parse body
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { licenseId, status } = body;

    if (!licenseId || !status) {
      return res
        .status(400)
        .json({ error: "licenseId and status are required." });
    }

    if (!["active", "inactive"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Invalid status value. Use 'active' or 'inactive'." });
    }

    // Check if license exists
    const licenseRef = db.collection("Licenses").doc(licenseId);
    const licenseDoc = await licenseRef.get();

    if (!licenseDoc.exists) {
      return res.status(404).json({ error: "License not found." });
    }

    // Update status
    await licenseRef.update({ status });

    return res.status(200).json({
      message: "License status updated successfully.",
      licenseId,
      newStatus: status,
    });
  } catch (error: any) {
    console.error("Update License Error:", error);
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
