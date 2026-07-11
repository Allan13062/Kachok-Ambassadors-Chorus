import { useState, useEffect, useCallback } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut, sendPasswordResetEmail, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface AdminSession {
  isAdmin: boolean;
  adminToken: string | null;
  authLoading: boolean;
  adminError: string | null;
  login: (email: string, password?: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
}

export function useAdminAuth(): AdminSession {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Check if user is admin
  const verifyAdmin = async (user: any): Promise<boolean> => {
    if (!user) return false;
    try {
      if (user.email === "allangeorge566@gmail.com") {
        return true;
      }
      
      const adminDocByUid = await getDoc(doc(db, "admins", user.uid));
      if (adminDocByUid.exists()) return true;

      if (user.email) {
        const adminDocByEmail = await getDoc(doc(db, "admins", user.email));
        if (adminDocByEmail.exists()) return true;
      }

      return false;
    } catch (e) {
      console.warn("Failed to verify admin status:", e);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true);
      if (user) {
        const isUserAdmin = await verifyAdmin(user);
        if (isUserAdmin) {
          const token = await user.getIdToken();
          setIsAdmin(true);
          setAdminToken(token);
          localStorage.setItem("kachamba_admin_token", token);
        } else {
          setIsAdmin(false);
          setAdminToken(null);
          localStorage.removeItem("kachamba_admin_token");
        }
      } else {
        setIsAdmin(false);
        setAdminToken(null);
        localStorage.removeItem("kachamba_admin_token");
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password?: string): Promise<boolean> => {
    setAuthLoading(true);
    setAdminError(null);
    try {
      if (!password) throw new Error("Password is required");
      
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (e: any) {
        // Fallback to create the default admin account if it does not exist yet
        if (email === "allangeorge566@gmail.com" && password === "SDA2026") {
          try {
            // First try to sign in with the old password and update it
            try {
              const oldCred = await signInWithEmailAndPassword(auth, email, "beyesuling/24");
              const { updatePassword } = await import("firebase/auth");
              await updatePassword(oldCred.user, password);
              userCredential = oldCred;
            } catch (oldErr: any) {
              // If that fails, it either means they already updated, or user doesn't exist
              if (oldErr.code === 'auth/user-not-found' || oldErr.code === 'auth/invalid-credential' || oldErr.code === 'auth/wrong-password') {
                const { createUserWithEmailAndPassword } = await import("firebase/auth");
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
              } else {
                throw oldErr;
              }
            }
          } catch (createErr) {
            throw e;
          }
        } else {
          throw e;
        }
      }

      const isUserAdmin = await verifyAdmin(userCredential.user);
      
      if (!isUserAdmin) {
        await signOut(auth);
        setAdminError("Unauthorized: You do not have admin privileges.");
        setAuthLoading(false);
        return false;
      }

      if (userCredential.user.email === "allangeorge566@gmail.com") {
        try {
          const { setDoc, doc } = await import("firebase/firestore");
          await setDoc(doc(db, "admins", userCredential.user.uid), {
            email: userCredential.user.email,
            role: "super_admin",
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.warn("Failed to save super admin to db:", e);
        }
      }
      
      return true;
    } catch (error: any) {
      setAdminError(error.message || "Login failed");
      setAuthLoading(false);
      return false;
    }
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    setAuthLoading(true);
    setAdminError(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const isUserAdmin = await verifyAdmin(userCredential.user);
      
      if (!isUserAdmin) {
        await signOut(auth);
        setAdminError("Unauthorized: You do not have admin privileges.");
        setAuthLoading(false);
        return false;
      }
      
      if (userCredential.user.email === "allangeorge566@gmail.com") {
        await setDoc(doc(db, "admins", userCredential.user.uid), {
          email: userCredential.user.email,
          role: "super_admin",
          createdAt: new Date().toISOString()
        }, { merge: true });
      }

      return true;
    } catch (error: any) {
      setAdminError(error.message || "Google Login failed");
      setAuthLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Logout error:", e);
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    setAdminError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error: any) {
      setAdminError(error.message || "Failed to send reset email");
      return false;
    }
  }, []);

  return {
    isAdmin,
    adminToken,
    authLoading,
    adminError,
    login,
    loginWithGoogle,
    logout,
    resetPassword
  };
}

