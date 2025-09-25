import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "../../firebase/admin";
import withCors from "../../middleware/cors";

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: "Google ID token is required." });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name } = decodedToken;

    let userRecord;
    try {
      userRecord = await admin.auth().getUser(uid);
    } catch (error) {
      userRecord = await admin.auth().createUser({
        uid,
        email,
        displayName: name || "Google User",
      });

      const db = admin.firestore();
      await db
        .collection("User")
        .doc(userRecord.uid)
        .set({
          email,
          name: name || "Google User",
          role: "subscriber",
          provider: "google",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    return res.status(200).json({
      message: "Google OAuth successful",
      uid: userRecord.uid,
    });
  } catch (error: any) {
    console.error("Google Auth Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

export default withCors(handler);
