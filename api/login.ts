import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let email: string, password: string;

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    email = body.email;
    password = body.password;
  } catch {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const auth = getAuth(app);

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return res.json({ user: userCredential.user });
  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }
}
