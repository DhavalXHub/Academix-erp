import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMyEnrollments } from '@/services/courseService';
import type { Course } from '@/services/courseService';
import {
    fetchAssignments,
    fetchMySubmission,
    submitAssignment,
    type Assignment,
    type Submission,
} from '@/services/lmsService';

const StudentAssignmentsPage: React.FC = () => {
    const { accessToken } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
    const [mySubmission, setMySubmission] = useState<Submission | null>(null);
    const [isLoadingSubmission, setIsLoadingSubmission] = useState(false);
    const [fileUrl, setFileUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!accessToken) return;
        const load = async () => {
            setIsLoading(true);
            setError('');
            try {
                const res = await fetchMyEnrollments(accessToken);
                const cs = res.enrollments.map(e => e.course);
                setCourses(cs);
            } catch (e: any) {
                setError(e?.message || 'Failed to load courses.');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [accessToken]);

    const loadAssignments = async (courseId: string) => {
        if (!accessToken) return;
        setIsLoading(true);
        setError('');
        setAssignments([]);
        setActiveAssignment(null);
        setMySubmission(null);
        try {
            const res = await fetchAssignments(accessToken, courseId);
            setAssignments(res.assignments || []);
        } catch (e: any) {
            setError(e?.message || 'Failed to load assignments.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!selectedCourse) return;
        loadAssignments(selectedCourse._id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCourse?._id, accessToken]);

    const openAssignment = async (a: Assignment) => {
        if (!accessToken) return;
        setActiveAssignment(a);
        setMySubmission(null);
        setFileUrl('');
        setIsLoadingSubmission(true);
        try {
            const res = await fetchMySubmission(accessToken, a._id);
            setMySubmission(res.submission);
        } catch {
            // ignore for now
        } finally {
            setIsLoadingSubmission(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accessToken || !activeAssignment) return;
        setIsSubmitting(true);
        try {
            await submitAssignment(accessToken, activeAssignment._id, fileUrl);
            const res = await fetchMySubmission(accessToken, activeAssignment._id);
            setMySubmission(res.submission);
            setFileUrl('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const summary = useMemo(() => {
        const now = Date.now();
        const overdue = assignments.filter(a => new Date(a.dueDate).getTime() < now).length;
        return { total: assignments.length, overdue };
    }, [assignments]);

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>Assignments</h1>
                <p style={styles.subtitle}>View course assignments and submit your work</p>
            </div>

            <div style={styles.controlsRow}>
                <div style={styles.controlGroup}>
                    <label style={styles.label}>Course</label>
                    <select
                        style={styles.select}
                        value={selectedCourse?._id || ''}
                        onChange={e => setSelectedCourse(courses.find(c => c._id === e.target.value) || null)}
                        disabled={isLoading}
                    >
                        <option value="">{isLoading ? 'Loading…' : '-- Choose a Course --'}</option>
                        {courses.map(c => (
                            <option key={c._id} value={c._id}>
                                {c.code} - {c.title}
                            </option>
                        ))}
                    </select>
                </div>
                {selectedCourse && (
                    <div style={styles.summaryPill}>
                        {summary.total} total • {summary.overdue} overdue
                    </div>
                )}
            </div>

            {!selectedCourse ? (
                <div style={styles.state}>Pick a course to view its assignments.</div>
            ) : isLoading ? (
                <div style={styles.state}>Loading assignments…</div>
            ) : error ? (
                <div style={{ ...styles.state, ...styles.stateError }}>{error}</div>
            ) : (
                <div style={styles.grid}>
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>Assignment List</h3>
                        {assignments.length === 0 ? (
                            <div style={styles.stateSm}>No assignments posted yet.</div>
                        ) : (
                            <div style={styles.list}>
                                {assignments.map(a => (
                                    <button
                                        key={a._id}
                                        style={{
                                            ...styles.listItem,
                                            ...(activeAssignment?._id === a._id ? styles.listItemActive : {}),
                                        }}
                                        onClick={() => openAssignment(a)}
                                    >
                                        <div style={{ minWidth: 0 }}>
                                            <div style={styles.itemTitle}>{a.title}</div>
                                            <div style={styles.itemMeta}>
                                                Due: {new Date(a.dueDate).toLocaleDateString()} • Max: {a.maxMarks}
                                            </div>
                                        </div>
                                        <span style={styles.chev}>→</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>Submission</h3>
                        {!activeAssignment ? (
                            <div style={styles.stateSm}>Select an assignment to see submission status.</div>
                        ) : isLoadingSubmission ? (
                            <div style={styles.stateSm}>Loading submission…</div>
                        ) : mySubmission ? (
                            <div style={styles.submissionBox}>
                                <div style={styles.row}>
                                    <div style={styles.k}>Status</div>
                                    <div style={styles.v}>
                                        <span style={styles.badgeOk}>Submitted</span>
                                    </div>
                                </div>
                                <div style={styles.row}>
                                    <div style={styles.k}>Submitted At</div>
                                    <div style={styles.v}>{new Date(mySubmission.submittedAt).toLocaleString()}</div>
                                </div>
                                <div style={styles.row}>
                                    <div style={styles.k}>Marks</div>
                                    <div style={styles.v}>
                                        {mySubmission.marksAwarded === null ? (
                                            <span style={styles.badgeWarn}>Pending</span>
                                        ) : (
                                            <span style={styles.badgeOk}>{mySubmission.marksAwarded}</span>
                                        )}
                                    </div>
                                </div>
                                {mySubmission.feedback ? (
                                    <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-main)' }}>
                                        <strong>Feedback:</strong> {mySubmission.feedback}
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} style={styles.form}>
                                <div style={styles.help}>
                                    Paste your submission URL (drive link / repo link / hosted file). File uploads can be
                                    added later.
                                </div>
                                <input
                                    style={styles.input}
                                    placeholder="https://…"
                                    value={fileUrl}
                                    onChange={e => setFileUrl(e.target.value)}
                                    required
                                />
                                <button style={styles.primaryBtn} disabled={isSubmitting}>
                                    {isSubmitting ? 'Submitting…' : 'Submit Assignment'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    page: { padding: '2rem', maxWidth: 1200, margin: '0 auto', fontFamily: "'Inter', sans-serif" },
    header: { marginBottom: '1.25rem' },
    title: { fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0 },
    subtitle: { fontSize: 14, color: '#64748b', margin: '6px 0 0' },

    controlsRow: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 18 },
    controlGroup: { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 280 },
    label: { fontSize: 13, fontWeight: 700, color: 'var(--text-main)' },
    select: { padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', background:'var(--card-bg)', fontSize: 14 },
    summaryPill: { padding: '9px 12px', borderRadius: 999, background: '#eef2ff', border: '1px solid #c7d2fe', color: '#3730a3', fontWeight: 800, fontSize: 13, height: 'fit-content' },

    grid: { display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 14, alignItems: 'start' },
    card: { background:'var(--card-bg)', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    cardTitle: { margin: '0 0 12px', fontSize: 16, fontWeight: 800, color: 'var(--text-main)' },

    list: { display: 'grid', gap: 10 },
    listItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', border: '1px solid #e5e7eb', borderRadius: 10, background:'var(--card-bg)', padding: 12, cursor: 'pointer', textAlign: 'left' },
    listItemActive: { borderColor: '#a5b4fc', background: '#eef2ff' },
    itemTitle: { fontSize: 14, fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    itemMeta: { fontSize: 12, color: 'var(--text-muted)', marginTop: 3 },
    chev: { fontWeight: 900, color: 'var(--primary)' },

    state: { padding: '4rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--page-bg)', borderRadius: 12, border: '1px dashed #d1d5db' },
    stateSm: { padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--page-bg)', borderRadius: 10, border: '1px dashed #d1d5db' },
    stateError: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' },

    form: { display: 'grid', gap: 10 },
    help: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 },
    input: { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit' },
    primaryBtn: { padding: '10px 14px', borderRadius: 10, border: 'none', background: 'var(--primary)', color:'var(--card-bg)', fontWeight: 800, cursor: 'pointer' },

    submissionBox: { border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, background: 'var(--page-bg)' },
    row: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0' },
    k: { fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
    v: { fontSize: 13, fontWeight: 700, color: 'var(--text-main)' },
    badgeOk: { padding: '3px 8px', borderRadius: 999, background: '#d1fae5', color: '#065f46', fontWeight: 900, fontSize: 12 },
    badgeWarn: { padding: '3px 8px', borderRadius: 999, background: '#fef3c7', color: '#92400e', fontWeight: 900, fontSize: 12 },
};

export default StudentAssignmentsPage;

