import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTeachingCourses } from '@/services/courseService';
import {
    fetchMaterials, uploadMaterial, deleteMaterial,
    fetchAssignments, createAssignment, deleteAssignment,
    fetchSubmissions, gradeSubmission,
    CourseMaterial, Assignment, Submission
} from '@/services/lmsService';
import type { Course } from '@/services/courseService';

import MaterialCard from '@/components/MaterialCard';
import AssignmentCard from '@/components/AssignmentCard';
import SubmissionTable from '@/components/SubmissionTable';

type Tab = 'materials' | 'assignments' | 'grading';

const FacultyCoursePage: React.FC = () => {
    const { accessToken } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('materials');

    // Data State
    const [materials, setMaterials] = useState<CourseMaterial[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [gradingAssignment, setGradingAssignment] = useState<Assignment | null>(null);

    // Form State
    const [showMaterialForm, setShowMaterialForm] = useState(false);
    const [mTitle, setMTitle] = useState('');
    const [mDesc, setMDesc] = useState('');
    const [mUrl, setMUrl] = useState('');
    const [mType, setMType] = useState<any>('notes');

    const [showAssignmentForm, setShowAssignmentForm] = useState(false);
    const [aTitle, setATitle] = useState('');
    const [aDesc, setADesc] = useState('');
    const [aDueDate, setADueDate] = useState('');
    const [aMaxMarks, setAMaxMarks] = useState('100');
    const [aUrl, setAUrl] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!accessToken) return;
        fetchTeachingCourses(accessToken).then(res => setCourses(res.courses));
    }, [accessToken]);

    useEffect(() => {
        if (!accessToken || !selectedCourse) return;
        loadTabData();
    }, [selectedCourse, activeTab]);

    const loadTabData = async () => {
        if (!accessToken || !selectedCourse) return;
        setIsLoading(true);
        try {
            if (activeTab === 'materials') {
                const res = await fetchMaterials(accessToken, selectedCourse._id);
                setMaterials(res.materials);
            } else if (activeTab === 'assignments') {
                const res = await fetchAssignments(accessToken, selectedCourse._id);
                setAssignments(res.assignments);
            }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const handleUploadMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accessToken || !selectedCourse) return;
        setIsSubmitting(true);
        try {
            await uploadMaterial(accessToken, { courseId: selectedCourse._id, title: mTitle, description: mDesc, fileUrl: mUrl, type: mType } as any);
            setShowMaterialForm(false);
            setMTitle(''); setMDesc(''); setMUrl('');
            loadTabData();
        } catch (e) { alert('Upload failed'); } finally { setIsSubmitting(false); }
    };

    const handleCreateAssignment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accessToken || !selectedCourse) return;
        setIsSubmitting(true);
        try {
            await createAssignment(accessToken, { courseId: selectedCourse._id, title: aTitle, description: aDesc, dueDate: aDueDate, maxMarks: Number(aMaxMarks), attachmentUrl: aUrl } as any);
            setShowAssignmentForm(false);
            setATitle(''); setADesc(''); setADueDate(''); setAUrl('');
            loadTabData();
        } catch (e) { alert('Creation failed'); } finally { setIsSubmitting(false); }
    };

    const handleViewSubmissions = async (assignment: Assignment) => {
        if (!accessToken) return;
        setGradingAssignment(assignment);
        setActiveTab('grading');
        setIsLoading(true);
        try {
            const res = await fetchSubmissions(accessToken, assignment._id);
            setSubmissions(res.submissions);
        } catch (e) { alert('Failed to fetch submissions'); } finally { setIsLoading(false); }
    };

    const handleGrade = async (subId: string, marks: number, feedback: string) => {
        if (!accessToken) return;
        await gradeSubmission(accessToken, subId, marks, feedback);
        // update local state
        setSubmissions(prev => prev.map(s => s._id === subId ? { ...s, marksAwarded: marks, feedback } : s));
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>LMS Management</h1>
                <p style={styles.subtitle}>Upload course materials and grade assignments</p>
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
                            setActiveTab('materials');
                            setGradingAssignment(null);
                        }}
                    >
                        <option value="">-- Choose a Course --</option>
                        {courses.map(c => <option key={c._id} value={c._id}>{c.code} - {c.title}</option>)}
                    </select>
                </div>
            </div>

            {selectedCourse && (
                <>
                    <div style={styles.tabsMenu}>
                        {(['materials', 'assignments', 'grading'] as Tab[]).map(tab => (
                            <button
                                key={tab}
                                style={activeTab === tab ? styles.activeTab : styles.tab}
                                onClick={() => {
                                    if (tab === 'grading' && !gradingAssignment) {
                                        alert('Please select an assignment from the Assignments tab to grade.');
                                        return;
                                    }
                                    setActiveTab(tab);
                                }}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div style={styles.contentArea}>
                        {isLoading && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>}

                        {/* ── MATERIALS TAB ── */}
                        {!isLoading && activeTab === 'materials' && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                                    <button style={styles.primaryBtn} onClick={() => setShowMaterialForm(!showMaterialForm)}>
                                        {showMaterialForm ? 'Cancel' : '+ Upload Material'}
                                    </button>
                                </div>
                                
                                {showMaterialForm && (
                                    <form style={styles.formBox} onSubmit={handleUploadMaterial}>
                                        <h3 style={{ margin: '0 0 16px', fontSize: 16, color: 'var(--text-main)' }}>Upload New Material</h3>
                                        <div style={styles.formGrid}>
                                            <input required placeholder="Title" value={mTitle} onChange={e => setMTitle(e.target.value)} style={styles.input} />
                                            <select value={mType} onChange={e => setMType(e.target.value)} style={styles.input}>
                                                <option value="notes">Notes</option>
                                                <option value="ppt">Presentation</option>
                                                <option value="video">Video URL</option>
                                                <option value="other">Other</option>
                                            </select>
                                            <input placeholder="Description (Optional)" value={mDesc} onChange={e => setMDesc(e.target.value)} style={{ ...styles.input, gridColumn: '1 / -1' }} />
                                            <input required placeholder="File URL (e.g., Google Drive, S3 link)" value={mUrl} onChange={e => setMUrl(e.target.value)} style={{ ...styles.input, gridColumn: '1 / -1' }} />
                                        </div>
                                        <button type="submit" disabled={isSubmitting} style={{ ...styles.primaryBtn, marginTop: 16 }}>
                                            {isSubmitting ? 'Uploading...' : 'Upload'}
                                        </button>
                                    </form>
                                )}

                                <div style={styles.listGrid}>
                                    {materials.length === 0 && !showMaterialForm ? (
                                        <div style={styles.empty}>No materials uploaded yet.</div>
                                    ) : materials.map(m => (
                                        <MaterialCard 
                                            key={m._id} material={m} isFaculty 
                                            onDelete={async (id) => {
                                                if(window.confirm('Delete this material?')) {
                                                    await deleteMaterial(accessToken, id);
                                                    loadTabData();
                                                }
                                            }} 
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* ── ASSIGNMENTS TAB ── */}
                        {!isLoading && activeTab === 'assignments' && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                                    <button style={styles.primaryBtn} onClick={() => setShowAssignmentForm(!showAssignmentForm)}>
                                        {showAssignmentForm ? 'Cancel' : '+ Create Assignment'}
                                    </button>
                                </div>
                                
                                {showAssignmentForm && (
                                    <form style={styles.formBox} onSubmit={handleCreateAssignment}>
                                        <h3 style={{ margin: '0 0 16px', fontSize: 16, color: 'var(--text-main)' }}>Create New Assignment</h3>
                                        <div style={styles.formGrid}>
                                            <input required placeholder="Title" value={aTitle} onChange={e => setATitle(e.target.value)} style={{ ...styles.input, gridColumn: '1 / -1' }} />
                                            <textarea placeholder="Description / Instructions" value={aDesc} onChange={e => setADesc(e.target.value)} style={{ ...styles.input, gridColumn: '1 / -1', minHeight: 80 }} />
                                            <input required type="datetime-local" title="Due Date" value={aDueDate} onChange={e => setADueDate(e.target.value)} style={styles.input} />
                                            <input required type="number" placeholder="Max Marks" value={aMaxMarks} onChange={e => setAMaxMarks(e.target.value)} style={styles.input} />
                                            <input placeholder="Attachment URL (Optional)" value={aUrl} onChange={e => setAUrl(e.target.value)} style={{ ...styles.input, gridColumn: '1 / -1' }} />
                                        </div>
                                        <button type="submit" disabled={isSubmitting} style={{ ...styles.primaryBtn, marginTop: 16 }}>
                                            {isSubmitting ? 'Creating...' : 'Create'}
                                        </button>
                                    </form>
                                )}

                                <div style={styles.listGridActive}>
                                    {assignments.length === 0 && !showAssignmentForm ? (
                                        <div style={styles.empty}>No assignments created yet.</div>
                                    ) : assignments.map(a => (
                                        <AssignmentCard 
                                            key={a._id} assignment={a} isFaculty 
                                            onViewSubmissions={handleViewSubmissions}
                                            onDelete={async (id) => {
                                                if(window.confirm('Delete this assignment permanently?')) {
                                                    await deleteAssignment(accessToken, id);
                                                    loadTabData();
                                                }
                                            }} 
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* ── GRADING TAB ── */}
                        {!isLoading && activeTab === 'grading' && gradingAssignment && (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                                    <button style={styles.backBtn} onClick={() => setActiveTab('assignments')}>← Back</button>
                                    <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)' }}>Grading: {gradingAssignment.title}</h3>
                                </div>
                                <SubmissionTable 
                                    submissions={submissions} 
                                    maxMarks={gradingAssignment.maxMarks} 
                                    onGrade={handleGrade} 
                                />
                            </div>
                        )}
                    </div>
                </>
            )}
            
            {!selectedCourse && (
                <div style={styles.empty}>Please select a course to manage its LMS content.</div>
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    page: { padding: '2rem', maxWidth: 1200, margin: '0 auto', fontFamily: "'Inter', sans-serif" },
    header: { marginBottom: '1.5rem' },
    title: { fontSize: 26, fontWeight: 700, color: 'var(--text-main)', margin: 0 },
    subtitle: { fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 0' },
    controlsRow: { marginBottom: '2rem' },
    controlGroup: { display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 400 },
    label: { fontSize: 13, fontWeight: 600, color: 'var(--text-main)' },
    select: { padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 15, background:'var(--card-bg)' },
    
    tabsMenu: { display: 'flex', gap: 12, borderBottom: '2px solid #e5e7eb', marginBottom: '2rem' },
    tab: { background: 'none', border: 'none', padding: '0 16px 12px', fontSize: 15, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', marginBottom: -2 },
    activeTab: { background: 'none', border: 'none', padding: '0 16px 12px', fontSize: 15, fontWeight: 700, color: 'var(--primary)', cursor: 'pointer', borderBottom: '3px solid var(--primary)', marginBottom: -2 },
    
    contentArea: { minHeight: 400 },
    primaryBtn: { padding: '10px 20px', background: 'var(--primary)', color:'var(--card-bg)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    backBtn: { padding: '8px 16px', background: 'var(--border-color)', color: 'var(--text-main)', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    
    formBox: { background: 'var(--page-bg)', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.5rem', marginBottom: '2rem' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    input: { padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
    
    listGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' },
    listGridActive: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    empty: { padding: '4rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--page-bg)', borderRadius: 12, border: '1px dashed #d1d5db' },
};

export default FacultyCoursePage;
