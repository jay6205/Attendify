import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import MainLayout from './layouts/MainLayout';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherCourses from './pages/TeacherCourses';
import TeacherAttendance from './pages/TeacherAttendance';
import TeacherLeaves from './pages/TeacherLeaves';
import TeacherSummary from './pages/TeacherSummary';
import AdminDashboard from './pages/AdminDashboard';
import StudentLeaves from './pages/StudentLeaves';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthSuccess from './pages/AuthSuccess';
import TeacherMarks from './pages/TeacherMarks';
import CreateAssessment from './pages/CreateAssessment';
import EnterMarks from './pages/EnterMarks';
import MarksAnalyticsPage from './pages/MarksAnalyticsPage';
import StudentMarks from './pages/StudentMarks';
import MyPerformancePage from './pages/MyPerformancePage';
import StudentPerformancePage from './pages/StudentPerformancePage';

// Future Pages
import AIAdvisor from './pages/AIAdvisor';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login/student" element={<Login expectedRole="student" portalName="Student Portal" />} />
          <Route path="/login/teacher" element={<Login expectedRole="teacher" portalName="Faculty Portal" />} />
          <Route path="/login/admin" element={<Login expectedRole="admin" portalName="Admin Portal" />} />

          <Route path="/login" element={<Navigate to="/login/student" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/success" element={<AuthSuccess />} />

          {/* Root Redirect Logic */}
          <Route path="/" element={<Navigate to="/student" replace />} /> {/* Default to student or login */}

          {/* Student Routes */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student" element={
              <MainLayout>
                <StudentDashboard />
              </MainLayout>
            } />
            {/* Shared Student Pages */}
            <Route path="/student/marks" element={<MainLayout><StudentMarks /></MainLayout>} />
            <Route path="/student/performance" element={<MainLayout><MyPerformancePage /></MainLayout>} />
            <Route path="/ai-advisor" element={<MainLayout><AIAdvisor /></MainLayout>} />
            <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
            <Route path="/student/leaves" element={<MainLayout><StudentLeaves /></MainLayout>} />
          </Route>

          {/* Teacher Routes */}
          <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
            <Route path="/teacher" element={
              <MainLayout>
                <TeacherDashboard />
              </MainLayout>
            } />
            <Route path="/teacher/courses" element={
              <MainLayout>
                <TeacherCourses />
              </MainLayout>
            } />
            <Route path="/teacher/attendance" element={
              <MainLayout>
                <TeacherAttendance />
              </MainLayout>
            } />
            <Route path="/teacher/leaves" element={
              <MainLayout>
                <TeacherLeaves />
              </MainLayout>
            } />
            <Route path="/teacher/summary" element={
              <MainLayout>
                <TeacherSummary />
              </MainLayout>
            } />
            <Route path="/teacher/marks" element={
              <MainLayout>
                <TeacherMarks />
              </MainLayout>
            } />
            <Route path="/teacher/marks/create" element={
              <MainLayout>
                <CreateAssessment />
              </MainLayout>
            } />
            <Route path="/teacher/marks/:assessmentId/enter" element={
              <MainLayout>
                <EnterMarks />
              </MainLayout>
            } />
            <Route path="/teacher/marks/analytics" element={
              <MainLayout>
                <MarksAnalyticsPage />
              </MainLayout>
            } />
            <Route path="/teacher/student-performance" element={
                <MainLayout>
                    <StudentPerformancePage />
                </MainLayout>
            } />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={
              <MainLayout>
                <AdminDashboard />
              </MainLayout>
            } />
          </Route>

          {/* Unauthorized / 404 */}
          <Route path="/unauthorized" element={<div className="text-white p-10">Unauthorized Access</div>} />
          <Route path="*" element={<Navigate to="/login/student" />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
