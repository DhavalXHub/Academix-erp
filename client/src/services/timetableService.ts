import api from './api';

const getStudentTimetable = async (studentId: string, academicYear?: string) => {
    const url = academicYear
        ? `/timetable/student/${studentId}?academicYear=${academicYear}`
        : `/timetable/student/${studentId}`;
    const { data } = await api.get(url);
    return data.data;
};

const getFacultyTimetable = async (facultyId: string, academicYear?: string) => {
    const url = academicYear
        ? `/timetable/faculty/${facultyId}?academicYear=${academicYear}`
        : `/timetable/faculty/${facultyId}`;
    const { data } = await api.get(url);
    return data.data;
};

const getAllTimetable = async (academicYear?: string) => {
    const url = academicYear ? `/timetable?academicYear=${academicYear}` : '/timetable';
    const { data } = await api.get(url);
    return data.data;
};

const createTimetable = async (timetableData: any) => {
    const { data } = await api.post(`/timetable`, timetableData);
    return data.data;
};

const updateTimetable = async (id: string, updates: any) => {
    const { data } = await api.put(`/timetable/${id}`, updates);
    return data.data;
};

const deleteTimetable = async (id: string) => {
    await api.delete(`/timetable/${id}`);
};

export const timetableService = {
    getStudentTimetable,
    getFacultyTimetable,
    getAllTimetable,

    createTimetable,
    updateTimetable,
    deleteTimetable,
};
