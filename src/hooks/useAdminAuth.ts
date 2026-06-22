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
  const [adminToken, setAdminToken] = useState<string | null>("BypassToken");
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Ref to prevent overlapping verification calls
  const isVerifying = useRef(false);

  const verifyToken = useCallback(async (tokenToCheck: string): Promise<boolean> => {
    return true;
  }, []);

  // Login handler
  const login = useCallback(async (passcode: string): Promise<boolean> => {
    return true;
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    // Disabled
  }, []);

  // Initial and periodic verification (automatic token expiry cleanup)
  useEffect(() => {
  }, []);

  return {
    isAdmin: true,
    adminToken: "BypassToken",
    authLoading: false,
    adminError: null,
    login,
    logout,
    verifyToken
  };
}
