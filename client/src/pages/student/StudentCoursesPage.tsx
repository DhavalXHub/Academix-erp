import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import CourseCard from '../../components/CourseCard';
import {
    fetchCourses, fetchMyEnrollments, enrollInCourse, dropCourse
} from '../../services/courseService';
import type { Course, Enrollment } from '../../services/courseService';

type Tab = 'my-courses' | 'browse';

const StudentCoursesPage: React.FC = () => {
    const { accessToken } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('my-courses');
    const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isActioning, setIsActioning] = useState<Record<string, boolean>>({});
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadData = async () => {
        if (!accessToken) return;
        setIsLoading(true);
        try {
            const [enrRes, allRes] = await Promise.all([
                fetchMyEnrollments(accessToken),
                fetchCourses(accessToken, { limit: 100, isActive: true }) // simplify: fetch active courses
            ]);
            setMyEnrollments(enrRes.enrollments);
            setAvailableCourses(allRes.courses);
        } catch (e: any) {
            showToast(e.message || 'Failed to load courses.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [accessToken]);

    const handleAction = async (courseId: string, action: 'enroll' | 'drop', enrollmentId?: string) => {
        if (!accessToken) return;
        setIsActioning(p => ({ ...p, [courseId]: true }));
        try {
            if (action === 'enroll') {
                await enrollInCourse(accessToken, courseId);
                showToast('Successfully enrolled in course!');
                setActiveTab('my-courses'); // Switch back to view it
            } else if (action === 'drop' && enrollmentId) {
                if (!window.confirm('Are you sure you want to drop this course?')) return;
                await dropCourse(accessToken, enrollmentId);
                showToast('Course dropped successfully.');
            }
            await loadData();
        } catch (e: any) {
            showToast(e.message || 'Operation failed.', 'error');
        } finally {
            setIsActioning(p => ({ ...p, [courseId]: false }));
        }
    };

    // Calculate which courses are currently taken so we don't show "Enroll" for them
    const enrolledCourseIds = new Set(myEnrollments.map(e => e.course._id));
    const browsableCourses = availableCourses.filter(c => !enrolledCourseIds.has(c._id));

    return (
        <div style={styles.page}>
            {toast && (
                <div style={{ ...styles.toast, background: toast.type === 'error' ? '#fee2e2' : '#d1fae5', color: toast.type === 'error' ? '#991b1b' : '#065f46', borderColor: toast.type === 'error' ? '#fca5a5' : '#6ee7b7' }}>
                    {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
                </div>
            )}

            <div style={styles.header}>
                <h1 style={styles.title}>Course Center</h1>
                <p style={styles.subtitle}>Manage your enrollments and discover new classes</p>
            </div>

            {/* Sub-navigation tabs */}
            <div style={styles.tabsMenu}>
                <button
                    style={activeTab === 'my-courses' ? styles.activeTab : styles.tab}
                    onClick={() => setActiveTab('my-courses')}
                >
                    📚 My Current Courses
                </button>
                <button
                    style={activeTab === 'browse' ? styles.activeTab : styles.tab}
                    onClick={() => setActiveTab('browse')}
                >
                    🔍 Browse & Enroll
                </button>
            </div>

            {isLoading ? (
                <div style={styles.empty}>Loading courses...</div>
            ) : activeTab === 'my-courses' ? (
                // ── MY COURSES TAB ──
                myEnrollments.length === 0 ? (
                    <div style={styles.empty}>
                        You are not currently enrolled in any courses.<br/><br/>
                        <button style={styles.browseBtn} onClick={() => setActiveTab('browse')}>Browse Available Courses</button>
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {myEnrollments.map(enr => (
                            <CourseCard
                                key={enr._id}
                                course={enr.course}
                                actionSlot={
                                    <button
                                        style={styles.btnDrop}
                                        disabled={isActioning[enr.course._id]}
                                        onClick={() => handleAction(enr.course._id, 'drop', enr._id)}
                                    >
                                        {isActioning[enr.course._id] ? 'Processing...' : 'Drop Course'}
                                    </button>
                                }
                            />
                        ))}
                    </div>
                )
            ) : (
                // ── BROWSE TAB ──
                browsableCourses.length === 0 ? (
                    <div style={styles.empty}>There are no new courses available for enrollment.</div>
                ) : (
                    <div style={styles.grid}>
                        {browsableCourses.map(course => {
                            const isFull = course.enrolledCount !== undefined && course.enrolledCount >= course.maxEnrollment;
                            return (
                                <CourseCard
                                    key={course._id}
                                    course={course}
                                    actionSlot={
                                        <button
                                            style={isFull ? styles.btnFull : styles.btnEnroll}
                                            disabled={isFull || isActioning[course._id]}
                                            onClick={() => handleAction(course._id, 'enroll')}
                                        >
                                            {isActioning[course._id] ? 'Processing...' : isFull ? 'Class Full' : 'Enroll Now'}
                                        </button>
                                    }
                                />
                            );
                        })}
                    </div>
                )
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    page: { padding: '2rem', maxWidth: 1200, margin: '0 auto', fontFamily: "'Inter', sans-serif" },
    header: { marginBottom: '2rem' },
    title: { fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 },
    subtitle: { fontSize: 14, color: '#6b7280', margin: '4px 0 0' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' },
    empty: { padding: '4rem', textAlign: 'center', color: '#6b7280', background: '#f9fafb', borderRadius: 12, border: '1px dashed #d1d5db', lineHeight: 1.5 },
    toast: { position: 'fixed', top: 20, right: 20, padding: '12px 20px', borderRadius: 10, border: '1px solid', fontSize: 14, fontWeight: 500, zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    
    tabsMenu: { display: 'flex', gap: 12, borderBottom: '2px solid #e5e7eb', marginBottom: '2rem' },
    tab: { background: 'none', border: 'none', padding: '0 16px 12px', fontSize: 15, fontWeight: 600, color: '#6b7280', cursor: 'pointer', marginBottom: -2 },
    activeTab: { background: 'none', border: 'none', padding: '0 16px 12px', fontSize: 15, fontWeight: 700, color: '#4f46e5', cursor: 'pointer', borderBottom: '3px solid #4f46e5', marginBottom: -2 },
    
    btnDrop: { width: '100%', padding: '9px 0', background: '#fff', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' },
    btnEnroll: { width: '100%', padding: '9px 0', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    btnFull: { width: '100%', padding: '9px 0', background: '#e5e7eb', color: '#9ca3af', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'not-allowed' },
    browseBtn: { padding: '10px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};

export default StudentCoursesPage;
