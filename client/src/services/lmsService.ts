import api from './api';
import type { Course } from './courseService';

export interface CourseMaterial {
    _id: string;
    course: string | Course;
    faculty: string;
    title: string;
    description: string;
    fileUrl: string;
    type: 'notes' | 'ppt' | 'video' | 'other';
    uploadedAt: string;
}

export interface Assignment {
    _id: string;
    course: string | Course;
    faculty: string;
    title: string;
    description: string;
    dueDate: string;
    maxMarks: number;
    attachmentUrl?: string;
    createdAt: string;
}

export interface Submission {
    _id: string;
    assignment: string | Assignment;
    student: { _id: string; rollNumber: string; user: { name: string; email: string } } | string;
    fileUrl: string;
    submittedAt: string;
    marksAwarded: number | null;
    feedback: string;
}

// ── Materials ─────────────────────────────────────────────────────────────
export const fetchMaterials = (token: string, courseId: string): Promise<{ materials: CourseMaterial[] }> =>
    api.get(`/materials/course/${courseId}`, token);

export const uploadMaterial = (token: string, data: Partial<CourseMaterial>): Promise<{ material: CourseMaterial }> =>
    api.post('/materials', data as Record<string, unknown>, token);

export const deleteMaterial = (token: string, id: string): Promise<void> =>
    api.delete(`/materials/${id}`, token);

// ── Assignments ─────────────────────────────────────────────────────────────
export const fetchAssignments = (token: string, courseId: string): Promise<{ assignments: Assignment[] }> =>
    api.get(`/assignments/course/${courseId}`, token);

export const createAssignment = (token: string, data: Partial<Assignment>): Promise<{ assignment: Assignment }> =>
    api.post('/assignments', data as Record<string, unknown>, token);

export const deleteAssignment = (token: string, id: string): Promise<void> =>
    api.delete(`/assignments/${id}`, token);

// ── Submissions ─────────────────────────────────────────────────────────────
export const fetchSubmissions = (token: string, assignmentId: string): Promise<{ submissions: Submission[] }> =>
    api.get(`/submissions/assignment/${assignmentId}`, token);

export const fetchMySubmission = (token: string, assignmentId: string): Promise<{ submission: Submission | null }> =>
    api.get(`/submissions/my/${assignmentId}`, token);

export const submitAssignment = (token: string, assignmentId: string, fileUrl: string): Promise<{ submission: Submission }> =>
    api.post('/submissions', { assignmentId, fileUrl }, token);

export const gradeSubmission = (token: string, submissionId: string, marksAwarded: number, feedback: string): Promise<{ submission: Submission }> =>
    api.put(`/submissions/${submissionId}/grade`, { marksAwarded, feedback }, token);
