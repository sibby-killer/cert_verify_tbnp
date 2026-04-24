import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/public/HomePage.jsx';
import ResultPage from './pages/public/ResultPage.jsx';
import ReportPage from './pages/public/ReportPage.jsx';
import PrintableCertificatePage from './pages/public/PrintableCertificatePage.jsx';
import LoginPage from './pages/admin/LoginPage.jsx';
import DashboardPage from './pages/admin/DashboardPage.jsx';
import CertificatesPage from './pages/admin/CertificatesPage.jsx';
import IssuePage from './pages/admin/IssuePage.jsx';
import StudentsPage from './pages/admin/StudentsPage.jsx';
import CoursesPage from './pages/admin/CoursesPage.jsx';
import LogsPage from './pages/admin/LogsPage.jsx';
import ReportsPage from './pages/admin/ReportsPage.jsx';
import SettingsPage from './pages/admin/SettingsPage.jsx';
import UsersPage from './pages/admin/UsersPage.jsx';
import SetupPage from './pages/admin/SetupPage.jsx';

import ProtectedRoute from './components/admin/ProtectedRoute.jsx';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/verify" element={<ResultPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/certificate/:id" element={<PrintableCertificatePage />} />

        {/* Admin Login & Setup */}
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin/setup" element={<SetupPage />} />

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route path="/admin/certificates" element={<CertificatesPage />} />
          <Route path="/admin/issue" element={<IssuePage />} />
          <Route path="/admin/students" element={<StudentsPage />} />
          <Route path="/admin/courses" element={<CoursesPage />} />
          <Route path="/admin/logs" element={<LogsPage />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
