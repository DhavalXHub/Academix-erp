import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchStudentAnalytics, StudentAnalytics } from '@/services/analyticsService';
import FinanceStatsCards from '@/components/FinanceStatsCards'; // Reusing our stats card component

const StudentDashboard: React.FC = () => {
    const { accessToken } = useAuth();
    const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!accessToken) return;
        setIsLoading(true);
        fetchStudentAnalytics(accessToken)
            .then(res => setAnalytics(res))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [accessToken]);

    if (isLoading) return <div style={styles.loader}>Loading Analytics...</div>;

    if (!analytics) return (
        <div style={styles.errorContainer}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h3 style={styles.errorTitle}>Something went wrong</h3>
            <p style={styles.errorText}>Unable to load your analytics dashboard. Please try again later.</p>
            <button style={styles.retryBtn} onClick={() => window.location.reload()}>Retry</button>
        </div>
    );

    const stats = [
        { label: 'Overall Perf', value: `${analytics.overallScore}%`, color: '#4f46e5', icon: '🏆' },
        { label: 'Attendance', value: `${analytics.attendancePercentage}%`, color: '#10b981', icon: '📅' },
        { label: 'Avg Assignment', value: `${analytics.assignmentAverage}%`, color: '#f59e0b', icon: '✍️' },
        { label: 'Avg Quiz', value: `${analytics.quizAverage}%`, color: '#9333ea', icon: '📝' },
    ];

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>Academic Overview</h1>
                <p style={styles.subtitle}>Track your live performance metrics and stay on top of your studies.</p>
            </div>

            <FinanceStatsCards stats={stats} />

            <div style={styles.grid}>
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Performance Breakdown</h3>
                    <div style={styles.progressBarWrapper}>
                        <div style={styles.progressLabel}>
                            <span>Attendance Score</span>
                            <span>{analytics.attendancePercentage}%</span>
                        </div>
                        <div style={styles.progressTrack}>
                            <div style={{ ...styles.progressFill, width: `${analytics.attendancePercentage}%`, backgroundColor: '#10b981' }} />
                        </div>
                    </div>
                    <div style={styles.progressBarWrapper}>
                        <div style={styles.progressLabel}>
                            <span>Assignment Rating</span>
                            <span>{analytics.assignmentAverage}%</span>
                        </div>
                        <div style={styles.progressTrack}>
                            <div style={{ ...styles.progressFill, width: `${analytics.assignmentAverage}%`, backgroundColor: '#f59e0b' }} />
                        </div>
                    </div>
                    <div style={styles.progressBarWrapper}>
                        <div style={styles.progressLabel}>
                            <span>Quiz Proficiency</span>
                            <span>{analytics.quizAverage}%</span>
                        </div>
                        <div style={styles.progressTrack}>
                            <div style={{ ...styles.progressFill, width: `${analytics.quizAverage}%`, backgroundColor: '#9333ea' }} />
                        </div>
                    </div>
                </div>

                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>System Analysis</h3>
                    <div style={styles.analysisBox}>
                        {analytics.overallScore >= 80 ? (
                            <p style={{ margin: 0, color: '#15803d', fontWeight: 600 }}>🌟 Excellent trajectory! Keep up the good work.</p>
                        ) : analytics.overallScore >= 60 ? (
                            <p style={{ margin: 0, color: '#b45309', fontWeight: 600 }}>📈 Doing well, but there is room for precise improvement in areas highlighted.</p>
                        ) : (
                            <p style={{ margin: 0, color: '#dc2626', fontWeight: 600 }}>⚠ Your metrics indicate you may be falling behind. Please reach out to your faculty.</p>
                        )}
                        <p style={{ color: '#4b5563', fontSize: 13, marginTop: 12 }}>Metrics are calculated strictly against recorded assignments, attendances, and quizzes within active rosters.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    page: { padding: '2rem', maxWidth: 1200, margin: '0 auto', fontFamily: "'Inter', sans-serif" },
    header: { marginBottom: 32 },
    title: { fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 },
    subtitle: { fontSize: 14, color: '#6b7280', margin: '4px 0 0' },
    loader: { padding: '4rem', textAlign: 'center', fontSize: 16, color: '#6b7280' },
    errorContainer: { padding: '5rem 2rem', textAlign: 'center', maxWidth: 400, margin: '0 auto' },
    errorTitle: { fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 8px' },
    errorText: { fontSize: 14, color: '#6b7280', margin: '0 0 24px', lineHeight: 1.6 },
    retryBtn: { padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 },
    card: { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    cardTitle: { margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#111827' },
    progressBarWrapper: { marginBottom: 16 },
    progressLabel: { display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
    progressTrack: { height: 10, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 99, transition: 'width 1s ease-out' },
    analysisBox: { padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', height: 'calc(100% - 44px)' },
};

export default StudentDashboard;
