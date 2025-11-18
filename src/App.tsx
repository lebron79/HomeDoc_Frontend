import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthPage } from './components/Auth/AuthPage';
import { PatientDashboard } from './components/Patient/PatientDashboard';
import { DoctorDashboard } from './components/Doctor/DoctorDashboard';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { LandingPage } from './components/LandingPage';
import { Navbar } from './components/Layout/Navbar';
import { NotificationToast } from './components/Notifications/NotificationToast';
import MedicationsPage from './pages/MedicationsPage';
import ProfilePage from './pages/ProfilePage';
import CommonDiseasesPage from './pages/CommonDiseasesPage';
import HistoryPage from './pages/HistoryPage';
import HealthAssessmentPage from './pages/HealthAssessmentPage';
import { MedicationStore } from './pages/MedicationStorePage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { PaymentCanceledPage } from './pages/PaymentCanceledPage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { HeartbeatLoader } from './components/Layout/HeartbeatLoader';
import { CreateCaseForm } from './components/Patient/CreateCaseForm';
import { PatientCasesList } from './components/Patient/PatientCasesList';
import { DoctorCasesList } from './components/Doctor/DoctorCasesList';

// Landing Page Wrapper to use navigation
function LandingPageWrapper() {
  const navigate = useNavigate();
  return <LandingPage onGetStarted={() => navigate('/login')} />;
}

// Auth Page Wrapper to use navigation
function AuthPageWrapper() {
  const navigate = useNavigate();
  return <AuthPage onBack={() => navigate('/')} />;
}

// Protected Route Component
function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <HeartbeatLoader />;
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && profile.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// Dashboard Layout Component
function DashboardLayout({ children, role }: { children: React.ReactNode; role?: string }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        {children}
      </main>
    </div>
  );
}

// Medications Layout (no padding since the page has its own layout)
function MedicationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        {children}
      </main>
    </div>
  );
}

// Unauthorized Page
function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <HeartbeatLoader />;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPageWrapper />} />
        <Route path="/login" element={<AuthPageWrapper />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout role={profile?.role}>
                {profile?.role === 'patient' && <PatientDashboard />}
                {profile?.role === 'doctor' && <DoctorDashboard />}
                {profile?.role === 'admin' && <AdminDashboard />}
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Role-specific Routes */}
        <Route
          path="/patient-dashboard"
          element={
            <ProtectedRoute requiredRole="patient">
              <DashboardLayout role="patient">
                <PatientDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor-dashboard"
          element={
            <ProtectedRoute requiredRole="doctor">
              <DashboardLayout role="doctor">
                <DoctorDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <DashboardLayout role="admin">
                <AdminDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Redirect old admin-dashboard route to new /admin route */}
        <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />

        {/* Medications Route - Available for all authenticated users */}
        <Route
          path="/medications"
          element={
            <ProtectedRoute>
              <MedicationsLayout>
                <MedicationsPage />
              </MedicationsLayout>
            </ProtectedRoute>
          }
        />

        {/* Medication Store Route - Only for Doctors */}
        <Route
          path="/medication-store"
          element={
            <ProtectedRoute requiredRole="doctor">
              <MedicationStore />
            </ProtectedRoute>
          }
        />

        {/* Payment Routes - Only for Doctors */}
        <Route
          path="/payment-success"
          element={
            <ProtectedRoute requiredRole="doctor">
              <PaymentSuccessPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment-canceled"
          element={
            <ProtectedRoute requiredRole="doctor">
              <PaymentCanceledPage />
            </ProtectedRoute>
          }
        />

        {/* Order History - Only for Doctors */}
        <Route
          path="/order-history"
          element={
            <ProtectedRoute requiredRole="doctor">
              <OrderHistoryPage />
            </ProtectedRoute>
          }
        />

        {/* Create Case - Only for Patients */}
        <Route
          path="/create-case"
          element={
            <ProtectedRoute requiredRole="patient">
              <DashboardLayout role="patient">
                <CreateCaseForm />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* My Cases - Only for Patients */}
        <Route
          path="/my-cases"
          element={
            <ProtectedRoute requiredRole="patient">
              <DashboardLayout role="patient">
                <PatientCasesList />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Doctor Cases - Only for Doctors */}
        <Route
          path="/doctor-cases"
          element={
            <ProtectedRoute requiredRole="doctor">
              <DashboardLayout role="doctor">
                <DoctorCasesList />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <DashboardLayout role={profile?.role}>
                <ProfilePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/common-diseases"
          element={
            <ProtectedRoute>
              <DashboardLayout role={profile?.role}>
                <CommonDiseasesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <DashboardLayout role={profile?.role}>
                <HistoryPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/health-assessment"
          element={
            <ProtectedRoute>
              <HealthAssessmentPage />
            </ProtectedRoute>
          }
        />

        {/* Redirect authenticated users to dashboard */}
        <Route
          path="*"
          element={
            user && profile ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <NotificationToast />
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
