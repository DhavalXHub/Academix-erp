import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMyEnrollments } from '@/services/courseService';
import {
    fetchMaterials,
    fetchAssignments, fetchMySubmission, submitAssignment,
    CourseMaterial, Assignment, Submission
} from '@/services/lmsService';
import type { Course } from '@/services/courseService';

import MaterialCard from '@/components/MaterialCard';
import AssignmentCard from '@/components/AssignmentCard';

type Tab = 'materials' | 'assignments';

const StudentCoursePage: React.FC = () => {
    const { accessToken } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('materials');

    // Data State
    const [materials, setMaterials] = useState<CourseMaterial[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [mySubmissions, setMySubmissions] = useState<Record<string, Submission>>({}); // map assignmentId -> Submission
    
    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);
    const [submissionUrl, setSubmissionUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!accessToken) return;
        fetchMyEnrollments(accessToken).then(res => setCourses(res.enrollments.map(e => e.course)));
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
                
                // Fetch submission status for all loaded assignments sequentially or parallel
                const submissionMap: Record<string, Submission> = {};
                await Promise.all(res.assignments.map(async (a) => {
                    const subRes = await fetchMySubmission(accessToken, a._id);
                    if (subRes.submission) submissionMap[a._id] = subRes.submission;
                }));
                setMySubmissions(submissionMap);
            }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    const handleOpenSubmit = (assignment: Assignment) => {
        setSubmittingAssignment(assignment);
        const existing = mySubmissions[assignment._id];
        setSubmissionUrl(existing ? existing.fileUrl : '');
    };

    const handleSubmitUrl = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accessToken || !submittingAssignment) return;
        setIsSaving(true);
        try {
            const res = await submitAssignment(accessToken, submittingAssignment._id, submissionUrl);
            setMySubmissions(prev => ({ ...prev, [submittingAssignment._id]: res.submission }));
            setSubmittingAssignment(null);
            alert('Submission successful!');
        } catch (e: any) { alert(e.message || 'Submission failed'); } finally { setIsSaving(false); }
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>My Classroom Space</h1>
                <p style={styles.subtitle}>Access your course materials and submit your assignments</p>
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
                        }}
                    >
                        <option value="">-- Choose an Enrolled Course --</option>
                        {courses.map(c => <option key={c._id} value={c._id}>{c.code} - {c.title}</option>)}
                    </select>
                </div>
            </div>

            {selectedCourse && (
                <>
                    <div style={styles.tabsMenu}>
                        {(['materials', 'assignments'] as Tab[]).map(tab => (
                            <button
                                key={tab}
                                style={activeTab === tab ? styles.activeTab : styles.tab}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div style={styles.contentArea}>
                        {isLoading ? (
                            <div style={styles.empty}>Loading {activeTab}...</div>
                        ) : activeTab === 'materials' ? (
                            <div style={styles.listGridActive}>
                                {materials.length === 0 ? (
                                    <div style={styles.empty}>No materials available for this course yet.</div>
                                ) : materials.map(m => (
                                    <MaterialCard key={m._id} material={m} />
                                ))}
                            </div>
                        ) : (
                            <div style={styles.listGridActive}>
                                {assignments.length === 0 ? (
                                    <div style={styles.empty}>No active assignments for this course.</div>
                                ) : assignments.map(a => (
                                    <AssignmentCard 
                                        key={a._id} 
                                        assignment={a} 
                                        mySubmission={mySubmissions[a._id]}
                                        onClickSubmit={handleOpenSubmit}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {!selectedCourse && (
                <div style={styles.empty}>Please select a course to view your learning materials.</div>
            )}

            {/* Submit Assignment Modal */}
            {submittingAssignment && (
                <div style={styles.overlay} onClick={() => setSubmittingAssignment(null)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2 style={styles.modalTitle}>Submit Work</h2>
                        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#4b5563' }}>
                            Assignment: <strong>{submittingAssignment.title}</strong>
                        </p>
                        
                        <form onSubmit={handleSubmitUrl}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                                    File URL / Shared Drive Link
                                </label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://docs.google.com/..."
                                    value={submissionUrl}
                                    onChange={e => setSubmissionUrl(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                            
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                                <button type="button" onClick={() => setSubmittingAssignment(null)} style={styles.cancelBtn}>Cancel</button>
                                <button type="submit" disabled={isSaving} style={styles.primaryBtn}>
                                    {isSaving ? 'Submitting...' : 'Confirm Submission'}
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
    page: { padding: '2rem', maxWidth: 1000, margin: '0 auto', fontFamily: "'Inter', sans-serif" },
    header: { marginBottom: '1.5rem' },
    title: { fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 },
    subtitle: { fontSize: 14, color: '#6b7280', margin: '4px 0 0' },
    controlsRow: { marginBottom: '2rem' },
    controlGroup: { display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 400 },
    label: { fontSize: 13, fontWeight: 600, color: '#374151' },
    select: { padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 15, background: '#fff' },
    
    tabsMenu: { display: 'flex', gap: 12, borderBottom: '2px solid #e5e7eb', marginBottom: '2rem' },
    tab: { background: 'none', border: 'none', padding: '0 16px 12px', fontSize: 15, fontWeight: 600, color: '#6b7280', cursor: 'pointer', marginBottom: -2 },
    activeTab: { background: 'none', border: 'none', padding: '0 16px 12px', fontSize: 15, fontWeight: 700, color: '#4f46e5', cursor: 'pointer', borderBottom: '3px solid #4f46e5', marginBottom: -2 },
    
    contentArea: { minHeight: 400 },
    empty: { padding: '4rem', textAlign: 'center', color: '#6b7280', background: '#f9fafb', borderRadius: 12, border: '1px dashed #d1d5db' },
    listGridActive: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    
    // Modal
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
    modal: { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, padding: 24, boxShadow: '0 25px 60px rgba(0,0,0,0.2)' },
    modalTitle: { fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 16px' },
    cancelBtn: { padding: '9px 20px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#374151', fontWeight: 600 },
    primaryBtn: { padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};

export default StudentCoursePage;
