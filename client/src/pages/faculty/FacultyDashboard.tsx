import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { fetchFacultyAnalytics, FacultyAnalytics } from '@/services/analyticsService';
import AttendanceTrendChart from '@/components/analytics/AttendanceTrendChart';
import PerformanceChart from '@/components/analytics/PerformanceChart';

const FacultyDashboard: React.FC = () => {
    const { accessToken } = useAuth();
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [analytics, setAnalytics] = useState<FacultyAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 1. Load active courses for dropdown
    useEffect(() => {
        if (!accessToken) return;
        api.get('/courses/my-courses', accessToken)
            .then(res => {
                const fetched = res.data?.courses || res.courses || [];
                setCourses(fetched);
                if (fetched.length > 0) setSelectedCourseId(fetched[0]._id);
            })
            .catch(console.error);
    }, [accessToken]);

    // 2. Load analytics for selected course
    useEffect(() => {
        if (!accessToken || !selectedCourseId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        fetchFacultyAnalytics(accessToken, selectedCourseId)
            .then(setAnalytics)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [accessToken, selectedCourseId]);

    const activeCourseName = courses.find(c => c._id === selectedCourseId)?.name || 'Course';

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Faculty Insights Hub</h1>
                    <p style={styles.subtitle}>Analyzing student engagement and academic progression dynamically.</p>
                </div>
                {courses.length > 0 && (
                    <select 
                        style={styles.select}
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                    >
                        {courses.map(c => (
                            <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {isLoading ? (
                <div style={styles.loader}>Fetching Analytics Engine Data...</div>
            ) : !analytics || courses.length === 0 ? (
                <div style={styles.empty}>Select an assigned course to view operational KPI charts.</div>
            ) : (
                <div style={styles.grid}>
                    <div style={styles.fullCard}>
                        <h3 style={styles.cardTitle}>Attendance Trajectory : {activeCourseName}</h3>
                        <AttendanceTrendChart data={analytics.attendanceTrends} />
                    </div>

                    <div style={styles.splitCard}>
                        <h3 style={styles.cardTitle}>Assignment Completion Rates</h3>
                        <PerformanceChart 
                            data={analytics.assignmentStats} 
                            nameKey="title" 
                            dataKey="completionRate" 
                            fillColor="#4f46e5"
                        />
                    </div>

                    <div style={styles.splitCard}>
                        <h3 style={styles.cardTitle}>Quiz Score Distribution (%)</h3>
                        <PerformanceChart 
                            data={analytics.quizDistributions} 
                            nameKey="title" 
                            dataKey="averageScorePercentage" 
                            fillColor="#f59e0b"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    page: { padding: '2rem', maxWidth: 1400, margin: '0 auto', fontFamily: "'Inter', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
    title: { fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 },
    subtitle: { fontSize: 14, color: '#6b7280', margin: '4px 0 0' },
    select: { padding: '10px 16px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, fontWeight: 600, background: '#fff', outline: 'none', minWidth: 200, color: '#111827', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    loader: { padding: '4rem', textAlign: 'center', color: '#6b7280', fontSize: 15 },
    empty: { padding: '4rem', textAlign: 'center', color: '#6b7280', fontSize: 15, background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 },
    fullCard: { gridColumn: '1 / -1', background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    splitCard: { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    cardTitle: { margin: '0 0 24px', fontSize: 16, fontWeight: 700, color: '#1f2937' },
};

export default FacultyDashboard;
