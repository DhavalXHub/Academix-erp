import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, MapPin, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCourses, type Course } from '@/services/courseService';
import {
    createExamEvent,
    deleteExamEvent,
    fetchExamEvents,
    type ExamEvent,
    type ExamEventAudience,
    type ExamEventStatus,
    type ExamEventType,
} from '@/services/examService';

const eventTypes: ExamEventType[] = ['internal', 'midterm', 'final', 'practical', 'viva', 'assignment', 'event'];
const audiences: ExamEventAudience[] = ['all', 'student', 'faculty'];
const statuses: ExamEventStatus[] = ['published', 'draft', 'cancelled'];

const emptyForm = {
    title: '',
    course: '',
    type: 'internal' as ExamEventType,
    startsAt: '',
    endsAt: '',
    venue: '',
    instructions: '',
    targetAudience: 'all' as ExamEventAudience,
    status: 'published' as ExamEventStatus,
};

const AcademicCalendarPage: React.FC = () => {
    const { accessToken, user } = useAuth();
    const [events, setEvents] = useState<ExamEvent[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState('all');
    const [form, setForm] = useState(emptyForm);
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const isAdmin = user?.role === 'admin';

    const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
        setNotice({ text, type });
        window.setTimeout(() => setNotice(null), 3000);
    };

    const loadEvents = async () => {
        if (!accessToken) return;
        setIsLoading(true);
        try {
            const res = await fetchExamEvents(accessToken, { status });
            setEvents(res.events || []);
        } catch (err: any) {
            showNotice(err?.message || 'Unable to load academic calendar.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken, status]);

    useEffect(() => {
        if (!accessToken || !isAdmin) return;
        fetchCourses(accessToken, { limit: 200, isActive: true })
            .then((res) => setCourses(res.courses || []))
            .catch(() => setCourses([]));
    }, [accessToken, isAdmin]);

    const grouped = useMemo(() => {
        const today = new Date();
        const upcoming = events.filter((event) => new Date(event.endsAt) >= today);
        const past = events.filter((event) => new Date(event.endsAt) < today);
        return { upcoming, past };
    }, [events]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accessToken) return;

        setIsSubmitting(true);
        try {
            await createExamEvent(accessToken, {
                ...form,
                course: form.course || undefined,
            });
            setForm(emptyForm);
            showNotice('Academic event published.');
            await loadEvents();
        } catch (err: any) {
            showNotice(err?.message || 'Could not save event.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const remove = async (event: ExamEvent) => {
        if (!accessToken || !window.confirm(`Delete "${event.title}"?`)) return;
        try {
            await deleteExamEvent(accessToken, event._id);
            showNotice('Academic event deleted.');
            await loadEvents();
        } catch (err: any) {
            showNotice(err?.message || 'Could not delete event.', 'error');
        }
    };

    return (
        <div style={styles.page}>
            {notice && (
                <div style={{ ...styles.notice, ...(notice.type === 'error' ? styles.noticeError : styles.noticeSuccess) }}>
                    {notice.text}
                </div>
            )}

            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Academic Calendar</h1>
                    <p style={styles.subtitle}>Exam timetable, academic events, venues, and instructions in one place.</p>
                </div>
                <div style={styles.statStrip}>
                    <div style={styles.stat}>
                        <strong>{grouped.upcoming.length}</strong>
                        <span>Upcoming</span>
                    </div>
                    <div style={styles.stat}>
                        <strong>{events.filter((event) => event.status === 'published').length}</strong>
                        <span>Published</span>
                    </div>
                </div>
            </div>

            {isAdmin && (
                <form style={styles.form} onSubmit={submit}>
                    <div style={styles.formHeader}>
                        <Plus size={18} />
                        <h2 style={styles.formTitle}>Publish Exam or Academic Event</h2>
                    </div>
                    <div style={styles.formGrid}>
                        <input style={styles.input} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                        <select style={styles.input} value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}>
                            <option value="">Institution wide</option>
                            {courses.map((course) => (
                                <option key={course._id} value={course._id}>{course.code} - {course.title}</option>
                            ))}
                        </select>
                        <select style={styles.input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ExamEventType })}>
                            {eventTypes.map((type) => <option key={type} value={type}>{label(type)}</option>)}
                        </select>
                        <select style={styles.input} value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value as ExamEventAudience })}>
                            {audiences.map((audience) => <option key={audience} value={audience}>{label(audience)}</option>)}
                        </select>
                        <input style={styles.input} type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required />
                        <input style={styles.input} type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} required />
                        <input style={styles.input} placeholder="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
                        <select style={styles.input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ExamEventStatus })}>
                            {statuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}
                        </select>
                        <textarea style={{ ...styles.input, ...styles.textarea }} placeholder="Instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
                    </div>
                    <button style={styles.primaryBtn} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Publish Event'}</button>
                </form>
            )}

            <div style={styles.toolbar}>
                <label style={styles.filterLabel}>Status</label>
                <select style={styles.filter} value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="all">All</option>
                    {statuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}
                </select>
            </div>

            {isLoading ? (
                <div style={styles.empty}>Loading calendar...</div>
            ) : events.length === 0 ? (
                <div style={styles.empty}>No academic events have been published yet.</div>
            ) : (
                <div style={styles.list}>
                    {[...grouped.upcoming, ...grouped.past].map((event) => (
                        <article key={event._id} style={{ ...styles.card, opacity: new Date(event.endsAt) < new Date() ? 0.72 : 1 }}>
                            <div style={styles.dateBadge}>
                                <span>{new Date(event.startsAt).toLocaleString(undefined, { month: 'short' })}</span>
                                <strong>{new Date(event.startsAt).getDate()}</strong>
                            </div>
                            <div style={styles.cardBody}>
                                <div style={styles.cardTop}>
                                    <span style={styles.typePill}>{label(event.type)}</span>
                                    <span style={{ ...styles.statusPill, ...statusStyle(event.status) }}>{label(event.status)}</span>
                                </div>
                                <h2 style={styles.eventTitle}>{event.title}</h2>
                                <p style={styles.courseLine}>{event.course ? `${event.course.code} - ${event.course.title}` : 'Institution wide'}</p>
                                <div style={styles.meta}>
                                    <span><Clock size={15} /> {formatRange(event.startsAt, event.endsAt)}</span>
                                    <span><MapPin size={15} /> {event.venue || 'Venue pending'}</span>
                                </div>
                                {event.instructions && <p style={styles.instructions}>{event.instructions}</p>}
                            </div>
                            {isAdmin && (
                                <button style={styles.iconBtn} onClick={() => remove(event)} aria-label="Delete event">
                                    <Trash2 size={17} />
                                </button>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

const label = (value: string) => value.replace(/^\w/, (char) => char.toUpperCase());

const formatRange = (startsAt: string, endsAt: string) => {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    return `${start.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} - ${end.toLocaleTimeString([], { timeStyle: 'short' })}`;
};

const statusStyle = (status: ExamEventStatus): React.CSSProperties => {
    if (status === 'cancelled') return { background: '#fee2e2', color: '#991b1b', borderColor: '#fecaca' };
    if (status === 'draft') return { background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' };
    return { background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' };
};

const styles: Record<string, React.CSSProperties> = {
    page: { padding: '2rem', maxWidth: 1180, margin: '0 auto', position: 'relative' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, marginBottom: 22 },
    title: { margin: 0, fontSize: 28, fontWeight: 900, color: 'var(--text-main)' },
    subtitle: { margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 14 },
    statStrip: { display: 'flex', gap: 10 },
    stat: { minWidth: 110, background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 12 },
    form: { background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 16, marginBottom: 18 },
    formHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--text-main)' },
    formTitle: { margin: 0, fontSize: 16, fontWeight: 900 },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 },
    input: { width: '100%', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 12px', background: 'var(--card-bg)', color: 'var(--text-main)', boxSizing: 'border-box', fontFamily: 'inherit' },
    textarea: { gridColumn: '1 / -1', minHeight: 82, resize: 'vertical' },
    primaryBtn: { marginTop: 12, border: 'none', borderRadius: 8, padding: '10px 14px', background: 'var(--primary)', color: 'white', fontWeight: 900, cursor: 'pointer' },
    toolbar: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
    filterLabel: { fontSize: 13, color: 'var(--text-muted)', fontWeight: 800 },
    filter: { border: '1px solid var(--border-color)', borderRadius: 8, padding: '9px 12px', background: 'var(--card-bg)', color: 'var(--text-main)' },
    list: { display: 'grid', gap: 12 },
    card: { display: 'grid', gridTemplateColumns: '76px 1fr auto', gap: 14, alignItems: 'start', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 14 },
    dateBadge: { border: '1px solid var(--border-color)', borderRadius: 8, minHeight: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--page-bg)' },
    cardBody: { minWidth: 0 },
    cardTop: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
    typePill: { border: '1px solid #bfdbfe', background: '#dbeafe', color: '#1d4ed8', borderRadius: 999, padding: '3px 8px', fontSize: 11, fontWeight: 900 },
    statusPill: { border: '1px solid', borderRadius: 999, padding: '3px 8px', fontSize: 11, fontWeight: 900 },
    eventTitle: { margin: 0, color: 'var(--text-main)', fontSize: 18, fontWeight: 900 },
    courseLine: { margin: '5px 0 10px', color: 'var(--text-muted)', fontSize: 13, fontWeight: 700 },
    meta: { display: 'flex', flexWrap: 'wrap', gap: 14, color: 'var(--text-muted)', fontSize: 13 },
    instructions: { margin: '12px 0 0', color: 'var(--text-main)', lineHeight: 1.55, fontSize: 14 },
    iconBtn: { width: 36, height: 36, display: 'grid', placeItems: 'center', borderRadius: 8, border: '1px solid #fecaca', color: '#dc2626', background: 'var(--card-bg)', cursor: 'pointer' },
    empty: { padding: '4rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 8 },
    notice: { position: 'fixed', top: 18, right: 18, zIndex: 20, border: '1px solid', borderRadius: 8, padding: '12px 14px', fontWeight: 800 },
    noticeSuccess: { background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' },
    noticeError: { background: '#fee2e2', color: '#991b1b', borderColor: '#fecaca' },
};

export default AcademicCalendarPage;
