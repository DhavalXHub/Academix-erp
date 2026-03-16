import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAdminAnalytics } from '@/services/analyticsService';
import type { AdminAnalytics } from '@/services/analyticsService';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    LineChart,
    Line,
    Legend,
} from 'recharts';

const AdminAnalyticsPage: React.FC = () => {
    const { accessToken } = useAuth();
    const [data, setData] = useState<AdminAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!accessToken) return;
        const load = async () => {
            setIsLoading(true);
            setError('');
            try {
                const res = await fetchAdminAnalytics(accessToken);
                setData(res);
            } catch (e: any) {
                setError(e?.message || 'Failed to load analytics.');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [accessToken]);

    const kpis = useMemo(() => {
        if (!data) return [];
        return [
            { label: 'Students', value: data.totalStudents, color: '#3b82f6' },
            { label: 'Faculty', value: data.totalFaculty, color: '#8b5cf6' },
            { label: 'Courses', value: data.totalCourses, color: '#10b981' },
            { label: 'Revenue', value: `$${Number(data.totalRevenue || 0).toLocaleString()}`, color: '#059669' },
            { label: 'Pending Dues', value: `$${Number(data.pendingDues || 0).toLocaleString()}`, color: '#ef4444' },
        ];
    }, [data]);

    if (isLoading) return <div style={styles.state}>Loading analytics…</div>;
    if (error) return <div style={{ ...styles.state, ...styles.stateError }}>{error}</div>;
    if (!data) return null;

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>Deep Analytics</h1>
                <p style={styles.subtitle}>Student performance and revenue telemetry</p>
            </div>

            <div style={styles.kpiGrid}>
                {kpis.map(k => (
                    <div key={k.label} style={styles.kpiCard}>
                        <div style={styles.kpiLabel}>{k.label}</div>
                        <div style={{ ...styles.kpiValue, color: k.color }}>{k.value}</div>
                    </div>
                ))}
            </div>

            <div style={styles.chartsGrid}>
                <div style={styles.chartCard}>
                    <div style={styles.chartHeader}>
                        <h3 style={styles.chartTitle}>Department Performance</h3>
                        <span style={styles.chartHint}>Enrollments by department</span>
                    </div>
                    <div style={styles.chartBody}>
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={data.deptPerformance || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="enrollments" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={styles.chartCard}>
                    <div style={styles.chartHeader}>
                        <h3 style={styles.chartTitle}>Revenue Trend</h3>
                        <span style={styles.chartHint}>Monthly revenue trajectory</span>
                    </div>
                    <div style={styles.chartBody}>
                        <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={data.revenueTrend || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    page: { padding: '2rem', maxWidth: 1200, margin: '0 auto', fontFamily: "'Inter', sans-serif" },
    header: { marginBottom: '1.5rem' },
    title: { fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0 },
    subtitle: { fontSize: 14, color: '#64748b', margin: '6px 0 0' },
    state: { padding: '4rem', textAlign: 'center', color: '#6b7280' },
    stateError: { background: '#fef2f2', color: '#b91c1c', borderRadius: 12, border: '1px solid #fecaca', margin: '1.5rem 0' },

    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 },
    kpiCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    kpiLabel: { fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' },
    kpiValue: { fontSize: 22, fontWeight: 800, marginTop: 10 },

    chartsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: 16 },
    chartCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    chartHeader: { padding: '16px 16px 0' },
    chartTitle: { margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' },
    chartHint: { display: 'block', marginTop: 4, fontSize: 13, color: '#6b7280' },
    chartBody: { padding: 12 },
};

export default AdminAnalyticsPage;

