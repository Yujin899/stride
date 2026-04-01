"use client";

import { useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useAuthStore } from "@/store/authStore";

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Set initial loading to true while we check auth
    setLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch additional user data from Firestore (name, role)
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          console.log("AuthInitializer: User doc exists?", userDoc.exists());
          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log("AuthInitializer: User data found:", data);
            setUser({
              id: firebaseUser.uid,
              name: data.name || "Scholar",
              role: data.role || "user",
            });
          } else {
            console.warn("AuthInitializer: No Firestore document for UID:", firebaseUser.uid);
            
            // Forced logout if user exists in Auth but not in Firestore
            // This prevents an infinite redirect loop between the middleware (token valid) 
            // and the app (Firestore data missing)
            await signOut(auth);
            await fetch("/api/auth/logout", { method: "POST" });
            
            setUser(null);
          }
        } catch (error) {
          console.error("AuthInitializer: Error restoring session:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
