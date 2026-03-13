import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p style={{ textAlign: "center" }}>Checking authentication...</p>;
  }

  if (!isAuthenticated) {
    localStorage.setItem(
      "redirectAfterLogin",
      location.pathname + location.search
    );
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
