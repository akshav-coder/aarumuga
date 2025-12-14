import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Box, CircularProgress } from "@mui/material";

function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requiredRole) {
    const roleHierarchy = {
      admin: ["admin"],
      manager: ["admin", "manager"],
      employee: ["admin", "manager", "employee"],
    };

    const allowedRoles = roleHierarchy[requiredRole] || [];
    if (!allowedRoles.includes(user?.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;


