import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "../../firebase/admin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: "Google ID token is required." });
  }

  try {
    // 1. Verify the Google token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name } = decodedToken;

    // 2. Check if the user exists in Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().getUser(uid);
    } catch (error) {
      // If no user, create one
      userRecord = await admin.auth().createUser({
        uid,
        email,
        displayName: name || "Google User",
      });

      // 3. Create Firestore record
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
