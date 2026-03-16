import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { showErrorToast } from '@/utils/errorHandler';
import CourseCard from '@/components/CourseCard';
import CourseFormModal from '@/components/CourseFormModal';
import {
    fetchCourses, createCourse, updateCourse, deleteCourse,
} from '@/services/courseService';
import type { Course, CreateCoursePayload } from '@/services/courseService';

const AdminCoursesPage: React.FC = () => {
    const { accessToken } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [meta, setMeta] = useState({ page: 1, totalPages: 1, totalRecords: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [page, setPage] = useState(1);

    const [modalOpen, setModalOpen] = useState(false);
    const [editCourse, setEditCourse] = useState<Course | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const DEPARTMENTS = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Electronics', 'Mechanical', 'General'];

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadCourses = useCallback(async (p = page, s = search, d = deptFilter) => {
        if (!accessToken) return;
        setIsLoading(true);
        try {
            const res = await fetchCourses(accessToken, { search: s, department: d || undefined, page: p, limit: 12 });
            setCourses(res.courses);
            if (res.meta) setMeta(res.meta);
        } catch (e: any) {
            const errMsg = showErrorToast(e, 'Failed to load courses');
            showToast(errMsg, 'error');
            console.error('[AdminCoursesPage] Load error:', e);
        } finally {
            setIsLoading(false);
        }
    }, [accessToken, page, search, deptFilter]);

    useEffect(() => { loadCourses(); }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadCourses(1, search, deptFilter);
    };

    const handleFormSubmit = async (data: CreateCoursePayload) => {
        if (!accessToken) return;
        setIsSubmitting(true);
        try {
            if (editCourse) {
                await updateCourse(accessToken, editCourse._id, data);
                showToast('Course updated successfully.');
            } else {
                await createCourse(accessToken, data);
                showToast('Course created successfully.');
            }
            setModalOpen(false);
            loadCourses(1);
        } catch (e: any) {
            const errMsg = showErrorToast(e, 'Failed to save course');
            showToast(errMsg, 'error');
            console.error('[AdminCoursesPage] Save error:', e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (course: Course) => {
        if (!accessToken || !window.confirm(`Deactivate course ${course.code}?`)) return;
        try {
            await deleteCourse(accessToken, course._id);
            showToast('Course deactivated.');
            loadCourses();
        } catch (e: any) { 
            const errMsg = showErrorToast(e, 'Failed to deactivate course');
            showToast(errMsg, 'error');
            console.error('[AdminCoursesPage] Delete error:', e);
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
                <div>
                    <h1 style={styles.title}>Course Catalog</h1>
                    <p style={styles.subtitle}>{meta.totalRecords} overall courses</p>
                </div>
                <button style={styles.createBtn} onClick={() => { setEditCourse(null); setModalOpen(true); }}>
                    + New Course
                </button>
            </div>

            <form style={styles.filterBar} onSubmit={handleSearch}>
                <input style={styles.searchInput} placeholder="Search by Code or Title..." value={search} onChange={e => setSearch(e.target.value)} />
                <select style={styles.select} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                    <option value="">All Departments</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button type="submit" style={styles.searchBtn}>Filter</button>
            </form>

            {isLoading ? (
                <div style={styles.empty}>Loading courses...</div>
            ) : courses.length === 0 ? (
                <div style={styles.empty}>No courses found.</div>
            ) : (
                <div style={styles.grid}>
                    {courses.map(course => (
                        <CourseCard
                            key={course._id}
                            course={course}
                            actionSlot={
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button style={styles.btnEdit} onClick={() => { setEditCourse(course); setModalOpen(true); }}>Edit</button>
                                    <button style={styles.btnDelete} onClick={() => handleDelete(course)}>Deactivate</button>
                                </div>
                            }
                        />
                    ))}
                </div>
            )}

            {meta.totalPages > 1 && (
                <div style={styles.pagination}>
                    <button style={styles.pageBtn} disabled={page <= 1} onClick={() => { setPage(p => p - 1); loadCourses(page - 1); }}>← Prev</button>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>Page {meta.page} of {meta.totalPages}</span>
                    <button style={styles.pageBtn} disabled={page >= meta.totalPages} onClick={() => { setPage(p => p + 1); loadCourses(page + 1); }}>Next →</button>
                </div>
            )}

            <CourseFormModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
                editCourse={editCourse}
            />
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    page: { padding: '2rem', maxWidth: 1200, margin: '0 auto', fontFamily: "'Inter', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
    title: { fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 },
    subtitle: { fontSize: 14, color: '#9ca3af', margin: '4px 0 0' },
    createBtn: { padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
    filterBar: { display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' },
    searchInput: { flex: 1, minWidth: 200, padding: '9px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none' },
    select: { padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, background: '#fff' },
    searchBtn: { padding: '9px 18px', borderRadius: 8, border: 'none', background: '#111827', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' },
    empty: { padding: '4rem', textAlign: 'center', color: '#6b7280', background: '#f9fafb', borderRadius: 12, border: '1px dashed #d1d5db' },
    btnEdit: { flex: 1, padding: '7px 0', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    btnDelete: { flex: 1, padding: '7px 0', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: '2rem' },
    pageBtn: { padding: '7px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 },
    toast: { position: 'fixed', top: 20, right: 20, padding: '12px 20px', borderRadius: 10, border: '1px solid', fontSize: 14, fontWeight: 500, zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
};

export default AdminCoursesPage;
