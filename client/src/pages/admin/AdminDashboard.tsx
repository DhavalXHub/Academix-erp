import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAdminAnalytics, AdminAnalytics } from '@/services/analyticsService';
import FinanceStatsCards from '@/components/FinanceStatsCards';
import RevenueChart from '@/components/analytics/RevenueChart';
import DepartmentComparisonChart from '@/components/analytics/DepartmentComparisonChart';

const AdminDashboard: React.FC = () => {
    const { accessToken } = useAuth();
    const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!accessToken) return;
        setIsLoading(true);
        fetchAdminAnalytics(accessToken)
            .then(setAnalytics)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [accessToken]);

    if (isLoading) return <div style={styles.loader}>Compiling Organization Telemetry...</div>;
    if (!analytics) return <div style={styles.error}>Unable to load administrative telemetry payload.</div>;

    const topLevelStats = [
        { label: 'Active Students', value: analytics.totalStudents, color: '#4f46e5', icon: '👨‍🎓' },
        { label: 'Total Faculty', value: analytics.totalFaculty, color: '#10b981', icon: '👨‍🏫' },
        { label: 'Active Courses', value: analytics.totalCourses, color: '#f59e0b', icon: '📚' },
        { label: 'Pending Dues ($)', value: `$${analytics.pendingDues.toLocaleString()}`, color: '#ef4444', icon: '⏳' },
    ];

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>System Control Center</h1>
                <p style={styles.subtitle}>Elevated privileges: monitoring campus vitals and cashflow trajectories.</p>
            </div>

            <FinanceStatsCards stats={topLevelStats} />

            <div style={styles.grid}>
                <div style={styles.cardLarge}>
                    <div style={styles.cardHeader}>
                        <h3 style={styles.cardTitle}>Revenue Collection Trajectory</h3>
                        <span style={styles.badgeSuccess}>Total Mined: ${analytics.totalRevenue.toLocaleString()}</span>
                    </div>
                    <RevenueChart data={analytics.revenueTrend} />
                </div>

                <div style={styles.cardSmall}>
                    <div style={styles.cardHeader}>
                        <h3 style={styles.cardTitle}>Department Scale</h3>
                    </div>
                    <DepartmentComparisonChart data={analytics.deptPerformance} />
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    page: { padding: '2rem', maxWidth: 1400, margin: '0 auto', fontFamily: "'Inter', sans-serif" },
    header: { marginBottom: 32 },
    title: { fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 },
    subtitle: { fontSize: 14, color: '#6b7280', margin: '4px 0 0' },
    loader: { padding: '4rem', textAlign: 'center', fontSize: 15, color: '#6b7280' },
    error: { padding: '4rem', textAlign: 'center', fontSize: 15, color: '#dc2626' },
    grid: { display: 'grid', gridTemplateColumns: '7fr 4fr', gap: 24 },
    cardLarge: { background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    cardSmall: { background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    cardTitle: { margin: 0, fontSize: 16, fontWeight: 700, color: '#1f2937' },
    badgeSuccess: { background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: 99, fontSize: 13, fontWeight: 700 }
};

export default AdminDashboard;
