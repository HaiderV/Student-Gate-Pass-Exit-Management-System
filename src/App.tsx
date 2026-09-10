import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { ToastProvider } from '@/context/ToastContext';
import Layout from '@/components/layout/Layout';
import LandingPage from '@/pages/LandingPage';
import DegreeSecurity from '@/pages/DegreeSecurity';
import JuniorSecurity from '@/pages/JuniorSecurity';
import DegreeReception from '@/pages/DegreeReception';
import JuniorReception from '@/pages/JuniorReception';
import AdminDashboard from '@/pages/AdminDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/security/degree" element={<DegreeSecurity />} />
              <Route path="/security/junior" element={<JuniorSecurity />} />
              <Route path="/reception/degree" element={<DegreeReception />} />
              <Route path="/reception/junior" element={<JuniorReception />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AppProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
