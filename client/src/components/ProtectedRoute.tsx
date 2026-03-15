import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
    /** Required role to access this route. If omitted, any authenticated user is allowed. */
    role?: UserRole;
}

/**
 * <ProtectedRoute> guards a route with authentication and optional RBAC.
 * - Unauthenticated users are redirected to /login (with the attempted path saved for post-login redirect).
 * - Authenticated users with the wrong role are redirected to their own dashboard.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    // Not logged in → redirect to login, preserving intended destination
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Logged in but wrong role → redirect to their portal
    if (role && user?.role !== role) {
        const dashboardMap: Record<UserRole, string> = {
            student: '/student/dashboard',
            faculty: '/faculty/dashboard',
            admin: '/admin/dashboard',
        };
        return <Navigate to={dashboardMap[user!.role]} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
