import { useState, useEffect, useCallback } from "react";
import { auth, db } from "../lib/firebase";
import {
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

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

/**
 * Admin authorization is now based only on Firebase Authentication
 * plus an explicit /admins/{uid} Firestore record.
 *
 * IMPORTANT:
 * Add your authorised admin UID(s) to Firestore:
 * admins/{firebaseUserUid}
 * with at least: { role: "admin" }
 */
export function useAdminAuth(): AdminSession {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminError, setAdminError] = useState<string | null>(null);

  const verifyAdmin = useCallback(async (user: any): Promise<boolean> => {
    if (!user?.uid) return false;

    try {
      const adminDoc = await getDoc(doc(db, "admins", user.uid));

      if (!adminDoc.exists()) return false;

      const data = adminDoc.data();
      return data?.role === "admin" || data?.role === "super_admin";
    } catch (error) {
      console.error("Admin verification failed:", error);
      return false;
    }
  }, []);

  const establishSession = useCallback(
    async (user: any): Promise<boolean> => {
      if (!user) {
        setIsAdmin(false);
        setAdminToken(null);
        return false;
      }

      const authorised = await verifyAdmin(user);

      if (!authorised) {
        await signOut(auth);
        setIsAdmin(false);
        setAdminToken(null);
        setAdminError("Unauthorized: this account is not an administrator.");
        return false;
      }

      const token = await user.getIdToken(true);

      setIsAdmin(true);
      setAdminToken(token);
      setAdminError(null);

      // This is only a convenience cache. The token is refreshed by Firebase.
      localStorage.setItem("kachamba_admin_token", token);

      return true;
    },
    [verifyAdmin]
  );

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      setAuthLoading(true);
      setAdminError(null);

      try {
        await establishSession(user);
      } catch (error) {
        console.error("Admin session initialisation failed:", error);
        setIsAdmin(false);
        setAdminToken(null);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [establishSession]);

  const login = useCallback(
    async (email: string, password?: string): Promise<boolean> => {
      setAuthLoading(true);
      setAdminError(null);

      try {
        if (!email.trim() || !password) {
          throw new Error("Email and password are required.");
        }

        const credential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        const authorised = await establishSession(credential.user);

        if (!authorised) return false;

        return true;
      } catch (error: any) {
        console.error("Admin login failed:", error);
        setIsAdmin(false);
        setAdminToken(null);
        setAdminError(
          error?.code === "auth/invalid-credential"
            ? "Invalid email or password."
            : error?.message || "Login failed."
        );
        return false;
      } finally {
        setAuthLoading(false);
      }
    },
    [establishSession]
  );

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    setAuthLoading(true);
    setAdminError(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const credential = await signInWithPopup(auth, provider);
      return await establishSession(credential.user);
    } catch (error: any) {
      console.error("Google admin login failed:", error);
      setIsAdmin(false);
      setAdminToken(null);
      setAdminError(error?.message || "Google login failed.");
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, [establishSession]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsAdmin(false);
      setAdminToken(null);
      localStorage.removeItem("kachamba_admin_token");
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    setAdminError(null);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      return true;
    } catch (error: any) {
      console.error("Password reset failed:", error);
      setAdminError(error?.message || "Failed to send password reset email.");
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
    resetPassword,
  };
}
