import api from './api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FacultyInfo {
    _id: string;
    employeeId: string;
    designation: string;
    department: string;
    user: { name: string; email: string };
}

export interface Course {
    _id: string;
    code: string;
    title: string;
    description: string;
    credits: number;
    department: string;
    semester: number;
    primaryFaculty: FacultyInfo | null;
    isActive: boolean;
    maxEnrollment: number;
    enrolledCount?: number;
    createdAt: string;
}

export interface Enrollment {
    _id: string;
    course: Course;
    academicYear: string;
    semester: number;
    status: 'enrolled' | 'dropped' | 'completed';
    enrolledAt: string;
}

export interface CourseListResponse {
    courses: Course[];
    meta?: { page: number; limit: number; totalRecords: number; totalPages: number };
}

export interface CreateCoursePayload {
    code: string;
    title: string;
    description?: string;
    credits?: number;
    department: string;
    semester: number;
    primaryFaculty?: string;
    maxEnrollment?: number;
}

// ── Course API ────────────────────────────────────────────────────────────────

export const fetchCourses = (
    token: string,
    params: { search?: string; department?: string; semester?: number; isActive?: boolean; page?: number; limit?: number } = {}
): Promise<CourseListResponse> => {
    const qs = new URLSearchParams(
        Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)])
    ).toString();
    return api.get(`/courses${qs ? '?' + qs : ''}`, token);
};

export const fetchCourseById = (token: string, id: string): Promise<{ course: Course }> =>
    api.get(`/courses/${id}`, token);

export const fetchMyCoursesFaculty = (token: string): Promise<{ courses: Course[] }> =>
    api.get('/courses/my-courses', token);

export const fetchCourseRoster = (token: string, courseId: string) =>
    api.get(`/courses/${courseId}/roster`, token);

export const createCourse = (token: string, payload: CreateCoursePayload): Promise<{ course: Course }> =>
    api.post('/courses', payload as unknown as Record<string, unknown>, token);

export const updateCourse = (
    token: string, id: string, payload: Partial<CreateCoursePayload>
): Promise<{ course: Course }> =>
    api.put(`/courses/${id}`, payload as Record<string, unknown>, token);

export const deleteCourse = (token: string, id: string): Promise<void> =>
    api.delete(`/courses/${id}`, token);

// ── Enrollment API ────────────────────────────────────────────────────────────

export const fetchMyEnrollments = (token: string): Promise<{ enrollments: Enrollment[]; count: number }> =>
    api.get('/enrollments/my-courses', token);

export const fetchTeachingCourses = (token: string): Promise<{ courses: Course[] }> =>
    api.get('/enrollments/teaching', token);

export const enrollInCourse = (token: string, courseId: string): Promise<{ enrollment: Enrollment }> =>
    api.post('/enrollments', { courseId }, token);

export const dropCourse = (token: string, enrollmentId: string): Promise<void> =>
    api.delete(`/enrollments/${enrollmentId}`, token);
