import { createContext, useContext, useEffect, useState } from "react";
import {
  isAuthenticated as checkToken,
  logout as serviceLogout,
} from "../Auth/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuth = () => {
    const valid = checkToken();
    setIsAuth(valid);
    setLoading(false);
    return valid;
  };

  const logout = () => {
    serviceLogout();     // token remove
    setIsAuth(false);    // 🔥 CONTEXT UPDATE (MOST IMPORTANT)
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: isAuth,
        loading,
        refreshAuth: checkAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
