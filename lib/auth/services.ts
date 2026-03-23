import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { hashPin, verifyPin } from "@/lib/auth/pin";
import { Timestamp } from "firebase-admin/firestore";

/**
 * Core business logic for user registration.
 */
export async function registerUser(name: string, pin: string) {
  // 1. Check if name already taken
  const userSnapshot = await adminDb
    .collection("users")
    .where("name", "==", name)
    .limit(1)
    .get();

  if (!userSnapshot.empty) {
    throw new Error("Name already taken");
  }

  // 2. Hash PIN
  const hashedPin = await hashPin(pin);

  // 3. Create Firebase Auth user with collision-safe email
  const email = `${name.toLowerCase().replace(/\s+/g, ".")}_${Date.now()}@stride.local`;
  const userRecord = await adminAuth.createUser({
    displayName: name,
    email,
  });

  // 4. Create Firestore user doc
  const userData = {
    id: userRecord.uid,
    name,
    pin: hashedPin,
    role: "user",
    streak: 0,
    lastStudiedAt: null,
    createdAt: Timestamp.now(),
  };

  await adminDb.collection("users").doc(userRecord.uid).set(userData);
  await adminAuth.setCustomUserClaims(userRecord.uid, { role: "user" });

  return { 
    userId: userRecord.uid, 
    name: userData.name,
    role: userData.role 
  };
}

/**
 * Core business logic for user login.
 */
export async function loginUser(name: string, pin: string) {
  // 1. Find user by name
  const userSnapshot = await adminDb
    .collection("users")
    .where("name", "==", name)
    .limit(1)
    .get();

  if (userSnapshot.empty) {
    throw new Error("User not found");
  }

  const userDoc = userSnapshot.docs[0];
  const userData = userDoc.data();

  // 2. Verify PIN
  const isPinValid = await verifyPin(pin, userData.pin);
  if (!isPinValid) {
    throw new Error("Invalid PIN");
  }

  // 3. Create Firebase custom token with role
  const customToken = await adminAuth.createCustomToken(userDoc.id, {
    role: userData.role,
  });

  return {
    customToken,
    user: {
      id: userDoc.id,
      name: userData.name,
      role: userData.role,
    },
  };
}
