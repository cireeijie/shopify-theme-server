// api/user/login.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../../firebase/app";
import admin from "../../firebase/admin";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { serialize } from "cookie"; // ✅ FIXED import

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    // Create a session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, { expiresIn });

    // Set session cookie in response
    res.setHeader(
      "Set-Cookie",
      serialize("session", sessionCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: expiresIn / 1000,
        path: "/",
      })
    );

    return res.status(200).json({
      message: "Login successful",
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
      },
    });
  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }
}
