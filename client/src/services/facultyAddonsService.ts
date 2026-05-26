import api from './api';

export interface LeaveRequest {
    _id: string;
    faculty: string;
    leaveType: 'casual' | 'sick' | 'earned' | 'maternity' | 'paternity';
    startDate: string;
    endDate: string;
    reason: string;
    alternativeClassArrangement?: string;
    status: 'pending' | 'approved' | 'rejected';
    comments?: string;
    createdAt: string;
}

export interface DoubtReply {
    _id: string;
    user: { _id: string; name: string; email: string; role: string };
    message: string;
    timestamp: string;
}

export interface DoubtQuery {
    _id: string;
    student: { _id: string; name: string; email: string };
    course: { _id: string; code: string; title: string };
    title: string;
    description: string;
    status: 'open' | 'resolved';
    replies: DoubtReply[];
    createdAt: string;
    updatedAt: string;
}

// ── Leave Requests ──
export const fetchMyLeaves = (token: string): Promise<{ success: boolean; data: { leaves: LeaveRequest[] } }> =>
    api.get('/faculty-addons/leaves', token);

export const applyForLeave = (
    token: string,
    data: { leaveType: string; startDate: string; endDate: string; reason: string; alternativeClassArrangement?: string }
): Promise<{ success: boolean; data: { leave: LeaveRequest } }> =>
    api.post('/faculty-addons/leaves', data, token);

export const fetchAdminLeaves = (token: string): Promise<{ success: boolean; data: { leaves: LeaveRequest[] } }> =>
    api.get('/faculty-addons/leaves/admin', token);

export const updateAdminLeave = (
    token: string,
    id: string,
    data: { status: 'approved' | 'rejected'; comments?: string }
): Promise<{ success: boolean; data: { leave: LeaveRequest } }> =>
    api.patch(`/faculty-addons/leaves/admin/${id}`, data, token);

// ── Doubt Solver ──
export const fetchCourseDoubts = (token: string, courseId: string): Promise<{ success: boolean; data: { doubts: DoubtQuery[] } }> =>
    api.get(`/faculty-addons/doubts/course/${courseId}`, token);

export const fetchStudentDoubts = (token: string): Promise<{ success: boolean; data: { doubts: DoubtQuery[] } }> =>
    api.get('/faculty-addons/doubts/student', token);

export const createDoubtQuery = (
    token: string,
    data: { courseId: string; title: string; description: string }
): Promise<{ success: boolean; data: { doubt: DoubtQuery } }> =>
    api.post('/faculty-addons/doubts', data, token);

export const replyToDoubt = (token: string, id: string, message: string): Promise<{ success: boolean; data: { doubt: DoubtQuery } }> =>
    api.post(`/faculty-addons/doubts/${id}/reply`, { message }, token);

export const updateDoubtStatus = (token: string, id: string, status: 'open' | 'resolved'): Promise<{ success: boolean; data: { doubt: DoubtQuery } }> =>
    api.patch(`/faculty-addons/doubts/${id}/status`, { status }, token);

// ── Syllabus Progress ──
export const updateCourseSyllabus = (
    token: string,
    courseId: string,
    syllabusUnits: Array<{ title: string; isCompleted: boolean }>
): Promise<{ success: boolean; data: { course: any } }> =>
    api.patch(`/faculty-addons/courses/${courseId}/syllabus`, { syllabusUnits }, token);
