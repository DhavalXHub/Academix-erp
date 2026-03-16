import React, { useState, useEffect } from 'react';
import type { AttendanceStatus, MarkAttendanceRecord } from '@/services/attendanceService';
import type { Enrollment } from '@/services/courseService';

interface AttendanceMarkingFormProps {
    courseId: string;
    date: string;
    roster: Enrollment[];
    isSubmitting: boolean;
    onSubmit: (records: MarkAttendanceRecord[]) => void;
    onCancel: () => void;
}

const AttendanceMarkingForm: React.FC<AttendanceMarkingFormProps> = ({
    courseId, date, roster, isSubmitting, onSubmit, onCancel
}) => {
    // Map student ID -> 'present' | 'absent' | 'late' | 'excused'
    const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});

    useEffect(() => {
        // Default everyone to present initially
        const initials: Record<string, AttendanceStatus> = {};
        roster.forEach(enr => {
            const stId = (enr as any).student._id;
            initials[stId] = 'present';
        });
        setStatuses(initials);
    }, [roster]);

    const handleSetAll = (status: AttendanceStatus) => {
        const updated: Record<string, AttendanceStatus> = {};
        roster.forEach(enr => {
            updated[(enr as any).student._id] = status;
        });
        setStatuses(updated);
    };

    const handleStatusChange = (stId: string, status: AttendanceStatus) => {
        setStatuses(prev => ({ ...prev, [stId]: status }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const records: MarkAttendanceRecord[] = roster.map(enr => {
            const stId = (enr as any).student._id;
            return {
                studentId: stId,
                status: statuses[stId] || 'present',
                remarks: ''
            };
        });
        onSubmit(records);
    };

    return (
        <form onSubmit={handleSubmit} style={styles.formContainer}>
            <div style={styles.headerRow}>
                <div style={styles.infoText}>
                    Marking attendance for <strong>{new Date(date).toLocaleDateString()}</strong>
                </div>
                <div style={styles.bulkActions}>
                    <button type="button" onClick={() => handleSetAll('present')} style={{ ...styles.bulkBtn, color: '#047857', background: '#d1fae5' }}>Mark All Present</button>
                    <button type="button" onClick={() => handleSetAll('absent')} style={{ ...styles.bulkBtn, color: '#b91c1c', background: '#fee2e2' }}>Mark All Absent</button>
                </div>
            </div>

            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Roll No</th>
                            <th style={styles.th}>Name</th>
                            <th style={{ ...styles.th, textAlign: 'center' }}>Present</th>
                            <th style={{ ...styles.th, textAlign: 'center' }}>Late</th>
                            <th style={{ ...styles.th, textAlign: 'center' }}>Excused</th>
                            <th style={{ ...styles.th, textAlign: 'center' }}>Absent</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roster.map(enr => {
                            const st = (enr as any).student;
                            const u = st.user;
                            const current = statuses[st._id];

                            return (
                                <tr key={st._id} style={styles.tr}>
                                    <td style={{ ...styles.td, fontWeight: 600 }}>{st.rollNumber}</td>
                                    <td style={styles.td}>{u.name}</td>
                                    
                                    <td style={{ ...styles.td, textAlign: 'center' }}>
                                        <input type="radio" name={`status-${st._id}`} checked={current === 'present'} onChange={() => handleStatusChange(st._id, 'present')} style={styles.radioP} />
                                    </td>
                                    <td style={{ ...styles.td, textAlign: 'center' }}>
                                        <input type="radio" name={`status-${st._id}`} checked={current === 'late'} onChange={() => handleStatusChange(st._id, 'late')} style={styles.radioL} />
                                    </td>
                                    <td style={{ ...styles.td, textAlign: 'center' }}>
                                        <input type="radio" name={`status-${st._id}`} checked={current === 'excused'} onChange={() => handleStatusChange(st._id, 'excused')} style={styles.radioE} />
                                    </td>
                                    <td style={{ ...styles.td, textAlign: 'center' }}>
                                        <input type="radio" name={`status-${st._id}`} checked={current === 'absent'} onChange={() => handleStatusChange(st._id, 'absent')} style={styles.radioA} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div style={styles.actions}>
                <button type="button" onClick={onCancel} style={styles.cancelBtn} disabled={isSubmitting}>Cancel</button>
                <button type="submit" style={styles.submitBtn} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Attendance'}
                </button>
            </div>
        </form>
    );
};

const styles: Record<string, React.CSSProperties> = {
    formContainer: { display: 'flex', flexDirection: 'column', gap: 16 },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
    infoText: { fontSize: 14, color: '#4b5563' },
    bulkActions: { display: 'flex', gap: 8 },
    bulkBtn: { padding: '6px 12px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
    tableWrapper: { overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, maxHeight: 500 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 14, textAlign: 'left' },
    th: { padding: '12px 16px', background: '#f9fafb', color: '#6b7280', fontWeight: 600, borderBottom: '2px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 },
    tr: { borderBottom: '1px solid #f3f4f6', background: '#fff' },
    td: { padding: '10px 16px', color: '#111827', verticalAlign: 'middle' },
    radioP: { accentColor: '#10b981', transform: 'scale(1.2)' },
    radioA: { accentColor: '#ef4444', transform: 'scale(1.2)' },
    radioL: { accentColor: '#f59e0b', transform: 'scale(1.2)' },
    radioE: { accentColor: '#6366f1', transform: 'scale(1.2)' },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
    cancelBtn: { padding: '9px 20px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#374151' },
    submitBtn: { padding: '9px 20px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
};

export default AttendanceMarkingForm;
