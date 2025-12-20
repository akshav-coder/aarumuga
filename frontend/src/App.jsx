import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PurchasePage from "./pages/PurchasePage";
import SalesPage from "./pages/SalesPage";
import StockPage from "./pages/StockPage";
import CustomerPage from "./pages/CustomerPage";
import SupplierPage from "./pages/SupplierPage";
import SupplierPaymentPage from "./pages/SupplierPaymentPage";
import { useAuth } from "./contexts/AuthContext";

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/purchases" element={<PurchasePage />} />
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/stock" element={<StockPage />} />
                <Route path="/customers" element={<CustomerPage />} />
                <Route path="/suppliers" element={<SupplierPage />} />
                <Route path="/supplier-payments" element={<SupplierPaymentPage />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
