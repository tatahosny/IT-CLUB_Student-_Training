import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import InstructorLayout from './layouts/InstructorLayout';
import StudentLayout from './layouts/StudentLayout';

// Routes & Guards
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

// Pages - Auth
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const FirstLoginPage = lazy(() => import('./pages/auth/FirstLoginPage'));

// Pages - Admin
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const GradingQueue = lazy(() => import('./pages/admin/GradingQueue'));
const SubmissionDetail = lazy(() => import('./pages/admin/SubmissionDetail'));
const TaskManagement = lazy(() => import('./pages/admin/TaskManagement'));
const DetailedAnalytics = lazy(() => import('./pages/admin/DetailedAnalytics'));
const AttendanceManagement = lazy(() => import('./pages/admin/AttendanceManagement'));
const SecurityLogs = lazy(() => import('./pages/admin/SecurityLogs'));
const SessionMonitoring = lazy(() => import('./pages/admin/SessionMonitoring'));
const SessionAttendanceDetail = lazy(() => import('./pages/admin/SessionAttendanceDetail'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

// Pages - Instructor
const InstructorDashboard = lazy(() => import('./pages/instructor/InstructorDashboard'));
const SessionManagement = lazy(() => import('./pages/instructor/SessionManagement'));
const AttendanceControl = lazy(() => import('./pages/instructor/AttendanceControl'));
const StudentAnalytics = lazy(() => import('./pages/instructor/StudentAnalytics'));

// Pages - Mentor
const MentorDashboard = lazy(() => import('./pages/mentor/MentorDashboard'));

// Pages - Student
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const TasksPage = lazy(() => import('./pages/student/TasksPage'));
const GradesPage = lazy(() => import('./pages/student/GradesPage'));
const AttendanceHistory = lazy(() => import('./pages/student/AttendanceHistory'));
const NotificationsPage = lazy(() => import('./pages/student/NotificationsPage'));

// Pages - OC
const OCDashboard = lazy(() => import('./pages/oc/OCDashboard'));

// Loading component
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--color-bg)' }}>
    <div className="loader"></div>
  </div>
);

export default function App() {
  const { user } = useAuthStore();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* First login */}
        <Route
          path="/first-login"
          element={
            <ProtectedRoute>
              <FirstLoginPage />
            </ProtectedRoute>
          }
        />

        {/* Super Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleRoute roles={['super_admin']}>
                <AdminLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="grading" element={<GradingQueue />} />
          <Route path="grading/:id" element={<SubmissionDetail />} />
          <Route path="tasks" element={<TaskManagement />} />
          <Route path="analytics" element={<DetailedAnalytics />} />
          <Route path="attendance" element={<AttendanceManagement />} />
          <Route path="security" element={<SecurityLogs />} />
          <Route path="sessions" element={<SessionMonitoring />} />
          <Route path="sessions/:id" element={<SessionAttendanceDetail />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Instructor */}
        <Route
          path="/instructor"
          element={
            <ProtectedRoute>
              <RoleRoute roles={['instructor', 'super_admin']}>
                <InstructorLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<InstructorDashboard />} />
          <Route path="sessions" element={<SessionManagement />} />
          <Route path="sessions/:id/attendance" element={<AttendanceControl />} />
          <Route path="grading" element={<GradingQueue />} />
          <Route path="grading/:id" element={<SubmissionDetail />} />
          <Route path="tasks" element={<TaskManagement />} />
          <Route path="analytics" element={<DetailedAnalytics />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Mentor */}
        <Route
          path="/mentor"
          element={
            <ProtectedRoute>
              <RoleRoute roles={['mentor', 'mentor_manager', 'super_admin']}>
                <AdminLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<MentorDashboard />} />
          <Route path="grading" element={<GradingQueue />} />
          <Route path="grading/:id" element={<SubmissionDetail />} />
          <Route path="sessions" element={<SessionMonitoring />} />
          <Route path="sessions/:id" element={<SessionAttendanceDetail />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Student */}
        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <RoleRoute roles={['student']}>
                <StudentLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="grades" element={<GradesPage />} />
          <Route path="attendance" element={<AttendanceHistory />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* OC */}
        <Route
          path="/oc"
          element={
            <ProtectedRoute>
              <RoleRoute roles={['oc', 'super_admin']}>
                <AdminLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<OCDashboard />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Root redirect */}
        <Route
          path="/"
          element={
            user ? (
              user.first_login ? (
                <Navigate to="/first-login" replace />
              ) : (
                <Navigate
                  to={
                    user.role?.role_name === 'super_admin' ? '/admin' :
                    user.role?.role_name === 'instructor' ? '/instructor' :
                    user.role?.role_name === 'mentor' || user.role?.role_name === 'mentor_manager' ? '/mentor' :
                    user.role?.role_name === 'oc' ? '/oc' :
                    '/student'
                  }
                  replace
                />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}
