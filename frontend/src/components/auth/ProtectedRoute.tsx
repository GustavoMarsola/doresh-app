import { Navigate, Outlet } from "react-router-dom";
import { isTokenExpired } from "@/components/auth/utils";

const ProtectedRoute = () => {
  const token   = localStorage.getItem("token");
  const expired = token ? isTokenExpired(token) : true;

  if (!token || expired) {
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
