import {
    Student,
    Faculty,
    Hod,
    Mentor,
    AttendanceRecord,
    MentorAlert,
    TimetableEntry,
    LeaveApplication,
    CallLog
} from '../types';
import { apiCall } from './apiService';

const createApiService = <T extends { id: string } | { rollNo: string }>(endpoint: string) => ({
    getAll: async (): Promise<T[]> => {
        try {
            return await apiCall<T[]>(endpoint, 'GET');
        } catch (error) {
            console.error(`Error fetching ${endpoint}`, error);
            return [];
        }
    },

    getById: async (id: string): Promise<T | undefined> => {
        try {
            const items = await apiCall<T[]>(endpoint, 'GET');
            const idKey = items.length > 0 && 'rollNo' in items[0] ? 'rollNo' : 'id';
            return items.find((item) => (item as any)[idKey] === id);
        } catch (error) {
            console.error(`Error getting item ${id} from ${endpoint}`, error);
            return undefined;
        }
    },

    add: async (item: T): Promise<void> => {
        try {
            await apiCall(endpoint, 'POST', item);
        } catch (error) {
            console.error(`Error adding to ${endpoint}`, error);
        }
    },

    update: async (id: string, updatedItem: Partial<T>): Promise<void> => {
        try {
            await apiCall(`${endpoint}/${id}`, 'PUT', updatedItem);
        } catch (error) {
            console.error(`Error updating ${id} in ${endpoint}`, error);
        }
    },

    remove: async (id: string): Promise<void> => {
        try {
            await apiCall(`${endpoint}/${id}`, 'DELETE');
        } catch (error) {
            console.error(`Error removing ${id} from ${endpoint}`, error);
        }
    },

    setAll: async (items: T[]): Promise<void> => {
        try {
            // For bulk updates, call POST multiple times or use a batch endpoint
            for (const item of items) {
                await apiCall(endpoint, 'POST', item);
            }
        } catch (error) {
            console.error(`Error setting all in ${endpoint}`, error);
        }
    }
});

export const apiStudentService = createApiService<Student>('/students');
export const apiFacultyService = createApiService<Faculty>('/faculty');
export const apiHodService = createApiService<Hod>('/hods');

export const apiMentorService = {
    ...createApiService<Mentor>('/mentors'),
    getById: async (mentorId: string): Promise<Mentor | undefined> => {
        try {
            const mentors = await apiCall<Mentor[]>('/mentors', 'GET');
            return mentors.find(m => m.mentorId === mentorId);
        } catch (error) {
            console.error(`Error getting mentor ${mentorId}`, error);
            return undefined;
        }
    }
};

export const apiAttendanceService = {
    getAll: async (): Promise<AttendanceRecord[]> => {
        try {
            return await apiCall<AttendanceRecord[]>('/attendance', 'GET');
        } catch (error) {
            console.error('Error fetching attendance', error);
            return [];
        }
    },

    add: async (record: AttendanceRecord): Promise<void> => {
        try {
            await apiCall('/attendance', 'POST', record);
        } catch (error) {
            console.error('Error adding attendance', error);
        }
    }
};

export const apiTimetableService = {
    getAll: async (): Promise<TimetableEntry[]> => {
        try {
            return await apiCall<TimetableEntry[]>('/timetable', 'GET');
        } catch (error) {
            console.error('Error fetching timetable', error);
            return [];
        }
    },

    setAll: async (entries: TimetableEntry[]): Promise<void> => {
        try {
            for (const entry of entries) {
                await apiCall('/timetable', 'POST', entry);
            }
        } catch (error) {
            console.error('Error setting timetable', error);
        }
    }
};

export const apiLeaveService = {
    getAll: async (): Promise<LeaveApplication[]> => {
        try {
            return await apiCall<LeaveApplication[]>('/leaves', 'GET');
        } catch (error) {
            console.error('Error fetching leaves', error);
            return [];
        }
    },

    add: async (leave: LeaveApplication): Promise<void> => {
        try {
            await apiCall('/leaves', 'POST', leave);
        } catch (error) {
            console.error('Error adding leave', error);
        }
    },

    update: async (id: string, updatedItem: Partial<LeaveApplication>): Promise<void> => {
        try {
            await apiCall(`/leaves/${id}`, 'PUT', updatedItem);
        } catch (error) {
            console.error('Error updating leave', error);
        }
    }
};

export const apiCallLogService = createApiService<CallLog>('/call-logs');

export const apiAlertService = {
    getAll: async (): Promise<MentorAlert[]> => {
        try {
            return await apiCall<MentorAlert[]>('/alerts', 'GET');
        } catch (error) {
            console.error('Error fetching alerts', error);
            return [];
        }
    },

    addBatch: async (newAlerts: MentorAlert[]): Promise<void> => {
        try {
            for (const alert of newAlerts) {
                await apiCall('/alerts', 'POST', alert);
            }
        } catch (error) {
            console.error('Error adding alerts', error);
        }
    },

    update: async (id: string, updatedItem: Partial<MentorAlert>): Promise<void> => {
        try {
            await apiCall(`/alerts/${id}`, 'PUT', updatedItem);
        } catch (error) {
            console.error(`Error updating alert ${id}`, error);
        }
    }
};

// Legacy exports for compatibility
export const studentService = apiStudentService;
export const facultyService = apiFacultyService;
export const hodService = apiHodService;
export const mentorService = apiMentorService;
export const attendanceService = apiAttendanceService;
export const timetableService = apiTimetableService;
export const leaveService = apiLeaveService;
export const alertService = apiAlertService;
export const callLogService = apiCallLogService;
