import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Hash a 4-digit PIN string for storage.
 */
export async function hashPin(pin: string): Promise<string> {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error("PIN must be 4 digits");
  }
  return bcrypt.hash(pin, SALT_ROUNDS);
}

/**
 * Compare a raw PIN string against a hashed PIN.
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}
