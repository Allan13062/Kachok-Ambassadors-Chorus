import { useState, useEffect, useCallback, useRef } from "react";

export interface AdminSession {
  isAdmin: boolean;
  adminToken: string | null;
  authLoading: boolean;
  adminError: string | null;
  login: (passcode: string) => Promise<boolean>;
  logout: () => void;
  verifyToken: (token: string) => Promise<boolean>;
}

export function useAdminAuth(): AdminSession {
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem("kachamba_admin_token");
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Ref to prevent overlapping verification calls
  const isVerifying = useRef(false);

  const verifyToken = useCallback(async (tokenToCheck: string): Promise<boolean> => {
    if (isVerifying.current) return false;
    isVerifying.current = true;
    try {
      const res = await fetch("/api/auth/validate-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token: tokenToCheck })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          setIsAdmin(true);
          setAdminError(null);
          isVerifying.current = false;
          return true;
        }
      }
    } catch (err) {
      console.warn("[Admin Token Verify Fail] Server offline or request failed.", err);
    }

    // Token is invalid, expired, or server says no
    setIsAdmin(false);
    setAdminToken(null);
    localStorage.removeItem("kachamba_admin_token");
    isVerifying.current = false;
    return false;
  }, []);

  // Login handler
  const login = useCallback(async (passcode: string): Promise<boolean> => {
    setAuthLoading(true);
    setAdminError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ passcode })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.token) {
          setAdminToken(data.token);
          setIsAdmin(true);
          localStorage.setItem("kachamba_admin_token", data.token);
          setAuthLoading(false);
          return true;
        }
      } else {
        const errData = await res.json();
        setAdminError(errData.error || "Authentication failed.");
      }
    } catch (err: any) {
      setAdminError(err.message || "Server connection error.");
    } finally {
      setAuthLoading(false);
    }
    return false;
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    if (adminToken) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token: adminToken })
      }).catch(err => console.warn("Failed session deletion on server:", err));
    }
    setAdminToken(null);
    setIsAdmin(false);
    setAdminError(null);
    localStorage.removeItem("kachamba_admin_token");
  }, [adminToken]);

  // Initial and periodic verification (automatic token expiry cleanup)
  useEffect(() => {
    const checkSession = async () => {
      if (adminToken) {
        await verifyToken(adminToken);
      } else {
        setIsAdmin(false);
      }
      setAuthLoading(false);
    };

    checkSession();

    // Setup periodic polling interval to clean up expired sessions (e.g. check every 30 seconds)
    const interval = setInterval(() => {
      if (adminToken) {
        verifyToken(adminToken);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [adminToken, verifyToken]);

  return {
    isAdmin,
    adminToken,
    authLoading,
    adminError,
    login,
    logout,
    verifyToken
  };
}
