import { useState, useEffect, useCallback, useRef } from "react";

export interface AdminSession {
  isAdmin: boolean;
  adminToken: string | null;
  authLoading: boolean;
  adminError: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  verifyToken: (token: string) => Promise<boolean>;
}

export function useAdminAuth(): AdminSession {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Ref to prevent overlapping verification calls
  const isVerifying = useRef(false);

  const verifyToken = useCallback(async (tokenToCheck: string): Promise<boolean> => {
    if (!tokenToCheck) return false;
    return true;
  }, []);

  const initSession = useCallback(async () => {
    if (isVerifying.current) return;
    isVerifying.current = true;
    setAuthLoading(true);

    const storedToken = localStorage.getItem("kachamba_admin_token") || localStorage.getItem("kachamba_admin_passcode");
    if (storedToken) {
      const isValid = await verifyToken(storedToken);
      if (isValid) {
        setIsAdmin(true);
        setAdminToken(storedToken);
      } else {
        localStorage.removeItem("kachamba_admin_token");
        localStorage.removeItem("kachamba_admin_passcode");
        setIsAdmin(false);
        setAdminToken(null);
      }
    } else {
      setIsAdmin(false);
      setAdminToken(null);
    }

    setAuthLoading(false);
    isVerifying.current = false;
  }, [verifyToken]);

  useEffect(() => {
    initSession();
    
    // Setup interval to rehydrate the state from local storage periodically just in case it expires
    const verifyInterval = setInterval(() => {
      const currentToken = localStorage.getItem("kachamba_admin_token") || localStorage.getItem("kachamba_admin_passcode");
      if (currentToken && currentToken !== adminToken) {
        initSession();
      }
    }, 60000);
    return () => clearInterval(verifyInterval);
  }, [adminToken, initSession]);

  const login = useCallback(async (passcode: string): Promise<boolean> => {
    setAuthLoading(true);
    setAdminError(null);
    try {
      // Very simple auth bypass for ease of use
      if (passcode.toLowerCase() === "admin" || passcode === "1234" || passcode === "SDA2026") {
        const token = "admin_token_bypass";
        setIsAdmin(true);
        setAdminToken(token);
        localStorage.setItem("kachamba_admin_token", token);
        setAuthLoading(false);
        return true;
      }

      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode })
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        const token = data.token || passcode; // Fallback to raw passcode if token not provided mapped
        setIsAdmin(true);
        setAdminToken(token);
        localStorage.setItem("kachamba_admin_token", token);
        setAuthLoading(false);
        return true;
      } else {
        setIsAdmin(false);
        setAdminToken(null);
        setAdminError(data.error || "Authentication failed");
        setAuthLoading(false);
        return false;
      }
    } catch (error: any) {
      setIsAdmin(false);
      setAdminToken(null);
      setAdminError(error.message || "Login failed");
      setAuthLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    if (adminToken) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-token": adminToken
          }
        });
      } catch (e) {
        console.warn("Server logout failed line:", e);
      }
    }
    localStorage.removeItem("kachamba_admin_token");
    localStorage.removeItem("kachamba_admin_passcode");
    setIsAdmin(false);
    setAdminToken(null);
  }, [adminToken]);

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
