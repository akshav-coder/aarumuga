import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import DashboardPage from './pages/DashboardPage';
import PurchasePage from './pages/PurchasePage';
import SalesPage from './pages/SalesPage';
import StockPage from './pages/StockPage';
import CustomerPage from './pages/CustomerPage';
import SupplierPage from './pages/SupplierPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/purchases" element={<PurchasePage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/customers" element={<CustomerPage />} />
        <Route path="/suppliers" element={<SupplierPage />} />
      </Routes>
    </Layout>
  );
}

export default App;

