import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RfpListPage from './pages/RfpListPage';
import RfpDetailPage from './pages/RfpDetailPage';
import NewRfpPage from './pages/NewRfpPage';
import ProposalPage from './pages/ProposalPage';
import CompetitorsPage from './pages/CompetitorsPage';
import HistoricalDataPage from './pages/HistoricalDataPage';
import CompanyProfilePage from './pages/CompanyProfilePage';
import LoadingSpinner from './components/common/LoadingSpinner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, user, loading } = useAuthStore();

  if (!token) return <Navigate to="/login" replace />;
  if (loading || !user) return <LoadingSpinner size="lg" />;

  return <>{children}</>;
}

export default function App() {
  const { token, loadUser } = useAuthStore();

  useEffect(() => {
    if (token) loadUser();
  }, [token, loadUser]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/rfps" element={<RfpListPage />} />
        <Route path="/rfps/new" element={<NewRfpPage />} />
        <Route path="/rfps/:id" element={<RfpDetailPage />} />
        <Route path="/rfps/:id/proposals/:pid" element={<ProposalPage />} />
        <Route path="/competitors" element={<CompetitorsPage />} />
        <Route path="/historical" element={<HistoricalDataPage />} />
        <Route path="/company-profile" element={<CompanyProfilePage />} />
      </Route>
    </Routes>
  );
}
