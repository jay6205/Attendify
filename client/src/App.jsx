import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import BackendWarmup from './components/BackendWarmup';

import MainLayout from './layouts/MainLayout';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherCourses from './pages/TeacherCourses';
import TeacherAttendance from './pages/TeacherAttendance';
import TeacherLeaves from './pages/TeacherLeaves';
import TeacherSummary from './pages/TeacherSummary';
import AdminDashboard from './pages/AdminDashboard';
import AdminStudentPerformancePage from './pages/AdminStudentPerformancePage';
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
import SuperAdminDashboard from './pages/superAdmin/SuperAdminDashboard';
import AdminManagementPage from './pages/superAdmin/AdminManagementPage';
import OrganizationManagementPage from './pages/superAdmin/OrganizationManagementPage';
import UsageDashboard from './pages/superAdmin/UsageDashboard';
import StudentLeaderboardPage from './pages/student/AssessmentLeaderboardPage';
import StudentAchievementsPage from './pages/student/StudentAchievementsPage';
import TeacherLeaderboardPage from './pages/teacher/AssessmentLeaderboardPage';
import TeacherFeedbackSummary from './pages/TeacherFeedbackSummary';
import CreateFeedbackForm from './pages/CreateFeedbackForm';
import QuestionPaperBuilderPage from './pages/teacher/QuestionPaperBuilderPage';



// Future Pages
import AIAdvisor from './pages/AIAdvisor';
import Settings from './pages/Settings';
import AlertListPage from './components/alerts/AlertListPage';

function App() {
  return (
    <BackendWarmup>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
          <Route path="/login/student" element={<Login expectedRole="student" portalName="Student Portal" />} />
          <Route path="/login/teacher" element={<Login expectedRole="teacher" portalName="Faculty Portal" />} />
          <Route path="/login/admin" element={<Login expectedRole="admin" portalName="Admin Portal" />} />
          <Route path="/login/parent" element={<Login expectedRole="parent" portalName="Parent Portal" />} />

          <Route path="/login" element={<Navigate to="/login/student" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/success" element={<AuthSuccess />} />

          {/* Root Redirect Logic */}
          <Route path="/" element={<Navigate to="/student" replace />} /> {/* Default to student or login */}

          {/* Student Routes */}
          <Route element={<ProtectedRoute allowedRoles={['student', 'parent']} />}>
            <Route path="/student" element={
              <MainLayout>
                <StudentDashboard />
              </MainLayout>
            } />
            {/* Shared Student Pages */}
            <Route path="/student/achievements" element={<MainLayout><StudentAchievementsPage /></MainLayout>} />
            <Route path="/student/marks" element={<MainLayout><StudentMarks /></MainLayout>} />
            <Route path="/student/performance" element={<MainLayout><MyPerformancePage /></MainLayout>} />
            <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
            <Route path="/student/leaves" element={<MainLayout><StudentLeaves /></MainLayout>} />
            <Route path="/student/leaderboard/:assessmentId" element={<MainLayout><StudentLeaderboardPage /></MainLayout>} />
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
            <Route path="/teacher/leaderboard/:assessmentId" element={<MainLayout><TeacherLeaderboardPage /></MainLayout>} />
            <Route path="/teacher/feedback" element={
              <MainLayout>
                <TeacherFeedbackSummary />
              </MainLayout>
            } />
            <Route path="/teacher/feedback/create" element={
              <MainLayout>
                <CreateFeedbackForm />
              </MainLayout>
            } />
            <Route path="/teacher/question-paper/create" element={
              <MainLayout>
                <QuestionPaperBuilderPage />
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
            <Route path="/admin/system" element={
              <MainLayout>
                <Settings />
              </MainLayout>
            } />
            <Route path="/admin/feedback/create" element={
              <MainLayout>
                <CreateFeedbackForm />
              </MainLayout>
            } />
            <Route path="/admin/feedback" element={
              <MainLayout>
                <TeacherFeedbackSummary />
              </MainLayout>
            } />
            <Route path="/admin/performance" element={
              <MainLayout>
                <AdminStudentPerformancePage />
              </MainLayout>
            } />
          </Route>

          {/* Shared Routes (Consolidated) */}
          {/* Alerts - Student, Parent, Teacher, Admin */}
          <Route element={<ProtectedRoute allowedRoles={['student', 'parent', 'teacher', 'admin']} />}>
            <Route path="/alerts" element={<MainLayout><AlertListPage /></MainLayout>} />
          </Route>

          {/* AI Advisor - Student, Parent, Teacher */}
          <Route element={<ProtectedRoute allowedRoles={['student', 'parent', 'teacher']} />}>
            <Route path="/ai-advisor" element={<MainLayout><AIAdvisor /></MainLayout>} />
          </Route>

          {/* Super Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
            <Route path="/super-admin" element={
              <MainLayout>
                <SuperAdminDashboard />
              </MainLayout>
            } />
            <Route path="/super-admin/organizations" element={
              <MainLayout>
                <OrganizationManagementPage />
              </MainLayout>
            } />
            <Route path="/super-admin/usage" element={
              <MainLayout>
                <UsageDashboard />
              </MainLayout>
            } />
            <Route path="/super-admin/admins" element={
              <MainLayout>
                <AdminManagementPage />
              </MainLayout>
            } />
          </Route>

          {/* Unauthorized / 404 */}
          <Route path="/unauthorized" element={<div className="text-white p-10">Unauthorized Access</div>} />
          <Route path="*" element={<Navigate to="/login/student" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </BackendWarmup>
  );
}

export default App;
