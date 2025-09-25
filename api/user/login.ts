import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../../firebase/app";
import admin from "../../firebase/admin";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { serialize } from "cookie";
import withCors from "../../middleware/cors";

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const auth = getAuth(app);
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const idToken = await userCredential.user.getIdToken();

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, { expiresIn });

    res.setHeader(
      "Set-Cookie",
      serialize("session", sessionCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: expiresIn / 1000,
        path: "/",
      })
    );

    // Get user role, firstName, lastName from Firestore
    const db = admin.firestore();
    const userDocRef = db.collection("Users").doc(userCredential.user.uid);
    const userDocSnap = await userDocRef.get();

    let role = "subscriber";
    let firstName = "";
    let lastName = "";

    if (userDocSnap.exists) {
      const userData = userDocSnap.data();
      role = userData?.role || "subscriber";
      firstName = userData?.firstName || "";
      lastName = userData?.lastName || "";
    }

    return res.status(200).json({
      message: "Login successful",
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        firstName,
        lastName,
        role,
      },
    });
  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }
}

export default withCors(handler);
