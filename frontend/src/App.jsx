import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyPage from "./pages/VerifyPage";
import { getToken } from "./auth";

function ProtectedRoute({ children }) {
  const token = getToken();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
