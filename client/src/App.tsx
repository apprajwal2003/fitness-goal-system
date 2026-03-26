import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/Layout/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { SchedulePage } from './pages/SchedulePage';
import { CalendarPage } from './pages/CalendarPage';
import { ProgressPage } from './pages/ProgressPage';
import { SquadPage } from './pages/SquadPage';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute requireOnboarding>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireOnboarding>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule"
            element={
              <ProtectedRoute requireOnboarding>
                <AppLayout>
                  <SchedulePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute requireOnboarding>
                <AppLayout>
                  <CalendarPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute requireOnboarding>
                <AppLayout>
                  <ProgressPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/squad"
            element={
              <ProtectedRoute requireOnboarding>
                <AppLayout>
                  <SquadPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute requireOnboarding>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
