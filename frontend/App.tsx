import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PaymentProvider } from './context/PaymentContext';
import Header from './components/Header';
import Footer from './components/Footer';
import { useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';

// Lazy loading des composants avec code splitting
const HomePage = React.lazy(() => import('./pages/HomePage'));
const FindRiderPage = React.lazy(() => import('./pages/FindRiderPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const RegisterClientPage = React.lazy(() => import('./pages/RegisterClientPage'));
const ClientDashboardPage = React.lazy(() => import('./pages/ClientDashboardPage'));
const RiderDashboardPage = React.lazy(() => import('./pages/RiderDashboardPage'));
const AdminDashboardPage = React.lazy(() => import('./pages/AdminDashboardPage'));
const SubscriptionPage = React.lazy(() => import('./pages/SubscriptionPage'));

// Composant de fallback pour le lazy loading
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const ScrollToTop: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return null;
};

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

const InactivityAutoLogout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const INACTIVITY_MS = 5 * 60_000;
    let timeoutId: number | undefined;

    const reset = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        logout();
        navigate('/', { replace: true });
      }, INACTIVITY_MS);
    };

    const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    for (const ev of events) window.addEventListener(ev, reset, { passive: true } as any);
    reset();

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      for (const ev of events) window.removeEventListener(ev, reset as any);
    };
  }, [logout, navigate, user]);

  return null;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PaymentProvider>
          <ToastProvider>
            <div className="min-h-screen flex flex-col bg-slate-50">
              <ScrollToTop />
              <InactivityAutoLogout />
              <Header />
              <main className="flex-grow">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route
                      path="/find-rider"
                      element={
                        <RequireAuth>
                          <FindRiderPage />
                        </RequireAuth>
                      }
                    />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/register-client" element={<RegisterClientPage />} />
                    <Route
                      path="/client"
                      element={
                        <RequireAuth>
                          <ClientDashboardPage />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/rider-dashboard"
                      element={
                        <RequireAuth>
                          <RiderDashboardPage />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <RequireAuth>
                          <AdminDashboardPage />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/subscription"
                      element={
                        <RequireAuth>
                          <SubscriptionPage />
                        </RequireAuth>
                      }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
              <ToastContainer />
            </div>
          </ToastProvider>
        </PaymentProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

