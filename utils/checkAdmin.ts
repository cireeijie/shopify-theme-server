// utils/checkAdmin.ts
import admin from "../firebase/admin";
import { getFirestore } from "firebase-admin/firestore";
import { parse } from "cookie";

const db = getFirestore();

export async function verifyAdmin(req: any) {
  const cookies = parse(req.headers.cookie || "");
  const sessionCookie = cookies.session;

  if (!sessionCookie) {
    throw new Error("Unauthorized. No session cookie found.");
  }

  // Verify session cookie
  const decodedClaims = await admin
    .auth()
    .verifySessionCookie(sessionCookie, true);
  const uid = decodedClaims.uid;

  // Fetch user role
  const userDoc = await db.collection("Users").doc(uid).get();
  if (!userDoc.exists) {
    throw new Error("User not found.");
  }

  const userData = userDoc.data();

  if (userData?.role !== "admin") {
    throw new Error("Forbidden. Admin access required.");
  }

  return { uid, userData };
}
