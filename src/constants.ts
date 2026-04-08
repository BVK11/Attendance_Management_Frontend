import { UserRole } from './types';

export const LOCAL_STORAGE_KEYS = {
    STUDENTS: 'app_students',
    FACULTY: 'app_faculty',
    HODS: 'app_hods',
    MENTORS: 'app_mentors',
    ATTENDANCE: 'app_attendance',
    ALERTS: 'app_alerts',
    TIMETABLE: 'app_timetable',
    LEAVES: 'app_leaves',
    CALL_LOGS: 'app_call_logs',
};

export const ROLE_THEMES: Record<UserRole, { bg: string; text: string; border: string, accent: string }> = {
    [UserRole.Faculty]: {
        bg: 'bg-[#4F46E5]',
        text: 'text-[#4F46E5]',
        border: 'border-[#4F46E5]',
        accent: 'bg-indigo-50 text-indigo-700'
    },
    [UserRole.Mentor]: {
        bg: 'bg-[#059669]',
        text: 'text-[#059669]',
        border: 'border-[#059669]',
        accent: 'bg-emerald-50 text-emerald-700'
    },
    [UserRole.Hod]: {
        bg: 'bg-[#E11D48]',
        text: 'text-[#E11D48]',
        border: 'border-[#E11D48]',
        accent: 'bg-rose-50 text-rose-700'
    },
    [UserRole.Student]: {
        bg: 'bg-[#4F46E5]',
        text: 'text-[#4F46E5]',
        border: 'border-[#4F46E5]',
        accent: 'bg-indigo-50 text-indigo-700'
    },
};
