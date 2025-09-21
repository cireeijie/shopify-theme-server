import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { email, password } = req.body as { email: string; password: string };

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
