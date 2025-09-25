import type { VercelRequest, VercelResponse } from "@vercel/node";
import { firestore } from "../../firebase/admin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { licenseKey, shopDomain } = req.body;

  try {
    const snapshot = await firestore
      .collection("Licenses")
      .where("licenseKey", "==", licenseKey)
      .where("storeDomain", "==", shopDomain)
      .get();

    if (snapshot.empty) {
      return res.status(403).json({ error: "Invalid license" });
    }

    const license = snapshot.docs[0].data();

    if (license.status !== "active") {
      return res.status(403).json({ error: "License is inactive" });
    }

    return res.status(200).json({ message: "License valid" });
  } catch (error: any) {
    console.error("License validation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
