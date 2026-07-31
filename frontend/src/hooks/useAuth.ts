import { useEffect, useState } from "react";
import { auth, subscribeAuth, type AuthUser } from "../services/auth";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => auth.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => auth.isAuthenticated());

  useEffect(() => {
    const sync = () => {
      setUser(auth.getUser());
      setIsAuthenticated(auth.isAuthenticated());
    };
    return subscribeAuth(sync);
  }, []);

  return { user, isAuthenticated };
}
