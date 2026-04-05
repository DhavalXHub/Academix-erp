import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';

// Layouts & Protection
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentLayout from '@/components/layouts/StudentLayout';
import FacultyLayout from '@/components/layouts/FacultyLayout';
import AdminLayout from '@/components/layouts/AdminLayout';

// Shared Pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import PricingPage from '@/pages/PricingPage';
import ProfilePage from '@/pages/ProfilePage';

// Student Pages
import StudentDashboard from '@/pages/student/StudentDashboard';
import StudentCoursesPage from '@/pages/student/StudentCoursesPage';
import StudentAttendancePage from '@/pages/student/StudentAttendancePage';
import StudentQuizPage from '@/pages/student/StudentQuizPage';
import StudentFeesPage from '@/pages/student/StudentFeesPage';
import StudentMessagesPage from '@/pages/student/StudentMessagesPage';
import StudentAssignmentsPage from '@/pages/student/StudentAssignmentsPage';

// Faculty Pages
import FacultyDashboard from '@/pages/faculty/FacultyDashboard';
import FacultyCoursesPage from '@/pages/faculty/FacultyCoursesPage';
import FacultyAttendancePage from '@/pages/faculty/FacultyAttendancePage';
import FacultyAssignmentsPage from '@/pages/faculty/FacultyAssignmentsPage';
import FacultyQuizPage from '@/pages/faculty/FacultyQuizPage';
import FacultyQuizAttemptsPage from '@/pages/faculty/FacultyQuizAttemptsPage';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminCoursesPage from '@/pages/admin/AdminCoursesPage';
import AdminFinancePage from '@/pages/admin/AdminFinancePage';
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage';
import AdminAnnouncementsPage from '@/pages/admin/AdminAnnouncementsPage';

import MessagesPage from '@/pages/common/MessagesPage';

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <SocketProvider>
                <Routes>
                    {/* Public Route */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/pricing" element={<PricingPage />} />

                    {/* Student Routes */}
                    <Route path="/student" element={<ProtectedRoute allowedRoles={['student']} />}>
                        <Route element={<StudentLayout />}>
                            <Route index element={<Navigate to="/student/dashboard" replace />} />
                            <Route path="dashboard" element={<StudentDashboard />} />
                            <Route path="courses" element={<StudentCoursesPage />} />
                            <Route path="attendance" element={<StudentAttendancePage />} />
                            <Route path="assignments" element={<StudentAssignmentsPage />} />
                            <Route path="quizzes" element={<StudentQuizPage />} />
                            <Route path="fees" element={<StudentFeesPage />} />
                            <Route path="messages" element={<StudentMessagesPage />} />
                            <Route path="profile" element={<ProfilePage />} />
                        </Route>
                    </Route>

                    {/* Faculty Routes */}
                    <Route path="/faculty" element={<ProtectedRoute allowedRoles={['faculty']} />}>
                        <Route element={<FacultyLayout />}>
                            <Route index element={<Navigate to="/faculty/dashboard" replace />} />
                            <Route path="dashboard" element={<FacultyDashboard />} />
                            <Route path="courses" element={<FacultyCoursesPage />} />
                            <Route path="attendance" element={<FacultyAttendancePage />} />
                            <Route path="assignments" element={<FacultyAssignmentsPage />} />
                            <Route path="quizzes" element={<FacultyQuizPage />} />
                            <Route path="quizzes/:quizId/attempts" element={<FacultyQuizAttemptsPage />} />
                            <Route path="messages" element={<MessagesPage />} />
                            <Route path="profile" element={<ProfilePage />} />
                        </Route>
                    </Route>

                    {/* Admin Routes */}
                    <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route element={<AdminLayout />}>
                            <Route index element={<Navigate to="/admin/dashboard" replace />} />
                            <Route path="dashboard" element={<AdminDashboard />} />
                            <Route path="users" element={<AdminUsersPage />} />
                            <Route path="courses" element={<AdminCoursesPage />} />
                            <Route path="finance" element={<AdminFinancePage />} />
                            <Route path="analytics" element={<AdminAnalyticsPage />} />
                            <Route path="announcements" element={<AdminAnnouncementsPage />} />
                            <Route path="messages" element={<MessagesPage />} />
                            <Route path="profile" element={<ProfilePage />} />
                        </Route>
                    </Route>

                    {/* Catch All - 404 */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
                </SocketProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;
