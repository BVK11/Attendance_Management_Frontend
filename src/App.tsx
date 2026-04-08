import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import FacultyDashboard from './pages/FacultyDashboard';
import HodDashboard from './pages/HodDashboard';
import MentorDashboard from './pages/MentorDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StudentAttendance from './pages/StudentAttendance';
import StudentTimetable from './pages/StudentTimetable';
import AttendancePage from './pages/AttendancePage';
import AdminManagement from './pages/AdminManagement';
import { UserRole } from './types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { user } = useAuth();
  if (!user || user.role !== role) {
    return <Navigate to="/" />;
  }
  return <>{children}</>;
};

const getDashboardPath = (role: UserRole) => {
    switch (role) {
        case UserRole.Faculty: return '/faculty-dashboard';
        case UserRole.Hod: return '/hod-dashboard';
        case UserRole.Mentor: return '/mentor-dashboard';
        case UserRole.Student: return '/student-dashboard';
        default: return '/';
    }
};

const AppRoutes: React.FC = () => {
    const { user } = useAuth();
    return (
        <Routes>
            <Route path="/" element={
                user ? <Navigate to={getDashboardPath(user.role)} /> : <LoginPage />
            } />
            
            <Route path="/faculty-dashboard" element={
                <ProtectedRoute role={UserRole.Faculty}>
                    <FacultyDashboard />
                </ProtectedRoute>
            } />
            <Route path="/attendance/:department/:section" element={
                 <ProtectedRoute role={UserRole.Faculty}>
                    <AttendancePage />
                </ProtectedRoute>
            } />
            
            <Route path="/hod-dashboard" element={
                 <ProtectedRoute role={UserRole.Hod}>
                    <HodDashboard />
                </ProtectedRoute>
            } />
            <Route path="/admin-management" element={
                 <ProtectedRoute role={UserRole.Hod}>
                    <AdminManagement />
                </ProtectedRoute>
            } />
            
            <Route path="/mentor-dashboard" element={
                <ProtectedRoute role={UserRole.Mentor}>
                    <MentorDashboard />
                </ProtectedRoute>
            } />

            {/* Student Portal Routes */}
            <Route path="/student-dashboard" element={
                <ProtectedRoute role={UserRole.Student}>
                    <StudentDashboard />
                </ProtectedRoute>
            } />
            <Route path="/student-attendance" element={
                <ProtectedRoute role={UserRole.Student}>
                    <StudentAttendance />
                </ProtectedRoute>
            } />
            <Route path="/student-timetable" element={
                <ProtectedRoute role={UserRole.Student}>
                    <StudentTimetable />
                </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};


const App: React.FC = () => {
  return (
    <AuthProvider>
        <HashRouter>
            <AppRoutes />
        </HashRouter>
    </AuthProvider>
  );
};

export default App;
