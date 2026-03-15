import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchTeachingCourses, fetchCourseRoster } from '../../services/courseService';
import { markAttendance, fetchCourseAttendance } from '../../services/attendanceService';
import type { Course, Enrollment } from '../../services/courseService';
import type { MarkAttendanceRecord, CourseAttendanceData } from '../../services/attendanceService';
import AttendanceMarkingForm from '../../components/AttendanceMarkingForm';

const FacultyAttendancePage: React.FC = () => {
    const { accessToken } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [roster, setRoster] = useState<Enrollment[]>([]);
    const [analytics, setAnalytics] = useState<CourseAttendanceData | null>(null);

    // Form state
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingRoster, setIsLoadingRoster] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        if (!accessToken) return;
        fetchTeachingCourses(accessToken)
            .then(res => setCourses(res.courses))
            .catch(e => console.error('Failed to load courses', e));
    }, [accessToken]);

    // Load roster and past analytics when course changes
    useEffect(() => {
        if (!accessToken || !selectedCourse) {
            setRoster([]);
            setAnalytics(null);
            return;
        }

        const loadCourseData = async () => {
            setIsLoadingRoster(true);
            try {
                const [rosterRes, analyticsRes] = await Promise.all([
                    fetchCourseRoster(accessToken, selectedCourse._id),
                    fetchCourseAttendance(accessToken, selectedCourse._id),
                ]);
                setRoster(rosterRes.data.roster);
                setAnalytics(analyticsRes);
            } catch (e: any) {
                showToast(e.message || 'Failed to fetch course data.', 'error');
            } finally {
                setIsLoadingRoster(false);
            }
        };
        loadCourseData();
    }, [accessToken, selectedCourse]);

    const handleSubmit = async (records: MarkAttendanceRecord[]) => {
        if (!accessToken || !selectedCourse) return;
        setIsSubmitting(true);
        try {
            await markAttendance(accessToken, {
                courseId: selectedCourse._id,
                date,
                records,
            });
            showToast('Attendance recorded successfully.');
            // Refresh analytics
            const analyticsRes = await fetchCourseAttendance(accessToken, selectedCourse._id);
            setAnalytics(analyticsRes);
        } catch (e: any) {
            showToast(e.message || 'Failed to submit attendance.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={styles.page}>
            {toast && (
                <div style={{ ...styles.toast, background: toast.type === 'error' ? '#fee2e2' : '#d1fae5', color: toast.type === 'error' ? '#991b1b' : '#065f46', borderColor: toast.type === 'error' ? '#fca5a5' : '#6ee7b7' }}>
                    {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
                </div>
            )}

            <div style={styles.header}>
                <h1 style={styles.title}>Attendance Management</h1>
                <p style={styles.subtitle}>Select a course to record or view attendance</p>
            </div>

            <div style={styles.controlsRow}>
                <div style={styles.controlGroup}>
                    <label style={styles.label}>Select Course</label>
                    <select
                        style={styles.select}
                        value={selectedCourse?._id || ''}
                        onChange={e => {
                            const c = courses.find(x => x._id === e.target.value);
                            setSelectedCourse(c || null);
                        }}
                    >
                        <option value="">-- Choose a Course --</option>
                        {courses.map(c => <option key={c._id} value={c._id}>{c.code} - {c.title}</option>)}
                    </select>
                </div>

                <div style={styles.controlGroup}>
                    <label style={styles.label}>Attendance Date</label>
                    <input
                        type="date"
                        style={styles.inputDate}
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        disabled={!selectedCourse}
                    />
                </div>
            </div>

            <hr style={styles.divider} />

            {isLoadingRoster ? (
                <div style={styles.empty}>Loading class roster...</div>
            ) : !selectedCourse ? (
                <div style={styles.empty}>Select a course to begin marking attendance.</div>
            ) : roster.length === 0 ? (
                <div style={styles.empty}>No students are enrolled in this course yet.</div>
            ) : (
                <div style={styles.mainGrid}>
                    {/* Left Col: Marking Form */}
                    <div style={styles.leftCol}>
                        <div style={styles.card}>
                            <h3 style={styles.cardTitle}>Live Attendance Roster</h3>
                            <AttendanceMarkingForm
                                courseId={selectedCourse._id}
                                date={date}
                                roster={roster}
                                isSubmitting={isSubmitting}
                                onSubmit={handleSubmit}
                                onCancel={() => setDate(new Date().toISOString().split('T')[0])}
                            />
                        </div>
                    </div>

                    {/* Right Col: Analytics */}
                    {analytics && (
                        <div style={styles.rightCol}>
                            <div style={styles.card}>
                                <h3 style={styles.cardTitle}>Class Summary ({analytics.totalClasses} Sessions)</h3>
                                <div style={styles.statsList}>
                                    <div style={styles.statBox}>
                                        <div style={styles.statLabel}>Total Enrolled</div>
                                        <div style={styles.statValue}>{analytics.aggregateRoster.length}</div>
                                    </div>
                                </div>
                                
                                <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: '#6b7280', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Low Attendance Alert ({"<"}75%)</h4>
                                <div style={styles.alertList}>
                                    {analytics.aggregateRoster.filter(r => r.percentage < 75).length === 0 ? (
                                        <p style={{ margin: 0, fontSize: 13, color: '#059669' }}>All students have healthy attendance! 🎉</p>
                                    ) : (
                                        analytics.aggregateRoster.filter(r => r.percentage < 75).map(r => (
                                            <div key={r.student._id} style={styles.alertItem}>
                                                <div>
                                                    <strong>{r.student.rollNumber}</strong><br />
                                                    <span style={{ fontSize: 12, color: '#6b7280' }}>{r.student.user?.name}</span>
                                                </div>
                                                <div style={{ ...styles.badge, background: '#fee2e2', color: '#b91c1c' }}>{r.percentage}%</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    page: { padding: '2rem', maxWidth: 1200, margin: '0 auto', fontFamily: "'Inter', sans-serif" },
    header: { marginBottom: '1.5rem' },
    title: { fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 },
    subtitle: { fontSize: 14, color: '#6b7280', margin: '4px 0 0' },
    
    controlsRow: { display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
    controlGroup: { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 250 },
    label: { fontSize: 13, fontWeight: 600, color: '#374151' },
    select: { padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', background: '#fff' },
    inputDate: { padding: '9px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', background: '#fff' },
    
    divider: { border: 'none', borderTop: '2px solid #e5e7eb', margin: '0 0 2rem' },
    
    empty: { padding: '4rem', textAlign: 'center', color: '#6b7280', background: '#f9fafb', borderRadius: 12, border: '1px dashed #d1d5db', fontSize: 15 },
    mainGrid: { display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' },
    leftCol: { flex: '1 1 600px', width: '100%' },
    rightCol: { flex: '0 0 350px', width: '100%' },
    
    card: { background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' },
    cardTitle: { fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 1.25rem' },
    
    statsList: { display: 'flex', flexWrap: 'wrap', gap: 10 },
    statBox: { padding: '1rem', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', flex: 1, minWidth: 100 },
    statLabel: { fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' },
    statValue: { fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '4px 0 0' },

    alertList: { display: 'flex', flexDirection: 'column', gap: 8 },
    alertItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#fff', border: '1px solid #fca5a5', borderRadius: 8 },
    badge: { padding: '4px 8px', borderRadius: 6, fontWeight: 700, fontSize: 14 },
    toast: { position: 'fixed', top: 20, right: 20, padding: '12px 20px', borderRadius: 10, border: '1px solid', fontSize: 14, fontWeight: 500, zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
};

export default FacultyAttendancePage;
