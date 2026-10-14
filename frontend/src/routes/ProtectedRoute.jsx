import { Navigate, useLocation } from "react-router-dom";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useAuth } from "../context/AuthContext";

// Blocks unauthenticated access to the dashboard layout.
// While the session restores (GET /users/me), show a spinner so we
// never flash protected content or bounce to login incorrectly.
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, restoring } = useAuth();
  const location = useLocation();

  if (restoring) return <LoadingSpinner label="Checking session…" />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
