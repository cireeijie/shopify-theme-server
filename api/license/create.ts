import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getFirestore } from "firebase-admin/firestore";
import admin from "../../firebase/admin";
import { parse } from "cookie";
import withCors from "../../middleware/cors";

const db = getFirestore();

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  try {
    const cookies = parse(req.headers.cookie || "");
    const sessionCookie = cookies.session;

    if (!sessionCookie) {
      return res.status(401).json({ error: "Unauthorized. No session found." });
    }

    const decodedClaims = await admin
      .auth()
      .verifySessionCookie(sessionCookie, true);
    const userId = decodedClaims.uid;

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { storeLink } = body;

    if (!storeLink || !storeLink.endsWith(".myshopify.com")) {
      return res
        .status(400)
        .json({ error: "Valid Shopify store link is required." });
    }

    let licenseKey = await generateUniqueLicenseKey();

    const newLicenseRef = await db.collection("Licenses").add({
      storeLink,
      licenseKey,
      userId,
      status: "inactive",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      message: "License created successfully.",
      license: {
        id: newLicenseRef.id,
        storeLink,
        licenseKey,
        userId,
        status: "inactive",
      },
    });
  } catch (error: any) {
    console.error("License creation error:", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
}

async function generateUniqueLicenseKey(): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const db = getFirestore();
  let isUnique = false;
  let key = "";

  while (!isUnique) {
    const part1 = Array.from(
      { length: 6 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("");
    const part2 = Array.from(
      { length: 6 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("");
    key = `${part1}-${part2}`;

    const snapshot = await db
      .collection("Licenses")
      .where("licenseKey", "==", key)
      .get();
    if (snapshot.empty) {
      isUnique = true;
    }
  }

  return key;
}

export default withCors(handler);
