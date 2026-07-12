import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { I18nProvider } from './context/I18nContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import DashboardLayout from './pages/Dashboard/DashboardLayout';
import DashboardHome from './pages/Dashboard/DashboardHome';
import UploadEditorView from './pages/Dashboard/UploadEditorView';
import VideosView from './pages/Dashboard/VideosView';
import SettingsView from './pages/Dashboard/SettingsView';
import AccountView from './pages/Dashboard/AccountView';
import AdminView from './pages/Dashboard/AdminView';
import TimelineEditor from './pages/Editor/TimelineEditor';

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <ToastProvider>
          <HashRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Protected Dashboard and Editor Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<DashboardHome />} />
                  <Route path="/dashboard/fulledit" element={<UploadEditorView />} />
                  <Route path="/dashboard/editor" element={<UploadEditorView />} />
                  <Route path="/dashboard/captions" element={<UploadEditorView />} />
                  <Route path="/dashboard/repetitions" element={<UploadEditorView />} />
                  <Route path="/dashboard/videos" element={<VideosView />} />
                  <Route path="/dashboard/settings" element={<SettingsView />} />
                  <Route path="/dashboard/account" element={<AccountView />} />
                  <Route path="/dashboard/admin" element={<AdminView />} />
                </Route>
                <Route path="/dashboard/timeline" element={<TimelineEditor />} />
              </Route>

              {/* Redirects */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </HashRouter>
        </ToastProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
