import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTeachingCourses } from '@/services/courseService';
import type { Course } from '@/services/courseService';
import {
    createAssignment,
    deleteAssignment,
    fetchAssignments,
    fetchSubmissions,
    gradeSubmission,
    type Assignment,
    type Submission,
} from '@/services/lmsService';

const FacultyAssignmentsPage: React.FC = () => {
    const { accessToken } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);

    const [isLoadingCourses, setIsLoadingCourses] = useState(true);
    const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
    const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    // Create form
    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', dueDate: '', maxMarks: 10 });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        if (!accessToken) return;
        const load = async () => {
            setIsLoadingCourses(true);
            try {
                const res = await fetchTeachingCourses(accessToken);
                setCourses(res.courses);
            } catch (e: any) {
                showToast(e?.message || 'Failed to load courses.', 'error');
            } finally {
                setIsLoadingCourses(false);
            }
        };
        load();
    }, [accessToken]);

    const loadAssignments = async (courseId: string) => {
        if (!accessToken) return;
        setIsLoadingAssignments(true);
        setSelectedAssignment(null);
        setSubmissions([]);
        try {
            const res = await fetchAssignments(accessToken, courseId);
            setAssignments(res.assignments || []);
        } catch (e: any) {
            showToast(e?.message || 'Failed to load assignments.', 'error');
        } finally {
            setIsLoadingAssignments(false);
        }
    };

    useEffect(() => {
        if (!selectedCourse) {
            setAssignments([]);
            setSelectedAssignment(null);
            setSubmissions([]);
            return;
        }
        loadAssignments(selectedCourse._id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCourse?._id, accessToken]);

    const loadSubmissions = async (assignmentId: string) => {
        if (!accessToken) return;
        setIsLoadingSubmissions(true);
        try {
            const res = await fetchSubmissions(accessToken, assignmentId);
            setSubmissions(res.submissions || []);
        } catch (e: any) {
            showToast(e?.message || 'Failed to load submissions.', 'error');
        } finally {
            setIsLoadingSubmissions(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accessToken || !selectedCourse) return;
        setIsSubmitting(true);
        try {
            await createAssignment(accessToken, {
                course: selectedCourse._id,
                title: form.title,
                description: form.description,
                dueDate: form.dueDate,
                maxMarks: Number(form.maxMarks),
            });
            showToast('Assignment created.');
            setIsCreating(false);
            setForm({ title: '', description: '', dueDate: '', maxMarks: 10 });
            await loadAssignments(selectedCourse._id);
        } catch (e: any) {
            showToast(e?.message || 'Failed to create assignment.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAssignment = async (a: Assignment) => {
        if (!accessToken) return;
        if (!window.confirm(`Delete assignment "${a.title}"?`)) return;
        try {
            await deleteAssignment(accessToken, a._id);
            showToast('Assignment deleted.');
            if (selectedCourse) await loadAssignments(selectedCourse._id);
        } catch (e: any) {
            showToast(e?.message || 'Failed to delete assignment.', 'error');
        }
    };

    const submissionsStats = useMemo(() => {
        const graded = submissions.filter(s => s.marksAwarded !== null).length;
        return { total: submissions.length, graded };
    }, [submissions]);

    const handleGrade = async (submissionId: string) => {
        if (!accessToken) return;
        const marksStr = window.prompt('Marks awarded (number):');
        if (marksStr === null) return;
        const marks = Number(marksStr);
        if (Number.isNaN(marks)) {
            showToast('Invalid marks.', 'error');
            return;
        }
        const feedback = window.prompt('Feedback (optional):') || '';
        try {
            await gradeSubmission(accessToken, submissionId, marks, feedback);
            showToast('Submission graded.');
            if (selectedAssignment) await loadSubmissions(selectedAssignment._id);
        } catch (e: any) {
            showToast(e?.message || 'Failed to grade submission.', 'error');
        }
    };

    return (
        <div style={styles.page}>
            {toast && (
                <div
                    style={{
                        ...styles.toast,
                        background: toast.type === 'error' ? '#fee2e2' : '#d1fae5',
                        color: toast.type === 'error' ? '#991b1b' : '#065f46',
                        borderColor: toast.type === 'error' ? '#fca5a5' : '#6ee7b7',
                    }}
                >
                    {toast.msg}
                </div>
            )}

            <div style={styles.header}>
                <h1 style={styles.title}>Assignments</h1>
                <p style={styles.subtitle}>Create assignments and review submissions</p>
            </div>

            <div style={styles.controlsRow}>
                <div style={styles.controlGroup}>
                    <label style={styles.label}>Course</label>
                    <select
                        style={styles.select}
                        value={selectedCourse?._id || ''}
                        onChange={e => setSelectedCourse(courses.find(c => c._id === e.target.value) || null)}
                        disabled={isLoadingCourses}
                    >
                        <option value="">{isLoadingCourses ? 'Loading…' : '-- Choose a Course --'}</option>
                        {courses.map(c => (
                            <option key={c._id} value={c._id}>
                                {c.code} - {c.title}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={styles.controlGroup}>
                    <label style={styles.label}>Actions</label>
                    <button
                        style={styles.primaryBtn}
                        onClick={() => setIsCreating(true)}
                        disabled={!selectedCourse}
                    >
                        + New Assignment
                    </button>
                </div>
            </div>

            {!selectedCourse ? (
                <div style={styles.state}>Select a course to manage assignments.</div>
            ) : isLoadingAssignments ? (
                <div style={styles.state}>Loading assignments…</div>
            ) : (
                <div style={styles.grid}>
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>Assignments</h3>
                        {assignments.length === 0 ? (
                            <div style={styles.stateSm}>No assignments yet.</div>
                        ) : (
                            <div style={styles.list}>
                                {assignments.map(a => (
                                    <button
                                        key={a._id}
                                        style={{
                                            ...styles.listItem,
                                            ...(selectedAssignment?._id === a._id ? styles.listItemActive : {}),
                                        }}
                                        onClick={() => {
                                            setSelectedAssignment(a);
                                            loadSubmissions(a._id);
                                        }}
                                    >
                                        <div style={{ minWidth: 0 }}>
                                            <div style={styles.itemTitle}>{a.title}</div>
                                            <div style={styles.itemMeta}>
                                                Due: {new Date(a.dueDate).toLocaleDateString()} • Max: {a.maxMarks}
                                            </div>
                                        </div>
                                        <button
                                            style={styles.dangerBtn}
                                            onClick={(e) => { e.stopPropagation(); handleDeleteAssignment(a); }}
                                        >
                                            Delete
                                        </button>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>
                            Submissions
                            {selectedAssignment ? (
                                <span style={styles.pill}>
                                    {submissionsStats.graded}/{submissionsStats.total} graded
                                </span>
                            ) : null}
                        </h3>

                        {!selectedAssignment ? (
                            <div style={styles.stateSm}>Select an assignment to view submissions.</div>
                        ) : isLoadingSubmissions ? (
                            <div style={styles.stateSm}>Loading submissions…</div>
                        ) : submissions.length === 0 ? (
                            <div style={styles.stateSm}>No submissions yet.</div>
                        ) : (
                            <div style={styles.tableWrap}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Student</th>
                                            <th style={styles.th}>Submitted</th>
                                            <th style={styles.th}>Marks</th>
                                            <th style={styles.th}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissions.map(s => {
                                            const st = typeof s.student === 'string' ? null : (s.student as any);
                                            const studentLabel = st ? `${st.rollNumber} • ${st.user?.name}` : 'Student';
                                            return (
                                                <tr key={s._id} style={styles.tr}>
                                                    <td style={styles.td}>{studentLabel}</td>
                                                    <td style={styles.td}>{new Date(s.submittedAt).toLocaleString()}</td>
                                                    <td style={styles.td}>
                                                        {s.marksAwarded === null ? (
                                                            <span style={styles.badgeWarn}>Pending</span>
                                                        ) : (
                                                            <span style={styles.badgeOk}>{s.marksAwarded}</span>
                                                        )}
                                                    </td>
                                                    <td style={styles.td}>
                                                        <button style={styles.secondaryBtn} onClick={() => handleGrade(s._id)}>
                                                            Grade
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isCreating && selectedCourse && (
                <div style={styles.modalOverlay} onClick={() => setIsCreating(false)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>
                            New Assignment ({selectedCourse.code})
                        </h3>
                        <form onSubmit={handleCreate} style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                            <input
                                style={styles.input}
                                placeholder="Title"
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                required
                            />
                            <textarea
                                style={styles.input}
                                placeholder="Description"
                                rows={3}
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            />
                            <div style={{ display: 'flex', gap: 10 }}>
                                <input
                                    style={styles.input}
                                    type="date"
                                    value={form.dueDate}
                                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                                    required
                                />
                                <input
                                    style={styles.input}
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={form.maxMarks}
                                    onChange={e => setForm(f => ({ ...f, maxMarks: Number(e.target.value) }))}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                                <button type="button" style={styles.cancelBtn} onClick={() => setIsCreating(false)}>
                                    Cancel
                                </button>
                                <button type="submit" style={styles.primaryBtn} disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating…' : 'Create'}
                                </button>
                            </div>
                        </form>
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

    controlsRow: { display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 18 },
    controlGroup: { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 },
    label: { fontSize: 13, fontWeight: 700, color: '#374151' },
    select: { padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff', fontSize: 14 },

    grid: { display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14, alignItems: 'start' },
    card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    cardTitle: { margin: '0 0 12px', fontSize: 16, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 10 },
    pill: { fontSize: 12, fontWeight: 800, padding: '4px 10px', background: '#eef2ff', border: '1px solid #c7d2fe', color: '#3730a3', borderRadius: 999 },
    list: { display: 'grid', gap: 10 },
    listItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', padding: 12, cursor: 'pointer', textAlign: 'left' },
    listItemActive: { borderColor: '#a5b4fc', background: '#eef2ff' },
    itemTitle: { fontSize: 14, fontWeight: 800, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    itemMeta: { fontSize: 12, color: '#6b7280', marginTop: 3 },

    state: { padding: '4rem', textAlign: 'center', color: '#6b7280', background: '#f9fafb', borderRadius: 12, border: '1px dashed #d1d5db' },
    stateSm: { padding: '1.5rem', textAlign: 'center', color: '#6b7280', background: '#f9fafb', borderRadius: 10, border: '1px dashed #d1d5db' },

    tableWrap: { overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 10 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' },
    th: { padding: '10px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 11 },
    tr: { borderBottom: '1px solid #f3f4f6' },
    td: { padding: '10px 12px', color: '#111827' },
    badgeOk: { padding: '3px 8px', borderRadius: 999, background: '#d1fae5', color: '#065f46', fontWeight: 800, fontSize: 12 },
    badgeWarn: { padding: '3px 8px', borderRadius: 999, background: '#fef3c7', color: '#92400e', fontWeight: 800, fontSize: 12 },

    primaryBtn: { padding: '10px 14px', borderRadius: 10, border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 800, cursor: 'pointer' },
    secondaryBtn: { padding: '8px 10px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff', color: '#111827', fontWeight: 700, cursor: 'pointer' },
    dangerBtn: { padding: '8px 10px', borderRadius: 10, border: '1px solid #fecaca', background: '#fff', color: '#ef4444', fontWeight: 800, cursor: 'pointer', flexShrink: 0 },
    cancelBtn: { padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff', color: '#111827', fontWeight: 800, cursor: 'pointer' },

    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
    modal: { background: '#fff', borderRadius: 14, width: '100%', maxWidth: 560, padding: 18, border: '1px solid #e5e7eb', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' },
    input: { flex: 1, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit' },

    toast: { position: 'fixed', top: 20, right: 20, padding: '12px 18px', borderRadius: 10, border: '1px solid', fontSize: 14, fontWeight: 700, zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
};

export default FacultyAssignmentsPage;

