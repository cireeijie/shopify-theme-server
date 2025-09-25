import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "../../firebase/admin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res
      .status(400)
      .json({ error: "Email, password, and name are required." });
  }

  try {
    // 1. Check if email already exists
    const existingUser = await admin
      .auth()
      .getUserByEmail(email)
      .catch(() => null);
    if (existingUser) {
      return res.status(400).json({ error: "Email is already in use." });
    }

    // 2. Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    // 3. Create Firestore record
    const db = admin.firestore();
    await db.collection("Users").doc(userRecord.uid).set({
      email,
      firstName,
      lastName,
      role: "subscriber",
      provider: "password",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      message: "User created successfully!",
      uid: userRecord.uid,
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: error.message });
  }
}
